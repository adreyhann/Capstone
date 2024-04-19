function moveToHigherGrade(recordId) {
    // Show a confirmation prompt
    const confirmed = window.confirm('Are you sure you want to advance the grade level of this student?');

    // If the user confirms the action
    if (confirmed) {
        // Send a POST request to the server to advance the grade level of the selected record
        fetch(`/systemAdmin/advance-grade-level/${recordId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (response.ok) {
                    // Reload the page after successful advancement
                    window.location.reload();
                } else {
                    alert('Failed to advance grade level of the selected record. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while advancing grade level of the selected record.');
            });
    }
}
