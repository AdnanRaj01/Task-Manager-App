let togglePassword = document.querySelectorAll(".togglePassword");

togglePassword.forEach((button) => {

    button.addEventListener("click", () => {

        let passwordInput =
            button.previousElementSibling;

        if(passwordInput.type === "password"){

            passwordInput.type = "text";

            button.innerText = "Hide";

        }else{

            passwordInput.type = "password";

            button.innerText = "Show";
        }
    });
});