/* مساهمة الكليات: تحسب من data.js (أرقام تجريبية) */
(function () {
  const { colleges, trees } = window.GB;
  const rows = colleges
    .map((c) => ({
      ...c,
      total: trees.filter((t) => t.college === c.id).length,
      doc: trees.filter((t) => t.college === c.id && t.status === "documented").length,
    }))
    .sort((a, b) => b.total - a.total);
  const max = Math.max(...rows.map((r) => r.total), 1);
  const n = (v) => v.toLocaleString("ar-EG");
  const set = (id, v) => (document.getElementById(id).textContent = n(v));
  set("sum-colleges", rows.length);
  set("sum-trees", trees.length);
  set("sum-doc", trees.filter((t) => t.status === "documented").length);

  const grid = document.getElementById("college-grid");
  rows.forEach((r, i) => {
    const el = document.createElement("article");
    el.className = "card college";
    el.innerHTML = `
      <div class="college-top"><span class="rank">${n(i + 1)}</span><span class="badge badge-demo">تجريبي</span></div>
      <h3></h3>
      <strong class="college-num">${n(r.total)}</strong><span class="college-lbl">شجرة</span>
      <div class="bar" role="img" aria-label="نسبة المساهمة"><i style="width:${Math.round((r.total / max) * 100)}%"></i></div>
      <small>${n(r.doc)} موثّقة من ${n(r.total)}</small>`;
    el.querySelector("h3").textContent = r.name;
    grid.appendChild(el);
  });
})();
