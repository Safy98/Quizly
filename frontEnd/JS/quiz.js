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

// let currentQuestion = {

// }

let score = 0;
let questionCounter = 0;
let correctAnswers = [];
let answers;
let question;
let quizid;
// Initialize
const init = async () => {
  quizid = localStorage.getItem("quizid");
  try {
    const response = await makeRequest(`/startQuiz/${quizid}`, "POST");

    if (response.success) {
      if (response.completed) {
        finishQuiz();
      } else {
        ({ question } = response);
        answers = question.answers;
        elements.quizTopic.textContent = response.topic;

        elements.userName.textContent = localStorage.getItem("name");

        // Add event listeners

        elements.logoutBtn.addEventListener("click", () => handleLogout(makeRequest));
        elements.finishBtn.addEventListener("click", finishQuiz);
        elements.submitBtn.addEventListener("click", checkAnswer);

        elements.exitBtn.addEventListener("click", () => {
          window.location.href = "user.html";
        });

        elements.nextBtn.disabled = false;

        showQuestion();
      }
    }
    // else {
    //   throw new Error(response.message);
    // }
  } catch (error) {
    elements.quizContainer.innerHTML = "";
    errorHandler.showToast(error.message);
  }
};

// Start the application
document.addEventListener("DOMContentLoaded", init);

function showResult() {
  elements.quizContainer.innerHTML = ``;
  const element = document.createElement("div");
  element.classList.add("result-container");
  element.innerHTML = `
 <p class = 'congrats' >Congratulations!</p>
        <p>You've completed the quiz!</p>
        <p class="score">Your Score: <span id="userScore">${score}/${questionCounter}</span></p>
        <a href="user.html" class="button">Return to home page</a>
 `;
  elements.quizContainer.appendChild(element);
}

async function finishQuiz() {
  try {
    const data = await makeRequest(`/submitQuiz`, "POST", {
      score: score,
      quizId: quizid,
    });

    if (data.success) {
      showResult();
    }
  } catch (error) {
    errorHandler.showToast(error.message);
  }
}

async function getNextQuestion() {
  try {
    const response = await makeRequest(`/nextQuestion`, "POST", { score });
    if (response.success) {
      if (response.completed) {
        elements.nextBtn.classList.add("hide");
        elements.finishBtn.classList.remove("hide");
        elements.finishBtn.disabled = false;
      } else {
        ({ question } = response);
        answers = question.answers;
      }
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

  showQuestion();
});

function checkAnswer() {
  const type = question.questionType;

  if (type === "paragraph") {
    return;
  }
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
    return elements.questionArea.querySelector(`label[for="${id}"]`).textContent;
  });

  for (let i = 0; i < AllchoicesLabels.length; i++) {
    let choice = AllchoicesLabels[i];

    if (correctAnswers.includes(choice.textContent)) {
      choice.style.borderColor = "#0d9488";
      if (type === "radio") {
        continue;
      }
    } else if (
      !correctAnswers.includes(choice.textContent) &&
      choosedLables.includes(choice.textContent)
    ) {
      choice.style.borderColor = "#DC3545";
      isQuestionCorrect = false;
    }

    if (correctAnswers.length !== choosedLables.length) {
      isQuestionCorrect = false;
    }
  }

  if (isQuestionCorrect) {
    score++;
  }

  correctAnswers.length = 0;

  elements.nextBtn.disabled = false;
  elements.submitBtn.disabled = true;
  // elements.finishBtn.disabled = false;

  getNextQuestion();
}

function showQuestion() {
  questionCounter++;
  const questionNumber = question.questionNumber;
  const questionsleft = question.questionsleft;
  elements.questionNumber.textContent = `${questionNumber}`;
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

  elements.nextBtn.disabled = true;
  elements.submitBtn.disabled = false;
}
