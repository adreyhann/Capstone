function updateAdvisoryOptions() {
    var roleSelect = document.getElementById("editRole");
    var classAdvisorySelect = document.getElementById("editClassAdvisory");
    var subjectAdvisorySelect = document.getElementById("editSubjectAdvisory");

    if (roleSelect.value === 'System Admin') {
        // Set classAdvisory and subjectAdvisory to 'None' and disable other options
        classAdvisorySelect.value = 'None';
        subjectAdvisorySelect.value = 'None';
        disableOptions(classAdvisorySelect, ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);
        disableOptions(subjectAdvisorySelect, ['All Kinder Subjects', 'Filipino', 'AP', 'Values', 'Civics', 'EPP', 'Science', 'Mapeh', 'Math']);
    } else if (roleSelect.value === 'Admin') {
        // Customize options for the 'Admin' role
        classAdvisorySelect.value = 'None';
        subjectAdvisorySelect.value = 'None';
        disableOptions(classAdvisorySelect, ['Kinder', 'Grade 1', 'Grade 2','Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']);
        disableOptions(subjectAdvisorySelect, ['All Kinder Subjects', 'Filipino', 'AP', 'Values', 'Civics', 'EPP', 'Science', 'Mapeh', 'Math']);
       
    } else {
        // Reset classAdvisory and subjectAdvisory to 'None' and enable all options
        classAdvisorySelect.value = '';
        subjectAdvisorySelect.value = '';
        enableAllOptions(classAdvisorySelect);
        disableOptions(subjectAdvisorySelect, ['None']);
    }
}


function updateSubjectAdvisory() {
    var classAdvisorySelect = document.getElementById("editClassAdvisory");
    var subjectAdvisorySelect = document.getElementById("editSubjectAdvisory");

    // Check if classAdvisory is 'Kinder'
    if (classAdvisorySelect.value === 'Kinder') {
        // Set subjectAdvisory to 'All Kinder subjects' (AKS) and disable other options
        subjectAdvisorySelect.value = 'All Kinder Subjects';
        disableOptions(subjectAdvisorySelect, ['select','None','Filipino', 'AP', 'Values', 'Civics', 'EPP', 'Science', 'Mapeh', 'Math']);
    } else {
        // Reset subjectAdvisory to 'Select subject' and enable all options
        subjectAdvisorySelect.value = '';
        enableAllOptions(subjectAdvisorySelect);
    }


    if (classAdvisorySelect.value !== 'Kinder') {
        disableOptions(subjectAdvisorySelect, ['None', 'All Kinder Subjects']);
    }
}

function updateClassAdvisory() {
    var classAdvisorySelect = document.getElementById("editClassAdvisory");
    var subjectAdvisorySelect = document.getElementById("editSubjectAdvisory");

    // Check if classAdvisory is 'Kinder'
    if (subjectAdvisorySelect.value === 'All Kinder Subjects') {
        // Set subjectAdvisory to 'All Kinder subjects' (AKS) and disable other options
        classAdvisorySelect.value = 'Kinder';
        disableOptions(subjectAdvisorySelect, ['select','None','Filipino', 'AP', 'Values', 'Civics', 'EPP', 'Science', 'Mapeh', 'Math']);
    } else {

        enableAllOptions(subjectAdvisorySelect, ['Filipino', 'AP', 'Values', 'Civics', 'EPP', 'Science', 'Mapeh', 'Math']);
    }
    
    if (classAdvisorySelect.value !== 'Kinder') {
        disableOptions(subjectAdvisorySelect, ['None', 'All Kinder Subjects']);
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