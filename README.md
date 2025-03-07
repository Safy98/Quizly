# Quizly - Interactive Quiz Platform

Quizly is a modern web application that allows users to create, manage, and participate in quizzes. With a clean user interface and robust backend, it provides an engaging platform for both quiz administrators and participants.

## Features

### User Features

- User authentication (login/signup)
- Take quizzes with different difficulty levels
- Real-time score tracking
- Progress tracking for each quiz
- Multiple question types support (radio, checkbox)

### Admin Features

- Create and manage quizzes
- Add multiple types of questions
- Delete existing quizzes

## Tech Stack

### Backend

- Flask (Python web framework)
- SQLAlchemy (ORM)
- Flask-CORS (Cross-Origin Resource Sharing)
- Flask-Limiter (Rate limiting)
- Marshmallow (Object serialization/deserialization)

### Database

- SQLite (local development)

### Frontend

- Vanilla JavaScript
- HTML5
- CSS3
- Font Awesome (Icons)

## Installation

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backEnd
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:

   - Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - Unix/MacOS:
     ```bash
     source venv/bin/activate
     ```

4. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Run the application:
   ```bash
   python run.py
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontEnd
   ```

2. Open the application in a web browser:
   - Open `login.html` to start using the application
   - For development, use a local server to serve the frontend files

## Project Structure

```
├── backEnd/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── extensions.py
│   ├── instance/
│   ├── requirements.txt
│   └── run.py
├── frontEnd/
│   ├── CSS/
│   ├── Images/
│   ├── JS/
│   │   └── utils/
│   ├── admin.html
│   ├── login.html
│   ├── quiz.html
│   ├── quizCreator.html
│   ├── signup.html
│   └── user.html
└── README.md
```

## API Documentation

### Authentication Endpoints

- POST `/signup` - Register a new user
- POST `/login` - User login
- POST `/logout` - User logout

### Quiz Endpoints

- GET `/getQuizes` - Get all available quizzes
- GET `/getQuiz/<quizId>` - Get a quiz by ID
- POST `/addQuiz` - Create a new quiz (admin only)
- DELETE `/deleteQuiz/<quizId>` - Delete a quiz (admin only)
- POST `/startQuiz/<quizId>` - Start a quiz session
- PUT `/updateQuiz/<quizId>` - Update a quiz by ID
- POST `/nextQuestion` - Get next question in quiz
- POST `/submitQuiz` - Submit quiz answers

## Usage

### User Flow

1. Create an account or login
2. Browse available quizzes
3. Start a quiz
4. Answer questions and submit responses
5. View results

### Admin Flow

1. Login with admin credentials
2. Create new quizzes
3. Manage existing quizzes

## Security Features

- Password hashing
- Schema validation
- Rate limiting on API endpoints
- Session-based authentication
- Admin-only routes protection

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
