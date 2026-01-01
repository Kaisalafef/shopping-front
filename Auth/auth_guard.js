(function () {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("auth_role");

  const path = window.location.pathname;

  // صفحات عامة
  const publicPages = [
    "/Auth/Log_in.html",
    "/Auth/Sign_up.html"
  ];

  // لو غير مسجل
  if (!token && !publicPages.some(p => path.includes(p))) {
    window.location.replace("/Auth/Log_in.html");
    return;
  }

  // لو مسجل ويحاول يدخل صفحات auth
  if (token && publicPages.some(p => path.includes(p))) {
    if (role === "admin") {
      window.location.replace("/Home/admin_dashboard.html");
    } else {
      window.location.replace("/Home/client_dashboard.html");
    }
    return;
  }

  // حماية صفحات الادمن
  if (path.includes("/Home/admin") && role !== "admin") {
    window.location.replace("/Home/client_dashboard.html");
    return;
  }

  // حماية صفحات المستخدم
  if (path.includes("/Home/client") && role !== "user") {
    window.location.replace("/Home/admin_dashboard.html");
    return;
  }
})();
