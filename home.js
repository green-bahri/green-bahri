(function () {
  const P = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>";
  const ICONS = {
    leaf: P('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'),
    tree: P('<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>'),
    doc: P('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>'),
    college: P('<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>'),
    users: P('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
    care: P('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
    water: P('<path d="M12 22a7 7 0 0 0 7-7c0-4-7-13-7-13S5 11 5 15a7 7 0 0 0 7 7Z"/>'),
    camera: P('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z"/><circle cx="12" cy="13" r="3"/>'),
  };
  document.querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = ICONS[el.dataset.icon] || ""; });

  /* فيديو بطاقة السقاية: يتوقف لو الجهاز مفعّل «تقليل الحركة» */
  const jv = document.querySelector(".jv-bg");
  if (jv && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { jv.removeAttribute("autoplay"); jv.pause(); }

  /* العنوان الضخم: نضبط حجم الخط ليملأ عرض الهيرو */
  const giant = document.querySelector(".hero-giant");
  if (giant) {
    const span = giant.firstElementChild, hero = giant.parentElement;
    const fit = () => {
      giant.style.fontSize = "100px";
      const w = span.getBoundingClientRect().width;
      if (w) giant.style.fontSize = (100 * hero.clientWidth * 0.94) / w + "px";
    };
    fit();
    window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  const dlg = document.getElementById("join-dialog");
  const kind = document.getElementById("join-kind");
  const toast = document.getElementById("toast");
  document.querySelectorAll("[data-join]").forEach((b) =>
    b.addEventListener("click", () => { kind.value = b.dataset.join; dlg.showModal(); }));
  document.getElementById("join-cancel").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  document.getElementById("join-form").addEventListener("submit", () => {
    toast.textContent = "تم تسجيل اهتمامك — شكراً لمشاركتك!";
    toast.hidden = false;
    setTimeout(() => (toast.hidden = true), 3500);
  });

  /* آخر زراعة (من data.js → lastPlanting) */
  (function () {
    const lp = window.GB && window.GB.lastPlanting, el = document.getElementById("today-pill");
    if (!lp || !el || !lp.count) return;
    const n = (v) => v.toLocaleString("ar-EG");
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const days = Math.round((d0 - new Date(lp.date + "T00:00:00")) / 864e5);
    const what = lp.count === 1 ? "شجرة واحدة" : lp.count === 2 ? "شجرتان" : n(lp.count) + (lp.count <= 10 ? " أشجار" : " شجرة");
    el.innerHTML = '<i class="live-dot"></i><span></span>';
    el.lastChild.textContent = days <= 0 ? "زُرعت اليوم " + what : days === 1 ? "آخر زراعة أمس: " + what : "آخر زراعة قبل " + n(days) + " يوم: " + what;
    el.hidden = false;
  })();
})();
