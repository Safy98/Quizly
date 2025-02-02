"use strict";
const AddQuestionBtnEle = document.querySelector(".add-btn");
const saveBtnEle = document.querySelector(".save-btn");
const questionTypeInputEle = document.querySelector("#question-type");
const deleteQuestionBtn = document.querySelector(".questionAndIcon button");
const questionContainer = document.querySelector("#questions-container");
const quizTopicInputEle = document.querySelector("#topic");
const quizLevelSelectEle = document.querySelector("#level");
const quizDescriptionTextAreaEle = document.querySelector("#description");
let addAnswerEle;

let questionCounter = 0;

function appendAddAnswerEle() {
  let addAnswerEle = document.createElement("div");
  addAnswerEle.classList.add("add-answer");
  addAnswerEle.innerHTML = ` 
  <button><i class="fa-solid fa-square-plus"></i>Add answer</button>`;

  return addAnswerEle;
}

AddQuestionBtnEle.addEventListener("click", function () {
  if (questionCounter === 5) {
    console.log("you reached the max limit");
    AddBtnEle.disabled = true;
    return;
  }

  let question = `
 <div class="question form-group">
    <div class="questionAndIcon">
    <label for="">Question <span>${questionCounter + 1}</span></label>
    <button><i class="fas fa-trash-alt delete"></i></button>
    </div>
    <input  type="text" placeholder="Enter your question" />
  </div>
`;

  const LastQuestion = questionContainer.appendChild(createNewQuestion());

  let type;
  if (questionTypeInputEle.value === "Single") {
    type = "radio";
  } else if (questionTypeInputEle.value === "Multiple") {
    type = "checkbox";
  } else {
    type = "paragraph";
    LastQuestion.setAttribute("data-type", type);
    questionCounter++;
    return;
  }

  LastQuestion.setAttribute("data-type", type);
  LastQuestion.appendChild(createNewAnswer(type));
  LastQuestion.appendChild(createNewAnswer(type));
  LastQuestion.appendChild(appendAddAnswerEle());

  questionCounter++;
});

questionContainer.addEventListener("click", function (event) {
  if (event.target.closest(".add-answer button")) {
    const currentEle = event.target.closest(".add-answer");
    const parent = currentEle.parentElement;

    const previousQuestionType = parent.getAttribute("data-type");
    if (countNumberOfAnswers(parent) === 20) {
      showError(question, "A questioncan't have more than 20 options");
      return;
    }
    let newChoiceEle;
    if (previousQuestionType == "checkbox") {
      newChoiceEle = createNewAnswer("checkbox");
    } else {
      newChoiceEle = createNewAnswer("radio");
    }

    parent.insertBefore(newChoiceEle, currentEle);
  }
});
function countNumberOfAnswers(question) {
  return question.querySelectorAll(".answer-option").length;
}
function createNewQuestion() {
  const newQuestionEle = document.createElement("div");
  newQuestionEle.classList.add("question");
  newQuestionEle.classList.add("form-group");
  newQuestionEle.innerHTML = `
  <div class="questionAndIcon">
    <label for="">Question <span>${questionCounter + 1}</span></label>
    <button><i class="fas fa-trash-alt delete"></i></button>
  </div>
  <input  type="text" placeholder="Enter your question" />
 `;

  newQuestionEle
    .querySelector(".questionAndIcon")
    .querySelector("button")
    .addEventListener("click", function () {
      newQuestionEle.remove();
      questionCounter--;
      let allQ = document.querySelector("#questions-container").querySelectorAll(".question ");

      allQ.forEach(function (element, index) {
        element.querySelector("span").textContent = index + 1;
      });
    });
  return newQuestionEle;
}
function createNewAnswer(type) {
  const newChoiceEle = document.createElement("div");
  newChoiceEle.classList.add("answer-option");
  newChoiceEle.classList.add("form-group");
  newChoiceEle.innerHTML = `
  <div class="choice-wrapper">
      <input type=${type} name="answer" id="answer1"  />
      <input type="text" class="answer-input" placeholder="Type your answer here" />
      <button class="delete-btn">
      <i class="fas fa-trash-alt"></i>
        </button>
  </div>`;

  newChoiceEle.querySelector(".delete-btn").addEventListener("click", () => {
    newChoiceEle.remove();
  });

  return newChoiceEle;
}

function anyUnasnwered(question) {
  const type = question.getAttribute("data-type");
  const errorPlace = question.querySelector("input");
  if (type === "paragraph") {
    return false;
  } else if (type === "radio") {
    const choices = question.querySelectorAll('input[type="radio"]');
    let checked = false;
    choices.forEach(function (choice) {
      if (choice.checked) {
        checked = true;
      }
    });
    if (!checked) {
      showError(errorPlace, "Please select an answer");
      return true;
    }
  } else if (type === "checkbox") {
    const choices = question.querySelectorAll('input[type="checkbox"]');
    let checked = 0;
    choices.forEach(function (choice) {
      if (choice.checked) {
        checked++;
      }
    });
    if (checked < 2) {
      showError(errorPlace, "A Multiple choice question must have two options at least");
      return true;
    }
  }

  return false;
}

