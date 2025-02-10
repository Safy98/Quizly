from ..extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from .quiz import Quiz


user_quiz = db.Table('user_quiz',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('quiz_id', db.Integer, db.ForeignKey('quiz.id'), primary_key=True),
    db.Column('score', db.Integer, nullable=False)
)

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(25), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    isAdmin = db.Column(db.Boolean, default=False, nullable=False)
    solved_quizzes = db.relationship('Quiz', secondary=user_quiz, backref=db.backref('users', lazy='dynamic'))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'isAdmin': self.isAdmin,
            'solved_quizzes': [{'id': quiz.id, 'score': score} 
                               for quiz, score in db.session.query(Quiz, user_quiz.c.score)
                               .filter(user_quiz.c.user_id == self.id, 
                                     user_quiz.c.quiz_id == Quiz.id).all()]
        }
