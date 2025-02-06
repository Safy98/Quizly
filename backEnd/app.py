from os import name
from flask import Flask, jsonify, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone, timedelta

app = Flask(__name__)

# Configure the database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1) 
db = SQLAlchemy(app)
app.config["SESSION_PERMANENT"] = False

app.secret_key = 'SafeeSrio' 
CORS(app, supports_credentials=True, origins="http://127.0.0.1:5500")
app.config.update(SESSION_COOKIE_SAMESITE="None", SESSION_COOKIE_SECURE=True)
# Association table for User and Quiz
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
                               .filter(user_quiz.c.user_id == self.id, user_quiz.c.quiz_id == Quiz.id).all()]
        }

# Define the Quiz, Question, and Answer models
class Quiz(db.Model):
    __tablename__ = 'quiz'
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(100), nullable=False)
    level = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).date(), nullable=False)
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

    def to_dict_headers_only(self):
        return {
            'id': self.id,
            'topic': self.topic,
            'level': self.level,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'NumberOfQuestions': len(self.questions)
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
        admin = User(email='safee.srio@gmail.com', isAdmin=True, name='Safee')
        admin.set_password('safee51')
        db.session.add(admin)
        db.session.commit()

@app.route('/logout', methods=['GET'])
def logout():
    session.pop('user', None)
    return jsonify({'success': True, 'message': 'Logged out successfully.'}), 200

@app.route('/isLoggedIn', methods=['GET'])
def isLoggedIn():
    if 'user' in session:
        user = session['user']
        return jsonify({'success': True, 'user': user}), 200
    else:
        return jsonify({'success': False, 'message': 'User is not logged in.'}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    existing_email = User.query.filter_by(email=data['email']).first()
    if existing_email:
        return jsonify({'success': False, 'message': 'Email already registered.'}), 400

    user = User(email=data['email'], name=data['name'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    session['user'] = {'email': user.email, 'logged_in': True, 'isAdmin': user.isAdmin}

    return jsonify({'success': True, 'message': 'Registration successful!', 'user': {'id': user.id, 'isAdmin': user.isAdmin, 'email': user.email, 'name': user.name}}), 201

@app.route('/addQuiz', methods=['POST','GET'])
def addQuiz():

    data = request.get_json()
    if not data or 'topic' not in data or 'level' not in data or 'description' not in data or 'questions' not in data:
        return jsonify({'success': False, 'message': 'Invalid quiz data.'}), 400

    new_quiz = Quiz(
        topic=data['topic'],
        level=data['level'],
        description=data['description']
    )

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

    db.session.add(new_quiz)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Quiz added successfully!'}), 201

@app.route('/deleteQuiz/<int:quizId>', methods=['DELETE'])
def deleteQuiz(quizId):
    if "user" in session:
        print(session['user'])

    if not quizId:
        return jsonify({'success': False, 'message': 'Invalid quizId.'}), 400

    quiz = Quiz.query.get(quizId)
    if not quiz:
        return jsonify({'success': False, 'message': 'Quiz not found.'}), 404

    db.session.delete(quiz)
    db.session.commit()

    quizes = Quiz.query.all()
    return jsonify({'success': True, 'message': 'Quiz deleted successfully!'}), 200


@app.route('/getQuizes')
def getQuizes():
    
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'User not logged in.'}), 401
    print(session['user'])
    user = User.query.filter_by(email=session['user']['email']).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404
    quizes = Quiz.query.all()
    # if 'user' in session:
    print(session['user'])
    return jsonify({'success': True, 'quizes': [quiz.to_dict_headers_only() for quiz in quizes] , 'user': user.to_dict() }), 200
    

@app.route('/updateQuiz/<int:quizId>', methods=['PUT'])
def updateQuiz(quizId):
    data = request.get_json()
    if not data or 'topic' not in data or 'level' not in data or 'description' not in data or 'questions' not in data:
        return jsonify({'success': False, 'message': 'Invalid quiz data.'}), 400

    UpdatedQuiz = Quiz.query.get(quizId)
    if not UpdatedQuiz:
        return jsonify({'success': False, 'message': 'Quiz not found.'}), 404

    UpdatedQuiz.topic = data['topic']
    UpdatedQuiz.level = data['level']
    UpdatedQuiz.description = data['description']

    for question in UpdatedQuiz.questions:
        db.session.delete(question)

    for question_data in data['questions']:
        if 'questionText' not in question_data or 'questionType' not in question_data:
            return jsonify({'success': False, 'message': 'Invalid question data.'}), 400

        new_question = Question(
            question_text=question_data['questionText'],
            question_type=question_data['questionType'],
            quiz=UpdatedQuiz
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

    db.session.commit()

    return jsonify({'success': True, 'message': 'Quiz updated successfully!'}), 200

@app.route('/getQuiz/<int:quizId>', methods=['GET'])
def getQuiz(quizId):
    if not quizId:
        return jsonify({'success': False, 'message': 'Invalid quizId.'}), 400

    quiz = Quiz.query.get(quizId)
    if not quiz:
        return jsonify({'success': False, 'message': 'Quiz not found.'}), 404

    return jsonify({'success': True, 'quiz': quiz.to_dict()}), 200

@app.route('/login',methods = ["POST" ,"GET"])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    

    if user and user.check_password(data['password']):
        session.permanent = True
        session['user'] = {'email': user.email, 'logged_in': True, 'isAdmin': user.isAdmin}
        session.modified = True
        return jsonify({'success': True, 'message': 'Login successful!', 'user': {'id': user.id, 'isAdmin': user.isAdmin, 'email': user.email, 'name': user.name}}), 200
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401



@app.route('/submitQuiz', methods=['POST'])
def submitQuiz():
    data = request.get_json()
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'User not logged in.'}), 401

    user = User.query.filter_by(email=session['user']['email']).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    quiz_id = data.get('quizID')
    score = data.get('score')

    if not quiz_id or not score:
        return jsonify({'success': False, 'message': 'Invalid quiz data.'}), 400

    # Check if the user has already taken the quiz
    existing_entry = db.session.query(user_quiz).filter_by(user_id=user.id, quiz_id=quiz_id).first()
    if existing_entry:
        return jsonify({'success': False, 'message': 'User has already taken this quiz.'}), 400

    # Add the quiz result to the user_quiz table
    db.session.execute(user_quiz.insert().values(user_id=user.id, quiz_id=quiz_id, score=score))
    db.session.commit()

    return jsonify({'success': True, 'message': 'Quiz result submitted successfully!'}), 200

if __name__ == '__main__':
    app.run(debug=True)