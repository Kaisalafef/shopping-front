// products_logic.js

/* =========================
   إعدادات API
========================= */
const API_BASE_URL = 'http://127.0.0.1:8000';

const API_URLS = {
    GET_ALL_PRODUCTS: `${API_BASE_URL}/api/products`,
    GET_PRODUCTS_BY_CATEGORY: (category) =>
        `${API_BASE_URL}/api/products/category/${category}`,
    DELETE_PRODUCT: (id) =>
        `${API_BASE_URL}/api/products/${id}`,
};


const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

/* =========================
   Helper للصور
========================= */
const getImageUrl = (path) => {
    if (!path) return '/images/default.png';
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000/storage/${path}`;
};

let allProducts = [];

/* =========================
   عند تحميل الصفحة
========================= */
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);

    const selectedCategory = urlParams.get('cat'); // clothes, food ...
    const role = urlParams.get('role');
    const isAdmin = role === 'admin';

    const container = document.getElementById('productsContainer');
    const titleElement = document.getElementById('pageTitle');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    /* =========================
       عناوين الأقسام
    ========================= */
    const categoryTitles = {
        electronics: 'الإلكترونيات',
        food: 'المواد الغذائية',
        meals: 'المأكولات',
        makeup: 'مستحضرات التجميل',
        men: 'أزياء رجالية',
        women: 'أزياء نسائية',
        perfume: 'العطور',
        cleaning: 'المنظفات',
        furniture: 'المفروشات',
        sweets: 'الحلويات',
        clothes: 'الملابس'
    };

    if (selectedCategory && categoryTitles[selectedCategory]) {
        titleElement.textContent = categoryTitles[selectedCategory];

        const backLink = document.querySelector('.section-header a');
        if (backLink && isAdmin) {
            backLink.href = '/Home/admin_dashboard.html';
        }
    }

    /* =========================
       جلب المنتجات
    ========================= */
    async function fetchProducts() {
        container.innerHTML =
            '<div style="grid-column:1/-1;text-align:center;padding:20px;">جاري تحميل المنتجات...</div>';

        try {
            const url = selectedCategory
                ? API_URLS.GET_PRODUCTS_BY_CATEGORY(selectedCategory)
                : API_URLS.GET_ALL_PRODUCTS;

            const response = await fetch(url, {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error('فشل في جلب المنتجات');
            }

            const result = await response.json();
            const data = result.data; // الوصول للمصفوفة الفعلية


            allProducts = data.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                currency: 'SYP',
                img: item.image_url,

                category: item.category,
            }));

            renderProducts(allProducts);
        } catch (error) {
            console.error(error);
            container.innerHTML = `
                <div class="no-results" style="color:red">
                    حدث خطأ أثناء جلب البيانات
                </div>`;
        }
    }

    /* =========================
       عرض المنتجات
    ========================= */
    const renderProducts = (products) => {
        if (!products || products.length === 0) {
            container.innerHTML =
                '<div class="no-results">لا توجد منتجات في هذا القسم.</div>';
            return;
        }

        container.innerHTML = products
            .map((product) => createProductCard(product, isAdmin))
            .join('');
    };

    /* =========================
       البحث
    ========================= */
    const handleSearch = () => {
        const term = searchInput.value.trim().toLowerCase();
        const filtered = allProducts.filter((p) =>
            p.name.toLowerCase().includes(term)
        );
        renderProducts(filtered);
    };

    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput)
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
        });

    fetchProducts();
});

/* =========================
   بطاقة المنتج
========================= */
function createProductCard(product, isAdmin) {
    const priceFormatted = new Intl.NumberFormat('ar-SY').format(product.price);

    const actionButtons = isAdmin
        ? `
        <div class="admin-actions">
            <button class="btn-edit" onclick="goToEditPage(${product.id})">
                <i class="fas fa-edit"></i> تعديل
            </button>
            <button class="btn-delete" onclick="deleteProduct(${product.id})">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
    `
        : `
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
                <img src="${product.img}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-title">${product.name}</div>
                <div class="product-price">
                    ${priceFormatted} <small>${product.currency}</small>
                </div>
            </div>
        </a>
        ${actionButtons}
    </div>
    `;
}

/* =========================
   إجراءات عامة
========================= */
window.goToEditPage = (id) => {
    window.location.href = `/Market/Add_Product/add_Product.html?editId=${id}`;
};

window.deleteProduct = async (id) => {
    if (!confirm('هل أنت متأكد من حذف المنتج؟')) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            }

        });

        if (response.ok) {
            alert('تم حذف المنتج بنجاح');
            location.reload();
        } else {
            alert('فشل الحذف');
        }
    } catch (error) {
        console.error(error);
        alert('حدث خطأ في النظام');
    }
};
