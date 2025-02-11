# Quizly

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Project Structure](#project-structure)
5. [Setup and Installation](#setup-and-installation)
6. [Usage](#usage)
7. [Contributing](#contributing)
8. [License](#license)

---

## Introduction

**Quizly** is an interactive quiz web application designed to provide users with a seamless and engaging experience for taking quizzes. Whether you're testing your knowledge, learning new topics, or challenging friends, Quizly offers a robust platform to create, manage, and participate in quizzes.

The application is built using Flask (Python) as the backend framework, with SQLAlchemy for database management, and leverages APIs for communication between the frontend and backend. It includes features such as user authentication, quiz creation, submission, and scoring.

---

## Features

- **User Authentication**: Secure login and registration system.
- **Quiz Creation**: Admins can create quizzes and make questions  with single and multiple-choice answers.
- **Quiz Submission**: Users can take quizzes, submit answers, and view their scores.
- **Admin Controls**: Administrators can add, update, or delete quizzes and questions.
- **Scalability**: Supports quizzes with any number of questions and users.

---

## Technologies Used

- **Backend**:
  - Python 3.x
  - Flask
  - Flask-SQLAlchemy (ORM for database management)
  - Flask-Login (for user session management)
  - Flask-Limiter (for rate limiting API requests)
  - Flask-Marshmallow (for data serialization/deserialization)
  - Flask-decorators

- **Database**:
  - SQLite 

- **Frontend**:
  - HTML/CSS/JavaScript

- **Other Tools**:
  - Git for version control

---

## Project Structure
quizly/<br>
├── app/<br>
│   ├── __init__.py &emsp;  &emsp;&emsp;       # Flask app initialization<br>
│   ├── models/ &emsp;&emsp;             # Database models (Quiz, Question, Answer, User)<br>
│   │   ├── __init__.py<br>
│   │   ├── quiz.py<br>
│   │   ├── question.py<br>
│   │   ├── answer.py<br>
│   │   └── user.py<br>
│   ├── routes/              # API routes<br>
│   │   ├── __init__.py<br>
│   │   └── quiz.py<br>
│   ├── extensions.py &emsp;&emsp;       # Extensions (db, limiter, etc.)<br>
│   └── schemas.py   &emsp;&emsp;        # Data validation schemas<br>
├── requirements.txt  &emsp;&emsp;       # Python dependencies<br>
├── config.py          &emsp;&emsp;      # Configuration settings<br>
├── run.py              &emsp;&emsp;     # Entry point for running the app<br>
├── README.md        &emsp;&emsp;        # This file<br>


---

## Setup and Installation

### Prerequisites

- Python 3.8+ installed on your system.
- pip (Python package manager).
- A database system (PostgreSQL recommended, SQLite for development).

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Safy98/Quizly.git
   cd Quizly
   ```

2. **Set Up a Virtual Environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Dependencies**
```bash
pip install -r requirements.txt
```
2. **Configure the Application**
Copy the `config.py` file and update the database URI and other settings as needed.
Example for SQLite:
```bash
SQLALCHEMY_DATABASE_URI = 'sqlite:///quizly.db'
```

2. **Run the Application**
```bash
python run.py
```
The application will be accessible at `http://127.0.0.1:5000.`

## Usage

### Endpoints

#### 1. User Authentication

- **Register User**
  - **Method**: `POST /register`
  - **Payload**:
    ```json
    {
      "email": "user@example.com",
      "password": "password"
    }
    ```

- **Login User**
  - **Method**: `POST /login`
  - **Payload**:
    ```json
    {
      "email": "user@example.com",
      "password": "password"
    }
    ```

#### 2. Quiz Management

- **Add Quiz**
  - **Method**: `POST /addQuiz`
  - **Description**: Requires admin privileges.
  - **Payload**: Quiz details including questions and answers.

- **Get Quizzes**
  - **Method**: `GET /getQuizes`
  - **Description**: Returns a list of available quizzes.

- **Get Quiz Details**
  - **Method**: `GET /getQuiz/<quizId>`
  - **Description**: Returns the details of a specific quiz.

#### 3. Taking a Quiz

- **Start Quiz**
  - **Method**: `POST /startQuiz/<quizId>`
  - **Description**: Initializes the quiz session and returns the first question.

- **Next Question**
  - **Method**: `POST /nextQuestion`
  - **Description**: Submits the current question's score and retrieves the next question.

- **Submit Quiz**
  - **Method**: `POST /submitQuiz`
  - **Description**: Submits the final score and clears the quiz session.

  ## Contributing

Contributions are welcome! If you'd like to contribute to Quizly, please follow these steps:

- Fork the repository.
- Create a new branch: `git checkout -b feature/new-feature`.
- Make your changes and commit them: `git commit -m "Add new feature"`.
- Push to the branch: `git push origin feature/new-feature`.
- Submit a pull request explaining your changes.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

For any questions or feedback, feel free to reach out:

- GitHub: [@Safy98](https://github.com/Safy98)
- Email: safee.srio@gmail.com

---

Happy quizzing!
