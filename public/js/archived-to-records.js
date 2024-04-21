// Function to confirm action and execute function if confirmed
function confirmActionAndExecute(actionFunction, ...args) {
    $('#confirmationModal3').modal('show');
    $('#confirmButton3').off('click').on('click', function() {
        actionFunction(...args);
        $('#confirmationModal3').modal('hide');
    });
}

// Updated moveFromArchive function using Bootstrap modal
async function moveFromArchive(archivedRecordId) {
    try {
        confirmActionAndExecute(moveFromArchiveConfirmed, archivedRecordId);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to be executed after confirmation
async function moveFromArchiveConfirmed(archivedRecordId) {
    const response = await fetch(`/systemAdmin/unarchive/${archivedRecordId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (response.ok) {
        alert('Record moved from archive successfully');
        location.reload();
    } else {
        alert('Failed to move record from archive');
    }
}
