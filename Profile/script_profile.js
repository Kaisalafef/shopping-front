document.addEventListener("DOMContentLoaded", () => {
  /* ===============================
     0. إعدادات والتحقق من التوكن
  ================================ */
  const token = localStorage.getItem("token");
  // قم بتغيير الرابط أدناه حسب عنوان الـ API الخاص بك
  const API_BASE_URL = "http://127.0.0.1:8000/api"; 

  if (!token) {
    alert("يرجى تسجيل الدخول أولاً");
    window.location.href = "/Auth/Log_in.html";
    return;
  }

  const saveBtn = document.getElementById("save-btn");
  const editBtn = document.getElementById("edit-btn");

  /* ===============================
     1. جلب بيانات الملف الشخصي وتحديد الصلاحية
  ================================ */
  async function fetchUserProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const result = await response.json();
      // تأكد أن البيانات تأتي مباشرة أو داخل data
      const profile = result.data || result;

      // تعبئة البيانات في الصفحة
      document.getElementById("info-fullname").innerText = profile.name;
      document.getElementById("display-name").innerText = profile.name;
      document.getElementById("edit-fullname").value = profile.name;

      document.getElementById("info-email").innerText = profile.email;
      document.getElementById("edit-email").value = profile.email;

      document.getElementById("info-phone").innerText = profile.phone;
      document.getElementById("edit-phone").value = profile.phone;

      // === التحقق من صلاحية المستخدم (Admin vs User) ===
      // افترضنا أن الباك إند يعيد حقلاً اسمه role أو is_admin
      const isAdmin = (profile.role === 'admin' || profile.is_admin === 1);
      
      const roleBadge = document.getElementById("role-text");
      const customerSection = document.getElementById("customer-section");
      const adminSection = document.getElementById("admin-section");

      if (isAdmin) {
        // إعدادات الأدمن
        roleBadge.innerText = "مدير النظام";
        roleBadge.style.backgroundColor = "#e74c3c";
        roleBadge.style.color = "#fff";
        
        customerSection.style.display = "none";
        adminSection.style.display = "block";
        
        // جلب جميع الطلبات
        fetchAllOrdersForAdmin();
      } else {
        // إعدادات الزبون
        roleBadge.innerText = "زبون";
        
        customerSection.style.display = "block";
        adminSection.style.display = "none";
        
        // جلب طلباتي فقط
        fetchCustomerOrders();
      }

    } catch (error) {
      console.error(error);
      alert("خطأ في جلب بيانات الملف الشخصي");
    }
  }

  // استدعاء الدالة عند تحميل الصفحة
  fetchUserProfile();

  /* ===============================
     2. دوال جلب الطلبات (Orders)
  ================================ */
  
  // أ) جلب طلبات الزبون الحالي
  async function fetchCustomerOrders() {
    try {
      // Endpoint لجلب طلبات المستخدم المسجل فقط
      const response = await fetch(`${API_BASE_URL}/my-orders`, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error fetching orders");
      const result = await response.json();
      const orders = result.data || result;

      const tbody = document.getElementById("customer-orders-body");
      tbody.innerHTML = "";

      if (!orders || orders.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>لا توجد طلبات سابقة</td></tr>";
        return;
      }

      orders.forEach(order => {
        const row = `
          <tr>
            <td>#${order.id}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>${order.total_price}$</td>
            <td><span class="status-badge ${getStatusClass(order.status)}">${translateStatus(order.status)}</span></td>
          </tr>
        `;
        tbody.innerHTML += row;
      });
    } catch (error) {
      console.error(error);
    }
  }

  // ب) جلب كل الطلبات للأدمن
  async function fetchAllOrdersForAdmin() {
    try {
      // Endpoint لجلب جميع الطلبات في النظام
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Error fetching admin orders");
      const result = await response.json();
      const orders = result.data || result;

      const tbody = document.getElementById("admin-orders-body");
      tbody.innerHTML = "";

      if (!orders || orders.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5'>لا يوجد طلبات في النظام</td></tr>";
        return;
      }

      orders.forEach(order => {
        const clientName = order.user ? order.user.name : "عميل محذوف";
        const row = `
          <tr>
            <td>#${order.id}</td>
            <td>${clientName}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>${order.total_price}$</td>
            <td><span class="status-badge ${getStatusClass(order.status)}">${translateStatus(order.status)}</span></td>
          </tr>
        `;
        tbody.innerHTML += row;
      });
    } catch (error) {
      console.error(error);
    }
  }

  // ج) دوال مساعدة للتنسيق
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ar-EG');
  }

  function getStatusClass(status) {
    switch (status) {
      case 'completed': return 'status-done';
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'cancelled': return 'status-cancelled';
      case 'delivered': return 'status-done';
      default: return '';
    }
  }

  function translateStatus(status) {
    const map = {
      'pending': 'قيد الانتظار',
      'processing': 'جاري التحضير',
      'completed': 'مكتمل',
      'cancelled': 'ملغى',
      'delivered': 'تم التوصيل'
    };
    return map[status] || status;
  }

  /* ===============================
     3. وضع التعديل (Edit Mode)
  ================================ */
  function toggleEditMode(isEditing) {
    const infoTexts = document.querySelectorAll(".info-item p");
    const inputs = document.querySelectorAll(".edit-input, .pass-wrapper");

    if (isEditing) {
      infoTexts.forEach((p) => (p.style.display = "none"));
      inputs.forEach((input) => (input.style.display = "block"));
      document.getElementById("edit-pass").value = "";
      
      editBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
    } else {
      infoTexts.forEach((p) => (p.style.display = "block"));
      inputs.forEach((input) => (input.style.display = "none"));
      
      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
    }
  }

  editBtn.addEventListener("click", () => toggleEditMode(true));

  /* ===============================
     4. التحقق من صحة البيانات (Validation)
  ================================ */
  function validateForm() {
    let isValid = true;

    const name = document.getElementById("edit-fullname");
    const email = document.getElementById("edit-email");
    const phone = document.getElementById("edit-phone");

    // تحقق الاسم
    if (name.value.trim().length < 3) {
      showError(name, "error-fullname");
      isValid = false;
    } else hideError(name, "error-fullname");

    // تحقق الايميل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
      showError(email, "error-email");
      isValid = false;
    } else hideError(email, "error-email");

    // تحقق الهاتف
    if (phone.value.length < 10 || isNaN(phone.value)) {
      showError(phone, "error-phone");
      isValid = false;
    } else hideError(phone, "error-phone");

    return isValid;
  }

  function showError(input, errorId) {
    input.classList.add("is-invalid");
    const errEl = document.getElementById(errorId);
    if (errEl) errEl.style.display = "block";
  }

  function hideError(input, errorId) {
    input.classList.remove("is-invalid");
    const errEl = document.getElementById(errorId);
    if (errEl) errEl.style.display = "none";
  }

  /* ===============================
     5. حفظ التعديلات (Save Profile)
  ================================ */
  saveBtn.addEventListener("click", async () => {
    if (!validateForm()) return;

    const updatedData = {
      name: document.getElementById("edit-fullname").value,
      email: document.getElementById("edit-email").value,
      phone: document.getElementById("edit-phone").value,
    };
    
    const password = document.getElementById("edit-pass").value;
    const passwordConfirm = document.getElementById("edit-pass-confirm").value;

    if (password.trim() !== "") {
      updatedData.password = password;
      updatedData.password_confirmation = passwordConfirm;
    }

    saveBtn.innerText = "جاري الحفظ...";
    saveBtn.disabled = true;

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const result = await response.json();

      if (response.ok) {
        const newData = result.data || result;
        document.getElementById("info-fullname").innerText = newData.name;
        document.getElementById("display-name").innerText = newData.name;
        document.getElementById("info-email").innerText = newData.email;
        document.getElementById("info-phone").innerText = newData.phone;

        toggleEditMode(false);
        alert(result.message || "تم تحديث البيانات بنجاح");
      } else {
        alert(result.message || "حدث خطأ أثناء التحديث");
      }
    } catch (error) {
      console.error(error);
      alert("خطأ في الاتصال بالخادم");
    } finally {
      saveBtn.innerText = "حفظ التغييرات";
      saveBtn.disabled = false;
    }
  });

  /* ===============================
     6. إظهار / إخفاء كلمة المرور
  ================================ */
  window.togglePassword = function () {
    const passInput = document.getElementById("edit-pass");
    const icon = document.querySelector(".toggle-pass");

    if (passInput.type === "password") {
      passInput.type = "text";
      icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
      passInput.type = "password";
      icon.classList.replace("fa-eye-slash", "fa-eye");
    }
  };
});