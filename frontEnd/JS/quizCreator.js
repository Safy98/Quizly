"use strict";
import { CONFIG, makeRequest, ErrorHandler, checkAuth } from "./utils/auth.js";
import { handleLogout, showError, clearError } from "./utils/shared.js";

const elements = {
  addQuestionBtn: document.querySelector(".add-btn"),
  saveBtn: document.querySelector(".save-btn"),
  questionType: document.querySelector("#question-type"),
  deleteQuestionBtn: document.querySelector(".questionAndIcon button"),
  questionsContainer: document.querySelector("#questions-container"),
  quizTopicInput: document.querySelector("#topic"),
  quizTopicEle : document.querySelector(".topic"),
  quizLevel: document.querySelector("#level"),
  quizDescription: document.querySelector("#description"),
  quizDescriptionEle : document.querySelector(".description"),
  logoutBtn: document.querySelector(".logout"),
  errorContainer: document.querySelector(".error-container"),
  toast: document.getElementById("toast"),
};
const errorHandler = new ErrorHandler(elements.errorContainer, elements.toast);
const LIMITS = {
  MAX_QUESTIONS: 5,
  MAX_ANSWERS: 5,
  MAX_TOPIC_LENGTH: 30,
  MAX_DESC_LENGTH: 100,
  MAX_QUESTION_LENGTH: 500,
  MAX_ANSWER_LENGTH: 500,
  MIN_ANSWERS: 2,
};

let state = {
  questionCounter: 0,
  questionID: 0,
  editMode: false,
  quizToUpdate: null,
};

const generateQuestionHTML = (index, questionInput = "") => `
    <div class="questionAndIcon">
        <label for="">Question <span>${index + 1}</span></label>
        <button><i class="fas fa-trash-alt delete"></i></button>
    </div>
    <div class="error-message" aria-live="polite"></div>
    <input type="text" placeholder="Enter your question" maxlength="${
      LIMITS.MAX_QUESTION_LENGTH
    }" value="${questionInput}" />
`;

const generateAnswerHTML = (
  type,
  parentId,
  answerInput = "",
  isChecked = ""
) => `
    <div class="error-message" aria-live="polite"></div>
    <div class="choice-wrapper">
        <input type="${type}" name="${parentId}" id="answer1" ${isChecked} />  
        <input type="text" class="answer-input" placeholder="Type your answer here" maxlength="${LIMITS.MAX_ANSWER_LENGTH}" value="${answerInput}" />
        <button class="delete-btn">
            <i class="fas fa-trash-alt"></i>
        </button>
    </div>
`;

const createNewQuestion = (index, questionInput = "") => {
  const element = document.createElement("div");
  element.classList.add("question", "form-group");
  element.id = `question-${state.questionID}`;
  element.innerHTML = generateQuestionHTML(index, questionInput);

  const deleteBtn = element.querySelector(".delete").parentElement;
  deleteBtn.addEventListener("click", () => {
    element.remove();
    state.questionCounter--;
    updateQuestionNumbers();
    clearError(elements.addQuestionBtn);
  });

  return element;
};

const createNewAnswer = (type, parent, answerInput = "", isChecked = "") => {
  const element = document.createElement("div");
  element.classList.add("answer-option", "form-group");
  element.innerHTML = generateAnswerHTML(
    type,
    parent.id,
    answerInput,
    isChecked
  );

  const deleteBtn = element.querySelector(".delete-btn");
  deleteBtn.addEventListener("click", () => {
    element.remove();
    clearError(parent.querySelector("input"));
  });

  return element;
};

const appendAddAnswerButton = () => {
  const element = document.createElement("div");
  element.classList.add("add-answer");
  element.innerHTML =
    '<button><i class="fa-solid fa-square-plus"></i>Add answer</button>';
  return element;
};

