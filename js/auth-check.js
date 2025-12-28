document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("auth_token");
    const role  = localStorage.getItem("auth_role");

    // 1️⃣ غير مسجل دخول
    if (!token || !role) {
        window.location.href = "/Auth/Log_in.html";
        return;
    }

    const path = window.location.pathname.toLowerCase();

    // 2️⃣ حماية صفحات الأدمن
    if (path.includes("admin") && role !== "admin") {
        window.location.href = "/Home/client_dashboard.html";
        return;
    }

    // 3️⃣ حماية صفحات المستخدم
    if (path.includes("client") && role !== "user") {
        window.location.href = "/Home/admin_dashboard.html";
        return;
    }

    // 4️⃣ حماية إضافية (اختيارية)
    // منع أي شخص من تغيير الدور يدويًا في localStorage
    if (role !== "admin" && role !== "user") {
        localStorage.clear();
        window.location.href = "/Auth/Log_in.html";
    }
});
