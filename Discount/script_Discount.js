(function () {
    "use strict";

    const STORAGE_KEY = 'market_products';

    // 1. تهيئة البيانات (تحميل من الذاكرة أو إنشاء بيانات وهمية لأول مرة)
    let products = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    if (products.length === 0) {
        // بيانات افتراضية إذا لم يكن هناك شيء محفوظ
        products = [
            {
                id: "PROD-001",
                title: "سماعات رأس لاسلكية احترافية",
                basePrice: 50000,
                currency: "SYP",
                image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
                discount: null 
            },
            {
                id: "PROD-002",
                title: "قميص قطني صيفي أزرق",
                basePrice: 75000,
                currency: "SYP",
                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
                discount: { type: "percent", value: 20 }
            },
            {
                id: "PROD-003",
                title: "حذاء رياضي للمشي",
                basePrice: 120000,
                currency: "SYP",
                image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
                discount: { type: "fixed", value: 10000 }
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
        // حفظ البيانات الافتراضية
        saveToStorage();
    }

    // دالة مساعدة للحفظ في الذاكرة المحلية
    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }

    // عناصر الواجهة
    const els = {
        grid: document.getElementById('productsGrid'),
        search: document.getElementById('searchInput'),
        modal: document.getElementById('discountModal'),
        modalForm: document.getElementById('discountForm'),
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

    const formatCurrency = (amount) => new Intl.NumberFormat('en-US').format(amount);

    const calculatePrice = (base, type, value) => {
        let final = base;
        if (type === 'percent') {
            final = base - (base * (value / 100));
        } else {
            final = base - value;
        }
        return Math.max(0, final);
    };

    // --- عرض المنتجات ---
    const renderProducts = (list = products) => {
        els.grid.innerHTML = '';
        
        if(list.length === 0) {
            els.grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem;">لا توجد منتجات مطابقة</div>';
            return;
        }

        list.forEach(prod => {
            let currentPrice = prod.basePrice;
            let hasDiscount = false;
            let discountBadge = '';

            if (prod.discount && prod.discount.value > 0) {
                hasDiscount = true;
                currentPrice = calculatePrice(prod.basePrice, prod.discount.type, prod.discount.value);
                const badgeText = prod.discount.type === 'percent' ? `-${prod.discount.value}%` : 'خصم خاص';
                discountBadge = `<span class="discount-badge">${badgeText}</span>`;
            }

            const card = document.createElement('div');
            card.className = 'prod-card';
            card.innerHTML = `
                ${discountBadge}
                <img src="${prod.image}" alt="${prod.title}" class="prod-img">
                <h3 class="prod-title" title="${prod.title}">${prod.title}</h3>
                <div class="prod-meta"><span>${prod.id}</span></div>
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

        document.querySelectorAll('.open-discount-btn').forEach(btn => {
            btn.addEventListener('click', () => openModal(btn.dataset.id));
        });
    };

    // --- منطق المودال ---
    const openModal = (id) => {
        const prod = products.find(p => p.id === id);
        if (!prod) return;

        els.mId.value = prod.id;
        els.mTitle.textContent = prod.title;
        els.mImg.src = prod.image;
        els.mBasePrice.textContent = formatCurrency(prod.basePrice);
        els.mBasePrice.dataset.raw = prod.basePrice;
        els.mCurrency.textContent = prod.currency;

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

    const updateModalCalculations = () => {
        const base = parseFloat(els.mBasePrice.dataset.raw);
        const type = [...els.radios].find(r => r.checked).value;
        const val = parseFloat(els.mInputVal.value) || 0;
        els.mSuffix.textContent = type === 'percent' ? '%' : els.mCurrency.textContent;
        const final = calculatePrice(base, type, val);
        els.mNewPrice.textContent = `${formatCurrency(final)} ${els.mCurrency.textContent}`;
    };

    // --- حفظ التعديلات ---
    els.modalForm.addEventListener('input', updateModalCalculations);
    els.radios.forEach(r => r.addEventListener('change', updateModalCalculations));
    document.querySelectorAll('.close-modal').forEach(el => el.addEventListener('click', closeModal));

    // زر الحفظ
    els.modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = els.mId.value;
        const type = [...els.radios].find(r => r.checked).value;
        const value = parseFloat(els.mInputVal.value);
        const base = parseFloat(els.mBasePrice.dataset.raw);

        if (isNaN(value) || value <= 0) { alert('يرجى إدخال قيمة صحيحة'); return; }
        if (type === 'percent' && value > 100) { alert('النسبة لا يمكن أن تتجاوز 100%'); return; }
        if (type === 'fixed' && value >= base) { alert('قيمة الخصم أكبر من سعر المنتج'); return; }

        const prodIndex = products.findIndex(p => p.id === id);
        if (prodIndex > -1) {
            products[prodIndex].discount = { type, value };
            
            saveToStorage(); // <--- حفظ في LocalStorage

            showToast('تم حفظ الخصم بنجاح');
            closeModal();
            renderProducts();
        }
    });

    // زر الحذف
    els.mRemoveBtn.addEventListener('click', () => {
        if(confirm('هل أنت متأكد من إزالة الخصم عن هذا المنتج؟')) {
            const id = els.mId.value;
            const prodIndex = products.findIndex(p => p.id === id);
            if (prodIndex > -1) {
                products[prodIndex].discount = null;
                
                saveToStorage(); // <--- حفظ في LocalStorage

                showToast('تمت إزالة الخصم');
                closeModal();
                renderProducts();
            }
        }
    });

    els.search.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = products.filter(p => 
            p.title.toLowerCase().includes(term) || 
            p.id.toLowerCase().includes(term)
        );
        renderProducts(filtered);
    });

    const showToast = (msg) => {
        els.toast.textContent = msg;
        els.toast.classList.remove('hidden');
        setTimeout(() => els.toast.classList.add('hidden'), 3000);
    };

    renderProducts();
})();