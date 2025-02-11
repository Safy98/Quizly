# MY FINAL PROJECT

A web application that allows users to take quizzes, view their scores, and manage quizzes through an intuitive interface.

- What does it do?  
  Quizly is a Flask-based web application where users can register, log in, take quizzes, and view their results. Admins can create, update, or delete quizzes and questions.
- What is the "new feature" which you have implemented that
  we haven't seen before?\

  - using SQLAlchemy as ORM for SQlite database
  - using decorators
  - using schema for validation
  - Blueprint

## Prerequisites

Did you add any additional modules that someone needs to
install (for instance anything in Python that you `pip 
install-ed`)?

To run this project locally, you need to install the following Python modules:

- Flask
- Flask-SQLAlchemy
- Flask-Login
- Flask-Limiter
- Flask-Marshmallow

```bash
pip install -r requirements.txt
```

## Project Checklist

- [✅] It is available on GitHub.
- [✅] It uses the Flask web framework.
- [✅] It uses at least one module from the Python Standard
  Library other than the random module.
  Please provide the name of the module you are using in your
  app.
  - Module name: datetime
- [✅] It contains at least one class written by you that has
  both properties and methods. It uses `__init__()` to let the
  class initialize the object's attributes (note that  
  `__init__()` doesn't count as a method). This includes
  instantiating the class and using the methods in your app.
  Please provide below the file name and the line number(s) of
  at least one example of a class definition in your code as
  well as the names of two properties and two methods.
  - File name for the class definition: app/models/user.py
  - Line number(s) for the class definition: 14
  - Name of two properties: id , name
  - Name of two methods: set_password , check_password
  - File name and line numbers where the methods are used:
- [✅] It makes use of JavaScript in the front end and uses the
  localStorage of the web browser.
- [✅] It uses modern JavaScript (for example, let and const
  rather than var).
- [✅] It makes use of the reading and writing to the same file
  feature.
- [✅] It contains conditional statements. Please provide below
  the file name and the line number(s) of at least
  one example of a conditional statement in your code.
  - File name: frontend/JS/login.js
  - Line number(s): 37
- [✅] It contains loops. Please provide below the file name
  and the line number(s) of at least
  one example of a loop in your code.
  - File name: frontend/JS/user.js
  - Line number(s): 47
- [✅] It lets the user enter a value in a text box at some
  point.
  This value is received and processed by your back end
  Python code.
- [✅] It doesn't generate any error message even if the user
  enters a wrong input.
- [✅] It is styled using your own CSS.
- [✅] The code follows the code and style conventions as
  introduced in the course, is fully documented using comments
  and doesn't contain unused or experimental code.  
   In particular, the code should not use `print()` or
  `console.log()` for any information the app user should see.
  Instead, all user feedback needs to be visible in the
  browser.
- [✅] All exercises have been completed as per the
  requirements and pushed to the respective GitHub repository.
