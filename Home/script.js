// script.js - With Staggered Animations
document.addEventListener("DOMContentLoaded", () => {

    const BASE_URL = "http://127.0.0.1:8000";

    /* ==============================
       1️⃣ جلب وعرض العروض اليومية
    ============================== */
    const loadDailyOffers = async () => {
        const offersContainer = document.getElementById("offersContainer");
        if (!offersContainer) return;

        // تأثير تحميل بسيط
        offersContainer.innerHTML = '<div style="padding:20px; width:100%; text-align:center;">جاري تحميل العروض...</div>';

        try {
            const res = await fetch(`${BASE_URL}/api/offers`);
            const json = await res.json();

            const offers = json.offers || [];

            if (!offers.length) {
                offersContainer.innerHTML = '<div style="padding:20px;">لا توجد عروض حالياً</div>';
                return;
            }

            offersContainer.innerHTML = "";

            offers.forEach((o, index) => {
                const p = o.product;
                if (!p) return;

                /* ✅ الصورة الصحيحة */
                let img = "/images/CLE.jpg";
                if (p.image_url) {
                    img = p.image_url;
                }

                /* السعر */
                const basePrice = Number(p.price);
                let finalPrice = basePrice;
                let label = "";

                if (o.discount_percentage) {
                    finalPrice = basePrice - (basePrice * o.discount_percentage / 100);
                    label = `-${o.discount_percentage}%`;
                }

                // حساب التأخير الزمني لكل كارت (index * 0.1s)
                const delay = index * 0.1;

                offersContainer.insertAdjacentHTML("beforeend", `
                    <div class="offer-white-card" style="animation-delay: ${delay}s"  onclick="location.href='/Product/Product.html?id=${p.id}'">
                        <span class="discount-circle">${label}</span>

                        <div class="offer-img-box" onclick ="window.location.href='/Product/Product.html?id=${p.id}'">
                            <img src="${img}" alt="${p.name}">
                        </div>

                        <div class="offer-details">
                            <h4 class="offer-title">${p.name}</h4>

                            <div class="offer-prices">
                                <span class="new-price">SYP</span>
                                <span class="new-price">${Math.round(finalPrice)}</span>
                                <span class="old-price">${basePrice}</span>
                            </div>
                        </div>
                    </div>
                `);
            });

        } catch (e) {
            console.error(e);
            offersContainer.innerHTML = "خطأ في تحميل العروض";
        }
    };


    /* ==============================
       2️⃣ جلب الإعلانات
    ============================== */
    const loadAds = async () => {
        const adsContainer = document.getElementById("adsContainer");
        if (!adsContainer) return;

        try {
            const response = await fetch(`${BASE_URL}/api/ads`);
            const res = await response.json();
            const ads = res.ads || [];

            if (!ads.length) {
                adsContainer.style.display = "none";
                return;
            }

            adsContainer.innerHTML = "";

            ads.forEach((ad, index) => {
                const img = ad.image
                    ? `${BASE_URL}/storage/${ad.image}`
                    : "https://via.placeholder.com/800x300";

                // تأخير زمني للإعلانات أيضاً
                const delay = index * 0.2;

                adsContainer.insertAdjacentHTML("beforeend", `
                    <div class="ad-banner"
                        style="background-image:url('${img}'); animation-delay: ${delay}s;">
                        <div class="ad-overlay"></div>
                        <div class="ad-content">
                            <h3>${ad.title}</h3>
                            <p>${ad.description || ""}</p>
                            ${ad.link ? `<button onclick="location.href='${ad.link}'">تصفح العرض</button>` : ''}
                        </div>
                    </div>
                `);
            });

        } catch (err) {
            console.error(err);
        }
    };

    loadDailyOffers();
    loadAds();
});