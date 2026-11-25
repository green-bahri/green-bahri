/* =========================================================
   growth.js — شجرة ضخمة في خلفية الصفحة تكبر مع التمرير (بذرة ← شجرة مكتملة)
   - تُضاف كطبقة ثابتة خلف كل الأقسام، لا تحتاج أي HTML إضافي.
   - الحجم والمكان والشفافية من الكلاس .grow-bg في style.css.
   - للاستخدام في أي صفحة: <script src="growth.js" defer></script>
   - للتعديل: غيّر STAGES (أسماء المراحل) أو الأرقام داخل WINDOWS
     (كل زوج [من, إلى] هو جزء من التمرير 0..1 تظهر فيه العناصر).
   ========================================================= */
(function () {
  /* ---------- الإعدادات (عدّل هنا) ---------- */
  const STAGES = [
    { until: 0.12, name: "بذرة" },
    { until: 0.30, name: "إنبات" },
    { until: 0.55, name: "نمو الساق والأوراق" },
    { until: 0.80, name: "تفرّع الأغصان" },
    { until: 1.01, name: "شجرة مكتملة" },
  ];
  const WINDOWS = {
    trunk: [0.10, 0.60],     // نمو الساق
    seedFade: [0.07, 0.15],  // اختفاء البذرة
    crownStart: 0.78,        // بداية ظهور التاج
    fruits: [0.94, 1.0],     // الثمار
  };
  const COLORS = { crown: ["#166534", "#15803d", "#16a34a", "#22c55e"], leaf: ["#22c55e", "#16a34a"] };

  /* أوراق على الساق: x,y موضع الاتصال، rot زاوية، t = [بداية, نهاية]، k = الحجم */
  const TRUNK_LEAVES = [
    { x: 100, y: 214, rot: 200, t: [0.13, 0.26], k: 1.15 },
    { x: 100, y: 208, rot: -20, t: [0.15, 0.28], k: 1.15 },
    { x: 100, y: 190, rot: 205, t: [0.30, 0.42], k: 1 },
    { x: 100, y: 175, rot: -25, t: [0.34, 0.46], k: 1 },
    { x: 100, y: 158, rot: 210, t: [0.38, 0.50], k: 1 },
    { x: 100, y: 142, rot: -30, t: [0.42, 0.54], k: 1 },
    { x: 100, y: 125, rot: 215, t: [0.46, 0.58], k: 0.95 },
    { x: 100, y: 110, rot: -35, t: [0.50, 0.60], k: 0.9 },
  ];
  /* أغصان: d المسار، t نافذة النمو، leaves أوراق تظهر بعد اكتمال الغصن */
  const BRANCHES = [
    { d: "M100 180 C86 176 70 166 56 146", t: [0.52, 0.64], leaves: [[56, 146, 225], [78, 170, 200]] },
    { d: "M100 152 C114 148 132 136 148 118", t: [0.58, 0.70], leaves: [[148, 118, -45], [124, 142, -20]] },
    { d: "M100 128 C86 122 72 108 62 88", t: [0.64, 0.76], leaves: [[62, 88, 235], [82, 114, 210]] },
    { d: "M100 108 C114 102 128 90 140 72", t: [0.70, 0.80], leaves: [[140, 72, -55], [118, 96, -25]] },
  ];
  /* التاج: دوائر [x, y, نصف القطر] */
  const CROWN = [[100, 88, 30], [72, 78, 26], [130, 76, 27], [100, 62, 34], [88, 48, 24], [118, 46, 23], [60, 98, 20], [142, 96, 20]];
  const FRUITS = [[84, 70], [116, 60], [104, 92], [70, 86], [132, 84]];
  const TRUNK_D = "M100 250 C100 215 97 165 100 92";
  const LEAF_D = "M0 0 C6 -9 20 -9 28 0 C20 9 6 9 0 0Z";

  /* ---------- أدوات ---------- */
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const pop = (t) => { const c = 1.70158; return t === 0 ? 0 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const arabic = (n) => n.toLocaleString("ar-EG");

  /* ---------- بناء الودجت ---------- */
  const leafSVG = (l, i) =>
    `<g transform="translate(${l.x} ${l.y}) rotate(${l.rot})"><path class="g-leaf" data-leaf d="${LEAF_D}" fill="${COLORS.leaf[i % 2]}" transform="scale(0)"/></g>`;

  const html = `
    <svg viewBox="0 0 200 280" role="presentation" focusable="false">
      <path id="g-trunk" d="${TRUNK_D}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="#7a5230" stroke-linecap="round"/>
      ${BRANCHES.map((b, i) => `<path data-branch="${i}" d="${b.d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/>`).join("")}
      ${TRUNK_LEAVES.map(leafSVG).join("")}
      ${BRANCHES.map((b, i) => b.leaves.map((p, j) => leafSVG({ x: p[0], y: p[1], rot: p[2] }, i + j)).join("")).join("")}
      <g id="g-crown">${CROWN.map((c, i) => `<g transform="translate(${c[0]} ${c[1]})"><circle data-crown r="${Math.round(c[2] * 1.2)}" fill="${COLORS.crown[i % 4]}" transform="scale(0)"/></g>`).join("")}</g>
      ${FRUITS.map((f) => `<g transform="translate(${f[0]} ${f[1]})"><circle data-fruit r="4" fill="#f97316" transform="scale(0)"/></g>`).join("")}
      <path d="M62 266 C76 250 88 245 100 245 C112 245 124 250 138 266Z" fill="#8a6a45" opacity=".55"/>
      <ellipse id="g-seed" cx="100" cy="236" rx="9" ry="6" fill="#5a3a1c"/>
    </svg>`;
  const meterHTML = `<span class="grow-pct">٠٪</span><span class="grow-stage">بذرة</span>`;

  function init() {
    const box = document.createElement("aside");
    box.className = "grow-bg";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML = html;
    document.body.prepend(box);
    /* مؤشر النسبة: نص صغير بدون بطاقة */
    const meter = document.createElement("div");
    meter.className = "grow-meter";
    meter.setAttribute("aria-hidden", "true");
    meter.innerHTML = meterHTML;
    document.body.appendChild(meter);

    const $ = (s) => box.querySelector(s);
    const trunk = $("#g-trunk"), seed = $("#g-seed"), crownG = $("#g-crown");
    const branches = [...box.querySelectorAll("[data-branch]")];
    const leaves = [...box.querySelectorAll("[data-leaf]")];
    const crowns = [...box.querySelectorAll("[data-crown]")];
    const fruits = [...box.querySelectorAll("[data-fruit]")];
    const pctEl = meter.querySelector(".grow-pct"), stageEl = meter.querySelector(".grow-stage");

    /* نافذة كل ورقة بنفس ترتيب بنائها */
    const leafWindows = [
      ...TRUNK_LEAVES.map((l) => ({ t: l.t, k: l.k })),
      ...BRANCHES.flatMap((b) => b.leaves.map(() => ({ t: [b.t[1], b.t[1] + 0.08], k: 0.9 }))),
    ];

    let lastStage = -1, lastPct = -1;

    function render(p) {
      /* الساق */
      const tt = easeOut(seg(p, ...WINDOWS.trunk));
      trunk.setAttribute("stroke-dashoffset", 1 - tt);
      trunk.setAttribute("stroke-width", 5 + 11 * seg(p, WINDOWS.trunk[0], 1));
      trunk.style.opacity = p > WINDOWS.trunk[0] ? 1 : 0;
      /* البذرة */
      seed.style.opacity = 1 - seg(p, ...WINDOWS.seedFade);
      /* الأغصان */
      BRANCHES.forEach((b, i) => {
        const s = easeOut(seg(p, ...b.t));
        branches[i].setAttribute("stroke-dashoffset", 1 - s);
        branches[i].style.opacity = s > 0 ? 1 : 0;
      });
      /* الأوراق */
      leafWindows.forEach((w, i) => {
        leaves[i].setAttribute("transform", `scale(${(pop(seg(p, ...w.t)) * w.k).toFixed(3)})`);
      });
      /* التاج والثمار */
      crowns.forEach((c, i) => {
        const s = pop(seg(p, WINDOWS.crownStart + i * 0.02, WINDOWS.crownStart + 0.12 + i * 0.02));
        c.setAttribute("transform", `scale(${s.toFixed(3)})`);
      });
      fruits.forEach((f, i) => {
        const s = pop(seg(p, WINDOWS.fruits[0] + i * 0.008, WINDOWS.fruits[1]));
        f.setAttribute("transform", `scale(${s.toFixed(3)})`);
      });
      crownG.classList.toggle("is-full", p > 0.97);
      /* المؤشر */
      const pct = Math.round(p * 100);
      if (pct !== lastPct) { pctEl.textContent = arabic(pct) + "٪"; lastPct = pct; }
      const si = STAGES.findIndex((s) => p < s.until);
      if (si !== lastStage) { stageEl.textContent = STAGES[si].name; lastStage = si; box.dataset.stage = si; }
    }

    /* تمرير ناعم: نقترب من القيمة الهدف تدريجياً لتفادي الاهتزاز */
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cur = 0, target = 0, raf = 0;
    const readTarget = () => {
      /* الشجرة تكتمل لما يبدأ الفوتر يظهر، عشان تتشاف كاملة خلف قسم المشاركة */
      const foot = document.getElementById("site-footer");
      const max = document.documentElement.scrollHeight - window.innerHeight - (foot ? foot.offsetHeight * 0.8 : 0);
      target = max > 0 ? clamp(window.scrollY / max) : 0;
    };
    function loop() {
      cur += (target - cur) * 0.14;
      if (Math.abs(target - cur) < 0.0005) cur = target;
      render(cur);
      raf = cur === target ? 0 : requestAnimationFrame(loop);
    }
    function update() {
      readTarget();
      if (reduce) { cur = target; render(cur); return; }
      if (!raf) raf = requestAnimationFrame(loop);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update);
    if ("ResizeObserver" in window) new ResizeObserver(update).observe(document.body);
    update();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
