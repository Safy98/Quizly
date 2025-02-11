import { CONFIG, validators, ErrorHandler, makeRequest  } from './utils/auth.js';

// DOM Elements
const elements = {
  form: document.querySelector("#loginForm"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  toast: document.getElementById("toast"),
  passwordErrorContainer: document.querySelector(".password-error-message"),
  emailErrorContainer: document.querySelector(".email-error-message"),
  lockPassIcon: document.querySelector(".passIcon"),

};
const generalErrorHandler = new ErrorHandler(null, elements.toast);
const emailErrorHandler = new ErrorHandler(elements.emailErrorContainer, elements.toast);
const passwordErrorHandler = new ErrorHandler(elements.passwordErrorContainer, elements.toast);

/**
 * Handles the login form submission.
 * 
 * Prevents the default form submission.
 * Checks if the email and password are valid.
 * If the input is invalid, it shows an error message and focuses on the invalid input.
 * If the input is valid, it makes a POST request to the /login endpoint.
 * If the login is successful, it redirects the user to user.html or admin.html based on the user's role.
 * If the login fails, it shows an error message and focuses on the password input.
 */
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


elements.lockPassIcon.addEventListener("click", () => {
    elements.password.type = elements.password.type === "password" ? "text" : "password";
    elements.lockPassIcon.querySelector('i').classList.toggle("fa-lock");
    elements.lockPassIcon.querySelector('i').classList.toggle("fa-unlock");
})