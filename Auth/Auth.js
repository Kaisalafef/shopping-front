/* auth.js - متوافق مع Laravel */

const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

// --- 1. التحقق من قوة كلمة المرور ---
const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('strengthBar');
const strengthMeter = document.getElementById('strengthMeter');

if (passwordInput && strengthBar) {
    passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        strengthMeter.style.display = 'block';
        let strength = 0;

        if (val.length > 6) strength += 25;
        if (val.match(/[a-z]/) && val.match(/[A-Z]/)) strength += 25;
        if (val.match(/\d/)) strength += 25;
        if (val.match(/[^a-zA-Z\d]/)) strength += 25;

        strengthBar.style.width = strength + '%';
        
        // تغيير الألوان بناءً على القوة
        if (strength <= 25) strengthBar.style.background = '#d63031'; // ضعيفة
        else if (strength <= 50) strengthBar.style.background = '#f1c40f'; // متوسطة
        else strengthBar.style.background = '#00b894'; // قوية
    });
}

// --- 2. إظهار وإخفاء كلمة المرور ---
document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", function() {
        const input = this.parentElement.querySelector("input");
        input.type = input.type === "password" ? "text" : "password";
        this.classList.toggle("fa-eye-slash");
    });
});

// --- 3. وظيفة عرض الأخطاء ---
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorMsg = input.closest('.input-group').querySelector('.error-msg');
    input.classList.add('invalid');
    errorMsg.innerText = message;
    errorMsg.style.display = 'block';
}

function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
    document.querySelectorAll('input').forEach(el => el.classList.remove('invalid'));
}

// --- 4. إرسال البيانات لـ Laravel ---
async function handleSignup(e) {
    e.preventDefault();
    clearErrors();

    const formData = new FormData();
    formData.append('name', document.getElementById('fullname').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('password', document.getElementById('password').value);

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': CSRF_TOKEN,
                'Accept': 'application/json'
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = data.redirect || '/home';
        } else if (response.status === 422) {
            // معالجة أخطاء الـ Validation القادمة من Laravel
            Object.keys(data.errors).forEach(key => {
                showError(key === 'name' ? 'fullname' : key, data.errors[key][0]);
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

document.getElementById('signupForm')?.addEventListener('submit', handleSignup);