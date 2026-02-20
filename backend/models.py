from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class SocialLink(db.Model):
    __tablename__ = 'social_links'
    id = db.Column(db.Integer, primary_key=True)
    platform = db.Column(db.String(50), nullable=False)  # github, linkedin, tiktok
    url = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(100))
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class About(db.Model):
    __tablename__ = 'about'
    id = db.Column(db.Integer, primary_key=True)
    overview = db.Column(db.Text, nullable=False)
    profile_image = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Skill(db.Model):
    __tablename__ = 'skills'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))  # frontend, backend, cloud, etc.
    icon = db.Column(db.String(255))  # path to SVG icon
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Service(db.Model):
    __tablename__ = 'services'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(100))
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Certification(db.Model):
    __tablename__ = 'certifications'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    issuer = db.Column(db.String(200))
    badge_image = db.Column(db.String(255))
    cert_image = db.Column(db.String(255))
    issued_date = db.Column(db.Date)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WorkExperience(db.Model):
    __tablename__ = 'work_experience'
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)  # NULL = current
    summary = db.Column(db.Text)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    skills_acquired = db.relationship('ExperienceSkill', backref='experience', cascade='all, delete-orphan', lazy=True)

class ExperienceSkill(db.Model):
    __tablename__ = 'experience_skills'
    id = db.Column(db.Integer, primary_key=True)
    experience_id = db.Column(db.Integer, db.ForeignKey('work_experience.id'), nullable=False)
    skill_name = db.Column(db.String(100), nullable=False)
    explanation = db.Column(db.Text, nullable=False)  # What was done to acquire this skill
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image = db.Column(db.String(255))
    live_url = db.Column(db.String(255))
    github_url = db.Column(db.String(255))
    technologies = db.Column(db.Text)  # JSON string or comma-separated
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class KPI(db.Model):
    __tablename__ = 'kpis'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False)  # Planned, In Progress, Completed
    target_date = db.Column(db.Date)
    visibility = db.Column(db.String(50), default='Public')  # Public, Coming Soon
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Contact(db.Model):
    __tablename__ = 'contact'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255))
    phone = db.Column(db.String(50))
    linkedin = db.Column(db.String(255))
    github = db.Column(db.String(255))
    location = db.Column(db.String(255))
    cv_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