const validators = {
  input: (input, maxLength) => {

    const value = input.value.trim();
    return {
      isEmpty: value === "",
      isTooLong: value.length > maxLength,
    };
  },

  question: (question) => {
    const type = question.getAttribute("data-type");
    const answers = question.querySelectorAll(".answer-option");
    const questionInput = question.querySelector("input")
    let isValid = true;
    if (type === "paragraph") return true;

   
    
    const questionValidation = validators.input(questionInput, LIMITS.MAX_QUESTION_LENGTH);
    if (questionValidation.isEmpty || questionValidation.isTooLong) {
      showError(
        question,
        questionValidation.isEmpty
          ? "Question can't be empty"
          : `Question can't be more than ${LIMITS.MAX_QUESTION_LENGTH} characters`
      );
      return false;
    }

    answers.forEach((answer)=>{
      const answerInput = answer.querySelector('input[type="text"]');

      const answerValidation = validators.input(answerInput,LIMITS.MAX_ANSWER_LENGTH);
      if (answerValidation.isEmpty || answerValidation.isTooLong) {

        showError(
          answer,
          answerValidation.isEmpty
            ? "Answer can't be empty"
            : `Answer can't be more than ${LIMITS.MAX_ANSWER_LENGTH} characters`
        );
        isValid =  false;
      
    }})
    if (answers.length < LIMITS.MIN_ANSWERS) {
      showError(
        question,
        `A question must have at least ${LIMITS.MIN_ANSWERS} options`
      );
      return false;
    }

    const checkedAnswers = question.querySelectorAll(
      `input[type=${type}]:checked`
    ).length;
    if (type === "radio" && checkedAnswers === 0) {
      showError(question, "Please select an answer");
      return false;
    }
    if (type === "checkbox" && checkedAnswers < 2) {
      showError(
        question,
        "A Multiple choice question must have two options at least"
      );
      return false;
    }

    if (!isValid) return false;

    return true;
  },
};

const handleAddQuestion = () => {
  if (state.questionCounter >= LIMITS.MAX_QUESTIONS) {
    errorHandler.showToast("Maximum questions limit reached", true);
    return;
  }

  // clearError(elements.addQuestionBtn);
  const question = createNewQuestion(state.questionCounter);
  elements.questionsContainer.appendChild(question);

  const type = elements.questionType.value.toLowerCase();
  if (type !== "paragraph") {
    question.setAttribute(
      "data-type",
      type === "single" ? "radio" : "checkbox"
    );
    question.appendChild(
      createNewAnswer(type === "single" ? "radio" : "checkbox", question)
    );
    question.appendChild(
      createNewAnswer(type === "single" ? "radio" : "checkbox", question)
    );
    question.appendChild(appendAddAnswerButton());
  } else {
    question.setAttribute("data-type", "paragraph");
  }

  state.questionCounter++;
  state.questionID++;
};

const handleAddAnswer = (event) => {
  const addButton = event.target.closest(".add-answer button");
  if (!addButton) return;

  const question = addButton.closest(".question");
  if (countAnswers(question) >= LIMITS.MAX_ANSWERS) {
    errorHandler.showToast(
      `Maximum ${LIMITS.MAX_ANSWERS} answers allowed`,
      true
    );
    return;
  }

  const type = question.getAttribute("data-type");
  const newAnswer = createNewAnswer(type, question);
  question.insertBefore(newAnswer, addButton.parentElement);
  clearError(question.querySelector("input"));
};

const handleSave = async () => {
  try {
    if (!validateForm()) return;

    const quizData = collectData();
    const endpoint = state.editMode
      ? `/updateQuiz/${state.quizToUpdate.id}`
      : "/addQuiz";
    const method = state.editMode ? "PUT" : "POST";

    const response = await makeRequest(endpoint, method, quizData);
    if (response.success) {
      errorHandler.showToast("Quiz saved successfully!", false);
      setTimeout(
        () => (window.location.href = "admin.html"),
        CONFIG.TOAST_DURATION
      );
    }
  } catch (error) {
    console.error(error);
    
    errorHandler.showToast(error.message || "Failed to save quiz", true);
  }
};

