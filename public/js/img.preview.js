// Function to open the transparent card overlay and display the clicked image
function openImagePreview(img) {
    var card = document.getElementById("imagePreviewCard");
    var previewedImage = document.getElementById("previewedImage");
    var profilePicture = img.getAttribute('data-profile-picture');
    previewedImage.src = profilePicture;
    card.style.display = "block";
}

// Function to close the transparent card overlay
function closeImagePreview() {
    var card = document.getElementById("imagePreviewCard");
    card.style.display = "none";
}
