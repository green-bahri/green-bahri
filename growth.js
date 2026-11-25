/* =========================================================
   growth.js — شجرة ضخمة في خلفية الصفحة تكبر مع التمرير (بذرة ← شجرة مكتملة)
<<<<<<< HEAD
   - الشجرة تتولّد برمجياً (أغصان تتفرّع + أوراق)، نفس الشكل في كل مرة.
   - طبقة ثابتة خلف كل الأقسام، لا تحتاج أي HTML إضافي.
   - الحجم والمكان والشفافية من الكلاس .grow-bg في style.css.
   - لتغيير شكل الشجرة: عدّل TREE (الزوايا، الطول، عدد الفروع) أو SEED.
=======
   - تُضاف كطبقة ثابتة خلف كل الأقسام، لا تحتاج أي HTML إضافي.
   - الحجم والمكان والشفافية من الكلاس .grow-bg في style.css.
   - للاستخدام في أي صفحة: <script src="growth.js" defer></script>
   - للتعديل: غيّر STAGES (أسماء المراحل) أو الأرقام داخل WINDOWS
     (كل زوج [من, إلى] هو جزء من التمرير 0..1 تظهر فيه العناصر).
>>>>>>> ec54581e2756c600ca630d1212ead043c5676018
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
  const TREE = {
    SEED: 7,                 // غيّر الرقم يتغير شكل الشجرة كله
    maxDepth: 5,             // عدد مستويات التفرّع
    trunkLen: 66,            // طول الساق
    lenFactor: 0.74,         // كل غصن أقصر من أبوه بهذه النسبة
    spread: [20, 40],        // زاوية الانفراج (درجات) بين من إلى
    widths: [11, 7, 4.6, 3, 2, 1.4],  // سماكة كل مستوى
    start: 0.05,             // بداية نمو الساق (من التمرير 0..1)
    step: 0.105,             // الفاصل الزمني بين مستويات التفرّع
    span: 0.15,              // مدة نمو كل غصن
  };
  const BARK = ["#6b4423", "#7a5230", "#86603a", "#8f6b44", "#9a7650", "#a58259"];
  const LEAF_COLORS = ["#166534", "#15803d", "#16a34a", "#22c55e", "#4ade80", "#059669"];
  const LEAF_D = "M0 0 C6 -9 20 -9 28 0 C20 9 6 9 0 0Z";

  /* ---------- أدوات ---------- */
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const pop = (t) => { const c = 1.70158; return t === 0 ? 0 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const arabic = (n) => n.toLocaleString("ar-EG");
  const rad = (d) => (d * Math.PI) / 180;
  function rng(seed) { // مولّد أرقام عشوائية ثابت
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const f = (n) => n.toFixed(1);

  /* ---------- توليد الشجرة ---------- */
  const rand = rng(TREE.SEED);
  const between = (a, b) => a + (b - a) * rand();
  const branches = []; // { d, w, color, t:[a,b] }
  const leaves = [];   // { x, y, rot, k, color, t:[a,b] }

  function grow(x, y, ang, len, depth) {
    const x2 = x + len * Math.sin(rad(ang)), y2 = y - len * Math.cos(rad(ang));
    const bend = between(-0.16, 0.16) * len; // انحناءة خفيفة
    const cx = (x + x2) / 2 + bend * Math.cos(rad(ang)), cy = (y + y2) / 2 + bend * Math.sin(rad(ang));
    const t0 = TREE.start + depth * TREE.step, t1 = t0 + TREE.span;
    branches.push({
      d: `M${f(x)} ${f(y)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`,
      w: TREE.widths[depth], color: BARK[depth], t: [t0, t1], depth,
    });

    if (depth >= 3) { // أوراق على الأطراف
      const n = depth === TREE.maxDepth ? 3 : depth === 4 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        leaves.push({
          x: x2 + between(-3, 3), y: y2 + between(-3, 3),
          rot: ang - 90 + between(-70, 70) + (i % 2 ? 90 : -90),
          k: between(0.6, 1.0), color: LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)],
          t: [t1 - 0.02 + i * 0.012, t1 + 0.1 + i * 0.012],
        });
      }
    }
    if (depth >= TREE.maxDepth) return;

    // غصنان في الطرف، يميل أحدهما يميناً والثاني يساراً
    const sp = TREE.spread;
    grow(x2, y2, ang - between(sp[0], sp[1]), len * TREE.lenFactor * between(0.92, 1.08), depth + 1);
    grow(x2, y2, ang + between(sp[0], sp[1]), len * TREE.lenFactor * between(0.92, 1.08), depth + 1);
    // غصن جانبي من منتصف الغصن (للمستويات الأولى)
    if (depth <= 2) {
      const sx = x + (x2 - x) * 0.6, sy = y + (y2 - y) * 0.6;
      const side = rand() < 0.5 ? -1 : 1;
      grow(sx, sy, ang + side * between(38, 58), len * 0.5, depth + 1);
    }
  }
  grow(100, 250, 0, TREE.trunkLen, 0);

  /* ---------- بناء الودجت ---------- */
  const html = `
<<<<<<< HEAD
    <svg viewBox="-40 0 280 280" role="presentation" focusable="false">
      <g id="g-tree">
        ${branches.map((b) => `<path data-branch d="${b.d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="${b.color}" stroke-width="${b.w}" stroke-linecap="round"/>`).join("")}
        ${leaves.map((l) => `<g transform="translate(${f(l.x)} ${f(l.y)}) rotate(${Math.round(l.rot)})"><path data-leaf d="${LEAF_D}" fill="${l.color}" transform="scale(0)"/></g>`).join("")}
      </g>
      <path d="M66 266 C78 252 90 247 100 247 C110 247 122 252 134 266Z" fill="#8a6a45" opacity=".55"/>
      <ellipse id="g-seed" cx="100" cy="244" rx="9" ry="6" fill="#5a3a1c"/>
