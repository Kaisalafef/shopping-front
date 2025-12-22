/**
 * Product Page Logic - Laravel Integration
 * script_P.js
 */

(function () {
    "use strict";
  
    // ================= DOM Elements =================
    const dom = {
      productImage: document.getElementById("pw-product-image"),
      imageTrigger: document.getElementById("pw-image-trigger"),
      title: document.getElementById("pw-title"),
      price: document.getElementById("pw-price"),
      description: document.getElementById("pw-description"),
  
      // Groups
      colorGroup: document.getElementById("pw-color-group"),
      colorOptionsContainer: document.getElementById("pw-color-options"),
      colorError: document.getElementById("pw-color-error"),
  
      sizeGroup: document.getElementById("pw-size-group"),
      sizeSelect: document.getElementById("pw-size-select"),
      sizeError: document.getElementById("pw-size-error"),
  
      // Controls
      quantityInput: document.getElementById("pw-quantity"),
      qtyDecBtn: document.getElementById("pw-qty-dec"),
      qtyIncBtn: document.getElementById("pw-qty-inc"),
      qtyError: document.getElementById("pw-qty-error"),
      addBtn: document.getElementById("pw-add-btn"),
      btnText: document.getElementById("pw-btn-text"),
      
      // Lightbox
      lightbox: document.getElementById("pw-lightbox"),
      lightboxImg: document.getElementById("pw-lightbox-img"),
      lightboxClose: document.getElementById("pw-lightbox-close"),
  
      // Reviews
      reviewForm: document.getElementById("review-form"),
      reviewerName: document.getElementById("reviewer-name"),
      ratingInputContainer: document.getElementById("rating-input"),
      ratingValue: document.getElementById("review-rating-value"),
      reviewText: document.getElementById("review-text"),
      reviewsList: document.getElementById("reviews-list"),
      relatedList: document.getElementById("related-products-list"),
    };
  
    // ================= State =================
    let productData = null;
    let isAdding = false;
    let selectedState = {
      color: null, // { hex: "#...", image: "url..." }
      size: null,  // "XL"
    };
  
    // ================= Helpers =================
    const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    // دالة لتنسيق مسار الصورة القادم من لارافيل
    const getImageUrl = (path) => {
        if (!path) return '/images/default-product.png';
        if (path.startsWith('http')) return path;
        return `/storage/${path}`; // تأكد من عمل php artisan storage:link
    };
  
    function formatPrice(price, currency = "SYP") {
        return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: currency }).format(price);
    }
  
    function showError(element, message) {
      element.textContent = message || "";
      element.style.display = message ? "block" : "none";
    }
  
    // ================= Fetching Data from Laravel =================
    async function loadProductData() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
  
        if (!productId) {
            dom.title.textContent = "لم يتم تحديد منتج";
            return;
        }
  
        try {
            // جلب تفاصيل المنتج
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) throw new Error("Product not found");
            
            const data = await response.json();
            // يمكنك هنا تفقد هيكلية البيانات عبر console.log(data);
            
            initProductWidget(data);
            loadReviews(productId);
            loadRelatedProducts(data.category, data.id);
  
        } catch (error) {
            console.error(error);
            dom.title.textContent = "حدث خطأ أثناء تحميل المنتج";
        }
    }
  
    function initProductWidget(apiData) {
        // تهيئة البيانات بناءً على رد Laravel
        // نفترض أن لارافيل يعيد العلاقات: sizes, colors, images
        productData = {
            id: apiData.id,
            title: apiData.name,
            price: apiData.price,
            currency: apiData.currency || "SYP",
            description: apiData.description,
            // الصورة الرئيسية: إما من جدول الصور أو الحقل المباشر
            mainImage: getImageUrl(apiData.product_images?.[0]?.image || apiData.image), 
            colors: apiData.colors || [], // [{hex: '#000', image: 'path'}, ...]
            sizes: apiData.sizes || []    // [{size: 'XL'}, ...]
        };
  
        // تعبئة الواجهة
        dom.title.textContent = productData.title;
        dom.price.textContent = formatPrice(productData.price, productData.currency);
        dom.description.innerHTML = productData.description.replace(/\n/g, '<br>');
        dom.productImage.src = productData.mainImage;
  
        renderOptions();
    }
  
    function renderOptions() {
        // 1. الألوان
        if (productData.colors && productData.colors.length > 0) {
            dom.colorGroup.classList.remove("pw--hidden");
            dom.colorOptionsContainer.innerHTML = "";
            
            productData.colors.forEach((c) => {
                const swatch = document.createElement("div");
                swatch.className = "pw__color-swatch";
                swatch.style.backgroundColor = c.hex;
                swatch.title = c.name || ""; // اختياري
                
                swatch.addEventListener("click", () => {
                    // إزالة التحديد السابق
                    document.querySelectorAll(".pw__color-swatch").forEach(el => el.classList.remove("selected"));
                    swatch.classList.add("selected");
                    
                    // تحديث الحالة
                    selectedState.color = c;
                    
                    // تغيير الصورة الرئيسية إذا كان لهذا اللون صورة خاصة
                    if (c.image) {
                        dom.productImage.src = getImageUrl(c.image);
                        // تأثير بصري بسيط
                        dom.productImage.style.opacity = 0.5;
                        setTimeout(() => dom.productImage.style.opacity = 1, 200);
                    }
                });
                dom.colorOptionsContainer.appendChild(swatch);
            });
        }
  
        // 2. القياسات
        if (productData.sizes && productData.sizes.length > 0) {
            dom.sizeGroup.classList.remove("pw--hidden");
            dom.sizeSelect.innerHTML = '<option value="">اختر القياس...</option>';
            productData.sizes.forEach((s) => {
                const opt = document.createElement("option");
                opt.value = s.size;
                opt.textContent = s.size;
                dom.sizeSelect.appendChild(opt);
            });
            
            dom.sizeSelect.addEventListener("change", (e) => {
                selectedState.size = e.target.value;
            });
        }
    }
  
    // ================= Cart Logic (LocalStorage) =================
    // ملاحظة: نستخدم LocalStorage للسلة "للضيوف"، ويمكن لاحقاً ربطها بـ API إذا سجل الدخول
    function validateInputs() {
        let valid = true;
        const qty = parseInt(dom.quantityInput.value, 10);
        
        if (isNaN(qty) || qty < 1) {
            showError(dom.qtyError, "الكمية غير صحيحة");
            valid = false;
        } else {
            showError(dom.qtyError, "");
        }
  
        if (productData.colors.length > 0 && !selectedState.color) {
            showError(dom.colorError, "يرجى اختيار اللون");
            valid = false;
        } else {
            showError(dom.colorError, "");
        }
  
        if (productData.sizes.length > 0 && !selectedState.size) {
            showError(dom.sizeError, "يرجى اختيار القياس");
            valid = false;
        } else {
            showError(dom.sizeError, "");
        }
  
        return valid;
    }
  
    async function handleAddToCart() {
        if (isAdding || !productData) return;
        if (!validateInputs()) return;
  
        isAdding = true;
        dom.addBtn.disabled = true;
        dom.btnText.innerHTML = '<span class="pw__spinner"></span> جاري الإضافة...';
  
        const quantity = parseInt(dom.quantityInput.value, 10);
        
        // الصورة التي ستظهر في السلة (صورة اللون المختار أو الرئيسية)
        const cartImage = (selectedState.color && selectedState.color.image) 
                          ? getImageUrl(selectedState.color.image) 
                          : productData.mainImage;
  
        const payload = {
            id: productData.id,
            name: productData.title,
            price: productData.price,
            currency: productData.currency,
            quantity: quantity,
            color: selectedState.color ? selectedState.color.hex : null,
            size: selectedState.size,
            image: cartImage,
            addedAt: new Date().toISOString()
        };
  
        // حفظ في LocalStorage
        let cart = JSON.parse(localStorage.getItem('marketCart') || '[]');
        
        // التحقق من التكرار (نفس المنتج ونفس الخيارات)
        const existingItemIndex = cart.findIndex(item => 
            item.id === payload.id && 
            item.color === payload.color && 
            item.size === payload.size
        );
  
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push(payload);
        }
  
        localStorage.setItem('marketCart', JSON.stringify(cart));
  
        // محاكاة انتظار الشبكة
        await new Promise(r => setTimeout(r, 500));
  
        dom.btnText.textContent = "تمت الإضافة!";
        updateCartBadge(); // تحديث أيقونة السلة في الهيدر
  
        setTimeout(() => {
            dom.btnText.textContent = "أضف للسلة";
            dom.addBtn.disabled = false;
            isAdding = false;
        }, 1500);
    }
  
    function updateCartBadge() {
        const cart = JSON.parse(localStorage.getItem('marketCart') || '[]');
        const badge = document.querySelector('.cart-count') || document.querySelector('.fa-shopping-cart + span'); // عدل السلكتور حسب الهيدر عندك
        if(badge) badge.textContent = cart.length;
    }
  
    // ================= Reviews Logic (API) =================
    
    // رسم النجوم للإدخال
    function renderRatingStars() {
        dom.ratingInputContainer.innerHTML = '';
        for (let i = 5; i >= 1; i--) {
            const star = document.createElement('i');
            star.className = 'fas fa-star rating-star';
            star.dataset.value = i;
            star.addEventListener('click', () => {
                dom.ratingValue.value = i;
                updateStarVisuals(i);
            });
            dom.ratingInputContainer.appendChild(star);
        }
    }
  
    function updateStarVisuals(val) {
        const stars = dom.ratingInputContainer.querySelectorAll('.rating-star');
        stars.forEach(s => {
            if (s.dataset.value <= val) s.classList.add('selected');
            else s.classList.remove('selected');
        });
    }
  
    // جلب التقييمات
    async function loadReviews(productId) {
        try {
            const res = await fetch(`/api/products/${productId}/reviews`);
            if(!res.ok) return;
            const reviews = await res.json();
            
            dom.reviewsList.innerHTML = '';
            if(reviews.length === 0) {
                dom.reviewsList.innerHTML = '<p style="color:#777">لا توجد تقييمات بعد. كن أول من يقيم!</p>';
                return;
            }
  
            reviews.forEach(r => {
                const card = document.createElement('div');
                card.className = 'review-card';
                card.innerHTML = `
                    <div class="review-header">
                        <span class="review-name">${r.user_name}</span>
                        <div class="review-rating-display">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
                    </div>
                    <p class="review-text">${r.comment}</p>
                `;
                dom.reviewsList.appendChild(card);
            });
        } catch (e) { console.error("Error loading reviews", e); }
    }
  
    // إرسال تقييم جديد
    dom.reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = dom.ratingValue.value;
        const comment = dom.reviewText.value;
        const name = dom.reviewerName.value;
  
        if (!rating) { alert("يرجى اختيار عدد النجوم"); return; }
  
        const submitBtn = dom.reviewForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري الإرسال...';
  
        try {
            const response = await fetch(`/api/products/${productData.id}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ user_name: name, rating: rating, comment: comment })
            });
  
            if (response.ok) {
                alert('شكراً لتقييمك!');
                dom.reviewForm.reset();
                updateStarVisuals(0);
                loadReviews(productData.id); // إعادة تحميل التقييمات
            } else {
                alert('حدث خطأ أثناء الإرسال');
            }
        } catch (error) {
            console.error(error);
            alert('فشل الاتصال بالسيرفر');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'أرسل التقييم';
        }
    });
  
    // ================= Related Products =================
    async function loadRelatedProducts(category, currentId) {
        if(!category) return;
        try {
            const res = await fetch(`/api/products?category=${category}&limit=5`);
            const products = await res.json();
            
            // استثناء المنتج الحالي
            const related = products.filter(p => p.id != currentId);
            
            dom.relatedList.innerHTML = '';
            if(related.length === 0) {
                document.getElementById('related-products-section').style.display = 'none';
                return;
            }
  
            related.forEach(p => {
                const card = document.createElement('a');
                card.href = `/Product/Product.html?id=${p.id}`;
                card.className = 'product-card';
                card.innerHTML = `
                    <img src="${getImageUrl(p.image)}" class="product-card-image" alt="${p.name}">
                    <div class="product-card-name">${p.name}</div>
                    <div class="product-card-price">${formatPrice(p.price)}</div>
                    <button class="product-card-btn">عرض</button>
                `;
                dom.relatedList.appendChild(card);
            });
        } catch(e) { console.error("Error loading related", e); }
    }
  
    // ================= Initial Events =================
    dom.imageTrigger.addEventListener("click", () => {
        dom.lightbox.classList.add("pw--active");
        dom.lightboxImg.src = dom.productImage.src;
    });
    dom.lightboxClose.addEventListener("click", () => {
        dom.lightbox.classList.remove("pw--active");
    });
    
    dom.qtyDecBtn.addEventListener("click", () => {
        let v = parseInt(dom.quantityInput.value) || 1;
        if(v > 1) dom.quantityInput.value = v - 1;
    });
    dom.qtyIncBtn.addEventListener("click", () => {
        let v = parseInt(dom.quantityInput.value) || 1;
        dom.quantityInput.value = v + 1;
    });
  
    dom.addBtn.addEventListener("click", handleAddToCart);
  
    // Start
    renderRatingStars();
    loadProductData();
  
  })();