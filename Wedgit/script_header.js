document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. تعريف العناصر والمتغيرات
    // ==========================================
    const searchInput = document.getElementById("globalSearchInput");
    const searchResults = document.getElementById("searchResults");
    
    // رابط الـ API (تأكد من مطابقته للسيرفر لديك)
    const API_URL = "http://127.0.0.1:8000/api/products"; 

    // متغير لتخزين تأخير الكتابة (Debounce) لعدم إرهاق السيرفر
    let debounceTimer;

    // ==========================================
    // 2. دوال المساعدة
    // ==========================================
    
    // تنسيق مسار الصورة
    const getImageUrl = (path) => {
        if (!path) return '/images/default-product.png'; 
        if (path.startsWith('http')) return path;
        return `http://127.0.0.1:8000/storage/${path}`;
    };

    // تنسيق العملة
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US').format(price) + ' SYP';
    };

    // ==========================================
    // 3. منطق البحث
    // ==========================================
    
    if (searchInput && searchResults) {
        
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim();

            // إخفاء النتائج إذا كان النص فارغاً
            if (query.length === 0) {
                searchResults.style.display = "none";
                return;
            }

            // إيقاف المؤقت السابق إذا كتب المستخدم حرفاً جديداً بسرعة
            clearTimeout(debounceTimer);

            // بدء مؤقت جديد (ينتظر 300 ميلي ثانية بعد التوقف عن الكتابة)
            debounceTimer = setTimeout(() => {
                fetchProducts(query);
            }, 300);
        });

        // إخفاء القائمة عند النقر خارجها
        document.addEventListener("click", (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = "none";
            }
        });
    }

    // ==========================================
    // 4. جلب البيانات وعرضها
    // ==========================================

    async function fetchProducts(query) {
        try {
            // عرض لودينج بسيط
            searchResults.style.display = "block";
            searchResults.innerHTML = '<div class="no-results">جاري البحث...</div>';

            // جلب كل المنتجات (أو استخدم ?search=query لو كان الباك إند يدعم ذلك)
            // هنا نجلب الكل ثم نفلتر في المتصفح لضمان عملها
            const response = await fetch(API_URL, {
                headers: { "Accept": "application/json" }
            });

            if (!response.ok) throw new Error("فشل الاتصال");

            const products = await response.json();

            // فلترة المنتجات حسب الاسم
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(query.toLowerCase())
            );

            renderResults(filtered);

        } catch (error) {
            console.error(error);
            searchResults.innerHTML = '<div class="no-results">حدث خطأ في البحث</div>';
        }
    }

    function renderResults(products) {
        searchResults.innerHTML = ""; // تفريغ النتائج السابقة

        if (products.length === 0) {
            searchResults.innerHTML = '<div class="no-results">لا توجد منتجات مطابقة</div>';
            return;
        }

        products.forEach(product => {
            // إنشاء عنصر الرابط
            const a = document.createElement("a");
            a.className = "search-item";
            
            // **هنا التوجيه الصحيح لصفحة المنتج**
            // يتم إرسال الـ ID في الرابط ليقرأه script_P.js
            a.href = `/Product/Product.html?id=${product.id}`; 
            
            // تحديد الصورة (الأولى أو الافتراضية)
            let imgPath = "";
            if (product.product_images && product.product_images.length > 0) {
                imgPath = product.product_images[0].image;
            } else if (product.image) {
                imgPath = product.image;
            }
            
            // بناء محتوى العنصر
            a.innerHTML = `
                <img src="${getImageUrl(imgPath)}" alt="${product.name}">
                <div class="search-item-info">
                    <span class="search-item-title">${product.name}</span>
                    <span class="search-item-price">${formatPrice(product.price)}</span>
                </div>
            `;

            searchResults.appendChild(a);
        });
    }

    let t1 = gsap.timeline();
t1.from(".main-header ", {
  y: -100,

  opacity: 0,
  duration: 2,
  ease: "power2.out",
});
    // ==========================================
    // 5. كود القائمة الجانبية (Mobile Menu) - الكود القديم
    // ==========================================
    const profileBtn = document.getElementById("profileBtn");
    const desktopDropdown = document.getElementById("desktopDropdown");
    const mobileMenu = document.getElementById("mobileMenu");

    if (profileBtn && desktopDropdown && mobileMenu) {
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (window.innerWidth > 768) {
                const isVisible = desktopDropdown.style.display === "block";
                desktopDropdown.style.display = isVisible ? "none" : "block";
            } else {
                mobileMenu.classList.toggle("active");
            }
        });

        document.addEventListener("click", (e) => {
            if (!profileBtn.contains(e.target) && !desktopDropdown.contains(e.target)) {
                desktopDropdown.style.display = "none";
            }
            if (!mobileMenu.contains(e.target) && !profileBtn.contains(e.target)) {
                mobileMenu.classList.remove("active");
            }
        });
    }
    
    // تسجيل الخروج
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            const token = localStorage.getItem("token");
            fetch("http://127.0.0.1:8000/api/logout", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }).finally(() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/Auth/Log_in.html";
            });
        });
    }
});