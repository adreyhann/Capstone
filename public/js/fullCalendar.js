document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        editable: true,
        dayMaxEventRows: true, // Enable maximum event rows per day
        dateClick: function(info) {
            // Handle date click event
            const eventName = prompt('Enter event name:');
            const eventData = {
                date: info.dateStr,
                eventName: eventName,
            };

            // Perform AJAX request to add new event
            fetch('/systemAdmin/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            })
            .then(response => response.json())
            .then(data => {
                console.log('New event added:', data);
                // Refresh the calendar to display the new event
                calendar.refetchEvents();
            })
            .catch(error => console.error('Error:', error));
        },
        eventClick: function(info) {
            const eventDetails = `${info.event.title}\n${info.event.extendedProps.eventName}`;
            // Create a confirmation dialog with a custom button label for deletion
            const result = confirm(`${eventDetails}\n\nAre you sure you want to delete this event?`);
            if (result) {
                // If the user confirms deletion, perform AJAX request to delete event
                fetch(`/systemAdmin/events/${info.event.id}`, {
                    method: 'DELETE'
                })
                .then(response => {
                    if (response.ok) {
                        console.log('Event deleted successfully');
                        // Refresh the calendar to remove the deleted event
                        calendar.refetchEvents();
                    } else {
                        console.error('Failed to delete event:', response.statusText);
                    }
                })
                .catch(error => console.error('Error:', error));
            }
        },
        
        eventDrop: function(info) {
            // Handle event drop event
            const eventData = {
                date: info.event.startStr
            };
            // Perform AJAX request to update event start date
            fetch(`/systemAdmin/events/${info.event.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Event start date updated:', data);
                // Refresh the calendar to reflect the updated event
                calendar.refetchEvents();
            })
            .catch(error => console.error('Error:', error));
        },
        eventResize: function(info) {
            // Handle event resize event
            const eventData = {
                date: info.event.endStr
            };
            // Perform AJAX request to update event end date
            fetch(`/systemAdmin/events/${info.event.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            })
            .then(response => response.json())
            .then(data => {
                console.log('Event end date updated:', data);
                // Refresh the calendar to reflect the updated event
                calendar.refetchEvents();
            })
            .catch(error => console.error('Error:', error));
        },
        events: '/systemAdmin/events', // Fetch events from backend
        eventContent: function(arg) {
            // Customize event content to include event name
            return { html: `<div>${arg.event.title}</div><div>${arg.event.extendedProps.eventName}</div>` };
        }
    });
    calendar.render();
});
