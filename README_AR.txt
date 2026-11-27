GREEN BAHRI — GALLERY V7
========================

محتويات الحزمة:
- gallery.html       صفحة المعرض كاملة.
- css/gallery.css    تنسيقات الصفحة والهوية البصرية.
- js/gallery.js      صور الهيرو، فصول الشجرة، الفلاتر، وعارض الصور.
- assets/            ضع هنا أيقونة/صور إضافية عند الحاجة.

مهم قبل الرفع:
هذه الصفحة تعتمد على الصور الموجودة أصلاً في مشروع Green Bahri بهذه المسارات:
assets/gallery/g1.webp
assets/gallery/g4.webp
assets/gallery/about.webp

لذلك انسخ مجلد assets/gallery الأصلي من مشروعك إلى جذر المشروع الذي ستضع فيه gallery.html.
لا تحذف الصور الأصلية ولا تستبدلها بصور مولدة؛ المعرض يعرض الصور الحقيقية المعتمدة.

التشغيل محلياً:
1) فك ضغط ZIP داخل نسخة من مشروعك أو انسخ الملفات إلى المشروع.
2) تأكد أن مجلد assets/gallery موجود وفيه الصور المذكورة.
3) افتح Terminal في مجلد المشروع وشغّل:
   python3 -m http.server 8000
4) افتح:
   http://localhost:8000/gallery.html

الرفع إلى GitHub (فرع منفصل):
   git switch main
   git pull origin main
   git switch -c feat/gallery-v7
   git add gallery.html css/gallery.css js/gallery.js
   git commit -m "Build Green Bahri gallery V7"
   git push -u origin feat/gallery-v7
ثم افتح GitHub وأنشئ Pull Request إلى main.

ملاحظة تكامل:
هذه نسخة صفحة مستقلة. في موقعك الحالي قد تحتاج المحافظة على روابط ملفات الموقع المشتركة (style.css وmain.js وdata.js) والهيدر والفوتر الحاليين. لا تستبدل ملفات المشروع المشتركة. راجعها مع Frontend Lead قبل الدمج.
