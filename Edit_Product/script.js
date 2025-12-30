/* ضع هذا الكود في ملف JS الخاص بصفحة add_Proudct.html */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. التحقق من وجود editId في الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('editId');

    // إذا كان هناك ID، فهذا يعني أننا في وضع "التعديل" وليس "الإضافة"
    if (productId) {
        enableEditMode(productId);
    }
});

async function enableEditMode(id) {
    // تغيير عنوان الصفحة وزر الحفظ ليعرف المستخدم أنه يعدل
    const title = document.querySelector('h2') || document.getElementById('pageTitle'); // عدل الـ Selector حسب الـ HTML
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if(title) title.textContent = "تعديل المنتج";
    if(submitBtn) submitBtn.textContent = "حفظ التعديلات";

    try {
        // 2. جلب بيانات المنتج من السيرفر
        // ملاحظة: تأكد من أن رابط الـ API صحيح
        const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
             headers: {
                'Accept': 'application/json',
                // أضف التوكن إذا كان مطلوباً للعرض
                // 'Authorization': `Bearer ${localStorage.getItem("token")}` 
            }
        });

        if (!response.ok) throw new Error('فشل جلب بيانات المنتج');

        const result = await response.json();
        // قد تكون البيانات داخل result أو result.data حسب الـ API الخاص بك
        const product = result.data || result; 

        // 3. تعبئة الحقول بالبيانات (غير الـ IDs لتناسب الـ HTML الخاص بك)
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productCategory').value = product.category;
        /* ========== CATEGORIES DATA ========== */
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

  /* ========== POPULATE CATEGORIES ========== */
  const categorySelect = document.getElementById('category');
  
  // التأكد من أن العنصر موجود قبل محاولة إضافة الخيارات
  if (categorySelect) {
      Object.entries(categoryTitles).forEach(([key, label]) => {
          const option = document.createElement('option');
          option.value = key;       // القيمة التي ستُرسل للسيرفر (مثلاً: electronics)
          option.textContent = label; // النص الذي يظهر للمستخدم (مثلاً: الإلكترونيات)
          categorySelect.appendChild(option);
      });
  }
        // عرض الصورة الحالية إن وجدت
        const imgPreview = document.getElementById('imagePreview'); // افترض وجود عنصر لعرض الصورة
        if (imgPreview && product.image_url) {
            imgPreview.src = product.image_url;
            imgPreview.style.display = 'block';
        }

        // 4. تعديل سلوك زر الحفظ ليقوم بـ (UPDATE) بدلاً من (CREATE)
        setupUpdateAction(id, submitBtn);

    } catch (error) {
        console.error('Error fetching product:', error);
        alert('حدث خطأ أثناء تحميل بيانات المنتج للتعديل');
    }
}

function setupUpdateAction(id, btn) {
    // نقوم باستبدال دالة الإرسال لتكون PUT بدلاً من POST
    const form = document.querySelector('form'); // أو ID الفورم الخاص بك
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        // تجهيز البيانات (FormData يستخدم لرفع الصور والبيانات)
        const formData = new FormData(form);
        
        // لارافيل أحياناً تحتاج لتحديد الميثود داخل الـ Body عند استخدام FormData
        formData.append('_method', 'PUT'); 

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/products/${id}`, {
                method: 'POST', // نستخدم POST مع _method: PUT لأن المتصفحات لا تدعم PUT مع FormData مباشرة أحياناً
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    // لا تضع Content-Type عند استخدام FormData، المتصفح يضعه تلقائياً
                },
                body: formData
            });

            if (response.ok) {
                alert('تم تعديل المنتج بنجاح');
                window.location.href = '/Products.html?role=admin'; // العودة للمنتجات
            } else {
                const err = await response.json();
                alert('فشل التعديل: ' + (err.message || 'تأكد من البيانات'));
            }
        } catch (error) {
            console.error(error);
            alert('خطأ في الاتصال');
        }
    };
}