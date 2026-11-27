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
  /* فيديو بطاقة «تبنَّ شجرة»: يعمل فقط حين يكون ظاهراً، ويتوقف لو «تقليل الحركة» مفعّل */
  (function () {
    const v = document.querySelector(".cta-video");
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { v.removeAttribute("autoplay"); v.pause(); return; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { es[0].isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.25 }).observe(v);
    }
  })();
  const jv = document.querySelector(".jv-bg");
  if (jv && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { jv.removeAttribute("autoplay"); jv.pause(); }

  /* العنوان الضخم: نضبط حجم الخط ليملأ عرض الهيرو */
  const giant = document.querySelector(".hero-giant");
  if (giant) {
    const span = giant.firstElementChild, hero = giant.parentElement;
    const fit = () => {
      giant.style.fontSize = "100px";
      const w = span.getBoundingClientRect().width;
      if (!w) return;
      let size = (100 * hero.clientWidth * 0.94) / w;
      /* في اللابتوب: لا نخلّي الكلمة أطول من ٢٢٪ من ارتفاع الشاشة، حتى يدخل الهيرو كله في شاشة واحدة */
      if (window.innerWidth >= 900) size = Math.min(size, window.innerHeight * 0.14);
      giant.style.fontSize = size + "px";
      hero.style.setProperty("--giant-h", giant.getBoundingClientRect().height + "px");
      document.documentElement.style.setProperty("--giant-h", giant.getBoundingClientRect().height + "px"); /* تقرأه بطاقة الأرقام عشان تغطي جزء بس من الكلمة */
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
  /* أرقام الأثر: تُقرأ من data.js، والعدّاد يشغّله main.js عبر data-count */
  (function () {
    const GB = window.GB || {};
    const vals = {
      trees: (GB.trees || []).length,
      colleges: (GB.colleges || []).length,
      seedlings: typeof GB.seedlings === "number" ? GB.seedlings : 150, /* أضف seedlings: 150 في data.js لتغييره */
    };
    document.querySelectorAll("[data-stat]").forEach((el) => { el.dataset.count = vals[el.dataset.stat] || 0; });
    /* تطابق العدد والمعدود في العربية: 1 مفرد، 2 مثنى، 3–10 جمع، 11 وأكثر مفرد (13 شجرة، 8 أشجار) */
    const FORMS = {
      trees:     { one: "شجرة موثّقة",  two: "شجرتان موثّقتان",       few: "أشجار موثّقة",  many: "شجرة موثّقة" },
      colleges:  { one: "كلية مشاركة",  two: "كليتان مشاركتان",       few: "كليات مشاركة",  many: "كلية مشاركة" },
      seedlings: { one: "شتلة جاهزة للزراعة", two: "شتلتان جاهزتان للزراعة", few: "شتلات جاهزة للزراعة", many: "شتلة جاهزة للزراعة" },
    };
    document.querySelectorAll("[data-stat-label]").forEach((el) => {
      const f = FORMS[el.dataset.statLabel], v = vals[el.dataset.statLabel] || 0;
      if (!f) return;
      el.textContent = v === 2 ? f.two : v >= 3 && v <= 10 ? f.few : v === 1 || v === 0 ? f.one : f.many;
    });
  })();

  /* زر «ازرع أثر» الثابت: يظهر بعد الهيرو ويختفي عند قسم الدعوة والفوتر */
  (function () {
    const bar = document.getElementById("sticky-cta"), hero = document.getElementById("home");
    if (!bar || !hero || !("IntersectionObserver" in window)) return;
    const seen = { hero: true, join: false, foot: false };
    const render = () => {
      const on = !seen.hero && !seen.join && !seen.foot;
      bar.classList.toggle("show", on);
      bar.setAttribute("aria-hidden", on ? "false" : "true");
      bar.firstElementChild.tabIndex = on ? 0 : -1;
    };
    const watch = (el, key) => el && new IntersectionObserver((es) => { seen[key] = es[0].isIntersecting; render(); }).observe(el);
    watch(hero, "hero");
    watch(document.getElementById("join"), "join");
    watch(document.getElementById("site-footer"), "foot");
  })();
  /* كاروسيل Coverflow ثلاثي الأبعاد لصور الميدان: اسحب، أو الأسهم، أو اضغط أي صورة جانبية.
     لتغيير الصور عدّل المصفوفة SHOTS (الصور في assets/) */
  (function () {
    const SHOTS = [
      { src: "assets/g4.jpg", alt: "طلاب يزرعون شتلة في الجامعة" },
      { src: "assets/team.jpg", alt: "فريق جرين بحري أثناء العمل على الموقع", pos: "center 50%" },
      { src: "assets/g3.jpg", alt: "مساحة خضراء داخل الجامعة" },
      { src: "assets/g1.jpg", alt: "شتلة صغيرة بعد زراعتها" },
      { src: "assets/g2.jpg", alt: "من فعاليات المبادرة" },
      { src: "assets/about.jpg", alt: "من فعاليات المبادرة" },
    ];
    const cf = document.getElementById("cf"), stage = document.getElementById("cf-stage");
    if (!cf || !stage) return;
    const dotsBox = document.getElementById("cf-dots"), ambient = document.getElementById("cf-ambient");
    const n = SHOTS.length, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const toAr = (v) => String(v).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
    let index = 0, timer = null, stopped = false;
    const drag = { x: 0, on: false, moved: false };

    const cards = SHOTS.map((s, i) => {
      const c = document.createElement("button");
      c.type = "button"; c.className = "cf-card";
      c.innerHTML = '<img draggable="false" alt="">';
      const img = c.querySelector("img"); img.src = s.src; img.alt = s.alt; if (s.pos) img.style.objectPosition = s.pos; if (i > 1) img.loading = "lazy";
      c.addEventListener("click", () => {
        if (drag.moved) return;
        if (i === index) location.href = "gallery.html"; else go(i);
      });
      stage.appendChild(c);
      return c;
    });
    const dots = SHOTS.map((s, i) => {
      const d = document.createElement("button");
      d.type = "button"; d.className = "cf-dot"; d.setAttribute("role", "tab");
      d.setAttribute("aria-label", "الصورة " + toAr(i + 1));
      d.addEventListener("click", () => { halt(); go(i); });
      dotsBox.appendChild(d);
      return d;
    });

    const offset = (i) => { let d = i - index; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d; };
    function render() {
      cards.forEach((c, i) => {
        const d = offset(i), a = Math.abs(d), side = Math.sign(d), vis = a <= 2; /* RTL: التالي على اليسار */
        c.style.setProperty("--x", (-side * (a === 0 ? 0 : 52 + (a - 1) * 30)) + "%");
        c.style.setProperty("--z", (-a * 150) + "px");
        c.style.setProperty("--r", (side * 42) + "deg");
        c.style.setProperty("--s", String(1 - a * 0.08));
        c.style.zIndex = String(10 - a);
        c.style.opacity = vis ? "1" : "0";
        c.style.pointerEvents = vis ? "auto" : "none";
        c.style.filter = a === 0 ? "none" : "brightness(" + (0.78 - a * 0.14) + ")";
        c.classList.toggle("is-active", a === 0);
        c.tabIndex = a === 0 ? 0 : -1;
        c.setAttribute("aria-hidden", vis ? "false" : "true");
        c.setAttribute("aria-label", a === 0 ? "فتح معرض المبادرة" : "عرض الصورة " + toAr(i + 1));
      });
      dots.forEach((d, i) => { d.classList.toggle("on", i === index); d.setAttribute("aria-selected", String(i === index)); });
      ambient.style.backgroundImage = 'url("' + SHOTS[index].src + '")';
    }
    function go(i) { index = (i + n) % n; render(); }
    const next = () => go(index + 1), prev = () => go(index - 1);
    function halt() { stopped = true; clearInterval(timer); }
    function play() { if (reduce || stopped) return; clearInterval(timer); timer = setInterval(next, 4800); }

    document.getElementById("cf-next").addEventListener("click", () => { halt(); next(); });
    document.getElementById("cf-prev").addEventListener("click", () => { halt(); prev(); });
    cf.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { halt(); next(); e.preventDefault(); }
      else if (e.key === "ArrowRight") { halt(); prev(); e.preventDefault(); }
    });
    /* السحب لليمين = التالي (لأن التالي على اليسار) */
    stage.addEventListener("pointerdown", (e) => { drag.on = true; drag.moved = false; drag.x = e.clientX; });
    window.addEventListener("pointerup", (e) => {
      if (!drag.on) return;
      drag.on = false;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 40) { drag.moved = true; halt(); dx > 0 ? next() : prev(); setTimeout(() => (drag.moved = false), 60); }
    });
    stage.addEventListener("dragstart", (e) => e.preventDefault());
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((es) => { es[0].isIntersecting ? play() : clearInterval(timer); }, { threshold: 0.4 }).observe(cf);
    } else play();
    cf.addEventListener("pointerenter", () => clearInterval(timer));
    cf.addEventListener("pointerleave", play);
    render();
  })();
})();

/* فيديو الهيرو: عمودي، فبنشغّله في الموبايل بس. في اللابتوب بنستخدم صورة عريضة (hero-desktop.webp).
   لو "تقليل الحركة" أو "توفير البيانات" أو نت 2G بنخلي الصورة الثابتة (poster) */
(function () {
  const v = document.querySelector(".hero-video");
  if (!v) return;
  const conn = navigator.connection;
  const lite = (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ""))) ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = window.matchMedia("(min-width: 900px)").matches;
  if (lite || desktop) return; // بدون src: ما بينزّل شيء
  v.src = v.dataset.src;
  v.play().catch(() => {});
})();
