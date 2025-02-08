import { CONFIG, validators, ErrorHandler, makeRequest , checkAuth } from './utils/auth.js';

// DOM Elements
const elements = {
  form: document.querySelector("#loginForm"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  toast: document.getElementById("toast"),
  errorContainer: document.querySelector(".error-message"),
};

const errorHandler = new ErrorHandler(elements.errorContainer, elements.toast);

async function handleSubmit(event) {
  event.preventDefault();
  errorHandler.clearError();

  const email = elements.email.value.trim();
  const password = elements.password.value.trim();

  // Validation
  if (!validators.email(email)) {
    errorHandler.showToast("Please enter a valid email address");
    elements.email.focus();
    return;
  }

  if (!validators.password(password)) {
    errorHandler.showToast(
      `Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters`
    );
    elements.password.focus();
    return;
  }

  try {
    const response = await makeRequest('/login', 'POST', { email, password });

    if (response.success) {
      if (response.user.isAdmin) {
        localStorage.setItem("admin", true);
        window.location.href = "admin.html";
      } else {
        localStorage.setItem("name", response.user.name.split(" ")[0]);
        window.location.href = "user.html";
      }
    }
  } catch (error) {
    errorHandler.showToast(error.message);
    
    if (error.message === CONFIG.ERROR_MESSAGES.AUTH_FAILED) {
      elements.password.value = "";
      elements.password.focus();
    }
  }
}

// Event listeners
elements.form.addEventListener("submit", handleSubmit);

// elements.email.addEventListener(
//   "input",
//   debounce(() => {
//     if (elements.email.value && !validators.email(elements.email.value.trim())) {
//       errorHandler.showError("Please enter a valid email address");
//     } else {
//       errorHandler.clearError();
//     }
//   }, 500)
// );
