function getAuthToken() {
  return localStorage.getItem("token");
}

/**
 * Discount Management Script
 * Connected to Laravel Offers API
 */
(function () {
  "use strict";

  /* ================= CONFIG ================= */

  const API_BASE = "http://127.0.0.1:8000";

  const API_URLS = {
    GET_PRODUCTS: `${API_BASE}/api/products`,
    CREATE_OFFER: `${API_BASE}/api/offers`,
    UPDATE_OFFER: (id) => `${API_BASE}/api/offers/${id}`,
    DELETE_OFFER: (id) => `${API_BASE}/api/offers/${id}`,
  };

  const state = {
    products: [],
  };

  /* ================= DOM ================= */

  const els = {
    grid: document.getElementById("productsGrid"),
    search: document.getElementById("searchInput"),

    modal: document.getElementById("discountModal"),
    form: document.getElementById("discountForm"),

    mId: document.getElementById("modalProdId"),
    mTitle: document.getElementById("modalTitle"),
    mImg: document.getElementById("modalImg"),
    mBasePrice: document.getElementById("modalBasePrice"),
    mCurrency: document.getElementById("modalCurrency"),
    mValue: document.getElementById("discountValue"),
    mNewPrice: document.getElementById("newPriceDisplay"),
    mRemoveBtn: document.getElementById("removeDiscountBtn"),
    radios: document.getElementsByName("discountType"),
    suffix: document.getElementById("valueSuffix"),

    closeBtns: document.querySelectorAll(".close-modal"),
    toast: document.getElementById("toast"),
  };

  /* ================= HELPERS ================= */

  const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.content || "";

  const format = (n) => new Intl.NumberFormat("en-US").format(n);

  const toast = (msg, type = "success") => {
    els.toast.textContent = msg;
    els.toast.style.background = type === "error" ? "#dc2626" : "#111827";
    els.toast.classList.remove("hidden");
    setTimeout(() => els.toast.classList.add("hidden"), 3000);
  };

  const calcPrice = (base, type, value) => {
    if (type === "percent") {
      return Math.max(0, base - base * (value / 100));
    }
    return Math.max(0, base - value);
  };

  /* ================= API ================= */

  async function fetchProducts() {
    els.grid.innerHTML = `<div class="loading-spinner">جاري التحميل...</div>`;

    try {
      const res = await fetch(API_URLS.GET_PRODUCTS, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error("API Error");

      const resData = await res.json();
      const products = resData.data ?? resData;

      state.products = products.map((p) => ({
        id: p.id,
        title: p.name,
        basePrice: Number(p.price),
        currency: "SYP",
        image:
          p.image_url ||
          p.images?.[0]?.url ||
          "https://via.placeholder.com/400",

        discount: p.offer
          ? {
              offerId: p.offer.id,
              type: p.offer.discount_percentage ? "percent" : "fixed",
              value: p.offer.discount_percentage ?? p.offer.discount_price,
            }
          : null,
      }));

      render(state.products);
    } catch (err) {
      console.error(err);
      els.grid.innerHTML = `<div style="color:red">فشل تحميل البيانات</div>`;
    }
  }

  async function saveDiscount(productId, type, value) {
    const product = state.products.find((p) => p.id == productId);
    const hasOffer = !!product.discount;

    const payload = {
      product_id: productId,
      discount_percentage: type === "percent" ? value : null,
      discount_price: type === "fixed" ? value : null,
      is_active: true,
    };

    const url = hasOffer
      ? API_URLS.UPDATE_OFFER(product.discount.offerId)
      : API_URLS.CREATE_OFFER;

    const method = hasOffer ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      toast("تم حفظ الخصم بنجاح");
      closeModal();
      fetchProducts();
    } catch {
      toast("فشل حفظ الخصم", "error");
    }
  }

  async function removeDiscount(productId) {
    const product = state.products.find((p) => p.id == productId);
    if (!product?.discount) return;

    try {
      await fetch(API_URLS.DELETE_OFFER(product.discount.offerId), {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      toast("تم حذف الخصم");
      closeModal();
      fetchProducts();
    } catch {
      toast("فشل حذف الخصم", "error");
    }
  }

  /* ================= RENDER ================= */

  function render(list) {
    els.grid.innerHTML = "";

    if (!list.length) {
      els.grid.innerHTML = `<div>لا توجد منتجات</div>`;
      return;
    }

    list.forEach((p) => {
      const hasDiscount = !!p.discount;
      const finalPrice = hasDiscount
        ? calcPrice(p.basePrice, p.discount.type, p.discount.value)
        : p.basePrice;

      const card = document.createElement("div");
      card.className = "prod-card";
      card.innerHTML = `
                ${hasDiscount ? `<span class="discount-badge">خصم</span>` : ""}
                <img src="${p.image}" class="prod-img">
                <h3>${p.title}</h3>
                <div class="price-row">
                    <span class="current-price">${format(finalPrice)} ${
        p.currency
      }</span>
                    ${
                      hasDiscount
                        ? `<span class="old-price">${format(
                            p.basePrice
                          )}</span>`
                        : ""
                    }
                </div>
                <button class="btn btn-primary" data-id="${p.id}">
                    ${hasDiscount ? "تعديل الخصم" : "إضافة خصم"}
                </button>
            `;
      card
        .querySelector("button")
        .addEventListener("click", () => openModal(p.id));
      els.grid.appendChild(card);
    });
  }

  /* ================= MODAL ================= */

  function openModal(id) {
    const p = state.products.find((x) => x.id == id);
    if (!p) return;

    els.mId.value = p.id;
    els.mTitle.textContent = p.title;
    els.mImg.src = p.image;
    els.mBasePrice.textContent = format(p.basePrice);
    els.mBasePrice.dataset.raw = p.basePrice;
    els.mCurrency.textContent = p.currency;

    if (p.discount) {
      [...els.radios].find((r) => r.value === p.discount.type).checked = true;
      els.mValue.value = p.discount.value;
      els.mRemoveBtn.classList.remove("hidden");
    } else {
      els.radios[0].checked = true;
      els.mValue.value = "";
      els.mRemoveBtn.classList.add("hidden");
    }

    updateCalc();
    els.modal.classList.add("visible");
  }

  function closeModal() {
    els.modal.classList.remove("visible");
    els.form.reset();
    els.mNewPrice.textContent = "--";
  }

  function updateCalc() {
    const base = Number(els.mBasePrice.dataset.raw);
    const type = [...els.radios].find((r) => r.checked).value;
    const val = Number(els.mValue.value);

    els.suffix.textContent =
      type === "percent" ? "%" : els.mCurrency.textContent;

    if (val > 0) {
      els.mNewPrice.textContent =
        format(calcPrice(base, type, val)) + " " + els.mCurrency.textContent;
    } else {
      els.mNewPrice.textContent = "--";
    }
  }

  /* ================= EVENTS ================= */

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = els.mId.value;
    const type = [...els.radios].find((r) => r.checked).value;
    const value = Number(els.mValue.value);

    if (value <= 0) return toast("قيمة غير صحيحة", "error");
    if (type === "percent" && value > 100)
      return toast("النسبة لا تتجاوز 100%", "error");

    saveDiscount(id, type, value);
  });

  els.mRemoveBtn.addEventListener("click", () => {
    if (confirm("هل أنت متأكد؟")) {
      removeDiscount(els.mId.value);
    }
  });

  els.radios.forEach((r) => r.addEventListener("change", updateCalc));
  els.form.addEventListener("input", updateCalc);
  els.closeBtns.forEach((b) => b.addEventListener("click", closeModal));

  els.search.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    render(
      state.products.filter(
        (p) => p.title.toLowerCase().includes(q) || p.id.toString().includes(q)
      )
    );
  });

  /* ================= INIT ================= */

  fetchProducts();
})();

async function loadDailyOffers() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/products");
    const response = await res.json();

    // ✅ هذا السطر هو الحل
    const products = response.data ?? response;

    const offers = products.filter((p) => p.offer);

    const container = document.getElementById("offersContainer");
    container.innerHTML = "";

    if (!offers.length) {
      container.innerHTML = "<p>لا توجد عروض حالياً</p>";
      return;
    }

    offers.forEach((p) => {
      const offer = p.offer;

      const discountText = offer.discount_percentage
        ? `خصم ${offer.discount_percentage}%`
        : `خصم ${offer.discount_price} SYP`;

      container.innerHTML += `
        <div class="offer-card">
          <img src="${p.image_url || p.images?.[0]?.url || 'https://via.placeholder.com/400'}">
          <h4>${p.name}</h4>
          <p>${discountText}</p>
        </div>
      `;
    });
  } catch (e) {
    console.error("خطأ تحميل العروض:", e);
  }
}

loadDailyOffers();
