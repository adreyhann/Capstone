document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('editUserForm'); // form id
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

	// Add a mouseover event listener to change the cursor style
	submitButton.addEventListener('mouseover', function () {
		// Change the cursor style to 'not-allowed' when the button is disabled
		if (submitButton.disabled) {
			submitButton.style.cursor = 'not-allowed';
		}
	});

	// Add a mouseout event listener to reset the cursor style
	submitButton.addEventListener('mouseout', function () {
		// Reset the cursor style when the mouse leaves the button
		submitButton.style.cursor = 'default';
	});
});

//  for admin

document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('editUserModal'); // form id
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

	// Add a mouseover event listener to change the cursor style
	submitButton.addEventListener('mouseover', function () {
		// Change the cursor style to 'not-allowed' when the button is disabled
		if (submitButton.disabled) {
			submitButton.style.cursor = 'not-allowed';
		}
	});

	// Add a mouseout event listener to reset the cursor style
	submitButton.addEventListener('mouseout', function () {
		// Reset the cursor style when the mouse leaves the button
		submitButton.style.cursor = 'default';
	});
});

// for advisor
document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('editRecordForm'); // form id
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

	// Add a mouseover event listener to change the cursor style
	submitButton.addEventListener('mouseover', function () {
		// Change the cursor style to 'not-allowed' when the button is disabled
		if (submitButton.disabled) {
			submitButton.style.cursor = 'not-allowed';
		}
	});

	// Add a mouseout event listener to reset the cursor style
	submitButton.addEventListener('mouseout', function () {
		// Reset the cursor style when the mouse leaves the button
		submitButton.style.cursor = 'default';
	});
});
