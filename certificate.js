/* شهادة زراعة: تُرسم على canvas في المتصفح فقط، لا يُرسل أي شيء لأي مكان.
   - الألوان والنصوص في الدالة draw(). */
(function () {
  const { species, colleges } = window.GB;
  const $ = (id) => document.getElementById(id);
  const cv = $("cert"), ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  const C = { primary: "#245c45", dark: "#173f30", natural: "#a4c3a2", bg: "#e8f1e9", brown: "#8b6347", cream: "#f8f6f0", text: "#26352d" };

  species.forEach((s) => $("c-species").add(new Option(s.name + (s.kind === "shade" ? " (ظل)" : " (زينة)"), s.id)));
  colleges.forEach((c) => $("c-college").add(new Option(c.name, c.id)));
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  $("c-date").value = today.toISOString().slice(0, 10);

  const imgs = {};
  function load(src) {
    if (imgs[src]) return imgs[src];
    imgs[src] = new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
    return imgs[src];
  }
  const serial = "GB-" + Math.random().toString(36).slice(2, 7).toUpperCase();

  function fit(text, max, size, weight) { // يصغّر الخط لو النص طويل
    let s = size; ctx.font = `${weight} ${s}px Tajawal, sans-serif`;
    while (ctx.measureText(text).width > max && s > 30) { s -= 4; ctx.font = `${weight} ${s}px Tajawal, sans-serif`; }
    return s;
  }
  function line(text, y, size, color, weight = 700, max = 1100) {
    ctx.fillStyle = color; fit(text, max, size, weight); ctx.fillText(text, W / 2, y);
  }

  async function draw() {
    try { await document.fonts.load("800 60px Tajawal"); await document.fonts.load("500 30px Tajawal"); } catch (e) {}
    const name = $("c-name").value.trim() || "اسمك هنا";
    const sp = species.find((s) => s.id === $("c-species").value) || species[0];
    const col = colleges.find((c) => c.id === $("c-college").value);
    const d = $("c-date").value ? new Date($("c-date").value) : new Date();
    const date = d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    const [logo, pic] = await Promise.all([load("assets/logo.png"), load("assets/species/" + sp.img + ".webp")]);

    ctx.direction = "rtl"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.cream; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#ffffff"); g.addColorStop(1, C.bg);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // إطار مزدوج
    ctx.strokeStyle = C.primary; ctx.lineWidth = 14; ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.strokeStyle = C.natural; ctx.lineWidth = 3; ctx.strokeRect(68, 68, W - 136, H - 136);
    // أوراق في الزوايا
    [[68, 68, 1, 1], [W - 68, 68, -1, 1], [68, H - 68, 1, -1], [W - 68, H - 68, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.fillStyle = C.primary;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(70, 0, 110, 40, 110, 110); ctx.bezierCurveTo(40, 110, 0, 70, 0, 0); ctx.fill(); ctx.restore();
    });
    ctx.fillStyle = C.primary; ctx.beginPath(); ctx.arc(W / 2, 185, 82, 0, Math.PI * 2); ctx.fill();
    if (logo) { const h = 110, w = (logo.width / logo.height) * h; ctx.drawImage(logo, W / 2 - w / 2, 130, w, h); }
    line("شهادة زراعة", 350, 120, C.dark, 900);
    line("تشهد مبادرة نهضة جامعة بحري – حملة التشجير الكبرى بأن", 425, 40, C.text, 500, 1200);
    line(name, 560, 110, C.primary, 900, 1000);
    ctx.strokeStyle = C.natural; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(W / 2 - 330, 595); ctx.lineTo(W / 2 + 330, 595); ctx.stroke();
    line("قد ساهم بزراعة شجرة", 665, 44, C.text, 500);
    line(sp.name, 745, 76, C.brown, 800, 700);
    if (col) line("باسم " + col.name, 805, 38, C.text, 500);
    if (pic) { const ar = pic.width / pic.height, w = Math.min(250, ar * 150), h = w / ar; ctx.drawImage(pic, W / 2 - w / 2, 835, w, h); }
    line("«شتلة بتفرق»", 1040, 44, C.primary, 800);
    ctx.textAlign = "right"; ctx.fillStyle = C.text; ctx.font = "500 28px Tajawal, sans-serif";
    ctx.fillText("التاريخ: " + date, W - 230, H - 112);
    ctx.textAlign = "left"; ctx.direction = "ltr"; ctx.font = "700 26px Poppins, sans-serif"; ctx.fillStyle = C.primary;
    ctx.fillText("No. " + serial, 230, H - 112);
    ctx.direction = "rtl";
  }

  let t = 0;
  ["c-name", "c-species", "c-college", "c-date"].forEach((id) => $(id).addEventListener("input", () => { clearTimeout(t); t = setTimeout(draw, 120); }));
  $("cert-form").addEventListener("submit", (e) => e.preventDefault());

  function blob() { return new Promise((ok) => { try { cv.toBlob(ok, "image/png"); } catch (e) { ok(null); } }); }
  async function file() {
    await draw();
    const b = await blob();
    if (!b) $("c-note").textContent = "تعذّر إنشاء الصورة. افتح الموقع من رابطه على الإنترنت وجرّب مرة ثانية.";
    return b;
  }
  $("c-dl").addEventListener("click", async () => {
    if (!$("c-name").value.trim()) { $("c-name").focus(); $("c-note").textContent = "اكتب اسمك أولاً."; return; }
    const b = await file(); if (!b) return;
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "شهادة-زراعة-جرين-بحري.png";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    $("c-note").textContent = "تم التحميل. شاركها مع أصدقائك!";
  });
  if (navigator.canShare) {
    $("c-share").hidden = false;
    $("c-share").addEventListener("click", async () => {
      if (!$("c-name").value.trim()) { $("c-name").focus(); return; }
      const b = await file(); if (!b) return;
      const f = new File([b], "شهادة-زراعة.png", { type: "image/png" });
      if (navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: "شهادة زراعة – جرين بحري", text: "زرعت أثراً في جامعة بحري 🌱" }); } catch (e) {} }
    });
  }
  draw();
})();
