from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime ,timezone

app = Flask(__name__)

# Configure the database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
CORS(app)

# Define the User model
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(25), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    isAdmin = db.Column(db.Boolean, default=False, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Define the Quiz, Question, and Answer models
class Quiz(db.Model):
    __tablename__ = 'quiz'
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).date(), nullable=False)  # New field
    questions = db.relationship('Question', backref='quiz', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Quiz {self.topic}>'
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
    
class Question(db.Model):
    __tablename__ = 'question'
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.String(500), nullable=False)
    question_type = db.Column(db.String(50), nullable=False)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    answers = db.relationship('Answer', backref='question', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Question {self.question_text}>'

class Answer(db.Model):
    __tablename__ = 'answer'
    id = db.Column(db.Integer, primary_key=True)
    answerText = db.Column(db.String(500), nullable=False)
    isCorrect = db.Column(db.Boolean, nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)

    def __repr__(self):
        return f'<Answer {self.answerText}>'

# Create database tables and add admin user (only once)
with app.app_context():
    db.create_all()
    isAdminExists = User.query.filter_by(email='safee.srio@gmail.com').first()
    if isAdminExists is None:
        print('Admin does not exist')
        admin = User(email='safee.srio@gmail.com', isAdmin=True)
        admin.set_password('safee51')
        db.session.add(admin)
        db.session.commit()

# Routes
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Check if the email already exists
    existing_email = User.query.filter_by(email=data['email']).first()
    if existing_email:
        return jsonify({'success': False, 'message': 'Email already registered.'}), 400

    # Create a new user
    user = User(email=data['email'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Registration successful!'}), 201

@app.route('/addQuiz', methods=['POST'])
def addQuiz():
    data = request.get_json()
    # Validate the incoming data
    if not data or 'topic' not in data or 'level' not in data or 'description' not in data or 'questions' not in data:
        return jsonify({'success': False, 'message': 'Invalid quiz data.'}), 400

    # Create a new Quiz object
    new_quiz = Quiz(
        topic=data['topic'],
        level=data['level'],
        description=data['description']
    )

    # Add questions to the quiz
    for question_data in data['questions']:
        if 'questionText' not in question_data or 'questionType' not in question_data:
            return jsonify({'success': False, 'message': 'Invalid question data.'}), 400

        new_question = Question(
            question_text=question_data['questionText'],
            question_type=question_data['questionType'],
            quiz=new_quiz
        )

        if question_data['questionType'] != 'paragraph':
            if 'answers' not in question_data or not question_data['answers']:
                return jsonify({'success': False, 'message': 'Answers are required for non-paragraph questions.'}), 400

            for answer_data in question_data['answers']:
                if 'answerText' not in answer_data or 'isCorrect' not in answer_data:
                    return jsonify({'success': False, 'message': 'Invalid answer data.'}), 400

                new_answer = Answer(
                answerText=answer_data['answerText'],
                isCorrect=answer_data['isCorrect'],
                question=new_question
                )
                db.session.add(new_answer)

        db.session.add(new_question)

    # Add the quiz to the database session and commit
    db.session.add(new_quiz)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Quiz added successfully!'}), 201

@app.route('/deleteQuiz/<int:quizId>', methods=['DELETE'])
def deleteQuiz(quizId):  
    # Accept quizId as a parameter
    # Validate the incoming data

    
    if not quizId:
        return jsonify({'success': False, 'message': 'Invalid quizId.'}), 400

    quiz = Quiz.query.get(quizId)
    if not quiz:
        return jsonify({'success': False, 'message': 'Quiz not found.'}), 404

    # Delete the quiz from the database
    db.session.delete(quiz)
    db.session.commit()

    quizes = Quiz.query.all()
    print(quizes)
    return jsonify({'success': True, 'message': 'Quiz deleted successfully!'}), 200


@app.route('/getQuizes', methods=['GET'])
def getQuizes():
    quizes = Quiz.query.all()
    return jsonify({'success': True, 'quizes': [quiz.to_dict() for quiz in quizes]}), 200


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    # Find the user by email
    user = User.query.filter_by(email=data['email']).first()

    # Check if the user exists and the password is correct
    if user and user.check_password(data['password']):
        return jsonify({'success': True, 'message': 'Login successful!', 'user': {'id': user.id, 'isAdmin': user.isAdmin, 'email': user.email}})
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401


if __name__ == '__main__':
    app.run(debug=True)