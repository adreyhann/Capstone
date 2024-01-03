function updateAdvisoryOptions() {
    var roleSelect = document.getElementById("role");
    var classAdvisorySelect = document.getElementById("classAdvisory");
    var subjectAdvisorySelect = document.getElementById("subjectAdvisory");

    if (roleSelect.value === 'System Admin') {
        // Set classAdvisory and subjectAdvisory to 'None' and disable other options
        classAdvisorySelect.value = 'None';
        subjectAdvisorySelect.value = 'None';
        disableOptions(classAdvisorySelect, ['kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);
        disableOptions(subjectAdvisorySelect, ['All Kinder Subjects', 'Filipino', 'AP', 'Values', 'Civics', 'EPP', 'Science', 'Mapeh', 'Math']);
    } else if (roleSelect.value === 'Admin') {
        // Customize options for the 'Admin' role
        classAdvisorySelect.value = 'None';
        subjectAdvisorySelect.value = 'None';
        disableOptions(classAdvisorySelect, ['kinder', 'Grade 1', 'Grade 2','Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);
        disableOptions(subjectAdvisorySelect, ['All Kinder Subjects', 'Filipino', 'AP', 'Values', 'Civics', 'EPP', 'Science', 'Mapeh', 'Math']);
       
    } else {
        // Reset classAdvisory and subjectAdvisory to 'None' and enable all options
        classAdvisorySelect.value = 'None';
        subjectAdvisorySelect.value = 'None';
        enableAllOptions(classAdvisorySelect);
        enableAllOptions(subjectAdvisorySelect);
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
