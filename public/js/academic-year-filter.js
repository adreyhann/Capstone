// for system admin
const academicYearLinks = document.querySelectorAll('.academic-year-link');

academicYearLinks.forEach(link => {
  link.addEventListener('click', async (event) => {
    event.preventDefault(); 

    const selectedYear = link.dataset.academicYear;

    try {
      const endYear = selectedYear.split('-')[1];

      window.location.href = `/systemAdmin/archives?year=${endYear}`;
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while redirecting to the archives');
    }
  });
});
