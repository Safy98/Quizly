from ..extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from .quiz import Quiz


# Table that represents the many-to-many relationship between users and quizzes
# Each entry in this table represents a user completing a quiz and the score they achieved
user_quiz = db.Table('user_quiz',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('quiz_id', db.Integer, db.ForeignKey('quiz.id'), primary_key=True),
    db.Column('score', db.Integer, nullable=False)
)

class User(db.Model):
    """
    Represents a user in the application.

    Attributes:
        id (int): Unique identifier for the user.
        name (str): The name of the user.
        email (str): The email address of the user, which must be unique.
        password_hash (str): The hashed password for the user.
        isAdmin (bool): Indicates if the user has admin privileges.
        solved_quizzes (list[Quiz]): Quizzes that the user has solved, with scores.
    """
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(25), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    isAdmin = db.Column(db.Boolean, default=False, nullable=False)
    solved_quizzes = db.relationship('Quiz', secondary=user_quiz, backref=db.backref('users', lazy='dynamic'))

    def set_password(self, password):
        """
        Set the password hash for the user.

        Args:
            password (str): The password to hash.
        """
           # Use Werkzeug's check_password_hash to compare the password with the stored hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """
        Verify the provided password against the stored password hash.

        Args:
            password (str): The password to verify.

        Returns:
            bool: True if the password matches the stored hash, False otherwise.
        """
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """
        Return a dictionary representing the User object.

        This dictionary contains the user's id, name, email, and admin status.
        It also contains a list of dictionaries, each representing a quiz the user has solved.
        Each of these dictionaries contains the id of the quiz and the score the user achieved on that quiz.
        """
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
