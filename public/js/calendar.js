function displayEvents(events) {
	const eventList = document.getElementById('eventList');
	eventList.innerHTML = '';

	// Check if events array is empty
	if (events.length === 0) {
		const noEventsMessage = document.createElement('div');
		noEventsMessage.classList.add('alert', 'alert-info', 'text-center'); // Add text-center class
		noEventsMessage.textContent = 'No events yet.';
		eventList.appendChild(noEventsMessage);
		return; // Exit the function if no events are found
	}

	// stop here
	for (const event of events) {
		const date = new Date(event.date); // Convert date string to Date object

		// Format the date and time
		const formattedDate = date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
		const formattedTime = date.toLocaleString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});

		// Create a list item for the event
		const eventItem = document.createElement('li');
		eventItem.classList.add(
			'list-group-item',
			'd-flex',
			'justify-content-between',
			'align-items-center'
		);

		// Display the formatted date and time
		const dateTimeSpan = document.createElement('span');
		dateTimeSpan.textContent = `${formattedDate}, ${formattedTime}`;
		eventItem.appendChild(dateTimeSpan);

		// Display the event name
		const eventNameSpan = document.createElement('span');
		eventNameSpan.textContent = event.eventName;
		eventItem.appendChild(eventNameSpan);

		// Add buttons container
		const buttonsContainer = document.createElement('div');

		// Add buttons for editing and deleting the event
		const editButton = document.createElement('button');
		editButton.textContent = 'Edit';
		editButton.classList.add('btn', 'btn-sm', 'btn-primary', 'me-2');
		editButton.addEventListener('click', () =>
			editEvent(date, event.eventName)
		);
		buttonsContainer.appendChild(editButton);

		const deleteButton = document.createElement('button');
		deleteButton.textContent = 'Delete';
		deleteButton.classList.add('btn', 'btn-sm', 'btn-danger');
		deleteButton.addEventListener('click', () =>
			deleteEvent(date, event.eventName)
		);
		buttonsContainer.appendChild(deleteButton);

		// Append the buttons container to the event list item
		eventItem.appendChild(buttonsContainer);

		// Append the event list item to the event list
		eventList.appendChild(eventItem);
	}
}

async function loadEventsFromServer() {
	try {
		const response = await fetch('/systemAdmin/events');
		const events = await response.json();
		displayEvents(events);
	} catch (error) {
		console.error('Error loading events:', error);
	}
}

async function addEvent() {
	const dateInput = document.getElementById('datepicker');
	const selectedDate = dateInput.value;
	if (selectedDate) {
		const eventName = prompt('Enter event name:');
		if (eventName) {
			try {
				const response = await fetch('/systemAdmin/events', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ date: selectedDate, eventName }),
				});
				if (response.ok) {
					loadEventsFromServer();
				} else {
					console.error('Failed to add event:', response.statusText);
				}
			} catch (error) {
				console.error('Error adding event:', error);
			}
		}
	}
}

async function editEvent(date, eventName) {
	const newEventName = prompt('Edit event name:', eventName);
	if (newEventName) {
		try {
			const response = await fetch(`/systemAdmin/events/${date}/${eventName}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ newEventName }),
			});
			if (response.ok) {
				loadEventsFromServer();
			} else {
				console.error('Failed to edit event:', response.statusText);
			}
		} catch (error) {
			console.error('Error editing event:', error);
		}
	}
}

async function deleteEvent(date, eventName) {
	const confirmDelete = confirm(
		`Are you sure you want to delete '${eventName}' on ${date}?`
	);
	if (confirmDelete) {
		try {
			const response = await fetch(`/systemAdmin/events/${date}/${eventName}`, {
				method: 'DELETE',
			});
			if (response.ok) {
				loadEventsFromServer();
			} else {
				console.error('Failed to delete event:', response.statusText);
			}
		} catch (error) {
			console.error('Error deleting event:', error);
		}
	}
}

flatpickr('#datepicker', {
	enableTime: true,
	dateFormat: 'Y-m-d H:i',
	minDate: 'today',
});


loadEventsFromServer();
