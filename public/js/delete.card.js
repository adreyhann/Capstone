// Add event listener to delete card buttons
document.querySelectorAll('.delete-card').forEach(button => {
    button.addEventListener('click', async function(event) {
        event.preventDefault();
        const cardId = this.dataset.cardId;

        const confirmed = confirm("Are you sure you want to delete this section? This action cannot be undone.");
        if (!confirmed) {
            return; 
        }

        try {
            const response = await fetch(`/systemAdmin/cards/${cardId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete card');
            }

            const cardElement = this.closest('.card');
            cardElement.remove();

            alert('Card deleted successfully!');
            location.reload()
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to delete card');
        }
    });
});
