from flask import Blueprint, jsonify, request, session

from app.routes.auth import isLoggedIn
from ..models.quiz import Quiz
from ..models.question import Question
from ..models.answer import Answer
from ..models.user import user_quiz
from ..extensions import db

quiz = Blueprint('quiz', __name__)

@quiz.route('/addQuiz', methods=['POST'])
def addQuiz():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Not authorized.'}), 401

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

@quiz.route('/deleteQuiz/<int:quizId>', methods=['DELETE'])
def deleteQuiz(quizId):
    if 'user' not in session or not session['user'].get('isAdmin'):
        return jsonify({'success': False, 'message': 'Not authorized.'}), 401

    quiz = Quiz.query.get(quizId)
    if not quiz:
        return jsonify({'success': False, 'message': 'Quiz not found.'}), 404

    db.session.delete(quiz)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Quiz deleted successfully!'}), 200

@quiz.route('/getQuizes', methods=['GET'])
def getQuizes():
    quizzes = Quiz.query.all()
    return jsonify({
        'success': True,
        'quizzes': [quiz.to_dict_headers_only() for quiz in quizzes]
    }), 200

@quiz.route('/updateQuiz/<int:quizId>', methods=['PUT'])
def updateQuiz(quizId):
    if 'user' not in session or not session['user'].get('isAdmin'):
        return jsonify({'success': False, 'message': 'Not authorized.'}), 401

    quiz = Quiz.query.get(quizId)
    if not quiz:
        return jsonify({'success': False, 'message': 'Quiz not found.'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data provided.'}), 400

    quiz.topic = data.get('topic', quiz.topic)
    quiz.level = data.get('level', quiz.level)
    quiz.description = data.get('description', quiz.description)

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

@quiz.route('/getQuiz/<int:quizId>', methods=['GET'])
def getQuiz(quizId):
    quiz = Quiz.query.get(quizId)
    if not quiz:
        return jsonify({'success': False, 'message': 'Quiz not found.'}), 404
    return jsonify({'success': True, 'quiz': quiz.to_dict()}), 200

@quiz.route('/submitQuiz', methods=['POST'])
def submitQuiz():
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Not authorized.'}), 401

    data = request.get_json()
    if not data or 'quizId' not in data or 'score' not in data:
        return jsonify({'success': False, 'message': 'Invalid submission data.'}), 400

    user = User.query.filter_by(email=session['user']['email']).first()
    quiz = Quiz.query.get(data['quizId'])

    if not quiz:
        return jsonify({'success': False, 'message': 'Quiz not found.'}), 404

    # Add the quiz score
    stmt = user_quiz.insert().values(
        user_id=user.id,
        quiz_id=quiz.id,
        score=data['score']
    )
    db.session.execute(stmt)
    db.session.commit()

    return jsonify({'success': True, 'message': 'Quiz submitted successfully!'}), 201
