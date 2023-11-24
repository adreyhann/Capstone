const events = {};

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
        }
      }
    }

    function displayEvents() {
      const eventList = document.getElementById('eventList');
      eventList.innerHTML = '';
      for (const date in events) {
        const eventItem = document.createElement('li');
        eventItem.textContent = `${date}: ${events[date].join(', ')}`;
        eventList.appendChild(eventItem);
      }
    }

    flatpickr("#datepicker", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
    });