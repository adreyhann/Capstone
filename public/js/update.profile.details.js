function updateAdvisoryOptions() {
    var roleSelect = document.getElementById("editRole");
    var classAdvisorySelect = document.getElementById("editClassAdvisory");
    var subjectAdvisorySelect = document.getElementById("editSubjectAdvisory");

    // Disable options by default if the role is 'System Admin' or 'Admin'
    if (roleSelect.value === 'System Admin' || roleSelect.value === 'Admin') {
        disableAllOptions(classAdvisorySelect);
        disableAllOptions(subjectAdvisorySelect);
    } else {
        // Reset classAdvisory and subjectAdvisory to 'None' and enable all options
        classAdvisorySelect.value = '';
        subjectAdvisorySelect.value = '';
        enableAllOptions(classAdvisorySelect);
        enableAllOptions(subjectAdvisorySelect);
    }
}

function updateSubjectAdvisory() {
	var classAdvisorySelect = document.getElementById('editClassAdvisory');
	var subjectAdvisorySelect = document.getElementById('editSubjectAdvisory');

	// Check if classAdvisory is 'Kinder'
	if (classAdvisorySelect.value === 'Kinder') {
		// Set subjectAdvisory to 'All Kinder subjects' (AKS) and disable other options
		subjectAdvisorySelect.value = 'All Kinder Subjects';
		// enableOptions(subjectAdvisorySelect, ['All Kinder Subjects']);
		disableAllOptions(subjectAdvisorySelect);
        enableOptions(subjectAdvisorySelect, ['All Kinder Subjects']);
	} else {
		// Reset subjectAdvisory to 'Select subject' and enable all options

		enableAllOptions(subjectAdvisorySelect);
	}

	if (classAdvisorySelect.value !== 'Kinder') {
		subjectAdvisorySelect.value = '';
		disableOptions(subjectAdvisorySelect, ['None', 'All Kinder Subjects']);
	}
}

function updateClassAdvisory() {
	var classAdvisorySelect = document.getElementById('editClassAdvisory');
	var subjectAdvisorySelect = document.getElementById('editSubjectAdvisory');

	// Check if classAdvisory is 'Kinder'
	if (subjectAdvisorySelect.value === 'All Kinder Subjects') {
		// Set subjectAdvisory to 'All Kinder subjects' (AKS) and disable other options
		classAdvisorySelect.value = 'Kinder';
		disableOptions(subjectAdvisorySelect, [
			'None',
			'Filipino',
			'AP',
			'Values',
			'Civics',
			'EPP',
			'Science',
			'Mapeh',
			'Math',
		]);
	} else if (subjectAdvisorySelect.value !== 'All Kinder Subjects') {
		// classAdvisorySelect.value = ''
		disableOptions(classAdvisorySelect, []);
	} else {
		enableAllOptions(subjectAdvisorySelect, [
			'Filipino',
			'AP',
			'Values',
			'Civics',
			'EPP',
			'Science',
			'Mapeh',
			'Math',
		]);
	}

	if (classAdvisorySelect.value !== 'Kinder') {
		disableOptions(subjectAdvisorySelect, ['None', 'All Kinder Subjects']);
	}
}


// function updateSubjectAdvisory() {
//     var classAdvisorySelect = document.getElementById("editClassAdvisory");
//     var subjectAdvisorySelect = document.getElementById("editSubjectAdvisory");

//     // Check if classAdvisory is 'Kinder'
//     if (classAdvisorySelect.value === 'Kinder') {
//         // Set subjectAdvisory to 'All Kinder subjects' (AKS) and disable other options
//         subjectAdvisorySelect.value = 'All Kinder Subjects';
//         enableAllOptions(subjectAdvisorySelect, ['All Kinder Subjects'])
//         disableOptions(subjectAdvisorySelect, ['select','None','Filipino', 'AP', 'Values', 'Civics', 'EPP', 'Science', 'Mapeh', 'Math']);
//     } else {
//         // Reset subjectAdvisory to 'Select subject' and enable all options
        
//         enableAllOptions(subjectAdvisorySelect);
//     }


//     if (classAdvisorySelect.value !== 'Kinder') {
//         subjectAdvisorySelect.value = ''
//         disableOptions(subjectAdvisorySelect, ['None', 'All Kinder Subjects']);
//     }
// }

// function updateClassAdvisory() {
//     var classAdvisorySelect = document.getElementById("editClassAdvisory");
//     var subjectAdvisorySelect = document.getElementById("editSubjectAdvisory");

//     // Check if classAdvisory is 'Kinder'
//     if (subjectAdvisorySelect.value === 'All Kinder Subjects') {
//         // Set subjectAdvisory to 'All Kinder subjects' (AKS) and disable other options
//         classAdvisorySelect.value = 'Kinder';
//         disableOptions(subjectAdvisorySelect, ['select','None','Filipino', 'AP', 'Values', 'Civics', 'EPP', 'Science', 'Mapeh', 'Math']);
//     } else if (subjectAdvisorySelect.value !== 'All Kinder Subjects') {
        
//         // classAdvisorySelect.value = ''
//         disableOptions(classAdvisorySelect, [])
//     } else {
//         enableAllOptions(subjectAdvisorySelect, ['Filipino', 'AP', 'Values', 'Civics', 'EPP', 'Science', 'Mapeh', 'Math']);
//     }
    
//     if (classAdvisorySelect.value !== 'Kinder') {
//         disableOptions(subjectAdvisorySelect, ['None', 'All Kinder Subjects']);
//     }
// }

function disableOptions(selectElement, optionsToDisable) {
	for (var i = 0; i < selectElement.options.length; i++) {
		var option = selectElement.options[i];
		if (optionsToDisable.includes(option.value)) {
			option.disabled = true;
		}
	}
}

// Helper function to disable all options in a select element
function disableAllOptions(selectElement) {
    var options = selectElement.options;
    for (var i = 0; i < options.length; i++) {
        options[i].disabled = true;
    }
}

// Helper function to enable all options in a select element
function enableAllOptions(selectElement) {
    var options = selectElement.options;
    for (var i = 0; i < options.length; i++) {
        options[i].disabled = false;
    }
}

updateAdvisoryOptions();