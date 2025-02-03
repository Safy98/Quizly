const quizTopic = document.querySelector(".quiz-topic");
const questionText = document.querySelector(".question-text");
const questionNumber = document.querySelector(".question-number");
// const answerOptions = document.querySelector(".answer-options");
const nextBtn = document.querySelector(".next");
const questionArea = document.querySelector(".question");

const userQuiz = JSON.parse(localStorage.getItem("userQuiz"));
quizTopic.textContent = userQuiz.topic;

let questionCounter = 0 ;
showQuestion(questionCounter);

nextBtn.addEventListener("click",function(){


    


})


console.log(userQuiz);

function showQuestion(QuestionNumber){
    
    const question = userQuiz.questions[QuestionNumber];
    const answers = question.answers;

    questionNumber.textContent = `${QuestionNumber+1}`;
    questionText.textContent = question.questionText;

    answers.forEach((answer,index) => {
        const answerOption = document.createElement("div");
        answerOption.classList.add("answer-option");

        // if (question.questionType ==='paragraph' )
        // {
        //     answerOption.innerHTML = `
        //     <div class="choice-wrapper">
        //             <textarea name="" id=""></textarea>

        //              </div>
        //    `;
        //    console.log('hi');
           
        // }
        // else{
            answerOption.innerHTML = `
            <div class="choice-wrapper">
                       <input type="${question.questionType
                       }" name="answer" id="${index}" />
                       <label for="${index}">${answer. answerText}</label>
                     </div>
           
           `
        // }

        
        questionArea.appendChild(answerOption);
    })

}