=======
    <svg viewBox="0 0 200 280" role="presentation" focusable="false">
      <path id="g-trunk" d="${TRUNK_D}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="#7a5230" stroke-linecap="round"/>
      ${BRANCHES.map((b, i) => `<path data-branch="${i}" d="${b.d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="#7a5230" stroke-width="5" stroke-linecap="round"/>`).join("")}
      ${TRUNK_LEAVES.map(leafSVG).join("")}
      ${BRANCHES.map((b, i) => b.leaves.map((p, j) => leafSVG({ x: p[0], y: p[1], rot: p[2] }, i + j)).join("")).join("")}
      <g id="g-crown">${CROWN.map((c, i) => `<g transform="translate(${c[0]} ${c[1]})"><circle data-crown r="${Math.round(c[2] * 1.2)}" fill="${COLORS.crown[i % 4]}" transform="scale(0)"/></g>`).join("")}</g>
      ${FRUITS.map((f) => `<g transform="translate(${f[0]} ${f[1]})"><circle data-fruit r="4" fill="#f97316" transform="scale(0)"/></g>`).join("")}
      <path d="M62 266 C76 250 88 245 100 245 C112 245 124 250 138 266Z" fill="#8a6a45" opacity=".55"/>
      <ellipse id="g-seed" cx="100" cy="236" rx="9" ry="6" fill="#5a3a1c"/>
>>>>>>> ec54581e2756c600ca630d1212ead043c5676018
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
<<<<<<< HEAD
=======

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
>>>>>>> ec54581e2756c600ca630d1212ead043c5676018

    const seed = box.querySelector("#g-seed"), treeG = box.querySelector("#g-tree");
    const bEls = [...box.querySelectorAll("[data-branch]")];
    const lEls = [...box.querySelectorAll("[data-leaf]")];
    const pctEl = meter.querySelector(".grow-pct"), stageEl = meter.querySelector(".grow-stage");
    let lastStage = -1, lastPct = -1;

    function render(p) {
<<<<<<< HEAD
      seed.style.opacity = 1 - seg(p, 0.06, 0.14);
      branches.forEach((b, i) => {
        const s = easeOut(seg(p, b.t[0], b.t[1]));
        bEls[i].setAttribute("stroke-dashoffset", (1 - s).toFixed(3));
        bEls[i].style.opacity = s > 0 ? 1 : 0;
=======
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
>>>>>>> ec54581e2756c600ca630d1212ead043c5676018
      });
      leaves.forEach((l, i) => {
        lEls[i].setAttribute("transform", `scale(${(pop(seg(p, l.t[0], l.t[1])) * l.k).toFixed(3)})`);
      });
      treeG.classList.toggle("is-full", p > 0.97);
      const pct = Math.round(p * 100);
      if (pct !== lastPct) { pctEl.textContent = arabic(pct) + "٪"; lastPct = pct; }
      const si = STAGES.findIndex((s) => p < s.until);
<<<<<<< HEAD
      if (si !== lastStage) { stageEl.textContent = STAGES[si].name; lastStage = si; }
=======
      if (si !== lastStage) { stageEl.textContent = STAGES[si].name; lastStage = si; box.dataset.stage = si; }
>>>>>>> ec54581e2756c600ca630d1212ead043c5676018
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
