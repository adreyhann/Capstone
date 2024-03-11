document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('editUserForm');
    const submitButton = document.getElementById('submitButton');

    form.addEventListener('submit', function () {
        // Show the spinner when submitting the form
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        submitButton.disabled = true;
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('editUserModal');
    const submitButton = document.getElementById('submitButton');

    form.addEventListener('submit', function () {
        // Show the spinner when submitting the form
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        submitButton.disabled = true;
    });
});