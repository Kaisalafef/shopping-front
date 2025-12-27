/* ============================================================
   Product Page Script
   Compatible with Laravel API response
   ============================================================ */

const API_BASE = "http://127.0.0.1:8000/api";

/* ---------------------------
   Read product ID
---------------------------- */
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
  alert("لم يتم تحديد المنتج");
}

/* ---------------------------
   DOM Elements
---------------------------- */
const titleEl = document.getElementById("pw-title");
const priceEl = document.getElementById("pw-price");
const descEl = document.getElementById("pw-description");
const imageEl = document.getElementById("pw-product-image");

const colorGroup = document.getElementById("pw-color-group");
const colorContainer = document.getElementById("pw-color-options");

const sizeGroup = document.getElementById("pw-size-group");
const sizeSelect = document.getElementById("pw-size-select");

const qtyInput = document.getElementById("pw-quantity");
const btnInc = document.getElementById("pw-qty-inc");
const btnDec = document.getElementById("pw-qty-dec");

const addBtn = document.getElementById("pw-add-btn");

/* ---------------------------
   State
---------------------------- */
let selectedColor = null;

/* ---------------------------
   Load Product
---------------------------- */
async function loadProduct() {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}`);
    if (!res.ok) throw new Error("Product not found");

    const json = await res.json();
    renderProduct(json.data);
  } catch (err) {
    console.error(err);
    alert("تعذر تحميل بيانات المنتج");
  }
}

loadProduct();

/* ---------------------------
   Render Product
---------------------------- */
function renderProduct(product) {
  titleEl.textContent = product.name;
  priceEl.textContent = `${product.price} SYP`;
  descEl.textContent = product.description;

  if (product.image_url) {
    imageEl.src = product.image_url;
  }

  renderColors(product.images || []);
  renderSizes(product.sizes || []);
}

/* ---------------------------
   Colors
---------------------------- */
function renderColors(images) {
  if (!images.length) {
    colorGroup.classList.add("pw--hidden");
    return;
  }

  colorGroup.classList.remove("pw--hidden");
  colorContainer.innerHTML = "";

  images.forEach((img, index) => {
    const swatch = document.createElement("div");
    swatch.className = "pw__color-swatch";
    swatch.style.background = img.color;

    if (img.color === "white" || img.color === "#fff" || img.color === "#ffffff") {
      swatch.style.border = "1px solid #ccc";
    }

    swatch.addEventListener("click", () => {
      document
        .querySelectorAll(".pw__color-swatch")
        .forEach(el => el.classList.remove("selected"));

      swatch.classList.add("selected");
      selectedColor = img.color;

      if (img.url) {
        imageEl.src = img.url;
      }
    });

    if (index === 0) {
      swatch.classList.add("selected");
      selectedColor = img.color;

      if (img.url) {
        imageEl.src = img.url;
      }
    }

    colorContainer.appendChild(swatch);
  });
}

/* ---------------------------
   Sizes
---------------------------- */
function renderSizes(sizes) {
  if (!sizes.length) {
    sizeGroup.classList.add("pw--hidden");
    return;
  }

  sizeGroup.classList.remove("pw--hidden");
  sizeSelect.innerHTML = `<option value="">اختر المقاس</option>`;

  sizes.forEach(size => {
    const opt = document.createElement("option");
    opt.value = size.size;
    opt.textContent = size.size;
    sizeSelect.appendChild(opt);
  });
}

/* ---------------------------
   Quantity Controls
---------------------------- */
btnInc.addEventListener("click", () => {
  qtyInput.value = parseInt(qtyInput.value || 1) + 1;
});

btnDec.addEventListener("click", () => {
  const value = parseInt(qtyInput.value || 1);
  if (value > 1) qtyInput.value = value - 1;
});

/* ---------------------------
   Add To Cart
---------------------------- */
addBtn.addEventListener("click", () => {
  const quantity = parseInt(qtyInput.value || 1);
  const token = localStorage.getItem("token");

  if (!token) {
    alert("يرجى تسجيل الدخول أولاً");
    return;
  }

  if (!quantity || quantity < 1) {
    alert("يرجى إدخال كمية صحيحة");
    return;
  }

  if (!colorGroup.classList.contains("pw--hidden") && !selectedColor) {
    alert("يرجى اختيار اللون");
    return;
  }

  if (!sizeGroup.classList.contains("pw--hidden") && !sizeSelect.value) {
    alert("يرجى اختيار المقاس");
    return;
  }

  fetch(`${API_BASE}/my-cart`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  })
    .then(res => res.json())
    .then(res => {
      const cart = res.data ?? res;
      const cartId = cart.id;

      const payload = {
        product_id: productId,
        quantity,
        color: selectedColor,
        size: sizeSelect.value || null
      };

      return fetch(`${API_BASE}/carts/${cartId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    })
    .then(res => res.json())
    .then(() => {
      alert("تمت إضافة المنتج إلى السلة بنجاح ✅");
    })
    .catch(err => {
      console.error(err);
      alert("حدث خطأ أثناء إضافة المنتج");
    });
});