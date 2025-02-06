const API_URL = 'http://127.0.0.1:5000';

const userName = document.querySelector(".user-name");
const quizTopic = document.querySelector(".quiz-topic");
const questionText = document.querySelector(".question-text");
const questionNumber = document.querySelector(".question-number");
const nextBtn = document.querySelector(".next");
const submitBtn = document.querySelector(".submit");
const finishBtn = document.querySelector(".finish");
const questionArea = document.querySelector(".question");
const quizContainer = document.querySelector(".quiz-space");
const logoutBtn = document.querySelector(".logout");
const exitBtn = document.querySelector(".exit");


let score = 0;



exitBtn.addEventListener("click", function () {
  localStorage.removeItem("userQuiz");
  window.location.href = "user.html";
})

async function logout() {
  const respone = await fetch(`${API_URL}/logout`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },


  });

  const responeData = await respone.json();
  console.log('logout',responeData);
  
  if (responeData.success === true) {
    localStorage.removeItem("name");
    localStorage.removeItem("userQuiz");
    window.location.href = "login.html";
  }

}

logoutBtn.addEventListener("click", logout);
let correctAnswers = [];
userName.textContent = localStorage.getItem("name");
const userQuiz = JSON.parse(localStorage.getItem("userQuiz"));

if (!userQuiz) {
  window.location.href = "user.html";
}
quizTopic.textContent = userQuiz.topic;
nextBtn.disabled = false;
let questionCounter = 0;
showQuestion(questionCounter);

finishBtn.addEventListener("click", function () {
  // quizContainer.classList.add("hide");
  quizContainer.innerHTML=``;
  const element = document.createElement("div");
  element.classList.add("finish");
  element.innerHTML = `
  <h2>Finished</h2>
  <h3>Score: ${score} / ${userQuiz.questions.length}</h3>
  `;
  quizContainer.appendChild(element);
  localStorage.removeItem("userQuiz");


    fetch(`${API_URL}/submitQuiz`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // name: localStorage.getItem("name"),
        score: score,
        quizID: userQuiz.id
      }),
    }).then((respone) => respone.json()).then((data) => {
      console.log(data);
    }).catch((error) => {
      console.log(error);
    })
    



});

nextBtn.addEventListener("click", function () {
  const allAnswers = questionArea.querySelectorAll(".answer-option");

  allAnswers.forEach(function (answer) {
    answer.remove();
  });

  showQuestion(questionCounter);
});

submitBtn.addEventListener("click", function () {
  let correctAnswer;
  const question = userQuiz.questions[questionCounter];
  const type = question.questionType;

  if (type === "paragraph") {
   return;
  }
  const answers = question.answers;
  let isQuestionCorrect = true;
  const AllchoicesInput = Array.from(questionArea.querySelectorAll(`input[type="${type}"]`));
  const choosedInput = Array.from(questionArea.querySelectorAll(`input[type="${type}"]:checked`));

  const AllchoicesIDs = AllchoicesInput.map(function (choice) {
    return choice.getAttribute("id");
  });
  const choosedIDs = choosedInput.map(function (choice) {
    return choice.getAttribute("id");
  });
  let AllchoicesLabels = AllchoicesIDs.map(function (id) {
    return questionArea.querySelector(`label[for="${id}"]`);
  });
  let choosedLables = choosedIDs.map(function (id) {
    return questionArea.querySelector(`label[for="${id}"]`).textContent;
  });

  console.log(choosedLables);
  console.log(AllchoicesLabels);
  console.log(correctAnswers);
  
  
  AllchoicesLabels.forEach(function (choice) {
    if (correctAnswers.includes(choice.textContent)) {
      choice.style.backgroundColor = "#198754";
      // if (choosedLables.includes(choice.textContent)) {
        
      //   }
    } else if (
      !correctAnswers.includes(choice.textContent) &&
      choosedLables.includes(choice.textContent)
    ) {
      choice.style.backgroundColor = "#DC3545";
      isQuestionCorrect = false;
    }
  });
  if (isQuestionCorrect) {
    score++;
  }
  questionCounter++;

  nextBtn.disabled = false;
  submitBtn.disabled = true;
});

console.log(userQuiz);

function showQuestion(QuestionNumber) {
  const question = userQuiz.questions[QuestionNumber];
  const answers = question.answers;

  questionNumber.textContent = `${QuestionNumber + 1}`;
  questionText.textContent = question.questionText;

  console.log(typeof question.questionType);

  if (question.questionType === "paragraph") {
    console.log("para");

    const answerOption = document.createElement("div");
    answerOption.classList.add("answer-option");
    answerOption.innerHTML = `
        <div class="choice-wrapper">
                <textarea name="" id=""></textarea>

                 </div>
       `;
    questionArea.appendChild(answerOption);
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

      questionArea.appendChild(answerOption);
    });
  }

  if (questionCounter + 1 === userQuiz.questions.length) {
    nextBtn.classList.add("hide");
    finishBtn.classList.remove("hide");
  }

  nextBtn.disabled = true;
  submitBtn.disabled = false;
}
