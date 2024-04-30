document.querySelectorAll('.restored-records-link').forEach(link => {
  link.addEventListener('click', async (event) => {
      event.preventDefault(); // Prevent the default link behavior

      // Get the academicYear value from the data attribute
      const academicYear = link.dataset.academicYear;

      try {
          // Extract the end year from the academicYear value
          const [, endYear] = academicYear.split('-');

          // Redirect to the records page with the academic year filter
          window.location.href = `/systemAdmin/restored-records-list?academicYear=${endYear}`;
      } catch (error) {
          console.error('Error:', error);
          alert('An error occurred while redirecting to the records');
      }
  });
});
