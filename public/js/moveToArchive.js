// Function to confirm action and execute function if confirmed
function confirmActionAndExecute(actionFunction, ...args) {
    $('#confirmationModal').modal('show');
    $('#confirmAction').off('click').on('click', function() {
        actionFunction(...args);
        $('#confirmationModal').modal('hide');
    });
}

// Updated moveToArchive function using Bootstrap modal
async function moveToArchive(recordId) {
    try {
        confirmActionAndExecute(moveToArchiveConfirmed, recordId);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to be executed after confirmation
async function moveToArchiveConfirmed(recordId) {
    const response = await fetch(`/systemAdmin/move-to-archive/${recordId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (response.ok) {
        alert('Record moved to archive successfully');
        location.reload();
    } else {
        alert('Failed to move record to archive');
    }
}