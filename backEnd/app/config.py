from datetime import timedelta

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///database.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)
    SESSION_PERMANENT = False
    SECRET_KEY = 'SafeeSrio'  # In production, use a secure secret key
    CORS_ORIGINS = "http://127.0.0.1:5500"
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True
    # CORS_ORIGINS = [
    #     'http://localhost:5500',  # If your frontend runs on port 3000
    #     'http://127.0.0.1:5500',
    # ]
