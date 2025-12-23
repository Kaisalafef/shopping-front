/************************************
 *  Cart Configuration
 ************************************/
const API_URL = "http://127.0.0.1:8000/api";
const token = localStorage.getItem("token");

if (!token) {
    alert("يرجى تسجيل الدخول أولاً");
    window.location.href = "/login.html";
}

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

let CURRENT_CART_ID = null;

/************************************
 *  Get My Cart (From Token)
 ************************************/
async function getUserCart() {
    try {
        const res = await fetch(`${API_URL}/cart`, {
            method: "GET",
            headers
        });

        if (!res.ok) throw new Error("فشل جلب السلة");

        const cart = await res.json();
        CURRENT_CART_ID = cart.id;

        renderCartItems(cart.cartItem || [], cart.id);
    } catch (error) {
        console.error(error);
        alert("حدث خطأ أثناء تحميل السلة");
    }
}

/************************************
 *  Render Cart Items
 ************************************/
function renderCartItems(items, cartId) {
    const grid = document.querySelector(".products-grid");
    grid.innerHTML = "";

    if (!items || items.length === 0) {
        grid.innerHTML = `<p class="empty-cart">السلة فارغة</p>`;
        document.getElementById("buyAllBtn").style.display = "none";
        return;
    }

    document.getElementById("buyAllBtn").style.display = "inline-flex";

    items.forEach(item => {
        grid.innerHTML += `
        <div class="product-card">
            <img src="${item.product?.image ?? '/images/default.png'}" alt="">
            <h3>${item.product?.name}</h3>
            <p>السعر: ${item.unit_price} ₪</p>

            <div class="quantity-control">
                <input 
                    type="number" 
                    min="1" 
                    value="${item.quantity}"
                    onchange="updateQuantity(${cartId}, ${item.id}, this.value)"
                >
            </div>

            <button class="btn-remove"
                onclick="removeItem(${cartId}, ${item.id})">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
        `;
    });

    getTotal();
}

/************************************
 *  Update Item Quantity
 ************************************/
async function updateQuantity(cartId, itemId, quantity) {
    if (quantity < 1) return;

    try {
        const res = await fetch(
            `${API_URL}/carts/${cartId}/items/${itemId}`,
            {
                method: "PUT",
                headers,
                body: JSON.stringify({ quantity: parseInt(quantity) })
            }
        );

        if (!res.ok) throw new Error();

        getTotal();
    } catch (error) {
        console.error(error);
        alert("فشل تحديث الكمية");
    }
}

/************************************
 *  Remove Item From Cart
 ************************************/
async function removeItem(cartId, itemId) {
    if (!confirm("هل تريد حذف المنتج من السلة؟")) return;

    try {
        const res = await fetch(
            `${API_URL}/carts/${cartId}/items/${itemId}`,
            {
                method: "DELETE",
                headers
            }
        );

        if (!res.ok) throw new Error();

        getUserCart();
    } catch (error) {
        console.error(error);
        alert("فشل حذف المنتج");
    }
}

/************************************
 *  Calculate Total Price
 ************************************/
async function getTotal() {
    try {
        const res = await fetch(`${API_URL}/cart/total`, {
            headers
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        document.getElementById("cartTotal").innerText =
            `${data.total_price} ₪`;
    } catch (error) {
        console.error(error);
    }
}

/************************************
 *  Checkout All Items
 ************************************/
function checkoutAll() {
    alert("سيتم تحويلك إلى صفحة الدفع");
    // لاحقاً:
    // POST /orders
}

/************************************
 *  Init
 ************************************/
document.addEventListener("DOMContentLoaded", () => {
    getUserCart();
});
