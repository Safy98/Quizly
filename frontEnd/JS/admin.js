const API_URL = 'http://127.0.0.1:5000';

const addQuizBtn1 = document.querySelector(".add-quiz-btn1");
const addQuizBtn2 = document.querySelector(".add-quiz-btn2");
const contentEmpty = document.querySelector(".content-empty");
const quizSpace = document.querySelector(".content .container");
const quizCard = document.querySelector(".card");
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
const addQuiz = function (id,topic, level, description, questions,date) {
 
  const newCard = `
     <div class="card " id="${id}">
                <div class="card-header">
                    <div class="date">${date}</div>
                    <div class="actions">
                        <!-- <button class="edit"> <i class="fas fa-pen"></i></button> -->
                        <button class  = "delete" ><i class="fas fa-trash-alt "></i></button>
                       
                    </div>
                </div>
                <div class="tags">
                    <span class="tag advance">${level}</span>
                    <span class="tag questions">${questions} questions</span>
                </div>
                <div class="card-content">
                    <h2 class="language">${topic}</h2>
                    <p class="description">${description}</p>
                      <button class="btn edit">Edit</button>
  

                </div>
            </div>

    `;

    console.log(id);
    
    quizSpace.insertAdjacentHTML("beforeend", newCard);

    const newCardEle =document.getElementById(id);
    const deleteBtn =newCardEle.querySelector(".delete");
    const editBtn =newCardEle.querySelector(".edit");
    deleteBtn.addEventListener("click", function () {
    
     deleteQuiz(id);
     
    });

    editBtn.addEventListener("click", function () {
      // window.location.href = `editQuiz.html?id=${id}`;
      getQuiz(id);
    });
};

async function getQuiz(id) {
  try {
    const response = await fetch(`${API_URL}/getQuiz/${id}`,{
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
  
  
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch quiz: ${response.statusText}`);
    }
    const data = await response.json();
    localStorage.setItem("quiz", JSON.stringify(data));
    window.location.href = `quizCreator.html`;
    console.log(data);
  } catch (error) {
    console.log(error);
  }
 
  
}
// async function editQuiz(id) {

//   const responseData = await fetch(`${API_URL}/editQuiz/${id}`, {
 
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });
//   const data = await responseData.json();
//   console.log(data);
  // window.location.href = `editQuiz.html?id=${id}&topic=${data.topic}&level=${data.level}&description=${data.description}`;

  // data.questions.forEach((question) => {
  //   const newQuestion = `
  //   <div class="question">
  //   <div class="questionAndIcon">
  //   <label for="">Question <span>${question.id}</span></label>
  //   <button><i class="fas fa-trash-alt delete"></i></button>
  //   </div>
  //   <input  type="text" placeholder="Enter your question" value="${question.question}"/>
  // </div>
  //   `;
  //   questionContainer.insertAdjacentHTML("beforeend", newQuestion);
  // });



// }

async function deleteQuiz(id) { 

    const responseData = await fetch(`${API_URL}/deleteQuiz/${id}`, {
        method: "DELETE",
        credentials: "include",
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
    addQuiz(quiz.id,quiz.topic, quiz.level, quiz.description,quiz.NumberOfQuestions,quiz.created_at.split("T")[0]);
  });
}


// window.onload = function () {

//   const respone = fetch(`${API_URL}/isAdminLoggedIn`, 
//   {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });
//   const responeData = respone.json();
//   console.log(responeData);
//   responeData.then((data) => 
//   {
    
//   })
//   .catch((error) => {
//     console.log(error);
//   });

// }

// window.addEventListener("load", function() {
//   if (document.referrer === "") {
//     const respone = fetch(`${API_URL}/isLoggedIn`, 
//         {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//           },
//         });
//         const responeData = respone.json();
//         console.log(responeData);
//         // responeData.then((data) => 
//         // {
          
//         // })
//         // .catch((error) => {
//         //   console.log(error);
//         // });



//   } else {
//       console.log("User was redirected from:", document.referrer);
//   }
// });


getQuizes();
