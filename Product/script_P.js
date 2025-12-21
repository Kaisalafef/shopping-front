(function () {
  "use strict";

  const dom = {
    productImage: document.getElementById("pw-product-image"),
    imageTrigger: document.getElementById("pw-image-trigger"),
    title: document.getElementById("pw-title"),
    price: document.getElementById("pw-price"),
    description: document.getElementById("pw-description"),

    // New Groups
    colorGroup: document.getElementById("pw-color-group"),
    colorOptionsContainer: document.getElementById("pw-color-options"),
    colorError: document.getElementById("pw-color-error"),

    sizeGroup: document.getElementById("pw-size-group"),
    sizeSelect: document.getElementById("pw-size-select"),
    sizeError: document.getElementById("pw-size-error"),

    quantityInput: document.getElementById("pw-quantity"),
    qtyDecBtn: document.getElementById("pw-qty-dec"),
    qtyIncBtn: document.getElementById("pw-qty-inc"),
    qtyError: document.getElementById("pw-qty-error"),
    addBtn: document.getElementById("pw-add-btn"),
    btnText: document.getElementById("pw-btn-text"),
    addStatus: document.getElementById("pw-add-status"),
    lightbox: document.getElementById("pw-lightbox"),
    lightboxImg: document.getElementById("pw-lightbox-img"),
    lightboxClose: document.getElementById("pw-lightbox-close"),
    reviewForm: document.getElementById("review-form"),
    reviewerName: document.getElementById("reviewer-name"),
    ratingInputContainer: document.getElementById("rating-input"),
    ratingValue: document.getElementById("review-rating-value"),
    reviewText: document.getElementById("review-text"),
    reviewsList: document.getElementById("reviews-list"),
  };

  let productData = null;
  let isAdding = false;

  // State for selected options
  let selectedState = {
    color: null, // Stores the entire color object
    size: null, // Stores the entire size object
  };

  function formatPrice(price, currency) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      }).format(price);
    } catch (err) {
      return `${currency} ${price}`;
    }
  }

  function getMaxQuantity() {
    return 10; 
  }

  function updateQuantityButtons() {
    const qty = parseInt(dom.quantityInput.value, 10) || 1;
    const max = getMaxQuantity();
    dom.qtyDecBtn.disabled = qty <= 1;
    dom.qtyIncBtn.disabled = qty >= max;
  }

  function showError(element, message) {
    element.textContent = message || "";
    element.style.display = message ? "block" : "none";
  }

  function validateInputs() {
    let valid = true;
    const qty = parseInt(dom.quantityInput.value, 10);
    const max = getMaxQuantity();
    if (Number.isNaN(qty) || qty < 1 || qty > max) {
      showError(dom.qtyError, `الرجاء إدخال كمية بين 1 و ${max}`);
      valid = false;
    } else {
      showError(dom.qtyError, "");
    }

    const hasColors = productData.options.some((o) => o.type === "color");
    if (hasColors && !selectedState.color) {
      showError(dom.colorError, "الرجاء اختيار اللون");
      valid = false;
    } else {
      showError(dom.colorError, "");
    }

    const hasSizes = productData.options.some((o) => o.type === "size");
    if (hasSizes && !dom.sizeSelect.value) {
      showError(dom.sizeError, "الرجاء اختيار القياس");
      valid = false;
    } else {
      showError(dom.sizeError, "");
      if (hasSizes) {
        selectedState.size = productData.options.find(
          (o) => o.type === "size" && o.value === dom.sizeSelect.value
        );
      }
    }
    return valid;
  }

  /* -----------------------------------------------------------
     تعديل دالة الإضافة للسلة لتقوم بالحفظ الفعلي في LocalStorage
     ----------------------------------------------------------- */
  async function handleAddToCart() {
    if (isAdding || !productData) return;
    if (!validateInputs()) return;

    isAdding = true;
    dom.addBtn.disabled = true;
    dom.btnText.innerHTML = '<span class="pw__spinner"></span> جاري الإضافة...';

    const quantity = parseInt(dom.quantityInput.value, 10);

    // تجهيز بيانات المنتج المختار
    const payload = {
      id: productData.id,
      name: productData.title, // نستخدم name ليتوافق مع صفحة السلة والمنتجات
      price: productData.price,
      currency: productData.currency,
      quantity,
      color: selectedState.color ? selectedState.color.value : null,
      size: dom.sizeSelect.value || null,
      img: selectedState.color && selectedState.color.image 
             ? selectedState.color.image 
             : productData.image,
      addedAt: new Date().toISOString()
    };

    // --- منطق الحفظ في السلة ---
    let cart = JSON.parse(localStorage.getItem('marketCart') || '[]');
    
    // التحقق مما إذا كان المنتج (بنفس الخيارات) موجوداً مسبقاً لزيادة الكمية فقط
    const existingIndex = cart.findIndex(item => 
        item.id === payload.id && 
        item.color === payload.color && 
        item.size === payload.size
    );

    if (existingIndex > -1) {
        cart[existingIndex].quantity += payload.quantity;
    } else {
        cart.push(payload);
    }

    // حفظ السلة المحدثة
    localStorage.setItem('marketCart', JSON.stringify(cart));

    // محاكاة تأخير بسيط للجمالية
    await new Promise((resolve) => setTimeout(resolve, 600));

    console.log("تم الحفظ في السلة بنجاح:", payload);

    dom.btnText.textContent = "تمت الإضافة!";
    
    // تحديث عداد السلة في الهيدر إذا كان موجوداً
    updateCartBadge();

    setTimeout(() => {
      dom.btnText.textContent = "اضف الى السلة";
      dom.addBtn.disabled = false;
      isAdding = false;
    }, 1500);
  }

  // دالة لتحديث رقم السلة في الهيدر (اختياري)
  function updateCartBadge() {
      const cart = JSON.parse(localStorage.getItem('marketCart') || '[]');
      const badge = document.querySelector('.fa-shopping-cart + span') || document.querySelector('.cart-count');
      if (badge) badge.textContent = cart.length;
  }

  /* ---------------------------
      باقي دوال النظام (الصور والتهيئه)
     --------------------------- */
  function openLightbox() {
    dom.lightbox.classList.add("pw--active");
    dom.lightboxImg.src = dom.productImage.src;
    dom.lightboxClose.focus();
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    dom.lightbox.classList.remove("pw--active");
    dom.imageTrigger.focus();
    document.body.style.overflow = "";
  }

  function initProductWidget(product) {
    if (!product || !product.id) return;

    productData = {
      id: product.id,
      title: product.title,
      price: typeof product.price === "object" ? product.price.amount : product.price,
      currency: typeof product.price === "object" ? product.price.currency : product.currency || "SYP",
      image: product.image || "",
      description: product.description || "",
      options: Array.isArray(product.options) ? product.options : [],
    };

    dom.title.textContent = productData.title;
    dom.price.textContent = formatPrice(productData.price, productData.currency);
    dom.description.innerHTML = productData.description;
    dom.productImage.src = productData.image;

    // Render Colors & Sizes (نفس منطقك الأصلي)
    renderOptions();
    updateQuantityButtons();
  }

  function renderOptions() {
    const colors = productData.options.filter((o) => o.type === "color");
    const sizes = productData.options.filter((o) => o.type === "size");

    if (colors.length > 0) {
      dom.colorGroup.classList.remove("pw--hidden");
      dom.colorOptionsContainer.innerHTML = "";
      colors.forEach((colorObj) => {
        const swatch = document.createElement("div");
        swatch.className = "pw__color-swatch";
        swatch.style.backgroundColor = colorObj.value;
        swatch.addEventListener("click", () => {
          document.querySelectorAll(".pw__color-swatch").forEach((el) => el.classList.remove("selected"));
          swatch.classList.add("selected");
          selectedState.color = colorObj;
          if (colorObj.image) dom.productImage.src = colorObj.image;
        });
        dom.colorOptionsContainer.appendChild(swatch);
      });
    }

    if (sizes.length > 0) {
      dom.sizeGroup.classList.remove("pw--hidden");
      dom.sizeSelect.innerHTML = '<option value="">اختر القياس...</option>';
      sizes.forEach((sizeObj) => {
        const opt = document.createElement("option");
        opt.value = sizeObj.value;
        opt.textContent = sizeObj.value;
        dom.sizeSelect.appendChild(opt);
      });
    }
  }

  // Bindings
  dom.imageTrigger.addEventListener("click", openLightbox);
  dom.lightboxClose.addEventListener("click", closeLightbox);
  dom.qtyDecBtn.addEventListener("click", () => {
    let val = parseInt(dom.quantityInput.value, 10) || 1;
    if (val > 1) { dom.quantityInput.value = val - 1; updateQuantityButtons(); }
  });
  dom.qtyIncBtn.addEventListener("click", () => {
    let val = parseInt(dom.quantityInput.value, 10) || 1;
    if (val < getMaxQuantity()) { dom.quantityInput.value = val + 1; updateQuantityButtons(); }
  });
  dom.addBtn.addEventListener("click", handleAddToCart);

  // Load product from LocalStorage based on URL ID
  function loadProductFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const storedProducts = JSON.parse(localStorage.getItem('marketProducts') || '[]');
    const product = storedProducts.find(p => p.id === productId);

    if (product) {
        initProductWidget({
            id: product.id,
            title: product.name,
            price: product.price,
            currency: product.currency,
            image: product.img,
            description: product.description,
            options: product.options
        });
    }
  }

  loadProductFromUrl();

  /* ---------------------------
     نظام التقييمات (نفس كودك السابق)
     --------------------------- */
  // ... (احتفظ بكود التقييمات هنا كما هو)
})();