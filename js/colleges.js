/* صفحة مساهمة الكليات (تصميم «البطولة»).
   المصدر الأساسي: Supabase (college_leaderboard, point_rules, competitions, badges, participant_leaderboard).
   لو القاعدة ما ردّت (أو الإعدادات ناقصة) نرجع لـ js/data.js كاحتياط ويظهر وسم «ترتيب تجريبي». */
(function () {
  const GB = window.GB || { colleges: [], trees: [] };
  const n = (v) => Number(v).toLocaleString("ar-EG");
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cfg = GB.supabase || {};

  /* استعلام REST مباشر (بدون مكتبة): يرجع مصفوفة أو يرمي خطأ */
  function q(path) {
    return fetch(cfg.url + "/rest/v1/" + path, { headers: { apikey: cfg.key, Authorization: "Bearer " + cfg.key } })
      .then((r) => { if (!r.ok) throw new Error(path + " → " + r.status); return r.json(); });
  }

  function load() {
    if (!cfg.url || !cfg.key) return Promise.reject(new Error("no supabase config"));
    return Promise.all([
      q("college_leaderboard?select=college_id,name,points,trees_planted,wins,students"),
      q("point_rules?select=action_type,points"),
      q("competitions?select=id,kind,title,description,icon,subtitle,is_featured,sort_order,points_text,win_points&order=sort_order.asc"),
      q("badges?select=id,title,description,icon&order=sort_order.asc"),
      q("participant_leaderboard?select=full_name,college_id,points,trees_planted&order=trees_planted.desc,points.desc&limit=6"),
    ]).then(([colleges, rules, comps, badges, students]) => ({ colleges, rules, comps, badges, students }));
  }

  function fallback() {
    const rows = GB.colleges.map((c) => {
      const mine = GB.trees.filter((t) => t.college === c.id);
      return { id: c.id, name: c.name, trees: mine.length, points: mine.length * 100 };
    });
    return { rows, rules: { tree_planted: 100, competition_win: 50 }, demo: true };
  }

  function fromDb(d) {
    const rules = {};
    d.rules.forEach((r) => (rules[r.action_type] = r.points));
    const rows = d.colleges.map((c) => ({ id: c.college_id, name: c.name, trees: c.trees_planted, points: c.points }));
    return { rows, rules, demo: false };
  }

  function renderRanking(rows, rules, demo) {
    rows.sort((a, b) => b.points - a.points || b.trees - a.trees || a.name.localeCompare(b.name, "ar"));
    const perTree = rules.tree_planted != null ? rules.tree_planted : 100;
    const win = rules.competition_win != null ? rules.competition_win : 50;
    const totalTrees = rows.reduce((s, r) => s + r.trees, 0);

    $("lg-colleges").textContent = n(rows.length);
    $("lg-per-tree").textContent = n(perTree);
    $("lg-trees-stat").textContent = n(totalTrees);
    $("lg-trees").textContent = n(totalTrees);
    $("lg-pt-tree").textContent = n(perTree);
    $("lg-pt-win1").textContent = n(win);
    $("lg-pt-win2").textContent = n(win);
    const tag = $("lg-demo-tag");
    if (tag) tag.hidden = !demo;

    const MEDAL = { 1: "🏆", 2: "🥈", 3: "🥉" };
    const LABEL = { 1: "المركز الأول", 2: "المركز الثاني", 3: "المركز الثالث" };
    const podium = $("podium");
    podium.textContent = "";
    const top = rows.slice(0, 3);
    [top[1], top[0], top[2]].forEach((c) => {
      if (!c) return;
      const place = Math.min(1 + rows.filter((x) => x.points > c.points).length, 3);
      const el = document.createElement("article");
      el.className = "lg-place lg-place-" + place;
      el.innerHTML = '<div class="lg-medal">' + MEDAL[place] + '</div><small class="lg-place-label">' + LABEL[place] + '</small><h3></h3><p>' + n(c.trees) + ' شجرة</p><strong>' + n(c.points) + ' <small>نقطة</small></strong><div class="lg-step">' + n(place) + '</div>';
      el.querySelector("h3").textContent = c.name;
      podium.appendChild(el);
    });

    const ranking = $("ranking");
    ranking.textContent = "";
    const max = Math.max(...rows.map((r) => r.points), 1);
    rows.forEach((c) => {
      const gap = rows[0].points - c.points;
      const rank = 1 + rows.filter((x) => x.points > c.points).length;
      const el = document.createElement("div");
      el.className = "lg-rank";
      el.innerHTML = '<span class="lg-rankno">' + n(rank) + '</span><div><b></b><small></small><div class="lg-bar"><i data-w="' + Math.round((c.points / max) * 100) + '"></i></div></div><span class="lg-score">' + n(c.points) + '<small>نقطة</small></span>';
      el.querySelector("b").textContent = c.name;
      el.querySelector("small").textContent = n(c.points) + " نقطة · " + n(c.trees) + " شجرة · " + (rank === 1 ? (c.points === 0 ? "ابدأوا بالزراعة!" : "في الصدارة") : "الفارق عن الأولى " + n(gap) + " نقطة");
      ranking.appendChild(el);
    });

    const fill = () => ranking.querySelectorAll(".lg-bar i").forEach((b) => (b.style.width = b.dataset.w + "%"));
    if (reduce || !("IntersectionObserver" in window)) fill();
    else new IntersectionObserver((es, io) => es.forEach((e) => { if (e.isIntersecting) { fill(); io.disconnect(); } }), { threshold: 0.2 }).observe(ranking);
  }

  /* بطاقات المهام من جدول competitions (لو فاضي نخلي البطاقات الثابتة في الـHTML) */
  function renderTasks(comps, rules) {
    if (!comps.length) return;
    const box = document.querySelector(".lg-tasks");
    box.textContent = "";
    comps.forEach((c) => {
      const el = document.createElement("article");
      if (c.is_featured) el.className = "lg-featured";
      let pts;
      if (c.points_text) pts = '<small></small>';
      else if (c.kind === "planting") pts = "<i></i> <small>نقطة لكل شجرة</small>";
      else pts = "<i></i> <small>نقطة للفائز</small>";
      el.innerHTML = (c.is_featured ? "<em>المسابقة الكبرى</em>" : "") + "<span></span><div><small></small><b></b><p></p></div><strong>" + pts + "</strong>";
      el.querySelector("span").textContent = c.icon || "🌿";
      const d = el.querySelector("div");
      d.querySelector("small").textContent = c.subtitle || "";
      d.querySelector("b").textContent = c.title;
      d.querySelector("p").textContent = c.description || "";
      const s = el.querySelector("strong");
      if (c.points_text) s.querySelector("small").textContent = c.points_text;
      else s.querySelector("i").textContent = n(c.kind === "planting" ? (rules.tree_planted != null ? rules.tree_planted : 100) : (c.win_points != null ? c.win_points : (rules.competition_win != null ? rules.competition_win : 50)));
      box.appendChild(el);
    });
  }

  function renderBadges(badges) {
    if (!badges.length) return;
    const box = document.querySelector(".lg-awards");
    box.textContent = "";
    badges.forEach((b) => {
      const el = document.createElement("article");
      el.innerHTML = "<span></span><div><b></b><p></p></div>";
      el.querySelector("span").textContent = b.icon || "🏅";
      el.querySelector("b").textContent = b.title;
      el.querySelector("p").textContent = b.description || "";
      box.appendChild(el);
    });
  }

  function renderStudents(students, colleges) {
    if (!students.length) return; // نخلي رسالة "لا توجد أسماء بعد"
    const names = {};
    colleges.forEach((c) => (names[c.college_id] = c.name));
    const box = $("student-list");
    box.textContent = "";
    students.forEach((s) => {
      const el = document.createElement("div");
      el.innerHTML = "<b></b><small></small>";
      el.querySelector("b").textContent = s.full_name;
      el.querySelector("small").textContent = (names[s.college_id] || "") + " · " + n(s.trees_planted) + " شجرة · " + n(s.points) + " نقطة";
      box.appendChild(el);
    });
  }

  /* التشغيل: نحاول القاعدة، وأي فشل = احتياط data.js */
  load().then((d) => {
    const r = fromDb(d);
    renderRanking(r.rows, r.rules, false);
    renderTasks(d.comps, r.rules);
    renderBadges(d.badges);
    renderStudents(d.students, d.colleges);
  }).catch((e) => {
    console.warn("[colleges] تعذّر الاتصال بالقاعدة، نعرض بيانات data.js:", e);
    const f = fallback();
    renderRanking(f.rows, f.rules, true);
  });
})();
