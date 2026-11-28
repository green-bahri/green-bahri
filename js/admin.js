/* لوحة الإدارة — النواة: الدخول، الجلسة، التبويبات حسب الدور، وتبويبي التوثيقات والصور.
   باقي التبويبات (نظرة عامة، المشاركات، النقاط، الكليات والمسابقات، المشرفون) في admin-more.js.
   الحماية الفعلية في قاعدة البيانات (RLS + has_role + is_admin)، وهذا الملف واجهة فقط. */
(function () {
  const GB = window.GB || {};
  const cfg = GB.supabase || {};
  const $ = (id) => document.getElementById(id);
  const SKEY = "gb-admin-session";
  let session = null, role = null;

  /* ---------- أدوات DOM (بدون innerHTML من بيانات القاعدة) ---------- */
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (["value", "checked", "disabled", "hidden", "selected"].includes(k)) e[k] = v;
      else e.setAttribute(k, v);
    });
    (function add(list) { list.forEach((c) => { if (c == null || c === false) return; if (Array.isArray(c)) add(c); else e.appendChild(c.nodeType ? c : document.createTextNode(String(c))); }); })(kids);
    return e;
  }
  let toastT;
  function toast(text, bad) {
    let t = $("ad-toast");
    if (!t) { t = h("div", { id: "ad-toast", role: "status" }); document.body.appendChild(t); }
    t.textContent = text; t.className = "ad-toast" + (bad ? " bad" : ""); t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3800);
  }

  /* ---------- الجلسة ---------- */
  const save = (s) => { session = s; try { s ? sessionStorage.setItem(SKEY, JSON.stringify(s)) : sessionStorage.removeItem(SKEY); } catch (e) {} };
  const load = () => { try { return JSON.parse(sessionStorage.getItem(SKEY) || "null"); } catch (e) { return null; } };
  const mk = (j) => ({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000 - 30000, uid: j.user && j.user.id, email: j.user && j.user.email });
  function authCall(grant, body) {
    return fetch(cfg.url + "/auth/v1/token?grant_type=" + grant, { method: "POST", headers: { apikey: cfg.key, "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })));
  }
  async function token() {
    if (!session) throw new Error("no session");
    if (Date.now() < session.expires_at) return session.access_token;
    const { ok, j } = await authCall("refresh_token", { refresh_token: session.refresh_token });
    if (!ok) { save(null); location.reload(); throw new Error("expired"); }
    const old = session; save({ ...mk(j), uid: old.uid, email: old.email });
    return session.access_token;
  }

  /* ---------- طلبات القاعدة ---------- */
  async function raw(path, opt) {
    const t = await token(), o = opt || {};
    const r = await fetch(cfg.url + "/rest/v1/" + path, { ...o, headers: { apikey: cfg.key, Authorization: "Bearer " + t, ...(o.headers || {}) } });
    if (!r.ok) {
      let m = ""; try { m = (await r.json()).message || ""; } catch (e) {}
      const err = new Error(m || path.split("?")[0] + " " + r.status); err.status = r.status; err.code = r.status; throw err;
    }
    return r;
  }
  const api = (path) => raw(path).then((r) => r.json());
  const JSONH = { "Content-Type": "application/json", Prefer: "return=minimal" };
  const patch = (path, body) => raw(path, { method: "PATCH", headers: JSONH, body: JSON.stringify(body) });
  const post = (path, body) => raw(path, { method: "POST", headers: JSONH, body: JSON.stringify(body) });
  const del = (path) => raw(path, { method: "DELETE" });
  const rpc = (name, args) => raw("rpc/" + name, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args || {}) }).then((r) => r.text()).then((t) => (t ? JSON.parse(t) : null));
  const count = (path) => raw(path, { method: "HEAD", headers: { Prefer: "count=exact" } }).then((r) => parseInt((r.headers.get("content-range") || "").split("/")[1], 10) || 0);

  /* ---------- مساعدات عرض ---------- */
  const imgUrl = (p) => cfg.url + "/storage/v1/object/public/gallery-photos/" + p;
  const fmt = (d) => d ? new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : "";
  const num = (v) => Number(v || 0).toLocaleString("ar-EG");
  const speciesName = (id) => ((GB.species || []).find((s) => s.id === id) || {}).name || id || "—";
  const areaName = (id) => ((GB.areas || []).find((a) => a.id === id) || {}).name || (id || "غير محددة");

  function zoom(src) {
    const z = h("div", { class: "ad-zoom", onclick: () => z.remove() }, h("img", { src, alt: "" }));
    document.body.appendChild(z);
  }
  /* ينفّذ إجراء مع تعطيل الأزرار، ويعرض رسالة الخطأ الحقيقية من القاعدة */
  async function act(scope, fn, okMsg) {
    const btns = scope.querySelectorAll ? scope.querySelectorAll("button") : [];
    btns.forEach((b) => (b.disabled = true));
    try { await fn(); if (okMsg) toast(okMsg); return true; }
    catch (e) {
      console.warn("[admin]", e);
      toast(e.status === 409 ? "موجود مسبقاً." : e.message && /[؀-ۿ]/.test(e.message) ? e.message : "ما اكتملت العملية. تأكد من صلاحياتك والاتصال وحاول مرة أخرى.", true);
      return false;
    } finally { btns.forEach((b) => (b.disabled = false)); }
  }
  const empty = (box, text) => box.appendChild(h("div", { class: "ad-empty", text: text || "لا يوجد شيء هنا." }));
  const field = (label, input) => h("label", { class: "ad-f" }, label, input);

  /* بطاقة مراجعة: صورة اختيارية + معلومات + أزرار. الرفض بسبب لو danger وما فيه noReason */
  function card(o) {
    const el = h("article", { class: "ad-item" });
    if (o.path) { const src = imgUrl(o.path); el.appendChild(h("img", { src, alt: o.alt || "", loading: "lazy", onclick: () => zoom(src) })); }
    const info = h("div", { class: "ad-info" }, h("b", { text: o.title }), (o.lines || []).map((l) => h("div", { class: "ad-mute", text: l })));
    if (o.link) info.appendChild(h("a", { href: o.link, target: "_blank", rel: "noopener noreferrer", class: "ad-link", text: "🔗 فتح الرابط" }));
    if (o.status && o.status !== "pending") info.appendChild(h("span", { class: "ad-badge", text: (o.status === "approved" ? "معتمد" : "مرفوض") + (o.reason ? ": " + o.reason : "") + (o.winner ? " · 🏆 فائز" : "") }));
    el.appendChild(info);
    if (o.buttons && o.buttons.length) {
      const bar = h("div", { class: "ad-act" });
      o.buttons.forEach((b) => bar.appendChild(h("button", { type: "button", class: "ad-btn" + (b.danger ? " ad-danger" : ""), text: b.label,
        onclick: () => (b.danger && !b.noReason ? askReason(el, bar, b.run) : finish(el, b.run, undefined, b.confirm)) })));
      el.appendChild(bar);
    }
    return el;
  }
  async function finish(el, fn, reason, confirmText) {
    if (confirmText && !confirm(confirmText)) return;
    if (await act(el, () => fn(reason))) { el.remove(); refreshCounts(); }
  }
  function askReason(el, bar, fn) {
    if (el.querySelector(".ad-reason")) return;
    bar.hidden = true;
    const ta = h("textarea", { placeholder: "سبب الرفض (اختياري، يظهر للإدارة فقط)", maxlength: "200" });
    const w = h("div", { class: "ad-reason" }, ta, h("div", { class: "ad-act" },
      h("button", { type: "button", class: "ad-btn ad-danger", text: "تأكيد الرفض", onclick: () => finish(el, fn, ta.value.trim() || null) }),
      h("button", { type: "button", class: "ad-btn ad-ghost", text: "إلغاء", onclick: () => { w.remove(); bar.hidden = false; } })));
    el.appendChild(w);
  }
  /* قائمة بطاقات مع فلتر حالة وزر تحديث */
  function reviewPane(id, noteText, loader) {
    const list = h("div", { class: "ad-grid" });
    const filter = h("select", { "aria-label": "الحالة", onchange: reload }, h("option", { value: "pending", text: "قيد المراجعة" }), h("option", { value: "approved", text: "المعتمدة" }), h("option", { value: "rejected", text: "المرفوضة" }));
    async function reload() {
      list.textContent = "";
      try { const n = await loader(filter.value, list); if (!list.children.length) empty(list); return n; }
      catch (e) { console.warn("[admin]", e); empty(list, "تعذّر التحميل."); }
    }
    const pane = $("tab-" + id);
    pane.appendChild(h("div", { class: "ad-bar" }, filter, h("button", { type: "button", class: "ad-btn ad-ghost", text: "تحديث", onclick: () => { reload(); refreshCounts(); } })));
    if (noteText) pane.appendChild(h("p", { class: "ad-mute ad-note", text: noteText }));
    pane.appendChild(list);
    return reload;
  }

  /* ---------- سجل التبويبات ---------- */
  const REG = [];
  function register(t) { REG.push(t); }

  async function refreshCounts() {
    for (const t of REG) {
      if (!t.count || !t.btn) continue;
      try { const n = await t.count(); t.btn.querySelector("i").textContent = n ? "(" + num(n) + ")" : ""; } catch (e) {}
    }
  }
  function select(id) {
    REG.forEach((t) => {
      if (!t.btn) return;
      t.btn.setAttribute("aria-selected", String(t.id === id));
      $("tab-" + t.id).hidden = t.id !== id;
    });
    const t = REG.find((x) => x.id === id); if (t && t.load) t.load();
  }

  /* ---------- الدخول ---------- */
  const lerr = $("ad-login-err");
  $("ad-login-form").addEventListener("submit", async (e) => {
    e.preventDefault(); lerr.hidden = true;
    const f = e.target.elements, b = $("ad-login-btn");
    if (!f.email.value || !f.password.value) { lerr.textContent = "اكتب البريد وكلمة المرور."; lerr.hidden = false; return; }
    b.disabled = true;
    try {
      const { ok, j } = await authCall("password", { email: f.email.value.trim(), password: f.password.value });
      if (!ok) throw new Error("bad");
      save(mk(j)); await start();
    } catch (err) {
      lerr.textContent = err.message === "bad" ? "البريد أو كلمة المرور غير صحيحة." : err.message === "norole" ? "حسابك غير مفعّل كمشرف. كلّم المدير." : "تعذّر الدخول، حاول مرة أخرى.";
      lerr.hidden = false; if (err.message === "norole") save(null);
    } finally { b.disabled = false; }
  });
  $("ad-logout").addEventListener("click", () => { save(null); location.reload(); });

  async function start() {
    const rows = await api("admin_users?select=role,display_name&user_id=eq." + session.uid);
    if (!rows.length || !["admin", "planting", "photo"].includes(rows[0].role)) throw new Error("norole");
    role = rows[0].role;
    $("ad-who").textContent = (rows[0].display_name || session.email || "") + " · " + { admin: "مدير", planting: "مشرف التوثيقات", photo: "مشرف الصور" }[role];
    $("ad-login").hidden = true; $("ad-app").hidden = false;
    const nav = $("ad-tabs"); nav.textContent = "";
    REG.sort((a, b) => a.order - b.order).filter((t) => t.roles.includes(role)).forEach((t) => {
      if (!$("tab-" + t.id)) $("ad-app").appendChild(h("section", { class: "ad-pane", id: "tab-" + t.id, hidden: true }));
      if (!t.ready) { t.init($("tab-" + t.id)); t.ready = true; }
      t.btn = h("button", { type: "button", class: "ad-tab", role: "tab", onclick: () => select(t.id) }, h("span", { text: t.label }), h("i"));
      nav.appendChild(t.btn);
    });
    const first = REG.find((t) => t.btn);
    if (first) select(first.id);
    refreshCounts();
  }

  /* ---------- تبويب التوثيقات ---------- */
  register({ id: "plantings", label: "التوثيقات", roles: ["admin", "planting"], order: 2,
    count: () => count("review_plantings?select=id&status=eq.pending"),
    init(pane) {
      this.load = reviewPane("plantings", "", async (st, box) => {
        const rows = await api("review_plantings?select=*&status=eq." + st + "&order=created_at." + (st === "pending" ? "asc" : "desc") + "&limit=60");
        rows.forEach((r) => box.appendChild(card({
          path: r.storage_path, alt: "صورة الزراعة", status: r.status, reason: r.reject_reason,
          title: r.full_name + (r.public_name_ok ? "" : " (بدون إظهار الاسم)"),
          lines: [r.college_name || r.college_id, speciesName(r.species) + " · " + areaName(r.area_id), "زُرعت: " + fmt(r.planted_on) + " · أُرسلت: " + fmt(r.created_at)],
          buttons: r.status !== "pending" ? [] : [
            { label: "موافقة (+نقاط)", run: () => patch("planting_submissions?id=eq." + r.id + "&status=eq.pending", { status: "approved" }) },
            { label: "رفض", danger: true, run: (why) => patch("planting_submissions?id=eq." + r.id + "&status=eq.pending", { status: "rejected", reject_reason: why }) },
          ],
        })));
      });
    } });

  /* ---------- تبويب الصور ---------- */
  register({ id: "photos", label: "الصور", roles: ["admin", "photo"], order: 3,
    count: () => count("review_photos?select=id&status=eq.pending&is_planting=eq.false"),
    init(pane) {
      this.load = reviewPane("photos", "صور توثيق الزراعة لا تظهر هنا، فهي تُراجَع مع التوثيق نفسه.", async (st, box) => {
        const rows = await api("review_photos?select=*&is_planting=eq.false&status=eq." + st + "&order=created_at." + (st === "pending" ? "asc" : "desc") + "&limit=60");
        rows.forEach((r) => box.appendChild(card({
          path: r.storage_path, alt: r.title || "", status: r.status, reason: r.reject_reason, title: r.title || "صورة بدون عنوان",
          lines: [(r.photographer_name || "مصوّر غير معروف") + (r.college_name ? " · " + r.college_name : ""), (r.category || "") + (r.taken_on ? " · " + fmt(r.taken_on) : ""), r.consent_confirmed ? "✔ أقرّ بالملكية وموافقة من يظهر" : "⚠ لم يؤكد الموافقة"],
          buttons: r.status !== "pending" ? [] : [
            { label: "موافقة", run: () => patch("gallery_photos?id=eq." + r.id + "&status=eq.pending", { status: "approved" }) },
            { label: "موافقة ⭐ مميّزة", run: () => patch("gallery_photos?id=eq." + r.id + "&status=eq.pending", { status: "approved", featured: true }) },
            { label: "رفض", danger: true, run: (why) => patch("gallery_photos?id=eq." + r.id + "&status=eq.pending", { status: "rejected", reject_reason: why }) },
          ],
        })));
      });
    } });

  /* ---------- واجهة للملفات الإضافية ---------- */
  window.GBAdmin = { GB, cfg, h, $, toast, api, patch, post, del, rpc, count, imgUrl, fmt, num, speciesName, areaName, act, empty, field, card, reviewPane, register, select, refreshCounts, me: () => session && session.uid };

  /* ---------- استئناف الجلسة (بعد تحميل كل ملفات JS) ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    if (!cfg.url || !cfg.key) { lerr.textContent = "إعدادات Supabase ناقصة في data.js"; lerr.hidden = false; return; }
    const old = load();
    if (old) { session = old; start().catch(() => save(null)); }
  });
})();
