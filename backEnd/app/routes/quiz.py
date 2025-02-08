from flask import Blueprint, jsonify, request, session, current_app
from marshmallow import Schema, fields, validate, ValidationError
from functools import wraps
from ..models.quiz import Quiz
from ..models.question import Question
from ..models.answer import Answer
from ..models.user import User, user_quiz
from ..extensions import db, limiter

quiz = Blueprint('quiz', __name__)

# Validation Schemas
class AnswerSchema(Schema):
    answerText = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    isCorrect = fields.Boolean(required=True)

class QuestionSchema(Schema):
    questionText = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    questionType = fields.Str(required=True, validate=validate.OneOf(['radio','checkbox','paragraph']))
    answers = fields.List(fields.Nested(AnswerSchema), required=False)  # Optional for paragraph type

class QuizSchema(Schema):
    topic = fields.Str(required=True, validate=validate.Length(min=1, max=30))
    level = fields.Str(required=True, validate=validate.OneOf(['Beginner', 'Intermediate', 'Advanced', 'Challenging']))
    description = fields.Str(required=True, validate=validate.Length(max=100))
    questions = fields.List(fields.Nested(QuestionSchema), required=True, validate=validate.Length(min=1))

# Decorators
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session or not session['user'].get('isAdmin'):
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

@quiz.route('/addQuiz', methods=['POST'])
@admin_required
@limiter.limit("20 per hour")
def addQuiz():
    try:
        # Validate input
        schema = QuizSchema()
        data = schema.load(request.get_json())

        new_quiz = Quiz(
            topic=data['topic'],
            level=data['level'],
            description=data['description']
        )

        # Add questions and answers
        for question_data in data['questions']:
            new_question = Question(
                question_text=question_data['questionText'],
                question_type=question_data['questionType'],
                quiz=new_quiz
            )

            if question_data['questionType'] != 'paragraph':
                for answer_data in question_data['answers']:
                    new_answer = Answer(
                        answerText=answer_data['answerText'],
                        isCorrect=answer_data['isCorrect'],
                        question=new_question
                    )
                    db.session.add(new_answer)

            db.session.add(new_question)

        db.session.add(new_quiz)
        db.session.commit()

        return jsonify({
            'success': True, 
            'message': 'Quiz added successfully!',
            'quizId': new_quiz.id
        }), 201

    except ValidationError as err:
        return jsonify({'success': False, 'message': err.messages}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error adding quiz: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to add quiz'}), 500

@quiz.route('/deleteQuiz/<int:quizId>', methods=['DELETE'])
@admin_required
def deleteQuiz(quizId):
    try:
        quiz = Quiz.query.get_or_404(quizId)
        db.session.delete(quiz)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Quiz deleted successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error deleting quiz: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to delete quiz'}), 500

@quiz.route('/getQuizes', methods=['GET'])
@limiter.limit("100 per minute")
@login_required
def getQuizes():
    try:
        # Get all quizzes ordered by most recent first
        quizzes = Quiz.query.all()
        
        # Get current user
        user = User.query.filter_by(email=session['user'].get('email')).first()
        print(user.solved_quizzes)
        return jsonify({
            'success': True,
            'quizzes': [quiz.to_dict_headers_only() for quiz in quizzes],
            'user': user.to_dict(),
        }), 200
    except Exception as e:
        current_app.logger.error(f'Error fetching quizzes: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to fetch quizzes'}), 500

@quiz.route('/updateQuiz/<int:quizId>', methods=['PUT'])
@admin_required
def updateQuiz(quizId):
    try:
        quiz = Quiz.query.get_or_404(quizId)
        
        # Validate input
        schema = QuizSchema()
        data = schema.load(request.get_json())

        # Update basic quiz info
        quiz.topic = data['topic']
        quiz.level = data['level']
        quiz.description = data['description']

        # Delete existing questions and answers
        for question in quiz.questions:
            db.session.delete(question)

        # Add new questions and answers
        for question_data in data['questions']:
            new_question = Question(
                question_text=question_data['questionText'],
                question_type=question_data['questionType'],
                quiz=quiz
            )

            if question_data['questionType'] != 'paragraph':
                for answer_data in question_data['answers']:
                    new_answer = Answer(
                        answerText=answer_data['answerText'],
                        isCorrect=answer_data['isCorrect'],
                        question=new_question
                    )
                    db.session.add(new_answer)

            db.session.add(new_question)

        db.session.commit()
        return jsonify({'success': True, 'message': 'Quiz updated successfully!'}), 200

    except ValidationError as err:
        return jsonify({'success': False, 'message': err.messages}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error updating quiz: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to update quiz'}), 500

@quiz.route('/getQuiz/<int:quizId>', methods=['GET'])
@limiter.limit("100 per minute")
@login_required
def getQuiz(quizId):
    try:
        quiz = Quiz.query.get_or_404(quizId)
        return jsonify({'success': True, 'quiz': quiz.to_dict()}), 200
    except Exception as e:
        current_app.logger.error(f'Error fetching quiz: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to fetch quiz'}), 500

@quiz.route('/submitQuiz', methods=['POST'])
@login_required
@limiter.limit("30 per hour")
def submitQuiz():
    try:
        data = request.get_json()
        if not data or 'quizId' not in data or 'score' not in data:
            return jsonify({'success': False, 'message': 'Invalid submission data'}), 400

        user = User.query.filter_by(email=session['user']['email']).first()
        quiz = Quiz.query.get_or_404(data['quizId'])

        # Validate score
        if not isinstance(data['score'], (int))  :
            return jsonify({'success': False, 'message': 'Invalid score value'}), 400

        # Check if user has already submitted this quiz
        # existing_submission = db.session.query(user_quiz).filter_by(
        #     user_id=user.id, 
        #     quiz_id=quiz.id
        # ).first()

        # if existing_submission:
        #     return jsonify({'success': False, 'message': 'Quiz already submitted'}), 400

        # Add the quiz score
        stmt = user_quiz.insert().values(
            user_id=user.id,
            quiz_id=quiz.id,
            score=data['score']
        )
        db.session.execute(stmt)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Quiz submitted successfully!'}), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error submitting quiz: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to submit quiz'}), 500
