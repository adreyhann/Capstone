$(document).ready(function () {
    
    $('#selectAll').click(function () {
        $('input[name="selectedRecords"]').prop('checked', this.checked);
        updateArchivedButtonVisibility();
    });

    $('input[name="selectedRecords"]').click(function () {
        $('#selectAll').prop('checked', $('input[name="selectedRecords"]:checked').length === $('input[name="selectedRecords"]').length);
        updateArchivedButtonVisibility();
    });

    function updateArchivedButtonVisibility() {
        const anyCheckboxChecked = $('input[name="selectedRecords"]:checked').length > 0;
        
        $('#archiveButton, #advancedButton').toggle(anyCheckboxChecked);
    }
});
