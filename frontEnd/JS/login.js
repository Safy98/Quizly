const form = document.querySelector("form");
const emailElement = document.getElementById("email");
const passwordElement = document.getElementById("password");
const errorElement = document.querySelector(".welcome p");

form.addEventListener("submit", function (event) {
  event.preventDefault();
  clearErrors();

  let isValid = true;
 

  const email = emailElement.value.trim();
  if (!validateEmail(email)) {
    showError(emailElement, "Please enter a valid email address.");
    emailElement.focus();
    isValid = false;
  }

  const password = passwordElement.value.trim();
  if (!validatePassword(password)) {
    showError(passwordElement, "Password must be at least 6 characters long.");
    passwordElement.focus();
    isValid = false;
  }


  if(!isValid)
    return;

  sendRecieveData(email, password);
//   alert("Form submitted successfully!");
//   form.submit(); // Uncomment this line to actually submit the form
});

function validateEmail(email) {
  const emailRegex = /^(?=.{1,30}$)[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

async function  sendRecieveData(email, password)
{
    const data = {
        "email": email,
        "password": password
    };
    const respone = await fetch('http://127.0.0.1:5000/login', {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    });

    const responeData = await respone.json();
    console.log(responeData);
    
    if (responeData.success === true) {
        if (responeData.user.isAdmin === true){ 
            window.location.href = "admin.html";
        }else{

            window.location.href = "user.html";
        }

    }
    else{

        showError(errorElement, responeData.message);
       
    }


}
