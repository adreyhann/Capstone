function moveToHigherGrade(recordId) {
	// Show a confirmation prompt
	const confirmed = window.confirm(
		'Are you sure you want to advance the grade level of this student?'
	);

	// If the user confirms the action
	if (confirmed) {
		// Send a POST request to the server to advance the grade level of the selected record
		fetch(`/systemAdmin/advance-grade-level/${recordId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then((response) => {
				if (response.ok) {
					// Parse the response JSON
					return response.json();
				} else {
					throw new Error(
						'Failed to advance grade level of the selected record.'
					);
				}
			})
			.then((data) => {
				alert(data.message);
				window.location.reload();
			})
			.catch((error) => {
				console.error('Error:', error);
				alert(
					'An error occurred while advancing grade level of the selected record.'
				);
			});
	}
}
