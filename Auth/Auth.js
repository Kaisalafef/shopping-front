/* auth.js - FIXED & SAFE */

const CSRF_TOKEN = document
  .querySelector('meta[name="csrf-token"]')
  ?.getAttribute("content");

/* =========================
   LOGIN
========================= */
const loginForm = document.getElementById("loginForm");
const generalError = document.getElementById("generalError");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (password.length < 6) {
      errorMsg.textContent = "Password too short";

      return;
    }
    // 1. إعادة تعيين الرسائل وإخفاؤها عند كل محاولة جديدة
    generalError.style.display = "none";
    generalError.textContent = "";

    // تحقق مبدئي بسيط
    if (!email || !password) {
      showError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // 🧹 تنظيف قديم
        localStorage.clear();

        localStorage.setItem("token", data.token);
        localStorage.setItem("auth_role", data.user.role);
        localStorage.setItem("auth_user", JSON.stringify(data.user));

        if (data.user.role === "admin") {
          window.location.replace("/Home/admin_dashboard.html");
        } else {
          window.location.replace("/Home/client_dashboard.html");
        }
      } else {
        const msg =
          data.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        showError(msg);
      }
    } catch (err) {
      console.error(err);
      showError(
        "عذراً، يوجد مشكلة في الاتصال بالسيرفر. تأكد من تشغيل الـ Backend."
      );
    }
  });
}

/* =========================
   REGISTER
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");

  if (!signupForm) return;

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (signupError) {
      signupError.style.display = "none";
      signupError.textContent = "";
    }
    const name = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const passwordcomf = document.getElementById("passwordcomf").value;
    const phone = document.getElementById("phone").value;
    if (!name || !email || !password || !phone) {
      showSignupError("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }
    if (password !== passwordcomf) {
      showSignupError("كلمتا المرور غير متطابقتين");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/register", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordcomf,
          phone,
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // 🧹 تنظيف أي بيانات قديمة
        localStorage.clear();

        // ✅ تخزين صحيح
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "auth_role",
          data.user.role || "user" // افتراضي user
        );
        localStorage.setItem("auth_user", JSON.stringify(data.user));

        window.location.href = "/Home/client_dashboard.html";
      } else {
        // --- فشل التسجيل (بيانات مكررة أو غير صالحة) ---
        // عرض الرسالة القادمة من الباك إند أو رسالة افتراضية
        let msg = data.message || "فشل إنشاء الحساب، يرجى المحاولة مرة أخرى";

        // تحسين: لو الباك إند يرجع أخطاء تفصيلية (Validation Errors)
        if (data.errors) {
          // نأخذ أول خطأ موجود ونعرضه
          msg = Object.values(data.errors).flat()[0];
        }
        showSignupError(msg);
      }
    } catch (err) {
      console.error(err);
      showSignupError("عذراً، لا يمكن الاتصال بالسيرفر حالياً");
    }
  });
});
// تفعيل أزرار العين في صفحات Login و Sign_up
document.querySelectorAll(".toggle-password").forEach((icon) => {
  icon.addEventListener("click", function () {
    // البحث عن حقل الإدخال الموجود في نفس الحاوية (input-group أو password-container)
    const input = this.parentElement.querySelector("input");

    if (input.type === "password") {
      input.type = "text";
      this.classList.replace("fa-eye", "fa-eye-slash");
    } else {
      input.type = "password";
      this.classList.replace("fa-eye-slash", "fa-eye");
    }
  });
});
function showSignupError(message) {
  if (signupError) {
    signupError.textContent = message;
    signupError.style.display = "block";
  } else {
    alert(message);
  }
}
// دالة مساعدة لإظهار الخطأ
function showError(message) {
  if (generalError) {
    generalError.textContent = message;
    generalError.style.display = "block"; // هذا السطر مهم لأن CSS يجعله مخفياً
    generalError.style.color = "#d63031"; // لون أحمر للتأكيد
  } else {
    alert(message); // احتياطي لو العنصر غير موجود
  }
}
