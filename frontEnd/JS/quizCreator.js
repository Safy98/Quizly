"use strict";
const API_URL = 'http://127.0.0.1:5000';

const AddQuestionBtnEle = document.querySelector(".add-btn");
const saveBtnEle = document.querySelector(".save-btn");
const questionTypeInputEle = document.querySelector("#question-type");
const deleteQuestionBtn = document.querySelector(".questionAndIcon button");
const questionContainer = document.querySelector("#questions-container");
const quizTopicInputEle = document.querySelector("#topic");
const quizLevelSelectEle = document.querySelector("#level");
const quizDescriptionTextAreaEle = document.querySelector("#description");
const logoutBtn = document.querySelector(".logout");


async function logout() {
  const respone = await fetch(`${API_URL}/logout`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },


  });

  const responeData = await respone.json();
  console.log('logout',responeData);
  
  if (responeData.success === true) {
    window.location.href = "login.html";
  }

}

logoutBtn.addEventListener("click", logout);



let addAnswerEle;
let questionID = 1;
let questionCounter = 0;
let editMode = false;
let toUpdateQuiz;
  if (localStorage.getItem("quiz")) {
    ({quiz: toUpdateQuiz} = JSON.parse(localStorage.getItem("quiz")));
    editMode = true;
    console.log(toUpdateQuiz);
    
    quizTopicInputEle.value = toUpdateQuiz.topic;
    quizLevelSelectEle.value = toUpdateQuiz.level;
    quizDescriptionTextAreaEle.value = toUpdateQuiz.description;
  
    toUpdateQuiz.questions.forEach((question,index) => {
      let Question = questionContainer.appendChild(createNewQuestion(index,question.questionText ));
      Question.setAttribute("data-type",question.questionType);
      question.answers.forEach((answer) => {
        Question.appendChild(createNewAnswer(question.questionType,Question,answer.answerText , answer.isCorrect ? "checked" : ""));
      });
      Question.appendChild(appendAddAnswerEle());
    });
    
    questionCounter  = toUpdateQuiz.questions.length;

    localStorage.removeItem("quiz");
  }






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



  const LastQuestion = questionContainer.appendChild(createNewQuestion(questionCounter));

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
  LastQuestion.appendChild(createNewAnswer(type,LastQuestion));
  LastQuestion.appendChild(createNewAnswer(type,LastQuestion));
  LastQuestion.appendChild(appendAddAnswerEle());

  questionCounter++;
});

