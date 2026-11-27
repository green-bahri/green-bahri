/* =========================================================
   جرين بحري — main.js (المرحلة 1)
   - يبني شريط التنقل والفوتر في كل الصفحات من مكان واحد
   - الوضع الداكن (الروابط تظهر جنب بعض في الموبايل زي الكمبيوتر، بدون قائمة منسدلة)
   لتعديل روابط القائمة: غيّر مصفوفة PAGES تحت فقط.
   ========================================================= */

/* الصفحات المتبقية في الموقع (ملفات المراحل الجاية) */
const PAGES = [
  { href: "index.html", label: "الرئيسية" },
  { href: "colleges.html", label: "مساهمة الكليات" },
  { href: "gallery.html", label: "معرض المبادرة" },
  { href: "map.html", label: "خريطة الجامعة" },
  { href: "trees.html", label: "ازرع أثر" },
];

const ICONS = {
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

/* ---------- الوضع الداكن (يُطبّق فوراً لتفادي الوميض) ---------- */
(function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem("gb-theme"); } catch (e) {}
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = saved || (prefersDark ? "dark" : "light");
})();

/* زر الوضع الليلي: لمبة بحبل. السحب يحرّك الحبل ويقلب الوضع (الضوء شغّال = ليلي) */
let themeBusy = false;
function toggleTheme() {
  if (themeBusy) return;
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  const btn = document.getElementById("theme-toggle");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const apply = () => {
    if (!reduce) {
      root.classList.add("theme-anim"); // انتقال ناعم للألوان
      setTimeout(() => root.classList.remove("theme-anim"), 700);
    }
    root.dataset.theme = next;
    if (btn) btn.setAttribute("aria-checked", String(next === "dark"));
    try { localStorage.setItem("gb-theme", next); } catch (e) {}
  };

  if (reduce || !btn) { apply(); return; }
  themeBusy = true;
  btn.classList.remove("is-pulling");
  void btn.offsetWidth; // يعيد تشغيل الأنيميشن
  btn.classList.add("is-pulling");
  setTimeout(apply, 170); // الوضع يتبدّل لحظة نزول الحبل
  setTimeout(() => { btn.classList.remove("is-pulling"); themeBusy = false; }, 900);
}

/* ---------- بناء الشريط والفوتر ---------- */
function currentPage() {
  return location.pathname.split("/").pop() || "index.html";
}

function brandHTML() {
  return `
    <a class="brand" href="index.html">
      <span class="brand-mark"><img src="assets/logo.png" alt="" width="30" height="30"></span>
      <span class="brand-text">
        <strong>جرين بحري</strong>
        <small>Green Bahri</small>
      </span>
    </a>`;
}

function linksHTML() {
  const here = currentPage();
  return PAGES.map(
    (p) =>
      `<a href="${p.href}"${p.href === here ? ' aria-current="page"' : ""}>${p.label}</a>`
  );
}

