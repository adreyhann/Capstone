function populateUserForm(_id, lname, fname, role, classAdvisory, email) {
    // Set the form action
    document.getElementById('editUserForm').setAttribute('action', `/systemAdmin/edit-users/${_id}`);

    // Set basic fields
    document.getElementById('editLName').value = lname;
    document.getElementById('editFName').value = fname;
    document.getElementById('editEmail').value = email;

    
    var editRoleSelect = document.getElementById('editRole');
    var editClassAdvisorySelect = document.getElementById('editClassAdvisory');

    // Set the selected role
    editRoleSelect.value = role;

    // Update other fields based on the selected role
    if (role === 'Class Advisor') {
        // If the role is 'Class Advisor', set the selected class and subject advisory
        editClassAdvisorySelect.value = classAdvisory;
    } else {
        // If the role is not 'Class Advisor', set other fields to 'None' and disable options
        editClassAdvisorySelect.value = 'None';

        // Disable options based on the selected role
        disableOptions(editClassAdvisorySelect, ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);
        
    }
}

function disableOptions(selectElement, optionsToDisable) {
    for (var i = 0; i < selectElement.options.length; i++) {
        var option = selectElement.options[i];
        if (optionsToDisable.includes(option.value)) {
            option.disabled = true;
        } else {
            option.disabled = false; // Enable other options
        }
    }
}

function enableAllOptions(selectElement) {
    for (var i = 0; i < selectElement.options.length; i++) {
        selectElement.options[i].disabled = false;
    }
}
