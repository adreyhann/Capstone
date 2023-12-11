function archiveSelected() {
    const checkboxes = document.querySelectorAll('input[name="selectedRecords"]:checked');
    const selectedRecordIds = Array.from(checkboxes).map(checkbox => checkbox.value);

    // Check if any checkboxes are selected
    if (selectedRecordIds.length === 0) {
        alert('Please select at least one record to archive.');
        return;
    }

    // Send a POST request to the server to archive the selected records
    fetch('/systemAdmin/archive-selected', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedRecords: selectedRecordIds }),
    })
        .then(response => {
            if (response.ok) {
                // Reload the records page after successful archiving
                window.location.reload();
            } else {
                alert('Failed to archive selected records. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while archiving selected records.');
        });
}

function updateArchiveButtonVisibility() {
    const checkboxes = document.querySelectorAll('input[name="selectedRecords"]');
    const selectedCheckboxes = Array.from(checkboxes).filter(checkbox => checkbox.checked);

    const archiveButton = document.getElementById('archiveButton');

    // Toggle the visibility of the button based on the number of selected checkboxes
    archiveButton.style.display = selectedCheckboxes.length >= 2 ? 'block' : 'none';
}

// Add an event listener to each checkbox to update the button visibility
document.querySelectorAll('input[name="selectedRecords"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateArchiveButtonVisibility);
});