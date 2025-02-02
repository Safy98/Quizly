const addQuizBtn1 = document.querySelector(".add-quiz-btn1");
const addQuizBtn2 = document.querySelector(".add-quiz-btn2");
const contentEmpty = document.querySelector(".content-empty");
const quizSpace = document.querySelector(".content .container");
const quizCard = document.querySelector(".card");

const addQuiz = function (id,topic, level, description, questions,date) {
 
  const newCard = `
     <div class="card " id="${id}">
                <div class="card-header">
                    <div class="date">${date}</div>
                    <div class="actions">
                        <button> <i class="fas fa-pen"></i></button>
                        <button><i class="fas fa-trash-alt delete"></i></button>
                       
                    </div>
                </div>
                <div class="tags">
                    <span class="tag advance">${level}</span>
                    <span class="tag questions">${questions} questions</span>
                </div>
                <div class="card-content">
                    <h2 class="language">${topic}</h2>
                    <p class="description">${description}</p>
                    <button class="btn">View</button>
                </div>
            </div>

    `;

    console.log(id);
    
    quizSpace.insertAdjacentHTML("beforeend", newCard);

    const newCardEle =document.getElementById(id);
    const deleteBtn =newCardEle.querySelector("button i.delete");
    deleteBtn.addEventListener("click", function () {
    
     deleteQuiz(id);
     
    });
};


async function deleteQuiz(id) { 

    const responseData = await fetch(`http://127.0.0.1:5000/deleteQuiz/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await responseData.json();
       
      if (data.success === true) {
        window.location.reload();
      }

  }



async function getQuizes() {
  const responseData = await fetch("http://127.0.0.1:5000/getQuizes");
  const data = await responseData.json();
  
  displayQuizes(data);
}
console.log(quizSpace.lastElementChild);


function displayQuizes({quizes}) {
    if (quizes.length === 0) {
      contentEmpty.classList.remove("hide");
      addQuizBtn2.classList.add("hide");
      quizSpace.classList.remove("flex-it");
    }
    else{
      contentEmpty.classList.add("hide");
      addQuizBtn2.classList.remove("hide");
      quizSpace.classList.add("flex-it");
    }
  quizes.forEach((quiz) => {
    addQuiz(quiz.id,quiz.topic, quiz.level, quiz.description, quiz.questions.length,quiz.created_at.split("T")[0]);
  });
}

getQuizes();
