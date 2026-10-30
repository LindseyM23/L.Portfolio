from flask import Blueprint, jsonify, request, current_app, Response
from werkzeug.utils import secure_filename
from models import db, Media, SocialLink, About, Skill, Service, Certification, WorkExperience, ExperienceSkill, Project, KPI, Contact
from datetime import datetime
from collections import defaultdict, deque
import hmac
import jwt
import json
import os
import re
import secrets
import time

api_bp = Blueprint('api', __name__)

def require_fields(data, fields, partial=False):
    """Return a 400 response if any required field is missing or blank.

    `fields` maps JSON keys to human-readable labels. With partial=True (updates)
    only fields present in the payload are checked.
    """
    data = data or {}
    missing = [label for key, label in fields.items()
               if (not partial or key in data) and not str(data.get(key) or '').strip()]
    if missing:
        return jsonify({'error': f"Missing required field{'s' if len(missing) > 1 else ''}: {', '.join(missing)}"}), 400
    return None

@api_bp.errorhandler(ValueError)
def handle_value_error(error):
    # e.g. malformed dates passed to datetime.fromisoformat
    return jsonify({'error': f'Invalid value: {error}'}), 400

# ---------- Uploads ----------

# Signature checks: the file's real content must match an allowed image type,
# whatever its extension or the browser-reported MIME type claims.
def detect_image_type(data):
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'image/png'
    if data.startswith(b'\xff\xd8\xff'):
        return 'image/jpeg'
    if data[:6] in (b'GIF87a', b'GIF89a'):
        return 'image/gif'
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return 'image/webp'
    head = data[:1024].lstrip().lower()
    if head.startswith(b'<?xml') or head.startswith(b'<svg') or head.startswith(b'<!--'):
        return 'image/svg+xml' if b'<svg' in data[:4096].lower() else None
    return None

# SVGs are XML and can carry scripts; reject anything active instead of trying to clean it
UNSAFE_SVG = re.compile(
    rb'<\s*(script|foreignobject|iframe|embed|object)\b|\bon[a-z]+\s*=|javascript:|data:text/html|<!entity',
    re.IGNORECASE)

