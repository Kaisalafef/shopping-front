document.addEventListener("DOMContentLoaded", () => {
    
    // إعدادات الـ API (تأكد من توافق المنفذ مع السيرفر لديك)
    const BASE_URL = "http://127.0.0.1:8000";
    const API_URLS = {
        PRODUCTS: `${BASE_URL}/api/products`,
        ADS: `${BASE_URL}/api/ads`
    };

    /* ==============================
       1️⃣ دالة جلب وعرض العروض اليومية
    ============================== */
    const loadDailyOffers = async () => {
        const offersContainer = document.getElementById("offersContainer");
        
        // عرض لودينج مؤقت
        offersContainer.innerHTML = '<div class="loading-spinner">جاري تحميل العروض...</div>';

        try {
            const response = await fetch(API_URLS.PRODUCTS, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) throw new Error("فشل جلب المنتجات");

            const products = await response.json();

            // فلترة المنتجات التي تمتلك خصم فقط
            const offers = products.filter(p => p.discount_value && parseFloat(p.discount_value) > 0);

            if (offers.length === 0) {
                offersContainer.innerHTML = '<p style="padding:20px; text-align:center; width:100%; color:#666;">لا توجد عروض حالياً.</p>';
                return;
            }

            offersContainer.innerHTML = ""; // تفريغ الحاوية

            offers.forEach(prod => {
                // 1. معالجة الصورة
                let imgUrl = '/images/placeholder.png';
                if (prod.product_images && prod.product_images.length > 0) {
                    // نفترض أن الباك إند يعيد اسم الصورة فقط، لذا نضيف المسار الكامل
                    // إذا كان الباك يعيد رابط كامل، احذف `${BASE_URL}/storage/`
                    const imgName = prod.product_images[0].image; 
                    imgUrl = imgName.startsWith('http') ? imgName : `${BASE_URL}/storage/${imgName}`;
                }

                // 2. حساب السعر والخصم
                const basePrice = parseFloat(prod.price);
                const discountVal = parseFloat(prod.discount_value);
                let finalPrice = basePrice;
                let discountLabel = "";

                if (prod.discount_type === 'percent') {
                    finalPrice = basePrice - (basePrice * (discountVal / 100));
                    discountLabel = `-${discountVal}%`;
                } else {
                    finalPrice = basePrice - discountVal;
                    discountLabel = "تخفيض";
                }

                // تنسيق العملة
                const fmt = (num) => new Intl.NumberFormat('en-US').format(num);

                // 3. إنشاء الكارت
                const cardHTML = `
                    <div class="offer-white-card">
                        <span class="discount-circle">${discountLabel}</span>
                        <div class="offer-img-box">
                            <img src="${imgUrl}" alt="${prod.name}" loading="lazy" 
                                 onerror="this.src='/images/placeholder.png'">
                        </div>
                        <div class="offer-details">
                            <h4 class="offer-title">${prod.name}</h4>
                            <div class="offer-prices">
                                <span class="new-price">${fmt(finalPrice)} SYP</span>
                                <span class="old-price">${fmt(basePrice)}</span>
                            </div>
                            <button class="add-cart-btn-mini" onclick="addToCart(${prod.id})">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                `;
                offersContainer.insertAdjacentHTML("beforeend", cardHTML);
            });

        } catch (error) {
            console.error("Error loading offers:", error);
            offersContainer.innerHTML = '<p style="color:red; text-align:center;">حدث خطأ في تحميل العروض</p>';
        }
    };

    /* ==============================
       2️⃣ دالة جلب وعرض الإعلانات
    ============================== */
    const loadAds = async () => {
        const adsContainer = document.getElementById("adsContainer");

        try {
            const response = await fetch(API_URLS.ADS, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) throw new Error("فشل جلب الإعلانات");

            const data = await response.json();
            // الـ API في ملف display_ads.js يعيد { ads: [...] }
            const adsList = data.ads || []; 

            if (adsList.length === 0) {
                adsContainer.style.display = 'none';
                return;
            }

            adsContainer.innerHTML = "";

            adsList.forEach(ad => {
                // معالجة صورة الإعلان
                let adImgUrl = "https://via.placeholder.com/800x300?text=No+Image";
                if (ad.image) {
                    adImgUrl = ad.image.startsWith('http') ? ad.image : `${BASE_URL}/storage/${ad.image}`;
                }

                const adHTML = `
                    <div class="ad-banner" 
                         onclick="window.location.href='/ADS/ADS.html?id=${ad.id}'"
                         style="background-image: url('${adImgUrl}');">
                        <div class="ad-overlay"></div>
                        <div class="ad-content">
                            <h3>${ad.title}</h3>
                            <p>${ad.description || ''}</p>
                            ${ad.btn_text ? `<button>${ad.btn_text}</button>` : ''}
                        </div>
                    </div>
                `;
                adsContainer.insertAdjacentHTML("beforeend", adHTML);
            });

            // تفعيل أنيميشن GSAP بعد تحميل العناصر
            runAnimations();

        } catch (error) {
            console.error("Error loading ads:", error);
            adsContainer.innerHTML = '';
        }
    };

    /* ==============================
       3️⃣ الأنيميشن (GSAP)
    ============================== */
    const runAnimations = () => {
        if (typeof gsap !== 'undefined') {
            gsap.from(".pdf-card", {
                delay: 0.2,
                opacity: 0,
                y: 20,
                duration: 0.8,
                stagger: 0.1,
                ease: "back.out(1.7)",
            });
            
            gsap.from(".ad-banner", {
                opacity: 0,
                x: -50,
                duration: 1,
                ease: "power2.out"
            });
        }
    };

    // تشغيل الدوال عند بدء الصفحة
    loadDailyOffers();
    loadAds();
});

// دالة وهمية للإضافة للسلة (يمكنك ربطها لاحقاً)
function addToCart(productId) {
    console.log(`Product ${productId} added to cart`);
    alert("تمت إضافة المنتج للسلة (تجريبي)");
}