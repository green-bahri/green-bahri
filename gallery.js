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
    b.innerHTML = `<img loading="lazy" alt=""><span class="badge badge-demo">تجريبي</span>`;
    const img = b.querySelector("img"); img.src = s.src; img.alt = s.alt;
    b.addEventListener("click", () => { big.src = s.src; big.alt = s.alt; box.showModal(); });
    grid.appendChild(b);
  });
  box.addEventListener("click", (e) => { if (e.target === box || e.target.closest(".lb-close")) box.close(); });
})();