function buildHeader() {
  const slot = document.getElementById("site-header");
  if (!slot) return;
  const links = linksHTML();

  slot.innerHTML = `
    <header class="nav-wrap" id="nav-wrap">
      <nav class="nav" aria-label="التنقل الرئيسي">
        ${brandHTML()}
        <ul class="nav-links">${links.map((l) => `<li>${l}</li>`).join("")}</ul>
        <div class="nav-actions">
          <button class="lamp-switch" id="theme-toggle" type="button" role="switch"
                  aria-checked="${document.documentElement.dataset.theme === "dark"}" aria-label="تبديل الوضع الليلي">
            <svg viewBox="0 0 44 52" aria-hidden="true">
              <defs>
                <linearGradient id="lamp-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop class="lamp-grad-top" offset="0"/><stop class="lamp-grad-bot" offset="1"/>
                </linearGradient>
              </defs>
              <g class="lamp-cone"><polygon points="10,27 34,27 43,51 1,51"/></g>
              <line class="lamp-cord-top" x1="22" y1="-2" x2="22" y2="13"/>
              <ellipse class="lamp-bulb" cx="22" cy="27" rx="4.2" ry="3.2"/>
              <path class="lamp-shade" d="M7 27 A15 14 0 0 1 37 27 Z"/>
              <g class="lamp-pull">
                <line class="lamp-pull-line" x1="33" y1="24" x2="33" y2="38"/>
                <circle class="lamp-bead" cx="33" cy="40.5" r="2.6"/>
              </g>
            </svg>
          </button>
        </div>
      </nav>
    </header>`;

  const wrap = document.getElementById("nav-wrap");
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  /* يزيد وضوح الشريط عند النزول */
  const onScroll = () => wrap.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- ليكويد جلاس: فقاعة زجاجية تنزلق بين روابط القائمة ----------
   - تتبع الماوس/التركيز وترجع للصفحة الحالية
   - تتمطّط أثناء الحركة (squash & stretch)
   - عند الانتقال بين الصفحات تنزلق من رابط الصفحة السابقة للحالية
   لو فشل هذا الجزء يرجع التمييز العادي للرابط النشط (الكلاس has-glass لا يُضاف). */
function initGlassNav() {
  const ul = document.querySelector(".nav-links");
  if (!ul) return;
  const links = Array.from(ul.querySelectorAll("a"));
  if (!links.length) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const active = links.find((a) => a.getAttribute("aria-current") === "page") || null;
  const pill = document.createElement("span");
  pill.className = "glass-pill";
  pill.setAttribute("aria-hidden", "true");
  ul.prepend(pill);
  ul.classList.add("has-glass");
  let cur = null;

  function place(a, opts) {
    const o = opts || {};
    if (!a) { pill.style.opacity = "0"; cur = null; return; }
    const u = ul.getBoundingClientRect(), r = a.getBoundingClientRect();
    const x = r.left - u.left - ul.clientLeft, y = r.top - u.top - ul.clientTop;
    if (o.instant) pill.style.transition = "none";
    pill.style.width = r.width + "px";
    pill.style.height = r.height + "px";
    pill.style.transform = "translate(" + x + "px," + y + "px)";
    pill.style.opacity = "1";
    if (lgSupported()) lgApply(pill, r.width, r.height); // انكسار حقيقي للفقاعة بحجم الرابط الهدف
    if (o.instant) { void pill.offsetWidth; pill.style.transition = ""; }
    else if (!reduce && cur && cur !== a) {
      pill.classList.remove("is-moving"); void pill.offsetWidth; pill.classList.add("is-moving");
    }
    cur = a;
  }

  /* الانتقال بين الصفحات: نبدأ من رابط الصفحة السابقة ثم ننزلق للحالية */
  let prev = null;
  try { prev = sessionStorage.getItem("gb-nav-prev"); } catch (e) {}
  const prevLink = prev && prev !== currentPage() ? links.find((a) => a.getAttribute("href") === prev) : null;
  if (prevLink && active && !reduce) {
    place(prevLink, { instant: true });
    requestAnimationFrame(() => requestAnimationFrame(() => place(active)));
  } else {
    place(active, { instant: true });
  }

  links.forEach((a) => {
    a.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") place(a); });
    a.addEventListener("focus", () => place(a));
    a.addEventListener("blur", () => place(active));
  });
  ul.addEventListener("pointerleave", () => place(active));
  const refit = () => place(cur || active, { instant: true });
  window.addEventListener("resize", refit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  window.addEventListener("pagehide", () => { try { sessionStorage.setItem("gb-nav-prev", currentPage()); } catch (e) {} });
}

function buildFooter() {
  const slot = document.getElementById("site-footer");
  if (!slot) return;
  const year = new Date().getFullYear();

  slot.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            ${brandHTML()}
            <p class="footer-about">
              مبادرة طلابية لزراعة الأشجار والعناية بها في جامعة بحري.
            </p>
          </div>
          <div class="footer-college">
            <img src="assets/college-logo.webp" alt="شعار كلية علوم الحاسوب والرياضيات — جامعة بحري" width="96" height="98" loading="lazy">
            <p>تنفيذ طلاب<br><strong>كلية علوم الحاسوب والرياضيات</strong><br>جامعة بحري</p>
          </div>
        </div>
        <p class="footer-bottom">© ${year} جرين بحري — جامعة بحري</p>
      </div>
    </footer>`;
}

/* ---------- ليكويد جلاس حقيقي (انكسار الخلفية عند الحواف + حافة لامعة + تلوّن بسيط) ----------
   أي عنصر عليه data-liquid يأخذ التأثير. الانكسار الفعلي يشتغل في كروم/إيدج/أندرويد،
   وفي سفاري وفايرفوكس يرجع تلقائياً لزجاج مموّه بنفس الشكل (الكلاس liquid-glass في style.css). */
const LG = { ok: null, defs: null, n: 0, strength: 1.35 }; /* strength: ارفعه لانكسار أقوى أو نزّله لأخف */

function lgSupported() {
  if (LG.ok === null) {
    const ua = navigator.userAgent;
    LG.ok = /Chrome\/|Edg\//.test(ua) && !/CriOS|FxiOS|OPR\/|Firefox/.test(ua) &&
      !!(window.CSS && CSS.supports && CSS.supports("backdrop-filter", "url(#a)"));
  }
  return LG.ok;
}

/* خريطة الإزاحة: لون كل بكسل (R,G) يحدد اتجاه وقوة انكسار الخلفية. الحواف قوية والوسط ثابت */
function lgMap(w, h, r, bezel) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(w, h), d = img.data;
  const hx = w / 2, hy = h / 2, ix = hx - r, iy = hy - r;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - hx, py = y + 0.5 - hy;
      const qx = Math.abs(px) - ix, qy = Math.abs(py) - iy;
      let nx, ny, sd;
      if (qx > 0 && qy > 0) { const l = Math.hypot(qx, qy); nx = (qx / l) * Math.sign(px); ny = (qy / l) * Math.sign(py); sd = l - r; }
      else if (qx > qy) { nx = Math.sign(px); ny = 0; sd = qx - r; }
      else { nx = 0; ny = Math.sign(py); sd = qy - r; }
      const dist = -sd; // المسافة من الحافة إلى الداخل
      const m = dist < bezel ? Math.pow(1 - Math.max(dist, 0) / bezel, 2.2) : 0;
      const i = (y * w + x) * 4;
      d[i] = Math.round(128 - nx * m * 127);
      d[i + 1] = Math.round(128 - ny * m * 127);
      d[i + 2] = 128; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

function lgApply(el, fw, fh) {
  const w = Math.round(fw || el.offsetWidth), h = Math.round(fh || el.offsetHeight);
  if (w < 8 || h < 8) return;
  if (el._lgW === w && el._lgH === h) return;
  el._lgW = w; el._lgH = h;
  if (!LG.defs) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "0"); svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    LG.defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.appendChild(LG.defs); document.body.appendChild(svg);
  }
  const rad = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || h / 2, h / 2, w / 2);
  const bezel = Math.min(h * 0.5, 24);                 // سمك الحافة المنكسرة (كل الحافة تقريباً زي الفيديو)
  const S = 2 * Math.min(16, h * 0.34) * LG.strength; // أقصى إزاحة × 2
  const url = lgMap(w, h, rad, bezel);
  const id = "lg-" + ++LG.n;
  const tmp = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const disp = (k, res) => `<feDisplacementMap in="SourceGraphic" in2="m" scale="${(S * k).toFixed(2)}" xChannelSelector="R" yChannelSelector="G" result="${res}"/>`;
  tmp.innerHTML = `<filter id="${id}" x="0" y="0" width="${w}" height="${h}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
    <feImage href="${url}" x="0" y="0" width="${w}" height="${h}" result="m"/>
    ${disp(1, "dr")}<feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
    ${disp(0.93, "dg")}<feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
    ${disp(0.86, "db")}<feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
    <feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen"/>
  </filter>`;
  const f = tmp.firstElementChild;
  if (el._lgId) { const old = LG.defs.querySelector("#" + el._lgId); if (old) old.remove(); }
  LG.defs.appendChild(f);
  el._lgId = id;
  const v = `url(#${id}) blur(1.5px) saturate(1.8) brightness(1.1)`;
  el.style.backdropFilter = v;
  el.style.webkitBackdropFilter = v;
}

function initLiquidGlass() {
  if (!lgSupported()) return;
  document.querySelectorAll("[data-liquid]").forEach((el) => {
    let raf = 0, lw = 0, lh = 0;
    const run = () => {
      const w = el.offsetWidth, h = el.offsetHeight;
      if (w === lw && h === lh) return;
      lw = w; lh = h; lgApply(el);
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run); };
    schedule();
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(el);
  });
}

/* ---------- ريبل الأزرار: دائرة تنتشر من مكان الضغط (تشتغل على كل زر .btn في كل الصفحات) ---------- */
function addRipple(e) {
  const btn = e.target.closest && e.target.closest(".btn");
  if (!btn || btn.disabled) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = btn.getBoundingClientRect();
  const keyboard = e.type === "click" && e.detail === 0; // ضغط بلوحة المفاتيح: من المنتصف
  const x = keyboard ? r.width / 2 : e.clientX - r.left;
  const y = keyboard ? r.height / 2 : e.clientY - r.top;
  const d = 2 * Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
  const dot = document.createElement("span");
  dot.className = "btn-ripple";
  dot.style.cssText = `width:${d}px;height:${d}px;left:${x - d / 2}px;top:${y - d / 2}px`;
  btn.appendChild(dot);
  dot.addEventListener("animationend", () => dot.remove());
}
document.addEventListener("pointerdown", addRipple);
document.addEventListener("click", (e) => { if (e.detail === 0) addRipple(e); });

document.addEventListener("DOMContentLoaded", () => {
  buildHeader();
  initGlassNav();
  buildFooter();
  initLiquidGlass();

  /* لو ملف الفيديو غير موجود نخفيه فتظهر الخلفية الخضراء البديلة */
  /* عدّاد الأرقام + ظهور الأقسام عند النزول */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    if (e.target.dataset.count) {
      const to = +e.target.dataset.count, dec = +(e.target.dataset.decimals || 0), t0 = performance.now();
      const step = (t) => { const p = Math.min((t - t0) / 1200, 1);
        e.target.textContent = (to * (1 - Math.pow(1 - p, 3))).toLocaleString("ar-EG", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (e.target.dataset.suffix || "");
        if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    io.unobserve(e.target);
  }), { threshold: 0.2 });
  document.querySelectorAll(".reveal, [data-count]").forEach((el) => io.observe(el));

  const video = document.querySelector(".hero-video");
  if (video) {
    video.addEventListener("error", () => video.remove(), true);
    const source = video.querySelector("source");
    if (source) source.addEventListener("error", () => video.remove());
  }
});
