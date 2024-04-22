// Function to create a new card element
function createCard(sectionName) {
    const card = document.createElement('div');
    card.classList.add('card', 'custom-card-3', 'border-0', 'p-0');
    card.style.width = '14rem';
    card.style.height = '8rem';
    card.style.position = 'relative';

    const cardHeader = document.createElement('div');
    cardHeader.classList.add('card-header', 'bg-info', 'border-0');
    card.appendChild(cardHeader);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    const cardTitle = document.createElement('h5');
    cardTitle.classList.add('card-title');
    cardTitle.style.fontWeight = 'bold';
    cardTitle.innerText = sectionName;
    cardBody.appendChild(cardTitle);

    const badge = document.createElement('span');
    badge.classList.add('badge', 'text-bg-secondary', 'position-absolute', 'top-0', 'end-0');
    badge.innerText = '0';
    cardHeader.appendChild(badge);

    const cardText = document.createElement('p');
    cardText.classList.add('card-text');
    cardText.innerText = `View records of ${sectionName}`;
    cardBody.appendChild(cardText);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('btn', 'btn-sm', 'btn-danger', 'position-absolute', 'bottom-0', 'start-0', 'mb-3', 'ms-3');
    deleteButton.innerText = 'Delete';
    deleteButton.addEventListener('click', function() {
        card.remove();
        saveSections();
    });
    card.appendChild(deleteButton);

    card.appendChild(cardBody);

    return card;
}

// Function to save sections to localStorage
function saveSections() {
    const cardContainer = document.getElementById('cardContainer');
    const sectionNames = Array.from(cardContainer.children).map(card => card.querySelector('.card-title').innerText);
    localStorage.setItem('sections', JSON.stringify(sectionNames));
}

// Function to load sections from localStorage
function loadSections() {
    const storedSections = localStorage.getItem('sections');
    if (storedSections) {
        const sectionNames = JSON.parse(storedSections);
        const cardContainer = document.getElementById('cardContainer');
        sectionNames.forEach(sectionName => {
            const newCard = createCard(sectionName);
            cardContainer.appendChild(newCard);
        });
    }
}

// Function to handle adding a new section
function addNewSection() {
    const sectionName = prompt('Enter the name of the new section:');
    if (sectionName) {
        const cardContainer = document.getElementById('cardContainer');
        const newCard = createCard(sectionName);
        cardContainer.appendChild(newCard);
        saveSections();
    }
}

// Event listener for the "Add new section" button
const addSectionBtn = document.getElementById('addSectionBtn');
addSectionBtn.addEventListener('click', addNewSection);

// Load sections when the page loads
window.addEventListener('DOMContentLoaded', loadSections);
