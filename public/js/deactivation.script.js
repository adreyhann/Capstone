function deactivateUser(userId) {
    const confirmDeactivation = confirm("Are you sure you want to deactivate this user?");
  
    if (confirmDeactivation) {
      // Use AJAX to your backend route for deactivation
      // Example using fetch API:
      fetch(`/systemAdmin/deactivate/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Include any additional data if needed
        // body: JSON.stringify({ userId: userId }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          console.log(data);
          alert('User deactivated successfully');
          // Optionally, redirect to another page or update the UI
          // window.location.href = '/dashboard';
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Error deactivating user');
        });
    }
  }
  