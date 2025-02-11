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
    """
    Decorator that checks if the user is logged in.

    This decorator checks if the 'user' key exists in the session.
    If not, it returns a 401 Unauthorized response with a JSON payload indicating the problem.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if the user is logged in
        if 'user' not in session:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        # If the user is logged in, call the original function
        return f(*args, **kwargs)
    return decorated_function

# Error handler
@auth.errorhandler(Exception)
def handle_error(error):
    """
    Error handler for unexpected errors.

    This function logs the error and returns a 500 Internal Server Error response with a JSON payload indicating the problem.
    """
    current_app.logger.error(f'Error: {str(error)}')
    return jsonify({'success': False, 'message': 'An unexpected error occurred'}), 500

@auth.route('/register', methods=['POST'])
@limiter.limit("5 per minute")  # Rate limiting to prevent abuse
def register():
    """
    Register a new user.

    This route creates a new user with the given email, password, and name.
    It then sets the session for the user.

    Returns:
        A JSON response with a success message and the user's data if registration is successful,
        otherwise an error message.
    """
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
@limiter.limit("10 per minute")  # Rate limiting to prevent brute-force attacks
def login():
    """
    Logs in a user with the given credentials.

    Args:
        email (str): The email address of the user.
        password (str): The password of the user.

    Returns:
        A JSON response with a success message and the user's data if the login is successful,
        otherwise an error message.
    """
    try:
        # Validate input
        schema = LoginSchema()
        data = schema.load(request.get_json())
        
        # Retrieve the user by email
        user = User.query.filter_by(email=data['email']).first()
        
        # Check if the user exists and the password is correct
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
        
        # Return an error message if the login is unsuccessful
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
    """
    Logs out the current user.

    This route is rate-limited to 5 requests per minute and requires the user to be logged in.
    """
    try:
        # Clear the session, which will remove the user's login information
        session.clear()
        return jsonify({
            'success': True,
            'message': 'Logged out successfully.'
        }), 200
    except Exception as e:
        # Log any errors that occur
        current_app.logger.error(f'Logout error: {str(e)}')
        # Return a 500 Internal Server Error response with an error message
        return jsonify({
            'success': False,
            'message': 'Logout failed. Please try again.'
        }), 500

@auth.route('/isLoggedIn', methods=['GET'])
def isLoggedIn():
    """
    Checks if the user is logged in.

    This route can be used to check if the user is logged in. If the user is logged in,
    the user's session information will be returned. Otherwise, a 401 Unauthorized response will be returned.
    """
    try:
        # Check if the 'user' key exists in the session, which indicates that the user is logged in
        if 'user' in session:
            # Return the user's session information
            return jsonify({
                'success': True,
                'user': session['user']
            }), 200
        
        # Return a 401 Unauthorized response if the user is not logged in
        return jsonify({
            'success': False,
            'message': 'User is not logged in.'
        }), 401
    except Exception as e:
        # Log any errors that occur
        current_app.logger.error(f'Session check error: {str(e)}')
        # Return a 500 Internal Server Error response with an error message
        return jsonify({
            'success': False,
            'message': 'Session check failed.'
        }), 500
