// Function to confirm moving a RestoredRecordsList entry to Archive
function confirmMoveToArchive(recordId) {
    // Display a confirmation dialog
    const confirmed = confirm('Are you sure you want to move this record to Archive?');
    if (confirmed) {
        moveRestoredToArchive(recordId); // If confirmed, call the function to move the record to Archive
    } else {
        // If not confirmed, do nothing
        console.log('Move to Archive cancelled');
    }
}

// Fetch function to move RestoredRecordsList entry to Archive
function moveRestoredToArchive(recordId) {
    // Send a POST request to the server to move the RestoredRecordsList entry to Archive
    fetch(`/restored-to-archive/${recordId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recordId: recordId })
    })
    .then(response => {
        if (response.ok) {
            // Display a success message if the operation is successful
            alert('Record moved to Archive successfully!');
            location.reload(); // Reload the page to reflect changes
        } else {
            // Display an error message if the operation fails
            throw new Error('Failed to move record to Archive');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to move record to Archive. Please try again later.');
    });
}
