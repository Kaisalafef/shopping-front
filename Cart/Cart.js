/************************************
 * Configuration
 ************************************/
const API_URL = "http://127.0.0.1:8000/api";
const token = localStorage.getItem("token");

if (!token) {
    showToast("يرجى تسجيل الدخول أولاً","warning");
    window.location.href = "/Auth/log_in.html";
}

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

let CURRENT_CART_ID = null;

  /* ========== TOAST ========== */
  
  // 1. دالة عرض الإشعارات (Toast)
  function showToast(msg, type = "success") {
    let toastBox = document.getElementById("toast-box");

    // إنشاء العنصر
    let toast = document.createElement("div");
    toast.classList.add("toast", type);

    // تحديد الأيقونة بناءً على النوع
    let icon = "";
    if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === "error") icon = '<i class="fa-solid fa-circle-xmark"></i>';
    if (type === "warning")
      icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

    toast.innerHTML = `${icon} ${msg}`;

    // إضافته للصفحة
    toastBox.appendChild(toast);

    // حذفه بعد 4 ثواني
    setTimeout(() => {
      toast.classList.add("hide"); // تشغيل انيميشن الخروج
      toast.addEventListener("animationend", () => {
        toast.remove(); // الحذف الفعلي من الـ DOM
      });
    }, 4000);
  }
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
        showToast("حدث خطأ أثناء تحميل السلة",'error');
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
        showToast("فشل تحديث الكمية","error");
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
        showToast("فشل حذف المنتج","error");
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
    const modal = document.getElementById("checkoutModal");
    if (modal) {
        modal.classList.add("active");
        // مسح الحقل عند الفتح
        document.getElementById("orderAddress").value = "";
    }
}
// 2. إغلاق النافذة
function closeCheckoutModal() {
    const modal = document.getElementById("checkoutModal");
    if (modal) {
        modal.classList.remove("active");
    }
}

// إغلاق النافذة عند الضغط خارج المربع
window.onclick = function(event) {
    const modal = document.getElementById("checkoutModal");
    if (event.target === modal) {
        closeCheckoutModal();
    }
}

// 3. إرسال الطلب للسيرفر
async function submitOrder(event) {
    event.preventDefault(); // منع إعادة تحميل الصفحة
    
    const address = document.getElementById("orderAddress").value;
    const submitBtn = document.querySelector(".btn-confirm-order");
    
    // التحقق من أن العنوان ليس فارغاً
    if (!address.trim()) {
        showToast("يرجى إدخال العنوان","warning");
        return;
    }

    // تغيير نص الزر ليشعر المستخدم بالتحميل
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    submitBtn.disabled = true;

    try {
        // ملاحظة: تأكد من أن الـ Endpoint صحيح في الباك إند
        // عادة يكون /orders ويأخذ العنوان والجسم
        const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                address: address,
                // cart_id: CURRENT_CART_ID // في بعض الأنظمة قد تحتاج إرسال رقم السلة، وفي أنظمة أخرى يأخذها تلقائياً من المستخدم
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "فشل إنشاء الطلب");
        }

        // نجاح العملية
        showToast("تم استلام طلبك بنجاح! سيتم التواصل معك قريباً.","success");
        closeCheckoutModal();
        
        // إعادة تحميل السلة (التي يجب أن تكون فارغة الآن) أو التوجيه لصفحة الطلبات
        getUserCart(); 
        // window.location.href = "/Orders/Orders.html"; // خيار: توجيه المستخدم لصفحة طلباته

    } catch (error) {
        console.error(error);
        showToast(error.message || "حدث خطأ أثناء إرسال الطلب","error");
    } finally {
        // إعادة الزر لوضعه الطبيعي
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}
/************************************
 * Init
 ************************************/
document.addEventListener("DOMContentLoaded", () => {
    getUserCart();
}); 

