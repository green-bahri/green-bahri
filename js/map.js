/* خريطة تشجير الجامعة (Leaflet + صورة جوية من Esri + خريطة OpenStreetMap)
   - مواقع المناطق (lat, lng) تُقرأ من data.js
   - لضبط المواقع بالسحب: افتح map.html?edit=1
   - Leaflet يُحمَّل من: lib/leaflet/ (لو وضعته)، ثم unpkg، ثم cdnjs. كل مصدر له مهلة 8 ثوانٍ.
   - لو فشلت صور طبقة (جوية أو عادية) يتحول تلقائياً للطبقة الأخرى. */
(function () {
  const { areas, trees, colleges } = window.GB;
  const n = (v) => v.toLocaleString("ar-EG");
  const STATUS = { planted: "مزروعة", documented: "موثقة" };
  const edit = /[?&]edit(=|&|$)/.test(location.search);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BASES = [
    "lib/leaflet/",
    "https://unpkg.com/leaflet@1.9.4/dist/",
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/",
  ];

  const chips = document.getElementById("area-chips");
  const count = (id) => trees.filter((t) => t.area === id).length;
  const nameOf = (list, id) => (list.find((x) => x.id === id) || {}).name || "";
  const hasPos = (a) => Number.isFinite(a.lat) && Number.isFinite(a.lng);

  /* ---------- حاوية الخريطة ---------- */
  let mapEl = document.getElementById("campus-map");
  if (mapEl && mapEl.tagName.toLowerCase() === "svg") { /* صفحة قديمة */
    const d = document.createElement("div");
    d.id = "campus-map";
    d.className = "leaflet-map";
    mapEl.replaceWith(d);
    mapEl = d;
  }
  if (mapEl) {
    mapEl.style.minHeight = "420px";
    mapEl.style.position = "relative";
    mapEl.style.zIndex = "0";
    mapEl.style.isolation = "isolate"; /* يمنع الخريطة من الظهور فوق شريط التنقل */
  }

  let map = null;
  let currentId = null;
  const markers = {};

  function say(text) {
    if (!mapEl) return;
    let el = document.getElementById("map-status");
    if (!el) {
      el = document.createElement("div");
      el.id = "map-status";
      el.className = "map-status";
      el.setAttribute("role", "status");
      mapEl.parentNode.appendChild(el);
    }
    el.textContent = text;
  }

  /* ---------- تحميل Leaflet ---------- */
  function loadScript(src, ms) {
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      const t = setTimeout(() => { s.remove(); fail(); }, ms);
      s.src = src;
      s.onload = () => { clearTimeout(t); ok(); };
      s.onerror = () => { clearTimeout(t); s.remove(); fail(); };
      document.head.appendChild(s);
    });
  }
  function loadCss(href) {
    return new Promise((ok) => {
      const l = document.createElement("link");
      const t = setTimeout(ok, 5000);
      l.rel = "stylesheet";
      l.href = href;
      l.onload = l.onerror = () => { clearTimeout(t); ok(); };
      document.head.appendChild(l);
    });
  }
  async function ensureLeaflet() {
    if (window.L) return true;
    for (const base of BASES) {
      try {
        await loadScript(base + "leaflet.js", 8000);
        if (window.L) { await loadCss(base + "leaflet.css"); return true; }
      } catch (e) { /* نجرب المصدر التالي */ }
    }
    return false;
  }

  /* لو فشل تحميل صور طبقة قبل أن يظهر أي مربع منها، نحوّل للطبقة الأخرى */
  function watchTiles(layer, other, name, otherName) {
    let ok = 0, bad = 0, switched = false;
    layer.on("tileload", () => { ok++; });
    layer.on("tileerror", () => {
      bad++;
      if (switched || ok > 0 || bad < 3 || !map.hasLayer(layer)) return;
      switched = true;
      map.removeLayer(layer);
      other.addTo(map);
      say("تعذّر تحميل " + name + "، تم التحويل إلى " + otherName + ".");
    });
  }

  /* ---------- بناء الخريطة ---------- */
  function buildMap() {
    const L = window.L;
    mapEl.replaceChildren();
    const placed = areas.filter(hasPos);
    const bounds = L.latLngBounds(placed.map((a) => [a.lat, a.lng]));

    map = L.map(mapEl, {
      center: [15.753, 32.5952],
      zoom: 17,
      minZoom: 15,
      maxZoom: 19,
      maxBounds: [[15.72, 32.56], [15.79, 32.63]], /* يبقي المستخدم قرب الجامعة */
      maxBoundsViscosity: 0.8,
      zoomControl: false,
      scrollWheelZoom: false,       /* حتى لا تعلق عجلة الفأرة أثناء تمرير الصفحة */
      dragging: !L.Browser.mobile,  /* على الموبايل: إصبعان للتحريك، وإصبع واحد يمرر الصفحة */
    });
    L.control.zoom({ position: "topleft" }).addTo(map);
    map.on("click", () => map.scrollWheelZoom.enable());
    map.on("mouseout", () => map.scrollWheelZoom.disable());

    const sat = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxNativeZoom: 18, maxZoom: 19, attribution: "صور جوية © Esri، Maxar، Earthstar Geographics" }
    );
    const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxNativeZoom: 19, maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">مساهمو OpenStreetMap</a>',
    });
    watchTiles(sat, osm, "الصورة الجوية", "الخريطة العادية");
    watchTiles(osm, sat, "الخريطة العادية", "الصورة الجوية");
    sat.addTo(map);
    L.control.layers({ "صورة جوية": sat, "خريطة عادية": osm }, null, { position: "topright", collapsed: false }).addTo(map);

    placed.forEach((a) => {
      const icon = L.divIcon({
        className: "gb-pin-wrap",
        html: `<span class="gb-pin"><b>${n(count(a.id))}</b></span>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      const m = L.marker([a.lat, a.lng], {
        icon, riseOnHover: true, draggable: edit,
        title: a.name + " — " + count(a.id) + " شجرة", alt: a.name,
      }).addTo(map);
      const tip = document.createElement("span");
      tip.textContent = a.name;
      m.bindTooltip(tip, { permanent: true, direction: "bottom", offset: [0, 24], className: "gb-tip" });
      m.on("click", () => select(a.id, true));
      if (edit) m.on("drag dragend", writeEditBox);
      markers[a.id] = m;
    });

    const fit = () => map.fitBounds(bounds, { padding: [80, 80], maxZoom: 18, animate: !reduceMotion });
    if (bounds.isValid()) fit();
    const fitBtn = document.getElementById("fit-all");
    if (fitBtn) fitBtn.addEventListener("click", fit);

    /* يعيد حساب المقاس لو تغيّر تخطيط الصفحة بعد التحميل */
    setTimeout(() => map.invalidateSize(), 300);
    window.addEventListener("load", () => map.invalidateSize());

    setupEdit();
  }

  function showError() {
    if (!mapEl) return;
    mapEl.innerHTML =
      '<p class="map-error" style="padding:2rem;text-align:center">تعذّر تحميل الخريطة. تأكد من الاتصال بالإنترنت ثم أعد تحميل الصفحة.</p>';
    const fitBtn = document.getElementById("fit-all");
    if (fitBtn) fitBtn.hidden = true;
  }

  /* ---------- الأزرار واللوحة الجانبية (تعمل حتى لو لم تُحمَّل الخريطة) ---------- */
  areas.forEach((a) => {
    const c = document.createElement("button");
    c.type = "button"; c.className = "chip"; c.dataset.id = a.id;
    c.innerHTML = `<span></span><b>${n(count(a.id))}</b>`;
    c.firstChild.textContent = a.name;
    c.addEventListener("click", () => select(a.id, true));
    chips.appendChild(c);
  });

  function select(id, fly) {
    currentId = id;
    Object.entries(markers).forEach(([k, m]) => {
      const e = m.getElement();
      if (e) e.classList.toggle("is-on", k === id);
    });
    chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-on", c.dataset.id === id));

    if (fly && map && markers[id]) {
      const to = markers[id].getLatLng();
      const z = Math.max(map.getZoom(), 18);
      if (reduceMotion) map.setView(to, z);
      else map.flyTo(to, z, { duration: 0.8 });
    }

    const list = trees.filter((t) => t.area === id);
    document.getElementById("panel-title").textContent = nameOf(areas, id);
    document.getElementById("panel-sub").textContent = n(list.length) + " شجرة في هذه المنطقة";
    const ul = document.getElementById("panel-list");
    ul.replaceChildren(...list.map((t) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong></strong><span></span><em class="badge badge-${t.status}"></em>`;
      li.querySelector("strong").textContent = t.name;
      li.querySelector("span").textContent = nameOf(colleges, t.college) + " · " + t.id;
      li.querySelector("em").textContent = STATUS[t.status] || "";
      return li;
    }));
    if (!list.length) ul.innerHTML = "<li class='panel-empty'>لا توجد أشجار مسجلة هنا بعد.</li>";
  }

  /* ---------- وضع ضبط المواقع (?edit=1) ---------- */
  function writeEditBox() {
    const out = document.getElementById("edit-out");
    if (!out) return;
    const lines = areas.map((a) => {
      const m = markers[a.id];
      const p = m ? m.getLatLng() : { lat: a.lat, lng: a.lng };
      const pos = Number.isFinite(p.lat) ? `, lat: ${p.lat.toFixed(5)}, lng: ${p.lng.toFixed(5)}` : "";
      return `    { id: "${a.id}", name: "${a.name}"${pos} },`;
    });
    out.value = "  areas: [\n" + lines.join("\n") + "\n  ],";
  }

  function setupEdit() {
    const box = document.getElementById("edit-box");
    if (!edit || !box) return;
    box.hidden = false;
    writeEditBox();
    const copy = document.getElementById("edit-copy");
    copy.addEventListener("click", async () => {
      const out = document.getElementById("edit-out");
      try { await navigator.clipboard.writeText(out.value); }
      catch (e) { out.select(); document.execCommand("copy"); }
      copy.textContent = "تم النسخ";
      setTimeout(() => (copy.textContent = "نسخ الإحداثيات"), 1800);
    });
  }

  /* ---------- التشغيل ---------- */
  select((areas.find((a) => count(a.id)) || areas[0]).id, false);

  if (mapEl) {
    mapEl.innerHTML = '<p class="map-error" style="padding:2rem;text-align:center">جاري تحميل الخريطة...</p>';
    ensureLeaflet().then((ok) => {
      if (!ok) return showError();
      buildMap();
      if (currentId) select(currentId, false); /* يلوّن الدبوس المختار */
    });
  }
})();
