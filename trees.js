(function () {
  const { areas, colleges, trees } = window.GB;
  const byId = (list, id) => (list.find((x) => x.id === id) || {}).name || "";
  const STATUS = { planted: "مزروعة", documented: "موثقة" };
  const $ = (id) => document.getElementById(id);

  function fill(sel, list) {
    list.forEach((x) => sel.add(new Option(x.name, x.id)));
  }
  fill($("f-area"), areas);
  fill($("f-college"), colleges);

  const LEAF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>';

  function card(t) {
    const el = document.createElement("article");
    el.className = "card tree";
    const date = new Date(t.date).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    el.innerHTML = `
      <div class="tree-top">
        <div class="card-icon">${LEAF}</div>
        <span class="badge badge-${t.status}">${STATUS[t.status]}</span>
      </div>
      <h3></h3>
      <ul class="tree-meta"><li></li><li></li><li></li></ul>
      <small class="tree-id"></small>`;
    el.querySelector("h3").textContent = t.name;
    const li = el.querySelectorAll("li");
    li[0].textContent = "📍 " + byId(areas, t.area);
    li[1].textContent = "🎓 " + byId(colleges, t.college);
    li[2].textContent = "🗓 " + date;
    el.querySelector(".tree-id").textContent = t.id;
    return el;
  }

  function render() {
    const q = $("f-q").value.trim();
    const a = $("f-area").value, c = $("f-college").value, s = $("f-status").value;
    const list = trees.filter((t) =>
      (!q || t.name.includes(q) || t.id.toLowerCase().includes(q.toLowerCase())) &&
      (!a || t.area === a) && (!c || t.college === c) && (!s || t.status === s));
    const grid = $("tree-grid");
    grid.replaceChildren(...list.map(card));
    $("tree-count").textContent = list.length.toLocaleString("ar-EG") + " شجرة";
    $("tree-empty").hidden = list.length > 0;
  }
  ["f-q", "f-area", "f-college", "f-status"].forEach((id) => $(id).addEventListener("input", render));
  render();
})();
