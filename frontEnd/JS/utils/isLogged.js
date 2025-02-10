// Immediate auth check
(function () {
    const currentUrl = window.location.href;
    if ( currentUrl === "http://127.0.0.1:5500/admin.html" || currentUrl === "http://127.0.0.1:5500/quizCreator.html") {
        const isAdmin = localStorage.getItem("admin");
        if (!isAdmin) {         
            window.location.href = "login.html";
          }
    }

    else if (currentUrl === "http://127.0.0.1:5500/user.html" || currentUrl === "http://127.0.0.1:5500/quiz.html") {

        if (!localStorage.getItem("name")) {
            window.location.href = "login.html";
          
    }}
    else
    {
        const isAdmin = localStorage.getItem("admin");
        if (isAdmin) {
          window.location.href = "admin.html";
        } else if (localStorage.getItem("name")) {
          window.location.href = "user.html";
        } else {
        //   if (currentUrl !== "http://127.0.0.1:5500/login.html") {
        //       if (currentUrl !== "http://127.0.0.1:5500/signup.html"){
        //           window.location.href = "login.html";
        //       }
           
          }
    }


 

})();
