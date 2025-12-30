/* ضع هذا الكود في ملف JS الخاص بصفحة add_Proudct.html / Edit_Product.html */

// 1. تعريف قائمة الفئات (Categories)
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

document.addEventListener('DOMContentLoaded', async () => {
    // 2. تحميل الفئات داخل القائمة المنسدلة فور تحميل الصفحة
    populateCategories();

    // 3. التحقق من وجود editId في الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('editId');

    // إذا كان هناك ID، فهذا يعني أننا في وضع "التعديل"
    if (productId) {
        enableEditMode(productId);
    } else {
        // إضافة مستمع لزر الحفظ في حالة الإضافة الجديدة (اختياري حسب تصميمك)
        const saveBtn = document.getElementById('saveBtn');
        if(saveBtn) {
            saveBtn.addEventListener('click', () => {
                // منطق الإضافة الجديدة هنا
                alert('وضع الإضافة الجديدة'); 
            });
        }
    }
});

// دالة لتعبئة الـ Select بالخيارات
function populateCategories() {
    const categorySelect = document.getElementById('category');
    
    // التحقق من وجود العنصر لتجنب الأخطاء
    if (!categorySelect) return;

    // المرور على كل عنصر في القائمة وإنشاء Option له
    for (const [key, title] of Object.entries(categoryTitles)) {
        const option = document.createElement('option');
        option.value = key;       // القيمة التي ستخزن في قاعدة البيانات (مثل electronics)
        option.textContent = title; // النص الذي يظهر للمستخدم (مثل الإلكترونيات)
        categorySelect.appendChild(option);
    }
}

async function enableEditMode(id) {
    // تغيير عنوان الصفحة وزر الحفظ
    const title = document.querySelector('h1') || document.getElementById('pageTitle');
    
    // ملاحظة: قمت بتحديث هذا السطر ليتوافق مع الـ HTML الخاص بك (id="saveBtn")
    const submitBtn = document.getElementById('saveBtn'); 

    if (title) title.textContent = "تعديل المنتج";
    if (submitBtn) submitBtn.textContent = "حفظ التعديلات";

    try {
        // جلب بيانات المنتج من السيرفر
        const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
            headers: {
                'Accept': 'application/json',
                // 'Authorization': `Bearer ${localStorage.getItem("token")}` 
            }
        });

        if (!response.ok) throw new Error('فشل جلب بيانات المنتج');

        const result = await response.json();
        const product = result.data || result;

        // تعبئة الحقول بالبيانات
        const titleInput = document.getElementById('title');
        if (titleInput) titleInput.value = product.name;

        const priceInput = document.getElementById('price');
        if (priceInput) priceInput.value = product.price;

        const descInput = document.getElementById('description');
        if (descInput) descInput.value = product.description;

        // تحديد الفئة المختارة (سيعمل الآن لأن الخيارات تم تحميلها بواسطة populateCategories)
        const categorySelect = document.getElementById('category');
        if (categorySelect) categorySelect.value = product.category;

        const brandInput = document.getElementById('brand');
        if (brandInput) brandInput.value = product.brand;

        // تفعيل زر الحفظ للتعديل
        if(submitBtn) {
            setupUpdateAction(id, submitBtn);
        }

    } catch (error) {
        console.error('Error fetching product:', error);
        alert('حدث خطأ أثناء تحميل بيانات المنتج للتعديل');
    }
}

function setupUpdateAction(id, btn) {
    // إزالة أي أحداث سابقة لتجنب التكرار
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        formData.append('_method', 'PUT');

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData
            });

            if (response.ok) {
                // إظهار التنبيه (Toast)
                const toast = document.getElementById('toast');
                toast.textContent = "تم تعديل المنتج بنجاح";
                toast.classList.remove('hidden');
                setTimeout(() => toast.classList.add('hidden'), 3000);
                
                // إعادة التوجيه بعد ثانية
                setTimeout(() => {
                    window.location.href = '/Proudcts/Products.html?role=admin';
                }, 1000);
            } else {
                const err = await response.json();
                alert('فشل التعديل: ' + (err.message || 'تأكد من البيانات'));
            }
        } catch (error) {
            console.error(error);
            alert('خطأ في الاتصال');
        }
    });
}