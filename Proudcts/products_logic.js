// products_logic.js

// 1. إعدادات الـ API
const API_URLS = {
    // تأكد أن هذا الرابط صحيح في الباك إند
    GET_PRODUCTS: '/api/products',      
    DELETE_PRODUCT: (id) => `/api/products/${id}`, 
};

const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

// Helper for Image URLs
const getImageUrl = (path) => {
    if (!path) return '/images/default.png'; 
    if (path.startsWith('http')) return path;
    return `/storage/${path}`;
};

let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // جلب التصنيف والصلاحية من الرابط
    const selectedCategory = urlParams.get('cat');
    const role = urlParams.get('role');
    const isAdmin = role === 'admin'; 

    const container = document.getElementById('productsContainer');
    const titleElement = document.getElementById('pageTitle');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    // عناوين الأقسام
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

    if (selectedCategory && categoryTitles[selectedCategory]) {
        titleElement.textContent = categoryTitles[selectedCategory];
        // تحديث زر العودة ليحتفظ بوضعية الأدمن
        const backLink = document.querySelector('.section-header a');
        if(backLink && isAdmin) {
            backLink.href = "/Home/admin_dashboard.html"; // العودة لداشبورد الأدمن
        }
    }

    // --- جلب البيانات ---
    async function fetchProducts() {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px;">جاري تحميل المنتجات...</div>';
        
        try {
            // بناء الرابط مع الفلترة
            let url = API_URLS.GET_PRODUCTS;
            if (selectedCategory) {
                // التأكد من علامة الاستفهام
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}category=${selectedCategory}`;
            }

            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) throw new Error('فشل في جلب البيانات');

            const jsonResponse = await response.json();
            const data = Array.isArray(jsonResponse) ? jsonResponse : (jsonResponse.data || []);

            allProducts = data.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                currency: "SYP", 
                img: getImageUrl(item.product_images?.[0]?.image || item.image), 
                category: item.category
            }));

            renderProducts(allProducts);

        } catch (error) {
            console.error(error);
            container.innerHTML = `<div class="no-results" style="color:red">حدث خطأ: ${error.message}</div>`;
        }
    }

    // --- العرض ---
    const renderProducts = (productsList) => {
        if (!productsList || productsList.length === 0) {
            container.innerHTML = `<div class="no-results">لا توجد منتجات متاحة في هذا القسم حالياً.</div>`;
            return;
        }
        container.innerHTML = productsList.map(product => createProductCard(product, isAdmin)).join('');
    };

    // --- البحث ---
    const handleSearch = () => {
        const term = searchInput.value.toLowerCase();
        const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
        renderProducts(filtered);
    };

    if(searchBtn) searchBtn.addEventListener('click', handleSearch);
    if(searchInput) searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    fetchProducts();
});

function createProductCard(product, isAdmin) {
    const priceFormatted = new Intl.NumberFormat('ar-SY').format(product.price);

    // أزرار الأدمن تظهر فقط إذا كان الرابط يحتوي على role=admin
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
            <button class="btn-cart" onclick="window.location.href='/Product/Product.html?id=${product.id}'">
                <i class="fas fa-eye"></i> عرض التفاصيل
            </button>
        </div>
    `;

    return `
    <div class="product-card">
        <a href="/Product/Product.html?id=${product.id}" class="card-link-wrapper">
            <div class="product-img-wrapper">
                <img src="${product.img}" alt="${product.name}" class="product-image" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-title" title="${product.name}">${product.name}</div>
                <div class="product-price">${priceFormatted} <small>${product.currency}</small></div>
            </div>
        </a>
        ${actionButtons}
    </div>
    `;
}

// Global Actions
window.goToEditPage = (id) => {
    // تعديل المسار ليكون صحيحاً (بدون مسافات وأخطاء إملائية)
    window.location.href = `/Market/Add_Product/add_Product.html?editId=${id}`;
};

window.deleteProduct = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) return;

    try {
        const response = await fetch(API_URLS.DELETE_PRODUCT(id), {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': getCsrfToken(),
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('تم الحذف بنجاح');
            location.reload();
        } else {
            alert('فشل الحذف، يرجى المحاولة لاحقاً');
        }
    } catch (error) {
        console.error(error);
        alert('حدث خطأ في النظام');
    }
};