/**
 * Product Management Script (Edit & Save Mode)
 */

(function () {
  "use strict";

  // ================= State =================
  const state = {
    options: [],
    mainImage: null,
    lastId: 0,
    isEditMode: false
  };

  // ================= DOM Elements =================
  const els = {
    form: document.getElementById("productForm"),
    idInput: document.getElementById("prodId"),
    regenBtn: document.getElementById("regenBtn"),
    title: document.getElementById("title"),
    price: document.getElementById("price"),
    currency: document.getElementById("currency"),
    description: document.getElementById("description"),
    category: document.getElementById("category"),
    brand: document.getElementById("brand"),
    imageFile: document.getElementById("imageFile"),
    mainPreview: document.getElementById("mainPreview"),
    clearImageBtn: document.getElementById("clearImage"),
    optionsList: document.getElementById("optionsList"),
    addOptionBtn: document.getElementById("addOptionBtn"),
    saveBtn: document.getElementById("saveBtn"),
    resetBtn: document.getElementById("resetBtn"),
    toast: document.getElementById("toast"),
    pageTitle: document.querySelector('.page-header h1'), // To change title to "Edit Product"
    submitBtnText: document.getElementById("saveBtn")
  };

  // ================= Storage Helpers =================
  const getStoredProducts = () => JSON.parse(localStorage.getItem('marketProducts') || '[]');
  const saveStoredProducts = (data) => localStorage.setItem('marketProducts', JSON.stringify(data));
  

  // ================= UI Helpers =================
  const showToast = (message, type = "success") => {
    els.toast.textContent = message;
    els.toast.style.backgroundColor = type === "error" ? "#ef4444" : "#1f2937";
    els.toast.classList.remove("hidden");
    setTimeout(() => els.toast.classList.add("hidden"), 3000);
  };

  const renderImagePreview = (src) => {
    els.mainPreview.innerHTML = "";
    if (src) {
      const img = document.createElement("img");
      img.src = src;
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      els.mainPreview.appendChild(img);
      els.clearImageBtn.hidden = false;
    } else {
      els.mainPreview.innerHTML = '<div class="placeholder-text">معاينة الصورة</div>';
      els.clearImageBtn.hidden = true;
    }
  };

  // ================= Option Logic (Identical to before) =================
  const addOptionRow = (data = {}) => {
    state.lastId++;
    const rowId = `opt-row-${state.lastId}`;
    
    // Default or Existing Data
    const optionData = {
      uid: rowId,
      type: data.type || "size",
      value: data.value || "",
      desc: data.description || "", // Note: changed from 'desc' to 'description' to match saved object
      image: data.image || null,
    };

    state.options.push(optionData);

    const row = document.createElement("div");
    row.className = "option-item";
    row.id = rowId;
    row.style.display = "flex";
    row.style.flexDirection = "column";

    // HTML Structure
    const htmlValueInput = getValueInputHtml(optionData.type, optionData.value, optionData.image, rowId);
    
    row.innerHTML = `
      <div style="display:flex; gap:0.5rem; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <select class="opt-type form-select" style="width: auto; padding: 4px 8px;">
              <option value="size" ${optionData.type === "size" ? "selected" : ""}>قياس (Size)</option>
              <option value="color" ${optionData.type === "color" ? "selected" : ""}>لون (Color)</option>
          </select>
          <button type="button" class="btn-remove-opt" title="حذف">&times;</button>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items: flex-start;">
          <div class="value-input-container" style="flex:1; min-width: 160px;">${htmlValueInput}</div>
          <input type="text" class="opt-desc form-input" placeholder="وصف" value="${optionData.desc}" style="flex:2; min-width: 120px;">
      </div>
    `;

    els.optionsList.appendChild(row);

    // Event Listeners for this row
    const typeSelect = row.querySelector(".opt-type");
    const descInput = row.querySelector(".opt-desc");
    const removeBtn = row.querySelector(".btn-remove-opt");
    const valContainer = row.querySelector(".value-input-container");

    const attachValueListeners = () => {
        const valInput = valContainer.querySelector(".val-input");
        if (valInput) valInput.addEventListener("input", (e) => updateState(rowId, "value", e.target.value));
        
        const fileInput = valContainer.querySelector(".opt-file-input");
        if (fileInput) {
            fileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if(file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        updateState(rowId, "image", evt.target.result);
                        const preview = valContainer.querySelector(`#preview-${rowId}`);
                        if(preview) { preview.src = evt.target.result; preview.hidden = false; }
                        valContainer.querySelector(".upload-text").textContent = "تغيير";
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    };
    attachValueListeners();

    typeSelect.addEventListener("change", (e) => {
        const newType = e.target.value;
        valContainer.innerHTML = getValueInputHtml(newType, "", null, rowId);
        updateState(rowId, "type", newType);
        updateState(rowId, "value", "");
        updateState(rowId, "image", null);
        attachValueListeners();
    });

    descInput.addEventListener("input", (e) => updateState(rowId, "description", e.target.value));

    removeBtn.addEventListener("click", () => {
        row.remove();
        state.options = state.options.filter(o => o.uid !== rowId);
    });
  };

  function getValueInputHtml(type, value, imageSrc, uid) {
    if (type === "color") {
        const hasImage = !!imageSrc;
        return `
            <div class="color-opt-wrapper">
                <input type="color" class="val-input color-picker-input" value="${value || "#000000"}">
                <div class="divider-vertical"></div>
                <label for="file-${uid}" class="mini-img-upload">
                    <i class="fas fa-image"></i> <span class="upload-text">${hasImage ? "تغيير" : "صورة"}</span>
                </label>
                <input type="file" id="file-${uid}" class="opt-file-input" hidden accept="image/*">
                <img id="preview-${uid}" src="${imageSrc || ''}" class="mini-img-preview" ${hasImage ? '' : 'hidden'}>
            </div>`;
    }
    return `<input type="text" class="form-input val-input" placeholder="القيمة (XL)" value="${value || ''}">`;
  }

  function updateState(uid, key, val) {
    const idx = state.options.findIndex(o => o.uid === uid);
    if (idx > -1) state.options[idx][key] = val;
  }

  // ================= LOAD DATA (EDIT MODE) =================
  const checkForEditMode = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get('editId');

      if (editId) {
          state.isEditMode = true;
          els.pageTitle.textContent = "تعديل المنتج";
          els.saveBtn.textContent = "حفظ التعديلات";
          els.regenBtn.style.display = 'none'; // Cannot change ID during edit

          // Find product
          const products = getStoredProducts();
          const product = products.find(p => p.id === editId);

          if (product) {
              // Fill Form
              els.idInput.value = product.id;
              els.title.value = product.name || product.title;
              els.price.value = product.price;
              els.currency.value = product.currency || "SYP";
              els.description.value = product.description || "";
              els.category.value = product.category || "";
              els.brand.value = product.brand || ""; // Ensure saved object has brand

              // Main Image
              if (product.img || product.image) {
                  state.mainImage = product.img || product.image;
                  renderImagePreview(state.mainImage);
              }

              // Options
              if (product.options && Array.isArray(product.options)) {
                  product.options.forEach(opt => addOptionRow(opt));
              }
          } else {
              showToast("المنتج غير موجود", "error");
          }
      } else {
          // New Product Mode
          els.idInput.value = "PROD-" + Date.now().toString().slice(-6);
          addOptionRow({ type: "size", value: "M", description: "متوفر" });
      }
  };

  // ================= SAVE DATA =================
  const handleSave = () => {
    // جلب العناصر للتأكد من قيمها
    const titleVal = els.title.value.trim();
    const priceVal = els.price.value;
    const categoryVal = els.category.value; // هنا سيجلب electronics مثلاً

    // 1. التحقق من المدخلات الأساسية
    if (!titleVal || !priceVal || !categoryVal) {
        alert("يرجى ملء الحقول الأساسية: الاسم، السعر، والفئة");
        console.error("Missing fields:", { titleVal, priceVal, categoryVal });
        return;
    }

    // 2. تجهيز بيانات المنتج
    const productData = {
        id: els.idInput.value || Date.now().toString(), // توليد ID إذا لم يوجد
        name: titleVal,
        price: priceVal,
        currency: els.currency.value,
        description: els.description.value,
        category: categoryVal, // القيمة الإنجليزية للفرز
        brand: els.brand.value,
        img: state.mainImage || "/Market/images/logo.png",
        options: state.options
    };

    // 3. جلب المنتجات الحالية وحفظ المنتج الجديد
    let products = getStoredProducts();
    
    if (state.isEditMode) {
        const index = products.findIndex(p => p.id === productData.id);
        if (index !== -1) products[index] = productData;
    } else {
        products.push(productData);
    }
try {
    localStorage.setItem('marketProducts', JSON.stringify(products));
    showToast("تم حفظ المنتج بنجاح", "success");
} catch (error) {
    if (error.name === 'QuotaExceededError') {
        alert("فشل الحفظ: ذاكرة المتصفح ممتلئة! يرجى حذف بعض المنتجات القديمة أو استخدام صور بحجم أصغر.");
    } else {
        console.error("خطأ أثناء الحفظ:", error);
    }
} // التوجيه لصفحة العرض للتأكد
};

  // ================= Init =================
  const init = () => {
    // Event: Main Image
   els.imageFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.src = evt.target.result;
            img.onload = () => {
                // إنشاء Canvas لتصغير الصورة
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // تحديد أبعاد صغيرة (مثلاً 300 بكسل) لتقليل حجم البيانات
                const maxWidth = 300;
                const scale = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scale;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // تحويل الصورة بجودة منخفضة (0.6) لتقليل الحجم جداً
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
                
                state.mainImage = compressedBase64;
                renderImagePreview(state.mainImage);
            };
        };
        reader.readAsDataURL(file);
    }
});
    els.clearImageBtn.addEventListener("click", () => {
        state.mainImage = null;
        renderImagePreview(null);
        els.imageFile.value = "";
    });

    // Event: Buttons
    els.addOptionBtn.addEventListener("click", () => addOptionRow());
    els.saveBtn.addEventListener("click", handleSave);
    els.regenBtn.addEventListener("click", () => els.idInput.value = "PROD-" + Date.now().toString().slice(-6));

    // Start
    checkForEditMode();
  };

  init();
})();