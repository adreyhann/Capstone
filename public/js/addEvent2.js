function addEvent() {
    // Send a request to the server to add an event
    const dateInput = document.getElementById('datepicker');
    const selectedDate = dateInput.value;
    if (selectedDate) {
        const eventName = prompt('Enter event name:');
        if (eventName) {
            fetch('/admin/add-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: selectedDate,
                    eventName: eventName
                })
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to add event');
            })
            .then(data => {
                console.log('Event added successfully:', data);
                // Optionally, trigger a function to display events after adding
                displayEvents();
            })
            .catch(error => {
                console.error('Error adding event:', error);
            });
        }
    }
}
