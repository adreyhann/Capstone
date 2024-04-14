document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('selectPdfButton').addEventListener('click', function() {
        document.getElementById('newPdf').click();
    });

    document.getElementById('newPdf').addEventListener('change', function() {
        document.getElementById('selectedFileName').textContent = this.files[0].name;
    });
});