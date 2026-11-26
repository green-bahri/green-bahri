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

/* زر الوضع الليلي: مقبض ينزلق + توهّج + أيقونة تتفتت لمربعات صغيرة (مثل فيديو التصميم) */
function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  const btn = document.getElementById("theme-toggle");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    root.classList.add("theme-anim"); // انتقال ناعم للألوان
    setTimeout(() => root.classList.remove("theme-anim"), 700);
    if (btn) burst(btn.querySelector(".ts-knob"), next);
  }
  root.dataset.theme = next;
  if (btn) btn.setAttribute("aria-checked", String(next === "light"));
  try { localStorage.setItem("gb-theme", next); } catch (e) {}
}

/* مربعات صغيرة تتطاير من المقبض عند التبديل */
function burst(knob, theme) {
  if (!knob) return;
  const color = theme === "dark" ? "#c7d2fe" : "#f59e0b";
  for (let i = 0; i < 16; i++) {
    const p = document.createElement("i");
    p.className = "ts-px";
    const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 22;
    p.style.setProperty("--dx", Math.cos(a) * d + "px");
    p.style.setProperty("--dy", Math.sin(a) * d + "px");
    p.style.background = color;
    knob.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
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
          <button class="theme-switch" id="theme-toggle" type="button" role="switch"
                  aria-checked="${document.documentElement.dataset.theme !== "dark"}" aria-label="تبديل الوضع الليلي">
            <span class="ts-knob">
              <span class="ts-icon ts-moon">${ICONS.moon}</span>
              <span class="ts-icon ts-sun">${ICONS.sun}</span>
            </span>
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

document.addEventListener("DOMContentLoaded", () => {
  buildHeader();
  buildFooter();

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
