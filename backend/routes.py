from flask import Blueprint, jsonify, request

api_bp = Blueprint('api', __name__)

@api_bp.route('/hello', methods=['GET'])
def hello():
    """Hello endpoint"""
    return jsonify({
        'message': 'Welcome to Lindsey\'s Portfolio!',
        'status': 'success'
    })

@api_bp.route('/about', methods=['GET'])
def about():
    """About endpoint"""
    return jsonify({
        'name': 'Lindsey',
        'role': 'Full-Stack Developer',
        'technologies': {
            'frontend': ['Angular', 'TypeScript', 'SCSS'],
            'backend': ['Python', 'Flask'],
            'tools': ['Git', 'VS Code']
        },
        'status': 'success'
    })

@api_bp.route('/contact', methods=['POST'])
def contact():
    """Contact form endpoint"""
    data = request.get_json()
    
    # Basic validation
    if not data:
        return jsonify({
            'status': 'error',
            'message': 'No data provided'
        }), 400
    
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')
    
    if not all([name, email, message]):
        return jsonify({
            'status': 'error',
            'message': 'Missing required fields'
        }), 400
    
    # Here you would typically save to database or send email
    # For now, just return success
    return jsonify({
        'status': 'success',
        'message': 'Message received! Thank you for reaching out.',
        'data': {
            'name': name,
            'email': email
        }
    }), 201
