document.addEventListener('DOMContentLoaded', function () {
	const selectAllCheckbox = document.getElementById('selectAllArchive');
	const archivedRecordCheckboxes = document.querySelectorAll(
		'input[name="archivedRecords"]'
	);
	const unArchiveButton = document.getElementById('unArchiveButton');

	function toggleCheckboxes() {
		archivedRecordCheckboxes.forEach((checkbox) => {
			checkbox.checked = selectAllCheckbox.checked;
		});
		updateUnArchiveButtonVisibility(selectAllCheckbox.checked);
	}

	function updateUnArchiveButtonVisibility() {
		const checkedCount = document.querySelectorAll(
			'input[name="archivedRecords"]:checked'
		).length;
		unArchiveButton.style.display = checkedCount >= 2 ? 'inline-block' : 'none';
	}

	selectAllCheckbox.addEventListener('change', function () {
		toggleCheckboxes();
	});

	archivedRecordCheckboxes.forEach((checkbox) => {
		checkbox.addEventListener('change', function () {
			
			selectAllCheckbox.checked =
				archivedRecordCheckboxes.length ===
				document.querySelectorAll('input[name="archivedRecords"]:checked')
					.length;
			updateUnArchiveButtonVisibility();
		});
	});
});
