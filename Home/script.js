document.addEventListener("DOMContentLoaded", () => {
  /* ==============================
     1️⃣ العروض اليومية
  ============================== */
  const offersContainer = document.getElementById("offersContainer");
  const STORAGE_KEY = "market_products";

  const allProducts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const offers = allProducts.filter((p) => p.discount && p.discount.value > 0);

  if (offers.length === 0) {
    offersContainer.innerHTML =
      '<p style="padding:20px; text-align:center; width:100%; color:#666;">لا توجد عروض حالياً، ترقبوا المزيد قريباً!</p>';
  } else {
    offersContainer.innerHTML = "";

    offers.forEach((prod) => {
      let finalPrice = prod.basePrice;
      let discountLabel = "";

      if (prod.discount.type === "percent") {
        finalPrice =
          prod.basePrice - (prod.basePrice * prod.discount.value) / 100;
        discountLabel = `-${prod.discount.value}%`;
      } else {
        finalPrice = prod.basePrice - prod.discount.value;
        discountLabel = "تخفيض";
      }

      const fmt = (num) => new Intl.NumberFormat("en-US").format(num);

      offersContainer.insertAdjacentHTML(
        "beforeend",
        `
        <div class="offer-white-card">
          <span class="discount-circle">${discountLabel}</span>
          <div class="offer-img-box">
            <img src="${prod.image}" alt="${
          prod.title
        }" onerror="this.src='/images/placeholder.png'">
          </div>
          <div class="offer-details">
            <h4 class="offer-title">${prod.title}</h4>
            <div class="offer-prices">
              <span class="new-price">${fmt(finalPrice)} ${prod.currency}</span>
              <span class="old-price">${fmt(prod.basePrice)}</span>
            </div>
            <button class="add-cart-btn-mini">
              <i class="fas fa-cart-plus"></i>
            </button>
          </div>
        </div>
      `
      );
    });
  }

  /* ==============================
     2️⃣ الإعلان
  ============================== */
  const adsContainer = document.getElementById("adsContainer");
  const savedAd = localStorage.getItem("singleAd");

  if (savedAd) {
    const data = JSON.parse(savedAd);

    adsContainer.insertAdjacentHTML(
      "afterbegin",
      `
      <div class="ad-banner"
           onclick="window.location.href='/ADS/ADS.html'"
           style="background-image:${data.image};">
        <div class="ad-overlay"></div>
        <div class="ad-content">
          <h3>${data.title}</h3>
          <p>${data.desc}</p>
          <button>${data.btnText}</button>
        </div>
      </div>
    `
    );
    gsap.from(
      ".pdf-card",
      {
        delay:0.2,
        opacity: 0,
        y: 0,
        duration: 0.9,
        stagger: 0.2,
        ease: "back.out(1.7)",
      }
    );
  }

  /* ==============================
     3️⃣ GSAP (بعد إنشاء كل العناصر)
  ============================== */
});
