const API_URL = 'http://127.0.0.1:5000';

const contentEmpty = document.querySelector(".content-empty");
const quizSpace = document.querySelector(".content .container");
const quizCard = document.querySelector(".card");
const userName = document.querySelector(".user-name");
const startBtn = document.querySelector(".start");
const logoutBtn = document.querySelector(".logout");

if (!localStorage.getItem("name")) {
  window.location.href = "login.html";
}
userName.textContent = localStorage.getItem("name");

const addQuiz = function (id, topic, level, description, questions, date) {
  const newCard = `
       <div class="card " id="${id}">
                  <div class="card-header">
                     
                  </div>
                  <div class="tags">
                      <span class="tag advance">${level}</span>
                      <span class="tag questions">${questions} questions</span>
                  </div>
                  <div class="card-content">
                      <h2 class="language">${topic}</h2>
                      <p class="description">${description}</p>
                        <button class="btn start">Start</button>
    
  
                  </div>
              </div>
  
      `;

  quizSpace.insertAdjacentHTML("beforeend", newCard);

  const newCardEle = document.getElementById(id);
  const startBrn = newCardEle.querySelector(".start");
  startBrn.addEventListener("click", function () {

   startQuiz(id); 

});
};

logoutBtn.addEventListener("click", function () {
  localStorage.removeItem("name");
  window.location.href = "login.html";
})


async function startQuiz(id) {

    const respone = await fetch(`${API_URL}/getQuiz/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const responeData = await respone.json();
      if (responeData.success === true) {
        let {quiz} = responeData;
        console.log(quiz);
        localStorage.setItem("userQuiz", JSON.stringify(quiz));
        window.location.href = `quiz.html`;
      }
      else
      {
        // ! handle errors
      }



}

async function getQuizes() {
  const responseData = await fetch(`${API_URL}/getQuizes`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
  }); 
   const data = await responseData.json();

console.log(data);

  displayQuizes(data);
}

function displayQuizes({ quizes }) {
  if (quizes.length === 0) {
    contentEmpty.classList.remove("hide");
    quizSpace.classList.remove("flex-it");
  } else {
    contentEmpty.classList.add("hide");
    quizSpace.classList.add("flex-it");
  }
  quizes.forEach((quiz) => {
    addQuiz(
      quiz.id,
      quiz.topic,
      quiz.level,
      quiz.description,
      quiz.NumberOfQuestions,
      quiz.created_at.split("T")[0]
    );
  });
}






getQuizes();
