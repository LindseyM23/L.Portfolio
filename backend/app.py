from flask import Flask, jsonify, request, redirect
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.middleware.proxy_fix import ProxyFix
from config import get_config
from models import db
from routes import api_bp

def create_app(config_class=None):
    config_class = config_class or get_config()
    if hasattr(config_class, 'validate'):
        config_class.validate()

    app = Flask(__name__)
    app.config.from_object(config_class)

    # Hosting platforms terminate HTTPS at a proxy; trust its X-Forwarded-* headers
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)

    # Only the portfolio site itself may call the API from a browser
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}},
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

    @app.before_request
    def enforce_https():
        if app.config['FORCE_HTTPS'] and not request.is_secure:
            return redirect(request.url.replace('http://', 'https://', 1), code=301)

    @app.after_request
    def security_headers(response):
        response.headers.setdefault('X-Content-Type-Options', 'nosniff')
        response.headers.setdefault('X-Frame-Options', 'DENY')
        response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
        response.headers.setdefault('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
        if app.config['FORCE_HTTPS']:
            response.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains'
        return response

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({'error': 'That file is too large'}), 413

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')

    # Health check endpoint
    @app.route('/')
    def index():
        return jsonify({
            'status': 'success',
            'message': 'Portfolio API is running',
            'version': '2.1.0'
        })

    # Create tables
    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )
