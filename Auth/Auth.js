/* auth.js - FIXED & SAFE */

const CSRF_TOKEN = document
  .querySelector('meta[name="csrf-token"]')
  ?.getAttribute("content");

/* =========================
   LOGIN
========================= */
const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email.includes("@")) {
      errorMsg.textContent = "Invalid email";
      return;
    }

    if (password.length < 6) {
      errorMsg.textContent = "Password too short";
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

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_role", data.user.role);
        localStorage.setItem("auth_user", JSON.stringify(data.user));

        if (data.user.role === "admin") {
          window.location.href = "/Home/admin_dashboard.html";
        } else {
          window.location.href = "/Home/client_dashboard.html";
        }
      } else {
        errorMsg.textContent = data.message || "Login failed";
      }
    } catch (err) {
      console.error(err);
      errorMsg.textContent = "Server error";
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

    const name = document.getElementById("fullname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const passwordcomf = document.getElementById("passwordcomf").value;
    const phone = document.getElementById("phone").value;

    if (password !== passwordcomf) {
      alert("Passwords do not match");
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
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem(
          "auth_role",
          data.user.role || "user" // افتراضي user
        );
        localStorage.setItem("auth_user", JSON.stringify(data.user));

        window.location.href = "/Home/client_dashboard.html";
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });
});
