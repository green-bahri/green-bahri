/* بيانات الموقع — عدّل هنا فقط. القيم الحالية أمثلة تجريبية. */
window.GB = {
  areas: [
    { id: "library", name: "محيط المكتبة" },
    { id: "eng-labs", name: "ساحة لابات الهندسة" },
    { id: "zaqqum", name: "حديقة الزقوم" },
    { id: "g10", name: "محيط قاعة G10" },
    { id: "hurriya", name: "محيط قاعة الحرية" },
    { id: "central-lib", name: "محيط المكتبة المركزية" },
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
