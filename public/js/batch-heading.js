document.addEventListener('DOMContentLoaded', () => {
    const batchYearHeader = document.getElementById('batchYear');
    const urlParams = new URLSearchParams(window.location.search);
    const academicYearParam = urlParams.get('academicYear');

    if (academicYearParam) {
        const [startYear, endYear] = academicYearParam.trim().split('-').map(year => parseInt(year));
        if (!isNaN(startYear) && !isNaN(endYear)) {
            batchYearHeader.textContent = `Batch ${startYear} - ${endYear}`;
        }
    }
});