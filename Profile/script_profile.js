document.addEventListener("DOMContentLoaded", () => {
  /* ===============================
     0. التحقق من تسجيل الدخول
  ================================ */
  const token = localStorage.getItem("token");

  if (!token) {
    alert("يرجى تسجيل الدخول أولاً");
    window.location.href = "/Auth/Log_in.html";
    return;
  }

  const saveBtn = document.getElementById("save-btn");
  const editBtn = document.getElementById("edit-btn");

  /* ===============================
     1. جلب بيانات الملف الشخصي
  ================================ */
  async function fetchUserProfile() {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/profile", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const profile = await response.json();

      document.getElementById("info-fullname").innerText = profile.name;
      document.getElementById("display-name").innerText = profile.name;
      document.getElementById("edit-fullname").value = profile.name;

      document.getElementById("info-email").innerText = profile.email;
      document.getElementById("edit-email").value = profile.email;

      document.getElementById("info-phone").innerText = profile.phone;
      document.getElementById("edit-phone").value = profile.phone;
    } catch (error) {
      console.error(error);
      alert("خطأ في جلب بيانات الملف الشخصي");
    }
  }

  fetchUserProfile();

  /* ===============================
     2. وضع التعديل
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
     3. التحقق من صحة البيانات
  ================================ */
  function validateForm() {
    let isValid = true;

    const name = document.getElementById("edit-fullname");
    const email = document.getElementById("edit-email");
    const phone = document.getElementById("edit-phone");

    if (name.value.trim().length < 3) {
      showError(name, "error-fullname");
      isValid = false;
    } else hideError(name, "error-fullname");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
      showError(email, "error-email");
      isValid = false;
    } else hideError(email, "error-email");

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
     4. حفظ التعديلات
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
      const response = await fetch("http://127.0.0.1:8000/api/profile", {
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
        document.getElementById("info-fullname").innerText = result.data.name;
        document.getElementById("display-name").innerText = result.data.name;
        document.getElementById("info-email").innerText = result.data.email;
        document.getElementById("info-phone").innerText = result.data.phone;

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
     5. إظهار / إخفاء كلمة المرور
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
