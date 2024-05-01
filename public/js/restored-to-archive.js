function moveRestoredToArchive(id) {
    fetch(`/systemAdmin/restored-to-archive/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            alert('RestoredRecordsList moved to Archive successfully!');
            location.reload();
        } else {
            throw new Error('Failed to move RestoredRecordsList to Archive');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to move RestoredRecordsList to Archive. Please try again later.');
    });
}

// Function to trigger the moveRestoredToArchive function with confirmation
function archiveSelected(recordId) {
    const confirmed = confirm("Are you sure you want to move this record to Archive?");
    if (confirmed) {
        moveRestoredToArchive(recordId);
    }
}
