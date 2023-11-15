document.addEventListener('DOMContentLoaded', function () {
	var calendarEl = document.getElementById('calendar');
  
	var calendar = new FullCalendar.Calendar(calendarEl, {
	  selectable: true,
	  droppable: true,
	  headerToolbar: {
		left: 'prev,next today',
		center: 'title',
		right: 'dayGridMonth,timeGridWeek,timeGridDay',
	  },
	  drop: function (info) {
		var eventData = {
		  title: prompt('Enter event title:'),
		  start: info.dropDate,
		  allDay: true,
		};
  
		if (eventData.title) {
		  // Send the event to the server to save
		  fetch('/events', {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify(eventData),
		  })
			.then(response => response.json())
			.then(data => {
			  eventData.id = data.id;
			  calendar.addEvent(eventData);
			})
			.catch(err => {
			  console.error(err);
			});
		}
	  },
	  dateClick: function (info) {
		var eventData = prompt('Enter event title:');
		if (eventData) {
		  var event = {
			title: eventData,
			start: info.date,
			allDay: true,
		  };
  
		  // Send the event to the server to save
		  fetch('/events', {
			method: 'POST',
			headers: {
			  'Content-Type': 'application/json',
			},
			body: JSON.stringify(event),
		  })
			.then(response => response.json())
			.then(data => {
			  event.id = data.id;
			  calendar.addEvent(event);
			})
			.catch(err => {
			  console.error(err);
			});
		}
	  },
	  eventClick: function (info) {
		var action = prompt('Edit or Delete event (e/d)?');
		if (action === 'e') {
		  var newEventData = prompt('Edit event title:', info.event.title);
		  if (newEventData) {
			var event = info.event;
			event.title = newEventData;
  
			// Update the event on the server
			fetch('/events/' + event.id, {
			  method: 'PUT',
			  headers: {
				'Content-Type': 'application/json',
			  },
			  body: JSON.stringify(event),
			})
			  .then(response => response.json())
			  .then(data => {
				calendar.updateEvent(event);
			  })
			  .catch(err => {
				console.error(err);
			  });
		  }
		} else if (action === 'd') {
		  var deleteConfirmation = confirm('Are you sure you want to delete this event?');
		  if (deleteConfirmation) {
			// Delete the event from the server
			fetch('/events/' + info.event.id, {
			  method: 'DELETE',
			})
			  .then(response => response.json())
			  .then(data => {
				if (data.deleted) {
				  calendar.removeEvent(info.event);
				}
			  })
			  .catch(err => {
				console.error(err);
			  });
		  }
		}
	  },
	  eventDrop: function (info) {
		info.event.start = info.dropDate;
  
		// Update the event on the server
		fetch('/events/' + info.event.id, {
		  method: 'PUT',
		  headers: {
			'Content-Type': 'application/json',
		  },
		  body: JSON.stringify(info.event),
		})
		  .then(response => response.json())
		  .then(data => {
			calendar.updateEvent(info.event);
		  })
		  .catch(err => {
			console.error(err);
		  });
	  },
	  eventResize: function (info) {
		info.event.end = info.end;
  
		// Update the event on the server
		fetch('/events/' + info.event.id, {
		  method: 'PUT',
		  headers: {
			'Content-Type': 'application/json',
		  },
		  body: JSON.stringify(info.event),
		})
		  .then(response => response.json())
		  .then(data => {
			calendar.updateEvent(info.event);
		  })
		  .catch(err => {
			console.error(err);
		  });
	  },
	});
  
	calendar.render();
  });
  