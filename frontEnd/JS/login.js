import { CONFIG, validators, ErrorHandler, makeRequest  } from './utils/auth.js';

// DOM Elements
const elements = {
  form: document.querySelector("#loginForm"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  toast: document.getElementById("toast"),
  passwordErrorContainer: document.querySelector(".password-error-message"),
  emailErrorContainer: document.querySelector(".email-error-message"),

};
const generalErrorHandler = new ErrorHandler(null, elements.toast);
const emailErrorHandler = new ErrorHandler(elements.emailErrorContainer, elements.toast);
const passwordErrorHandler = new ErrorHandler(elements.passwordErrorContainer, elements.toast);

async function handleSubmit(event) {
  event.preventDefault();
  emailErrorHandler.clearError();
  passwordErrorHandler.clearError();
  
  const email = elements.email.value.trim();
  const password = elements.password.value.trim();
  let isvalid = true;
  // Validation
  if (!validators.email(email)) {
    emailErrorHandler.showError("Please enter a valid email address");
    elements.email.focus();
    isvalid = false;
}

  if (!validators.password(password)) {
    passwordErrorHandler.showError(
      `Password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters`
    );
    elements.password.focus();
    isvalid = false;
  }

  
  if (!isvalid){
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
    generalErrorHandler.showToast(error.message);
    
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
