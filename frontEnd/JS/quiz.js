import { CONFIG, makeRequest, ErrorHandler } from "./utils/auth.js";
import { createCard, handleFilter, handleLogout } from "./utils/shared.js";

const elements = {
  userName: document.querySelector(".user-name"),
  quizTopic: document.querySelector(".quiz-topic"),
  questionText: document.querySelector(".question-text"),
  questionNumber: document.querySelector(".question-number"),
  nextBtn: document.querySelector(".next"),
  submitBtn: document.querySelector(".submit"),
  finishBtn: document.querySelector(".finish"),
  questionArea: document.querySelector(".question"),
  quizContainer: document.querySelector(".quiz-space"),
  logoutBtn: document.querySelector(".logout"),
  exitBtn: document.querySelector(".exit"),
  toast: document.getElementById("toast"),
  errorContainer: document.querySelector(".error-container"),
};

const errorHandler = new ErrorHandler(elements.errorContainer, elements.toast);

let questionCounter = 0;
let score = 0;

let correctAnswers = [];
let userQuiz;

// Initialize
const init = async () => {
  try {
    userQuiz = JSON.parse(localStorage.getItem("userQuiz"));

    if (!userQuiz) {
      window.location.href = "user.html";
      
    }
    // Set username
    elements.userName.textContent = localStorage.getItem("name");

    // Add event listeners

    elements.logoutBtn.addEventListener("click", () =>
      handleLogout(makeRequest)
    );
    elements.finishBtn.addEventListener("click", finishQuiz);
    elements.submitBtn.addEventListener("click", checkAnswer);

    elements.exitBtn.addEventListener("click", () => {
      localStorage.removeItem("userQuiz");
      window.location.href = "user.html";
    });

    elements.quizTopic.textContent = userQuiz.topic;
    elements.nextBtn.disabled = false;

    showQuestion(questionCounter);
  } catch (error) {
    errorHandler.showToast(error.message);
    throw error;
  }
};

// Start the application
document.addEventListener("DOMContentLoaded", init);

function showResult(){

  elements.quizContainer.innerHTML = ``;
  const element = document.createElement("div");
  element.classList.add("finish");
  element.innerHTML = `
 <h2>Finished</h2>
 <h3>Score: ${score} / ${userQuiz.questions.length}</h3>
 `;
  elements.quizContainer.appendChild(element);
  localStorage.removeItem("userQuiz");
}

async function finishQuiz() {

  try {

    const data = await makeRequest(`/submitQuiz`, "POST", {
      score: score,
      quizId: userQuiz.id,
    });

    if (data.success) {
      showResult();
    }

  } catch (error) {

    errorHandler.showToast(error.message);
  }
}

elements.nextBtn.addEventListener("click", function () {
  const allAnswers = elements.questionArea.querySelectorAll(".answer-option");

  allAnswers.forEach(function (answer) {
    answer.remove();
  });

  showQuestion(questionCounter);
});

function checkAnswer(){
  const question = userQuiz.questions[questionCounter];
  const type = question.questionType;

  if (type === "paragraph") {
    return;
  }
  const answers = question.answers;
  let isQuestionCorrect = true;
  const AllchoicesInput = Array.from(
    elements.questionArea.querySelectorAll(`input[type="${type}"]`)
  );
  const choosedInput = Array.from(
    elements.questionArea.querySelectorAll(`input[type="${type}"]:checked`)
  );

  if (choosedInput.length === 0) {
    errorHandler.showToast("Please select an answer");
    return;
  } else {
    errorHandler.hideToast(elements.questionArea);
  }

  const AllchoicesIDs = AllchoicesInput.map(function (choice) {
    return choice.getAttribute("id");
  });
  const choosedIDs = choosedInput.map(function (choice) {
    return choice.getAttribute("id");
  });
  let AllchoicesLabels = AllchoicesIDs.map(function (id) {
    return elements.questionArea.querySelector(`label[for="${id}"]`);
  });
  let choosedLables = choosedIDs.map(function (id) {
    return elements.questionArea.querySelector(
      `label[for="${id}"]`
    ).textContent;
  });

  
  for (let i = 0; i < AllchoicesLabels.length; i++) {
    let choice = AllchoicesLabels[i];

    if (correctAnswers.includes(choice.textContent)) {
      choice.style.backgroundColor = "#198754";
      if (type === "radio") {
        break;
      }
    } else if (
      !correctAnswers.includes(choice.textContent) &&
      choosedLables.includes(choice.textContent)
    ) {
      choice.style.backgroundColor = "#DC3545";
      isQuestionCorrect = false;
    }
  }

  if (isQuestionCorrect) {
    score++;
  }
  questionCounter++;

  elements.nextBtn.disabled = false;
  elements.submitBtn.disabled = true;
  elements.finishBtn.disabled = false;

}


function showQuestion(QuestionNumber) {
  const question = userQuiz.questions[QuestionNumber];
  const answers = question.answers;

  elements.questionNumber.textContent = `${QuestionNumber + 1}`;
  elements.questionText.textContent = question.questionText;

  if (question.questionType === "paragraph") {
    const answerOption = document.createElement("div");
    answerOption.classList.add("answer-option");
    answerOption.innerHTML = `
        <div class="choice-wrapper">
                <textarea name="" id=""></textarea>

                 </div>
       `;
    elements.questionArea.appendChild(answerOption);
  } else {
    answers.forEach((answer, index) => {
      const answerOption = document.createElement("div");
      answerOption.classList.add("answer-option");

      answerOption.innerHTML = `
            <div class="choice-wrapper">
                       <input type="${question.questionType}" name="answer" id="${index}" />
                       <label for="${index}">${answer.answerText}</label>
                     </div>
           
           `;

      if (answer.isCorrect) {
        correctAnswers.push(answer.answerText);
      }

      elements.questionArea.appendChild(answerOption);
    });
  }

  if (questionCounter + 1 === userQuiz.questions.length) {
    elements.nextBtn.classList.add("hide");
    elements.finishBtn.classList.remove("hide");
    elements.finishBtn.disabled = true;

  }

  elements.nextBtn.disabled = true;
  elements.submitBtn.disabled = false;
}
