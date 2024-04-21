// Show loading spinner when the page starts loading
$(window).on('load', function() {
    $('#loadingSpinnerContainer').show();
});

// Hide loading spinner when the page finishes loading
$(document).ready(function() {
    $('#loadingSpinnerContainer').hide();
});
