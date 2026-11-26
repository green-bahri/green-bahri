/* =========================================================
   seed-experience.js — تجربة «من البذرة إلى الشجرة» (المرحلة 2: نموذج تقني)
   - مشهد Three.js مبني برمجياً (مؤقت): بذرة، تربة بمقطع عرضي، جذور، ساق، أوراق.
   - تقدّم التمرير (0..1) يتحكم في كل شيء، والتمرير للخلف يعكس المشهد.
   - الملف معزول: لا يعتدي على main.js ولا على أي متغير عام.
   - لتجربة نقطة ثابتة: seed-lab.html?p=0.5
   ========================================================= */
(async function () {
  const root = document.getElementById("seed-story");
  if (!root) return;
  const pinEl = root.querySelector(".seed-pin");
  const canvas = root.querySelector("#seed-canvas");
  const q = new URLSearchParams(location.search);
  const fixedP = q.has("p") ? Math.min(1, Math.max(0, parseFloat(q.get("p")) || 0)) : null;

  /* زر «كن جزءاً من التغيير»: يفتح نافذة المشاركة لو وُجدت (home.js)، وإلا ينتقل لقسم المشاركة */
  root.querySelectorAll("[data-join]").forEach((b) => b.addEventListener("click", () => {
    if (!document.getElementById("join-dialog")) location.href = "index.html#join";
  }));

  /* ---------- أدوات ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const smooth = (p, a, b) => { const t = seg(p, a, b); return t * t * (3 - 2 * t); };
  const easeOutBack = (t) => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const lerp = (a, b, t) => a + (b - a) * t;
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  /* ---------- البديل الثابت ---------- */
  function fallback(why) {
    console.info("[seed-experience] fallback:", why);
    root.classList.add("is-fallback");
    root.classList.add("is-ready");
  }
  const webglOK = () => {
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
    catch (e) { return false; }
  };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && fixedP === null) return fallback("reduced-motion");
  if (!webglOK()) return fallback("no-webgl");

  let T;
  try { T = await import("three"); } catch (e) { return fallback("three failed to load"); }
  if (!window.gsap || !window.ScrollTrigger) return fallback("gsap missing");

  /* ---------- المُصيِّر والمشهد ---------- */
  const isMobile = matchMedia("(max-width: 700px)").matches;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new T.Scene();
  const DARK = new T.Color("#10281c"), SKY = new T.Color("#6aa586"), bg = new T.Color();
  scene.background = bg;
  scene.fog = new T.FogExp2("#10281c", 0.03);
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 90);

  /* ---------- خامات حقيقية (أوراق ولحاء) من assets؛ لو فشل التحميل نستخدم النسخ البرمجية ---------- */
  const texLoader = new T.TextureLoader();
  const loadPhoto = (url) => new Promise((res) => texLoader.load(url, (t) => {
    t.colorSpace = T.SRGBColorSpace; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); res(t);
  }, undefined, () => res(null)));
  const [tCluster, tLeaf, tBark, tShell, tShellBump] = await Promise.all([loadPhoto("assets/tree-cluster.webp"), loadPhoto("assets/tree-leaf.webp"), loadPhoto("assets/tree-bark.webp"), loadPhoto("assets/seed-shell.webp"), loadPhoto("assets/seed-shell-bump.webp")]);

  /* ---------- نسيج برمجي ---------- */
  function canvasTex(size, draw, { color = true, repeat } = {}) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d"), size);
    const t = new T.CanvasTexture(c);
    if (color) t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  const R = rng(11);
  const dots = (g, s, n, rMin, rMax, fn) => {
    for (let i = 0; i < n; i++) { g.fillStyle = fn(R()); g.beginPath(); g.arc(R() * s, R() * s, rMin + R() * (rMax - rMin), 0, 6.283); g.fill(); }
  };

  const soilTex = canvasTex(1024, (g, s) => {
    g.fillStyle = "#4b3322"; g.fillRect(0, 0, s, s);
    dots(g, s, 14000, 0.6, 2.8, (r) => `rgba(${70 + r * 70 | 0},${48 + r * 46 | 0},${30 + r * 28 | 0},.55)`);
    dots(g, s, 2500, 0.6, 1.6, () => "rgba(20,12,6,.55)");
    for (let i = 0; i < 46; i++) { /* حصى صغير */
      const x = R() * s, y = R() * s, rx = 3 + R() * 9, ry = rx * (0.6 + R() * 0.3);
      g.fillStyle = `rgb(${96 + R() * 50 | 0},${84 + R() * 40 | 0},${70 + R() * 34 | 0})`;
      g.beginPath(); g.ellipse(x, y, rx, ry, R() * 3, 0, 6.283); g.fill();
      g.fillStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.ellipse(x - rx * .25, y - ry * .3, rx * .45, ry * .35, 0, 0, 6.283); g.fill();
    }
  }, { repeat: [11, 2.6] });
  const topTex = soilTex.clone(); topTex.repeat.set(14, 15); topTex.needsUpdate = true;

  /* ---- نسيج البذرة: قشرة بنية متدرجة مع بقع ورقائق وتجاعيد وحواف أغمق عند خط الالتحام ---- */
  const TS = isMobile ? 512 : 1024;
  const wiggle = (g, x, y, len, amp, n) => { g.beginPath(); g.moveTo(x, y); for (let i = 1; i <= n; i++) g.lineTo(x + (R() - .5) * amp, y + (len * i) / n); g.stroke(); };
  const seedTex = canvasTex(TS, (g, s) => {
    const gr = g.createLinearGradient(0, 0, 0, s);
    gr.addColorStop(0, "#5e3b20"); gr.addColorStop(.45, "#8c5c31"); gr.addColorStop(1, "#4f3019");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    dots(g, s, 320, s * .02, s * .1, (r) => `rgba(${40 + r * 100 | 0},${22 + r * 56 | 0},${8 + r * 26 | 0},.11)`);   /* بقع كبيرة */
    dots(g, s, 90, s * .015, s * .06, () => "rgba(196,150,96,.16)");                                                 /* رقائق قشرة فاتحة */
    dots(g, s, 7000, .6, 2.6, (r) => `rgba(${30 + r * 90 | 0},${16 + r * 50 | 0},${6 + r * 24 | 0},.3)`);          /* حبيبات */
    g.lineCap = "round";
    for (let i = 0; i < 190; i++) { g.strokeStyle = `rgba(26,13,5,${.12 + R() * .22})`; g.lineWidth = .6 + R() * 1.6; wiggle(g, R() * s, R() * s, 40 + R() * s * .35, 14, 7); }
    for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(214,168,112,${.06 + R() * .1})`; g.lineWidth = .6 + R() * 1.2; wiggle(g, R() * s, R() * s, 30 + R() * s * .25, 12, 6); }
    const eg = g.createLinearGradient(0, 0, s, 0);                                                                    /* خط الالتحام */
    eg.addColorStop(0, "rgba(18,9,3,.6)"); eg.addColorStop(.045, "rgba(18,9,3,0)"); eg.addColorStop(.955, "rgba(18,9,3,0)"); eg.addColorStop(1, "rgba(18,9,3,.6)");
    g.fillStyle = eg; g.fillRect(0, 0, s, s);
  });
  const seedRough = canvasTex(512, (g, s) => {
    g.fillStyle = "#8c8c8c"; g.fillRect(0, 0, s, s);
    dots(g, s, 160, 6, 34, (r) => `rgba(${r > .5 ? 235 : 40},${r > .5 ? 235 : 40},${r > .5 ? 235 : 40},.22)`);
    g.strokeStyle = "rgba(30,30,30,.25)"; g.lineWidth = 1.4; for (let i = 0; i < 80; i++) wiggle(g, R() * s, R() * s, 30 + R() * 120, 10, 5);
  }, { color: false });
  const seedBump = canvasTex(512, (g, s) => {
    g.fillStyle = "#808080"; g.fillRect(0, 0, s, s);
    dots(g, s, 260, 5, 26, (r) => `rgba(${r > .5 ? 255 : 0},${r > .5 ? 255 : 0},${r > .5 ? 255 : 0},.1)`);
    dots(g, s, 3200, 1, 4, (r) => `rgba(${r > .5 ? 255 : 0},${r > .5 ? 255 : 0},${r > .5 ? 255 : 0},.2)`);
    g.lineWidth = 1.6; for (let i = 0; i < 120; i++) { g.strokeStyle = R() > .5 ? "rgba(0,0,0,.45)" : "rgba(255,255,255,.3)"; wiggle(g, R() * s, R() * s, 40 + R() * 150, 12, 6); }
  }, { color: false });
  /* خامة القشرة من صورة بذرة حقيقية (إن تحمّلت)؛ وإلا تبقى النسخة البرمجية */
  if (tShell) { seedTex.image = tShell.image; seedTex.needsUpdate = true; }
  if (tShellBump) { seedBump.image = tShellBump.image; seedBump.needsUpdate = true; }
  /* وجه القطع الداخلي: لب كريمي رطب بعروق دقيقة وحلقة قشرة رقيقة */
  const capTex = canvasTex(512, (g, s) => {
    g.fillStyle = "#4a2d16"; g.fillRect(0, 0, s, s);
    const gr = g.createRadialGradient(s * .5, s * .52, s * .04, s * .5, s * .5, s * .49);
    gr.addColorStop(0, "#f3e6b8"); gr.addColorStop(.6, "#e6d29a"); gr.addColorStop(.9, "#c7a46a"); gr.addColorStop(1, "#7a5229");
    g.fillStyle = gr; g.beginPath(); g.arc(s / 2, s / 2, s * .495, 0, 6.283); g.fill();
    dots(g, s, 1200, .5, 2, (r) => `rgba(${150 + r * 70 | 0},${112 + r * 56 | 0},${60 + r * 40 | 0},.22)`);
    g.strokeStyle = "rgba(160,112,52,.3)"; g.lineWidth = 1.1;
    for (let i = 0; i < 46; i++) { const a = -1.57 + (R() - .5) * 2.6, L = s * (.18 + R() * .3); g.beginPath(); g.moveTo(s / 2 + (R() - .5) * 40, s * (.6 + R() * .25)); g.quadraticCurveTo(s / 2 + Math.cos(a) * L * .6, s * .5 + Math.sin(a) * L * .4, s / 2 + Math.cos(a) * L, s * .55 + Math.sin(a) * L); g.stroke(); }
    const eb = g.createRadialGradient(s / 2, s * .66, 2, s / 2, s * .66, s * .13);   /* موضع الجنين */
    eb.addColorStop(0, "rgba(120,160,70,.55)"); eb.addColorStop(1, "rgba(120,160,70,0)"); g.fillStyle = eb; g.beginPath(); g.ellipse(s / 2, s * .66, s * .07, s * .13, 0, 0, 6.283); g.fill();
    const hl = g.createRadialGradient(s * .38, s * .35, 2, s * .38, s * .35, s * .25); hl.addColorStop(0, "rgba(255,255,255,.28)"); hl.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = hl; g.fillRect(0, 0, s, s);
  });

  const leafTex = tLeaf || canvasTex(256, (g, s) => {
    g.beginPath(); g.moveTo(s / 2, s * .98);
    g.bezierCurveTo(s * .02, s * .72, s * .08, s * .2, s / 2, s * .02);
    g.bezierCurveTo(s * .92, s * .2, s * .98, s * .72, s / 2, s * .98); g.closePath();
    const gr = g.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, "#2c7a35"); gr.addColorStop(1, "#86cf55");
    g.fillStyle = gr; g.fill();
    g.strokeStyle = "rgba(255,255,255,.38)"; g.lineWidth = 3; g.beginPath(); g.moveTo(s / 2, s * .98); g.lineTo(s / 2, s * .08); g.stroke();
    g.lineWidth = 1.6;
    for (let i = 1; i < 7; i++) { const y = s * (.9 - i * .11); g.beginPath(); g.moveTo(s / 2, y); g.lineTo(s * .18, y - s * .1); g.moveTo(s / 2, y); g.lineTo(s * .82, y - s * .1); g.stroke(); }
  });

  const barkTex = canvasTex(256, (g, s) => {
    g.fillStyle = "#cdbfa8"; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) { /* شقوق طولية */
      const x = R() * s; g.strokeStyle = `rgba(${40 + R() * 30 | 0},${28 + R() * 20 | 0},${16 + R() * 14 | 0},${0.25 + R() * 0.4})`; g.lineWidth = 0.8 + R() * 2.2;
      g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= s; y += 32) g.lineTo(x + (R() - .5) * 10, y); g.stroke();
    }
    dots(g, s, 700, 1, 4, (r) => `rgba(255,255,255,${0.04 + r * 0.08})`);
  }, { repeat: [2, 5] });

  if (tBark) { barkTex.image = tBark.image; barkTex.needsUpdate = true; }

  const glowTex = canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.35, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });

  /* ---------- الإضاءة ---------- */
  const hemi = new T.HemisphereLight("#7aa88f", "#1a1008", 0.55);
  const key = new T.DirectionalLight("#ffe0b0", 1.3); key.position.set(3, 5, 4);
  const rim = new T.DirectionalLight("#cfe9dd", 1.5); rim.position.set(-3, 2.5, -3);
  const under = new T.PointLight("#ffd1a0", 0, 0, 2); under.position.set(0, -2.2, 1.7);
  scene.add(hemi, key, rim, under);

  /* ---------- التربة (مقطع عرضي: الوجه الأمامي عند z = 0) ---------- */
  const soilSide = new T.MeshStandardMaterial({ color: "#2a1c11", roughness: 1 });
  const topMat = new T.MeshStandardMaterial({ map: topTex, color: "#b8a999", roughness: 1 });
  const TOP_A = new T.Color("#b8a999"), TOP_B = new T.Color("#7da35a");
  const soil = new T.Mesh(
    new T.BoxGeometry(44, 9, 30),
    [soilSide, soilSide,
      topMat,
      soilSide,
      new T.MeshStandardMaterial({ map: soilTex, roughness: 1 }),
      soilSide]
  );
  soil.position.set(0, -4.5, -15);
  scene.add(soil);

  /* ---------- البذرة (نصفان قابلان للانفتاح) ---------- */
  const SEED_POS = new T.Vector3(0, 0.12, 0.12);
  const SX = 0.3, SY = 0.46, SZ = 0.3; /* أنصاف الأبعاد */
  const seedMat = new T.MeshPhysicalMaterial({ map: seedTex, bumpMap: seedBump, bumpScale: 1.1, roughness: 1, roughnessMap: seedRough, clearcoat: 0.4, clearcoatRoughness: 0.4 });
  const capMat = new T.MeshStandardMaterial({ map: capTex, roughness: 0.5, side: T.DoubleSide });
  const seed = new T.Group(); seed.position.copy(SEED_POS); scene.add(seed);

  /* تشويه عضوي: شكل بيضوي مدبّب قليلاً مع انتفاخات غير متماثلة. الدالة نفسها تُطبَّق على الجسم ووجه القطع فيتطابق الحد تماماً */
  function deform(x, y, z, o) {
    const egg = 1 - 0.13 * y;
    const n = 1 + 0.04 * Math.sin(4.7 * x + 1.3) * Math.cos(3.9 * y + 0.7) + 0.035 * Math.sin(3.3 * z + y * 2.1 + 0.4) + 0.02 * Math.sin(8.5 * y + 3.1 * x + z);
    return o.set(x * egg * n, y * (0.98 + 0.02 * n) * (1 + 0.03 * Math.sin(2.3 * x + 1.1)), z * egg * n * 0.94);
  }
  const _d = new T.Vector3();
  function makeHalf(sign) {
    const pivot = new T.Group(); pivot.position.set(0, -SY, 0);
    const geo = new T.SphereGeometry(1, isMobile ? 40 : 64, isMobile ? 28 : 48, sign > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI);
    const P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) { deform(P.getX(i), P.getY(i), P.getZ(i), _d); P.setXYZ(i, _d.x, _d.y, _d.z); }
    geo.computeVertexNormals();
    const body = new T.Mesh(geo, seedMat);
    body.scale.set(SX, SY, SZ); body.position.y = SY;

    /* وجه القطع: شبكة حلقات تنتفخ قليلاً نحو الشق */
    const rings = 10, segs = isMobile ? 40 : 64, pos = [], uv = [], idx = [];
    for (let ri = 0; ri <= rings; ri++) for (let si = 0; si <= segs; si++) {
      const r = ri / rings, a = (si / segs) * Math.PI * 2, vx = Math.cos(a), vy = Math.sin(a);
      deform(0, vy, vx, _d);
      pos.push(-sign * 0.07 * (1 - r * r), _d.y * r, _d.z * r); uv.push(0.5 + vx * r * 0.5, 0.5 + vy * r * 0.5);
    }
    for (let ri = 0; ri < rings; ri++) for (let si = 0; si < segs; si++) {
      const a = ri * (segs + 1) + si, b = a + segs + 1; idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const cg = new T.BufferGeometry();
    cg.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); cg.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    cg.setIndex(idx); cg.computeVertexNormals();
    const cap = new T.Mesh(cg, capMat); cap.scale.set(SX, SY, SZ); cap.position.y = SY;
    pivot.add(body, cap); seed.add(pivot);
    return pivot;
  }
  const halfR = makeHalf(1), halfL = makeHalf(-1);

  const embryo = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshStandardMaterial({ color: "#a6dc6a", emissive: "#5fae3a", emissiveIntensity: 0.7, roughness: 0.6 }));
  embryo.position.set(0, 0, 0); embryo.scale.setScalar(0.0001); seed.add(embryo);

  /* ---------- أنبوب ينمو تدريجياً (للجذور والساق) ---------- */
  function growMaterial(color, params = {}) {
    const uniforms = { uGrow: { value: 0 }, uThick: { value: 1 } };
    const m = new T.MeshStandardMaterial({ color, roughness: 0.8, ...params });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uGrow = uniforms.uGrow; sh.uniforms.uThick = uniforms.uThick;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aT;\nattribute vec3 aC;\nuniform float uGrow;\nuniform float uThick;")
        .replace("#include <begin_vertex>", "vec3 transformed = aC + (position - aC) * clamp((uGrow - aT) / 0.05, 0.0, 1.0) * uThick;");
    };
    m.userData.uniforms = uniforms;
    return m;
  }
  function makeTube(points, r0, r1, material, { radial = 8, segs = 40 } = {}) {
    const curve = new T.CatmullRomCurve3(points, false, "catmullrom", 0.5);
    const fr = curve.computeFrenetFrames(segs, false);
    const pos = [], nor = [], aT = [], aC = [], uv = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, P = curve.getPointAt(t), N = fr.normals[i], B = fr.binormals[i];
      const r = lerp(r0, r1, Math.pow(t, 0.8));
      for (let j = 0; j <= radial; j++) {
        const a = (j / radial) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const dx = N.x * c + B.x * s, dy = N.y * c + B.y * s, dz = N.z * c + B.z * s;
        pos.push(P.x + dx * r, P.y + dy * r, P.z + dz * r); nor.push(dx, dy, dz);
        aT.push(t); aC.push(P.x, P.y, P.z); uv.push(j / radial, t);
      }
    }
    for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new T.Float32BufferAttribute(nor, 3));
    geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    geo.setAttribute("aT", new T.Float32BufferAttribute(aT, 1));
    geo.setAttribute("aC", new T.Float32BufferAttribute(aC, 3));
    geo.setIndex(idx);
    const mesh = new T.Mesh(geo, material);
    mesh.frustumCulled = false; /* الرؤوس تتحرك في الشيدر، فلا نعتمد على الصندوق الأصلي */
    return { mesh, curve, mat: material, set(g, th = 1) { const u = material.userData.uniforms; u.uGrow.value = g * 1.05; u.uThick.value = th; } };
  }

  /* ---------- الجذور ---------- */
  const rootMat = () => growMaterial("#dcc79d", { roughness: 0.85, emissive: "#3a2d18", emissiveIntensity: 0.25 });
  function walk(start, dir, len, steps, wob, rnd) {
    const pts = [start.clone()], p = start.clone(), d = dir.clone().normalize(), L = len / steps;
    for (let i = 0; i < steps; i++) {
      d.x += (rnd() - 0.5) * wob; d.y += (rnd() - 0.5) * wob * 0.4; d.z = 0; d.normalize();
      p.addScaledVector(d, L); p.z = 0.1 + (rnd() - 0.5) * 0.04; pts.push(p.clone());
    }
    return pts;
  }
  const RR = rng(5), roots = [];
  const main = makeTube(walk(new T.Vector3(0, -0.4, 0.1), new T.Vector3(0.05, -1, 0), 4.4, 7, 0.55, RR), 0.07, 0.016, rootMat(), { radial: 8, segs: 64 });
  roots.push({ ...main, t0: 0.33, t1: 0.52 });
  for (let k = 0; k < 8; k++) {
    const tB = 0.16 + k * 0.1, side = k % 2 ? 1 : -1;
    const start = main.curve.getPointAt(tB);
    const pts = walk(start, new T.Vector3(side * 0.9, -0.45, 0), (1.9 - k * 0.1) * (0.8 + RR() * 0.4), 5, 0.6, RR);
    const t0 = lerp(0.33, 0.52, tB) + 0.005, t1 = Math.min(0.6, t0 + 0.11);
    const sec = makeTube(pts, 0.04, 0.008, rootMat(), { radial: 6, segs: 36 });
    roots.push({ ...sec, t0, t1 });
    for (const tt of [0.45, 0.75]) {
      const s2 = sec.curve.getPointAt(tt);
      const pts2 = walk(s2, new T.Vector3(side * 0.5 + (RR() - 0.5) * 0.6, -0.85, 0), 0.5 + RR() * 0.35, 3, 0.7, RR);
      const a0 = lerp(t0, t1, tt), a1 = Math.min(0.62, a0 + 0.07);
      roots.push({ ...makeTube(pts2, 0.02, 0.004, rootMat(), { radial: 5, segs: 14 }), t0: a0, t1: a1 });
    }
  }
  roots.forEach((r) => scene.add(r.mesh));

  /* ---------- الجذع (يبدأ ساقاً أخضر رفيعاً ثم يسمك ويتخشّب) ---------- */
  const GREEN_STEM = new T.Color("#79bd58"), BARK = new T.Color("#b69a78"), _c = new T.Color();
  const trunkMat = growMaterial("#79bd58", { map: barkTex, roughness: 0.82 });
  const stem = makeTube(
    [new T.Vector3(0, -0.12, 0.12), new T.Vector3(0.01, 0.5, 0.12), new T.Vector3(0.07, 1.2, 0.13), new T.Vector3(-0.04, 2.0, 0.12), new T.Vector3(0.06, 2.8, 0.12), new T.Vector3(0.0, 3.6, 0.12)],
    0.055, 0.016, trunkMat, { radial: 12, segs: 90 }
  );
  const STEM = { t0: 0.58, t1: 0.8 };
  trunkMat.map = null; let barkOn = false;   /* الساق الطري أملس، واللحاء يظهر عند التخشّب */
  scene.add(stem.mesh);

  /* ---------- الأوراق الأولى على البرعم (مفردة) ---------- */
  const leafGeo = new T.PlaneGeometry(tLeaf ? 0.42 : 0.5, 0.8, 1, 8);
  leafGeo.translate(0, 0.4, 0);
  { const p = leafGeo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 0.8; p.setZ(i, -0.2 * y * y); } leafGeo.computeVertexNormals(); }
  const leafMat = new T.MeshStandardMaterial({ map: leafTex, emissiveMap: tLeaf ? leafTex : null, emissive: tLeaf ? "#ffffff" : "#000000", emissiveIntensity: 0.3, alphaTest: 0.45, side: T.DoubleSide, roughness: 0.65 });
  const leaves = [];
  [0.2, 0.34, 0.48, 0.6].forEach((t, i) => {
    const grp = new T.Group(), mesh = new T.Mesh(leafGeo, leafMat);
    grp.position.copy(stem.curve.getPointAt(t));
    grp.rotation.y = i * 2.4 + 0.5;
    grp.add(mesh); grp.scale.setScalar(0.0001); scene.add(grp);
    leaves.push({ grp, mesh, t0: STEM.t0 + (STEM.t1 - STEM.t0) * t, size: 0.8 + t * 0.5, i });
  });

  /* ---------- الأغصان والتاج (أغصان تنمو بالتدريج + أوراق مُجسَّمة InstancedMesh) ---------- */
  const TR = rng(77), LDEN = tCluster ? (isMobile ? 0.3 : 0.5) : (isMobile ? 0.55 : 1), LSIZE = (isMobile ? 1.25 : 1) * (tCluster ? 0.85 : 1);
  const limbs = [], LEAF = [];
  const Y_AXIS = new T.Vector3(0, 1, 0);
  const barkMat = () => growMaterial("#7b5a3c", { map: barkTex, roughness: 0.88 });

  function branchPts(start, ang, len, rise) {
    const ox = Math.cos(ang), oz = Math.sin(ang), pts = [start.clone()];
    for (let i = 1; i <= 4; i++) {
      const f = i / 4;
      pts.push(new T.Vector3(
        start.x + ox * len * f * 0.9 + (TR() - 0.5) * 0.12,
        start.y + len * (rise * f + 0.24 * f * f) + (TR() - 0.5) * 0.08,
        start.z + oz * len * f * 0.9 + (TR() - 0.5) * 0.12));
    }
    return pts;
  }
  /* يضيف أوراقاً بامتداد منحنى؛ كل ورقة تظهر حين يصلها نمو الغصن */
  function scatterLeaves(curve, n, a, b, t0, t1, spread, size) {
    const tan = new T.Vector3();
    for (let k = 0; k < Math.round(n * LDEN); k++) {
      const t = a + (b - a) * (k + TR() * 0.8) / Math.max(1, Math.round(n * LDEN));
      const P = curve.getPointAt(Math.min(1, t)); curve.getTangentAt(Math.min(1, t), tan);
      const dir = new T.Vector3(tan.x + (TR() - 0.5) * 1.6, tan.y * 0.5 + 0.25 + TR() * 0.5, tan.z + (TR() - 0.5) * 1.6).normalize();
      const q = new T.Quaternion().setFromUnitVectors(Y_AXIS, dir).multiply(new T.Quaternion().setFromAxisAngle(Y_AXIS, TR() * 6.283));
      LEAF.push({
        pos: new T.Vector3(P.x + (TR() - 0.5) * spread, P.y + (TR() - 0.2) * spread * 0.7, P.z + (TR() - 0.5) * spread),
        q, tilt: 0.45 + TR() * 0.7, size: (0.5 + TR() * 0.38) * size * LSIZE,
        p0: t0 + (t1 - t0) * Math.min(1, t) + 0.005, ph: TR() * 6.283, tone: TR()
      });
    }
  }

  const MAIN = 9;
  for (let k = 0; k < MAIN; k++) {
    const tb = 0.4 + (k / (MAIN - 1)) * 0.5;                          /* ارتفاع الخروج من الجذع */
    const ang = k * 2.4 + 0.4;                                          /* زاوية ذهبية: توزيع طبيعي حول الجذع */
    const len = 1.9 - tb * 1.05 + TR() * 0.3;                           /* الأغصان العليا أقصر */
    const t0 = 0.74 + k * 0.014, t1 = Math.min(0.9, t0 + 0.075);
    const start = stem.curve.getPointAt(tb);
    const tube = makeTube(branchPts(start, ang, len, 0.36 + TR() * 0.16), 0.045 * (1.15 - tb * 0.5), 0.008, barkMat(), { radial: 7, segs: 34 });
    scene.add(tube.mesh); limbs.push({ ...tube, t0, t1, th0: 0.6, th1: 1.7 });
    scatterLeaves(tube.curve, 20, 0.35, 1, t0, t1, 0.16, 1);
    for (const [tt, off] of [[0.45, 0.9], [0.72, -0.9]]) {
      const sp = tube.curve.getPointAt(tt), a0 = lerp(t0, t1, tt), a1 = Math.min(0.93, a0 + 0.05);
      const sub = makeTube(branchPts(sp, ang + off + (TR() - 0.5) * 0.5, len * (0.42 + TR() * 0.14), 0.3 + TR() * 0.2), 0.022, 0.005, barkMat(), { radial: 5, segs: 20 });
      scene.add(sub.mesh); limbs.push({ ...sub, t0: a0, t1: a1, th0: 0.6, th1: 1.5 });
      scatterLeaves(sub.curve, 12, 0.25, 1, a0, a1, 0.13, 0.95);
    }
  }
  scatterLeaves(stem.curve, 46, 0.84, 1, STEM.t0, STEM.t1, 0.34, 1.0);   /* قمة الجذع */

  let crownGeo = leafGeo, crownMat = leafMat;
  if (tCluster) {   /* فرع كامل بتسع أوراق حقيقية؛ قاعدته (الساق) عند نقطة الأصل */
    crownGeo = new T.PlaneGeometry(1.1, 0.953, 1, 4); crownGeo.translate(0.01, 0.38, 0);
    { const p = crownGeo.attributes.position; for (let i = 0; i < p.count; i++) { const y = (p.getY(i) - 0.38) / 0.95; p.setZ(i, -0.12 * y * y); } crownGeo.computeVertexNormals(); }
    crownMat = new T.MeshStandardMaterial({ map: tCluster, emissiveMap: tCluster, emissive: "#ffffff", emissiveIntensity: 0.5, alphaTest: 0.5, side: T.DoubleSide, roughness: 0.7 });  /* التوهج الخفيف يحاكي نفاذ الضوء عبر الورقة فلا تسودّ الجهة المظللة */
  }
  const crown = new T.InstancedMesh(crownGeo, crownMat, LEAF.length);
  crown.frustumCulled = false; crown.count = LEAF.length;
  { const c = new T.Color(); LEAF.forEach((d, i) => { c.setRGB(tCluster ? 1.15 + d.tone * 0.5 : 0.9 + d.tone * 0.45, tCluster ? 1.3 + d.tone * 0.35 : 1.0 + d.tone * 0.3, tCluster ? 0.95 + d.tone * 0.25 : 0.75 + d.tone * 0.2); crown.setColorAt(i, c); }); }
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _qa = new T.Quaternion(), _qw = new T.Quaternion(), _s = new T.Vector3();
  const X_AXIS = new T.Vector3(1, 0, 0), Z_AXIS = new T.Vector3(0, 0, 1);
  let crownHidden = false;
  scene.add(crown);
  function updateCrown(p, time) {
    if (p < 0.72) { if (!crownHidden) { _s.setScalar(0.0001); LEAF.forEach((d, i) => { _m.compose(d.pos, d.q, _s); crown.setMatrixAt(i, _m); }); crown.instanceMatrix.needsUpdate = true; crownHidden = true; } return; }
    crownHidden = false;
    const wind = 0.35 + 0.65 * smooth(p, 0.8, 0.97);
    for (let i = 0; i < LEAF.length; i++) {
      const d = LEAF[i], u = seg(p, d.p0, d.p0 + 0.07), e = u > 0 ? easeOutBack(u) : 0;
      _qa.setFromAxisAngle(X_AXIS, lerp(-0.25, d.tilt, e));
      _qw.setFromAxisAngle(Z_AXIS, Math.sin(time * 1.6 + d.ph + d.pos.x * 0.8) * 0.1 * wind * e);
      _q.copy(d.q).multiply(_qa).multiply(_qw);
      _s.setScalar(Math.max(0.0001, e * d.size));
      _m.compose(d.pos, _q, _s); crown.setMatrixAt(i, _m);
    }
    crown.instanceMatrix.needsUpdate = true;
  }

  /* ---------- غبار معلّق في الهواء ---------- */
  const N_DUST = isMobile ? 70 : 150, dpos = new Float32Array(N_DUST * 3), DR = rng(21);
  for (let i = 0; i < N_DUST; i++) { dpos[i * 3] = (DR() - 0.5) * 11; dpos[i * 3 + 1] = DR() * 9 - 2.5; dpos[i * 3 + 2] = (DR() - 0.5) * 9; }
  const dustGeo = new T.BufferGeometry(); dustGeo.setAttribute("position", new T.BufferAttribute(dpos, 3));
  const dust = new T.Points(dustGeo, new T.PointsMaterial({ map: glowTex, size: 0.09, transparent: true, opacity: 0.6, depthWrite: false, blending: T.AdditiveBlending, color: "#c8ecd2" }));
  scene.add(dust);

  /* ---------- قطرات الماء (نقاط متوهجة تسقط ثم تتسرب في التربة) ---------- */
  const N_DROP = isMobile ? 26 : 56, drop = new Float32Array(N_DROP * 3), dSpd = new Float32Array(N_DROP), DD = rng(33);
  for (let i = 0; i < N_DROP; i++) { drop[i * 3] = (DD() - 0.5) * 2.4; drop[i * 3 + 1] = DD() * 7 - 3.5; drop[i * 3 + 2] = 0.25 + DD() * 0.7; dSpd[i] = 0.5 + DD() * 0.7; }
  const dropGeo = new T.BufferGeometry(); dropGeo.setAttribute("position", new T.BufferAttribute(drop, 3));
  const dropMat = new T.PointsMaterial({ map: glowTex, size: 0.11, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, color: "#b9e6ff" });
  const drops = new T.Points(dropGeo, dropMat); drops.frustumCulled = false; scene.add(drops);

  /* ---------- وهج الشمس الدافئ (يظهر في المرحلة الأخيرة) ---------- */
  const sun = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: "#ffe2a0", transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
  sun.position.set(4.6, 6.2, -6); sun.scale.set(9, 9, 1); scene.add(sun);

  /* ---------- مسار الكاميرا (مفاتيح + منحنى ناعم) ---------- */
  const KEYS = [
    { p: 0.00, pos: [0.55, 0.72, 3.1], look: [0, 0.2, 0.12], fov: 32 },
    { p: 0.14, pos: [0.30, 0.50, 2.35], look: [0, 0.14, 0.12], fov: 32 },
    { p: 0.32, pos: [0.0, 0.10, 2.65], look: [0, -0.12, 0.12], fov: 34 },
    { p: 0.40, pos: [0.0, -1.4, 3.8], look: [0, -1.5, 0.1], fov: 38 },
    { p: 0.56, pos: [0.0, -2.3, 5.4], look: [0, -2.2, 0.1], fov: 40 },
    { p: 0.68, pos: [1.2, 0.4, 5.2], look: [0, 0.9, 0.1], fov: 40 },
    { p: 0.82, pos: [1.7, 1.5, 8.4], look: [0, 1.8, 0.1], fov: 40 },
    { p: 1.00, pos: [0.4, 2.6, 14.2], look: [0, 2.15, 0.1], fov: 40 },
  ];
  const posCurve = new T.CatmullRomCurve3(KEYS.map((k) => new T.Vector3(...k.pos)), false, "centripetal");
  const lookCurve = new T.CatmullRomCurve3(KEYS.map((k) => new T.Vector3(...k.look)), false, "centripetal");
  const _pos = new T.Vector3(), _look = new T.Vector3();
  let viewShift = 0; /* يرفع المشهد قليلاً ليبقى مكان للنص تحته */

  function applyCamera(p, time) {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const loc = seg(p, KEYS[i].p, KEYS[i + 1].p), u = (i + loc) / (KEYS.length - 1);
    posCurve.getPoint(u, _pos); lookCurve.getPoint(u, _look);
    if (camera.aspect < 1.2) _pos.sub(_look).multiplyScalar(1 + (1.2 - camera.aspect) * 0.75 * smooth(p, 0.55, 0.95)).add(_look); /* شاشات الطول: ابتعاد أكبر ليتسع التاج */
    _pos.x += Math.sin(time * 0.35) * 0.03; _pos.y += Math.cos(time * 0.27) * 0.02; /* تنفّس خفيف */
    camera.position.copy(_pos); camera.lookAt(_look);
    const fov = lerp(KEYS[i].fov, KEYS[i + 1].fov, loc);
    if (Math.abs(camera.fov - fov) > 1e-3) { camera.fov = fov; camera.updateProjectionMatrix(); }
  }

  /* ---------- تطبيق التقدّم على المشهد ---------- */
  const stepEls = [...root.querySelectorAll(".seed-step")];
  const barEl = root.querySelector(".seed-progress i");
  const STAGES = [0.15, 0.35, 0.58, 0.8, 1.01];
  let lastStage = -1, lastT = 0;

  function apply(p, time) {
    /* لون السماء والضباب */
    bg.copy(DARK).lerp(SKY, smooth(p, 0.6, 0.95)); scene.fog.color.copy(bg);
    scene.fog.density = lerp(0.03, 0.02, smooth(p, 0.05, 0.9));
    key.intensity = 1.8 + 1.2 * smooth(p, 0.6, 0.95);
    hemi.intensity = 0.9 + 0.3 * smooth(p, 0.6, 0.95);
    under.intensity = 11 * smooth(p, 0.3, 0.4) * (1 - smooth(p, 0.56, 0.66));

    /* البذرة: ارتجاف خفيف ثم انفتاح */
    const crack = smooth(p, 0.14, 0.3), wob = Math.sin(p * 220) * 0.012 * smooth(p, 0.09, 0.14) * (1 - smooth(p, 0.14, 0.18));
    halfR.rotation.z = -crack * 0.5 + wob; halfL.rotation.z = crack * 0.5 - wob;
    halfR.position.x = crack * 0.07; halfL.position.x = -crack * 0.07;
    seed.position.y = SEED_POS.y + Math.sin(time * 0.9) * 0.012 * (1 - crack);
    embryo.scale.set(0.07, 0.12, 0.06).multiplyScalar(smooth(p, 0.18, 0.3) + 0.0001);

    /* الجذور والساق */
    roots.forEach((r) => r.set(smooth(p, r.t0, r.t1)));
    const grown = smooth(p, STEM.t0, STEM.t1), mature = smooth(p, 0.64, 1.0);
    stem.set(grown, lerp(1, 4.2, mature));
    trunkMat.color.copy(GREEN_STEM).lerp(BARK, smooth(p, 0.7, 0.92));
    { const want = p > 0.74; if (want !== barkOn) { trunkMat.map = want ? barkTex : null; trunkMat.needsUpdate = true; barkOn = want; } }
    limbs.forEach((l) => { const g = smooth(p, l.t0, l.t1); l.set(g, lerp(l.th0, l.th1, smooth(p, l.t0, 1))); });
    leaves.forEach((l) => {
      const u = seg(p, l.t0, l.t0 + 0.12), e = u > 0 ? easeOutBack(u) : 0;
      l.grp.scale.setScalar(Math.max(0.0001, e * l.size * (1 - 0.55 * smooth(p, 0.86, 0.96))));
      l.mesh.rotation.z = -lerp(0.1, 1.15, smooth(u, 0, 1));
      l.mesh.rotation.x = Math.sin(time * 1.2 + l.i) * 0.04 * u;
    });
    updateCrown(p, time);

    /* التربة تميل للأخضر، والشمس تدفأ، والقطرات تظهر في مرحلة الرعاية */
    topMat.color.copy(TOP_A).lerp(TOP_B, smooth(p, 0.75, 0.98));
    sun.material.opacity = 0.5 * smooth(p, 0.72, 1.0); sun.position.x = 4.6 + Math.sin(time * 0.1) * 0.3;
    key.color.setRGB(1, 0.88 - 0.06 * smooth(p, 0.7, 1), 0.69 - 0.2 * smooth(p, 0.7, 1));
    dropMat.opacity = 0.85 * smooth(p, 0.06, 0.14) * (1 - smooth(p, 0.74, 0.86));
    if (dropMat.opacity > 0.01) {
      const dt = Math.min(0.05, time - lastT); const arr = dropGeo.attributes.position.array;
      for (let i = 0; i < N_DROP; i++) {
        const y = arr[i * 3 + 1] - dt * dSpd[i] * (arr[i * 3 + 1] > 0 ? 1.3 : 0.4); /* في التربة تبطؤ كأنها تتسرّب */
        arr[i * 3 + 1] = y < -3.5 ? 3.8 : y;
      }
      dropGeo.attributes.position.needsUpdate = true;
    }
    lastT = time;

    /* الكاميرا + الغبار */
    applyCamera(p, time);
    dust.position.y = Math.sin(time * 0.2) * 0.15; dust.rotation.y = time * 0.01;

    /* النصوص والمؤشرات */
    const si = STAGES.findIndex((s) => p < s);
    if (si !== lastStage) { stepEls.forEach((el, i) => el.classList.toggle("is-on", i === si)); root.classList.toggle("is-last", si === stepEls.length - 1); lastStage = si; }
    barEl.style.transform = `scaleY(${p.toFixed(3)})`;
  }

  /* ---------- الحجم والعرض ---------- */
  function resize() {
    const w = pinEl.clientWidth, h = pinEl.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    viewShift = w < 700 ? 0.14 : 0.07;
    camera.setViewOffset(w, h, 0, h * viewShift, w, h);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(pinEl);
  resize();

  /* ---------- التمرير (GSAP ScrollTrigger) ---------- */
  let target = fixedP ?? 0, cur = target, last = performance.now(), raf = 0, visible = true, ready = false, moveTimer = 0;
  let st = null;
  if (fixedP === null) {
    gsap.registerPlugin(ScrollTrigger);
    st = ScrollTrigger.create({
      trigger: root, start: "top top",
      end: () => "+=" + Math.round(window.innerHeight * (window.innerWidth < 700 ? 4.5 : 5.5)),
      pin: pinEl, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (self) => {
        target = self.progress;
        root.classList.add("is-moving");
        clearTimeout(moveTimer); moveTimer = setTimeout(() => root.classList.remove("is-moving"), 1200);
      },
    });
    target = cur = st.progress;
    root.querySelector(".seed-skip").addEventListener("click", () => window.scrollTo({ top: st.end + 2, behavior: "smooth" }));
  } else {
    root.classList.add("is-moving");
    root.querySelector(".seed-skip").hidden = true;
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    cur += (target - cur) * (1 - Math.exp(-dt * 7));
    if (Math.abs(target - cur) < 1e-4) cur = target;
    apply(cur, now / 1000);
    renderer.render(scene, camera);
    if (!ready) { ready = true; root.classList.add("is-ready"); }
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  /* لا نرسم إلا والمشهد ظاهر على الشاشة */
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) kick(); }, { threshold: 0 }).observe(root);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  window.addEventListener("pageshow", kick);

  /* للاختبار من وحدة التحكم: __seed.set(0.5) */
  window.__seed = { set: (v) => { target = cur = clamp(v); kick(); }, get: () => cur };
  kick();
})();
