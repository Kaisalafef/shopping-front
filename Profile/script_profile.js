document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const API_BASE_URL = "http://127.0.0.1:8000/api";

  if (!token) {
    window.location.href = "/Auth/Log_in.html";
    return;
  }

  const saveBtn = document.getElementById("save-btn");
  const editBtn = document.getElementById("edit-btn");

  const roleBadge = document.getElementById("role-text");
  const customerSection = document.getElementById("customer-section");
  const adminSection = document.getElementById("admin-section");

  let currentUserId = null;

  /* ===============================
     1. PROFILE
  ================================ */
  async function fetchUserProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error();

      const profile = await res.json();
      const user = profile.data || profile;

      currentUserId = user.id;

      document.getElementById("info-fullname").innerText = user.name;
      document.getElementById("display-name").innerText = user.name;
      document.getElementById("edit-fullname").value = user.name;

      document.getElementById("info-email").innerText = user.email;
      document.getElementById("edit-email").value = user.email;

      document.getElementById("info-phone").innerText = user.phone;
      document.getElementById("edit-phone").value = user.phone;

      checkAdminOrUser();
    } catch {
      alert("فشل تحميل الملف الشخصي");
    }
  }

  /* ===============================
     2. CHECK ROLE (SMART WAY)
  ================================ */
  async function checkAdminOrUser() {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error();

      // ✅ أدمن
      roleBadge.innerText = "مدير النظام";
      roleBadge.style.background = "#e74c3c";

      customerSection.style.display = "none";
      adminSection.style.display = "block";

      fetchAllOrdersForAdmin();
    } catch {
      // ✅ مستخدم
      roleBadge.innerText = "زبون";

      adminSection.style.display = "none";
      customerSection.style.display = "block";

      fetchCustomerOrders();
    }
  }

  /* ===============================
     3. USER ORDERS
  ================================ */
  async function fetchCustomerOrders() {
    const tbody = document.getElementById("customer-orders-body");
    tbody.innerHTML = "";

    try {
      const res = await fetch(`${API_BASE_URL}/orders/user/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orders = await res.json();

      if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="4">لا توجد طلبات</td></tr>`;
        return;
      }

      orders.forEach((o) => {
        tbody.innerHTML += `
          <tr>
            <td>#${o.id}</td>
            <td>${formatDate(o.created_at)}</td>
            <td>${o.total_price}$</td>
            <td>${translateStatus(o.status)}</td>
          </tr>`;
      });
    } catch {
      tbody.innerHTML = `<tr><td colspan="4">خطأ في تحميل الطلبات</td></tr>`;
    }
  }

  /* ===============================
     4. ADMIN ORDERS
  ================================ */
  async function fetchAllOrdersForAdmin() {
    const tbody = document.getElementById("admin-orders-body");
    tbody.innerHTML = "";

    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const orders = await res.json();

      orders.forEach((o) => {
        tbody.innerHTML += `
          <tr>
            <td>#${o.id}</td>
            <td>${o.user?.name || "—"}</td>
            <td>${formatDate(o.created_at)}</td>
            <td>${o.total_price}$</td>
            <td>${translateStatus(o.status)}</td>
          </tr>`;
      });
    } catch {
      tbody.innerHTML = `<tr><td colspan="5">خطأ</td></tr>`;
    }
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString("ar-EG");
  }

  function translateStatus(s) {
    return (
      {
        pending: "قيد الانتظار",
        processing: "جاري التحضير",
        completed: "مكتمل",
        cancelled: "ملغى",
        delivered: "تم التوصيل",
      }[s] || s
    );
  }

  fetchUserProfile();

  /* ===============================
   EDIT MODE
================================ */
  function toggleEditMode(isEditing) {
    const infoTexts = document.querySelectorAll(".info-item p");
    const inputs = document.querySelectorAll(".edit-input");

    if (isEditing) {
      infoTexts.forEach((p) => (p.style.display = "none"));
      inputs.forEach((i) => (i.style.display = "block"));

      editBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
    } else {
      infoTexts.forEach((p) => (p.style.display = "block"));
      inputs.forEach((i) => (i.style.display = "none"));

      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
    }
  }

  /* زر تعديل */
  editBtn.addEventListener("click", () => {
    toggleEditMode(true);
  });


  /* زر حفظ */
  saveBtn.addEventListener("click", async () => {
  const password = document.getElementById("edit-pass").value.trim();
  const passwordConfirm = document.getElementById("edit-pass-confirm").value.trim();

  if (password || passwordConfirm) {
    if (password.length < 8) {
      alert("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    if (password !== passwordConfirm) {
      alert("كلمتا المرور غير متطابقتين");
      return;
    }
  }

  const updatedData = {
    name: document.getElementById("edit-fullname").value,
    email: document.getElementById("edit-email").value,
    phone: document.getElementById("edit-phone").value,
  };

  if (password) {
    updatedData.password = password;
    updatedData.password_confirmation = passwordConfirm;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });

    if (!res.ok) throw new Error();

    const result = await res.json();
    const user = result.data || result;

    document.getElementById("info-fullname").innerText = user.name;
    document.getElementById("display-name").innerText = user.name;
    document.getElementById("info-email").innerText = user.email;
    document.getElementById("info-phone").innerText = user.phone;

    toggleEditMode(false);
    alert("تم تحديث البيانات بنجاح");
  } catch {
    alert("فشل تحديث البيانات");
  }
});


document.querySelectorAll(".toggle-pass").forEach(icon => {
  icon.addEventListener("click", () => {
    const inputId = icon.getAttribute("data-target");
    const input = document.getElementById(inputId);

    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
});


});
