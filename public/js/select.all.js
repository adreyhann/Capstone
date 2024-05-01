$(document).ready(function () {
    // Function to handle the checkbox click event
    function handleCheckboxClick() {
        // Check if at least two checkboxes are checked
        const numChecked = $('input[name="selectedRecords"]:checked').length;
        const buttonsVisible = numChecked >= 2;
        
        // Toggle the visibility of the buttons based on checkbox status
        $('#archiveButton, #advancedButton').toggle(buttonsVisible);
    }

    // Event listener for select all checkbox
    $('#selectAll').click(function () {
        // Check/uncheck all checkboxes based on the select all checkbox status
        $('input[name="selectedRecords"]').prop('checked', this.checked);
        
        // Update button visibility
        handleCheckboxClick();
    });

    // Event listener for individual checkboxes
    $('input[name="selectedRecords"]').click(function () {
        // Update button visibility
        handleCheckboxClick();
    });

    // Event listener for archive select all checkbox
    $('#selectAllArchive').click(function () {
        // Check/uncheck all checkboxes based on the archive select all checkbox status
        $('input[name="archivedRecords"]').prop('checked', this.checked);
        
        // Update button visibility
        updateArchivedButtonVisibility();
    });

    // Event listener for individual archived checkboxes
    $('input[name="archivedRecords"]').click(function () {
        // Update select all checkbox status
        $('#selectAllArchive').prop('checked', $('input[name="archivedRecords"]:checked').length === $('input[name="archivedRecords"]').length);
        
        // Update button visibility
        updateArchivedButtonVisibility();
    });

    // Function to update visibility of buttons based on archived checkbox status
    function updateArchivedButtonVisibility() {
        const anyCheckboxChecked = $('input[name="archivedRecords"]:checked').length > 0;
        
        $('#archiveButton, #advancedButton').toggle(anyCheckboxChecked);
    }
});
