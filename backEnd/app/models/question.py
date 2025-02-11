from ..extensions import db

class Question(db.Model):
    """
    Represents a single question in a quiz.

    Attributes:
        id (int): Unique identifier for the question.
        question_text (str): The text of the question.
        question_type (str): The type of the question (e.g. multiple choice, true/false, paragraph).
        quiz_id (int): The id of the quiz that this question is part of.
        answers (list[Answer]): The answers to the question.
    """
    __tablename__ = 'question'
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.String(500), nullable=False)
    question_type = db.Column(db.String(50), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    answers = db.relationship('Answer', backref='question', cascade='all, delete-orphan')

    def __repr__(self):
        """
        Return a string representation of the Question object.

        This representation includes the id, text, type and quiz_id of the question.
        """
        return f'<Question(id={self.id}, text="{self.question_text}", type="{self.question_type}", quiz_id={self.quiz_id})>'

