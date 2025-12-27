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
    // في الواقع الحقيقي قد نوجه المستخدم لصفحة 404
    console.warn("Product ID missing");
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

/* Lightbox Elements */
const lightbox = document.getElementById("pw-lightbox");
const lightboxImg = document.getElementById("pw-lightbox-img");
const lightboxClose = document.getElementById("pw-lightbox-close");
const imageTrigger = document.getElementById("pw-image-trigger");

/* Reviews & Related Elements */
const reviewsListEl = document.getElementById("reviews-list");
const relatedListEl = document.getElementById("related-products-list");
const ratingInputContainer = document.getElementById("rating-input");
const ratingValueInput = document.getElementById("review-rating-value");

/* ---------------------------
   State
---------------------------- */
let selectedColor = null;

/* ---------------------------
   Load Product
---------------------------- */
async function loadProduct() {
    try {
        // إذا لم يكن هناك ID في الرابط، سنستخدم رقم 1 للتجربة فقط
        const idToFetch = productId || 1; 
        
        const res = await fetch(`${API_BASE}/products/${idToFetch}`);
        if (!res.ok) throw new Error("Product not found");

        const json = await res.json();
        renderProduct(json.data);
        
        // استدعاء دوال العرض الإضافية (حتى لو البيانات فارغة حالياً من الـ API)
        // نقوم بتمرير بيانات فارغة أو وهمية لتنسيق الواجهة فقط
        renderReviews(json.data.reviews || []); 
        renderRelatedProducts(json.data.related || []);

    } catch (err) {
        console.error(err);
        titleEl.textContent = "حدث خطأ في تحميل المنتج";
    }
}

loadProduct();

/* ---------------------------
   Render Product
---------------------------- */
function renderProduct(product) {
    titleEl.textContent = product.name;
    priceEl.textContent = `${Number(product.price).toLocaleString()} SYP`;
    descEl.textContent = product.description;

    // الصورة الافتراضية
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
    if (!images || !images.length) {
        colorGroup.classList.add("pw--hidden");
        return;
    }

    colorGroup.classList.remove("pw--hidden");
    colorContainer.innerHTML = "";

    images.forEach((img, index) => {
        const swatch = document.createElement("div");
        swatch.className = "pw__color-swatch";
        swatch.style.background = img.color;
        swatch.title = img.color; // Tooltip

        swatch.addEventListener("click", () => {
            document
                .querySelectorAll(".pw__color-swatch")
                .forEach(el => el.classList.remove("selected"));

            swatch.classList.add("selected");
            selectedColor = img.color;

            // تغيير الصورة عند اختيار اللون
            if (img.url) {
                // تأثير بسيط عند تغيير الصورة
                imageEl.style.opacity = "0.5";
                setTimeout(() => {
                    imageEl.src = img.url;
                    imageEl.style.opacity = "1";
                }, 200);
            }
        });

        // تحديد أول لون تلقائيًا
        if (index === 0) {
            swatch.classList.add("selected");
            selectedColor = img.color;
            if (img.url) imageEl.src = img.url;
        }

        colorContainer.appendChild(swatch);
    });
}

