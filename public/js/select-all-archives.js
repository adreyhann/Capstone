document.addEventListener("DOMContentLoaded", function () {
    // Select All checkbox
    const selectAllCheckbox = document.getElementById("selectAllArchive");
    const archivedRecordCheckboxes = document.querySelectorAll('input[name="archivedRecords"]');
    const unArchiveButton = document.getElementById("unArchiveButton");

    // Function to toggle all checkboxes based on the select all checkbox
    function toggleCheckboxes() {
        archivedRecordCheckboxes.forEach((checkbox) => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        updateUnArchiveButtonVisibility(selectAllCheckbox.checked);
    }

    // Function to update the state of the Unarchive button
    function updateUnArchiveButtonVisibility(checked) {
        unArchiveButton.style.display = checked ? "inline-block" : "none";
    }

    // Event listener for the select all checkbox
    selectAllCheckbox.addEventListener("change", function () {
        toggleCheckboxes();
    });

    // Event listener for individual checkboxes
    archivedRecordCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener("change", function () {
            // If any checkbox is unchecked, uncheck the select all checkbox
            selectAllCheckbox.checked = archivedRecordCheckboxes.length === document.querySelectorAll('input[name="archivedRecords"]:checked').length;
            updateUnArchiveButtonVisibility(selectAllCheckbox.checked);
        });
    });
});