const updateQuestionNumbers = () => {
  elements.questionsContainer
    .querySelectorAll(".question")
    .forEach((q, idx) => {
      q.querySelector("span").textContent = idx + 1;
    });
};

const countAnswers = (question) =>
  question.querySelectorAll(".answer-option").length;

const validateForm = () => {
  let isValid = true;
  errorHandler.clearError();
  clearError()



  const topicValidation = validators.input(
    elements.quizTopicInput,
    LIMITS.MAX_TOPIC_LENGTH
  );
  const descValidation = validators.input(
    elements.quizDescription,
    LIMITS.MAX_DESC_LENGTH
  );

  if (topicValidation.isEmpty || topicValidation.isTooLong) {
    
    showError(
      elements.quizTopicEle,
      topicValidation.isEmpty
        ? "Topic can't be empty"
        : `Topic can't be more than ${LIMITS.MAX_TOPIC_LENGTH} characters`
    );
    isValid = false;
  }

  if (descValidation.isEmpty || descValidation.isTooLong) {
    showError(
      elements.quizDescriptionEle,
      descValidation.isEmpty
        ? "Description can't be empty"
        : `Description can't be more than ${LIMITS.MAX_DESC_LENGTH} characters`
    );
    isValid = false;
  }

  if (state.questionCounter === 0) {
    errorHandler.showToast("Please add at least one question");
    isValid = false;
  }

  elements.questionsContainer
    .querySelectorAll(".question")
    .forEach((question) => {
      if (!validators.question(question)) {
        isValid = false;
      }
    });

  return isValid;
};

const collectData = () => ({
  topic: elements.quizTopicInput.value,
  level: elements.quizLevel.value,
  description: elements.quizDescription.value,
  questions: Array.from(
    elements.questionsContainer.querySelectorAll(".question")
  ).map((question) => ({
    questionText: question.querySelector("input").value,
    questionType: question.getAttribute("data-type"),
    answers: Array.from(question.querySelectorAll(".answer-option")).map(
      (answer) => ({
        answerText: answer.querySelector(".answer-input").value,
        isCorrect: answer.querySelector(
          `input[type=${question.getAttribute("data-type")}]`
        ).checked,
      })
    ),
  })),
});

const loadExistingQuiz = (quiz) => {
  elements.quizTopicInput.value = quiz.topic;
  elements.quizLevel.value = quiz.level;
  elements.quizDescription.value = quiz.description;

  quiz.questions.forEach((question, index) => {
    const questionElement = createNewQuestion(index, question.questionText);
    questionElement.setAttribute("data-type", question.questionType);

    question.answers.forEach((answer) => {
      questionElement.appendChild(
        createNewAnswer(
          question.questionType,
          questionElement,
          answer.answerText,
          answer.isCorrect ? "checked" : ""
        )
      );
    });

    if (question.questionType !== "paragraph") {
      questionElement.appendChild(appendAddAnswerButton());
    }

    elements.questionsContainer.appendChild(questionElement);
  });

  state.questionCounter = quiz.questions.length;
};

const init = () => {
  if (!checkAuth()) return;

  elements.addQuestionBtn.addEventListener("click", handleAddQuestion);
  elements.saveBtn.addEventListener("click", handleSave);
  elements.logoutBtn.addEventListener("click", () =>
    handleLogout(makeRequest, true)
  );
  elements.questionsContainer.addEventListener("click", handleAddAnswer);

  const savedQuiz = localStorage.getItem("quiz");
  if (savedQuiz) {
    try {
      state.editMode = true;
      state.quizToUpdate = JSON.parse(savedQuiz).quiz;
      loadExistingQuiz(state.quizToUpdate);
      localStorage.removeItem("quiz");
    } catch (error) {
      errorHandler.showToast("Failed to load quiz", true);
      window.location.href = "admin.html";
    }
  }
};

document.addEventListener("DOMContentLoaded", init);
