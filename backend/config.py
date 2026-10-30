import os
from dotenv import load_dotenv

load_dotenv()


def _database_url():
    url = os.environ.get('DATABASE_URL') or 'sqlite:///portfolio.db'
    # Hosts hand out "postgres://" or "postgresql://"; name the installed
    # psycopg2 driver explicitly (newer SQLAlchemy defaults to psycopg 3)
    for prefix in ('postgres://', 'postgresql://'):
        if url.startswith(prefix):
            url = 'postgresql+psycopg2://' + url[len(prefix):]
    return url


def _origins(default):
    raw = os.environ.get('CORS_ORIGINS', default)
    return [origin.strip().rstrip('/') for origin in raw.split(',') if origin.strip()]


class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY')
    DEBUG = False
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5001))

    # Database
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Admin
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
    TOKEN_LIFETIME_HOURS = int(os.environ.get('TOKEN_LIFETIME_HOURS', 12))

    # Uploads are stored in the database (see Media model)
    MAX_UPLOAD_BYTES = 5 * 1024 * 1024
    MAX_CONTENT_LENGTH = MAX_UPLOAD_BYTES + 64 * 1024  # request size incl. form overhead

    # Sites allowed to call the API from a browser
    CORS_ORIGINS = _origins('http://localhost:4200')

    # Redirect http -> https and send HSTS
    FORCE_HTTPS = False


class DevelopmentConfig(Config):
    """Local development: auto-reload, relaxed defaults."""
    DEBUG = True
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-only-secret-key'
    # Any local port (ng serve, previews); a regex is accepted by Flask-CORS
    CORS_ORIGINS = _origins(r'http://(localhost|127\.0\.0\.1)(:\d+)?')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD') or 'admin123'


class ProductionConfig(Config):
    """Production: HTTPS only, secrets must come from the environment."""
    DEBUG = False
    FORCE_HTTPS = os.environ.get('FORCE_HTTPS', 'true').lower() != 'false'
    SESSION_COOKIE_SECURE = True
    PREFERRED_URL_SCHEME = 'https'
    CORS_ORIGINS = _origins('')

    @classmethod
    def validate(cls):
        problems = []
        if not cls.SECRET_KEY or len(cls.SECRET_KEY) < 32:
            problems.append('SECRET_KEY must be set to a random string of at least 32 characters')
        if not cls.ADMIN_PASSWORD or len(cls.ADMIN_PASSWORD) < 10:
            problems.append('ADMIN_PASSWORD must be set (at least 10 characters)')
        if not cls.CORS_ORIGINS:
            problems.append('CORS_ORIGINS must list your site, e.g. https://your-site.netlify.app')
        elif any(not origin.startswith('https://') for origin in cls.CORS_ORIGINS):
            problems.append('CORS_ORIGINS must only contain https:// addresses')
        if problems:
            raise RuntimeError('Production configuration is not safe:\n- ' + '\n- '.join(problems))


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config():
    """APP_ENV=production selects the production config; anything else is development."""
    return config.get(os.environ.get('APP_ENV', 'development'), DevelopmentConfig)
