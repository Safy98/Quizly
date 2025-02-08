import { CONFIG, validators, ErrorHandler, makeRequest } from './utils/auth.js';

// DOM Elements
const elements = {
    form: document.querySelector("#signupForm"),
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirm-password"),
    toast: document.getElementById("toast"),
    errorContainer: document.querySelector(".error-message"),
};

const errorHandler = new ErrorHandler(elements.errorContainer, elements.toast);

async function handleSubmit(event) {
    event.preventDefault();
    errorHandler.clearError();

  let responseMessage;

    const name = elements.name.value.trim();
    const email = elements.email.value.trim();
    const password = elements.password.value.trim();
    const confirmPassword = elements.confirmPassword.value.trim();

    // Validations
    if (!validators.name(name)) {
        errorHandler.showError("Please enter a valid name");
        elements.name.focus();
        return;
    }

    if (!validators.email(email)) {
        errorHandler.showError("Please enter a valid email address");
        elements.email.focus();
        return;
    }

    if (!validators.password(password)) {
        errorHandler.showError(`Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters`);
        elements.password.focus();
        return;
    }

    if (password !== confirmPassword) {
        errorHandler.showError("Passwords do not match");
        elements.confirmPassword.focus();
        return;
    }

    try {
        const response = await makeRequest('/register', 'POST', { name, email, password });
        responseMessage = response.message;
        if (response.success) {
          errorHandler.showToast(responseMessage,false)
            localStorage.setItem("name", response.user.name.split(" ")[0]);
            console.log(response);
            
            window.location.href = "user.html";
        }
    } catch (error) {
        errorHandler.showToast(error.message);
    }
}

// Event listeners
elements.form.addEventListener("submit", handleSubmit);

// Input validation
// elements.email.addEventListener(
//     "input",
//     debounce(() => {
//         if (elements.email.value && !validators.email(elements.email.value.trim())) {
//             errorHandler.showError("Please enter a valid email address");
//         } else {
//             errorHandler.clearError();
//         }
//     }, 500)
// );
