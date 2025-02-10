from math import log
from flask import Blueprint, jsonify, request, session, current_app
from marshmallow import Schema, fields, validate, ValidationError
from functools import wraps
from ..models.quiz import Quiz
from ..models.question import Question
from ..models.answer import Answer
from ..models.user import User, user_quiz
from ..extensions import db, limiter
from sqlalchemy import false, select,delete, true


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
                    # new_answer = Answer(
                    #     answer_data['answerText'],
                    #     answer_data['isCorrect'],
                    #     new_question
                    # )
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

        session.pop('startedQuiz', None)
        # Get all quizzes ordered by most recent first
        quizzes = Quiz.query.all()
        
        # Get current user
        user = User.query.filter_by(email=session['user'].get('email')).first()
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
        # Ensure 'startedQuiz' exists in the session
        if 'startedQuiz' not in session:
            return jsonify({
                'success': False,
                'message': 'No active quiz found. Please start a quiz first.'
            }), 400

        # Retrieve user and quiz information
        user = User.query.filter_by(email=session['user']['email']).first()
        quiz_id = session['startedQuiz'].get('quizId')
        score = session['startedQuiz'].get('score')

        # Validate quiz ID and score
        if not quiz_id or not isinstance(quiz_id, int):
            return jsonify({
                'success': False,
                'message': 'Invalid quiz ID.'
            }), 400

       

        # Fetch the quiz from the database
        quiz = Quiz.query.get_or_404(quiz_id)

        # Check if the user has already submitted this quiz
        stmt = select(user_quiz).where(
            user_quiz.c.user_id == user.id,
            user_quiz.c.quiz_id == quiz.id
        )
        existing_submission = db.session.execute(stmt).fetchone()

        if existing_submission:
            # Delete the existing submission
            delete_stmt = delete(user_quiz).where(
                user_quiz.c.user_id == user.id,
                user_quiz.c.quiz_id == quiz.id
            )
            db.session.execute(delete_stmt)

        # Insert the new submission
        insert_stmt = user_quiz.insert().values(
            user_id=user.id,
            quiz_id=quiz.id,
            score=score
        )
        db.session.execute(insert_stmt)

        # Commit the transaction
        db.session.commit()

        # Remove the 'startedQuiz' session key
        session.pop('startedQuiz', None)

        # Log the successful submission
        current_app.logger.info(f'User {user.id} submitted quiz {quiz.id} with score {score}')

        # Return success response with the final score
        return jsonify({
            'success': True,
            'message': 'Quiz submitted successfully!',
            'finalScore': score
        }), 201

    except Exception as e:
        # Rollback the transaction in case of an error
        db.session.rollback()
        current_app.logger.error(f'Error submitting quiz: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to submit quiz.'
        }), 500



@quiz.route('/startQuiz/<int:quizId>', methods=['POST'])
@login_required
def startQuiz(quizId):
    try:
        # Get the quiz by ID
       
        quiz = Quiz.query.get_or_404(quizId)
       
        # Initialize the session for the quiz
        if 'startedQuiz' not in session:
            session['startedQuiz'] = {
                'quizId': quizId,
                'questionCounter': 0,  # Start with the first question
                'score': 0,
                'completed': False
            }
        else:
            if session['startedQuiz']['completed'] == True:
                 return jsonify({
                'success': True,
                'completed': True,
                'message': 'Quiz completed!',
                'finalScore': session['startedQuiz']['score']
            }), 200
        

        # Get the first question based on the question counter
        question_counter = session['startedQuiz']['questionCounter']
        if question_counter < len(quiz.questions):
            question = quiz.questions[question_counter]

            return jsonify({
                'success': True,
                'completed': False,
                'topic': quiz.topic,
                'question': {
                    'id': question.id,
                    'questionNumber': question_counter + 1,
                    'questionsleft': len(quiz.questions) - (question_counter+1),
                    'questionText': question.question_text,
                    'questionType': question.question_type,
                    'answers': [
                        {'answerText': answer.answerText, 'isCorrect': answer.isCorrect}
                        for answer in question.answers
                    ] if question.question_type != 'paragraph' else []
                }
            }), 200
        else:
            return jsonify({
                'success': True,
                'completed': True,
                'message': 'No questions available for this quiz.'
            }), 404

    except Exception as e:
        current_app.logger.error(f'Error starting quiz: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to start quiz'}), 500
    

@quiz.route('/nextQuestion', methods=['POST'])
@login_required
def nextQuestion():
    try:
        # Get the score from the request body
        data = request.get_json()
        if not data or 'score' not in data:
            return jsonify({
                'success': False,
                'message': 'Invalid request data. Missing score.'
            }), 400

        score = data['score']

        # Check if the user has an active quiz session
        if 'startedQuiz' not in session:
            return jsonify({
                'success': False,
                'message': 'No quiz started. Please start a quiz first.'
            }), 400

        # Retrieve the current quiz and question counter from the session
        started_quiz = session['startedQuiz']
        quiz_id = started_quiz['quizId']
        question_counter = started_quiz['questionCounter']
        quiz_score = started_quiz['score']
        # Fetch the quiz from the database
        quiz = Quiz.query.get_or_404(quiz_id)

        # Update the total score in the session
        
        quiz_score+= score

        # Increment the question counter
        question_counter += 1
        started_quiz['questionCounter'] = question_counter
        started_quiz['score'] = quiz_score

        # Save the updated session
        session.modified = True




        # Check if there are more questions
        if question_counter < len(quiz.questions):
            question = quiz.questions[question_counter]
            return jsonify({
                'success': True,
                'completed': False,
                'question': {
                    'id': question.id,
                    'questionNumber': question_counter + 1,
                    'questionsleft': len(quiz.questions) - question_counter+1,
                    'questionText': question.question_text,
                    'questionType': question.question_type,
                    'answers': [
                        {'answerText': answer.answerText, 'isCorrect': answer.isCorrect}
                        for answer in question.answers
                    ] if question.question_type != 'paragraph' else []
                }
            }), 200
        else:
            session['startedQuiz']['completed'] = True
            # If no more questions, return a completion message
            return jsonify({
                'success': True,
                'completed': True,
                'message': 'Quiz completed!',
                'finalScore': started_quiz['score']
            }), 200

    except Exception as e:
        current_app.logger.error(f'Error fetching next question: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to fetch the next question'}), 500