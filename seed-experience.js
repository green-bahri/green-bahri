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
  renderer.toneMappingExposure = 1.08;

  const scene = new T.Scene();
  const DARK = new T.Color("#06120c"), SKY = new T.Color("#4a8a63"), bg = new T.Color();
  scene.background = bg;
  scene.fog = new T.FogExp2("#06120c", 0.05);
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 90);

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
  }, { repeat: [4, 2.6] });
  const topTex = soilTex.clone(); topTex.repeat.set(5, 3); topTex.needsUpdate = true;

  const seedTex = canvasTex(512, (g, s) => {
    g.fillStyle = "#7a5632"; g.fillRect(0, 0, s, s);
    dots(g, s, 5000, 1, 9, (r) => `rgba(${70 + r * 70 | 0},${44 + r * 44 | 0},${22 + r * 26 | 0},.28)`);
    g.strokeStyle = "rgba(40,24,10,.35)"; g.lineWidth = 1.4;
    for (let i = 0; i < 70; i++) { g.beginPath(); const x = R() * s, y = R() * s; g.moveTo(x, y); g.quadraticCurveTo(x + (R() - .5) * 90, y + (R() - .5) * 90, x + (R() - .5) * 120, y + (R() - .5) * 120); g.stroke(); }
  });
  const seedBump = canvasTex(256, (g, s) => {
    g.fillStyle = "#808080"; g.fillRect(0, 0, s, s);
    dots(g, s, 2600, 1, 6, (r) => `rgba(${r > .5 ? 255 : 0},${r > .5 ? 255 : 0},${r > .5 ? 255 : 0},.25)`);
  }, { color: false });

  const leafTex = canvasTex(256, (g, s) => {
    g.beginPath(); g.moveTo(s / 2, s * .98);
    g.bezierCurveTo(s * .02, s * .72, s * .08, s * .2, s / 2, s * .02);
    g.bezierCurveTo(s * .92, s * .2, s * .98, s * .72, s / 2, s * .98); g.closePath();
    const gr = g.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, "#2c7a35"); gr.addColorStop(1, "#86cf55");
    g.fillStyle = gr; g.fill();
    g.strokeStyle = "rgba(255,255,255,.38)"; g.lineWidth = 3; g.beginPath(); g.moveTo(s / 2, s * .98); g.lineTo(s / 2, s * .08); g.stroke();
    g.lineWidth = 1.6;
    for (let i = 1; i < 7; i++) { const y = s * (.9 - i * .11); g.beginPath(); g.moveTo(s / 2, y); g.lineTo(s * .18, y - s * .1); g.moveTo(s / 2, y); g.lineTo(s * .82, y - s * .1); g.stroke(); }
  });

  const glowTex = canvasTex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.35, "rgba(255,255,255,.35)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });

  /* ---------- الإضاءة ---------- */
  const hemi = new T.HemisphereLight("#7aa88f", "#1a1008", 0.55);
  const key = new T.DirectionalLight("#ffe0b0", 1.3); key.position.set(3, 5, 4);
  const rim = new T.DirectionalLight("#cfe9dd", 1.0); rim.position.set(-3, 2.5, -3);
  const under = new T.PointLight("#ffd1a0", 0, 0, 2); under.position.set(0, -2.2, 1.7);
  scene.add(hemi, key, rim, under);

  /* ---------- التربة (مقطع عرضي: الوجه الأمامي عند z = 0) ---------- */
  const soilSide = new T.MeshStandardMaterial({ color: "#2a1c11", roughness: 1 });
  const soil = new T.Mesh(
    new T.BoxGeometry(16, 9, 6),
    [soilSide, soilSide,
      new T.MeshStandardMaterial({ map: topTex, color: "#b8a999", roughness: 1 }),
      soilSide,
      new T.MeshStandardMaterial({ map: soilTex, roughness: 1 }),
      soilSide]
  );
  soil.position.set(0, -4.5, -3);
  scene.add(soil);

  /* ---------- البذرة (نصفان قابلان للانفتاح) ---------- */
  const SEED_POS = new T.Vector3(0, 0.12, 0.12);
  const SX = 0.3, SY = 0.46, SZ = 0.3; /* أنصاف الأبعاد */
  const seedMat = new T.MeshPhysicalMaterial({ map: seedTex, bumpMap: seedBump, bumpScale: 2.2, roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const capMat = new T.MeshStandardMaterial({ color: "#e7dcb4", roughness: 0.9, side: T.DoubleSide });
  const seed = new T.Group(); seed.position.copy(SEED_POS); scene.add(seed);

  function makeHalf(sign) {
    const pivot = new T.Group(); pivot.position.set(0, -SY, 0);
    const body = new T.Mesh(new T.SphereGeometry(1, 48, 32, sign > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI), seedMat);
    body.scale.set(SX, SY, SZ); body.position.y = SY;
    const cap = new T.Mesh(new T.CircleGeometry(1, 48), capMat);
    cap.rotation.y = sign > 0 ? -Math.PI / 2 : Math.PI / 2;
    cap.scale.set(SZ, SY, 1); cap.position.y = SY;
    pivot.add(body, cap); seed.add(pivot);
    return pivot;
  }
  const halfR = makeHalf(1), halfL = makeHalf(-1);

  const embryo = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshStandardMaterial({ color: "#a6dc6a", emissive: "#5fae3a", emissiveIntensity: 0.7, roughness: 0.6 }));
  embryo.position.set(0, 0, 0); embryo.scale.setScalar(0.0001); seed.add(embryo);

  /* ---------- أنبوب ينمو تدريجياً (للجذور والساق) ---------- */
  function growMaterial(color, params = {}) {
    const uniforms = { uGrow: { value: 0 } };
    const m = new T.MeshStandardMaterial({ color, roughness: 0.8, ...params });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uGrow = uniforms.uGrow;
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aT;\nattribute vec3 aC;\nuniform float uGrow;")
        .replace("#include <begin_vertex>", "vec3 transformed = aC + (position - aC) * clamp((uGrow - aT) / 0.05, 0.0, 1.0);");
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
    return { mesh, curve, mat: material, set(g) { material.userData.uniforms.uGrow.value = g * 1.05; } };
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

  /* ---------- الساق والأوراق (برعم مؤقت) ---------- */
  const stem = makeTube(
    [new T.Vector3(0, 0.3, 0.12), new T.Vector3(0.03, 0.9, 0.13), new T.Vector3(-0.05, 1.6, 0.12), new T.Vector3(0.06, 2.3, 0.12), new T.Vector3(0, 3.0, 0.12), new T.Vector3(0.12, 3.5, 0.12)],
    0.055, 0.02, growMaterial("#79bd58", { roughness: 0.7 }), { radial: 10, segs: 70 }
  );
  const STEM = { t0: 0.6, t1: 0.9 };
  scene.add(stem.mesh);

  const leafGeo = new T.PlaneGeometry(0.5, 0.8, 1, 8);
  leafGeo.translate(0, 0.4, 0);
  { const p = leafGeo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 0.8; p.setZ(i, -0.2 * y * y); } leafGeo.computeVertexNormals(); }
  const leafMat = new T.MeshStandardMaterial({ map: leafTex, alphaTest: 0.45, side: T.DoubleSide, roughness: 0.65 });
  const leaves = [];
  [0.3, 0.46, 0.6, 0.74, 0.88].forEach((t, i) => {
    const grp = new T.Group(), mesh = new T.Mesh(leafGeo, leafMat);
    grp.position.copy(stem.curve.getPointAt(t));
    grp.rotation.y = i * 2.4 + 0.5;
    grp.add(mesh); grp.scale.setScalar(0.0001); scene.add(grp);
    leaves.push({ grp, mesh, t0: STEM.t0 + (STEM.t1 - STEM.t0) * t, size: 0.85 + (t * 0.5), i });
  });

  /* ---------- غبار معلّق في الهواء ---------- */
  const N_DUST = isMobile ? 70 : 150, dpos = new Float32Array(N_DUST * 3), DR = rng(21);
  for (let i = 0; i < N_DUST; i++) { dpos[i * 3] = (DR() - 0.5) * 11; dpos[i * 3 + 1] = DR() * 9 - 2.5; dpos[i * 3 + 2] = (DR() - 0.5) * 9; }
  const dustGeo = new T.BufferGeometry(); dustGeo.setAttribute("position", new T.BufferAttribute(dpos, 3));
  const dust = new T.Points(dustGeo, new T.PointsMaterial({ map: glowTex, size: 0.09, transparent: true, opacity: 0.6, depthWrite: false, blending: T.AdditiveBlending, color: "#c8ecd2" }));
  scene.add(dust);

  /* ---------- مسار الكاميرا (مفاتيح + منحنى ناعم) ---------- */
  const KEYS = [
    { p: 0.00, pos: [0.55, 0.72, 3.1], look: [0, 0.2, 0.12], fov: 32 },
    { p: 0.14, pos: [0.30, 0.50, 2.35], look: [0, 0.14, 0.12], fov: 32 },
    { p: 0.32, pos: [0.0, 0.10, 2.65], look: [0, -0.12, 0.12], fov: 34 },
    { p: 0.40, pos: [0.0, -1.4, 3.8], look: [0, -1.5, 0.1], fov: 38 },
    { p: 0.56, pos: [0.0, -2.3, 5.4], look: [0, -2.2, 0.1], fov: 40 },
    { p: 0.68, pos: [1.2, 0.4, 5.2], look: [0, 0.9, 0.1], fov: 40 },
    { p: 0.84, pos: [1.5, 1.7, 6.2], look: [0, 1.7, 0.1], fov: 40 },
    { p: 1.00, pos: [0.6, 2.0, 7.4], look: [0, 1.5, 0.1], fov: 42 },
  ];
  const posCurve = new T.CatmullRomCurve3(KEYS.map((k) => new T.Vector3(...k.pos)), false, "centripetal");
  const lookCurve = new T.CatmullRomCurve3(KEYS.map((k) => new T.Vector3(...k.look)), false, "centripetal");
  const _pos = new T.Vector3(), _look = new T.Vector3();
  let viewShift = 0; /* يرفع المشهد قليلاً ليبقى مكان للنص تحته */

  function applyCamera(p, time) {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const loc = seg(p, KEYS[i].p, KEYS[i + 1].p), u = (i + loc) / (KEYS.length - 1);
    posCurve.getPoint(u, _pos); lookCurve.getPoint(u, _look);
    _pos.x += Math.sin(time * 0.35) * 0.03; _pos.y += Math.cos(time * 0.27) * 0.02; /* تنفّس خفيف */
    camera.position.copy(_pos); camera.lookAt(_look);
    const fov = lerp(KEYS[i].fov, KEYS[i + 1].fov, loc);
    if (Math.abs(camera.fov - fov) > 1e-3) { camera.fov = fov; camera.updateProjectionMatrix(); }
  }

  /* ---------- تطبيق التقدّم على المشهد ---------- */
  const stepEls = [...root.querySelectorAll(".seed-step")];
  const barEl = root.querySelector(".seed-progress i");
  const STAGES = [0.15, 0.35, 0.58, 0.8, 1.01];
  let lastStage = -1;

  function apply(p, time) {
    /* لون السماء والضباب */
    bg.copy(DARK).lerp(SKY, smooth(p, 0.6, 0.95)); scene.fog.color.copy(bg);
    scene.fog.density = lerp(0.05, 0.022, smooth(p, 0.05, 0.9));
    key.intensity = 1.3 + 1.5 * smooth(p, 0.6, 0.95);
    hemi.intensity = 0.55 + 0.5 * smooth(p, 0.6, 0.95);
    under.intensity = 11 * smooth(p, 0.3, 0.4) * (1 - smooth(p, 0.56, 0.66));

    /* البذرة: ارتجاف خفيف ثم انفتاح */
    const crack = smooth(p, 0.14, 0.3), wob = Math.sin(p * 220) * 0.012 * smooth(p, 0.09, 0.14) * (1 - smooth(p, 0.14, 0.18));
    halfR.rotation.z = -crack * 0.5 + wob; halfL.rotation.z = crack * 0.5 - wob;
    halfR.position.x = crack * 0.07; halfL.position.x = -crack * 0.07;
    seed.position.y = SEED_POS.y + Math.sin(time * 0.9) * 0.012 * (1 - crack);
    embryo.scale.set(0.07, 0.12, 0.06).multiplyScalar(smooth(p, 0.18, 0.3) + 0.0001);

    /* الجذور والساق */
    roots.forEach((r) => r.set(smooth(p, r.t0, r.t1)));
    stem.set(smooth(p, STEM.t0, STEM.t1));
    leaves.forEach((l) => {
      const u = seg(p, l.t0, l.t0 + 0.12), e = u > 0 ? easeOutBack(u) : 0;
      l.grp.scale.setScalar(Math.max(0.0001, e * l.size));
      l.mesh.rotation.z = -lerp(0.1, 1.15, smooth(u, 0, 1));
      l.mesh.rotation.x = Math.sin(time * 1.2 + l.i) * 0.04 * u;
    });

    /* الكاميرا + الغبار */
    applyCamera(p, time);
    dust.position.y = Math.sin(time * 0.2) * 0.15; dust.rotation.y = time * 0.01;

    /* النصوص والمؤشرات */
    const si = STAGES.findIndex((s) => p < s);
    if (si !== lastStage) { stepEls.forEach((el, i) => el.classList.toggle("is-on", i === si)); lastStage = si; }
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
