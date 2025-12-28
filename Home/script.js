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

        const offers = json.offers || [];

        if (!offers.length) {
            offersContainer.innerHTML = "لا توجد عروض حالياً";
            return;
        }

        offersContainer.innerHTML = "";

        offers.forEach(o => {
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

            offersContainer.insertAdjacentHTML("beforeend", `
                <div class="offer-white-card">
                    <span class="discount-circle">${label}</span>

                    <div class="offer-img-box">
                        <img src="${img}" alt="${p.name}">
                    </div>

                    <div class="offer-details">
                        <h4 class="offer-title">${p.name}</h4>

                        <div class="offer-prices">
                            <span class="new-price">${Math.round(finalPrice)} SYP</span>
                            <span class="old-price">${basePrice} SYP</span>
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
