(function () {
    "use strict";

    // 1. بيانات وهمية للمنتجات (تحاكي قاعدة البيانات)
    let products = [
        {
            id: "PROD-001",
            title: "سماعات رأس لاسلكية احترافية",
            basePrice: 50000,
            currency: "SYP",
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
            discount: null // لا يوجد خصم
        },
        {
            id: "PROD-002",
            title: "قميص قطني صيفي أزرق",
            basePrice: 75000,
            currency: "SYP",
            image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
            discount: { type: "percent", value: 20 } // خصم 20%
        },
        {
            id: "PROD-003",
            title: "حذاء رياضي للمشي",
            basePrice: 120000,
            currency: "SYP",
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
            discount: { type: "fixed", value: 10000 } // خصم 10,000 ليرة
        },
        {
            id: "PROD-004",
            title: "ساعة ذكية رياضية",
            basePrice: 250000,
            currency: "SYP",
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
            discount: null
        }
    ];

    // عناصر الواجهة
    const els = {
        grid: document.getElementById('productsGrid'),
        search: document.getElementById('searchInput'),
        modal: document.getElementById('discountModal'),
        modalForm: document.getElementById('discountForm'),
        // عناصر داخل المودال
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
        toast: document.getElementById('toast')
    };

    // --- الوظائف المساعدة ---

    // تنسيق الأرقام كعملة
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US').format(amount);
    };

    // حساب السعر بعد الخصم
    const calculatePrice = (base, type, value) => {
        let final = base;
        if (type === 'percent') {
            final = base - (base * (value / 100));
        } else {
            final = base - value;
        }
        return Math.max(0, final); // عدم السماح بالسالب
    };

    // --- عرض المنتجات ---
    const renderProducts = (list = products) => {
        els.grid.innerHTML = '';
        
        if(list.length === 0) {
            els.grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem;">لا توجد منتجات مطابقة</div>';
            return;
        }

        list.forEach(prod => {
            // حساب السعر الحالي
            let currentPrice = prod.basePrice;
            let hasDiscount = false;
            let discountBadge = '';

            if (prod.discount && prod.discount.value > 0) {
                hasDiscount = true;
                currentPrice = calculatePrice(prod.basePrice, prod.discount.type, prod.discount.value);
                
                // نص الشارة
                const badgeText = prod.discount.type === 'percent' 
                    ? `-${prod.discount.value}%` 
                    : 'خصم خاص';
                discountBadge = `<span class="discount-badge">${badgeText}</span>`;
            }

            // إنشاء بطاقة HTML
            const card = document.createElement('div');
            card.className = 'prod-card';
            card.innerHTML = `
                ${discountBadge}
                <img src="${prod.image}" alt="${prod.title}" class="prod-img">
                <h3 class="prod-title" title="${prod.title}">${prod.title}</h3>
                
                <div class="prod-meta">
                    <span>${prod.id}</span>
                </div>

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

        // ربط أزرار البطاقات
        document.querySelectorAll('.open-discount-btn').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.dataset.id));
        });
    };

    // --- منطق المودال (النافذة المنبثقة) ---

    const openModal = (id) => {
        const prod = products.find(p => p.id === id);
        if (!prod) return;

        // تعبئة البيانات الأساسية
        els.mId.value = prod.id;
        els.mTitle.textContent = prod.title;
        els.mImg.src = prod.image;
        els.mBasePrice.textContent = formatCurrency(prod.basePrice);
        els.mBasePrice.dataset.raw = prod.basePrice; // تخزين الرقم الخام للحساب
        els.mCurrency.textContent = prod.currency;

        // تعبئة حالة الخصم الحالية
        if (prod.discount) {
    const radio = [...els.radios].find(r => r.value === prod.discount.type);
    if (radio) radio.checked = true;

    els.mInputVal.value = prod.discount.value;
    els.mRemoveBtn.classList.remove('hidden');
} else {
    els.radios[0].checked = true;
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


    // تحديث الحسابات داخل المودال
    const updateModalCalculations = () => {
        const base = parseFloat(els.mBasePrice.dataset.raw);
        const type = [...els.radios].find(r => r.checked).value;
        const val = parseFloat(els.mInputVal.value) || 0;

        // تحديث اللاحقة (Suffix)
        els.mSuffix.textContent = type === 'percent' ? '%' : els.mCurrency.textContent;

        // حساب السعر الجديد
        const final = calculatePrice(base, type, val);
        els.mNewPrice.textContent = `${formatCurrency(final)} ${els.mCurrency.textContent}`;
    };

    // --- معالجة الأحداث ---

    // 1. عند تغيير نوع الخصم أو القيمة
    els.modalForm.addEventListener('input', updateModalCalculations);
    els.radios.forEach(r => r.addEventListener('change', updateModalCalculations));

    // 2. إغلاق المودال
    document.querySelectorAll('.close-modal').forEach(el => {
        el.addEventListener('click', closeModal);
    });

    // 3. حفظ الخصم
   els.modalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = els.mId.value;
    const type = [...els.radios].find(r => r.checked).value;
    const value = parseFloat(els.mInputVal.value);
    const base = parseFloat(els.mBasePrice.dataset.raw);

    if (isNaN(value) || value <= 0) {
        alert('يرجى إدخال قيمة صحيحة');
        return;
    }

    if (type === 'percent' && value > 100) {
        alert('النسبة لا يمكن أن تتجاوز 100%');
        return;
    }

    if (type === 'fixed' && value >= base) {
        alert('قيمة الخصم أكبر من سعر المنتج');
        return;
    }

    const prodIndex = products.findIndex(p => p.id === id);
    if (prodIndex > -1) {
        products[prodIndex].discount = { type, value };
        showToast('تم حفظ الخصم بنجاح');
        closeModal();
        renderProducts();
    }
});


    // 4. حذف الخصم
    els.mRemoveBtn.addEventListener('click', () => {
        if(confirm('هل أنت متأكد من إزالة الخصم عن هذا المنتج؟')) {
            const id = els.mId.value;
            const prodIndex = products.findIndex(p => p.id === id);
            if (prodIndex > -1) {
                products[prodIndex].discount = null;
                showToast('تمت إزالة الخصم');
                closeModal();
                renderProducts();
            }
        }
    });

    // 5. البحث
    els.search.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = products.filter(p => 
            p.title.toLowerCase().includes(term) || 
            p.id.toLowerCase().includes(term)
        );
        renderProducts(filtered);
    });

    // إظهار التوست
    const showToast = (msg) => {
        els.toast.textContent = msg;
        els.toast.classList.remove('hidden');
        setTimeout(() => els.toast.classList.add('hidden'), 3000);
    };

    // تشغيل مبدئي
    renderProducts();

})();