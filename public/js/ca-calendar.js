// Load events from local storage on page load
const events = JSON.parse(localStorage.getItem('events')) || {};

function addEvent() {
  const dateInput = document.getElementById('datepicker');
  const selectedDate = dateInput.value;
  if (selectedDate) {
    if (!events[selectedDate]) {
      events[selectedDate] = [];
    }
    const eventName = prompt('Enter event name:');
    if (eventName) {
      events[selectedDate].push(eventName);
      displayEvents();
      saveEventsToLocalStorage();
    }
  }
}

function editEvent(date, eventName) {
  const newEventName = prompt('Edit event name:', eventName);
  if (newEventName) {
    const eventIndex = events[date].indexOf(eventName);
    if (eventIndex !== -1) {
      events[date][eventIndex] = newEventName;
      displayEvents();
      saveEventsToLocalStorage();
    }
  }
}

function deleteEvent(date, eventName) {
  const confirmDelete = confirm(`Are you sure you want to delete '${eventName}' on ${date}?`);
  if (confirmDelete) {
    events[date] = events[date].filter(e => e !== eventName);
    if (events[date].length === 0) {
      delete events[date];
    }
    displayEvents();
    saveEventsToLocalStorage();
  }
}

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

          const buttonContainer = document.createElement('div');
          buttonContainer.style.display = 'flex'; // Make it a flex container
          buttonContainer.style.marginLeft = 'auto'; // Push the buttons to the right

          const editButton = document.createElement('button');
          editButton.textContent = 'Edit';
          editButton.className = 'btn btn-sm btn-info';
          editButton.onclick = function () {
              editEvent(date, eventName);
          };

          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.className = 'btn btn-sm btn-danger ms-1'; // Add margin to separate buttons
          deleteButton.onclick = function () {
              deleteEvent(date, eventName);
          };


          eventItem.appendChild(eventNameText);
          eventItem.appendChild(buttonContainer);
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
