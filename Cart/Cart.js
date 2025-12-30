/************************************
 * Configuration
 ************************************/
const API_URL = "http://127.0.0.1:8000/api";
const token = localStorage.getItem("token");

if (!token) {
    alert("يرجى تسجيل الدخول أولاً");
    window.location.href = "/Auth/log_in.html";
}

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

let CURRENT_CART_ID = null;

/************************************
 * Get My Cart (by token)
 ************************************/
async function getUserCart() {
    try {
        const res = await fetch(`${API_URL}/cart`, {
            method: "GET",
            headers
        });

        if (!res.ok) throw new Error("فشل جلب السلة");

        const cart = await res.json();

        // حفظ ID السلة لاستخدامه في التحديث والحذف
        CURRENT_CART_ID = cart.id;

        // عرض العناصر
        renderCartItems(cart.cart_item || []);

        // تحديث الإجمالي
        updateTotal(cart.total_price || 0);

    } catch (error) {
        console.error(error);
        alert("حدث خطأ أثناء تحميل السلة");
    }
}

/************************************
 * Render Cart Items
 ************************************/
function renderCartItems(items) {
    const grid = document.querySelector(".products-grid");
    grid.innerHTML = "";

    if (!items || items.length === 0) {
        grid.innerHTML = `<div class="empty-cart">السلة فارغة، ابدأ التسوق الآن</div>`;
        document.getElementById("buyAllBtn").style.display = "none";
        document.getElementById("cartTotal").innerText = "0 ₪";
        return;
    }

    document.getElementById("buyAllBtn").style.display = "inline-flex";

    items.forEach(item => {
        grid.innerHTML += `
        <div class="product-card">
            <div class="product-details">
                <div class="info-top">
                    <h3 class="product-name">${item.product?.name ?? "منتج بدون اسم"}</h3>
                    <p class="product-price">السعر: <span>${item.unit_price} ₪</span></p>
                </div>

                <div class="actions-bottom">
                    <div class="quantity-control">
                        <button class="btn-qty" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <input type="number" readonly value="${item.quantity}">
                        <button class="btn-qty" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>

                    <button class="btn-remove" onclick="removeItem(${item.id})">
                        <i class="fas fa-trash-alt"></i> حذف من السلة
                    </button>
                </div>
            </div>
        </div>
        `;
    });
}

/************************************
 * Update Quantity
 ************************************/
async function updateQuantity(itemId, quantity) {
    if (!CURRENT_CART_ID || quantity < 1) return;

    try {
        const res = await fetch(
            `${API_URL}/carts/${CURRENT_CART_ID}/items/${itemId}`,
            {
                method: "PUT",
                headers,
                body: JSON.stringify({ quantity: Number(quantity) })
            }
        );

        if (!res.ok) throw new Error();

        // تحديث السلة بعد التعديل
        getUserCart();

    } catch (error) {
        console.error(error);
        alert("فشل تحديث الكمية");
    }
}

/************************************
 * Remove Item
 ************************************/
async function removeItem(itemId) {
    if (!CURRENT_CART_ID) return;

    if (!confirm("هل تريد حذف المنتج من السلة؟")) return;

    try {
        const res = await fetch(
            `${API_URL}/carts/${CURRENT_CART_ID}/items/${itemId}`,
            {
                method: "DELETE",
                headers
            }
        );

        if (!res.ok) throw new Error();

        // تحديث السلة بعد الحذف
        getUserCart();

    } catch (error) {
        console.error(error);
        alert("فشل حذف المنتج");
    }
}

/************************************
 * Update Total
 ************************************/
function updateTotal(total) {
    document.getElementById("cartTotal").innerText = `${total} ₪`;
}

/************************************
 * Checkout
 ************************************/
function checkoutAll() {
    alert("سيتم تحويلك إلى صفحة الدفع لاحقًا");
    // مستقبلاً: POST /orders
}

/************************************
 * Init
 ************************************/
document.addEventListener("DOMContentLoaded", () => {
    getUserCart();
}); 

