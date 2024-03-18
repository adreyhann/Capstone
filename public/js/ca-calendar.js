// Load events from local storage on page load
const events = JSON.parse(localStorage.getItem('events')) || {};

// Function to display events
function displayEvents() {
    const eventList = document.getElementById('eventList');
    eventList.innerHTML = '';

    // Loop through each date in the events object
    for (const date in events) {
        // Create a list item for each date
        const dateItem = document.createElement('li');
        dateItem.className = 'list-group-item';

        // Create a span to display the date
        const dateSpan = document.createElement('span');
        dateSpan.textContent = date + ':';
        dateItem.appendChild(dateSpan);

        // Create a nested unordered list for the event names
        const eventSubList = document.createElement('ul');

        // Loop through each event name for the current date
        for (const eventName of events[date]) {
            // Create a list item for each event name
            const eventItem = document.createElement('li');
            eventItem.className = 'd-flex justify-content-between align-items-center';
            eventItem.textContent = eventName;
            eventSubList.appendChild(eventItem);
        }

        // Append the nested list to the date list item
        dateItem.appendChild(eventSubList);

        // Append the date list item to the main event list
        eventList.appendChild(dateItem);
    }
}

// Initial display of events on page load
displayEvents();