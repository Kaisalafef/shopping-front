/**
 * Product Management Script (Laravel Schema Compatible)
 */

(function () {
    "use strict";
  
    // ================= Constants =================
    // قائمة أشهر الألوان كما طلبت
    const POPULAR_COLORS = [
        { name: "أسود (Black)", hex: "#000000", text: "#FFFFFF" },
        { name: "أبيض (White)", hex: "#FFFFFF", text: "#000000" },
        { name: "أحمر (Red)", hex: "#FF0000", text: "#FFFFFF" },
        { name: "أزرق (Blue)", hex: "#0000FF", text: "#FFFFFF" },
        { name: "أخضر (Green)", hex: "#008000", text: "#FFFFFF" },
        { name: "أصفر (Yellow)", hex: "#FFFF00", text: "#000000" },
        { name: "رمادي (Gray)", hex: "#808080", text: "#FFFFFF" },
        { name: "بيج (Beige)", hex: "#F5F5DC", text: "#000000" },
        { name: "بني (Brown)", hex: "#A52A2A", text: "#FFFFFF" },
        { name: "وردي (Pink)", hex: "#FFC0CB", text: "#000000" },
        { name: "بنفسجي (Purple)", hex: "#800080", text: "#FFFFFF" },
        { name: "برتقالي (Orange)", hex: "#FFA500", text: "#000000" },
        { name: "كحلي (Navy)", hex: "#000080", text: "#FFFFFF" },
        { name: "زيتي (Olive)", hex: "#808000", text: "#FFFFFF" }
    ];

    // ================= State =================
    const state = {
        options: [], // سيحتوي على Sizes و Colors
        mainImageFile: null,
        productId: null,
        isEditMode: false
    };
  
    // ================= DOM Elements =================
    const els = {
        form: document.getElementById("productForm"),
        idInput: document.getElementById("prodId"),
        regenBtn: document.getElementById("regenBtn"),
        title: document.getElementById("title"), // Matches 'name' in DB
        price: document.getElementById("price"),
        description: document.getElementById("description"),
        category: document.getElementById("category"),
        brand: document.getElementById("brand"), // Not in DB schema provided, but usually needed
        imageFile: document.getElementById("imageFile"),
        mainPreview: document.getElementById("mainPreview"),
        clearImageBtn: document.getElementById("clearImage"),
        optionsList: document.getElementById("optionsList"),
        addOptionBtn: document.getElementById("addOptionBtn"),
        saveBtn: document.getElementById("saveBtn"),
        toast: document.getElementById("toast"),
        pageTitle: document.querySelector('.page-header h1'),
    };
  
    // ================= Helpers =================
    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]');
        return token ? token.content : '';
    };
  
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
            els.mainPreview.appendChild(img);
            els.clearImageBtn.hidden = false;
        } else {
            els.mainPreview.innerHTML = '<div class="placeholder-text">معاينة الصورة</div>';
            els.clearImageBtn.hidden = true;
        }
    };
  
    // ================= Option Logic =================
    const addOptionRow = (data = {}) => {
        state.lastId = (state.lastId || 0) + 1;
        const rowId = `opt-row-${state.lastId}`;
        
        const optionData = {
            uid: rowId,
            type: data.type || "size", // 'size' or 'color'
            value: data.value || "",   // "XL" or Hex Code
            imageFile: null,           // Only for colors if needed
            imageUrl: data.image || null
        };

        state.options.push(optionData);

        const row = document.createElement("div");
        row.className = "option-item";
        row.id = rowId;
        
        // بناء HTML الصف
        row.innerHTML = `
            <div style="display:flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <select class="opt-type form-select" style="width: auto;">
                    <option value="size" ${optionData.type === "size" ? "selected" : ""}>قياس (Size)</option>
                    <option value="color" ${optionData.type === "color" ? "selected" : ""}>لون (Color)</option>
                </select>
                <button type="button" class="btn-remove-opt text-danger" style="border:none; background:none; font-size:1.2rem;">&times;</button>
            </div>
            <div class="value-input-container">
                </div>
        `;

        els.optionsList.appendChild(row);

        // References
        const typeSelect = row.querySelector(".opt-type");
        const valContainer = row.querySelector(".value-input-container");
        const removeBtn = row.querySelector(".btn-remove-opt");

        // دالة لتحديث HTML الحقل بناءً على النوع (لون من القائمة أو نص للقياس)
        const renderInput = () => {
            const currentType = updateState(rowId, "type", typeSelect.value).type;
            const currentValue = state.options.find(o => o.uid === rowId).value;

            if (currentType === "color") {
                // إنشاء قائمة الألوان الشهيرة
                let colorOptions = POPULAR_COLORS.map(c => 
                        `<option value="${c.hex}" style= " border-left: 20px solid ${c.hex};" ${currentValue === c.hex ? 'selected' : ''}>
                        ${c.name}
                        
                    </option>`
                ).join('');

                valContainer.innerHTML = `
                    <div class="row-2-col" style="align-items: center; gap: 10px;">
                        <select class="form-select val-input-color" style="height: 42px; border-left: 10px solid ${currentValue || '#000'}">
                            <option value="" disabled selected>اختر لوناً...</option>
                            ${colorOptions}
                        </select>
                        
                        <div class="mini-upload-wrapper" style="display:flex; align-items:center;">
                             <label for="file-${rowId}" class="btn btn-sm btn-outline" style="cursor:pointer; margin-right:45px;">
                                <i class="fas fa-camera"></i>
                             </label>
                             <input type="file" id="file-${rowId}" class="opt-file-input" hidden accept="image/*">
                             <img id="preview-${rowId}" src="${optionData.imageUrl || ''}" class="mini-img-preview" 
                                  style="width:30px; height:30px; margin-right:5px; border-radius:4px; display:${optionData.imageUrl ? 'block' : 'none'};">
                        </div>
                    </div>
                `;

                // تلوين الحافة عند الاختيار
                const colorSelect = valContainer.querySelector(".val-input-color");
                colorSelect.addEventListener("change", (e) => {
                    updateState(rowId, "value", e.target.value);
                    e.target.style.borderLeftColor = e.target.value;
                });

                // التعامل مع صورة اللون
                const fileInput = valContainer.querySelector(".opt-file-input");
                fileInput.addEventListener("change", (e) => {
                    const file = e.target.files[0];
                    if(file) {
                        updateState(rowId, "imageFile", file);
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                            const img = valContainer.querySelector(`#preview-${rowId}`);
                            img.src = evt.target.result;
                            img.style.display = "block";
                        };
                        reader.readAsDataURL(file);
                    }
                });

            } else {
                // حقل نصي للقياسات (Sizes)
                valContainer.innerHTML = `
                    <input type="text" class="form-input val-input-size" 
                           placeholder="مثال: XL, 42, Large" value="${currentValue}">
                `;
                valContainer.querySelector(".val-input-size").addEventListener("input", (e) => {
                    updateState(rowId, "value", e.target.value);
                });
            }
        };

        // التشغيل الأولي
        renderInput();

        // عند تغيير النوع
        typeSelect.addEventListener("change", () => {
            // تصفير القيمة عند تغيير النوع
            updateState(rowId, "value", ""); 
            renderInput();
        });

        // حذف الصف
        removeBtn.addEventListener("click", () => {
            row.remove();
            state.options = state.options.filter(o => o.uid !== rowId);
        });
    };

    function updateState(uid, key, val) {
        const idx = state.options.findIndex(o => o.uid === uid);
        if (idx > -1) {
            state.options[idx][key] = val;
            return state.options[idx];
        }
        return {};
    }

    // ================= DATA LOADING (EDIT MODE) =================
    const checkForEditMode = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editId');

        if (editId) {
            state.isEditMode = true;
            state.productId = editId;
            els.pageTitle.textContent = "تعديل بيانات المنتج";
            els.saveBtn.textContent = "حفظ التعديلات";
            els.regenBtn.style.display = 'none';

            try {
                // Laravel Route example: GET /api/products/{id}
                const response = await fetch(`/api/products/${editId}`);
                if (!response.ok) throw new Error("Product not found");
                
                const product = await response.json();

                // Mapping DB fields to UI
                els.title.value = product.name;         // products.name
                els.description.value = product.description; // products.description
                els.price.value = product.price;        // products.price
                els.category.value = product.category;  // products.category
                
                // الصورة الأساسية (يفترض أن الـ API يرجع رابط الصورة)
                // يمكن أن يكون product.image أو أول عنصر في product_images
                if (product.product_images && product.product_images.length > 0) {
                     renderImagePreview(product.product_images[0].image);
                }

                // تحميل القياسات (Sizes)
                if (product.product_sizes) {
                    product.product_sizes.forEach(s => {
                        addOptionRow({ type: 'size', value: s.size });
                    });
                }

                // ملاحظة: الجدول في السؤال لا يحتوي على product_colors
                // ولكن سنفترض وجود طريقة لإرجاع الألوان إذا أضيفت لاحقاً
                if (product.colors) { 
                    product.colors.forEach(c => {
                        addOptionRow({ type: 'color', value: c.hex || c.value, image: c.image });
                    });
                }

            } catch (error) {
                console.error(error);
                showToast("فشل تحميل البيانات", "error");
            }
        } else {
            // وضع الإضافة الجديد
            addOptionRow({ type: "size", value: "" }); // صف فارغ كبداية
        }
    };

    // ================= SAVE HANDLER (To Laravel) =================
    const handleSave = async () => {
        const nameVal = els.title.value.trim();
        const priceVal = els.price.value;
        const catVal = els.category.value;

        if (!nameVal || !priceVal) {
            showToast("يرجى إدخال اسم المنتج والسعر", "error");
            return;
        }

        els.saveBtn.disabled = true;
        els.saveBtn.textContent = "جاري المعالجة...";

        const formData = new FormData();
        
        // 1. البيانات الأساسية (products table)
        formData.append('name', nameVal);
        formData.append('description', els.description.value);
        formData.append('price', priceVal);
        formData.append('category', catVal);
        formData.append('buyCount', 0); // قيمة افتراضية

        // 2. الصورة الأساسية (product_images table)
        if (state.mainImageFile) {
            formData.append('image', state.mainImageFile);
        }

        // 3. معالجة الخيارات (Sizes & Colors)
        // سنفصلهم لأن Schema لديك تفصل product_sizes في جدول مستقل
        
        let sizeIndex = 0;
        let colorIndex = 0;

        state.options.forEach((opt) => {
            if (opt.type === 'size' && opt.value) {
                // Laravel validation array: sizes[]
                formData.append(`sizes[${sizeIndex}]`, opt.value);
                sizeIndex++;
            } 
            else if (opt.type === 'color' && opt.value) {
                // حتى لو لم يوجد جدول في السكيما المعطاة، سنرسلها للباك إند ليتصرف بها
                formData.append(`colors[${colorIndex}][hex]`, opt.value);
                if (opt.imageFile) {
                    formData.append(`colors[${colorIndex}][image]`, opt.imageFile);
                }
                colorIndex++;
            }
        });

        // تحديد الرابط
        let url = '/api/products';
        let method = 'POST';

        if (state.isEditMode) {
            url = `/api/products/${state.productId}`;
            formData.append('_method', 'PUT'); // لمحاكاة PUT مع الملفات
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showToast("تم الحفظ بنجاح!", "success");
                if (!state.isEditMode) {
                    // تصفير النموذج
                    els.form.reset();
                    els.optionsList.innerHTML = "";
                    renderImagePreview(null);
                    state.options = [];
                    state.mainImageFile = null;
                    addOptionRow();
                }
            } else {
                console.error(result.errors);
                alert("حدث خطأ: \n" + JSON.stringify(result.errors || result.message));
            }
        } catch (error) {
            console.error(error);
            showToast("فشل الاتصال بالسيرفر", "error");
        } finally {
            els.saveBtn.disabled = false;
            els.saveBtn.textContent = state.isEditMode ? "حفظ التعديلات" : "حفظ المنتج";
        }
    };

    // ================= Initialization =================
    const init = () => {
        // ضغط الصورة الأساسية قبل الإرسال
        els.imageFile.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const img = new Image();
                    img.src = evt.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const maxWidth = 800; // حجم مناسب
                        const scale = maxWidth / img.width;
                        canvas.width = maxWidth;
                        canvas.height = img.height * scale;
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        // العرض
                        renderImagePreview(canvas.toDataURL('image/jpeg', 0.8));
                        
                        // التخزين للإرسال
                        canvas.toBlob((blob) => {
                            state.mainImageFile = new File([blob], "product.jpg", { type: "image/jpeg" });
                        }, 'image/jpeg', 0.8);
                    }
                };
                reader.readAsDataURL(file);
            }
        });

        els.clearImageBtn.addEventListener("click", () => {
            state.mainImageFile = null;
            renderImagePreview(null);
            els.imageFile.value = "";
        });

        els.addOptionBtn.addEventListener("click", () => addOptionRow());
        els.saveBtn.addEventListener("click", handleSave);
        
        checkForEditMode();
    };

    init();
})();