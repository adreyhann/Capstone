function updateAdvisoryOptions() {
    var roleSelect = document.getElementById("role");
    var classAdvisorySelect = document.getElementById("classAdvisory");
    
    if (roleSelect.value === 'System Admin') {
        // Set classAdvisory and subjectAdvisory to 'None' and disable other options
        classAdvisorySelect.value = 'None';
        disableOptions(classAdvisorySelect, ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);
    } else if (roleSelect.value === 'Admin') {
        // Customize options for the 'Admin' role
        classAdvisorySelect.value = 'None';
        disableOptions(classAdvisorySelect, ['Kinder', 'Grade 1', 'Grade 2','Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);
       
    } else {
        // Reset classAdvisory and subjectAdvisory to 'None' and enable all options
        classAdvisorySelect.value = '';
        subjectAdvisorySelect.value = '';
        enableAllOptions(classAdvisorySelect);
        disableOptions(subjectAdvisorySelect, ['None']);
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

function enableAllOptions(selectElement) {
    for (var i = 0; i < selectElement.options.length; i++) {
        selectElement.options[i].disabled = false;
    }
}
