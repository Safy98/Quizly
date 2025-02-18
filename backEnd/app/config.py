from datetime import timedelta

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///database.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)
    SESSION_PERMANENT = False
    SECRET_KEY = 'SafeeSrio'  # In production, use a secure secret key
    CORS_ORIGINS = "http://127.0.0.1:5500"
    SESSION_COOKIE_SAMESITE = "None"
    CORS_HEADERS = 'Content-Type'
    SESSION_COOKIE_SECURE = True
