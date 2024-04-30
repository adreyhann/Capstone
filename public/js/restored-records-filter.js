document.querySelectorAll('.restored-records-link').forEach((link) => {
	link.addEventListener('click', async (event) => {
		event.preventDefault(); 

		const academicYear = link.dataset.academicYear;

		try {
			const [, endYear] = academicYear.split('-');

			window.location.href = `/systemAdmin/restored-records-list?academicYear=${endYear}`;
		} catch (error) {
			console.error('Error:', error);
			alert('An error occurred while redirecting to the records');
		}
	});
});
