// Shared Constants
export const CONFIG = {
    API_URL: "http://127.0.0.1:5000",
    MIN_PASSWORD_LENGTH: 6,
    EMAIL_MAX_LENGTH: 30,
    TOAST_DURATION: 3000,
    ERROR_MESSAGES: {
        AUTH_FAILED: "Email and password doesn't match",
        SERVER_ERROR: "Couldn't connect to the server",
        EMAIL_EXISTS: "Email already exists",
    }
};

// Check Authentication
export const checkAuth = () => {
    const isAdmin = localStorage.getItem("admin");
    if (!isAdmin) {
        window.location.href = "login.html";
        
        return false;
    }
    return true;
};

// Shared Validators
export const validators = {
    email: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return email.length <= CONFIG.EMAIL_MAX_LENGTH && emailRegex.test(email);
    },
    password: (password) => {
        const passwordRegex = /^(?=.*[!@#$%^&*()_+~\-={}\[\]:;"'<>,.?\/]).{6,}$/;
        return passwordRegex.test(password)
    },
        
    name: (name) => {
        const nameRegex = /^[A-Za-z'-]{3,}(?:\s[A-Za-z'-]{3,})*$/;
        return name.length <= 30 && nameRegex.test(name);
    }
};

// Error Handler Class
export class ErrorHandler {
    constructor(errorContainer = null, toast = null) {
        this.errorContainer = errorContainer;
        this.toast = toast;
        
    }

    showError(message) {
        if (!this.errorContainer) return;

        this.errorContainer.textContent = message;
        this.errorContainer.classList.add("visible");
    }

    clearError() {
        if (!this.errorContainer) return;

        this.errorContainer.textContent = "";
        this.errorContainer.classList.remove("visible");
    }

    hideToast() {
        if (!this.toast) return;

        this.toast.classList.remove("show");
        this.toast.classList.remove("bg-Error");
        this.toast.classList.remove("bg-Success");
    }

    showToast(message, isError = true) {
        if (!this.toast) return;

        this.toast.textContent = message;
        this.toast.classList.add("show");
        if(isError)
            this.toast.classList.add("bg-Error");
        else
            this.toast.classList.add("bg-Success");


        setTimeout(() => {
            this.hideToast();
        }, CONFIG.TOAST_DURATION);
    }
}

// API Helper
export async function makeRequest(endpoint, method, data) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
            method,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));

        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(response.status)
            
        }

        return responseData;
    } catch (error) {
        
        if (error.message == 400)
            throw new Error(CONFIG.ERROR_MESSAGES.EMAIL_EXISTS);
        else if (error.message == 401) 
            throw new Error(CONFIG.ERROR_MESSAGES.AUTH_FAILED);
        else
            throw new Error(CONFIG.ERROR_MESSAGES.SERVER_ERROR);

        
    }
}

// Utility Functions
// export function debounce(func, wait) {
//     let timeout;
//     return function executedFunction(...args) {
//         const later = () => {
//             clearTimeout(timeout);
//             func(...args);
//         };
//         clearTimeout(timeout);
//         timeout = setTimeout(later, wait);
//     };
// } 