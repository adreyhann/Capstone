document.querySelectorAll('.activate-user-btn').forEach((button) => {
	button.addEventListener('click', async () => {
		const userId = button.getAttribute('data-user-id');
		const confirmActivation = confirm(
			'Are you sure you want to activate this user?'
		);
		if (confirmActivation) {
			try {
				const response = await fetch(`/systemAdmin/activate/${userId}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (response.ok) {
					// Handle success, e.g., show success message, update UI, etc.
					alert('User activated successfully');
					location.reload(); // Refresh the page
				} else {
					const responseData = await response.json();
                    alert(responseData.error || 'Failed to activate user');
				}
			} catch (error) {
				console.error('Error:', error);
				// Handle errors, e.g., show error message, log error, etc.
				alert('Error activating user');
			}
		}
	});
});
