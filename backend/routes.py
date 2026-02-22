from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
from models import db, SocialLink, About, Skill, Service, Certification, WorkExperience, ExperienceSkill, Project, KPI, Contact
from datetime import datetime
import jwt
import os

api_bp = Blueprint('api', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def generate_token():
    return jwt.encode({'admin': True, 'exp': datetime.utcnow().timestamp() + 86400}, current_app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload.get('admin') == True
    except:
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

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if data.get('password') == current_app.config['ADMIN_PASSWORD']:
        return jsonify({'token': generate_token(), 'message': 'Login successful'}), 200
    return jsonify({'error': 'Invalid password'}), 401

@api_bp.route('/upload', methods=['POST'])
@admin_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{int(datetime.utcnow().timestamp())}{ext}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({'url': f"/uploads/{filename}"}), 200
    return jsonify({'error': 'File type not allowed'}), 400

@api_bp.route('/social-links', methods=['GET'])
def get_social_links():
    links = SocialLink.query.order_by(SocialLink.order).all()
    return jsonify([{'id': l.id, 'platform': l.platform, 'url': l.url, 'icon': l.icon, 'order': l.order} for l in links]), 200

@api_bp.route('/social-links', methods=['POST'])
@admin_required
def create_social_link():
    data = request.get_json()
    link = SocialLink(platform=data['platform'], url=data['url'], icon=data.get('icon'), order=data.get('order', 0))
    db.session.add(link)
    db.session.commit()
    return jsonify({'id': link.id}), 201

@api_bp.route('/social-links/<int:id>', methods=['PUT'])
@admin_required
def update_social_link(id):
    link = SocialLink.query.get_or_404(id)
    data = request.get_json()
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
    service = Service(title=data['title'], description=data['description'], icon=data.get('icon'), order=data.get('order', 0))
    db.session.add(service)
    db.session.commit()
    return jsonify({'id': service.id}), 201

@api_bp.route('/services/<int:id>', methods=['PUT'])
@admin_required
def update_service(id):
    service = Service.query.get_or_404(id)
    data = request.get_json()
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
    cert = Certification(name=data['name'], issuer=data.get('issuer'), badge_image=data.get('badge_image'), cert_image=data.get('cert_image'), issued_date=datetime.fromisoformat(data['issued_date']) if data.get('issued_date') else None, order=data.get('order', 0))
    db.session.add(cert)
    db.session.commit()
    return jsonify({'id': cert.id}), 201

@api_bp.route('/certifications/<int:id>', methods=['PUT'])
@admin_required
def update_certification(id):
    cert = Certification.query.get_or_404(id)
    data = request.get_json()
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
    exp = WorkExperience(company=data['company'], role=data['role'], start_date=datetime.fromisoformat(data['start_date']), end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None, summary=data.get('summary'), order=data.get('order', 0))
    db.session.add(exp)
    db.session.commit()
    return jsonify({'id': exp.id}), 201

@api_bp.route('/experience/<int:id>', methods=['PUT'])
@admin_required
def update_experience(id):
    exp = WorkExperience.query.get_or_404(id)
    data = request.get_json()
    for key in ['company', 'role', 'summary', 'order']:
        if key in data:
            setattr(exp, key, data[key])
    if data.get('start_date'):
        exp.start_date = datetime.fromisoformat(data['start_date'])
    if data.get('end_date'):
        exp.end_date = datetime.fromisoformat(data['end_date'])
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
    skill = ExperienceSkill(experience_id=exp_id, skill_name=data['skill_name'], explanation=data['explanation'], order=data.get('order', 0))
    db.session.add(skill)
    db.session.commit()
    return jsonify({'id': skill.id}), 201

@api_bp.route('/experience-skills/<int:id>', methods=['PUT'])
@admin_required
def update_experience_skill(id):
    skill = ExperienceSkill.query.get_or_404(id)
    data = request.get_json()
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

@api_bp.route('/projects', methods=['GET'])
def get_projects():
    projects = Project.query.order_by(Project.order).all()
    return jsonify([{'id': p.id, 'name': p.name, 'description': p.description, 'image': p.image, 'live_url': p.live_url, 'github_url': p.github_url, 'technologies': p.technologies, 'order': p.order} for p in projects]), 200

@api_bp.route('/projects', methods=['POST'])
@admin_required
def create_project():
    data = request.get_json()
    project = Project(name=data['name'], description=data['description'], image=data.get('image'), live_url=data.get('live_url'), github_url=data.get('github_url'), technologies=data.get('technologies'), order=data.get('order', 0))
    db.session.add(project)
    db.session.commit()
    return jsonify({'id': project.id}), 201

@api_bp.route('/projects/<int:id>', methods=['PUT'])
@admin_required
def update_project(id):
    project = Project.query.get_or_404(id)
    data = request.get_json()
    for key in ['name', 'description', 'image', 'live_url', 'github_url', 'technologies', 'order']:
        if key in data:
            setattr(project, key, data[key])
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
    kpi = KPI(title=data['title'], description=data['description'], status=data['status'], target_date=datetime.fromisoformat(data['target_date']) if data.get('target_date') else None, visibility=data.get('visibility', 'Public'), order=data.get('order', 0))
    db.session.add(kpi)
    db.session.commit()
    return jsonify({'id': kpi.id}), 201

@api_bp.route('/kpis/<int:id>', methods=['PUT'])
@admin_required
def update_kpi(id):
    kpi = KPI.query.get_or_404(id)
    data = request.get_json()
    for key in ['title', 'description', 'status', 'visibility', 'order']:
        if key in data:
            setattr(kpi, key, data[key])
    if data.get('target_date'):
        kpi.target_date = datetime.fromisoformat(data['target_date'])
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
