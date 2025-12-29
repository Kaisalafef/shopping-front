/* ضع هذا الكود في ملف JS الخاص بصفحة add_Proudct.html */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. التحقق من وجود editId في الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('editId');

    // إذا كان هناك ID، فهذا يعني أننا في وضع "التعديل" وليس "الإضافة"
    if (productId) {
        enableEditMode(productId);
    }
});

async function enableEditMode(id) {
    // تغيير عنوان الصفحة وزر الحفظ ليعرف المستخدم أنه يعدل
    const title = document.querySelector('h2') || document.getElementById('pageTitle'); // عدل الـ Selector حسب الـ HTML
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if(title) title.textContent = "تعديل المنتج";
    if(submitBtn) submitBtn.textContent = "حفظ التعديلات";

    try {
        // 2. جلب بيانات المنتج من السيرفر
        // ملاحظة: تأكد من أن رابط الـ API صحيح
        const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
             headers: {
                'Accept': 'application/json',
                // أضف التوكن إذا كان مطلوباً للعرض
                // 'Authorization': `Bearer ${localStorage.getItem("token")}` 
            }
        });

        if (!response.ok) throw new Error('فشل جلب بيانات المنتج');

        const result = await response.json();
        // قد تكون البيانات داخل result أو result.data حسب الـ API الخاص بك
        const product = result.data || result; 

        // 3. تعبئة الحقول بالبيانات (غير الـ IDs لتناسب الـ HTML الخاص بك)
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productCategory').value = product.category;
        
        // عرض الصورة الحالية إن وجدت
        const imgPreview = document.getElementById('imagePreview'); // افترض وجود عنصر لعرض الصورة
        if (imgPreview && product.image_url) {
            imgPreview.src = product.image_url;
            imgPreview.style.display = 'block';
        }

        // 4. تعديل سلوك زر الحفظ ليقوم بـ (UPDATE) بدلاً من (CREATE)
        setupUpdateAction(id, submitBtn);

    } catch (error) {
        console.error('Error fetching product:', error);
        alert('حدث خطأ أثناء تحميل بيانات المنتج للتعديل');
    }
}

function setupUpdateAction(id, btn) {
    // نقوم باستبدال دالة الإرسال لتكون PUT بدلاً من POST
    const form = document.querySelector('form'); // أو ID الفورم الخاص بك
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        // تجهيز البيانات (FormData يستخدم لرفع الصور والبيانات)
        const formData = new FormData(form);
        
        // لارافيل أحياناً تحتاج لتحديد الميثود داخل الـ Body عند استخدام FormData
        formData.append('_method', 'PUT'); 

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
                method: 'POST', // نستخدم POST مع _method: PUT لأن المتصفحات لا تدعم PUT مع FormData مباشرة أحياناً
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    // لا تضع Content-Type عند استخدام FormData، المتصفح يضعه تلقائياً
                },
                body: formData
            });

            if (response.ok) {
                alert('تم تعديل المنتج بنجاح');
                window.location.href = '/Products.html?role=admin'; // العودة للمنتجات
            } else {
                const err = await response.json();
                alert('فشل التعديل: ' + (err.message || 'تأكد من البيانات'));
            }
        } catch (error) {
            console.error(error);
            alert('خطأ في الاتصال');
        }
    };
}
/**
 * Product Management Script
 * Colors (with images) + Sizes (separate)
 */
