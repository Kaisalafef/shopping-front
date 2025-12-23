/**
 * Discount Management Script (API Integrated)
 */
(function () {
    "use strict";

    // ================= State & Config =================
    const state = {
        products: [], // سيتم ملؤها من الـ API
        isLoading: false
    };

    // روابط الـ API (عدلها حسب الراوت لديك في لارافيل)
    const API_URLS = {
        GET_PRODUCTS: '/api/products', // لجلب القائمة
        UPDATE_DISCOUNT: (id) => `/api/products/${id}/discount`, // لتحديث أو إضافة خصم
        REMOVE_DISCOUNT: (id) => `/api/products/${id}/remove-discount` // لحذف الخصم
    };

    // ================= DOM Elements =================
    const els = {
        grid: document.getElementById('productsGrid'),
        search: document.getElementById('searchInput'),
        modal: document.getElementById('discountModal'),
        modalForm: document.getElementById('discountForm'),
        
        // Modal Elements
        mTitle: document.getElementById('modalTitle'),
        mImg: document.getElementById('modalImg'),
        mBasePrice: document.getElementById('modalBasePrice'),
        mCurrency: document.getElementById('modalCurrency'),
        mId: document.getElementById('modalProdId'),
        mInputVal: document.getElementById('discountValue'),
        mNewPrice: document.getElementById('newPriceDisplay'),
        mRemoveBtn: document.getElementById('removeDiscountBtn'),
        mSuffix: document.getElementById('valueSuffix'),
        radios: document.getElementsByName('discountType'),
        
        toast: document.getElementById('toast'),
        closeBtns: document.querySelectorAll('.close-modal')
    };

    // ================= Helpers =================
    
    // جلب التوكن للحماية (Laravel CSRF)
    const getCsrfToken = () => {
        const token = document.querySelector('meta[name="csrf-token"]');
        return token ? token.content : '';
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US').format(amount);

    const showToast = (message, type = "success") => {
        els.toast.textContent = message;
        els.toast.style.backgroundColor = type === "error" ? "#ef4444" : "#1f2937";
        els.toast.classList.remove("hidden");
        setTimeout(() => els.toast.classList.add("hidden"), 3000);
    };

    // حساب السعر بعد الخصم (للعرض فقط)
    const calculatePrice = (base, type, value) => {
        let final = parseFloat(base);
        const val = parseFloat(value) || 0;
        
        if (type === 'percent') {
            final = base - (base * (val / 100));
        } else {
            final = base - val;
        }
        return Math.max(0, final);
    };

    // ================= API Functions =================

    /**
     * 1. GET: جلب المنتجات من السيرفر
     */
    const fetchProducts = async () => {
        state.isLoading = true;
        els.grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1; text-align:center;">جاري تحميل المنتجات...</div>';

        try {
            const response = await fetch(API_URLS.GET_PRODUCTS, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) throw new Error("فشل تحميل البيانات");

            const data = await response.json();
            
            // نفترض أن الـ API يعيد مصفوفة من المنتجات
            // سنقوم بتوحيد شكل البيانات (Mapping) لضمان عمل الكود
            state.products = data.map(prod => ({
                id: prod.id,
                title: prod.name, // تأكد من اسم الحقل في الداتابيز
                basePrice: parseFloat(prod.price),
                currency: "SYP", // أو prod.currency
                // استخدم الصورة الأولى أو صورة افتراضية
                image: (prod.product_images && prod.product_images.length > 0) 
                        ? prod.product_images[0].image 
                        : 'https://via.placeholder.com/400x400?text=No+Image',
                // كائن الخصم (null إذا لم يوجد)
                discount: (prod.discount_value && prod.discount_type) ? {
                    type: prod.discount_type, // 'percent' or 'fixed'
                    value: prod.discount_value
                } : null
            }));

            renderProducts(state.products);

        } catch (error) {
            console.error(error);
            els.grid.innerHTML = '<div style="color:red; text-align:center; grid-column:1/-1">حدث خطأ أثناء الاتصال بالسيرفر</div>';
        } finally {
            state.isLoading = false;
        }
    };

    /**
     * 2. POST: تحديث الخصم
     */
    const saveDiscountToApi = async (id, type, value) => {
        const btn = els.modalForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "جاري الحفظ...";

        try {
            const response = await fetch(API_URLS.UPDATE_DISCOUNT(id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    discount_type: type,
                    discount_value: value
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || "حدث خطأ");
            }

            // تحديث الواجهة محلياً بعد نجاح السيرفر
            const prodIndex = state.products.findIndex(p => p.id == id);
            if (prodIndex > -1) {
                state.products[prodIndex].discount = { type, value };
                renderProducts(state.products);
            }

            showToast("تم تحديث الخصم بنجاح");
            closeModal();

        } catch (error) {
            console.error(error);
            showToast("فشل الحفظ: " + error.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    };

    /**
     * 3. DELETE/POST: حذف الخصم
     */
    const removeDiscountFromApi = async (id) => {
        try {
            const response = await fetch(API_URLS.REMOVE_DISCOUNT(id), {
                method: 'POST', // أو DELETE حسب الـ Router لديك
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error("فشل الحذف");

            // تحديث الواجهة محلياً
            const prodIndex = state.products.findIndex(p => p.id == id);
            if (prodIndex > -1) {
                state.products[prodIndex].discount = null;
                renderProducts(state.products);
            }

            showToast("تم إلغاء الخصم");
            closeModal();

        } catch (error) {
            showToast("حدث خطأ أثناء الحذف", "error");
        }
    };

    // ================= Render Logic =================
    const renderProducts = (list) => {
        els.grid.innerHTML = '';
        
        if (list.length === 0) {
            els.grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:#666;">لا توجد منتجات للعرض</div>';
            return;
        }

        list.forEach(prod => {
            let currentPrice = prod.basePrice;
            let hasDiscount = false;
            let discountBadge = '';

            if (prod.discount && parseFloat(prod.discount.value) > 0) {
                hasDiscount = true;
                currentPrice = calculatePrice(prod.basePrice, prod.discount.type, prod.discount.value);
                const badgeText = prod.discount.type === 'percent' ? `-${prod.discount.value}%` : 'تخفيض';
                discountBadge = `<span class="discount-badge">${badgeText}</span>`;
            }

            const card = document.createElement('div');
            card.className = 'prod-card';
            card.innerHTML = `
                ${discountBadge}
                <img src="${prod.image}" alt="${prod.title}" class="prod-img">
                <h3 class="prod-title" title="${prod.title}">${prod.title}</h3>
                <div class="prod-meta"><span>#${prod.id}</span></div>
                <div class="price-row">
                    ${hasDiscount 
                        ? `<span class="current-price active-discount-price">${formatCurrency(currentPrice)} ${prod.currency}</span>
                           <span class="old-price">${formatCurrency(prod.basePrice)}</span>`
                        : `<span class="current-price">${formatCurrency(prod.basePrice)} ${prod.currency}</span>`
                    }
                </div>
                <button class="btn btn-primary open-discount-btn" data-id="${prod.id}">
                    <i class="fas fa-tag"></i> ${hasDiscount ? 'تعديل الخصم' : 'إضافة خصم'}
                </button>
            `;
            els.grid.appendChild(card);
        });

        // إعادة ربط الأحداث للأزرار الجديدة
        document.querySelectorAll('.open-discount-btn').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.dataset.id));
        });
    };

    // ================= Modal Logic =================
    const openModal = (id) => {
        // البحث في المتغير state بدلاً من DOM
        // ملاحظة: نستخدم == بدلاً من === لأن الـ id قد يأتي كنص أو رقم
        const prod = state.products.find(p => p.id == id);
        if (!prod) return;

        els.mId.value = prod.id;
        els.mTitle.textContent = prod.title;
        els.mImg.src = prod.image;
        els.mBasePrice.textContent = formatCurrency(prod.basePrice);
        els.mBasePrice.dataset.raw = prod.basePrice;
        els.mCurrency.textContent = prod.currency;

        // تعبئة البيانات إذا كان هناك خصم مسبق
        if (prod.discount) {
            const radio = [...els.radios].find(r => r.value === prod.discount.type);
            if (radio) radio.checked = true;
            els.mInputVal.value = prod.discount.value;
            els.mRemoveBtn.classList.remove('hidden');
        } else {
            els.radios[0].checked = true; // Default Percent
            els.mInputVal.value = '';
            els.mRemoveBtn.classList.add('hidden');
        }

        updateModalCalculations();
        els.modal.classList.add('visible');
    };

    const closeModal = () => {
        els.modal.classList.remove('visible');
        els.modalForm.reset();
        els.mNewPrice.textContent = '--';
    };

    const updateModalCalculations = () => {
        const base = parseFloat(els.mBasePrice.dataset.raw);
        const type = [...els.radios].find(r => r.checked).value;
        const val = els.mInputVal.value;
        
        els.mSuffix.textContent = type === 'percent' ? '%' : els.mCurrency.textContent;
        
        if (base && val) {
            const final = calculatePrice(base, type, val);
            els.mNewPrice.textContent = `${formatCurrency(final)} ${els.mCurrency.textContent}`;
        } else {
            els.mNewPrice.textContent = '--';
        }
    };

    // ================= Event Listeners =================
    const init = () => {
        // 1. Fetch Data on Load
        fetchProducts();

        // 2. Real-time Calculation in Modal
        els.modalForm.addEventListener('input', updateModalCalculations);
        els.radios.forEach(r => r.addEventListener('change', updateModalCalculations));

        // 3. Close Modal Events
        els.closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
        els.modal.addEventListener('click', (e) => {
            if (e.target === els.modal) closeModal();
        });

        // 4. Submit Form (Save)
        els.modalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = els.mId.value;
            const type = [...els.radios].find(r => r.checked).value;
            const value = parseFloat(els.mInputVal.value);
            const base = parseFloat(els.mBasePrice.dataset.raw);

            // Validation
            if (isNaN(value) || value <= 0) {
                showToast('يرجى إدخال قيمة صحيحة للخصم', "error");
                return;
            }
            if (type === 'percent' && value > 100) {
                showToast('النسبة لا يمكن أن تتجاوز 100%', "error");
                return;
            }
            if (type === 'fixed' && value >= base) {
                showToast('قيمة الخصم أكبر من سعر المنتج!', "error");
                return;
            }

            // Call API
            saveDiscountToApi(id, type, value);
        });

        // 5. Remove Discount
        els.mRemoveBtn.addEventListener('click', () => {
            if (confirm('هل أنت متأكد من إزالة الخصم عن هذا المنتج؟')) {
                const id = els.mId.value;
                removeDiscountFromApi(id);
            }
        });

        // 6. Search Filter (Local Filtering)
        els.search.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = state.products.filter(p => 
                p.title.toLowerCase().includes(term) || 
                p.id.toString().includes(term)
            );
            renderProducts(filtered);
        });
    };

    init();
})();