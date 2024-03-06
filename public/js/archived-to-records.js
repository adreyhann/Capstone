// Script to move record from archive
async function moveFromArchive(archivedRecordId) {
    try {
        const response = await fetch(`/systemAdmin/unarchive/${archivedRecordId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            // Optionally, you can update the UI or show a success message
            alert('Record moved from archive successfully');
            location.reload(); // Refresh the page to reflect the changes
        } else {
            alert('Failed to move record from archive');
            // Handle error, show a message, etc.
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
