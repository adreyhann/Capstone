const chart2 = document.getElementById('studentChart');

// Function to fetch record counts based on gradeLevel
async function fetchRecordCounts() {
    try {
        const response = await fetch('/admin/get-gradeLevel-counts');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching record counts:', error);
        throw error;
    }
}

 
// Function to update the chart with record counts
async function updateChart() {
    try {
        const recordCounts = await fetchRecordCounts();

        // // Retrieve stored colors from local storage
        // const storedColors = JSON.parse(localStorage.getItem('chartColors')) || {};

        // // Use stored colors or generate new ones
        // const backgroundColors = storedColors[chart2.id] || generateRandomColors(recordCounts.labels.length);

        new Chart(chart2, {
            type: 'bar',
            data: {
                labels: recordCounts.labels,
                datasets: [
                    {
                        label: 'Number of Students',
                        data: recordCounts.counts,
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });

         // Store the generated colors in local storage for reuse
         storedColors[chart2.id] = backgroundColors;
         localStorage.setItem('chartColors', JSON.stringify(storedColors));
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

// Call the updateChart function to initialize the chart
updateChart();
