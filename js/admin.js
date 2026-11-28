/* لوحة الإدارة: دخول عبر Supabase Auth، وتبويبات حسب الدور (admin / planting / photo).
   الحماية الفعلية في قاعدة البيانات (RLS + has_role)، وهذا الملف واجهة فقط. */
(function () {
  const GB = window.GB || {};
  const cfg = GB.supabase || {};
  const $ = (id) => document.getElementById(id);
  const SKEY = "gb-admin-session";
  let session = null, role = null;

  /* ---------- الجلسة ---------- */
  const save = (s) => { session = s; try { s ? sessionStorage.setItem(SKEY, JSON.stringify(s)) : sessionStorage.removeItem(SKEY); } catch (e) {} };
  const load = () => { try { return JSON.parse(sessionStorage.getItem(SKEY) || "null"); } catch (e) { return null; } };
  const mk = (j) => ({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000 - 30000, uid: j.user && j.user.id, email: j.user && j.user.email });

  function auth(grant, body) {
    return fetch(cfg.url + "/auth/v1/token?grant_type=" + grant, { method: "POST", headers: { apikey: cfg.key, "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })));
  }
  async function token() {
    if (!session) throw new Error("no session");
    if (Date.now() < session.expires_at) return session.access_token;
    const { ok, j } = await auth("refresh_token", { refresh_token: session.refresh_token });
    if (!ok) { save(null); location.reload(); throw new Error("expired"); }
    const old = session; save({ ...mk(j), uid: old.uid, email: old.email });
    return session.access_token;
  }
  async function api(path, opt) {
    const t = await token(), o = opt || {};
    const r = await fetch(cfg.url + "/rest/v1/" + path, { ...o, headers: { apikey: cfg.key, Authorization: "Bearer " + t, ...(o.headers || {}) } });
    if (!r.ok) throw new Error(path.split("?")[0] + " " + r.status);
    return o.method === "PATCH" ? null : r.json();
  }
  const patch = (path, body) => api(path, { method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(body) });

  /* ---------- الدخول ---------- */
  const lerr = $("ad-login-err");
  $("ad-login-form").addEventListener("submit", async (e) => {
    e.preventDefault(); lerr.hidden = true;
    const f = e.target.elements, b = $("ad-login-btn");
    if (!f.email.value || !f.password.value) { lerr.textContent = "اكتب البريد وكلمة المرور."; lerr.hidden = false; return; }
    b.disabled = true;
    try {
      const { ok, j } = await auth("password", { email: f.email.value.trim(), password: f.password.value });
      if (!ok) throw new Error("bad");
      save(mk(j)); await start();
    } catch (err) {
      lerr.textContent = err.message === "bad" ? "البريد أو كلمة المرور غير صحيحة." : err.message === "norole" ? "حسابك غير مفعّل كمشرف. كلّم المدير." : "تعذّر الدخول، حاول مرة أخرى.";
      lerr.hidden = false; if (err.message === "norole") save(null);
    } finally { b.disabled = false; }
  });
  $("ad-logout").addEventListener("click", () => { save(null); location.reload(); });

  /* ---------- البداية بعد الدخول ---------- */
  const TABS = { planting: ["plantings", "التوثيقات"], photo: ["photos", "الصور"] };
  async function start() {
    const rows = await api("admin_users?select=role,display_name&user_id=eq." + session.uid);
    if (!rows.length || !["admin", "planting", "photo"].includes(rows[0].role)) throw new Error("norole");
    role = rows[0].role;
    const label = { admin: "مدير", planting: "مشرف التوثيقات", photo: "مشرف الصور" }[role];
    $("ad-who").textContent = (rows[0].display_name || session.email || "") + " · " + label;
    $("ad-login").hidden = true; $("ad-app").hidden = false;
    const show = role === "admin" ? ["planting", "photo"] : [role];
    const nav = $("ad-tabs"); nav.textContent = "";
    show.forEach((k, i) => {
      const [id, name] = TABS[k];
      const b = document.createElement("button");
      b.type = "button"; b.className = "ad-tab"; b.dataset.tab = id; b.setAttribute("role", "tab");
      b.innerHTML = "<span></span><i></i>"; b.firstChild.textContent = name;
      b.addEventListener("click", () => select(id));
      nav.appendChild(b);
    });
    select(TABS[show[0]][0]);
    refreshCounts();
  }

  function select(id) {
    document.querySelectorAll(".ad-tab").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
    $("tab-plantings").hidden = id !== "plantings"; $("tab-photos").hidden = id !== "photos";
    (id === "plantings" ? loadPlantings : loadPhotos)();
  }

  /* عدّاد «قيد المراجعة» على التبويبات */
  async function refreshCounts() {
    const set = (tab, n) => { const t = document.querySelector('.ad-tab[data-tab="' + tab + '"] i'); if (t) t.textContent = n ? "(" + n.toLocaleString("ar-EG") + ")" : ""; };
    try {
      if (document.querySelector('[data-tab="plantings"]')) set("plantings", (await api("review_plantings?select=id&status=eq.pending")).length);
      if (document.querySelector('[data-tab="photos"]')) set("photos", (await api("review_photos?select=id&status=eq.pending&is_planting=eq.false")).length);
    } catch (e) {}
  }

  /* ---------- أدوات العرض ---------- */
  const imgUrl = (p) => cfg.url + "/storage/v1/object/public/gallery-photos/" + p;
  const fmt = (d) => d ? new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : "";
  const speciesName = (id) => ((GB.species || []).find((s) => s.id === id) || {}).name || id || "—";
  const areaName = (id) => ((GB.areas || []).find((a) => a.id === id) || {}).name || (id ? id : "غير محددة");

  function zoom(src) {
    const z = document.createElement("div"); z.className = "ad-zoom"; z.innerHTML = "<img alt=''>"; z.firstChild.src = src;
    z.addEventListener("click", () => z.remove()); document.body.appendChild(z);
  }
  function line(parent, text, cls) { const d = document.createElement("div"); if (cls) d.className = cls; d.textContent = text; parent.appendChild(d); return d; }

  /* بطاقة عامة: info (سطور)، actions (أزرار). تعيد الجسم لتجهيز الرفض بسبب */
  function card(o) {
    const el = document.createElement("article"); el.className = "ad-item";
    const img = document.createElement("img"); img.loading = "lazy"; img.alt = o.alt || ""; img.src = imgUrl(o.path || "");
    img.addEventListener("click", () => zoom(img.src)); el.appendChild(img);
    const info = document.createElement("div"); info.className = "ad-info";
    const t = document.createElement("b"); t.textContent = o.title; info.appendChild(t);
    o.lines.forEach((l) => line(info, l, "ad-mute"));
    el.appendChild(info);
    if (o.status === "pending") {
      const act = document.createElement("div"); act.className = "ad-act";
      o.buttons.forEach((b) => {
        const x = document.createElement("button"); x.type = "button"; x.className = "ad-btn" + (b.danger ? " ad-danger" : ""); x.textContent = b.label;
        x.addEventListener("click", () => b.danger ? askReason(el, act, b.run) : run(el, x, b.run));
        act.appendChild(x);
      });
      el.appendChild(act);
    } else {
      const s = document.createElement("div"); s.className = "ad-info";
      s.innerHTML = "<span class='ad-badge'></span>"; s.firstChild.textContent = o.status === "approved" ? "معتمد" : "مرفوض" + (o.reason ? ": " + o.reason : "");
      el.appendChild(s);
    }
    return el;
  }
  async function run(el, btn, fn, reason) {
    const all = el.querySelectorAll("button"); all.forEach((b) => (b.disabled = true));
    try { await fn(reason); el.remove(); refreshCounts(); emptyCheck(); }
    catch (e) { console.warn("[admin]", e); all.forEach((b) => (b.disabled = false)); alert("ما اكتملت العملية، تأكد من صلاحياتك والاتصال وحاول مرة أخرى."); }
  }
  function askReason(el, act, fn) {
    if (el.querySelector(".ad-reason")) return;
    act.hidden = true;
    const w = document.createElement("div"); w.className = "ad-reason";
    w.innerHTML = "<textarea placeholder='سبب الرفض (اختياري، يظهر للإدارة فقط)' maxlength='200'></textarea><div class='ad-act'><button type='button' class='ad-btn ad-danger'>تأكيد الرفض</button><button type='button' class='ad-btn ad-ghost'>إلغاء</button></div>";
    const [ok, no] = w.querySelectorAll("button");
    ok.addEventListener("click", () => run(el, ok, fn, w.querySelector("textarea").value.trim() || null));
    no.addEventListener("click", () => { w.remove(); act.hidden = false; });
    el.appendChild(w);
  }
  function emptyCheck() {
    ["pl-list", "ph-list"].forEach((id) => { const g = $(id); if (g && !g.children.length) line(g, "لا يوجد شيء هنا.", "ad-empty"); });
  }

  /* ---------- التوثيقات ---------- */
  async function loadPlantings() {
    const box = $("pl-list"), st = $("pl-filter").value; box.textContent = "";
    try {
      const rows = await api("review_plantings?select=*&status=eq." + st + "&order=created_at." + (st === "pending" ? "asc" : "desc") + "&limit=60");
      rows.forEach((r) => box.appendChild(card({
        path: r.storage_path, alt: "صورة الزراعة", status: r.status, reason: r.reject_reason,
        title: r.full_name + (r.public_name_ok ? "" : " (بدون إظهار الاسم)"),
        lines: [r.college_name || r.college_id, speciesName(r.species) + " · " + areaName(r.area_id), "زُرعت: " + fmt(r.planted_on) + " · أُرسلت: " + fmt(r.created_at)],
        buttons: [
          { label: "موافقة (+نقاط)", run: () => patch("planting_submissions?id=eq." + r.id + "&status=eq.pending", { status: "approved" }) },
          { label: "رفض", danger: true, run: (why) => patch("planting_submissions?id=eq." + r.id + "&status=eq.pending", { status: "rejected", reject_reason: why }) },
        ],
      })));
      emptyCheck();
    } catch (e) { line(box, "تعذّر تحميل التوثيقات.", "ad-empty"); }
  }
  $("pl-filter").addEventListener("change", loadPlantings); $("pl-reload").addEventListener("click", () => { loadPlantings(); refreshCounts(); });

  /* ---------- الصور ---------- */
  async function loadPhotos() {
    const box = $("ph-list"), st = $("ph-filter").value; box.textContent = "";
    try {
      const rows = await api("review_photos?select=*&is_planting=eq.false&status=eq." + st + "&order=created_at." + (st === "pending" ? "asc" : "desc") + "&limit=60");
      rows.forEach((r) => box.appendChild(card({
        path: r.storage_path, alt: r.title || "", status: r.status, reason: r.reject_reason,
        title: r.title || "صورة بدون عنوان",
        lines: [(r.photographer_name || "مصوّر غير معروف") + (r.college_name ? " · " + r.college_name : ""), (r.category || "") + (r.taken_on ? " · " + fmt(r.taken_on) : ""), r.consent_confirmed ? "✔ أقرّ بالملكية وموافقة من يظهر" : "⚠ لم يؤكد الموافقة"],
        buttons: [
          { label: "موافقة", run: () => patch("gallery_photos?id=eq." + r.id + "&status=eq.pending", { status: "approved" }) },
          { label: "موافقة ⭐ مميّزة", run: () => patch("gallery_photos?id=eq." + r.id + "&status=eq.pending", { status: "approved", featured: true }) },
          { label: "رفض", danger: true, run: (why) => patch("gallery_photos?id=eq." + r.id + "&status=eq.pending", { status: "rejected", reject_reason: why }) },
        ],
      })));
      emptyCheck();
    } catch (e) { line(box, "تعذّر تحميل الصور.", "ad-empty"); }
  }
  $("ph-filter").addEventListener("change", loadPhotos); $("ph-reload").addEventListener("click", () => { loadPhotos(); refreshCounts(); });

  /* ---------- استئناف الجلسة ---------- */
  if (!cfg.url || !cfg.key) { lerr.textContent = "إعدادات Supabase ناقصة في data.js"; lerr.hidden = false; return; }
  const old = load();
  if (old) { session = old; start().catch(() => { save(null); }); }
})();
