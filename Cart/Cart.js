
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

  
  
  
  function showToast(msg, type = "success") {
    let toastBox = document.getElementById("toast-box");

    
    let toast = document.createElement("div");
    toast.classList.add("toast", type);

    
    let icon = "";
    if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === "error") icon = '<i class="fa-solid fa-circle-xmark"></i>';
    if (type === "warning")
      icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

    toast.innerHTML = `${icon} ${msg}`;

    
    toastBox.appendChild(toast);

    
    setTimeout(() => {
      toast.classList.add("hide"); 
      toast.addEventListener("animationend", () => {
        toast.remove(); 
      });
    }, 4000);
  }

async function getUserCart() {
    try {
        const res = await fetch(`${API_URL}/cart`, {
            method: "GET",
            headers
        });

        if (!res.ok) throw new Error("فشل جلب السلة");

        const cart = await res.json();

        
        CURRENT_CART_ID = cart.id;

        
        renderCartItems(cart.cart_item || []);

        
        updateTotal(cart.total_price || 0);

    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تحميل السلة",'error');
    }
}


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

        
        getUserCart();

    } catch (error) {
        console.error(error);
        showToast("فشل تحديث الكمية","error");
    }
}


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

        
        getUserCart();

    } catch (error) {
        console.error(error);
        showToast("فشل حذف المنتج","error");
    }
}


function updateTotal(total) {
    document.getElementById("cartTotal").innerText = `${total} ₪`;
}


function checkoutAll() {
    const modal = document.getElementById("checkoutModal");
    if (modal) {
        modal.classList.add("active");
        
        document.getElementById("orderAddress").value = "";
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById("checkoutModal");
    if (modal) {
        modal.classList.remove("active");
    }
}


window.onclick = function(event) {
    const modal = document.getElementById("checkoutModal");
    if (event.target === modal) {
        closeCheckoutModal();
    }
}


async function submitOrder(event) {
    event.preventDefault(); 
    
    const address = document.getElementById("orderAddress").value;
    const submitBtn = document.querySelector(".btn-confirm-order");
    
    
    if (!address.trim()) {
        showToast("يرجى إدخال العنوان","warning");
        return;
    }

    
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';
    submitBtn.disabled = true;

    try {
        
        
        const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                shipping_address: address,
                
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "فشل إنشاء الطلب");
        }

        
        showToast("تم استلام طلبك بنجاح! سيتم التواصل معك قريباً.","success");
        closeCheckoutModal();
        
        
        getUserCart(); 
        

    } catch (error) {
        console.error(error);
        showToast(error.message || "حدث خطأ أثناء إرسال الطلب","error");
    } finally {
        
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    getUserCart();
});
