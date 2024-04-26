function unArchiveSelected() {
    const selectedRecords = document.querySelectorAll('input[name="archivedRecords"]:checked');
    const selectedRecordIds = Array.from(selectedRecords).map(checkbox => checkbox.value);

    if (selectedRecordIds.length === 0) {
        alert("No records selected for unarchiving");
        return;
    }

    const confirmed = confirm("Are you sure you want to unarchive the selected records?");
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
            throw new Error('Failed to unarchive selected records');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        window.location.reload(); 
    })
    .catch(error => {
        console.error('Error unarchiving records:', error);
        alert('Failed to unarchive selected records'); 
        window.location.reload()
    });
}