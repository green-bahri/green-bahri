/* بيانات الموقع — عدّل هنا فقط. القيم الحالية أمثلة تجريبية. */
window.GB = {
  /* قاعدة بيانات دوري الكليات (مشروع Supabase منفصل عن مشروع الخريطة).
     المفتاح العام (publishable) مصمم يظهر في الكود، والحماية من سياسات RLS في القاعدة. */
  supabase: {
    url: "https://upxaghqmrdpxbfdsdpri.supabase.co",
    key: "sb_publishable_s2VnDDA68dKbQCsPNXFosA__bNssB2Z",
  },

  /* رقم واتساب المبادرة بالصيغة الدولية بدون + أو أصفار (0115937058 ← 249115937058) */
  whatsapp: "249115937058",
  whatsappLabel: "0115937058",

  /* أنواع الأشجار المتاحة (من ملصق الحملة). img = صورة من assets/species/ */
  species: [
    { id: "poinciana", kind: "shade", name: "البونسيانا", img: "poinciana" },
    { id: "neem", kind: "shade", name: "النيم السعودي", img: "neem" },
    { id: "khuf", kind: "shade", name: "خف الجمل", img: "khuf" },
    { id: "ficus", kind: "shade", name: "فايسنس بنجامينا", img: "ficus" },
    { id: "fol", kind: "ornamental", name: "الفل", img: "fol" },
    { id: "yasmin", kind: "ornamental", name: "الياسمين", img: "yasmin" },
    { id: "hibiscus", kind: "ornamental", name: "الهيبسكس", img: "hibiscus" },
    { id: "cosmos", kind: "ornamental", name: "الكوزمس", img: "cosmos" },
    { id: "rose", kind: "ornamental", name: "الورد البلدي", img: "rose" },
    { id: "bougainvillea", kind: "ornamental", name: "الجهنمية", img: "bougainvillea" },
    { id: "fitna", kind: "ornamental", name: "الفتنة", img: "fitna" },
    { id: "oleander", kind: "ornamental", name: "الدفلة", img: "oleander" },
    { id: "araucaria", kind: "ornamental", name: "الأروكاري", img: "araucaria" },
    { id: "cordyline", kind: "ornamental", name: "الكوردلين", img: "cordyline" },
    { id: "narcissus", kind: "ornamental", name: "الترجس", img: "narcissus" },
    { id: "pothos", kind: "ornamental", name: "البوتس", img: "pothos" },
    { id: "coleus", kind: "ornamental", name: "الكوليوس", img: "coleus" },
    { id: "snapdragon", kind: "ornamental", name: "حنك السبع", img: "snapdragon" },
    { id: "morning-glory", kind: "ornamental", name: "الادهاق (الصباح)", img: "morning-glory" },
    { id: "lantana", kind: "ornamental", name: "الألانتانا كامارا", img: "lantana" },
  ],
  /* lat و lng = إحداثيات كل منطقة على الخريطة.
     القيم الحالية مؤقتة حول مركز الجامعة. اضبطها من الصفحة: map.html?edit=1 */
  areas: [
    { id: "library", name: "محيط المكتبة", lat: 15.75340, lng: 32.59460 },
    { id: "eng-labs", name: "ساحة لابات الهندسة", lat: 15.75360, lng: 32.59610 },
    { id: "zaqqum", name: "حديقة الزقوم", lat: 15.75270, lng: 32.59530 },
    { id: "g10", name: "محيط قاعة G10", lat: 15.75190, lng: 32.59450 },
    { id: "hurriya", name: "محيط قاعة الحرية", lat: 15.75210, lng: 32.59620 },
    { id: "central-lib", name: "محيط المكتبة المركزية", lat: 15.75290, lng: 32.59400 },
  ],
  /* آخر زراعة: عدّل التاريخ والعدد كل مرة تُزرع فيها أشجار جديدة */
  lastPlanting: { date: "2026-11-26", count: 3 },

  /* صور قبل/بعد للمعرض. أضف عنصراً لكل مكان (تظهر في صفحة المعرض تلقائياً):
     { title: "حديقة الزقوم", before: "assets/before1.jpg", after: "assets/after1.jpg" } */
  compare: [],

  colleges: [
    { id: "eng", name: "كلية الهندسة" },
    { id: "agri", name: "كلية الزراعة" },
    { id: "edu", name: "كلية التربية" },
    { id: "sci", name: "كلية العلوم" },
    { id: "eco", name: "كلية الاقتصاد" },
    { id: "arts", name: "كلية الآداب" },
  ],
  /* status: "planted" مزروعة | "documented" موثقة */
  trees: [
    { id: "T-001", name: "نيم", area: "library", college: "agri", date: "2026-10-12", status: "documented" },
    { id: "T-002", name: "مانجو", area: "zaqqum", college: "agri", date: "2026-10-12", status: "documented" },
    { id: "T-003", name: "سدر", area: "eng-labs", college: "eng", date: "2026-10-19", status: "documented" },
    { id: "T-004", name: "ليمون", area: "g10", college: "sci", date: "2026-10-26", status: "planted" },
    { id: "T-005", name: "نيم", area: "hurriya", college: "edu", date: "2026-11-02", status: "planted" },
    { id: "T-006", name: "جميز", area: "central-lib", college: "arts", date: "2026-11-02", status: "planted" },
    { id: "T-007", name: "مانجو", area: "library", college: "eco", date: "2026-11-09", status: "documented" },
    { id: "T-008", name: "نخلة", area: "zaqqum", college: "eng", date: "2026-11-16", status: "planted" },
  ],
};
