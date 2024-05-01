document.addEventListener('DOMContentLoaded', function () {
	const archiveButton = document.getElementById('archiveButton');

	archiveButton.addEventListener('click', function () {
		const selectedRecordCheckboxes = document.querySelectorAll(
			'input[name="archivedRecords"]:checked'
		);
		const selectedRecordIds = Array.from(selectedRecordCheckboxes).map(
			(checkbox) => checkbox.value
		);

		if (selectedRecordIds.length === 0) {
			alert('No restored records selected for archiving');
			return;
		}

		const confirmed = confirm(
			'Are you sure you want to archive the selected restored records?'
		);
		if (!confirmed) {
			return;
		}

		fetch('/systemAdmin/selected-restored', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ recordIds: selectedRecordIds }),
		})
			.then((response) => {
				if (response.ok) {
					alert('Restored records moved to Archive successfully!');
					window.location.reload();
				} else {
					throw new Error('Failed to move restored records to Archive');
				}
			})
			.catch((error) => {
				console.error('Error:', error);
				alert(
					'Failed to move restored records to Archive. Please try again later.'
				);
			});
	});
});
