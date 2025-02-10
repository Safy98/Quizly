import { CONFIG, makeRequest, ErrorHandler } from './utils/auth.js';
import { createCard, handleFilter, handleLogout } from './utils/shared.js';

// DOM Elements
const elements = {
    contentEmpty: document.querySelector(".content-empty"),
    quizSpace: document.querySelector(".content .container"),
    userName: document.querySelector(".user-name"),
    logoutBtn: document.querySelector(".logout"),
    filterBtn: document.querySelector(".filter-btn"),
    filterArea: document.querySelector(".filterTopics"),
    filterTitle: document.querySelector(".counter span"),
    toast: document.getElementById("toast"),
};

const errorHandler = new ErrorHandler(null, elements.toast);

// Constants
const SELECTORS = {
    START_BTN: ".start",
    QUIZ_TOPIC: ".quiz-topic",
};

// Event Handlers
const handleStartQuiz = async (id) => {
    try {
        const response = await makeRequest(`/getQuiz/${id}`, 'GET');
        if (response.success) {
            localStorage.setItem("userQuiz", JSON.stringify(response.quiz));
            window.location.href = "quiz.html";
        }
    } catch (error) {
        errorHandler.showToast(error.message);
    }
};

const addQuizCard = (quizData, score) => {
    const { id, topic, level, description, NumberOfQuestions, created_at } = quizData;
    elements.quizSpace.insertAdjacentHTML(
        "beforeend",
        createCard({ id, topic, level, description, NumberOfQuestions, created_at }, false, score)
    );

    const newCard = document.getElementById(id);
    if (!newCard) return;

    const startBtn = newCard.querySelector(SELECTORS.START_BTN);
    
    startBtn?.addEventListener("click", () => handleStartQuiz(id));
        
   
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

const displayQuizes = ({ quizzes, user: { solved_quizzes } }, filter = 'all') => {
    elements.quizSpace.innerHTML = "";
    const hasQuizzes = quizzes.length > 0;
    
    elements.contentEmpty.classList.toggle("hide", hasQuizzes);
    elements.quizSpace.classList.toggle("flex-it", hasQuizzes);

    const solvedQuizMap = new Map(
        solved_quizzes.map(quiz => [quiz.id, quiz.score])
    );

    quizzes.forEach(quiz => {
        if (filter === "all" || filter === quiz.topic.toLowerCase()) {
            addQuizCard(quiz, solvedQuizMap.get(quiz.id));
        }
    });
};

// Initialize
const init = async () => {
    try {
        // Set username
        elements.userName.textContent = localStorage.getItem("name");

        // Add event listeners
        elements.filterBtn.addEventListener("click", () => handleFilter(elements.filterBtn, elements.filterArea));
        elements.logoutBtn.addEventListener("click", () => handleLogout(makeRequest));

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
        createTopicFilter(topics);

        // Display quizzes
        displayQuizes(data);
    } catch (error) {
        errorHandler.showToast(error.message);
    }
};

// Start the application
document.addEventListener('DOMContentLoaded', init);
