document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("auth_token");
    const role  = localStorage.getItem("auth_role");

    // 1️⃣ إذا لا يوجد تسجيل دخول
    if (!token || !role) {
        window.location.href = "/Auth/Log_in.html";
        return;
    }

    // 2️⃣ لو Admin فتح صفحة مستخدم
    if (window.location.pathname.includes("client") && role === "admin") {
        window.location.href = "/Home/admin_dashboard.html";
    }

    // 3️⃣ لو User فتح صفحة أدمن
    if (window.location.pathname.includes("admin") && role === "user") {
        window.location.href = "/Home/client_dashboard.html";
    }
});
