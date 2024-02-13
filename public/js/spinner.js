document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registrationForm');
    const submitButton = document.getElementById('submitButton');

    form.addEventListener('submit', function () {
        // Show the spinner when submitting the form
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submit';
        submitButton.disabled = true;
    });
});