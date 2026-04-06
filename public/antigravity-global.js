/* ═══════════════════════════════════════════════
   ANTIGRAVITY GLOBAL BACKGROUND
   ═══════════════════════════════════════════════ */

(function () {

  /* ── CONFIG — edit freely ── */
  const CONFIG = {
    particleCount : 90,
    repelRadius   : 110,
    repelStrength : 7,
    riseSpeed     : 0.012,
    damping       : 0.97,
    trailLength   : 16,
    connectDist   : 100,
    cursorGlow    : 85,
    bgFade        : 'rgba(10,8,8,0.15)',

    words: [
      'build','deploy','Node.js','true','false','{ }','async',
      'await','[]','fn()','scale','SaaS','git','npm','api',
      'v2','init','push','fetch','const','=>','null',
      'port:3000','export','type','interface','return'
    ],

    colors: [
      [220, 60,  60],
      [200, 40,  40],
      [255, 80,  70],
      [180, 35,  35],
      [240, 65,  50]
    ]
  };

  /* ── INJECT CANVAS ── */
  const canvas = document.createElement('canvas');
  canvas.id = 'ag-canvas';
  canvas.style.cssText = [
    'position:fixed',
    'inset:0',
    'width:100%',
    'height:100%',
    'z-index:-1',
    'pointer-events:none',
    'display:block',
    'background:#080808'
  ].join(';');
  document.body.prepend(canvas);

  /* Make sure body stacks correctly */
  if (getComputedStyle(document.body).position === 'static') {
    document.body.style.position = 'relative';
  }

  const ctx = canvas.getContext('2d');
  let W, H, pts = [];
  const mouse = { x: -999, y: -999 };

  /* ── RESIZE ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── PARTICLE FACTORY ── */
  function mkParticle(randomY = false) {
    const c = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
    return {
      x     : Math.random() * W,
      y     : randomY ? Math.random() * H : H + 12,
      vx    : (Math.random() - 0.5) * 0.55,
      vy    : -(0.3 + Math.random() * 0.95),
      r     : 1.2 + Math.random() * 2.2,
      color : c,
      alpha : 0.25 + Math.random() * 0.45,
      trail : [],
      word  : CONFIG.words[Math.floor(Math.random() * CONFIG.words.length)],
      wa    : 0.05 + Math.random() * 0.10,
      ws    : 10   + Math.random() * 4
    };
  }

  /* ── SEED ── */
  function init() {
    pts = Array.from({ length: CONFIG.particleCount },
      () => mkParticle(true));
  }

  /* ── MOUSE / TOUCH ── */
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = -999; mouse.y = -999;
  });
  window.addEventListener('touchmove', e => {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  }, { passive: true });

  /* ── DRAW LOOP ── */
  function draw() {
    ctx.fillStyle = CONFIG.bgFade;
    ctx.fillRect(0, 0, W, H);

    if (pts.length < CONFIG.particleCount) pts.push(mkParticle());

    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      const [r, g, b] = p.color;

      /* Repulsion */
      const dx   = p.x - mouse.x;
      const dy   = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.repelRadius && dist > 0) {
        const f = (CONFIG.repelRadius - dist) / CONFIG.repelRadius;
        const s = f * f * CONFIG.repelStrength;
        p.vx += (dx / dist) * s;
        p.vy += (dy / dist) * s;
      }

      /* Physics */
      p.vy -= CONFIG.riseSpeed;
      p.vx *= CONFIG.damping;
      p.vy *= CONFIG.damping;

      /* Trail */
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > CONFIG.trailLength) p.trail.shift();

      p.x += p.vx;
      p.y += p.vy;

      /* Wrap X */
      if (p.x < -20)    p.x = W + 10;
      if (p.x > W + 20) p.x = -10;

      /* Respawn */
      if (p.y < -50) { pts.splice(i, 1); continue; }

      /* Word */
      ctx.font      = `${p.ws}px 'Space Mono', monospace`;
      ctx.fillStyle = `rgba(${r},${g},${b},${p.wa})`;
      ctx.fillText(p.word, p.x, p.y);

      /* Trail lines */
      for (let t = 1; t < p.trail.length; t++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${r},${g},${b},${(t / p.trail.length) * p.alpha * 0.45})`;
        ctx.lineWidth   = p.r * (t / p.trail.length) * 0.9;
        ctx.lineCap     = 'round';
        ctx.moveTo(p.trail[t - 1].x, p.trail[t - 1].y);
        ctx.lineTo(p.trail[t].x,     p.trail[t].y);
        ctx.stroke();
      }

      /* Particle dot */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`;
      ctx.fill();

      /* Halo */
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},0.05)`;
      ctx.fill();

      /* Connect nearby */
      for (let j = i - 1; j >= 0; j--) {
        const q  = pts[j];
        const d2 = Math.hypot(p.x - q.x, p.y - q.y);
        if (d2 < CONFIG.connectDist) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.05 * (1 - d2 / CONFIG.connectDist)})`;
          ctx.lineWidth   = 0.4;
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }

    /* Cursor glow */
    if (mouse.x > 0) {
      const grd = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, CONFIG.cursorGlow
      );
      grd.addColorStop(0, 'rgba(128,0,0,0.08)');
      grd.addColorStop(1, 'rgba(128,0,0,0)');
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, CONFIG.cursorGlow, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  /* ── BOOT ── */
  window.addEventListener('resize', () => { resize(); init(); });
  resize();
  init();
  draw();

})();
