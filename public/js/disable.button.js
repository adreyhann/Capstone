document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('editUserForm'); // Replace with your actual form id
    const submitButton = document.getElementById('submitButton');

    // Initial form data
    const initialFormData = new FormData(form);

    // Function to check if the form has changes
    function formHasChanges() {
      const currentFormData = new FormData(form);
      for (const [key, value] of initialFormData.entries()) {
        if (currentFormData.get(key) !== value) {
          return true;
        }
      }
      return false;
    }

    // Disable the submit button initially
    submitButton.disabled = true;

    // Add an event listener to the form inputs
    form.addEventListener('input', function () {
      // Enable the submit button if the form has changes, otherwise disable it
      submitButton.disabled = !formHasChanges();
    });
  });