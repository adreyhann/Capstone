async function advanceSelectedGradeLevel() {
    // Show a confirmation prompt
    const confirmed = window.confirm('Are you sure you want to advance the grade level of selected students?');

    // If the user confirms the action
    if (confirmed) {
        const checkboxes = document.querySelectorAll('input[name="selectedRecords"]:checked');
        const selectedRecordIds = Array.from(checkboxes).map(checkbox => checkbox.value);

        // Check if any checkboxes are selected
        if (selectedRecordIds.length === 0) {
            alert('Please select at least one record to advance grade level.');
            return;
        }

        try {
            // Send a POST request to the server to advance the grade level of selected records
            const response = await fetch('/classAdvisor/advance-grade-level', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ selectedRecords: selectedRecordIds }),
            });

            if (response.ok) {
                // Parse the response JSON
                const data = await response.json();

                // Display success message
                alert(data.message);

                // Reload the records page after successful advancement
                window.location.reload();
            } else {
                // Display the error message from the JSON response
                const errorMessage = await response.json();
                alert(`Error: ${errorMessage.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while promoting grade level of selected students.');
        }
    }
}
