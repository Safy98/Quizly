from flask import Blueprint, jsonify, request, session
from ..models.user import User
from ..extensions import db

auth = Blueprint('auth', __name__)
@auth.route('/logout', methods=['GET'])
def logout():
    session.pop('user', None)
    return jsonify({'success': True, 'message': 'Logged out successfully.'}), 200

@auth.route('/isLoggedIn', methods=['GET'])
def isLoggedIn():
    if 'user' in session:
        user = session['user']
        return jsonify({'success': True, 'user': user}), 200
    else:
        return jsonify({'success': False, 'message': 'User is not logged in.'}), 401

@auth.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    existing_email = User.query.filter_by(email=data['email']).first()
    if existing_email:
        return jsonify({'success': False, 'message': 'Email already registered.'}), 400

    user = User(email=data['email'], name=data['name'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    session['user'] = {'email': user.email, 'logged_in': True, 'isAdmin': user.isAdmin}

    return jsonify({'success': True, 'message': 'Registration successful!', 
    'user': {'id': user.id, 'isAdmin': user.isAdmin, 'email': user.email, 'name': user.name}}), 201

@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.check_password(data['password']):
        session['user'] = {'email': user.email, 'logged_in': True, 'isAdmin': user.isAdmin}
        return jsonify({'success': True, 'user': {'id': user.id, 'isAdmin': user.isAdmin, 'email': user.email, 'name': user.name}}), 200
    
    return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401
