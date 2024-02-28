const numberInput = document.getElementById('lrn');
numberInput.addEventListener('input', function () {
	if (this.value.length > 12) {
		this.value = this.value.slice(0, 12); // Limit to 5 characters
	}
});


