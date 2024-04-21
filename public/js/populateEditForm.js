function populateEditForm(
    recordId,
    lrn,
    lname,
    fname,
    gender,
    transferee,
    gradeLevel
) {
    document
        .getElementById('editRecordForm')
        .setAttribute('action', `/systemAdmin/edit-record/${recordId}`);
    document.getElementById('editLrn').value = lrn;
    document.getElementById('editLName').value = lname;
    document.getElementById('editFName').value = fname;
    document.getElementById('editGender').value = gender;
    document.getElementById('editTransferee').value = transferee;
    document.getElementById('editGradeLevel').value = gradeLevel;
}