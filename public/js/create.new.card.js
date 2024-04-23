// Function to add a new section
async function addNewSection() {
    const sectionName = prompt('Enter the name of the new section:');
    if (sectionName) {
        try {
            const response = await fetch('/systemAdmin/sections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: sectionName, description: `List of students in ${sectionName}` }),
            });
            if (!response.ok) {
                throw new Error('Failed to add section');
            }
            const data = await response.json();
            
            
            alert(`Section "${data.name}" added successfully!`);
            location.reload();
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

