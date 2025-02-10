import { CONFIG, validators, ErrorHandler, makeRequest } from './utils/auth.js';

// DOM Elements
const elements = {
    form: document.querySelector("#signupForm"),
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirm-password"),
    toast: document.getElementById("toast"),
    nameErrorContainer: document.querySelector(".name-error-message"),
    emailErrorContainer: document.querySelector(".email-error-message"),
    passwordErrorContainer: document.querySelector(".password-error-message"),
    confPassErrorContainer: document.querySelector(".confirmPassword-error-message"),
};

const generalErrorHandler = new ErrorHandler(null, elements.toast);
const nameErrorHandler = new ErrorHandler(elements.nameErrorContainer,null);
const emailErrorHandler = new ErrorHandler(elements.emailErrorContainer, null);
const passwordErrorHandler = new ErrorHandler(elements.passwordErrorContainer, null);
const confPasswordErrorHandler = new ErrorHandler(elements.confPassErrorContainer, null);

async function handleSubmit(event) {
    event.preventDefault();

    console.log(elements.confPassErrorContainer);
    console.log(elements.nameErrorContainer);
    console.log(elements.emailErrorContainer);
    console.log(elements.confPassErrorContainer);
    generalErrorHandler.clearError();
    nameErrorHandler.clearError();
    emailErrorHandler.clearError();
    passwordErrorHandler.clearError();
    confPasswordErrorHandler.clearError();

    let isvalid = true;
  let responseMessage;

    const name = elements.name.value.trim();
    const email = elements.email.value.trim();
    const password = elements.password.value.trim();
    const confirmPassword = elements.confirmPassword.value.trim();

    // Validations
    if (!validators.name(name)) {
        nameErrorHandler.showError("Please enter a valid name");
        elements.name.focus();
        isvalid=false;
    }

    if (!validators.email(email)) {
        emailErrorHandler.showError("Please enter a valid email address");
        elements.email.focus();
        isvalid=false;    
    }

    if (!validators.password(password)) {
        passwordErrorHandler.showError(`Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters and contains special characters`);
        elements.password.focus();
        isvalid=false;    
    }

    if (password !== confirmPassword) {
        confPasswordErrorHandler.showError("Passwords do not match");
        elements.confirmPassword.focus();
        isvalid=false;    
    }

    if (!isvalid) {
        return;
    } 

    try {
        const response = await makeRequest('/register', 'POST', { name, email, password });
        responseMessage = response.message;
        if (response.success) {
            localStorage.setItem("name", response.user.name.split(" ")[0]);
            
            window.location.href = "user.html";
        }
    } catch (error) {
        generalErrorHandler.showToast(error.message);
    }
}

elements.form.addEventListener("submit", handleSubmit);


