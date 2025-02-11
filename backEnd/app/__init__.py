from flask import Flask
from .extensions import db, cors
from .config import Config

def create_app():
    """
    Create a Flask application.

    This function initializes a Flask application, configures it using the
    Config object, initializes the extensions, registers the blueprints, and
    creates the database tables and the admin user (only once).

    Returns:
        A Flask application.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    # The CORS extension is used to add CORS headers to the responses
    # This is necessary because the frontend is running on a different port than
    # the backend, and the browser enforces same-origin policy by default
    cors.init_app(app, supports_credentials=True, origins="http://127.0.0.1:5500")
    
    # Register blueprints
    # The auth blueprint contains the routes for authentication
    from .routes.auth import auth
    # The quiz blueprint contains the routes for quiz-related operations
    from .routes.quiz import quiz
    app.register_blueprint(auth)
    app.register_blueprint(quiz)

    # Create database tables and add admin user (only once)
    # This is necessary because the database is created only once
    with app.app_context():
        db.create_all()
        from .models.user import User
        # Check if the admin user already exists
        isAdminExists = User.query.filter_by(email='safee.srio@gmail.com').first()
        if isAdminExists is None:
            # Create the admin user
            admin = User(email='safee.srio@gmail.com', isAdmin=True, name='Safee')
            admin.set_password('safee51$')
            db.session.add(admin)
            db.session.commit()

    return app
