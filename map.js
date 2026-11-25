/* خريطة تشجير الجامعة: مخطط تقريبي يُرسم من data.js
   لتعديل أماكن العلامات غيّر POS (x و y داخل مساحة 640×440). */
(function () {
  const { areas, trees, colleges } = window.GB;
  const POS = {
    "library": [170, 120], "eng-labs": [470, 105], "zaqqum": [320, 230],
    "g10": [110, 310], "hurriya": [510, 300], "central-lib": [320, 370],
  };
  const NS = "http://www.w3.org/2000/svg";
  const n = (v) => v.toLocaleString("ar-EG");
  const svg = document.getElementById("campus-map");
  const chips = document.getElementById("area-chips");
  const STATUS = { planted: "مزروعة", documented: "موثقة" };
  const el = (name, attrs = {}, parent = svg) => {
    const e = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    parent.appendChild(e); return e;
  };
  const count = (id) => trees.filter((t) => t.area === id).length;

  /* الأرضية والممرات والمباني (شكل توضيحي) */
  el("rect", { x: 8, y: 8, width: 624, height: 424, rx: 28, class: "m-ground" });
  [["M40 120 H600"], ["M40 230 H600"], ["M40 340 H600"], ["M170 30 V410"], ["M320 30 V410"], ["M470 30 V410"]]
    .forEach(([d]) => el("path", { d, class: "m-road" }));
  [[60, 40], [220, 40], [380, 40], [540, 40], [60, 150], [220, 150], [380, 150], [540, 150], [60, 260], [220, 260], [380, 260], [540, 260]]
    .forEach(([x, y]) => el("rect", { x, y, width: 40, height: 28, rx: 6, class: "m-bld" }));

  const pins = {};
  const sel = { id: null };
  areas.forEach((a) => {
    const [x, y] = POS[a.id] || [320, 220];
    const g = el("g", { class: "m-pin", tabindex: 0, role: "button", "aria-label": a.name + " — " + count(a.id) + " شجرة", transform: `translate(${x} ${y})` });
    el("circle", { r: 26, class: "m-halo" }, g);
    el("circle", { r: 17, class: "m-dot" }, g);
    const t = el("text", { class: "m-num", y: 6, "text-anchor": "middle" }, g); t.textContent = n(count(a.id));
    const l = el("text", { class: "m-label", y: 46, "text-anchor": "middle" }, g); l.textContent = a.name;
    g.addEventListener("click", () => select(a.id));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(a.id); } });
    pins[a.id] = g;

    const c = document.createElement("button");
    c.type = "button"; c.className = "chip"; c.dataset.id = a.id;
    c.innerHTML = `<span></span><b>${n(count(a.id))}</b>`; c.firstChild.textContent = a.name;
    c.addEventListener("click", () => select(a.id));
    chips.appendChild(c);
  });

  const nameOf = (list, id) => (list.find((x) => x.id === id) || {}).name || "";
  function select(id) {
    sel.id = id;
    Object.entries(pins).forEach(([k, g]) => g.classList.toggle("is-on", k === id));
    chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-on", c.dataset.id === id));
    const list = trees.filter((t) => t.area === id);
    document.getElementById("panel-title").textContent = nameOf(areas, id);
    document.getElementById("panel-sub").textContent = n(list.length) + " شجرة في هذه المنطقة";
    const ul = document.getElementById("panel-list");
    ul.replaceChildren(...list.map((t) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong></strong><span></span><em class="badge badge-${t.status}">${STATUS[t.status]}</em>`;
      li.querySelector("strong").textContent = t.name;
      li.querySelector("span").textContent = nameOf(colleges, t.college) + " · " + t.id;
      return li;
    }));
    if (!list.length) ul.innerHTML = "<li class='panel-empty'>لا توجد أشجار مسجلة هنا بعد.</li>";
  }
  select((areas.find((a) => count(a.id)) || areas[0]).id);
})();
