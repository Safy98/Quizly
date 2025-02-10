from datetime import datetime, timezone
from ..extensions import db

class Quiz(db.Model):
    __tablename__ = 'quiz'
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).date(), nullable=False)
    questions = db.relationship('Question', backref='quiz', cascade='all, delete-orphan')

    def __repr__(self):
        return f"<Quiz(id={self.id}, topic='{self.topic}', level='{self.level}', questions={len(self.questions)})>"


    def to_dict(self):
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
        return {
            'id': self.id,
            'topic': self.topic,
            'level': self.level,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'NumberOfQuestions': len(self.questions)
        }
