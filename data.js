/* بيانات الموقع — عدّل هنا فقط. القيم الحالية أمثلة تجريبية. */
window.GB = {
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
