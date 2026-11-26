/* معرض المبادرة: لتغيير الصور عدّل المصفوفة SHOTS (ضع الصور في assets/) */
(function () {
  const SHOTS = [
    { src: "assets/g1.jpg", alt: "من فعاليات المبادرة" },
    { src: "assets/g2.jpg", alt: "من فعاليات المبادرة" },
    { src: "assets/g3.jpg", alt: "من فعاليات المبادرة" },
    { src: "assets/g4.jpg", alt: "من فعاليات المبادرة" },
    { src: "assets/about.jpg", alt: "من فعاليات المبادرة" },
  ];
  const grid = document.getElementById("gallery-grid");
  const box = document.getElementById("lightbox");
  const big = document.getElementById("lb-img");
  SHOTS.forEach((s) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "shot";
    b.innerHTML = `<img loading="lazy" alt="">`;
    const img = b.querySelector("img"); img.src = s.src; img.alt = s.alt;
    b.addEventListener("click", () => { big.src = s.src; big.alt = s.alt; box.showModal(); });
    grid.appendChild(b);
  });
  box.addEventListener("click", (e) => { if (e.target === box || e.target.closest(".lb-close")) box.close(); });

  /* قبل / بعد: العناصر من data.js → compare */
  (function () {
    const list = (window.GB && window.GB.compare) || [], box = document.getElementById("compare");
    if (!list.length || !box) return;
    list.forEach((c) => {
      const w = document.createElement("div");
      w.className = "ba";
      w.innerHTML = `<img alt="" class="ba-before"><img alt="" class="ba-after"><span class="ba-tag b">قبل</span><span class="ba-tag a">بعد</span><div class="ba-handle"></div><input type="range" min="0" max="100" value="50" aria-label="مقارنة قبل وبعد">`;
      const [b, a] = w.querySelectorAll("img");
      b.src = c.before; a.src = c.after; b.alt = (c.title || "المكان") + " قبل الزراعة"; a.alt = (c.title || "المكان") + " بعد الزراعة";
      w.querySelector("input").addEventListener("input", (e) => w.style.setProperty("--pos", e.target.value + "%"));
      box.appendChild(w);
      if (c.title) { const p = document.createElement("p"); p.className = "muted"; p.style.margin = "-.6rem 0 1.4rem"; p.textContent = c.title; box.appendChild(p); }
    });
    document.getElementById("compare-sec").hidden = false;
  })();
})();
