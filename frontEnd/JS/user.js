const API_URL = 'http://127.0.0.1:5000';

const contentEmpty = document.querySelector(".content-empty");
const quizSpace = document.querySelector(".content .container");
const quizCard = document.querySelector(".card");
const userName = document.querySelector(".user-name");
const startBtn = document.querySelector(".start");
const logoutBtn = document.querySelector(".logout");
const filterBtn =  document.querySelector(".filter-btn")
const filterArea = document.querySelector(".filterTopics");
const allFilter  = document.querySelector("#allFilter");
const FilterTitle = document.querySelector(".counter span");


console.log(filterArea);

let quizes;
filterBtn.addEventListener("click", function () {
  filterBtn.classList.toggle("rotate");
  console.log(quizes);
  filterArea.classList.toggle("hide");

  
  // displayQuizes(quizes,'python');
})


if (!localStorage.getItem("name")) {
  window.location.href = "login.html";
}
userName.textContent = localStorage.getItem("name");

const addQuiz = function (id, topic, level, description, questions, _ ,score) {
  console.log("score",score);
  
  const newCard = `
       <div class="card " id="${id}">
                  <div class="card-header">
                     
                  </div>
                  <div class="tags">
                      <span class="tag advance">${level}</span>
                      <span class="tag questions">${questions} questions</span>
                      <i class=" ${score? "solved" : "not-solved"} fa-solid fa-${score? "check-square" : "times-circle"}"></i>
                      

                  <!--    <span class="tag ${score? "solved" : "not-solved"}">${score? "Solved" : "Not Solved"}</span> -->
                  </div>
                  <div class="card-content">
                      <h2 class="language">${topic}</h2>
                      <p class="description">${description}</p>
                        <button class="btn start">Start</button>
                        <span class="score ">Score: ${score? score : "0"} / ${questions}</span>
    
  
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
({quizes} = data);

const quizesTopics = new Set(quizes.map((quiz) => quiz.topic.toLowerCase().trim().replace(/^\w/, (c) => c.toUpperCase())));

let quizesTopicsArr = Array.from(quizesTopics);
quizesTopicsArr.unshift("All");

  console.log(quizesTopicsArr);
  
  quizesTopicsArr.forEach((topic) => {
    const newTopic = document.createElement("div");
    newTopic.classList.add("quiz-topic");
    newTopic.classList.add("tag");
    newTopic.innerHTML = `
          <button>${topic}</button>

    `;
   
    // newTopic.textContent = topic;
    filterArea.appendChild(newTopic);

    newTopic.addEventListener("click", function () {
      displayQuizes(data, topic.toLowerCase());
      FilterTitle.textContent =( topic === 'All'? 'All Quizzes' : topic);
    });
  })



  displayQuizes(data,'all');
}

function displayQuizes({ quizes , user:{solved_quizzes}},filter) {

  quizSpace.innerHTML = "";
  console.log(solved_quizzes);
  if (quizes.length === 0) {
    contentEmpty.classList.remove("hide");
    quizSpace.classList.remove("flex-it");
  } else {
    contentEmpty.classList.add("hide");
    quizSpace.classList.add("flex-it");
  }

  const ids = solved_quizzes.map((quiz) => quiz.id);
  console.log(ids);
  console.log(ids.indexOf(1));
  
  
  
  quizes.forEach((quiz) => {
    let score;
    if (filter !== "all" && filter !== quiz.topic.toLowerCase()) return;

    if (ids.includes(quiz.id)) {
     
      score = solved_quizzes[ ids.indexOf(quiz.id)].score;
      console.log(score);
      
    }
    addQuiz(
      quiz.id,
      quiz.topic,
      quiz.level,
      quiz.description,
      quiz.NumberOfQuestions,
      quiz.created_at.split("T")[0],
      score
    );
  });
}






getQuizes();
