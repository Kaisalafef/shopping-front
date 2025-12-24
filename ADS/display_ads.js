document.addEventListener("DOMContentLoaded", async () => {

    const displayArea = document.getElementById("adDisplayArea");

    if (!displayArea) {
        console.error("عنصر adDisplayArea غير موجود في الصفحة");
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:8000/api/ads", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("فشل جلب الإعلانات");
        }

        const result = await response.json();

        if (!result.ads || result.ads.length === 0) {
            displayArea.innerHTML = `
                <h3 style="text-align:center; color:#777;">
                    لا يوجد إعلان حالياً
                </h3>
            `;
            return;
        }

        // عرض أول إعلان مفعل
        const ad = result.ads[0];

        displayArea.innerHTML = `
            <div class="ad-banner ad-with-image"
                 style="background-image: url('http://127.0.0.1:8000/storage/${ad.image}')">

                <div class="ad-overlay"></div>

                <div class="ad-content">
                    <h3>${ad.title ? ad.title : ''}</h3>
                </div>
            </div>
        `;

    } catch (error) {
        console.error(error);
        displayArea.innerHTML = `
            <p style="color:red; text-align:center;">
                حدث خطأ أثناء تحميل الإعلان
            </p>
        `;
    }
});
