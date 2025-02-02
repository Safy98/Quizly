const form = document.querySelector("form");
const nameElement = document.getElementById("name");
const emailElement = document.getElementById("email");
const passwordElement = document.getElementById("password");
const confirmPasswordElement = document.getElementById("confirm-password");

form.addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent form submission
  clearErrors();
  // Get form inputs

  // Validation rules
  let isValid = true;

  // Name validation
  const name = nameElement.value.trim();
  if (!validateName(name)) {
    showError(nameElement, "Please enter a valid name");
    isValid = false;
  }

  // Email validation
  const email = emailElement.value.trim();
  if (!validateEmail(email)) {
    showError(emailElement, "Please enter a valid email address.");
    emailInput.focus();
    isValid = false;
  }

  // Password validation
  const password = passwordElement.value.trim();
  if (!validatePassword(password)) {
    showError(passwordElement, "Password must be at least 6 characters long.");
    passwordInput.focus();
    isValid = false;
  }

  // Confirm Password validation
  const confirmPassword = confirmPasswordElement.value.trim();
  if (password !== confirmPassword) {
    showError(confirmPasswordElement, "Passwords do not match.");

    isValid = false;
  }

  // If all validations pass, submit the form
  if (!isValid) return;


  sendRecieveData(name, email, password);
  // alert("Form submitted successfully!");
  // Uncomment the line below to submit the form
  // this.submit();
});

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function validateName(name) {
  // Regular expression to allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[A-Za-z'-]{3,}(?:\s[A-Za-z'-]{3,})*$/;
  return nameRegex.test(name);
}
function validatePassword(password) {
  return password.length >= 6;
}

function showError(input, message) {
  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.textContent = message;
  input.parentElement.appendChild(errorElement);
}

function clearErrors() {
  const errors = document.querySelectorAll(".error-message");
  errors.forEach((error) => error.remove());
}

async function sendRecieveData(name, email, password) {
  const data = {
    name: name,
    email: email,
    password: password,
  };
  const respone = await fetch("http://127.0.0.1:5000/register", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const responeData = await respone.json();

  if (responeData.success === true) {
    window.location.href = "user.html";
  } else {
    showError(emailElement, responeData.message);
    emailElement.focus();
  }
}