def generate_token():
    lifetime = current_app.config['TOKEN_LIFETIME_HOURS'] * 3600
    return jwt.encode({'admin': True, 'exp': int(time.time()) + lifetime}, current_app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload.get('admin') is True
    except jwt.PyJWTError:
        return False

def admin_required(f):
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
        token = token.split(' ')[1]
        if not verify_token(token):
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator

# Failed login attempts per client IP (in memory; resets when the server restarts)
LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_MAX_FAILURES = 5
_failed_logins = defaultdict(deque)

@api_bp.route('/auth/login', methods=['POST'])
def login():
    ip = request.remote_addr or 'unknown'
    attempts = _failed_logins[ip]
    now = time.time()
    while attempts and now - attempts[0] > LOGIN_WINDOW_SECONDS:
        attempts.popleft()
    if len(attempts) >= LOGIN_MAX_FAILURES:
        retry_in = int(LOGIN_WINDOW_SECONDS - (now - attempts[0])) // 60 + 1
        return jsonify({'error': f'Too many failed attempts. Try again in {retry_in} minutes.'}), 429

    data = request.get_json(silent=True) or {}
    password = str(data.get('password') or '')
    expected = current_app.config['ADMIN_PASSWORD'] or ''
    if expected and hmac.compare_digest(password.encode(), expected.encode()):
        attempts.clear()
        return jsonify({'token': generate_token(), 'message': 'Login successful'}), 200
    attempts.append(now)
    return jsonify({'error': 'Invalid password'}), 401

@api_bp.route('/upload', methods=['POST'])
@admin_required
def upload_file():
    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({'error': 'No file selected'}), 400
    data = file.read()
    if not data:
        return jsonify({'error': 'The file is empty'}), 400
    if len(data) > current_app.config['MAX_UPLOAD_BYTES']:
        limit_mb = current_app.config['MAX_UPLOAD_BYTES'] // (1024 * 1024)
        return jsonify({'error': f'Images must be {limit_mb} MB or smaller'}), 400
    content_type = detect_image_type(data)
    if not content_type:
        return jsonify({'error': 'Only PNG, JPG, GIF, WebP or SVG images are allowed'}), 400
    if content_type == 'image/svg+xml' and UNSAFE_SVG.search(data):
        return jsonify({'error': 'This SVG contains scripts or embedded content and was rejected'}), 400

    media = Media(id=secrets.token_hex(16), filename=secure_filename(file.filename) or 'upload',
                  content_type=content_type, size=len(data), data=data)
    db.session.add(media)
    db.session.commit()
    return jsonify({'url': f'/api/media/{media.id}'}), 201

@api_bp.route('/media/<media_id>', methods=['GET'])
def get_media(media_id):
    if not re.fullmatch(r'[0-9a-f]{32}', media_id):
        return jsonify({'error': 'Not found'}), 404
    media = Media.query.get_or_404(media_id)
    response = Response(media.data, mimetype=media.content_type)
    # Content never changes for a given id, so it can be cached forever
    response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
    response.headers['Content-Disposition'] = f'inline; filename="{media.filename}"'
    # Even if opened directly, an image can't run scripts or load anything
    response.headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"
    response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
    return response

@api_bp.route('/social-links', methods=['GET'])
def get_social_links():
    links = SocialLink.query.order_by(SocialLink.order).all()
    return jsonify([{'id': l.id, 'platform': l.platform, 'url': l.url, 'icon': l.icon, 'order': l.order} for l in links]), 200

@api_bp.route('/social-links', methods=['POST'])
@admin_required
def create_social_link():
    data = request.get_json()
    error = require_fields(data, {'platform': 'Platform', 'url': 'URL'})
    if error:
        return error
    link = SocialLink(platform=data['platform'], url=data['url'], icon=data.get('icon'), order=data.get('order', 0))
    db.session.add(link)
    db.session.commit()
    return jsonify({'id': link.id}), 201

@api_bp.route('/social-links/<int:id>', methods=['PUT'])
@admin_required
def update_social_link(id):
    link = SocialLink.query.get_or_404(id)
    data = request.get_json()
    error = require_fields(data, {'platform': 'Platform', 'url': 'URL'}, partial=True)
    if error:
        return error
    for key in ['platform', 'url', 'icon', 'order']:
        if key in data:
            setattr(link, key, data[key])
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@api_bp.route('/social-links/<int:id>', methods=['DELETE'])
@admin_required
def delete_social_link(id):
    db.session.delete(SocialLink.query.get_or_404(id))
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@api_bp.route('/about', methods=['GET'])
def get_about():
    about = About.query.first()
    return jsonify({'id': about.id if about else None, 'overview': about.overview if about else '', 'profile_image': about.profile_image if about else None}), 200

@api_bp.route('/about', methods=['POST', 'PUT'])
@admin_required
def upsert_about():
    data = request.get_json()
    error = require_fields(data, {'overview': 'Overview'}, partial=True)
    if error:
        return error
    about = About.query.first()
    if about:
        about.overview = data.get('overview', about.overview)
        about.profile_image = data.get('profile_image', about.profile_image)
    else:
        about = About(overview=data['overview'], profile_image=data.get('profile_image'))
        db.session.add(about)
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@api_bp.route('/skills', methods=['GET'])
def get_skills():
    skills = Skill.query.order_by(Skill.order).all()
    return jsonify([{'id': s.id, 'name': s.name, 'category': s.category, 'icon': s.icon, 'order': s.order} for s in skills]), 200

@api_bp.route('/skills', methods=['POST'])
@admin_required
def create_skill():
    data = request.get_json()
    error = require_fields(data, {'name': 'Skill name'})
    if error:
        return error
    skill = Skill(
        name=data['name'], 
        category=data.get('category'), 
        icon=data.get('icon'),
        order=data.get('order', 0)
    )
    db.session.add(skill)
    db.session.commit()
    return jsonify({'id': skill.id}), 201

@api_bp.route('/skills/<int:id>', methods=['PUT'])
@admin_required
def update_skill(id):
    skill = Skill.query.get_or_404(id)
    data = request.get_json()
    error = require_fields(data, {'name': 'Skill name'}, partial=True)
    if error:
        return error
    for key in ['name', 'category', 'icon', 'order']:
        if key in data:
            setattr(skill, key, data[key])
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@api_bp.route('/skills/<int:id>', methods=['DELETE'])
@admin_required
def delete_skill(id):
    db.session.delete(Skill.query.get_or_404(id))
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@api_bp.route('/services', methods=['GET'])
def get_services():
    services = Service.query.order_by(Service.order).all()
    return jsonify([{'id': s.id, 'title': s.title, 'description': s.description, 'icon': s.icon, 'order': s.order} for s in services]), 200

@api_bp.route('/services', methods=['POST'])
@admin_required
def create_service():
    data = request.get_json()
    error = require_fields(data, {'title': 'Title', 'description': 'Description'})
    if error:
        return error
    service = Service(title=data['title'], description=data['description'], icon=data.get('icon'), order=data.get('order', 0))
    db.session.add(service)
    db.session.commit()
    return jsonify({'id': service.id}), 201

@api_bp.route('/services/<int:id>', methods=['PUT'])
@admin_required
def update_service(id):
    service = Service.query.get_or_404(id)
    data = request.get_json()
    error = require_fields(data, {'title': 'Title', 'description': 'Description'}, partial=True)
    if error:
        return error
    for key in ['title', 'description', 'icon', 'order']:
        if key in data:
            setattr(service, key, data[key])
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@api_bp.route('/services/<int:id>', methods=['DELETE'])
@admin_required
def delete_service(id):
    db.session.delete(Service.query.get_or_404(id))
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@api_bp.route('/certifications', methods=['GET'])
def get_certifications():
    certs = Certification.query.order_by(Certification.order).all()
    return jsonify([{'id': c.id, 'name': c.name, 'issuer': c.issuer, 'badge_image': c.badge_image, 'cert_image': c.cert_image, 'issued_date': c.issued_date.isoformat() if c.issued_date else None, 'order': c.order} for c in certs]), 200

@api_bp.route('/certifications', methods=['POST'])
@admin_required
def create_certification():
    data = request.get_json()
    error = require_fields(data, {'name': 'Name'})
    if error:
        return error
    cert = Certification(name=data['name'], issuer=data.get('issuer'), badge_image=data.get('badge_image'), cert_image=data.get('cert_image'), issued_date=datetime.fromisoformat(data['issued_date']) if data.get('issued_date') else None, order=data.get('order', 0))
    db.session.add(cert)
    db.session.commit()
    return jsonify({'id': cert.id}), 201

@api_bp.route('/certifications/<int:id>', methods=['PUT'])
@admin_required
def update_certification(id):
    cert = Certification.query.get_or_404(id)
    data = request.get_json()
    error = require_fields(data, {'name': 'Name'}, partial=True)
    if error:
        return error
    for key in ['name', 'issuer', 'badge_image', 'cert_image', 'order']:
        if key in data:
            setattr(cert, key, data[key])
    if data.get('issued_date'):
        cert.issued_date = datetime.fromisoformat(data['issued_date'])
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@api_bp.route('/certifications/<int:id>', methods=['DELETE'])
@admin_required
def delete_certification(id):
    db.session.delete(Certification.query.get_or_404(id))
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@api_bp.route('/experience', methods=['GET'])
def get_experience():
    exps = WorkExperience.query.order_by(WorkExperience.order).all()
    return jsonify([{'id': e.id, 'company': e.company, 'role': e.role, 'start_date': e.start_date.isoformat(), 'end_date': e.end_date.isoformat() if e.end_date else None, 'summary': e.summary, 'order': e.order, 'skills_acquired': [{'id': s.id, 'skill_name': s.skill_name, 'explanation': s.explanation, 'order': s.order} for s in e.skills_acquired]} for e in exps]), 200

@api_bp.route('/experience/<int:id>', methods=['GET'])
def get_experience_detail(id):
    exp = WorkExperience.query.get_or_404(id)
    return jsonify({'id': exp.id, 'company': exp.company, 'role': exp.role, 'start_date': exp.start_date.isoformat(), 'end_date': exp.end_date.isoformat() if exp.end_date else None, 'summary': exp.summary, 'skills_acquired': [{'id': s.id, 'skill_name': s.skill_name, 'explanation': s.explanation, 'order': s.order} for s in sorted(exp.skills_acquired, key=lambda x: x.order)]}), 200

@api_bp.route('/experience', methods=['POST'])
@admin_required
def create_experience():
    data = request.get_json()
    error = require_fields(data, {'role': 'Role', 'company': 'Company', 'start_date': 'Start date'})
    if error:
        return error
    exp = WorkExperience(company=data['company'], role=data['role'], start_date=datetime.fromisoformat(data['start_date']), end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None, summary=data.get('summary'), order=data.get('order', 0))
    db.session.add(exp)
    db.session.commit()
    return jsonify({'id': exp.id}), 201

@api_bp.route('/experience/<int:id>', methods=['PUT'])
@admin_required
def update_experience(id):
    exp = WorkExperience.query.get_or_404(id)
    data = request.get_json()
    error = require_fields(data, {'role': 'Role', 'company': 'Company', 'start_date': 'Start date'}, partial=True)
    if error:
        return error
    for key in ['company', 'role', 'summary', 'order']:
        if key in data:
            setattr(exp, key, data[key])
    if data.get('start_date'):
        exp.start_date = datetime.fromisoformat(data['start_date'])
    if 'end_date' in data:
        exp.end_date = datetime.fromisoformat(data['end_date']) if data['end_date'] else None
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@api_bp.route('/experience/<int:id>', methods=['DELETE'])
@admin_required
def delete_experience(id):
    db.session.delete(WorkExperience.query.get_or_404(id))
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@api_bp.route('/experience/<int:exp_id>/skills', methods=['POST'])
@admin_required
def add_experience_skill(exp_id):
    WorkExperience.query.get_or_404(exp_id)
    data = request.get_json()
    error = require_fields(data, {'skill_name': 'Skill', 'explanation': 'Explanation'})
    if error:
        return error
    skill = ExperienceSkill(experience_id=exp_id, skill_name=data['skill_name'], explanation=data['explanation'], order=data.get('order', 0))
    db.session.add(skill)
    db.session.commit()
    return jsonify({'id': skill.id}), 201

@api_bp.route('/experience-skills/<int:id>', methods=['PUT'])
@admin_required
def update_experience_skill(id):
    skill = ExperienceSkill.query.get_or_404(id)
    data = request.get_json()
    error = require_fields(data, {'skill_name': 'Skill', 'explanation': 'Explanation'}, partial=True)
    if error:
        return error
    for key in ['skill_name', 'explanation', 'order']:
        if key in data:
            setattr(skill, key, data[key])
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@api_bp.route('/experience-skills/<int:id>', methods=['DELETE'])
@admin_required
def delete_experience_skill(id):
    db.session.delete(ExperienceSkill.query.get_or_404(id))
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

def project_images(p):
    images = json.loads(p.images) if p.images else []
    # Fall back to the legacy single image
    return images or ([p.image] if p.image else [])

def project_to_dict(p):
    images = project_images(p)
    return {'id': p.id, 'name': p.name, 'description': p.description, 'image': images[0] if images else None, 'images': images, 'live_url': p.live_url, 'github_url': p.github_url, 'technologies': p.technologies, 'order': p.order}

@api_bp.route('/projects', methods=['GET'])
def get_projects():
    projects = Project.query.order_by(Project.order).all()
    return jsonify([project_to_dict(p) for p in projects]), 200

@api_bp.route('/projects/<int:id>', methods=['GET'])
def get_project(id):
    return jsonify(project_to_dict(Project.query.get_or_404(id))), 200

@api_bp.route('/projects', methods=['POST'])
@admin_required
def create_project():
    data = request.get_json()
    error = require_fields(data, {'name': 'Name', 'description': 'Description'})
    if error:
        return error
    project = Project(name=data['name'], description=data['description'], image=data.get('image'), images=json.dumps(data.get('images') or []), live_url=data.get('live_url'), github_url=data.get('github_url'), technologies=data.get('technologies'), order=data.get('order', 0))
    db.session.add(project)
    db.session.commit()
    return jsonify({'id': project.id}), 201

@api_bp.route('/projects/<int:id>', methods=['PUT'])
@admin_required
def update_project(id):
    project = Project.query.get_or_404(id)
    data = request.get_json()
    error = require_fields(data, {'name': 'Name', 'description': 'Description'}, partial=True)
    if error:
        return error
    for key in ['name', 'description', 'image', 'live_url', 'github_url', 'technologies', 'order']:
        if key in data:
            setattr(project, key, data[key])
    if 'images' in data:
        project.images = json.dumps(data['images'] or [])
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@api_bp.route('/projects/<int:id>', methods=['DELETE'])
@admin_required
def delete_project(id):
    db.session.delete(Project.query.get_or_404(id))
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@api_bp.route('/kpis', methods=['GET'])
def get_kpis():
    kpis = KPI.query.filter_by(visibility='Public').order_by(KPI.order).all()
    return jsonify([{'id': k.id, 'title': k.title, 'description': k.description, 'status': k.status, 'target_date': k.target_date.isoformat() if k.target_date else None, 'visibility': k.visibility, 'order': k.order} for k in kpis]), 200

@api_bp.route('/kpis/all', methods=['GET'])
@admin_required
def get_all_kpis():
    kpis = KPI.query.order_by(KPI.order).all()
    return jsonify([{'id': k.id, 'title': k.title, 'description': k.description, 'status': k.status, 'target_date': k.target_date.isoformat() if k.target_date else None, 'visibility': k.visibility, 'order': k.order} for k in kpis]), 200

@api_bp.route('/kpis', methods=['POST'])
@admin_required
def create_kpi():
    data = request.get_json()
    error = require_fields(data, {'title': 'Title', 'description': 'Description', 'status': 'Status'})
    if error:
        return error
    kpi = KPI(title=data['title'], description=data['description'], status=data['status'], target_date=datetime.fromisoformat(data['target_date']) if data.get('target_date') else None, visibility=data.get('visibility', 'Public'), order=data.get('order', 0))
    db.session.add(kpi)
    db.session.commit()
    return jsonify({'id': kpi.id}), 201

@api_bp.route('/kpis/<int:id>', methods=['PUT'])
@admin_required
def update_kpi(id):
    kpi = KPI.query.get_or_404(id)
    data = request.get_json()
    error = require_fields(data, {'title': 'Title', 'description': 'Description', 'status': 'Status'}, partial=True)
    if error:
        return error
    for key in ['title', 'description', 'status', 'visibility', 'order']:
        if key in data:
            setattr(kpi, key, data[key])
    if 'target_date' in data:
        # An empty value clears the date
        kpi.target_date = datetime.fromisoformat(data['target_date']).date() if data['target_date'] else None
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200

@api_bp.route('/kpis/<int:id>', methods=['DELETE'])
@admin_required
def delete_kpi(id):
    db.session.delete(KPI.query.get_or_404(id))
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

@api_bp.route('/contact', methods=['GET'])
def get_contact():
    contact = Contact.query.first()
    return jsonify({'id': contact.id if contact else None, 'email': contact.email if contact else '', 'phone': contact.phone if contact else '', 'linkedin': contact.linkedin if contact else '', 'github': contact.github if contact else '', 'location': contact.location if contact else '', 'cv_url': contact.cv_url if contact else ''}), 200

@api_bp.route('/contact', methods=['POST', 'PUT'])
@admin_required
def upsert_contact():
    data = request.get_json()
    contact = Contact.query.first()
    if contact:
        for key in ['email', 'phone', 'linkedin', 'github', 'location', 'cv_url']:
            if key in data:
                setattr(contact, key, data[key])
    else:
        contact = Contact(**{k: data.get(k) for k in ['email', 'phone', 'linkedin', 'github', 'location', 'cv_url']})
        db.session.add(contact)
    db.session.commit()
    return jsonify({'message': 'Updated'}), 200
