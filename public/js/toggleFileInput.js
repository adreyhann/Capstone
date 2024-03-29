function toggleFileInput() {
	var transfereeSelect = document.getElementById('transferee');
	var fileInputSection = document.getElementById('oldFileInputSection');
	if (transfereeSelect.value === 'Yes') {
		fileInputSection.style.display = '';
	} else {
		fileInputSection.style.display = 'none';
	}
}
