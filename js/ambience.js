/* أصوات الطبيعة: نهار/ليل بتدرّج ناعم + حفيف قصير. مطفي افتراضياً (المتصفح يمنع التشغيل التلقائي). */
(function () {
  const root = document.documentElement;
  const KEY = "gb-sound";
  const FILES = { day: "assets/day.mp3", night: "assets/night.mp3", rustle: "assets/rustle.mp3" };
  const VOL = { day: 0.5, night: 0.5, rustle: 0.35 };

  /* الوضع الليلي = data-theme="dark" (نفس اللي تستخدمه style.css) */
  const isNight = () => root.dataset.theme === "dark" || (document.body && document.body.dataset.theme === "dark");

  let ctx, master, bufs = {}, g = {}, on = false, busy = false, lastRustle = 0;

  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "amb-btn";
  document.body.appendChild(btn);

  const paint = () => {
    btn.textContent = on ? "🔊" : "🔇";
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "إيقاف أصوات الطبيعة" : "تشغيل أصوات الطبيعة");
  };
  paint();

  function mix() {
    if (!ctx || !g.day) return;
    const t = ctx.currentTime, night = isNight();
    g.day.gain.setTargetAtTime(night ? 0 : VOL.day, t, 0.8);
    g.night.gain.setTargetAtTime(night ? VOL.night : 0, t, 0.8);
  }

  async function start() {
    if (busy || on) return;
    busy = true;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      await ctx.resume();
      if (!master) {
        master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
        const load = async (k) => ctx.decodeAudioData(await (await fetch(FILES[k])).arrayBuffer());
        [bufs.day, bufs.night, bufs.rustle] = await Promise.all([load("day"), load("night"), load("rustle")]);
        ["day", "night"].forEach((k) => {
          const s = ctx.createBufferSource(); s.buffer = bufs[k]; s.loop = true;
          g[k] = ctx.createGain(); g[k].gain.value = 0;
          s.connect(g[k]); g[k].connect(master); s.start();
        });
      }
      on = true; localStorage.setItem(KEY, "1");
      master.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
      mix();
    } catch (e) { on = false; }
    busy = false; paint();
  }

  function stop() {
    on = false; localStorage.setItem(KEY, "0"); paint();
    if (!master) return;
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    setTimeout(() => { if (!on) ctx.suspend(); }, 800);
  }

  function rustle() {
    const now = Date.now();
    if (!on || !bufs.rustle || now - lastRustle < 4000) return;
    lastRustle = now;
    const s = ctx.createBufferSource(), v = ctx.createGain();
    s.buffer = bufs.rustle; v.gain.value = VOL.rustle;
    s.connect(v); v.connect(ctx.destination); s.start();
  }

  btn.addEventListener("click", () => (on ? stop() : start()));

  /* تغيّر الوضع (اللمبة أو تلقائي): الصوت يتبعه */
  const mo = new MutationObserver(() => { mix(); rustle(); });
  mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  mo.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });

  document.querySelectorAll(".tile").forEach((t) => t.addEventListener("pointerenter", rustle));

  document.addEventListener("visibilitychange", () => {
    if (!ctx || !on) return;
    document.hidden ? ctx.suspend() : ctx.resume();
  });

  /* لو كان مفعّل في زيارة سابقة: يبدأ عند أول لمسة */
  if (localStorage.getItem(KEY) === "1") {
    const first = (e) => { if (e.target === btn) return; start(); };
    addEventListener("pointerdown", first, { once: true });
    addEventListener("keydown", first, { once: true });
  }
})();
