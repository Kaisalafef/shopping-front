document.addEventListener("DOMContentLoaded", () => {

    const BASE_URL = "http://127.0.0.1:8000";

    /* ==============================
       1️⃣ جلب وعرض العروض اليومية
    ============================== */
    const loadDailyOffers = async () => {
        const offersContainer = document.getElementById("offersContainer");
        if (!offersContainer) return;

        offersContainer.innerHTML = "جاري تحميل العروض...";

        try {
            const res = await fetch(`${BASE_URL}/api/offers`);
            const json = await res.json();

            // ✅ التصحيح هنا
            const offers = json.offers || [];

            if (!offers.length) {
                offersContainer.innerHTML = "لا توجد عروض حالياً";
                return;
            }

            offersContainer.innerHTML = "";

            offers.forEach(o => {
                const p = o.product;
                if (!p) return;

                /* الصورة */
                let img = "/images/CLE.jpg"; // صورة افتراضية
                if (p.product_images && p.product_images.length > 0) {
                    img = `${BASE_URL}/storage/${p.product_images[0].image}`;
                }

                /* السعر */
                const basePrice = Number(p.price);
                let finalPrice = basePrice;
                let label = "";

                if (o.discount_type === "percent" && o.discount_percentage) {
                    finalPrice = basePrice - (basePrice * o.discount_percentage / 100);
                    label = `-${o.discount_percentage}%`;
                }

                if (o.discount_type === "fixed" && o.discount_price) {
                    finalPrice = basePrice - o.discount_price;
                    label = "خصم";
                }

                offersContainer.insertAdjacentHTML("beforeend", `
                    <div class="offer-white-card">
                        <span class="discount-circle">${label}</span>

                        <img src="${img}" alt="${p.name}">

                        <h4>${p.name}</h4>

                        <div class="price-box">
                            <span class="new-price">${finalPrice} SYP</span>
                            <del class="old-price">${basePrice}</del>
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

            ads.forEach(ad => {
                const img = ad.image
                    ? `${BASE_URL}/storage/${ad.image}`
                    : "https://via.placeholder.com/800x300";

                adsContainer.insertAdjacentHTML("beforeend", `
                    <div class="ad-banner"
                        style="background-image:url('${img}')">
                        <div class="ad-overlay"></div>
                        <div class="ad-content">
                            <h3>${ad.title}</h3>
                            <p>${ad.description || ""}</p>
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
