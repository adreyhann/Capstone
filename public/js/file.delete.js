function deleteFile(recordId, index) {
	if (confirm('Are you sure you want to delete this file?')) {
		fetch(`/systemAdmin/deleteFile/${recordId}/${index}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then((data) => {
				alert(data.success);
                location.reload();
			})
			.catch((error) => {
				console.error('There was a problem with the fetch operation:', error);
			});
	}
}