function anyAnswerEmpty(question) {
  let emptyCounter = 0;
  if (question.getAttribute("data-type") === "paragraph") {
    return false;
  }
  const answers = question.querySelectorAll(".answer-option");

  if (answers.length < 2) {
    showError(question.querySelector("input"), "A question must have two options at least");
    return true;
  }
  answers.forEach(function (oneAnswer) {
    let notEmpty;
    const answerInput = oneAnswer.querySelector(".answer-input");
    notEmpty = validateInput(answerInput);

    if (!notEmpty) {
      emptyCounter++;
    }
  });

  if (emptyCounter) {
    showError(question.querySelector(".answer-option"), "Answers can't be empty");
  } else {
    clearError(question.querySelector(".answer-option"));
  }

  return emptyCounter;
}
function anyQuestionEmpty(question) {
  let emptyCounter = 0;
  const questionInput = question.querySelector("input");
  if (!validateInput(questionInput)) {
    showError(questionInput, "Question can't be empty");
    emptyCounter++;
  } else {
    clearError(questionInput);
  }

  return emptyCounter;
}

saveBtnEle.addEventListener("click", function () {
  const allQuestions = questionContainer.querySelectorAll(".question");
  let validData = true;
  if (!validateInput(quizTopicInputEle)) {
    showError(quizTopicInputEle, "Topic can't be empty");
  } else {
    clearError(quizTopicInputEle);
  }
  if (!validateInput(quizDescriptionTextAreaEle)) {
    showError(quizDescriptionTextAreaEle, "Description can't be empty");
  } else {
    clearError(quizDescriptionTextAreaEle);
  }
  allQuestions.forEach(function (question) {
    if (anyQuestionEmpty(question)) {
      validData = false;
      return;
    }

    if (anyAnswerEmpty(question)) {
      validData = false;
      return;
    }

    if (anyUnasnwered(question)) {
      validData = false;
      return;
    }
  });

  if (validData) {
    const quiz = collectData();
    const response = sendQuiz(quiz).then((data) => {
      if (data.success === true) {
        window.location.href = "admin.html";
      } else {
      
        // ! handel error 
      
      }
    });
    
    
  }
});

async function sendQuiz(quiz){

  const respone = await fetch('http://127.0.0.1:5000/addQuiz', {
    method: "POST",
    body: JSON.stringify(quiz),
    headers: {
        "Content-Type": "application/json"
    }

    
  });

  let responseData = await respone.json();
  return responseData;
}

function collectData() {
  const quizTopic = quizTopicInputEle.value;
  const quizLevel = quizLevelSelectEle.value;
  const quizDescription = quizDescriptionTextAreaEle.value;
  const questions = [];
  const allQuestions = questionContainer.querySelectorAll(".question");
  allQuestions.forEach(function (question) {
    const questionText = question.querySelector("input").value;
    const questionType = question.getAttribute("data-type");
    const answers = [];
    question.querySelectorAll(".answer-option").forEach(function (answer) {
      const answerText = answer.querySelector(".answer-input").value;
      const isCorrect = answer.querySelector(`input[type=${questionType}]`).checked;
      answers.push({ answerText, isCorrect });
    });
    questions.push({ questionText, questionType, answers });
  });

  const quiz = { topic: quizTopic, level: quizLevel, description: quizDescription, questions };
  console.log(quiz);

  return quiz;
}

function validateInput(questionInput) {
  if (questionInput.value.trim() === "") {
    return false;
  } else {
    return true;
  }
}

function showError(inputElement, message) {
  // Check if an error message already exists
  let errorElement = inputElement.parentElement.querySelector(".error-message");
  if (!errorElement) {
    // Create a new error message element
    errorElement = document.createElement("div");
    errorElement.className = "error-message";
    errorElement.textContent = message;
    // Insert the error message just above the input
    inputElement.parentElement.insertBefore(errorElement, inputElement);
  } else {
    // Update the existing error message
    errorElement.textContent = message;
  }

  // Add a class to highlight the invalid input (optional)
  inputElement.classList.add("invalid-input");
}

// }

function clearError(inputElement) {
  const errorElement = inputElement.parentElement.querySelector(".error-message");
  if (errorElement) {
    errorElement.remove(); // Remove the error message
  }

  // Remove the invalid input class (optional)
  inputElement.classList.remove("invalid-input");
}


