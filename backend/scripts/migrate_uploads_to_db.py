"""One-off: move files from backend/uploads/ into the media table.

Rewrites every stored image URL (http://localhost:5001/uploads/<file> or
/uploads/<file>) to /api/media/<id>. Safe to re-run: URLs already pointing
at /api/media are left alone.

    cd backend && venv/bin/python scripts/migrate_uploads_to_db.py
"""
import json
import os
import re
import secrets
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402
from models import db, About, Skill, Certification, Project, Media  # noqa: E402
from routes import detect_image_type, UNSAFE_SVG  # noqa: E402

UPLOADS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
LEGACY_URL = re.compile(r'^(?:https?://[^/]+)?/uploads/(?P<name>[^?#]+)$')

app = create_app()
migrated = {}


def to_media(url):
    if not url:
        return url
    match = LEGACY_URL.match(url)
    if not match:
        return url
    name = match.group('name')
    if name in migrated:
        return migrated[name]
    path = os.path.join(UPLOADS, name)
    if not os.path.isfile(path):
        print(f'  ! missing file, leaving URL as is: {name}')
        return url
    with open(path, 'rb') as f:
        data = f.read()
    content_type = detect_image_type(data)
    if not content_type or (content_type == 'image/svg+xml' and UNSAFE_SVG.search(data)):
        print(f'  ! not a safe image, skipped: {name}')
        return url
    media = Media(id=secrets.token_hex(16), filename=name, content_type=content_type, size=len(data), data=data)
    db.session.add(media)
    migrated[name] = f'/api/media/{media.id}'
    print(f'  + {name} ({content_type}, {len(data)} bytes)')
    return migrated[name]


with app.app_context():
    for about in About.query.all():
        about.profile_image = to_media(about.profile_image)
    for skill in Skill.query.all():
        skill.icon = to_media(skill.icon)
    for cert in Certification.query.all():
        cert.badge_image = to_media(cert.badge_image)
        cert.cert_image = to_media(cert.cert_image)
    for project in Project.query.all():
        project.image = to_media(project.image)
        if project.images:
            project.images = json.dumps([to_media(u) for u in json.loads(project.images)])
    db.session.commit()
    print(f'Done: {len(migrated)} image(s) moved into the database.')
