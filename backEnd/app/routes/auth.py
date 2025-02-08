from flask import Blueprint, jsonify, request, session, current_app
from functools import wraps
from marshmallow import Schema, fields, validate, ValidationError
from datetime import timedelta
import logging
from ..models.user import User
from ..extensions import db, limiter

auth = Blueprint('auth', __name__)

# Input validation schemas
class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))

class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    name = fields.Str(required=True, validate=validate.Length(min=2, max=50))

# Decorator for protected routes
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Error handler
@auth.errorhandler(Exception)
def handle_error(error):
    current_app.logger.error(f'Error: {str(error)}')
    return jsonify({'success': False, 'message': 'An unexpected error occurred'}), 500

@auth.route('/register', methods=['POST'])
@limiter.limit("5 per minute")  # Rate limiting
def register():
    try:
        # Validate input
        schema = RegisterSchema()
        data = schema.load(request.get_json())
        
        # Check for existing user
        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'success': False, 
                'message': 'Email already registered.'
            }), 400

        # Create new user
        user = User(
            email=data['email'],
            name=data['name']
        )
        user.set_password(data['password'])
        
        # Save to database
        try:
            db.session.add(user)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f'Database error during registration: {str(e)}')
            return jsonify({
                'success': False,
                'message': 'Registration failed. Please try again.'
            }), 500

        # Set session
        session.permanent = True
        current_app.permanent_session_lifetime = timedelta(days=1)
        session['user'] = {
            'email': user.email,
            'logged_in': True,
            'isAdmin': user.isAdmin
        }

        return jsonify({
            'success': True,
            'message': 'Registration successful!',
            'user': {
                'id': user.id,
                'isAdmin': user.isAdmin,
                'email': user.email,
                'name': user.name
            }
        }), 201

    except ValidationError as err:
        return jsonify({'success': False, 'message': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f'Registration error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Registration failed. Please try again.'
        }), 500

@auth.route('/login', methods=['POST'])
@limiter.limit("10 per minute")  # Rate limiting
def login():
    try:
        # Validate input
        schema = LoginSchema()
        data = schema.load(request.get_json())
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            # Set session
            session.permanent = True
            current_app.permanent_session_lifetime = timedelta(days=1)
            session['user'] = {
                'email': user.email,
                'logged_in': True,
                'isAdmin': user.isAdmin
            }
            
            return jsonify({
                'success': True,
                'user': {
                    'id': user.id,
                    'isAdmin': user.isAdmin,
                    'email': user.email,
                    'name': user.name
                }
            }), 200
        
        return jsonify({
            'success': False,
            'message': 'Invalid email or password.'
        }), 401

    except ValidationError as err:
        return jsonify({'success': False, 'message': err.messages}), 400
    except Exception as e:
        current_app.logger.error(f'Login error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Login failed. Please try again.'
        }), 500

@auth.route('/logout', methods=['POST'])  # Changed to POST for security
@login_required
def logout():
    try:
        session.clear()
        return jsonify({
            'success': True,
            'message': 'Logged out successfully.'
        }), 200
    except Exception as e:
        current_app.logger.error(f'Logout error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Logout failed. Please try again.'
        }), 500

@auth.route('/isLoggedIn', methods=['GET'])
def isLoggedIn():
    try:
        if 'user' in session:
            return jsonify({
                'success': True,
                'user': session['user']
            }), 200
        return jsonify({
            'success': False,
            'message': 'User is not logged in.'
        }), 401
    except Exception as e:
        current_app.logger.error(f'Session check error: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Session check failed.'
        }), 500