questionContainer.addEventListener("click", function (event) {
  if (event.target.closest(".add-answer button")) {
    const currentEle = event.target.closest(".add-answer");
    const parent = currentEle.parentElement;

    const previousQuestionType = parent.getAttribute("data-type");
    if (countNumberOfAnswers(parent) === 5) {
      console.log("you reached the max limit");
      
      showError(parent.querySelector('input'), "A question can't have more than 20 options");
      return;
    }

    let newChoiceEle;
    if (previousQuestionType == "checkbox") {
      newChoiceEle = createNewAnswer("checkbox",parent);
    } else {
      newChoiceEle = createNewAnswer("radio",parent);
    }

    parent.insertBefore(newChoiceEle, currentEle);
  }
});
function countNumberOfAnswers(question) {
  return question.querySelectorAll(".answer-option").length;
}
function createNewQuestion( index ,questionInput = '') {
  const newQuestionEle = document.createElement("div");
  newQuestionEle.classList.add("question");
  newQuestionEle.classList.add("form-group");
  newQuestionEle.id = `question-${index}`;
  newQuestionEle.innerHTML = `
  <div class="questionAndIcon">
    <label for="">Question <span >${index + 1}</span></label>
    <button><i class="fas fa-trash-alt delete"></i></button>
  </div>
  <input  type="text" placeholder="Enter your question" maxlength="100" />
 `;

 newQuestionEle.querySelector('input').value = questionInput;


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
    questionID++;
  return newQuestionEle;
}
function createNewAnswer(type,parent,answerInput = '',isChecked = '') {
  console.log("parent",parent);
  console.log("parent",parent.id);
  const newChoiceEle = document.createElement("div");
  newChoiceEle.classList.add("answer-option");
  newChoiceEle.classList.add("form-group");
  newChoiceEle.innerHTML = `
  <div class="choice-wrapper">
      <input type=${type} name="${parent.id}" id="answer1" ${isChecked} />  
      <input type="text" class="answer-input" placeholder="Type your answer here" maxlength="100" />
      <button class="delete-btn">
      <i class="fas fa-trash-alt"></i>
        </button>
  </div>`;

  newChoiceEle.querySelector(".answer-input").value = answerInput;
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
    notEmpty = CheckEmptyInput(answerInput);

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
function checkQuestionEmpty(question) {
  let emptyCounter = 0;
  const questionInput = question.querySelector("input");
  if (!CheckEmptyInput(questionInput)) {
    showError(questionInput, "Question can't be empty");
    emptyCounter++;
  } else {
    clearError(questionInput);
  }

  return emptyCounter;
}

function checkLongQuestion(question) {
  const questionInput = question.querySelector("input");
  if (!CheckInputLength(questionInput, 100)) {
    showError(questionInput, "Question can't be more than 100 characters");
    return true;
  } else {
    clearError(questionInput);
    return false;
  }
}

function checkLongAnswer(question) {
  const answers = question.querySelectorAll(".answer-option");
  answers.forEach(function (oneAnswer) {
    const answerInput = oneAnswer.querySelector(".answer-input");
    
    if (!CheckInputLength(answerInput, 100)) {
      showError(question.querySelector("input"), "Answer can't be more than 100 characters");
      return true;
    } else {
      clearError(question.querySelector("input"));
      return false;
    }
  });
}

function CheckInputLength(input,allowedLength){ 

  if (input.value.length > allowedLength){
    return false;
  }
  else{
    return true;
  }

}

saveBtnEle.addEventListener("click", function () {
  const allQuestions = questionContainer.querySelectorAll(".question");
  let validData = true;
  if (!CheckEmptyInput(quizTopicInputEle)) {
    showError(quizTopicInputEle, "Topic can't be empty");
    validData = false;
  }
  else if (!CheckInputLength(quizTopicInputEle,30)) {
    showError(quizTopicInputEle, "Topic can't be more than 30 characters");
  }
  else {
    clearError(quizTopicInputEle);
  }


  if (!CheckEmptyInput(quizDescriptionTextAreaEle)) {
    showError(quizDescriptionTextAreaEle, "Description can't be empty");
    validData = false;
  }
  else if (!CheckInputLength(quizDescriptionTextAreaEle,100)) {
    showError(quizDescriptionTextAreaEle, "Description can't be more than 200 characters");
  }
  else {
    clearError(quizDescriptionTextAreaEle);
  }


  allQuestions.forEach(function (question) {
    if (checkQuestionEmpty(question)) {
      validData = false;
      return;
    }
    else if (checkLongQuestion(question)) {
      validData = false;
      return;
    }

    if (anyAnswerEmpty(question)) {
      console.log("hi1");
      
      validData = false;
      return;
    }
    else if (checkLongAnswer(question)) {
      console.log("hi2");
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
  let response;
  if(editMode){
    console.log("hi",toUpdateQuiz.id);
   
    response = await fetch(`${API_URL}/updateQuiz/${toUpdateQuiz.id}`, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify(quiz),
      headers: {
          "Content-Type": "application/json"
      }
  
      
    });
  }
  else
  {
    response = await fetch(`${API_URL}/addQuiz`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(quiz),
      headers: {
          "Content-Type": "application/json"
      }
  
      
    });
  }
  

  let responseData = await response.json();
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

function CheckEmptyInput(questionInput) {
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



function clearError(inputElement) {
  const errorElement = inputElement.parentElement.querySelector(".error-message");
  if (errorElement) {
    errorElement.remove(); // Remove the error message
  }

  // Remove the invalid input class (optional)
  inputElement.classList.remove("invalid-input");
}


