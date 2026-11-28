/* صفحة مساهمة الكليات (تصميم «البطولة»).
   الترتيب يُحسب من js/data.js: نقاط الكلية = عدد أشجارها × نقاط الشجرة.
   قواعد النقاط تطابق جدول point_rules في Supabase (راجع supabase_green_bahri_league.sql)،
   وعند ربط الصفحة بالقاعدة تُقرأ من هناك بدل هذه الأرقام. */
(function () {
  const RULES = { treePlanted: 100, competitionWin: 50 };
  const GB = window.GB || { colleges: [], trees: [] };
  const n = (v) => Number(v).toLocaleString("ar-EG");
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const rows = GB.colleges.map((c) => {
    const mine = GB.trees.filter((t) => t.college === c.id);
    return { id: c.id, name: c.name, trees: mine.length, points: mine.length * RULES.treePlanted };
  }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "ar"));
  const totalTrees = GB.trees.length;

  $("lg-colleges").textContent = n(rows.length);
  $("lg-per-tree").textContent = n(RULES.treePlanted);
  $("lg-trees-stat").textContent = n(totalTrees);
  $("lg-trees").textContent = n(totalTrees);
  $("lg-pt-tree").textContent = n(RULES.treePlanted);
  $("lg-pt-win1").textContent = n(RULES.competitionWin);
  $("lg-pt-win2").textContent = n(RULES.competitionWin);

  /* وسم "ترتيب تجريبي" يفضل ظاهر لأن أشجار data.js حالياً أمثلة. شيله من colleges.html لما تدخل البيانات الحقيقية. */

  const MEDAL = { 1: "🏆", 2: "🥈", 3: "🥉" };
  const LABEL = { 1: "المركز الأول", 2: "المركز الثاني", 3: "المركز الثالث" };
  const top = rows.slice(0, 3);
  const podium = $("podium");
  [top[1], top[0], top[2]].forEach((c) => {
    if (!c) return;
    const place = Math.min(1 + rows.filter((x) => x.points > c.points).length, 3); // التعادل = نفس المركز
    const el = document.createElement("article");
    el.className = "lg-place lg-place-" + place;
    el.innerHTML = '<div class="lg-medal">' + MEDAL[place] + '</div><small class="lg-place-label">' + LABEL[place] + '</small><h3></h3><p>' + n(c.trees) + ' شجرة</p><strong>' + n(c.points) + ' <small>نقطة</small></strong><div class="lg-step">' + n(place) + '</div>';
    el.querySelector("h3").textContent = c.name;
    podium.appendChild(el);
  });

  const ranking = $("ranking");
  const max = Math.max(...rows.map((r) => r.points), 1);
  rows.forEach((c, i) => {
    const gap = rows[0].points - c.points;
    const rank = 1 + rows.filter((x) => x.points > c.points).length;
    const el = document.createElement("div");
    el.className = "lg-rank";
    el.innerHTML = '<span class="lg-rankno">' + n(rank) + '</span><div><b></b><small></small><div class="lg-bar"><i data-w="' + Math.round((c.points / max) * 100) + '"></i></div></div><span class="lg-score">' + n(c.points) + '<small>نقطة</small></span>';
    el.querySelector("b").textContent = c.name;
    el.querySelector("small").textContent = n(c.points) + " نقطة · " + n(c.trees) + " شجرة · " + (rank === 1 ? "في الصدارة" : "الفارق عن الأولى " + n(gap) + " نقطة");
    ranking.appendChild(el);
  });

  /* حركة: تعبئة الأشرطة لما تظهر اللوحة */
  const fill = () => ranking.querySelectorAll(".lg-bar i").forEach((b) => (b.style.width = b.dataset.w + "%"));
  if (reduce || !("IntersectionObserver" in window)) fill();
  else new IntersectionObserver((es, io) => es.forEach((e) => { if (e.isIntersecting) { fill(); io.disconnect(); } }), { threshold: 0.2 }).observe(ranking);
})();
