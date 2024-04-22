const currentYear = new Date().getFullYear();

// Calculate the next year
const nextYear = currentYear + 1;

// Display the school year dynamically
document.getElementById(
	'school-year'
).textContent = `S/Y: ${currentYear}-${nextYear}`;
