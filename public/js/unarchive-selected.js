function unArchiveSelected() {
    const selectedRecords = document.querySelectorAll('input[name="archivedRecords"]:checked');
    const selectedRecordIds = Array.from(selectedRecords).map(checkbox => checkbox.value);

    if (selectedRecordIds.length === 0) {
        alert("No students selected for unarchiving");
        return;
    }

    const confirmed = confirm("Are you sure you want to unarchive the selected students?");
    if (!confirmed) {
        return; 
    }

    fetch('/systemAdmin/unarchive-selected', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectedRecordIds })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to unarchive selected students');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        window.location.reload(); 
    })
    .catch(error => {
        console.error('Error unarchiving students:', error);
        alert('Failed to unarchive selected students'); 
        window.location.reload()
    });
}