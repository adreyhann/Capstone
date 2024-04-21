function archiveSelected() {
    const checkboxes = document.querySelectorAll('input[name="selectedRecords"]:checked');
    const selectedRecordIds = Array.from(checkboxes).map(checkbox => checkbox.value);

    // Check if any checkboxes are selected
    if (selectedRecordIds.length === 0) {
        alert('Please select at least one record to archive.');
        return;
    }

    // Display confirmation modal
    $('#confirmationModal2').modal('show');

    // Add event listener to confirm button
    $('#confirmButton2').off('click').on('click', function() {
        moveToArchiveConfirmed(selectedRecordIds);
        $('#confirmationModal2').modal('hide');
    });

    // Add event listener to cancel button
    $('#cancelButton2').off('click').on('click', function() {
        $('#confirmationModal2').modal('hide');
    });
}

// Function to be executed after confirmation
async function moveToArchiveConfirmed(selectedRecordIds) {
    const promises = selectedRecordIds.map(recordId => {
        return fetch(`/systemAdmin/move-to-archive/${recordId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    });

    try {
        const responses = await Promise.all(promises);

        const successfulMoves = responses.filter(response => response.ok).length;
        if (successfulMoves > 0) {
            alert(`${successfulMoves} record(s) moved to archive successfully`);
            location.reload();
        } else {
            alert('Failed to move records to archive');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while moving records to archive');
    }
}
