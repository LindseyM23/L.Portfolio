from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from models import db
from routes import api_bp
import os

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    # Health check endpoint
    @app.route('/')
    def index():
        return jsonify({
            'status': 'success',
            'message': 'Portfolio API is running',
            'version': '2.0.0'
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
