document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const API_BASE_URL = "http://127.0.0.1:8000/api";

    // Redirect if not logged in
   

    const tableBody = document.getElementById("orders-table-body");
    const loadingSpinner = document.getElementById("loading-spinner");
    const noOrdersMsg = document.getElementById("no-orders-msg");
    const filterBtns = document.querySelectorAll(".filter-btn");

    let allOrders = []; // Store fetched orders here

    /* ===============================
       1. FETCH ORDERS
    ================================ */
    async function fetchOrders() {
        loadingSpinner.style.display = "block";
        tableBody.innerHTML = "";
        noOrdersMsg.style.display = "none";

        try {
            // Fetching all orders (Assuming Admin Endpoint)
            const res = await fetch(`${API_BASE_URL}/orders`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Failed to fetch");

            const result = await res.json();
            // Handle both structure types: { data: [...] } or just [...]
            allOrders = result.data ? result.data : result;

            // Update Stats
            updateStats(allOrders);

            // Render All Initially
            renderOrders(allOrders);

        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">خطأ في تحميل البيانات</td></tr>`;
        } finally {
            loadingSpinner.style.display = "none";
        }
    }

    /* ===============================
       2. RENDER ORDERS
    ================================ */
    function renderOrders(orders) {
        tableBody.innerHTML = "";

        if (orders.length === 0) {
            noOrdersMsg.style.display = "block";
            return;
        }

        noOrdersMsg.style.display = "none";

        orders.forEach(order => {
            const tr = document.createElement("tr");

            // Define Buttons based on Status
            let actionButtons = `
                <button class="action-btn btn-view" onclick="openOrderModal(${order.id})" title="عرض التفاصيل">
                    <i class="fas fa-eye"></i>
                </button>
            `;

            // Only show Accept/Refuse if status is pending
            if (order.status === 'pending') {
                actionButtons += `
                    <button class="action-btn btn-accept" onclick="updateOrderStatus(${order.id}, 'processing')" title="قبول الطلب">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn btn-refuse" onclick="updateOrderStatus(${order.id}, 'cancelled')" title="رفض الطلب">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }

            tr.innerHTML = `
                <td><strong>#${order.id}</strong></td>
                <td>${order.user?.name || "زائر"}</td>
                <td>${order.shipping_address || "غير محدد"}</td>
                <td>${formatDate(order.created_at)}</td>
                <td><strong>${Number(order.total_price).toLocaleString()} ل.س</strong></td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${actionButtons}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    /* ===============================
       3. UPDATE STATUS (API)
    ================================ */
    window.updateOrderStatus = async function (orderId, newStatus) {
        if (!confirm(`هل أنت متأكد أنك تريد تغيير حالة الطلب إلى "${translateStatus(newStatus)}"?`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                method: "PUT", // Or POST depending on your Laravel Route
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                // Update local data to reflect change immediately
                const orderIndex = allOrders.findIndex(o => o.id === orderId);
                if (orderIndex > -1) {
                    allOrders[orderIndex].status = newStatus;
                    
                    // Re-render based on current active filter
                    const activeFilter = document.querySelector(".filter-btn.active").dataset.filter;
                    filterOrders(activeFilter);
                    updateStats(allOrders);
                }
                alert("تم تحديث الحالة بنجاح");
            } else {
                alert("فشل تحديث الحالة");
            }
        } catch (error) {
            console.error(error);
            alert("حدث خطأ في الاتصال");
        }
    };

    /* ===============================
       4. MODAL LOGIC
    ================================ */
    const modal = document.getElementById("order-modal");
    const closeModalBtn = document.getElementById("closeModalBtn");

    window.openOrderModal = function (orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) return;

        // Populate Modal Data
        document.getElementById("modal-order-id").innerText = `تفاصيل الطلب #${order.id}`;
        document.getElementById("modal-customer-name").innerText = order.user?.name || "غير معروف";
        document.getElementById("modal-customer-phone").innerText = order.user?.profile?.phone || "غير متوفر";
        document.getElementById("modal-address").innerText = order.shipping_address;
        document.getElementById("modal-total-price").innerText = Number(order.total_price).toLocaleString() + " ل.س";

        // Render Items
        const itemsContainer = document.getElementById("modal-items-list");
        itemsContainer.innerHTML = "";
        
        if (order.order_item && order.order_item.length > 0) {
            order.order_item.forEach(item => {
                // Check if product exists, otherwise handle gracefully
                const prodName = item.product ? item.product.name : "منتج محذوف";
                const prodImg = item.product ? item.product.image_url : "/images/no-image.png";
                
                itemsContainer.innerHTML += `
                    <div class="order-item-card">
                        <img src="${prodImg}" alt="${prodName}" class="item-img" onerror="this.src='/images/logo.webp'">
                        <div class="item-details">
                            <h5>${prodName}</h5>
                            <div class="item-meta">
                                الكمية: <strong>${item.quantity}</strong> | السعر: ${Number(item.price).toLocaleString()}
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            itemsContainer.innerHTML = "<p>لا توجد منتجات في هذا الطلب.</p>";
        }

        // Add Actions to Modal Footer if Pending
        const modalActions = document.getElementById("modal-actions-container");
        modalActions.innerHTML = "";
        if (order.status === 'pending') {
            modalActions.innerHTML = `
                <button class="action-btn btn-accept" onclick="updateOrderStatus(${order.id}, 'processing'); closeModal();" style="width:auto; padding:0 15px;">
                    <i class="fas fa-check"></i> قبول
                </button>
                <button class="action-btn btn-refuse" onclick="updateOrderStatus(${order.id}, 'cancelled'); closeModal();" style="width:auto; padding:0 15px;">
                    <i class="fas fa-times"></i> رفض
                </button>
            `;
        }

        // Show Modal
        modal.classList.add("active");
    };

    function closeModal() {
        modal.classList.remove("active");
    }

    closeModalBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    /* ===============================
       5. UTILITIES & FILTERS
    ================================ */
    
    // Filters Click Event
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove("active"));
            // Add to clicked
            btn.classList.add("active");
            
            filterOrders(btn.dataset.filter);
        });
    });

    function filterOrders(status) {
        if (status === "all") {
            renderOrders(allOrders);
        } else {
            const filtered = allOrders.filter(o => o.status === status);
            renderOrders(filtered);
        }
    }

    function updateStats(orders) {
        document.getElementById("total-orders-count").innerText = orders.length;
        const pending = orders.filter(o => o.status === "pending").length;
        document.getElementById("pending-orders-count").innerText = pending;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    }

    function getStatusBadge(status) {
        const text = translateStatus(status);
        const className = `status-${status}`;
        return `<span class="status-badge ${className}">${text}</span>`;
    }

    function translateStatus(status) {
        const map = {
            'pending': 'قيد الانتظار',
            'processing': 'جاري التحضير',
            'completed': 'مكتمل',
            'delivered': 'تم التوصيل',
            'cancelled': 'ملغى',
            'refused': 'مرفوض'
        };
        return map[status] || status;
    }

    // Init
    fetchOrders();
});