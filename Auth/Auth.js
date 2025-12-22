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
    icon.addEventListener("click", function () {
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



//link log in 
const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");
if (loginForm) {
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Validation client-side
    if (!email.includes("@")) {
        errorMsg.textContent = "Please enter a valid email.";
        return;
    }

    if (password.length < 6) {
        errorMsg.textContent = "Password must be at least 6 characters.";
        return;
    }

    errorMsg.textContent = "";

    // إرسال البيانات كـ JSON
    fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
        .then(res => res.json().then(data => ({ status: res.status, body: data })))
        .then(({ status, body }) => {
            if (status === 200 && body.token) {

                // حفظ التوكن
                localStorage.setItem("token", body.token);

                // (اختياري) حفظ بيانات المستخدم
                localStorage.setItem("user", JSON.stringify(body.user));

                // التوجيه حسب الدور
                if (body.user.role === "admin") {
                    window.location.href = "/Home/admin_dashboard.html";
                } else if (body.user.role === "user") {
                    window.location.href = "/Home/client_dashboard.html";
                } else {
                    // في حال دور غير معروف
                    window.location.href = "/Home/client_dashboard.html";
                }

            } else {
                errorMsg.textContent = body.message || "Login failed";
            }
        })

        .catch(err => {
            console.error(err);
            errorMsg.textContent = "Server error, please try again later.";
        });
});


}
//////////////////////link sign up 
document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
      if(signupForm){
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // قراءة القيم
        const name = document.getElementById("fullname").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const passwordcomf = document.getElementById("passwordcomf").value;
        const phone = document.getElementById("phone").value;

        // التحقق client-side
        let hasError = false;
        if (name.length < 3) {
            showError("fullname", "Name must be at least 3 characters.");
            hasError = true;
        } else {
            clearError("fullname");
        }

        if (!email.includes("@")) {
            showError("email", "Please enter a valid email.");
            hasError = true;
        } else {
            clearError("email");
        }

        if (password.length < 8) {
            showError("password", "Password must be at least 8 characters.");
            hasError = true;
        } else if (password !== passwordcomf) {
            showError("passwordcomf", "Passwords do not match.");
            hasError = true;
        } else {
            clearError("password");
            clearError("passwordcomf");
        }

        if (hasError) return;

        // إعداد البيانات للإرسال
        const data = {
            name,
            email,
            password,
            password_confirmation: passwordcomf,
            phone
        };

        try {
            const response = await fetch("http://127.0.0.1:8000/api/register", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const resData = await response.json();

            if (response.ok) {
                alert(resData.message || "Account created successfully!");
                // تخزين التوكن
                localStorage.setItem("token", resData.token);
                // تحويل المستخدم مباشرة إلى لوحة التحكم أو الصفحة الرئيسية
                if (resData.user.role === "admin") {
                    window.location.href = "/Home/admin_dashboard.html";
                } else if (resData.user.role === "user") {
                    window.location.href = "/Home/client_dashboard.html";
                } else {
                    // في حال دور غير معروف
                    window.location.href = "/Home/client_dashboard.html";
                }
            } else {
                // عرض رسالة الخطأ من السيرفر
                alert(resData.message || "Registration failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Server error, please try again later.");
        }
    }); }

    // دوال مساعدة لعرض الأخطاء
    function showError(fieldId, message) {
        const small = document.querySelector(`small[data-for="${fieldId}"]`);
        if (small) small.textContent = message;
    }

    function clearError(fieldId) {
        const small = document.querySelector(`small[data-for="${fieldId}"]`);
        if (small) small.textContent = "";
    }
});