const getAuthHeaders = () => ({
  Accept: "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

(function () {
  "use strict";

  /* ========== COLORS LIST ========== */
  const COLORS = [
    { label: "أسود", value: "black" },
    { label: "أبيض", value: "white" },
    { label: "أحمر", value: "red" },
    { label: "أزرق", value: "blue" },
    { label: "أخضر", value: "green" },
    { label: "أصفر", value: "yellow" },
    { label: "رمادي", value: "gray" },
    { label: "بيج", value: "beige" },
    { label: "بني", value: "brown" },
  ];
/* ========== CATEGORIES DATA ========== */
  const categoryTitles = {
    'electronics': 'الإلكترونيات',
    'food': 'المواد الغذائية',
    'meals': 'المأكولات',
    'makeup': 'مستحضرات التجميل',
    'men': 'أزياء رجالية',
    'women': 'أزياء نسائية',
    'perfume': 'العطور',
    'cleaning': 'المنظفات',
    'furniture': 'المفروشات',
    'sweets': 'الحلويات'
  };

  /* ========== POPULATE CATEGORIES ========== */
  const categorySelect = document.getElementById('category');
  
  // التأكد من أن العنصر موجود قبل محاولة إضافة الخيارات
  if (categorySelect) {
      Object.entries(categoryTitles).forEach(([key, label]) => {
          const option = document.createElement('option');
          option.value = key;       // القيمة التي ستُرسل للسيرفر (مثلاً: electronics)
          option.textContent = label; // النص الذي يظهر للمستخدم (مثلاً: الإلكترونيات)
          categorySelect.appendChild(option);
      });
  }
  /* ========== STATE ========== */
  const state = {
    colors: [],
    sizes: [],
    colorId: 0,
    sizeId: 0,
    isEdit: false,
    productId: null,
  };

  /* ========== DOM ========== */
  const els = {
    title: document.getElementById("title"),
    price: document.getElementById("price"),
    description: document.getElementById("description"),
    category: document.getElementById("category"),
    brand: document.getElementById("brand"),
    colorsList: document.getElementById("colorsList"),
    sizesList: document.getElementById("sizesList"),
    addColorBtn: document.getElementById("addColorBtn"),
    addSizeBtn: document.getElementById("addSizeBtn"),
    saveBtn: document.getElementById("saveBtn"),
    toast: document.getElementById("toast"),
    pageTitle: document.querySelector(".page-header h1"),
  };

  /* ========== TOAST ========== */
  const toast = (msg, error = false) => {
    els.toast.textContent = msg;
    els.toast.style.background = error ? "#ef4444" : "#1f2937";
    els.toast.classList.remove("hidden");
    setTimeout(() => els.toast.classList.add("hidden"), 3000);
  };

  /* ========== ADD COLOR ========== */
  /* ========== ADD COLOR ========== */
const addColorRow = (data = {}) => {
  const id = ++state.colorId;

  // التحقق مما إذا كانت هناك صورة موجودة مسبقاً (حالة التعديل)
  const initialImage = data.image || "";
  const shouldShowImage = initialImage !== "";

  const color = {
    id,
    value: data.color || "",
    file: null,
    image: initialImage,
  };

  state.colors.push(color);

  const row = document.createElement("div");
  row.className = "option-item";

  row.innerHTML = `
      <select class="form-select" style="margin-bottom: 0.5rem ;">
          <option value="">اختر لون</option>
          ${COLORS.map(
            (c) => `<option value="${c.value}">${c.label}</option>`
          ).join("")}
      </select>
      
      <div class="preview-container" style="text-align: center; margin-bottom: 10px;">
          <img class="img-preview" 
               src="${initialImage}" 
               alt="معاينة الصورة" 
               style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; border: 1px solid #e5e7eb; padding: 4px; display: ${shouldShowImage ? 'block' : 'none'};">
      </div>

      <label class="custom-file-upload">
          <input type="file" accept="image/*">
          <i class="${shouldShowImage ? 'fas fa-check-circle' : 'fas fa-cloud-upload-alt'}"></i>
          <span class="upload-text">${shouldShowImage ? 'تغيير الصورة' : 'اختر صورة للون'}</span>
      </label>

      <button type="button" class="btn-remove" style="position: absolute; left: 10px; top: 10px;">&times;</button>
  `;

  // تعريف العناصر
  const select = row.querySelector("select");
  const fileInput = row.querySelector("input[type=file]");
  const uploadLabel = row.querySelector(".custom-file-upload");
  const uploadText = row.querySelector(".upload-text");
  const uploadIcon = row.querySelector(".custom-file-upload i");
  const imgPreview = row.querySelector(".img-preview"); // عنصر الصورة
  const remove = row.querySelector(".btn-remove");

  // تعيين القيمة الابتدائية للون
  select.value = color.value;

  // عند تغيير اللون
  select.onchange = (e) => (color.value = e.target.value);

  // === الجزء المسؤول عن المعاينة ===
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    color.file = file;

    if (file) {
      // 1. قراءة الملف وعرضه
      const reader = new FileReader();
      
      reader.onload = function(e) {
          imgPreview.src = e.target.result; // وضع الرابط في الصورة
          imgPreview.style.display = "block"; // إظهار الصورة
      }
      
      reader.readAsDataURL(file); // بدء القراءة

      // 2. تحديث شكل الزر
      uploadLabel.classList.add("uploaded");
      uploadText.textContent = file.name.length > 20 
          ? file.name.substring(0, 20) + "..." 
          : file.name;
      uploadIcon.className = "fas fa-check-circle";

    } else {
      // في حالة إلغاء الاختيار ولم تكن هناك صورة قديمة
      if (!initialImage) {
          imgPreview.style.display = "none";
          uploadLabel.classList.remove("uploaded");
          uploadText.textContent = "اختر صورة للون";
          uploadIcon.className = "fas fa-cloud-upload-alt";
      }
    }
  };

  // عند الحذف
  remove.onclick = () => {
    row.remove();
    state.colors = state.colors.filter((c) => c.id !== id);
  };

  els.colorsList.appendChild(row);
};

  /* ========== ADD SIZE ========== */
  const addSizeRow = (value = "") => {
    const id = ++state.sizeId;

    const size = { id, value };
    state.sizes.push(size);

    const row = document.createElement("div");
    row.className = "option-item";

    row.innerHTML = `
           <label>  
            <input type="text" class="form-input" placeholder="مثال: XL">
            <button type="button" class="btn-remove">&times;</button>
            </label>
        `;

    const input = row.querySelector("input");
    const remove = row.querySelector(".btn-remove");

    input.value = value;
    input.oninput = (e) => (size.value = e.target.value);

    remove.onclick = () => {
      row.remove();
      state.sizes = state.sizes.filter((s) => s.id !== id);
    };

    els.sizesList.appendChild(row);
  };

  /* ========== SAVE ========== */
  const saveProduct = async () => {
    if (!localStorage.getItem("token")) {
      toast("يرجى تسجيل الدخول", true);
      return;
    }

    if (!els.title.value || !els.price.value || !els.category.value) {
      toast("يرجى ملء الحقول الأساسية", true);
      return;
    }

    if (!state.colors.length) {
      toast("أضف لونًا واحدًا على الأقل مع صورة", true);
      return;
    }

    const fd = new FormData();

    fd.append("name", els.title.value);
    fd.append("description", els.description.value);
    fd.append("price", els.price.value);
    fd.append("category", els.category.value);
    fd.append("brand", els.brand.value || "");

    state.sizes.forEach((s, i) => {
      if (s.value) fd.append(`sizes[${i}][size]`, s.value);
    });

    state.colors.forEach((c, i) => {
      fd.append(`images[${i}][color]`, c.value);
      fd.append(`images[${i}][file]`, c.file);
    });

    let url = "http://127.0.0.1:8000/api/products";
    if (state.isEdit) {
      url += `/${state.productId}`;
      fd.append("_method", "PUT");
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: fd,
      });

      if (res.ok) {
        toast("تم حفظ المنتج بنجاح ✅");
        setTimeout(() => location.reload(), 1500);
      } else {
        const err = await res.json();
        console.error("Laravel Validation Error:", err);
        if (err.errors) {
          const firstError = Object.values(err.errors)[0][0];
          toast(firstError, true);
        } else {
          toast("خطأ غير متوقع", true);
        }
      }
    } catch (e) {
      console.error(e);
      toast("فشل الاتصال بالخادم", true);
    }
  };

  /* ========== INIT ========== */
  els.addColorBtn.onclick = () => addColorRow();
  els.addSizeBtn.onclick = () => addSizeRow();
  els.saveBtn.onclick = saveProduct;

  addColorRow(); // لون افتراضي
  addSizeRow(); // مقاس افتراضي
})();
