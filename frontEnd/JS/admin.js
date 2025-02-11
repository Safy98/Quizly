import { CONFIG, makeRequest ,ErrorHandler } from './utils/auth.js';
import { createCard, handleFilter, handleLogout } from './utils/shared.js';

// DOM Elements
const elements = {
    addQuizBtn1: document.querySelector(".add-quiz-btn1"),
    addQuizBtn2: document.querySelector(".add-quiz-btn2"),
    contentEmpty: document.querySelector(".content-empty"),
    quizSpace: document.querySelector(".content .container"),
    logoutBtn: document.querySelector(".logout"),
    filterBtn: document.querySelector(".filter-btn"),
    filterArea: document.querySelector(".filterTopics"),
    filterTitle: document.querySelector(".counter span"),
    toast: document.getElementById("toast"),
};

// Constants
const SELECTORS = {
    DELETE_BTN: ".delete",
    EDIT_BTN: ".edit",
};
const errorHanlder = new ErrorHandler(null, elements.toast);

// Event Handlers
const handleDelete = async (id) => {
    try {
        const response = await makeRequest(`/deleteQuiz/${id}`, 'DELETE');
        if (response.success) {
            window.location.reload();
        }
    } catch (error) {
        errorHanlder.showToast('Delete failed:', error.message);
    }
};

const handleEdit = async (id) => {
    try {
        const response = await makeRequest(`/getQuiz/${id}`, 'GET');
        localStorage.setItem("quiz", JSON.stringify(response));
        window.location.href = "quizCreator.html";
    } catch (error) {
        errorHanlder.showToast('Edit failed:', error);
    }
};

const addQuizCard = (quizData) => {
    const { id, topic, level, description, NumberOfQuestions, created_at } = quizData;
    elements.quizSpace.insertAdjacentHTML(
        "beforeend", 
        createCard({ id, topic, level, description, NumberOfQuestions, created_at }, true)
    );

    const newCard = document.getElementById(id);
    if (!newCard) return;

    const deleteBtn = newCard.querySelector(SELECTORS.DELETE_BTN);
    const editBtn = newCard.querySelector(SELECTORS.EDIT_BTN);

    deleteBtn?.addEventListener("click", () => handleDelete(id));
    editBtn?.addEventListener("click", () => handleEdit(id));
};

const displayQuizes = ({ quizzes }, filter = 'all') => {
    
    const hasQuizzes = quizzes.length > 0;
    if (hasQuizzes)
        elements.quizSpace.innerHTML = "";
    
    elements.contentEmpty.classList.toggle("hide", hasQuizzes);
    elements.addQuizBtn2.classList.toggle("hide", !hasQuizzes);
    elements.quizSpace.classList.toggle("flex-it", hasQuizzes);

    quizzes.forEach(quiz => {
      if (filter === "all" || filter === quiz.topic.toLowerCase()) {
          addQuizCard(quiz);
      }
  });
};


const createTopicFilter = (topics) => {
  topics.forEach(topic => {
      const topicElement = document.createElement("div");
      topicElement.classList.add("quiz-topic", "tag");
      topicElement.innerHTML = `<button>${topic}</button>`;
      
      topicElement.addEventListener("click", () => {
          displayQuizes(window.quizzesData, topic.toLowerCase());
          elements.filterTitle.textContent = topic === 'All' ? 'All Quizzes' : topic;
          
      });

      elements.filterArea.appendChild(topicElement);
  });
};

// Initialize
const init = async () => {
    try {
        // Add event listeners
        elements.filterBtn.addEventListener("click", () => handleFilter(elements.filterBtn, elements.filterArea));
        elements.logoutBtn.addEventListener("click", () => handleLogout(makeRequest, true));

        // Fetch and display quizzes
        const data = await makeRequest('/getQuizes', 'GET');
        window.quizzesData = data; // Store for filter usage

        
         // Create topic filters
         const topics = ['All', ...new Set(
          data.quizzes.map(quiz => 
              quiz.topic.toLowerCase()
                  .trim()
                  .replace(/^\w/, c => c.toUpperCase())
          )
      )];

      createTopicFilter(topics );

      displayQuizes(data);


    } catch (error) {
        errorHanlder.showToast('Initialization failed:', error.message);
    }
};

// Start the application
document.addEventListener('DOMContentLoaded', init);
