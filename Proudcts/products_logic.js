// 1. Configuration & Data
const STORAGE_KEY = 'marketProducts';
const defaultProducts = [
    { id: "1", name: "سماعات بلوتوث", price: "50", currency: "ر.س", img: "/images/ELC.png", category: "electronics" },
    { id: "2", name: "ساعة ذكية", price: "120", currency: "ر.س", img: "/images/ELC.png", category: "electronics" },
    { id: "3", name: "أرز بسمتي 5كيلو", price: "45", currency: "ر.س", img: "/images/FOOD.png", category: "food" },
    { id: "4", name: "زيت طهي", price: "20", currency: "ر.س", img: "/images/FOOD.png", category: "food" },
    { id: "5", name: "أحمر شفاه", price: "35", currency: "ر.س", img: "/images/MAKEUP.png", category: "makeup" },
    { id: "6", name: "تيشيرت رجالي", price: "60", currency: "ر.س", img: "/images/CLOS.png", category: "men" },
    { id: "7", name: "فستان صيفي", price: "150", currency: "ر.س", img: "/images/CLOSW.jpg", category: "women" },
];

const categoryTitles = {
    'electronics': 'الإلكترونيات',
    'food': 'المواد الغذائية',
    'meals': 'المأكولات',
    'makeup': 'مستحضرات التجميل',
    'men': 'أزياء رجالية',
    'women': 'أزياء نسائية',
    'perfume': 'العطور',
    'cleaning': 'المنظفات',
    'furniture': 'المفروشات',
    'sweets': 'الحلويات'
};

// 2. Data Access Layer
function getProducts() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProducts));
        return defaultProducts;
    }
    return JSON.parse(stored);
}

// 3. Core Logic
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategory = urlParams.get('cat');
    const isAdmin = urlParams.get('role') === 'admin';
    
    const container = document.getElementById('productsContainer');
    const titleElement = document.getElementById('pageTitle');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    let allProducts = getProducts();

    // Set Title
    if (selectedCategory && categoryTitles[selectedCategory]) {
        titleElement.textContent = categoryTitles[selectedCategory];
    }

    // Function to render filtered items
    const render = (filterText = '') => {
        let filtered = allProducts;

        // Apply Category Filter
        if (selectedCategory && selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        // Apply Search Filter
        if (filterText) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(filterText.toLowerCase())
            );
        }

        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-results">لا توجد منتجات تطابق بحثك.</div>`;
            return;
        }

        container.innerHTML = filtered.map(product => createProductCard(product, isAdmin)).join('');
    };

    // Initial Render
    render();

    // Search Event
    searchBtn.addEventListener('click', () => render(searchInput.value));
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') render(searchInput.value);
    });
});
function createProductCard(product, isAdmin) {
    // أزرار التحكم للأدمن أو للمستخدم العادي
    const actionButtons = isAdmin ? `
        <div class="admin-actions">
            <button class="btn-edit" onclick="goToEditPage('${product.id}')">
                <i class="fas fa-edit"></i> تعديل
            </button>
            <button class="btn-delete" onclick="deleteProduct('${product.id}')">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
    ` : `
        <div class="product-actions">
            <button class="btn-cart" onclick="addToCart('${product.id}')">
                <i class="fas fa-cart-plus"></i> أضف للسلة
            </button>
        </div>
    `;

    // جعل الكارت قابلاً للضغط للانتقال لصفحة المنتج
    return `
    <div class="product-card">
        <a href="/Product/Product.html?id=${product.id}" style="text-decoration:none; color:inherit;">
            <div class="product-img-wrapper">
                <img src="${product.img || '/images/logo.png'}" alt="${product.name}" class="product-image">
            </div>
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-price">${product.price} <small>${product.currency || 'ر.س'}</small></div>
            </div>
        </a>
        ${actionButtons}
    </div>
    `;
}

// 5. Global Actions
window.goToEditPage = (id) => {
    window.location.href = `/Market/Add Proudct/add_Proudct.html?editId=${id}`;
};

window.deleteProduct = (id) => {
    if(confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
        let products = getProducts().filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        location.reload();
    }
};

window.addToCart = (id) => {
    alert(`تم إضافة المنتج ${id} إلى السلة!`);
    // Here you would typically update a cart localStorage object
};