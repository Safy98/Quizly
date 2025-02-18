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
    level = fields.Str(required=True, validate=validate.OneOf(['Beginner', 'Intermediate', 'Hard', 'Challenging']))
    description = fields.Str(required=True, validate=validate.Length(max=100))
    questions = fields.List(fields.Nested(QuestionSchema), required=True, validate=validate.Length(min=1))

# Decorators
def admin_required(f):
    """
    Decorator for routes that require admin access.

    This decorator checks if the user is logged in and has the 'isAdmin' attribute set to True.
    If not, it returns a 403 Forbidden response with a JSON payload indicating the problem.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if the user is logged in and has admin access
        if 'user' not in session or not session['user'].get('isAdmin'):
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        # If the user has admin access, call the original function
        return f(*args, **kwargs)
    return decorated_function

def login_required(f):
    """
    Decorator to check if the user is logged in.

    This decorator checks if the user is logged in (i.e., the 'user' key exists in the session).
    If not, it returns a 401 Unauthorized response with a JSON payload indicating the problem.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if the user is logged in
        if 'user' not in session:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        # If the user is logged in, call the original function
        return f(*args, **kwargs)
    return decorated_function

@quiz.route('/addQuiz', methods=['POST'])
@admin_required
@limiter.limit("20 per hour")
def addQuiz():
    """
    Add a new quiz to the database.

    This route validates the input data and creates a new Quiz object with associated Question and Answer objects. It then adds the quiz to the database.
    """
    try:
        # Validate input
        schema = QuizSchema()
        data = schema.load(request.get_json())

        # Create a new Quiz object
        new_quiz = Quiz(
            topic=data['topic'],
            level=data['level'],
            description=data['description']
        )

        # Add questions and answers
        for question_data in data['questions']:
            # Create a new Question object
            new_question = Question(
                question_text=question_data['questionText'],
                question_type=question_data['questionType'],
                quiz=new_quiz
            )

            # Add answers to the question
            if question_data['questionType'] != 'paragraph':
                for answer_data in question_data['answers']:
                    # Create a new Answer object
                    new_answer = Answer(
                        answerText=answer_data['answerText'],
                        isCorrect=answer_data['isCorrect'],
                        question=new_question
                    )
                    # Add the answer to the database
                    db.session.add(new_answer)

            # Add the question to the database
            db.session.add(new_question)

        # Add the quiz to the database
        db.session.add(new_quiz)
        # Commit the changes
        db.session.commit()

        return jsonify({
            'success': True, 
            'message': 'Quiz added successfully!',
            'quizId': new_quiz.id
        }), 201

    except ValidationError as err:
        # Return a 400 Bad Request response if the input validation fails
        return jsonify({'success': False, 'message': err.messages}), 400
    except Exception as e:
        # Rollback the database session if an exception occurs
        db.session.rollback()
        # Log the error
        current_app.logger.error(f'Error adding quiz: {str(e)}')
        # Return a 500 Internal Server Error response
        return jsonify({'success': False, 'message': 'Failed to add quiz'}), 500

@quiz.route('/deleteQuiz/<int:quizId>', methods=['DELETE'])
@admin_required
def deleteQuiz(quizId):
    """
    Deletes a quiz with the given ID.

    Args:
        quizId (int): The ID of the quiz to delete.

    Returns:
        A JSON response with a success message if the quiz is deleted successfully.
        A JSON response with an error message if the quiz cannot be deleted (e.g. due to a database error).
    """
    try:
        # Retrieve the quiz with the given ID
        quiz = Quiz.query.get_or_404(quizId)
        # Delete the quiz
        db.session.delete(quiz)
        # Commit the changes
        db.session.commit()
        # Return a 200 OK response with a success message
        return jsonify({'success': True, 'message': 'Quiz deleted successfully!'}), 200
    except Exception as e:
        # Rollback the database session if an exception occurs
        db.session.rollback()
        # Log the error
        current_app.logger.error(f'Error deleting quiz: {str(e)}')
        # Return a 500 Internal Server Error response with an error message
        return jsonify({'success': False, 'message': 'Failed to delete quiz'}), 500

@quiz.route('/getQuizes', methods=['GET'])
@limiter.limit("100 per minute")
@login_required
def getQuizes():
    """
    Get all quizzes ordered by most recent first.

    This route is rate-limited to 100 requests per minute and requires the user to be logged in.

    Args:
        None

    Returns:
        A JSON response with the following keys:
            - success (bool): True if the request was successful, False otherwise
            - quizzes (list): A list of Quiz objects with only the most basic information
            - user (dict): The current user object as a dictionary
    """
    try:
        # Remove 'startedQuiz' from the session to prevent users from accessing
        # the same quiz multiple times before completing it
        session.pop('startedQuiz', None)

        # Get all quizzes ordered by most recent first
        quizzes = Quiz.query.all()

        # Get the current user
        user = User.query.filter_by(email=session['user'].get('email')).first()

        # Return a JSON response with the quizzes and user info
        return jsonify({
            'success': True,
            'quizzes': [quiz.to_dict_headers_only() for quiz in quizzes],
            'user': user.to_dict(),
        }), 200
    except Exception as e:
        # Log any errors that occur
        current_app.logger.error(f'Error fetching quizzes: {str(e)}')
        # Return a 500 Internal Server Error response with an error message
        return jsonify({'success': False, 'message': 'Failed to fetch quizzes'}), 500

