from datetime import datetime, timezone
from ..extensions import db

class Quiz(db.Model):
    """
    Represents a quiz consisting of multiple questions.

    Attributes:
        id (int): Unique identifier for the quiz.
        topic (str): The topic of the quiz.
        level (str): The difficulty level of the quiz.
        description (str): A brief description of the quiz.
        created_at (datetime): The date and time when the quiz was created.
        questions (list[Question]): The questions associated with the quiz.
    """
    __tablename__ = 'quiz'
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).date(), nullable=False)
    questions = db.relationship('Question', backref='quiz', cascade='all, delete-orphan')

    def __repr__(self):
        """
        Return a string representation of the Quiz object.

        This representation should be as concise as possible but still be informative.
        It should include the id, topic, level and number of questions in the quiz.
        """
        return f"<Quiz(id={self.id}, topic='{self.topic}', level='{self.level}', questions={len(self.questions)})>"

    def to_dict(self):
        """
        Return a dictionary representation of the Quiz object.

        This dictionary includes all the fields of the Quiz object, as well as a list of
        dictionaries representing the questions and their associated answers.

        The dictionary returned by this method should be used to send the quiz data to the client.

        Returns:
            dict: A dictionary containing the fields of the Quiz object and a list of dictionaries
            representing the questions and their associated answers.
        """
        return {
            'id': self.id,
            'topic': self.topic,
            'level': self.level,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'questions': [{
                'questionText': q.question_text,
                'questionType': q.question_type,
                'answers': [{
                    'answerText': a.answerText,
                    'isCorrect': a.isCorrect
                } for a in q.answers]
            } for q in self.questions]
        }

    def to_dict_headers_only(self):
        """
        Return a dictionary containing only the header fields of the Quiz object.

        This dictionary is used to send the quiz data to the client when the user requests a list of quizzes.
        The dictionary should include the id, topic, level, description and the number of questions in the quiz.

        Returns:
            dict: A dictionary containing the header fields of the Quiz object.
        """
        return {
            'id': self.id,
            'topic': self.topic,
            'level': self.level,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'NumberOfQuestions': len(self.questions)
        }