/* ---------------------------
   Sizes
---------------------------- */
function renderSizes(sizes) {
    if (!sizes || !sizes.length) {
        sizeGroup.classList.add("pw--hidden");
        return;
    }

    sizeGroup.classList.remove("pw--hidden");
    sizeSelect.innerHTML = `<option value="" disabled selected>اختر المقاس المناسب</option>`;

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
   Add To Cart Logic
---------------------------- */
addBtn.addEventListener("click", () => {
    const quantity = parseInt(qtyInput.value || 1);

    // Validation styling
    document.querySelectorAll('.pw__error').forEach(e => e.style.display = 'none');

    if (!quantity || quantity < 1) {
        alert("يرجى إدخال كمية صحيحة");
        return;
    }

    if (!colorGroup.classList.contains("pw--hidden") && !selectedColor) {
        const err = document.getElementById('pw-color-error');
        err.textContent = "يرجى اختيار اللون";
        err.style.display = 'block';
        return;
    }

    if (!sizeGroup.classList.contains("pw--hidden") && !sizeSelect.value) {
        const err = document.getElementById('pw-size-error');
        err.textContent = "يرجى اختيار المقاس";
        err.style.display = 'block';
        return;
    }

    // Animation for button
    const originalText = document.getElementById('pw-btn-text').textContent;
    addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإضافة...';
    addBtn.disabled = true;

    const token = localStorage.getItem("token"); 

    fetch('http://127.0.0.1:8000/api/my-cart', {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    .then(res => res.json())
    .then(cart => {
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
    .then(item => {
        addBtn.innerHTML = '<i class="fas fa-check"></i> تم بنجاح';
        addBtn.style.background = "#2ecc71";
        setTimeout(() => {
            addBtn.innerHTML = `<i class="fas fa-shopping-bag"></i> ${originalText}`;
            addBtn.style.background = ""; // Reset to CSS default
            addBtn.disabled = false;
        }, 2000);
    })
    .catch(err => {
        console.error(err);
        addBtn.innerHTML = 'حدث خطأ';
        addBtn.disabled = false;
        alert("تأكد من تسجيل الدخول أولاً");
    });
});

/* ---------------------------
   Lightbox Logic
---------------------------- */
imageTrigger.addEventListener('click', () => {
    lightboxImg.src = imageEl.src;
    lightbox.classList.add('active');
});

lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('active');
});

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('active');
});


/* ---------------------------
   UI Enhancements (New Code)
---------------------------- */

// 1. Star Rating UI Logic
function initStarRating() {
    ratingInputContainer.innerHTML = '';
    // Create 5 stars
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = 'fas fa-star star-icon';
        star.dataset.value = i;
        
        // Hover Effect
        star.addEventListener('mouseover', () => {
            updateStarsVisual(i);
        });

        // Click Effect
        star.addEventListener('click', () => {
            ratingValueInput.value = i;
            updateStarsVisual(i, true); // True means "persist selection"
        });

        ratingInputContainer.appendChild(star);
    }

    // Reset stars on mouse out if no selection made
    ratingInputContainer.addEventListener('mouseleave', () => {
        const currentVal = ratingValueInput.value;
        if (currentVal) {
            updateStarsVisual(currentVal, true);
        } else {
            updateStarsVisual(0);
        }
    });
}

function updateStarsVisual(value, isSelected = false) {
    const stars = ratingInputContainer.querySelectorAll('.star-icon');
    stars.forEach(star => {
        const starVal = parseInt(star.dataset.value);
        if (starVal <= value) {
            star.style.color = 'var(--primary-accent)'; // Gold
        } else {
            star.style.color = '#dfe6e9'; // Grey
        }
    });
}

initStarRating();


// 2. Render Functions (Visual Placeholders)
// هذه الدوال تقوم بعرض البيانات إذا جاءت من الـ API، أو تعرض محتوى وهمي للتجربة
function renderReviews(reviews) {
    if(!reviews || reviews.length === 0) {
         reviews = [
             { name: "أحمد محمد", rating: 5, comment: "منتج رائع جداً وأنصح به!", date: "2023-10-01" },
             { name: "سارة علي", rating: 4, comment: "الجودة ممتازة بالنسبة للسعر.", date: "2023-09-28" }
         ];
    }

    if (reviews && reviews.length > 0) {
        reviewsListEl.innerHTML = reviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <span class="reviewer-name">${r.name}</span>
                    <span class="review-stars">${getStarHTML(r.rating)}</span>
                </div>
                <p class="review-body">${r.comment}</p>
                <span class="review-date">${r.date || ''}</span>
            </div>
        `).join('');
    }
}

function renderRelatedProducts(products) {
    // Dummy UI for demo if empty
    if (!products || products.length === 0) {
        products = [
           { name: "منتج مقترح 1", price: 25000, image: "/images/placeholder.png" },
            { name: "منتج مقترح 2", price: 30000, image: "/images/placeholder.png" },
            { name: "منتج مقترح 3", price: 15000, image: "/images/placeholder.png" }
        ];
    }

    if (products && products.length > 0) {
        relatedListEl.innerHTML = products.map(p => `
            <div class="product-card-mini">
                <img src="${p.image || '/images/placeholder.png'}" class="mini-img" alt="${p.name}">
                <h4 class="mini-title">${p.name}</h4>
                <span class="mini-price">${p.price.toLocaleString()} SYP</span>
            </div>
        `).join('');
    } else {
        relatedListEl.innerHTML = '<p class="empty-state">لا توجد منتجات مشابهة حالياً</p>';
    }
}

function getStarHTML(rating) {
    let stars = '';
    for(let i=0; i<5; i++) {
        stars += `<i class="fas fa-star" style="color: ${i < rating ? '#FFC312' : '#dfe6e9'}"></i>`;
    }
    return stars;
}