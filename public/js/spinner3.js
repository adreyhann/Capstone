document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('editUserForm');
	const submitButton = document.getElementById('submitButton');

	form.addEventListener('submit', function () {
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
		submitButton.disabled = true;
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('editUserModal');
	const submitButton = document.getElementById('submitButton');

	form.addEventListener('submit', function () {
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
		submitButton.disabled = true;
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('forgotpass');
	const submitButton = document.getElementById('submitButton');

	form.addEventListener('submit', function () {
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
		submitButton.disabled = true;
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('resetCode');
	const submitButton = document.getElementById('submitButton');

	form.addEventListener('submit', function () {
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
		submitButton.disabled = true;
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('resetpass');
	const submitButton = document.getElementById('submitButton');

	form.addEventListener('submit', function () {
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
		submitButton.disabled = true;
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('login');
	const submitButton = document.getElementById('submitButton');

	form.addEventListener('submit', function () {
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
		submitButton.disabled = true;
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('addRecord');
	const submitButton = document.getElementById('submitButton');

	form.addEventListener('submit', function () {
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Please wait...';
		submitButton.disabled = true;
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('addFile');
	const submitButton = document.getElementById('submitButton');

	form.addEventListener('submit', function () {
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...';
		submitButton.disabled = true;
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('deleteFile');
	const submitButton = document.getElementById('deleteButton');

	form.addEventListener('submit', function () {
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
		submitButton.disabled = true;
	});
});

document.addEventListener('DOMContentLoaded', function () {
	const form = document.getElementById('editRecordForm');
	const submitButton = document.getElementById('submitButton');

	form.addEventListener('submit', function () {
		submitButton.innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
		submitButton.disabled = true;
	});
});
