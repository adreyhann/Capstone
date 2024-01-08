function updateSubjectAdvisory() {
    var classAdvisorySelect = document.getElementById("classAdvisory");
    var subjectAdvisorySelect = document.getElementById("subjectAdvisory");

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