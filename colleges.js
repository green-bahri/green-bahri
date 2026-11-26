/* لوحة صدارة الكليات: تُحسب من data.js (عدد الأشجار لكل كلية) */
(function () {
  const { colleges, trees } = window.GB;
  const rows = colleges
    .map((c) => ({ ...c, total: trees.filter((t) => t.college === c.id).length, doc: trees.filter((t) => t.college === c.id && t.status === "documented").length }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "ar"));
  const max = Math.max(...rows.map((r) => r.total), 1);
  const n = (v) => v.toLocaleString("ar-EG");
  const set = (id, v) => (document.getElementById(id).textContent = n(v));
  set("sum-colleges", rows.length);
  set("sum-trees", trees.length);
  set("sum-doc", trees.filter((t) => t.status === "documented").length);

  const CROWN = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 18 2 7l5.5 4.5L12 4l4.5 7.5L22 7l-1 11H3Zm0 2h18v2H3v-2Z"/></svg>';
  rows.forEach((r) => (r.rank = 1 + rows.filter((x) => x.total > r.total).length)); // التعادل = نفس المركز
  const top = rows.slice(0, 3);
  /* ترتيب العرض: الثاني، الأول، الثالث */
  const order = [top[1], top[0], top[2]].filter(Boolean);
  const podium = document.getElementById("podium");
  order.forEach((r) => {
    const place = r.rank;
    const el = document.createElement("div");
    el.className = "pod pod-" + place;
    el.innerHTML = `${place === 1 ? '<span class="pod-crown">' + CROWN + "</span>" : ""}
      <span class="pod-name"></span>
      <strong class="pod-num" data-to="${r.total}">0</strong><small>شجرة</small>
      <div class="pod-step"><b>${n(place)}</b></div>`;
    el.querySelector(".pod-name").textContent = r.name;
    el.style.setProperty("--h", Math.max(28, Math.round((r.total / max) * 100)) + "%");
    podium.appendChild(el);
  });

  const board = document.getElementById("board");
  rows.forEach((r, i) => {
    const li = document.createElement("li");
    li.className = "row" + (r.rank === 1 ? " is-first" : "");
    const above = rows.filter((x) => x.total > r.total).map((x) => x.total);
    const ahead = above.length ? Math.min(...above) - r.total : 0;
    const gap = r.rank === 1 ? "في الصدارة، حافظوا عليها!" : "تبعد " + (ahead === 1 ? "شجرة واحدة" : ahead === 2 ? "شجرتين" : n(ahead) + (ahead <= 10 ? " أشجار" : " شجرة")) + " عن المركز الأعلى";
    li.innerHTML = `<span class="rank">${n(r.rank)}</span>
      <div class="row-main"><div class="row-top"><h3></h3><strong data-to="${r.total}">0</strong></div>
      <div class="bar" role="img" aria-label="نسبة المساهمة"><i data-w="${Math.round((r.total / max) * 100)}"></i></div>
      <small></small></div>`;
    li.querySelector("h3").textContent = r.name;
    li.querySelector("small").textContent = gap + " · " + n(r.doc) + " موثّقة";
    board.appendChild(li);
  });

  /* حركة: تعبئة الأشرطة والعدّ التصاعدي لما تظهر اللوحة */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function count(el) {
    const to = +el.dataset.to; if (reduce || !to) { el.textContent = n(to); return; }
    const t0 = performance.now(), d = 1100;
    (function step(t) { const p = Math.min(1, (t - t0) / d); el.textContent = n(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  function play(root) {
    root.querySelectorAll("[data-to]").forEach(count);
    root.querySelectorAll("[data-w]").forEach((b) => (b.style.width = b.dataset.w + "%"));
    root.classList.add("is-in");
  }
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { play(e.target); io.unobserve(e.target); } }), { threshold: 0.25 }) : null;
  [podium, board].forEach((r) => (io ? io.observe(r) : play(r)));
})();
