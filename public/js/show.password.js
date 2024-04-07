document
	.getElementById('togglePassword2')
	.addEventListener('click', function () {
		const passwordInput = document.getElementById('password');
		const password2Input = document.getElementById('password2');
		const type =
			passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
		passwordInput.setAttribute('type', type);
		password2Input.setAttribute('type', type);
	});