@quiz.route('/updateQuiz/<int:quizId>', methods=['PUT'])
@admin_required
def updateQuiz(quizId):
    """
    Updates a quiz with the given ID.

    Args:
        quizId (int): The ID of the quiz to update.

    Returns:
        A JSON response with a success message if the quiz is updated successfully.
        A JSON response with an error message if the quiz cannot be updated (e.g. due to a database error).
    """
    try:
        # Retrieve the quiz with the given ID
        quiz = Quiz.query.get_or_404(quizId)

        # Validate the input data
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
            # Create a new Question object
            new_question = Question(
                question_text=question_data['questionText'],
                question_type=question_data['questionType'],
                quiz=quiz
            )

            # Add answers to the question (if not a paragraph question)
            if question_data['questionType'] != 'paragraph':
                for answer_data in question_data['answers']:
                    # Create a new Answer object
                    new_answer = Answer(
                        answerText=answer_data['answerText'],
                        isCorrect=answer_data['isCorrect'],
                        question=new_question
                    )
                    # Add the answer to the database
                    db.session.add(new_answer)

            # Add the question to the database
            db.session.add(new_question)

        # Commit the changes
        db.session.commit()

        # Return a 200 OK response with a success message
        return jsonify({'success': True, 'message': 'Quiz updated successfully!'}), 200

    except ValidationError as err:
        # Return a 400 Bad Request response if the input validation fails
        return jsonify({'success': False, 'message': err.messages}), 400
    except Exception as e:
        # Rollback the database session if an exception occurs
        db.session.rollback()
        # Log the error
        current_app.logger.error(f'Error updating quiz: {str(e)}')
        # Return a 500 Internal Server Error response with an error message
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
    """
    Submits the current quiz session for the logged-in user.

    This route finalizes the quiz for the user, records the score in the database,
    and removes the active quiz session.

    Returns:
        A JSON response with a success message and the final score if submission is successful,
        otherwise an error message.
    """
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
            # Delete the existing submission for re-submission
            delete_stmt = delete(user_quiz).where(
                user_quiz.c.user_id == user.id,
                user_quiz.c.quiz_id == quiz.id
            )
            db.session.execute(delete_stmt)

        # Insert the new submission with the current score
        insert_stmt = user_quiz.insert().values(
            user_id=user.id,
            quiz_id=quiz.id,
            score=score
        )
        db.session.execute(insert_stmt)

        # Commit the transaction to save changes
        db.session.commit()

        # Remove the 'startedQuiz' session key to finalize submission
        session.pop('startedQuiz', None)

        # Log the successful submission for audit purposes
        current_app.logger.info(f'User {user.id} submitted quiz {quiz.id} with score {score}')

        # Return success response with the final score
        return jsonify({
            'success': True,
            'message': 'Quiz submitted successfully!',
            'finalScore': score
        }), 201

    except Exception as e:
        # Rollback the transaction in case of an error to maintain data integrity
        db.session.rollback()
        current_app.logger.error(f'Error submitting quiz: {str(e)}')
        return jsonify({
            'success': False,
            'message': 'Failed to submit quiz.'
        }), 500



@quiz.route('/startQuiz/<int:quizId>', methods=['POST'])
@login_required
def startQuiz(quizId):
    """
    Start a quiz by setting up the session and returning the first question.

    Args:
        quizId (int): The ID of the quiz to start.

    Returns:
        A JSON response with the following keys:
            - success (bool): True if the request was successful, False otherwise
            - completed (bool): True if the quiz is completed, False otherwise
            - topic (str): The topic of the quiz
            - question (dict): A dictionary with the following keys:
                - id (int): The ID of the question
                - questionNumber (int): The number of the question
                - questionsleft (int): The number of questions left in the quiz
                - questionText (str): The text of the question
                - questionType (str): The type of the question
                - answers (list): A list of dictionaries with the following keys:
                    - answerText (str): The text of the answer
                    - isCorrect (bool): True if the answer is correct, False otherwise
    """
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
    """
    Retrieve the next question in the active quiz session.

    This endpoint processes the user's score for the current question,
    updates the quiz session, and returns the next question if available.

    Returns:
        A JSON response with the next question if available, or a completion message
        if the quiz is completed, otherwise an error message.
    """
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
        quiz_score = score

        # Increment the question counter for the next question
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
                    'questionsleft': len(quiz.questions) - question_counter + 1,
                    'questionText': question.question_text,
                    'questionType': question.question_type,
                    'answers': [
                        {'answerText': answer.answerText, 'isCorrect': answer.isCorrect}
                        for answer in question.answers
                    ] if question.question_type != 'paragraph' else []
                }
            }), 200
        else:
            # Mark the quiz as completed in the session
            session['startedQuiz']['completed'] = True
            # If no more questions, return a completion message
            return jsonify({
                'success': True,
                'completed': True,
                'message': 'Quiz completed!',
                'finalScore': started_quiz['score']
            }), 200

    except Exception as e:
        # Log the error and return a failure response
        current_app.logger.error(f'Error fetching next question: {str(e)}')
        return jsonify({'success': False, 'message': 'Failed to fetch the next question'}), 500
