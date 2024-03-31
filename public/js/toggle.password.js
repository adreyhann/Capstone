document
	.getElementById('togglePassword')
	.addEventListener('click', function () {
		const passwordInput = document.getElementById('password');
		const type =
			passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
		passwordInput.setAttribute('type', type);
		const icon = this.querySelector('i');
		icon.textContent = type === 'password' ? 'visibility' : 'visibility_off';
	});
