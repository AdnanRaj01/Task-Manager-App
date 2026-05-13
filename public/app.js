let deleteForms = document.querySelectorAll(".delete-form");

deleteForms.forEach((form) => {

    form.addEventListener("submit", (event) => {

        let result = confirm(
            "Are you sure you want to delete this task?"
        );

        if(!result){
            event.preventDefault();
        }
    });
});

