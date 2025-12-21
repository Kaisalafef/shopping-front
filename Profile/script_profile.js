document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-btn');
    const editBtn = document.getElementById('edit-btn');
    
    // --- 1. Toggle Edit Mode Logic ---
    function toggleEditMode(isEditing) {
        const infoTexts = document.querySelectorAll('.info-item p');
        const inputs = document.querySelectorAll('.edit-input, .pass-wrapper');

        if (isEditing) {
            infoTexts.forEach(p => p.style.display = 'none');
            inputs.forEach(input => input.style.display = 'block');
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
        } else {
            infoTexts.forEach(p => p.style.display = 'block');
            inputs.forEach(input => input.style.display = 'none');
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
        }
    }

    // --- 2. Edit Button Click ---
    editBtn.addEventListener('click', () => {
        toggleEditMode(true);
    });

    // --- 3. Save Button Logic ---
    saveBtn.addEventListener('click', async () => {
        if (!validateForm()) return;

        const updatedData = {
            name: document.getElementById('edit-fullname').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value
        };

        saveBtn.innerText = "جاري الحفظ...";
        saveBtn.disabled = true;

        const response = await updateUserDataOnServer(updatedData);

        if (response.success) {
            // Update UI with new values
            document.getElementById('info-fullname').innerText = updatedData.name;
            document.getElementById('display-name').innerText = updatedData.name;
            document.getElementById('info-email').innerText = updatedData.email;
            document.getElementById('info-phone').innerText = updatedData.phone;

            toggleEditMode(false);
            alert('تم التحديث بنجاح!');
        }

        saveBtn.innerText = "حفظ التغييرات";
        saveBtn.disabled = false;
    });

    // --- 4. Validation ---
    function validateForm() {
        let isValid = true;
        const name = document.getElementById('edit-fullname');
        const email = document.getElementById('edit-email');
        const phone = document.getElementById('edit-phone');

        if (name.value.trim().length < 3) {
            showError(name, 'error-fullname');
            isValid = false;
        } else hideError(name, 'error-fullname');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            showError(email, 'error-email');
            isValid = false;
        } else hideError(email, 'error-email');

        if (phone.value.length < 10 || isNaN(phone.value)) {
            showError(phone, 'error-phone');
            isValid = false;
        } else hideError(phone, 'error-phone');

        return isValid;
    }

    function showError(input, errorId) {
        input.classList.add('is-invalid');
        const errEl = document.getElementById(errorId);
        if (errEl) errEl.style.display = 'block';
    }

    function hideError(input, errorId) {
        input.classList.remove('is-invalid');
        const errEl = document.getElementById(errorId);
        if (errEl) errEl.style.display = 'none';
    }

    // --- 5. Password Toggle ---
    // Defined on window so the HTML onclick can find it
    window.togglePassword = function() {
        const passInput = document.getElementById('edit-pass');
        const icon = document.querySelector('.toggle-pass');
        if (passInput.type === "password") {
            passInput.type = "text";
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passInput.type = "password";
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    };

    // Simulated Server Function
    async function updateUserDataOnServer(data) {
        return new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 1000);
        });
    }
});