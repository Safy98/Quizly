from ..extensions import db

class Answer(db.Model):
    __tablename__ = 'answer'
    id = db.Column(db.Integer, primary_key=True)
    answerText = db.Column(db.String(500), nullable=False)
    isCorrect = db.Column(db.Boolean, nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)


    def __repr__(self):
        return f'<Answer(id={self.id}, text="{self.answerText}", isCorrect={self.isCorrect})>'

    # def __init__(self, answerText, isCorrect, question_id):
    #     self.answerText = answerText
    #     self.isCorrect = isCorrect
    #     self.question_id = question_id

    
