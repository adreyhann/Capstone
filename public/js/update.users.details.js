
function disableAllOptions(selectElement) {
	var options = selectElement.options;
	for (var i = 0; i < options.length; i++) {
		options[i].disabled = true;
	}
}

function disableOptions(selectElement, optionsToDisable) {
	for (var i = 0; i < selectElement.options.length; i++) {
		var option = selectElement.options[i];
		if (optionsToDisable.includes(option.value)) {
			option.disabled = true;
		}
	}
}

// Helper function to enable all options in a select element
function enableAllOptions(selectElement) {
	var options = selectElement.options;
	for (var i = 0; i < options.length; i++) {
		options[i].disabled = false;
	}
}

function enableOptions(selectElement) {
	for (var i = 0; i < selectElement.options.length; i++) {
		selectElement.options[i].disabled = false;
	}
}


// Function to update Class Advisory options based on the selected role
function updateAdvisoryOptions() {
    var roleSelect = document.getElementById('editRole');
    var advisorySelect = document.getElementById('editClassAdvisory');

    // Get the selected role value
    var selectedRole = roleSelect.value;

    // Get the current value of Class Advisory
    var currentAdvisory = advisorySelect.value;

    // Reset advisorySelect options
    advisorySelect.innerHTML = '<option value="" disabled></option>';

    if (selectedRole === 'System Admin' || selectedRole === 'Admin') {
        // If the selected role is System Admin or Admin, set Class Advisory to 'None' and disable other options
        advisorySelect.innerHTML += '<option value="None" selected>None</option>';
        disableOptions(advisorySelect, ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);
    } else {
        // If the selected role is not System Admin or Admin, enable all options except 'None'
        enableOptions(advisorySelect);
        advisorySelect.innerHTML += '<option value="Kinder">Kinder</option>';
        advisorySelect.innerHTML += '<option value="Grade 1">Grade 1</option>';
        advisorySelect.innerHTML += '<option value="Grade 2">Grade 2</option>';
        advisorySelect.innerHTML += '<option value="Grade 3">Grade 3</option>';
        advisorySelect.innerHTML += '<option value="Grade 4">Grade 4</option>';
        advisorySelect.innerHTML += '<option value="Grade 5">Grade 5</option>';
        advisorySelect.innerHTML += '<option value="Grade 6">Grade 6</option>';

        // If the current advisory is 'None', disable the 'None' option
        if (currentAdvisory === 'None') {
            disableOptions(advisorySelect, ['None']);
        }
    }
}
