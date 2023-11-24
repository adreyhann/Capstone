// reports chart
const chart = document.getElementById('reportsChart').getContext('2d');

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
	const myChart = new Chart(chart, {
		type: 'doughnut',
		data: {
			labels: ['Active', 'Archived'],
			datasets: [
				{
					label: 'Records',
					data: [data.activeCount, data.archivedCount],
					backgroundColor: ['#FF6384', '#36A2EB'],
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
		},
	});
}

// Call the fetchData function to initially populate the chart
fetchData();



