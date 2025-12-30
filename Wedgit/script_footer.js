// script_footer.js - Role Management & Dynamic Date

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. تحديد السنة الحالية تلقائياً
    const yearSpan = document.getElementById("year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 2. إدارة الصلاحيات (Role Based Footer Links)
    const role = localStorage.getItem("auth_role"); // قراءة الرتبة (admin / client)
    
    const adminLinks = document.querySelectorAll(".admin-link");
    const clientLinks = document.querySelectorAll(".client-link");

    if (role === 'admin') {
        // إذا كان أدمن: أظهر روابط الأدمن وأخف روابط الزبون
        adminLinks.forEach(link => link.style.display = "block");
        clientLinks.forEach(link => link.style.display = "none");
    } else {
        // إذا كان زبون (أو غير مسجل): أظهر روابط الزبون وأخف روابط الأدمن
        adminLinks.forEach(link => link.style.display = "none");
        clientLinks.forEach(link => link.style.display = "block");
    }

    // 3. تعديل رابط اللوجو في الفوتر ليوجه للداشبورد الصحيح
    const footerLogoLink = document.querySelector(".footer-logo-link");
    if (footerLogoLink) {
        if (role === 'admin') {
            footerLogoLink.href = "/Home/admin_dashboard.html";
        } else {
            footerLogoLink.href = "/Home/client_dashboard.html";
        }
    }
});