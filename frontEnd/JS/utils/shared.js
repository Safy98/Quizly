// Common DOM utility functions
export const createCard = (quiz, isAdmin = false, score = null) => `
    <div class="card" id="${quiz.id}">
        <div class="card-header">
            ${isAdmin ? `
                <div class="date">${quiz.created_at.split("T")[0]}</div>
                <div class="actions">
                    <button class="delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            ` : ''}
        </div>
        <div class="tags">
            <span class="tag advance">${quiz.level}</span>
            <span class="tag questions">${quiz.NumberOfQuestions} questions</span>
            ${!isAdmin ? `
                <i class="${score ? "solved" : "not-solved"} fa-solid fa-${score ? "check-square" : "times-circle"}"></i>
            ` : ''}
        </div>
        <div class="card-content">
            <h2 class="language">${quiz.topic}</h2>
            <p class="description">${quiz.description}</p>
            <button class="btn ${isAdmin ? 'edit' : 'start'}">${isAdmin ? 'Edit' : 'Start'}</button>
            ${!isAdmin ? `<span class="score">Score: ${score || "0"} / ${quiz.NumberOfQuestions}</span>` : ''}
        </div>
    </div>
`;

// Common event handlers
export const handleFilter = (filterBtn, filterArea) => {
    filterBtn.classList.toggle("rotate");
    filterArea?.classList.toggle("hide");
};

export const handleLogout = async (makeRequest, isAdmin = false) => {
    try {
        const response = await makeRequest('/logout', 'POST');
        if (response.success) {
            localStorage.removeItem(isAdmin ? "admin" : "name");
            window.location.href = "login.html";
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
};

export const showError = (element, message) => {
   
    const errorElement = element.querySelector(".error-message");
    
    errorElement.textContent = message;
    
    
    element.classList.add("invalid-input");
};

export const clearError = () => {
    const errorElements = document.querySelectorAll(".error-message");
    const errorinputs = document.querySelectorAll(".invalid-input");
    errorElements.forEach((error)=>{
        error.textContent= "";
    })
    errorinputs.forEach((error)=>{
        error.classList.remove("invalid-input");

    })
}; 
 

