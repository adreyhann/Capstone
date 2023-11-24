document.addEventListener('DOMContentLoaded', function () {
	const chart1 = document.getElementById('myChart').getContext('2d');

	new Chart(chart1, {
		type: 'bar',
		data: {
			labels: ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 6'],
			datasets: [
				{
					label: 'Number of Students',
					data: [20, 30, 40, 20, 30, 20, 10],
					fill: true,
					backgroundColor: [
						'rgba(54, 162, 235, 0.2)',
						'rgba(255, 99, 132, 0.2)',
						'rgba(255, 205, 86, 0.2)',
						'rgba(153, 102, 255, 0.2)',
						'rgba(54, 162, 235, 0.2)',
						'rgba(153, 102, 255, 0.2)',
						'rgba(201, 203, 207, 0.2)',
					],
					borderColor: [
						'rgba(54, 162, 235, 1)',
						'rgba(255, 99, 132, 1)',
						'rgb(255, 205, 86)',
						'rgb(153, 102, 255)',
						'rgb(201, 203, 207)',
					],
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
			scales: {
				y: {
					beginAtZero: true,
				},
			},
			layout: {
				height: 10,
			},
		},
	});
});

// reports chart
const ctx = document.getElementById('reportChart').getContext('2d');

// Function to fetch data from the server
async function fetchData() {
  try {
    const response = await fetch('/systemAdmin/get-record-counts'); // Update the route accordingly
    if (response.ok) {
      const data = await response.json();
      updateChart(data);
    } else {
      console.error('Failed to fetch data');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to update the chart
function updateChart(data) {
  const myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Archived'],
      datasets: [{
        label: 'Records',
        data: [data.activeCount, data.archivedCount],
        backgroundColor: ['#FF6384', '#36A2EB'],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

// Call the fetchData function to initially populate the chart
fetchData();

