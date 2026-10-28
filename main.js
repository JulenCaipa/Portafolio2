const root = document.documentElement;

document.getElementById('year').textContent = new Date().getFullYear();

// Language toggle (initial language is set inline in <head> to avoid a flash).
document.getElementById('lang-toggle').addEventListener('click', () => {
  const lang = root.dataset.lang === 'es' ? 'en' : 'es';
  root.dataset.lang = lang;
  root.lang = lang;
  try {
    localStorage.setItem('lang', lang);
  } catch (e) {}
});

// Certificate lightbox; without JS the links just open the image.
const dialog = document.getElementById('cert-dialog');
const dialogImg = dialog.querySelector('img');
document.querySelectorAll('[data-cert]').forEach((link) => {
  link.addEventListener('click', (e) => {
    if (!dialog.showModal) return;
    e.preventDefault();
    const title = link.closest('.cert').querySelector('h3');
    dialogImg.src = link.href;
    dialogImg.alt = title.innerText.trim();
    dialog.showModal();
  });
});
dialog.addEventListener('click', (e) => {
  if (e.target === dialog || e.target.closest('.dialog-close')) dialog.close();
});

const copyBtn = document.getElementById('copy-email');
const copyLabel = copyBtn.querySelector('.copy-label');
const copyDefault = copyLabel.innerHTML;
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(copyBtn.dataset.email);
    copyLabel.textContent = root.dataset.lang === 'es' ? '¡Copiado!' : 'Copied!';
  } catch (e) {
    copyLabel.textContent = copyBtn.dataset.email;
  }
  setTimeout(() => (copyLabel.innerHTML = copyDefault), 2000);
});

// Background: a slow-drifting network of points, like data flowing between nodes.
(() => {
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const LINK_DIST = 140;
  const POINTER_DIST = 180;
  let width = 0;
  let height = 0;
  let points = [];
  let color = '35 70 216';
  let frame = null;
  const pointer = { x: -9999, y: -9999 };

  function readColor() {
    color = getComputedStyle(root).getPropertyValue('--particle').trim() || color;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(90, Math.round((width * height) / 16000));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.4 + 0.8,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const q = points[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < LINK_DIST) {
          ctx.strokeStyle = `rgb(${color} / ${0.14 * (1 - d / LINK_DIST)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      const dp = Math.hypot(p.x - pointer.x, p.y - pointer.y);
      if (dp < POINTER_DIST) {
        ctx.strokeStyle = `rgb(${color} / ${0.28 * (1 - dp / POINTER_DIST)})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
      }

      ctx.fillStyle = `rgb(${color} / 0.45)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step() {
    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;
    }
    draw();
    frame = requestAnimationFrame(step);
  }

  function start() {
    cancelAnimationFrame(frame);
    if (reduceMotion.matches || document.hidden) draw();
    else frame = requestAnimationFrame(step);
  }

  readColor();
  resize();
  start();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      start();
    }, 150);
  });
  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  });
  document.addEventListener('pointerleave', () => {
    pointer.x = pointer.y = -9999;
  });
  document.addEventListener('visibilitychange', start);
  reduceMotion.addEventListener('change', start);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    readColor();
    draw();
  });
})();
