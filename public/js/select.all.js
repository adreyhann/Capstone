$(document).ready(function () {
	function handleCheckboxClick() {
		const numChecked = $('input[name="selectedRecords"]:checked').length;
		const buttonsEnabled = numChecked >= 2;

		$('#archiveButton, #advancedButton').prop('disabled', !buttonsEnabled);
	}

	$('#selectAll').click(function () {
		$('input[name="selectedRecords"]').prop('checked', this.checked);

		handleCheckboxClick();
	});

	$('input[name="selectedRecords"]').click(function () {
		handleCheckboxClick();
	});

	$('#selectAllArchive').click(function () {
		$('input[name="archivedRecords"]').prop('checked', this.checked);

		updateArchivedButtonVisibility();
	});

	$('input[name="archivedRecords"]').click(function () {
		$('#selectAllArchive').prop(
			'checked',
			$('input[name="archivedRecords"]:checked').length ===
				$('input[name="archivedRecords"]').length
		);

		updateArchivedButtonVisibility();
	});

	function updateArchivedButtonVisibility() {
		const anyCheckboxChecked =
			$('input[name="archivedRecords"]:checked').length > 0;

		$('#archiveButton, #advancedButton').prop('disabled', !anyCheckboxChecked);
	}

	// Initialize buttons to be disabled by default
	$('#archiveButton, #advancedButton').prop('disabled', true);
});
