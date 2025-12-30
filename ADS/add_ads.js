document.addEventListener("DOMContentLoaded", () => {
  /* ===============================
       0. التحقق من تسجيل الدخول
    ================================ */
  const token = localStorage.getItem("token");

  if (!token) {
    alert("يرجى تسجيل الدخول أولاً");
    window.location.href = "/Auth/Login.html";
    return;
  }

  /* ===============================
       1. عناصر الإدخال
    ================================ */
  const form = document.getElementById("adsForm");

  const titleInput = document.getElementById("titleInput");
  const descInput = document.getElementById("descInput"); // للمعاينة فقط
  const imageInput = document.getElementById("imageInput");

  /* ===============================
       2. عناصر المعاينة
    ================================ */
  const previewBox = document.getElementById("livePreview");
  const prevTitle = document.getElementById("prevTitle");
  const prevDesc = document.getElementById("prevDesc");

  /* ===============================
       3. تحديث المعاينة النصية
    ================================ */
  function updatePreviewText() {
    prevTitle.textContent = titleInput.value || "عنوان الإعلان";
    prevDesc.textContent = descInput.value || "وصف الإعلان سيظهر هنا";
  }

  titleInput.addEventListener("input", updatePreviewText);
  descInput.addEventListener("input", updatePreviewText);

  /* ===============================
       4. تحديث معاينة الصورة
    ================================ */
  imageInput.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      previewBox.style.backgroundImage = `url(${e.target.result})`;
    };
    reader.readAsDataURL(file);
  });

  /* ===============================
       5. إرسال الإعلان إلى الباك
    ================================ */
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!imageInput.files.length) {
      alert("يرجى اختيار صورة للإعلان");
      return;
    }


    const formData = new FormData();
    formData.append("title", titleInput.value);
    formData.append("description", descInput.value); // إضافة الوصف
    formData.append("image", imageInput.files[0]);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/ads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert("تم نشر الإعلان بنجاح");
        window.location.href = "Add_ADS.html";
      } else {
        alert(result.message || "حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      console.error(error);
      alert("خطأ في الاتصال بالخادم");
    }
  });
});
