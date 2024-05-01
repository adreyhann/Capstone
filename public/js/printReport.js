document.getElementById('printReportBtn').addEventListener('click', function() {
    // Initialize jsPDF
    var doc = new jsPDF();

    // Add a title to the PDF
    doc.setFontSize(16);
    doc.text('Activity Report', 10, 10);

    // Convert the table to a PDF
    doc.autoTable({
        html: '#activityTable', // ID of the table
        startY: 20 // Start position
    });

    // Save the PDF
    doc.save('activity_report.pdf');
});
