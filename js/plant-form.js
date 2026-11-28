/* نافذة «ازرع ووثّق» في صفحة الكليات.
   كل توثيق = شجرة واحدة. الترتيب: مشارك ← رفع الصورة ← صورة المعرض (pending) ← التوثيق (pending).
   الزائر يكتب فقط (RLS)، فكل الإدخالات بدون .select() و Prefer: return=minimal. الـuuid يتولّد هنا. */
(function () {
  const GB = window.GB || {};
  const cfg = GB.supabase || {};
  const dlg = document.getElementById("plant-dlg");
  if (!dlg || !cfg.url || !cfg.key) return;
  if (typeof dlg.showModal !== "function") { document.querySelectorAll("[data-open-plant]").forEach((b) => (b.hidden = true)); return; }

  const form = document.getElementById("plant-form");
  const $ = (id) => document.getElementById(id);
  const msg = $("pf-msg"), send = $("pf-send"), prev = $("pf-preview");
  const KEY = "gb-participant";
  const MAX_SIDE = 1600, COOLDOWN_MS = 20000;
  let lastSent = 0, collegesLoaded = false;

  const H = { apikey: cfg.key, Authorization: "Bearer " + cfg.key };
  const rest = (path, opt) => fetch(cfg.url + "/rest/v1/" + path, opt);
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); }));
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} };

  function show(text) { msg.textContent = text; msg.hidden = !text; }

  function fillSelects(colleges) {
    const c = form.elements.college;
    colleges.forEach((x) => c.add(new Option(x.name, x.id)));
    const sp = form.elements.species;
    [["shade", "أشجار ظل"], ["ornamental", "نباتات زينة"]].forEach(([k, label]) => {
      const g = document.createElement("optgroup"); g.label = label;
      (GB.species || []).filter((s) => s.kind === k).forEach((s) => g.appendChild(new Option(s.name, s.id)));
      if (g.children.length) sp.appendChild(g);
    });
    (GB.areas || []).forEach((a) => form.elements.area.add(new Option(a.name, a.id)));
  }

  function loadColleges() {
    if (collegesLoaded) return Promise.resolve();
    return rest("colleges?select=id,name&is_active=eq.true&order=sort_order.asc", { headers: H })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((list) => {
        if (!list.length) throw new Error("empty");
        fillSelects(list); collegesLoaded = true;
        const me = read();
        if (me) {
          form.elements.name.value = me.name || "";
          form.elements.college.value = me.college || "";
          form.elements.publicname.checked = !!me.ok;
        }
      });
  }

  function today() { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }

  function open() {
    $("pf-body").hidden = false; $("pf-done").hidden = true; show("");
    form.elements.date.value = today(); form.elements.date.max = today();
    dlg.showModal();
    loadColleges().catch(() => show("تعذّر تحميل قائمة الكليات. تأكد من الاتصال وحاول مرة أخرى."));
  }
  document.querySelectorAll("[data-open-plant]").forEach((b) => b.addEventListener("click", open));
  dlg.querySelector("[data-close]").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  $("pf-again").addEventListener("click", () => {
    form.elements.photo.value = ""; prev.hidden = true; form.elements.consent.checked = false;
    $("pf-body").hidden = false; $("pf-done").hidden = true; show("");
  });

  form.elements.photo.addEventListener("change", () => {
    const f = form.elements.photo.files[0];
    if (!f) { prev.hidden = true; return; }
    prev.src = URL.createObjectURL(f); prev.hidden = false;
  });

  /* تصغير الصورة (أقصى 1600px) وتحويلها لـ webp/jpeg عشان تدخل حد الـ5MB */
  async function shrink(file) {
    let bmp;
    try { bmp = await createImageBitmap(file); } catch (e) { throw new Error("تعذّر قراءة الصورة. استخدم صورة JPG أو PNG."); }
    const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    cv.getContext("2d").drawImage(bmp, 0, 0, w, h);
    let type = "image/webp", blob = await new Promise((ok) => cv.toBlob(ok, type, 0.82));
    if (!blob || blob.type !== type) { type = "image/jpeg"; blob = await new Promise((ok) => cv.toBlob(ok, type, 0.85)); }
    if (!blob || blob.size > 5 * 1024 * 1024) throw new Error("الصورة كبيرة جداً، جرّب صورة أصغر.");
    return { blob, w, h, ext: type === "image/webp" ? "webp" : "jpg" };
  }

  async function post(path, body) {
    const r = await rest(path, { method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(path.split("?")[0] + " " + r.status);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); show("");
    const f = form.elements;
    if (f.website.value) return; // فخ البوتات
    const name = f.name.value.trim();
    if (name.length < 2 || name.length > 80) return show("اكتب اسمك الكامل (حرفان على الأقل).");
    if (!f.college.value) return show("اختر الكلية.");
    if (!f.species.value) return show("اختر نوع الشجرة.");
    if (!f.date.value || f.date.value > today()) return show("تاريخ الزراعة غير صحيح.");
    if (!f.photo.files[0]) return show("أرفق صورة الزراعة.");
    if (!f.consent.checked) return show("لازم تؤكد ملكية الصورة وموافقة من يظهر فيها.");
    if (Date.now() - lastSent < COOLDOWN_MS) return show("انتظر لحظات قبل إرسال توثيق آخر.");

    send.disabled = true; send.textContent = "جاري الإرسال…";
    try {
      const img = await shrink(f.photo.files[0]);
      const ok = f.publicname.checked, me = read();
      /* نستعمل نفس المشارك لو الاسم والكلية والموافقة كما هي، وإلا نسجّل مشاركاً جديداً */
      let pid = me && me.id && me.name === name && me.college === f.college.value && !!me.ok === ok ? me.id : null;
      if (!pid) {
        pid = uuid();
        await post("participants", { id: pid, full_name: name, college_id: f.college.value, public_name_ok: ok });
        write({ id: pid, name, college: f.college.value, ok });
      }
      const photoId = uuid(), path = "pending/" + uuid() + "." + img.ext;
      const up = await fetch(cfg.url + "/storage/v1/object/gallery-photos/" + path, { method: "POST", headers: { ...H, "Content-Type": img.blob.type, "x-upsert": "false" }, body: img.blob });
      if (!up.ok) throw new Error("upload " + up.status);
      const sp = (GB.species || []).find((s) => s.id === f.species.value);
      await post("gallery_photos", {
        id: photoId, storage_path: path, title: "زراعة " + (sp ? sp.name : "شجرة"), alt_text: "توثيق زراعة " + (sp ? sp.name : "شجرة"),
        category: "الزراعة", photographer_name: ok ? name : null, college_id: f.college.value, participant_id: pid,
        area_id: f.area.value || null, taken_on: f.date.value, width: img.w, height: img.h,
        source: "submission", status: "pending", consent_confirmed: true,
      });
      await post("planting_submissions", {
        id: uuid(), participant_id: pid, college_id: f.college.value, species: f.species.value,
        area_id: f.area.value || null, planted_on: f.date.value, photo_id: photoId,
      });
      lastSent = Date.now();
      $("pf-body").hidden = true; $("pf-done").hidden = false;
    } catch (err) {
      console.warn("[plant-form]", err);
      show(err && /^(تعذّر|الصورة)/.test(err.message) ? err.message : "ما قدرنا نرسل التوثيق. تأكد من الاتصال وحاول مرة أخرى.");
    } finally {
      send.disabled = false; send.textContent = "إرسال التوثيق";
    }
  });
})();
