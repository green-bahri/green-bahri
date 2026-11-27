/* =========================================================
   Green Bahri — gallery.js  (معرضنا)

   كل ما تحتاج تعدّله لاحقاً موجود في القسم (1) و(2) تحت.
   باقي الملف هو المحرك: لا تغيّره إلا لو عرفت وظيفته.

   ترتيب الملف:
   1) إعدادات عامة
   2) الصور (SHOTS) وفصول الحكاية (STORY)   ← هنا تضيف صورك ونصوص مريم
   3) أدوات صغيرة
   4) الهيرو (ضوء + شريط التقدم)
   5) الإحصائيات
   6) فصول الحكاية
   7) الفلاتر والشبكة + الميلان ثلاثي الأبعاد
   8) عارض الصور (Lightbox)
   9) قبل / بعد
   10) مشاركة واتساب + الختام
   11) الظهور عند التمرير
   ========================================================= */
(function () {
  "use strict";

  /* =======================================================
     1) إعدادات عامة
     ======================================================= */
  const SETTINGS = {
    /* اسم المصور الافتراضي لكل الصور. لو كل الصور من تصوير شخص واحد اكتب اسمه هنا،
       مثلاً "عبد الباسط". اتركه فاضياً "" فلا يظهر اسم لأي صورة إلا التي تحدده بنفسك. */
    defaultPhotographer: "",
    /* هل نسمح بتحميل الصور؟ (يمكن منعها لصورة معيّنة بكتابة download: false) */
    allowDownload: true,
    /* رسالة واتساب الجاهزة */
    /* مدة كل صورة في العرض التلقائي (بالملّي ثانية) */
    slideshowMs: 5000,
    whatsappText: "السلام عليكم، عندي لقطة من فعاليات جرين بحري وأريد مشاركتها في المعرض.",
  };

  /* =======================================================
     2) الصور وفصول الحكاية
     -------------------------------------------------------
     لإضافة صورة جديدة:
       1. ضع ملف webp في assets/gallery/  (والمصغّر باسم xxx-sm.webp بعرض 800)
       2. انسخ أي سطر من الأسطر تحت وعدّل بياناته.
     الحقول:
       id          اسم قصير بالإنجليزي بلا مسافات (يُستخدم في رابط المشاركة)
       src / sm    الصورة الكبيرة والمصغّرة      w / h  أبعاد الصورة الكبيرة
       title       عنوان الصورة          alt  وصف للمكفوفين (مهم)
       cat         التصنيف (يظهر كفلتر تلقائياً)
       year        السنة (اختياري، يظهر فلتر السنوات لو وُجدت سنتان مختلفتان)
       photographer اسم المصور (اختياري)
       area        رقم المنطقة من data.js → areas (اختياري، لا تخمّن: اتركه null لو ما متأكد)
       focus       نقطة التركيز عند القص، مثل "50% 40%"
       approved    ضع false لإخفاء الصورة مؤقتاً (مثلاً حتى تصل موافقة النشر)
       download    false لمنع تحميل هذه الصورة
     ======================================================= */
  const SHOTS = [
    {
      id: "seedlings", src: "assets/gallery/about.webp", sm: "assets/gallery/about-sm.webp", w: 1600, h: 1200,
      title: "شتلات جاهزة للزراعة", cat: "الشتلة", focus: "55% 60%",
      alt: "أيدٍ تتناول شتلات مزهرة في أكياسها من صندوق سيارة نقل",
      photographer: "", year: null, area: null, approved: true,
    },
    {
      id: "team", src: "assets/gallery/team.webp", sm: "assets/gallery/team-sm.webp", w: 1400, h: 1867,
      title: "أعضاء الفريق", cat: "الفريق", focus: "50% 55%",
      alt: "أعضاء الفريق يجلسون معاً حول طاولة ويتابعون العمل على حاسوب محمول",
      photographer: "", year: null, area: null, approved: true,
    },
    {
      id: "sprout", src: "assets/gallery/g1.webp", sm: "assets/gallery/g1-sm.webp", w: 1600, h: 994,
      title: "شتلة صغيرة", cat: "الشتلة", focus: "42% 40%",
      alt: "شتلة صغيرة خضراء نبتت في تربة محفورة وسط ساحة ترابية",
      photographer: "", year: null, area: null, approved: true,
    },
    {
      id: "planting", src: "assets/gallery/g4.webp", sm: "assets/gallery/g4-sm.webp", w: 1600, h: 1063,
      title: "غرس الشتلة", cat: "الزراعة", focus: "40% 55%",
      alt: "شاب منحنٍ يغرس شتلة بيديه في أرض الجامعة وخلفه زملاؤه يعملون",
      photographer: "", year: null, area: null, approved: true,
    },

    /* ----- صور بانتظار القرار (لا تُنشر قبل الموافقة) -----
       ① صورة الطفل (g2): فعّلها بعد الحصول على موافقة ولي الأمر/الجهة.
       ② صورة الري (g3): مولّدة بالذكاء الاصطناعي، لا تُستخدم. أضف بدلها صورة ري حقيقية.
    {
      id: "child", src: "assets/gallery/g2.webp", sm: "assets/gallery/g2-sm.webp", w: 1600, h: 1066,
      title: "...", cat: "الشتلة", alt: "...", approved: true,
    },
    {
      id: "watering", src: "assets/gallery/watering.webp", sm: "assets/gallery/watering-sm.webp", w: 1600, h: 1200,
      title: "...", cat: "الري", alt: "...", approved: true,
    },
    */
  ];

  /* فصول الحكاية: photo = id صورة من SHOTS (أو null لو الصورة ناقصة).
     text = نص زميلتك مريم. لو فاضي لا يظهر شيء (لا نخترع نصوصاً). */
  const STORY = [
    { title: "الشتلة", sub: "بداية الحكاية.", text: "", photo: "sprout" },
    { title: "الزراعة", sub: "أول أثر.", text: "", photo: "planting" },
    { title: "الري", sub: "استمرار الحياة.", text: "", photo: null },
    { title: "الفريق", sub: "الأيدي التي صنعت الفرق.", text: "", photo: "team" },
  ];

  /* =======================================================
     3) أدوات صغيرة
     ======================================================= */
  const $ = (s, r) => (r || document).querySelector(s);
  const GB = window.GB || {};
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;

  const photos = SHOTS.filter((s) => s.approved !== false);
  const byId = (id) => photos.find((p) => p.id === id) || null;
  const photographerOf = (p) => p.photographer || SETTINGS.defaultPhotographer || "";

  function h(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function countLabel(n) {
    if (n === 1) return "صورة واحدة";
    if (n === 2) return "صورتان";
    return n + (n >= 3 && n <= 10 ? " صور" : " صورة");
  }
  function toast(msg) {
    const t = h("div", "gx-toast", esc(msg));
    t.setAttribute("role", "status");
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }
  function areaOf(p) {
    if (!p.area || !GB.areas) return null;
    return GB.areas.find((a) => a.id === p.area) || null;
  }

  /* مركز واحد للتمرير: كل الحركات المرتبطة بالتمرير تمر من هنا بـ requestAnimationFrame واحد (أخف على الهاتف) */
  const scrollTasks = [];
  let scrollTick = false;
  function runScroll() { scrollTick = false; scrollTasks.forEach((f) => { try { f(); } catch (e) {} }); }
  addEventListener("scroll", () => { if (!scrollTick) { scrollTick = true; requestAnimationFrame(runScroll); } }, { passive: true });
  addEventListener("resize", () => requestAnimationFrame(runScroll));

  /* تقسيم العناوين إلى كلمات (لا حروف!) كي تظهر كلمة كلمة وتبقى الحروف متصلة */
  function splitWords(root) {
    let i = 0;
    (function walk(node) {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(" ")); return; }
            const sp = document.createElement("span");
            sp.className = "gx-w"; sp.style.setProperty("--i", i++); sp.textContent = t;
            frag.appendChild(sp);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) walk(ch);
      });
    })(root);
    root.classList.add("gx-split-ready");
  }
  if (!reduced) document.querySelectorAll("[data-split]").forEach(splitWords);

  /* =======================================================
     4) الهيرو: كرات الضوء + عمق التمرير + بقعة ضوء المؤشر + شريط التقدم
     ======================================================= */
  (function hero() {
    const box = $("#gx-bokeh");
    if (box && !reduced) {
      const n = window.innerWidth < 600 ? 7 : 13;
      for (let i = 0; i < n; i++) {
        const b = document.createElement("i");
        const s = 28 + Math.random() * 90;
        b.style.cssText =
          "--x:" + (Math.random() * 100).toFixed(1) + "%;--y:" + (8 + Math.random() * 80).toFixed(1) + "%;" +
          "--s:" + s.toFixed(0) + "px;--t:" + (9 + Math.random() * 12).toFixed(1) + "s;--d:-" + (Math.random() * 10).toFixed(1) + "s;" +
          "--dx:" + (Math.random() * 60 - 30).toFixed(0) + "px;--dy:" + (-20 - Math.random() * 60).toFixed(0) + "px";
        box.appendChild(b);
      }
    }

    const heroEl = $(".gx-hero");
    const bar = $("#gx-progress");
    const fab = $("#gx-fab");
    scrollTasks.push(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, scrollY / max) : 0;
      if (bar) bar.style.setProperty("--p", p.toFixed(4));
      if (fab) { fab.style.setProperty("--p", p.toFixed(4)); fab.classList.toggle("is-on", scrollY > innerHeight * 0.8); }
      /* عمق الهيرو: الصورة أبطأ والنص يرتفع ويخفت أثناء النزول */
      if (heroEl && !reduced) {
        const hh = heroEl.offsetHeight || 1;
        if (scrollY < hh * 1.3) heroEl.style.setProperty("--hs", Math.min(1, scrollY / hh).toFixed(3));
      }
    });
    runScroll();

    /* بقعة الضوء + ميلان خفيف للنص مع المؤشر (كمبيوتر فقط) */
    if (heroEl && finePointer && !reduced) {
      let raf = 0;
      heroEl.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = heroEl.getBoundingClientRect();
          heroEl.style.setProperty("--mx", (e.clientX - r.left) + "px");
          heroEl.style.setProperty("--my", (e.clientY - r.top) + "px");
          heroEl.style.setProperty("--px", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
        });
      });
    }
  })();

  /* =======================================================
     5) الإحصائيات — أرقام حقيقية فقط
        - عدد الصور: من SHOTS      - الأنواع: من data.js → species (ملصق الحملة)
        - الفصول: من STORY
     ======================================================= */
  (function stats() {
    const box = $("#gx-stats");
    if (!box) return;
    const items = [];
    if (photos.length) items.push({ n: photos.length, l: photos.length === 1 ? "صورة موثّقة" : "صور موثّقة" });
    if (GB.species && GB.species.length) items.push({ n: GB.species.length, l: "نوعاً من النباتات" });
    if (STORY.length) items.push({ n: STORY.length, l: "فصول للحكاية" });
    box.style.gridTemplateColumns = "repeat(" + (items.length || 1) + ", 1fr)";
    items.forEach((it) => {
      const li = h("li", "gx-stat", "<b data-n=\"" + it.n + "\">" + (reduced ? it.n : 0) + "</b><span>" + esc(it.l) + "</span>");
      box.appendChild(li);
    });
    box.__count = () => {
      box.querySelectorAll("[data-n]").forEach((el) => {
        const to = +el.dataset.n;
        if (reduced) { el.textContent = to; return; }
        const t0 = performance.now(), dur = 1400;
        (function step(t) {
          const k = Math.min(1, (t - t0) / dur);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      });
    };
  })();

  /* =======================================================
     6) فصول الحكاية
     ======================================================= */
  (function story() {
    const box = $("#gx-chapters");
    if (!box) return;
    STORY.forEach((c, i) => {
      const p = c.photo ? byId(c.photo) : null;
      const art = h("article", "gx-ch");
      let fig;
      if (p) {
        const who = photographerOf(p);
        fig =
          '<figure class="gx-frame gx-curtain-fig gx-ch-fig"><div class="gx-frame-in">' +
          '<img src="' + esc(p.sm) + '" srcset="' + esc(p.sm) + " 800w, " + esc(p.src) + " " + p.w + 'w" sizes="(min-width:820px) 45vw, 92vw" ' +
          'alt="' + esc(p.alt) + '" loading="lazy" decoding="async" width="800" height="' + Math.round(800 * p.h / p.w) + '" style="object-position:' + esc(p.focus || "50% 50%") + '">' +
          '<span class="gx-plaque">' + esc(p.title) + (who ? " · عدسة: " + esc(who) : "") + "</span></div></figure>";
      } else {
        fig =
          '<figure class="gx-frame gx-curtain-fig gx-ch-fig"><div class="gx-frame-in"><div class="gx-ph">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3Z"/></svg>' +
          "<span>لقطة " + esc(c.title) + " الحقيقية قيد التوثيق</span></div></div></figure>";
      }
      const num = String(i + 1).padStart(2, "0");
      const body =
        '<div class="gx-ch-body gx-reveal"><div class="gx-ch-num" aria-hidden="true">' + num + "</div>" +
        "<h3>" + esc(c.title) + '</h3><p class="gx-ch-sub">' + esc(c.sub) + "</p>" +
        (c.text ? '<p class="gx-ch-text">' + esc(c.text) + "</p>" : "") + "</div>";
      art.innerHTML = fig + body;
      box.appendChild(art);
    });
    /* خط زمني برونزي يتقدم مع التمرير + تحريك الصورة داخل إطارها (Parallax) */
    box.insertAdjacentHTML("afterbegin", '<div class="gx-spine" aria-hidden="true"><i></i></div>');
    const chs = Array.from(box.querySelectorAll(".gx-ch"));
    scrollTasks.push(() => {
      const r = box.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const mid = innerHeight * 0.62;
      box.style.setProperty("--sp", Math.min(1, Math.max(0, (mid - r.top - 16) / Math.max(1, r.height - 32))).toFixed(3));
      chs.forEach((c) => {
        const cr = c.getBoundingClientRect();
        c.classList.toggle("is-lit", cr.top + cr.height / 2 < mid);
        if (!reduced) {
          const fin = c.querySelector(".gx-frame-in");
          if (fin) fin.style.setProperty("--py", (((cr.top + cr.height / 2) - innerHeight / 2) / innerHeight * -34).toFixed(1));
        }
      });
    });
    runScroll();
  })();

  /* =======================================================
     6-ب) نباتات الحملة: شريطان يتحركان بعكس بعض (الأسماء من data.js → species)
     ======================================================= */
  (function species() {
    const sec = $("#gx-species"), box = $("#gx-mq");
    const list = GB.species || [];
    if (!sec || !box || list.length < 4) return;
    const kind = { shade: "شجرة ظل", ornamental: "زينة" };
    const mk = (arr) => arr.map((sp) =>
      '<div class="gx-sp"><img src="assets/species/' + esc(sp.img) + '.webp" alt="" loading="lazy" decoding="async" width="48" height="48"><div><b>' +
      esc(sp.name) + "</b><small>" + esc(kind[sp.kind] || "") + "</small></div></div>").join("");
    const half = Math.ceil(list.length / 2);
    [list.slice(0, half), list.slice(half)].forEach((row, i) => {
      if (!row.length) return;
      const inner = mk(row);
      const el = h("div", "gx-mq" + (i ? " rev" : ""), '<div class="gx-mq-track" style="--dur:' + (60 + i * 20) + 's">' + inner + inner + "</div>");
      box.appendChild(el);
    });
    const pEl = $("#gx-sp-p");
    if (pEl) pEl.textContent = list.length + " نوعاً من الأشجار والزهور في حملة الزراعة.";
    sec.hidden = false;
  })();

  /* =======================================================
     7) الفلاتر + شبكة Bento + الميلان ثلاثي الأبعاد
     ======================================================= */
  const grid = $("#gallery-grid");
  const filtersBox = $("#gx-filters");
  const yearsBox = $("#gx-years");
  const countEl = $("#gx-count");
  const state = { cat: "all", year: "all" };
  let items = []; // عناصر DOM بنفس ترتيب photos

  /* توزيع الأحجام: دورة من 6 صور تملأ الصفوف بلا فراغات، وللبقية توزيع خاص */
  function layoutFor(n) {
    const full = ["is-lg", "is-tall", "", "", "is-wide", "is-wide"];
    const rest = { 1: ["is-full"], 2: ["is-wide", "is-wide"], 3: ["is-lg", "is-tall", "is-tall"], 4: ["is-lg", "is-tall", "", ""], 5: ["is-lg", "is-tall", "", "", "is-full"] };
    let out = [];
    for (let i = 0; i < Math.floor(n / 6); i++) out = out.concat(full);
    if (n % 6) out = out.concat(rest[n % 6]);
    return out;
  }
  function sizesFor(cls) {
    if (cls === "is-full") return "100vw";
    if (cls === "is-lg" || cls === "is-wide") return "(min-width:700px) 50vw, 100vw";
    return "(min-width:700px) 25vw, 50vw";
  }

  function buildItems() {
    if (!grid) return;
    photos.forEach((p) => {
      const who = photographerOf(p);
      const b = h("button", "gx-item gx-curtain");
      b.type = "button";
      b.dataset.id = p.id;
      b.setAttribute("aria-label", "عرض الصورة: " + p.title);
      b.innerHTML =
        '<img alt="' + esc(p.alt) + '" loading="lazy" decoding="async" width="800" height="' + Math.round(800 * p.h / p.w) + '" style="object-position:' + esc(p.focus || "50% 50%") + '">' +
        '<div class="gx-cap"><span class="gx-tag">' + esc(p.cat) + "</span><strong>" + esc(p.title) + "</strong>" +
        (who ? "<small>عدسة: " + esc(who) + "</small>" : "") + "</div>";
      const img = $("img", b);
      img.addEventListener("load", () => img.classList.add("is-loaded"));
      img.addEventListener("error", () => img.classList.add("is-loaded"));
      img.srcset = p.sm + " 800w, " + p.src + " " + p.w + "w";
      img.src = p.sm;
      if (img.complete) img.classList.add("is-loaded");
      b.addEventListener("click", () => openLightbox(p.id, b));
      grid.appendChild(b);
      items.push(b);
      if (finePointer && !reduced) tilt(b);
    });
  }

  function matches(p) {
    return (state.cat === "all" || p.cat === state.cat) && (state.year === "all" || String(p.year) === state.year);
  }
  function visiblePhotos() { return photos.filter(matches); }

  function applyFilter(animate) {
    if (!grid) return;
    /* نسجّل أماكن الصور قبل التغيير لنحرّكها بسلاسة إلى أماكنها الجديدة (FLIP) */
    const before = new Map();
    const doAnim = animate === true && !reduced && grid.animate;
    if (doAnim) items.forEach((el) => { if (!el.hidden) before.set(el, el.getBoundingClientRect()); });
    const vis = visiblePhotos();
    const lay = layoutFor(vis.length);
    let k = 0;
    photos.forEach((p, i) => {
      const el = items[i];
      el.classList.remove("is-lg", "is-tall", "is-wide", "is-full");
      if (matches(p)) {
        el.hidden = false;
        const cls = lay[k] || "";
        if (cls) el.classList.add(cls);
        const im = $("img", el);
        im.sizes = sizesFor(cls);
        el.style.setProperty("--d", (k % 4) * 0.08 + "s");
        k++;
      } else {
        el.hidden = true;
      }
    });
    if (countEl) countEl.textContent = countLabel(vis.length);
    const old = $(".gx-empty", grid);
    if (old) old.remove();
    if (!vis.length) grid.appendChild(h("p", "gx-empty", "لا توجد صور في هذا القسم بعد."));
    if (doAnim) {
      const ease = "cubic-bezier(.22,1,.36,1)";
      items.forEach((el) => {
        if (el.hidden) return;
        if (inView(el)) el.classList.add("is-in");
        const old = before.get(el), now = el.getBoundingClientRect();
        if (old) {
          const dx = old.left - now.left, dy = old.top - now.top;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) el.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 650, easing: ease });
        } else {
          el.animate([{ opacity: 0, transform: "scale(.9)" }, { opacity: 1, transform: "none" }], { duration: 560, easing: ease });
        }
      });
    }
    /* أي عنصر ظهر الآن وهو داخل الشاشة نكشفه فوراً */
    requestAnimationFrame(() => items.forEach((el) => { if (!el.hidden && !el.classList.contains("is-in") && inView(el)) el.classList.add("is-in"); }));
  }
  function inView(el) {
    const r = el.getBoundingClientRect();
    return r.top < innerHeight * 0.95 && r.bottom > 0;
  }

  function buildFilters() {
    if (!filtersBox) return;
    const cats = [];
    photos.forEach((p) => { if (p.cat && cats.indexOf(p.cat) < 0) cats.push(p.cat); });
    /* «الحبة» المتحركة خلف الفلتر النشط */
    const moveInk = (box) => {
      const ink = box.querySelector(".gx-ink"), on = box.querySelector('.gx-chip[aria-pressed="true"]');
      if (!ink || !on || box.hidden) return;
      ink.style.left = on.offsetLeft + "px"; ink.style.top = on.offsetTop + "px";
      ink.style.width = on.offsetWidth + "px"; ink.style.height = on.offsetHeight + "px";
    };
    const boxes = [filtersBox, yearsBox].filter(Boolean);
    const refreshInk = () => boxes.forEach(moveInk);
    addEventListener("resize", refreshInk);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshInk);
    setTimeout(refreshInk, 120);
    const make = (label, value, box, key) => {
      if (!box.querySelector(".gx-ink")) box.insertAdjacentHTML("afterbegin", '<span class="gx-ink" aria-hidden="true"></span>');
      const c = h("button", "gx-chip", esc(label));
      c.type = "button";
      c.setAttribute("aria-pressed", String(state[key] === value));
      c.addEventListener("click", () => {
        state[key] = value;
        box.querySelectorAll(".gx-chip").forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
        moveInk(box);
        applyFilter(true);
      });
      box.appendChild(c);
    };
    make("الكل", "all", filtersBox, "cat");
    cats.forEach((c) => make(c, c, filtersBox, "cat"));
    if (cats.length < 2) filtersBox.hidden = true;

    const years = [];
    photos.forEach((p) => { if (p.year && years.indexOf(String(p.year)) < 0) years.push(String(p.year)); });
    if (yearsBox && years.length >= 2) {
      yearsBox.hidden = false;
      make("كل السنوات", "all", yearsBox, "year");
      years.sort().reverse().forEach((y) => make(y, y, yearsBox, "year"));
    }
  }

  /* الميلان ثلاثي الأبعاد (التأثير الثاني): فقط حين يوجد مؤشر ماوس */
  function tilt(el) {
    let raf = 0;
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--ry", ((x - 0.5) * 10).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((0.5 - y) * 8).toFixed(2) + "deg");
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
    });
    el.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  }

  buildItems();
  buildFilters();
  applyFilter();

  /* =======================================================
     8) عارض الصور (Lightbox)
        - أسهم الكيبورد: في العربي السهم الأيسر = التالي
        - سحب الإصبع: يميناً = التالي
     ======================================================= */
  const lb = $("#lightbox");
  const media = $("#gx-lb-media");
  const cap = $("#gx-lb-cap");
  const counter = $("#gx-lb-counter");
  const dl = $("#gx-lb-dl");
  const thumbs = $("#gx-lb-thumbs");
  const playBtn = lb ? $('[data-act="play"]', lb) : null;
  const lbBar = $("#gx-lb-bar");
  let list = [], cur = 0, opener = null, showTimer = null;

  /* العرض التلقائي: يتقدم كل slideshowMs وشريط ذهبي يوضح الوقت المتبقي */
  function isPlaying() { return !!playBtn && playBtn.getAttribute("aria-pressed") === "true"; }
  function stopShow() {
    clearTimeout(showTimer); showTimer = null;
    if (playBtn) { playBtn.setAttribute("aria-pressed", "false"); playBtn.setAttribute("aria-label", "تشغيل العرض التلقائي"); }
    if (lbBar) lbBar.classList.remove("run");
  }
  function tickShow() {
    clearTimeout(showTimer);
    if (!isPlaying() || list.length < 2) return;
    if (lbBar) { lbBar.style.setProperty("--ss", SETTINGS.slideshowMs + "ms"); lbBar.classList.remove("run"); void lbBar.offsetWidth; lbBar.classList.add("run"); }
    showTimer = setTimeout(() => go(1), SETTINGS.slideshowMs);
  }
  function buildThumbs() {
    if (!thumbs) return;
    thumbs.innerHTML = "";
    if (list.length < 2) return;
    list.forEach((p, i) => {
      const b = h("button", "", '<img alt="" loading="lazy" decoding="async">');
      b.type = "button";
      b.setAttribute("aria-label", "الانتقال إلى: " + p.title);
      $("img", b).src = p.sm;
      b.addEventListener("click", () => { const d = i >= cur ? 1 : -1; cur = i; renderLb(d); });
      thumbs.appendChild(b);
    });
  }
  function markThumb() {
    if (!thumbs) return;
    Array.from(thumbs.children).forEach((b, i) => {
      if (i === cur) { b.setAttribute("aria-current", "true"); b.scrollIntoView({ block: "nearest", inline: "center", behavior: reduced ? "auto" : "smooth" }); }
      else b.removeAttribute("aria-current");
    });
  }

  function shareUrl(p) {
    return location.href.split("#")[0] + "#" + p.id;
  }
  function renderLb(dir) {
    const p = list[cur];
    if (!p || !media) return;
    media.className = "gx-lb-media" + (dir ? (dir > 0 ? " gx-swap-next" : " gx-swap-prev") : "");
    media.innerHTML = "";
    const img = new Image();
    img.alt = p.alt;
    img.decoding = "async";
    img.src = p.src;
    media.appendChild(img);

    const who = photographerOf(p), area = areaOf(p);
    cap.innerHTML =
      '<span class="gx-tag">' + esc(p.cat) + "</span><strong>" + esc(p.title) + "</strong>" +
      (who ? '<span class="meta">عدسة: ' + esc(who) + "</span>" : "") +
      (p.year ? '<span class="meta">' + esc(p.year) + "</span>" : "") +
      (area ? '<a class="loc" href="map.html">استكشف موقع هذه الصورة على خريطة الجامعة (' + esc(area.name) + ")</a>" : "");
    counter.textContent = (cur + 1) + " من " + list.length;

    const canDl = SETTINGS.allowDownload && p.download !== false;
    dl.hidden = !canDl;
    if (canDl) { dl.href = p.src; dl.setAttribute("download", p.id + ".webp"); }

    const single = list.length < 2;
    lb.querySelectorAll(".gx-lb-nav").forEach((b) => (b.hidden = single));
    [1, -1].forEach((d) => { const n = list[(cur + d + list.length) % list.length]; if (n) new Image().src = n.src; });
    try { history.replaceState(null, "", "#" + p.id); } catch (e) {}
    markThumb();
    tickShow();
  }
  function go(d) {
    if (list.length < 2) return;
    cur = (cur + d + list.length) % list.length;
    renderLb(d);
  }
  function openLightbox(id, from) {
    if (!lb) return;
    list = visiblePhotos();
    cur = Math.max(0, list.findIndex((p) => p.id === id));
    opener = from || null;
    buildThumbs();
    renderLb(0);
    if (!lb.open) lb.showModal();
    document.documentElement.style.overflow = "hidden";
    const c = $('[data-act="close"]', lb);
    if (c) c.focus();
  }
  function closeLb() { if (lb && lb.open) lb.close(); }

  if (lb) {
    lb.addEventListener("click", (e) => {
      const a = e.target.closest("[data-act]");
      if (a) {
        const act = a.dataset.act;
        if (act === "close") closeLb();
        else if (act === "prev") go(-1);
        else if (act === "next") go(1);
        else if (act === "share") sharePhoto(list[cur]);
        else if (act === "play") {
          if (isPlaying()) stopShow();
          else { playBtn.setAttribute("aria-pressed", "true"); playBtn.setAttribute("aria-label", "إيقاف العرض التلقائي"); tickShow(); }
        }
        return;
      }
      if (e.target === lb) closeLb();
    });
    lb.addEventListener("close", () => {
      stopShow();
      document.documentElement.style.overflow = "";
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    });
    document.addEventListener("keydown", (e) => {
      if (!lb.open) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(-1); }
    });
    /* تكبير الصورة بالنقر (ويتبع المؤشر على الكمبيوتر) */
    media.addEventListener("click", (e) => {
      const img = e.target.closest("img");
      if (!img) return;
      if (media.classList.contains("is-zoom")) { media.classList.remove("is-zoom"); return; }
      const r = img.getBoundingClientRect();
      img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100).toFixed(1) + "% " + ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%";
      media.classList.add("is-zoom");
      stopShow();
    });
    media.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || !media.classList.contains("is-zoom")) return;
      const img = $("img", media), r = media.getBoundingClientRect();
      img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100).toFixed(1) + "% " + ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%";
    });
    /* السحب باللمس */
    const stage = $("#gx-lb-stage");
    let sx = 0, sy = 0, down = false;
    stage.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") return; down = true; sx = e.clientX; sy = e.clientY; });
    stage.addEventListener("pointerup", (e) => {
      if (!down) return;
      down = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (media.classList.contains("is-zoom")) return;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx > 0 ? 1 : -1);
    });
    stage.addEventListener("pointercancel", () => { down = false; });
  }

  function sharePhoto(p) {
    if (!p) return;
    const data = { title: p.title + " | معرض جرين بحري", text: "لقطة من معرض مبادرة جرين بحري: " + p.title, url: shareUrl(p) };
    if (navigator.share) {
      navigator.share(data).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(data.url).then(() => toast("تم نسخ رابط الصورة"), () => toast("تعذّر النسخ"));
    } else {
      toast("انسخ الرابط من شريط العنوان");
    }
  }

  /* فتح صورة مباشرة من الرابط: gallery.html#planting */
  function openFromHash() {
    const id = decodeURIComponent((location.hash || "").slice(1));
    if (!id || !byId(id)) return;
    state.cat = "all"; state.year = "all";
    filtersBox && filtersBox.querySelectorAll(".gx-chip").forEach((c, i) => c.setAttribute("aria-pressed", String(i === 0)));
    applyFilter();
    openLightbox(id, items[photos.findIndex((p) => p.id === id)]);
  }

  /* =======================================================
     9) قبل / بعد  (البيانات من data.js → compare)
        كل عنصر: { title, before: "مسار", after: "مسار" }
     ======================================================= */
  (function compare() {
    const box = $("#compare");
    if (!box) return;
    let list2 = (GB.compare || []).filter((c) => c && c.before && c.after);
    /* معاينة الشكل فقط: افتح gallery.html?demo=1 (لا تُنشر هذه الصور كأنها قبل/بعد حقيقية) */
    const demo = !list2.length && /[?&]demo=1/.test(location.search);
    if (demo) list2 = [{ title: "نموذج للشكل فقط", before: "assets/gallery/g1.webp", after: "assets/gallery/g4.webp", demo: true }];

    if (!list2.length) {
      box.innerHTML =
        '<div class="gx-ba-soon gx-reveal"><div class="gx-ba-ghost" aria-hidden="true"><span class="b">قبل</span><span class="a">بعد</span><i></i></div>' +
        "<h3>قريباً</h3><p>نجهّز صور المكان قبل الزراعة وبعدها لنعرضها هنا بشريط مقارنة تفاعلي.</p></div>";
      return;
    }
    list2.forEach((c) => {
      const card = h("figure", "gx-ba-card gx-reveal");
      card.innerHTML =
        '<div class="gx-ba"><img class="gx-ba-after" alt="" loading="lazy" decoding="async"><img class="gx-ba-before" alt="" loading="lazy" decoding="async">' +
        '<span class="gx-ba-tag b">قبل</span><span class="gx-ba-tag a">بعد</span><div class="gx-ba-handle"></div>' +
        '<input type="range" min="0" max="100" value="50" aria-label="حرّك لمقارنة صورة المكان قبل الزراعة وبعدها"></div>' +
        (c.title ? "<figcaption>" + esc(c.title) + (c.demo ? '<br><span class="gx-demo-flag">نموذج تجريبي للشكل: ليست صور قبل/بعد حقيقية</span>' : "") + "</figcaption>" : "");
      const wrap = $(".gx-ba", card), input = $("input", card);
      const a = $(".gx-ba-after", card), b = $(".gx-ba-before", card);
      a.src = c.after; a.alt = (c.title || "المكان") + " بعد الزراعة";
      b.src = c.before; b.alt = (c.title || "المكان") + " قبل الزراعة";
      const set = () => {
        wrap.style.setProperty("--pos", input.value + "%");
        input.setAttribute("aria-valuetext", input.value + "% من الشريط");
      };
      input.addEventListener("input", () => { wrap.classList.remove("is-hint"); set(); });
      wrap.classList.add("is-hint");
      /* حركة تعريفية مرة واحدة: المقبض يتمايل ليفهم الزائر أنه قابل للسحب */
      card.__sweep = () => {
        if (reduced) return;
        let stop = false;
        ["pointerdown", "keydown", "touchstart"].forEach((ev) => wrap.addEventListener(ev, () => { stop = true; }, { once: true, passive: true }));
        const t0 = performance.now(), dur = 3000;
        (function step(t) {
          if (stop) return;
          const k = Math.min(1, (t - t0) / dur);
          input.value = (50 + Math.sin(k * Math.PI * 2) * 30 * (1 - k * 0.25)).toFixed(1);
          set();
          if (k < 1) requestAnimationFrame(step); else { input.value = 50; set(); }
        })(t0);
      };
      box.appendChild(card);
    });
  })();

  /* =======================================================
     10) مشاركة واتساب + سنة الحقوق
     ======================================================= */
  (function cta() {
    const a = $("#gx-share-btn");
    if (a && GB.whatsapp) a.href = "https://wa.me/" + GB.whatsapp + "?text=" + encodeURIComponent(SETTINGS.whatsappText);
    else if (a) a.setAttribute("aria-disabled", "true");
    const y = $("#gx-year");
    if (y) y.textContent = new Date().getFullYear();

    /* ضوء يتبع المؤشر داخل البطاقة + زر «مغناطيسي» (كمبيوتر فقط) */
    if (finePointer && !reduced) {
      const cta = $(".gx-cta");
      if (cta) cta.addEventListener("pointermove", (e) => {
        const r = cta.getBoundingClientRect();
        cta.style.setProperty("--mx", (e.clientX - r.left) + "px");
        cta.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
      if (a) {
        a.addEventListener("pointermove", (e) => {
          const r = a.getBoundingClientRect();
          a.style.setProperty("--bx", ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px");
          a.style.setProperty("--by", ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + "px");
        });
        a.addEventListener("pointerleave", () => { a.style.setProperty("--bx", "0px"); a.style.setProperty("--by", "0px"); });
      }
    }
  })();

  /* شرارات برونزية تنطلق مرة واحدة عند وصول الزائر للبطاقة الختامية */
  function burst(card) {
    if (reduced || card.__burst) return;
    card.__burst = true;
    for (let i = 0; i < 24; i++) {
      const sp = document.createElement("i");
      const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 190;
      sp.className = "gx-spark";
      sp.style.cssText = "--sx:" + (Math.cos(ang) * dist).toFixed(0) + "px;--sy:" + (Math.sin(ang) * dist * 0.8).toFixed(0) + "px;animation-delay:" + (Math.random() * 0.25).toFixed(2) + "s";
      card.appendChild(sp);
      setTimeout(() => sp.remove(), 2400);
    }
  }

  /* =======================================================
     11) الظهور عند التمرير (التأثير الأول)
     ======================================================= */
  (function reveal() {
    const els = document.querySelectorAll(".gx-reveal, .gx-curtain-fig, [data-split]");
    const showAll = () => {
      els.forEach((e) => e.classList.add("is-in"));
      items.forEach((e) => e.classList.add("is-in"));
      const s = $("#gx-stats"); if (s && s.__count) s.__count();
    };
    if (!("IntersectionObserver" in window) || reduced) { showAll(); return; }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("is-in");
        io.unobserve(el);
        if (el.id === "gx-stats" && el.__count) el.__count();
        if (el.__sweep) setTimeout(el.__sweep, 500);
        if (el.classList.contains("gx-final")) burst(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach((e) => io.observe(e));

    /* صور الشبكة: نفحصها بالتمرير مباشرة، لأن المتصفح لا يرصد عنصراً مقصوصاً بالكامل (clip-path) */
    let tick = false;
    const check = () => {
      tick = false;
      items.forEach((el) => { if (!el.hidden && !el.classList.contains("is-in") && inView(el)) el.classList.add("is-in"); });
    };
    addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(check); } }, { passive: true });
    addEventListener("resize", check);
    check();
  })();

  addEventListener("hashchange", openFromHash);
  openFromHash();
  window.__gxReady = true;
})();
