/* لوحة الإدارة — التبويبات الإضافية (للمدير): نظرة عامة، المشاركات، النقاط والأوسمة، الكليات والمسابقات، المشرفون. */
(function () {
  const A = window.GBAdmin;
  if (!A) return;
  const { h, api, patch, post, del, rpc, count, num, fmt, act, empty, field, card, reviewPane, register, toast } = A;
  const sec = (title, ...kids) => h("section", { class: "ad-sec" }, h("h2", { text: title }), kids);
  const opt = (v, t, sel) => h("option", { value: v, text: t, selected: sel });
  const KINDS = { planting: "زراعة", photography: "تصوير", design: "تصميم", video: "فيديو", care: "خدمة بيئية", other: "أخرى" };
  const STATUS = { draft: "مسودة", open: "مفتوحة", judging: "قيد التحكيم", closed: "مغلقة" };
  const RULE_NAMES = { tree_planted: "زراعة شجرة", competition_win: "الفوز في مسابقة", tree_treated: "علاج / رعاية شجرة", bonus: "نقاط إضافية" };

  /* ================= نظرة عامة ================= */
  register({ id: "overview", label: "نظرة عامة", roles: ["admin"], order: 1,
    init(pane) {
      const stats = h("div", { class: "ad-stats" }), board = h("div", { class: "ad-board" });
      pane.append(stats, sec("ترتيب الكليات الحالي", board));
      this.load = async () => {
        stats.textContent = ""; board.textContent = "";
        try {
          const [pl, ph, en, part, lb] = await Promise.all([
            count("review_plantings?select=id&status=eq.pending"), count("review_photos?select=id&status=eq.pending&is_planting=eq.false"),
            count("competition_entries?select=id&status=eq.pending"), count("participants?select=id"),
            api("college_leaderboard?select=name,points,trees_planted&order=points.desc"),
          ]);
          const tile = (ico, label, v, go) => h("button", { type: "button", class: "ad-tile", onclick: go ? () => A.select(go) : null }, h("span", { text: ico }), h("small", { text: label }), h("b", { text: num(v) }));
          stats.append(tile("🌱", "توثيقات تنتظر المراجعة", pl, "plantings"), tile("📸", "صور تنتظر المراجعة", ph, "photos"), tile("🎯", "مشاركات تنتظر المراجعة", en, "entries"),
            tile("🌳", "أشجار معتمدة", lb.reduce((s, r) => s + r.trees_planted, 0)), tile("👥", "طلاب مسجّلون", part), tile("🏛️", "كليات", lb.length));
          const max = Math.max(...lb.map((r) => r.points), 1);
          lb.forEach((r, i) => board.appendChild(h("div", { class: "ad-rank" }, h("span", { text: num(i + 1) }), h("b", { text: r.name }),
            h("div", { class: "ad-bar2" }, h("i", { style: "width:" + Math.round((r.points / max) * 100) + "%" })), h("small", { text: num(r.points) + " نقطة · " + num(r.trees_planted) + " شجرة" }))));
        } catch (e) { console.warn("[admin]", e); empty(stats, "تعذّر تحميل الأرقام."); }
      };
    } });

  /* ================= المشاركات ================= */
  register({ id: "entries", label: "المشاركات", roles: ["admin"], order: 4,
    count: () => count("competition_entries?select=id&status=eq.pending"),
    init(pane) {
      this.load = reviewPane("entries", "مشاركات المسابقات. «فائز» يعتمد المشاركة ويضيف نقاط الفوز للكلية تلقائياً (مرة واحدة).", async (st, box) => {
        const rows = await api("competition_entries?select=id,title,description,media_url,status,place,created_at,competitions(title),participants(full_name),colleges(name),gallery_photos(storage_path)&status=eq." + st + "&order=created_at.desc&limit=60");
        rows.forEach((r) => {
          const win = r.place === 1;
          const b = [];
          if (r.status === "pending") b.push({ label: "اعتماد", run: () => patch("competition_entries?id=eq." + r.id + "&status=eq.pending", { status: "approved" }) });
          if (r.status !== "rejected" && !win) b.push({ label: "🏆 فائز (+نقاط)", confirm: "اعتماد هذه المشاركة كفائزة وإضافة نقاط الفوز للكلية؟", run: () => patch("competition_entries?id=eq." + r.id, { status: "approved", place: 1 }) });
          if (r.status === "pending") b.push({ label: "رفض", danger: true, noReason: true, confirm: "رفض هذه المشاركة؟", run: () => patch("competition_entries?id=eq." + r.id + "&status=eq.pending", { status: "rejected" }) });
          box.appendChild(card({
            path: r.gallery_photos && r.gallery_photos.storage_path, status: r.status, winner: win,
            title: (r.competitions && r.competitions.title ? r.competitions.title + " — " : "") + (r.title || "مشاركة"),
            lines: [(r.participants && r.participants.full_name || "كلية") + (r.colleges ? " · " + r.colleges.name : ""), r.description || "", fmt(r.created_at)].filter(Boolean),
            link: /^https?:\/\//.test(r.media_url || "") ? r.media_url : null, buttons: b,
          }));
        });
      });
    } });

  /* ================= النقاط والأوسمة ================= */
  register({ id: "points", label: "النقاط والأوسمة", roles: ["admin"], order: 5,
    init(pane) {
      const ledger = h("div", { class: "ad-list" }), rules = h("div", { class: "ad-list" }), awarded = h("div", { class: "ad-list" });
      const college = h("select", { required: true }), pts = h("input", { type: "number", step: "1", placeholder: "مثال: 25 أو -25" }), note = h("input", { type: "text", maxlength: "120", placeholder: "السبب (مطلوب)" });
      const who = h("select");
      const bonus = h("form", { class: "ad-formrow", onsubmit: async (e) => {
        e.preventDefault();
        const v = parseInt(pts.value, 10);
        if (!college.value || !v || !note.value.trim()) return toast("اختر الكلية واكتب عدد النقاط (غير صفر) والسبب.", true);
        if (v < 0 && !confirm("هذا خصم " + num(-v) + " نقطة. متأكد؟")) return;
        if (await act(bonus, () => post("points_ledger", { college_id: college.value, action_type: "bonus", points: v, note: note.value.trim() }), "تمت إضافة النقاط")) { pts.value = ""; note.value = ""; loadLedger(); }
      } }, field("الكلية", college), field("النقاط", pts), field("السبب", note), h("button", { type: "submit", class: "ad-btn", text: "إضافة" }));
      const hero = h("form", { class: "ad-formrow", onsubmit: async (e) => {
        e.preventDefault(); if (!who.value) return toast("اختر الطالب.", true);
        const s = await api("seasons?select=id&is_active=eq.true");
        if (!s.length) return toast("لا يوجد موسم فعّال.", true);
        if (await act(hero, () => post("participant_badges", { participant_id: who.value, badge_id: "season-hero", season_id: s[0].id }), "تم منح الوسام")) loadAwarded();
      } }, field("الطالب (الأكثر أشجاراً أولاً)", who), h("button", { type: "submit", class: "ad-btn", text: "👑 منح وسام بطل الموسم" }));
      pane.append(
        sec("إضافة نقاط يدوية لكلية", h("p", { class: "ad-mute ad-note", text: "السجل للإضافة فقط. للتصحيح أضف قيمة سالبة مع السبب." }), bonus),
        sec("آخر الحركات", ledger),
        sec("منح وسام بطل الموسم", hero, awarded),
        sec("قواعد النقاط", rules));

      async function loadLedger() {
        ledger.textContent = "";
        try {
          const rows = await api("points_ledger?select=id,created_at,action_type,points,quantity,note,colleges(name),participants(full_name)&order=created_at.desc&limit=15");
          rows.forEach((r) => ledger.appendChild(h("div", { class: "ad-row" }, h("b", { text: (r.points > 0 ? "+" : "") + num(r.points) }), h("span", { text: (r.colleges ? r.colleges.name : "") + (r.participants ? " · " + r.participants.full_name : "") }), h("small", { class: "ad-mute", text: (RULE_NAMES[r.action_type] || r.action_type) + (r.note ? " — " + r.note : "") + " · " + fmt(r.created_at) }))));
          if (!rows.length) empty(ledger, "لا توجد حركات بعد.");
        } catch (e) { empty(ledger, "تعذّر التحميل."); }
      }
      async function loadAwarded() {
        awarded.textContent = "";
        try {
          const rows = await api("participant_badges?select=participant_id,badge_id,season_id,awarded_at,badges(title,icon),participants(full_name)&order=awarded_at.desc&limit=30");
          rows.forEach((r) => {
            const row = h("div", { class: "ad-row" }, h("b", { text: (r.badges && r.badges.icon || "🏅") + " " + (r.badges && r.badges.title || r.badge_id) }), h("span", { text: r.participants ? r.participants.full_name : "" }), h("small", { class: "ad-mute", text: fmt(r.awarded_at) }));
            if (r.badge_id === "season-hero") row.appendChild(h("button", { type: "button", class: "ad-btn ad-ghost", text: "سحب", onclick: async () => { if (confirm("سحب الوسام؟") && await act(row, () => del("participant_badges?participant_id=eq." + r.participant_id + "&badge_id=eq.season-hero&season_id=eq." + r.season_id), "تم السحب")) loadAwarded(); } }));
            awarded.appendChild(row);
          });
          if (!rows.length) empty(awarded, "لم يُمنح أي وسام بعد.");
        } catch (e) { empty(awarded, "تعذّر التحميل."); }
      }
      async function loadRules() {
        rules.textContent = "";
        try {
          (await api("point_rules?select=*&order=action_type")).forEach((r) => {
            const p = h("input", { type: "number", min: "0", value: String(r.points) }), on = h("input", { type: "checkbox", checked: r.is_active });
            const row = h("div", { class: "ad-row" }, h("b", { text: RULE_NAMES[r.action_type] || r.label }), p, h("label", { class: "ad-chk" }, on, "مفعّلة"),
              h("button", { type: "button", class: "ad-btn", text: "حفظ", onclick: () => { const v = parseInt(p.value, 10); if (isNaN(v) || v < 0) return toast("أدخل رقماً صحيحاً.", true); act(row, () => patch("point_rules?action_type=eq." + r.action_type, { points: v, is_active: on.checked }), "تم الحفظ"); } }));
            rules.appendChild(row);
          });
        } catch (e) { empty(rules, "تعذّر التحميل."); }
      }
      this.load = async () => {
        loadLedger(); loadAwarded(); loadRules();
        try {
          const [cs, ps] = await Promise.all([api("colleges?select=id,name&is_active=eq.true&order=sort_order"), api("admin_participant_stats?select=participant_id,full_name,college_name,trees&limit=60")]);
          college.textContent = ""; college.appendChild(opt("", "اختر الكلية…")); cs.forEach((c) => college.appendChild(opt(c.id, c.name)));
          who.textContent = ""; who.appendChild(opt("", "اختر الطالب…")); ps.forEach((p) => who.appendChild(opt(p.participant_id, p.full_name + " — " + (p.college_name || "") + " (" + num(p.trees) + " شجرة)")));
        } catch (e) { toast("تعذّر تحميل القوائم.", true); }
      };
    } });

  /* ================= الكليات والمسابقات ================= */
  register({ id: "content", label: "الكليات والمسابقات", roles: ["admin"], order: 6,
    init(pane) {
      const colBox = h("div", { class: "ad-list" }), compBox = h("div", { class: "ad-list" });
      const nid = h("input", { type: "text", placeholder: "المعرّف بالإنجليزي (مثل: med)", pattern: "[a-z0-9-]+", maxlength: "20" }), nname = h("input", { type: "text", placeholder: "اسم الكلية", maxlength: "60" });
      const addCol = h("form", { class: "ad-formrow", onsubmit: async (e) => {
        e.preventDefault();
        if (!/^[a-z0-9-]{2,20}$/.test(nid.value) || nname.value.trim().length < 2) return toast("المعرّف حروف إنجليزية صغيرة وأرقام فقط، والاسم مطلوب.", true);
        if (await act(addCol, () => post("colleges", { id: nid.value, name: nname.value.trim(), sort_order: 99 }), "أُضيفت الكلية")) { nid.value = ""; nname.value = ""; loadCols(); }
      } }, field("المعرّف", nid), field("الاسم", nname), h("button", { type: "submit", class: "ad-btn", text: "إضافة كلية" }));
      const dlg = h("dialog", { class: "ad-dlg" }); pane.appendChild(dlg);
      pane.append(sec("الكليات", h("p", { class: "ad-mute ad-note", text: "الإيقاف يخفي الكلية من الترتيب وقائمة التوثيق. لا نحذف كلية لها نقاط. صفحة الشهادة تقرأ الكليات من data.js." }), colBox, addCol),
        sec("المسابقات ومهام البطولة", h("button", { type: "button", class: "ad-btn", text: "+ مسابقة جديدة", onclick: () => openComp(null) }), compBox));

      async function loadCols() {
        colBox.textContent = "";
        try {
          (await api("colleges?select=*&order=sort_order,name")).forEach((c) => {
            const n = h("input", { type: "text", value: c.name, maxlength: "60" }), o = h("input", { type: "number", value: String(c.sort_order), class: "ad-narrow" }), on = h("input", { type: "checkbox", checked: c.is_active });
            const row = h("div", { class: "ad-row" }, h("code", { text: c.id }), n, o, h("label", { class: "ad-chk" }, on, "فعّالة"),
              h("button", { type: "button", class: "ad-btn", text: "حفظ", onclick: () => { if (n.value.trim().length < 2) return toast("الاسم مطلوب.", true); act(row, () => patch("colleges?id=eq." + c.id, { name: n.value.trim(), sort_order: parseInt(o.value, 10) || 0, is_active: on.checked }), "تم الحفظ"); } }));
            colBox.appendChild(row);
          });
        } catch (e) { empty(colBox, "تعذّر التحميل."); }
      }
      async function loadComps() {
        compBox.textContent = "";
        try {
          const rows = await api("competitions?select=*&order=sort_order,created_at");
          rows.forEach((c) => compBox.appendChild(h("div", { class: "ad-row" }, h("b", { text: (c.icon || "") + " " + c.title }),
            h("small", { class: "ad-mute", text: (KINDS[c.kind] || c.kind) + " · " + (STATUS[c.status] || c.status) + (c.is_published ? " · ظاهرة" : " · مخفية") + (c.is_featured ? " · ⭐ الكبرى" : "") }),
            h("button", { type: "button", class: "ad-btn ad-ghost", text: "تعديل", onclick: () => openComp(c) }))));
          if (!rows.length) empty(compBox, "لا توجد مسابقات.");
        } catch (e) { empty(compBox, "تعذّر التحميل."); }
      }
      function openComp(c) {
        const v = c || { kind: "other", status: "draft", is_published: false, is_featured: false, sort_order: 0 };
        const f = {
          title: h("input", { type: "text", value: v.title || "", maxlength: "80" }), subtitle: h("input", { type: "text", value: v.subtitle || "", maxlength: "40" }),
          icon: h("input", { type: "text", value: v.icon || "", maxlength: "4", class: "ad-narrow" }), desc: h("textarea", { maxlength: "300", value: v.description || "" }),
          ptext: h("input", { type: "text", value: v.points_text || "", maxlength: "60", placeholder: "اتركه فاضياً لعرض النقاط من القواعد" }),
          win: h("input", { type: "number", min: "0", value: v.win_points == null ? "" : String(v.win_points), placeholder: "فاضي = نقاط الفوز العامة" }),
          kind: h("select", {}, Object.entries(KINDS).map(([k, t]) => opt(k, t, k === v.kind))), status: h("select", {}, Object.entries(STATUS).map(([k, t]) => opt(k, t, k === v.status))),
          pub: h("input", { type: "checkbox", checked: v.is_published }), feat: h("input", { type: "checkbox", checked: v.is_featured }), ord: h("input", { type: "number", value: String(v.sort_order), class: "ad-narrow" }),
        };
        const form = h("form", { class: "ad-stack", method: "dialog", onsubmit: async (e) => {
          e.preventDefault();
          if (f.title.value.trim().length < 2) return toast("العنوان مطلوب.", true);
          const body = { title: f.title.value.trim(), subtitle: f.subtitle.value.trim() || null, icon: f.icon.value.trim() || null, description: f.desc.value.trim() || null,
            points_text: f.ptext.value.trim() || null, win_points: f.win.value === "" ? null : parseInt(f.win.value, 10), kind: f.kind.value, status: f.status.value,
            is_published: f.pub.checked, is_featured: f.feat.checked, sort_order: parseInt(f.ord.value, 10) || 0 };
          const ok = await act(form, async () => {
            if (c) return patch("competitions?id=eq." + c.id, body);
            const s = await api("seasons?select=id&is_active=eq.true");
            return post("competitions", { ...body, season_id: s[0] && s[0].id, entry_type: "both" });
          }, "تم الحفظ");
          if (ok) { dlg.close(); loadComps(); }
        } },
          h("h3", { text: c ? "تعديل المسابقة" : "مسابقة جديدة" }),
          field("العنوان", f.title), field("العنوان الفرعي (مثل: مسابقة إبداعية)", f.subtitle), field("الأيقونة (إيموجي)", f.icon), field("الوصف", f.desc),
          field("نص النقاط المعروض", f.ptext), field("نقاط الفوز لهذه المسابقة", f.win), field("النوع", f.kind), field("الحالة", f.status), field("الترتيب", f.ord),
          h("label", { class: "ad-chk" }, f.pub, "ظاهرة في الموقع"), h("label", { class: "ad-chk" }, f.feat, "المسابقة الكبرى ⭐"),
          h("div", { class: "ad-act" }, h("button", { type: "submit", class: "ad-btn", text: "حفظ" }), h("button", { type: "button", class: "ad-btn ad-ghost", text: "إلغاء", onclick: () => dlg.close() })));
        dlg.textContent = ""; dlg.appendChild(form); dlg.showModal();
      }
      this.load = () => { loadCols(); loadComps(); };
    } });

  /* ================= المشرفون ================= */
  register({ id: "staff", label: "المشرفون", roles: ["admin"], order: 7,
    init(pane) {
      const list = h("div", { class: "ad-list" });
      let owners = [], iAmOwner = false;
      const email = h("input", { type: "email", placeholder: "بريد الحساب", autocomplete: "off" }), name = h("input", { type: "text", maxlength: "60", placeholder: "الاسم" });
      const rl = h("select", {}, opt("planting", "مشرف التوثيقات"), opt("photo", "مشرف الصور"));
      const addF = h("form", { class: "ad-formrow", onsubmit: async (e) => {
        e.preventDefault(); if (!email.value.trim()) return toast("اكتب بريد الحساب.", true);
        if (await act(addF, () => rpc("admin_add_staff", { p_email: email.value.trim(), p_role: rl.value, p_name: name.value.trim() }), "تمت الإضافة")) { email.value = ""; name.value = ""; this.load(); }
      } }, field("البريد", email), field("الاسم", name), field("الدور", rl), h("button", { type: "submit", class: "ad-btn", text: "إضافة" }));
      pane.append(sec("المشرفون", h("p", { class: "ad-mute ad-note", text: "الحساب لازم يكون موجوداً أولاً: أنشئه من Supabase ← Authentication ← Users ثم أضفه هنا ببريده." }), list, addF));
      this.load = async () => {
        list.textContent = "";
        try {
          // قبل تشغيل supabase_admin_owner.sql هذه الدوال غير موجودة: نتجاهل الخطأ ونكمل بدون حماية المالك في الواجهة
          try { owners = (await rpc("admin_owner_ids")) || []; iAmOwner = !!(await rpc("is_owner")); } catch (e) { owners = []; iAmOwner = false; }
          if (iAmOwner && !rl.querySelector('[value="admin"]')) rl.appendChild(opt("admin", "مدير"));
          (await rpc("admin_list_staff")).forEach((s) => {
            const me = s.uid === A.me(), isOwner = owners.includes(s.uid);
            const locked = me || isOwner || (s.staff_role === "admin" && !iAmOwner);
            const n = h("input", { type: "text", value: s.staff_name || "", maxlength: "60", disabled: locked });
            const r = h("select", { disabled: locked }, opt("planting", "مشرف التوثيقات", s.staff_role === "planting"), opt("photo", "مشرف الصور", s.staff_role === "photo"), opt("admin", "مدير", s.staff_role === "admin"));
            const row = h("div", { class: "ad-row" }, h("code", { text: s.email || s.uid }), n, r);
            if (isOwner) row.appendChild(h("small", { class: "ad-mute", text: me ? "المالك · حسابك" : "المالك" }));
            else if (me) row.appendChild(h("small", { class: "ad-mute", text: "حسابك" }));
            else if (!locked) row.append(
              h("button", { type: "button", class: "ad-btn", text: "حفظ", onclick: () => act(row, () => rpc("admin_update_staff", { p_user: s.uid, p_role: r.value, p_name: n.value.trim() }), "تم الحفظ") }),
              h("button", { type: "button", class: "ad-btn ad-danger", text: "حذف", onclick: async () => { if (confirm("إزالة صلاحيات هذا المشرف؟") && await act(row, () => rpc("admin_remove_staff", { p_user: s.uid }), "تمت الإزالة")) this.load(); } }));
            else row.appendChild(h("small", { class: "ad-mute", text: "للمالك فقط" }));
            list.appendChild(row);
          });
        } catch (e) { empty(list, "تعذّر التحميل. تأكد من تشغيل supabase_admin_extras.sql."); }
      };
    } });
})();
