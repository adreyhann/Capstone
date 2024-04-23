document.addEventListener('click', function (event) {
	if (event.target.classList.contains('edit-card')) {
		event.preventDefault();

		const cardId = event.target.getAttribute('data-card-id');

		const newName = prompt('Enter the new name for the section:');

		if (newName) {
			fetch(`/systemAdmin/cards/${cardId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name: newName }),
			})
				.then((response) => {
					if (!response.ok) {
						throw new Error('Failed to update card name');
					}
					return response.json();
				})
				.then((updatedCard) => {
					const cardTitle = event.target
						.closest('.card')
						.querySelector('.card-title');
					cardTitle.innerText = updatedCard.name;

					alert('Card name updated successfully!');
                    this.location.reload()
				})
				.catch((error) => {
					console.error('Error:', error);
					alert('Failed to update card name');
				});
		}
	}
});
