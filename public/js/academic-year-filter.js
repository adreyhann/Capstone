// Get all academic year links
const academicYearLinks = document.querySelectorAll('.academic-year-link');

// Add event listeners to each link
academicYearLinks.forEach(link => {
  link.addEventListener('click', async (event) => {
    event.preventDefault(); // Prevent default link behavior

    // Get the academic year from the data attribute
    const selectedYear = link.dataset.academicYear;

    try {
      // Split the academic year range to get the end year
      const endYear = selectedYear.split('-')[1];

      // Redirect to the archive route with the end year as a query parameter
      window.location.href = `/systemAdmin/archives?year=${endYear}`;
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while redirecting to the archives');
    }
  });
});
