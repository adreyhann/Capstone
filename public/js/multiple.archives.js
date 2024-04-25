async function archiveSelected() {
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
    $('#confirmButton2').off('click').on('click', async function() {
        try {
            const response = await fetch('/systemAdmin/archive-selected', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ selectedRecords: selectedRecordIds }),
            });
            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                location.reload();
            } else {
                const errorMessage = await response.text();
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while moving records to archive');
        } finally {
            $('#confirmationModal2').modal('hide');
        }
    });

    // Add event listener to cancel button
    $('#cancelButton2').off('click').on('click', function() {
        $('#confirmationModal2').modal('hide');
    });
}
