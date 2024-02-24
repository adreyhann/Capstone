// Load events from local storage on page load
const events = JSON.parse(localStorage.getItem('events')) || {};


function displayEvents() {
  const eventList = document.getElementById('eventList');
  eventList.innerHTML = '';

  for (const date in events) {
      const dateItem = document.createElement('li');
      dateItem.style.listStyle = 'none'; // Remove default list styling
      dateItem.style.marginBottom = '10px'; // Add some margin for spacing
      dateItem.style.display = 'flex';
      dateItem.style.justifyContent = 'space-between'; // Align content to the right
      dateItem.style.alignItems = 'center';

      const dateText = document.createElement('span');
      dateText.textContent = date + ':';
      dateItem.appendChild(dateText);

      const eventSubList = document.createElement('ul');
      eventSubList.style.listStyle = 'none'; // Remove default list styling
      eventSubList.style.padding = '0'; // Remove default padding

      for (const eventName of events[date]) {
          const eventItem = document.createElement('li');
          eventItem.style.display = 'flex';
          eventItem.style.justifyContent = 'center'; // Align content to the center
          eventItem.style.alignItems = 'center';
          eventItem.style.width = '100%'; // Ensure the full width is used

          const eventNameText = document.createElement('span');
          eventNameText.textContent = eventName;
          eventNameText.style.display = 'flex'
          eventNameText.style.justifyContent = 'center'
          eventNameText.style.alignItems = 'center'
          eventNameText.style.marginRight = '70px'; // Push the text to the left

          eventItem.appendChild(eventNameText);
          eventSubList.appendChild(eventItem);
      }

      dateItem.appendChild(eventSubList);
      eventList.appendChild(dateItem);
  }
}

function saveEventsToLocalStorage() {
  localStorage.setItem('events', JSON.stringify(events));
}

flatpickr("#datepicker", {
  enableTime: true,
  dateFormat: "Y-m-d H:i",
});

// Initial display of events on page load
displayEvents();
