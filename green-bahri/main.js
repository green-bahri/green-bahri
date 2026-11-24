/* =========================================================
   جرين بحري — main.js (المرحلة 1)
   - يبني شريط التنقل والفوتر في كل الصفحات من مكان واحد
   - الوضع الداكن، قائمة الموبايل
   لتعديل روابط القائمة: غيّر مصفوفة PAGES تحت فقط.
   ========================================================= */

/* الصفحات المتبقية في الموقع (ملفات المراحل الجاية) */
const PAGES = [
  { href: "index.html", label: "الرئيسية" },
  { href: "trees.html", label: "دليل الأشجار" },
  { href: "map.html", label: "خريطة الجامعة" },
  { href: "colleges.html", label: "مساهمات الكليات" },
  { href: "gallery.html", label: "معرض المبادرة" },
  { href: "adopt.html", label: "تبنَّ شجرة" },
];

const ICONS = {
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
  sun: '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
  moon: '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
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

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("gb-theme", next); } catch (e) {}
}

/* ---------- بناء الشريط والفوتر ---------- */
function currentPage() {
  return location.pathname.split("/").pop() || "index.html";
}

function brandHTML() {
  return `
    <a class="brand" href="index.html">
      <span class="brand-mark">${ICONS.leaf}</span>
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
          <button class="icon-btn" id="theme-toggle" type="button" aria-label="تبديل الوضع الداكن">
            ${ICONS.moon}${ICONS.sun}
          </button>
          <button class="icon-btn nav-burger" id="menu-toggle" type="button"
                  aria-expanded="false" aria-controls="mobile-menu" aria-label="فتح القائمة">
            ${ICONS.menu}
          </button>
        </div>
      </nav>
      <div class="mobile-menu" id="mobile-menu" hidden>${links.join("")}</div>
    </header>`;

  const wrap = document.getElementById("nav-wrap");
  const menu = document.getElementById("mobile-menu");
  const burger = document.getElementById("menu-toggle");

  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);

  function setMenu(open) {
    menu.hidden = !open;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    burger.innerHTML = open ? ICONS.close : ICONS.menu;
  }
  burger.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

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
          <div>
            <h3>صفحات الموقع</h3>
            <ul class="footer-links">
              ${PAGES.map((p) => `<li><a href="${p.href}">${p.label}</a></li>`).join("")}
            </ul>
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
