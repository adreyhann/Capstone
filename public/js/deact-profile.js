function deactivateAccount() {
    // Send a fetch request to the deactivate route
    try {
        fetch('/systemAdmin/deactivateProfile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle success response
            console.log(data);
            alert('Your account has been deactivated successfully');
            window.location.href = '/'; // Redirect to login page after deactivation
        })
        .catch(error => {
            // Handle error
            console.error('Error:', error);
            alert('Failed to deactivate your account');
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to deactivate your account');
    }
}
