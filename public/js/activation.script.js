// Script for deactivating the user account
async function moveUserToActive(userId) {
    const confirmMove = confirm("Are you sure you want to activate this user?");
  
    if (confirmMove) {
        try {
            const response = await fetch(`/systemAdmin/activate/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
  
            if (response.ok) {
                alert('User activated successfully');
                location.reload(); // Refresh the page to reflect the changes
            } else {
                alert('Failed to move record from archive');
                
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
  }
  