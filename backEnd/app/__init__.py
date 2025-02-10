from flask import Flask
from .extensions import db, cors
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app, supports_credentials=True, origins="http://127.0.0.1:5500")
    
    # Register blueprints
    from .routes.auth import auth
    from .routes.quiz import quiz
    app.register_blueprint(auth)
    app.register_blueprint(quiz)

    # Create database tables and add admin user (only once)
    with app.app_context():
        db.create_all()
        from .models.user import User
        isAdminExists = User.query.filter_by(email='safee.srio@gmail.com').first()
        if isAdminExists is None:
            admin = User(email='safee.srio@gmail.com', isAdmin=True, name='Safee')
            admin.set_password('safee51$')
            db.session.add(admin)
            db.session.commit()

    return app
