const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let width = 0;
let height = 0;
let animationFrame;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  createParticles();
}

function createParticles() {
  const count = Math.min(110, Math.max(46, Math.floor((width * height) / 18000)));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.9 + 0.6,
    glow: Math.random() * 0.55 + 0.2,
  }));
}

function drawWave(time) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let layer = 0; layer < 4; layer += 1) {
    ctx.beginPath();
    const yBase = height * (0.22 + layer * 0.18);
    for (let x = -20; x <= width + 20; x += 14) {
      const y = yBase + Math.sin((x + time * (0.018 + layer * 0.004)) / (120 + layer * 42)) * (26 + layer * 12);
      if (x === -20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = layer % 2 ? 'rgba(0, 200, 255, 0.22)' : 'rgba(0, 98, 230, 0.26)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();
}

function animate(time = 0) {
  ctx.clearRect(0, 0, width, height);
  drawWave(time);

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(125, 211, 252, ${particle.glow})`;
    ctx.shadowColor = 'rgba(0, 200, 255, 0.75)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    for (let j = index + 1; j < particles.length; j += 1) {
      const next = particles[j];
      const dx = particle.x - next.x;
      const dy = particle.y - next.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 120) {
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(next.x, next.y);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 * (1 - distance / 120)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  });

  animationFrame = requestAnimationFrame(animate);
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  resizeCanvas();
  animate();
  window.addEventListener('resize', resizeCanvas);
} else {
  canvas.remove();
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const modeButtons = document.querySelectorAll('[data-mode]');
const personalPricing = document.getElementById('personal-pricing');
const resellerPricing = document.getElementById('reseller-pricing');

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    modeButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    personalPricing.classList.toggle('active', mode === 'personal');
    resellerPricing.classList.toggle('active', mode === 'reseller');
  });
});

document.querySelectorAll('.faq-list details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('.faq-list details').forEach((other) => {
      if (other !== detail) other.open = false;
    });
  });
});

window.addEventListener('beforeunload', () => cancelAnimationFrame(animationFrame));

/* Keep browsing progress when switching language pages */
const scrollKey = 'strong8k_scroll_y';
document.querySelectorAll('.lang-menu a').forEach((link) => {
  link.addEventListener('click', () => {
    if (window.location.hash) {
      const clean = link.getAttribute('href').split('#')[0];
      link.setAttribute('href', `${clean}${window.location.hash}`);
    }
    localStorage.setItem(scrollKey, String(window.scrollY));
  });
});

window.addEventListener('load', () => {
  const saved = localStorage.getItem(scrollKey);
  if (saved) {
    localStorage.removeItem(scrollKey);
    window.setTimeout(() => window.scrollTo({ top: Number(saved), behavior: 'auto' }), 80);
  }
});

/* 24-hour trial countdown */
const countdown = document.querySelector('[data-countdown]');
if (countdown) {
  const output = countdown.querySelector('strong');
  const key = 'strong8k_trial_deadline';
  let deadline = Number(localStorage.getItem(key));
  if (!deadline || deadline < Date.now()) {
    deadline = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(key, String(deadline));
  }
  const tick = () => {
    const left = Math.max(0, deadline - Date.now());
    const hours = String(Math.floor(left / 3600000)).padStart(2, '0');
    const minutes = String(Math.floor((left % 3600000) / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    output.textContent = `${hours}:${minutes}:${seconds}`;
  };
  tick();
  window.setInterval(tick, 1000);
}

/* Channel and sports coverage quick filter */
const channelSearch = document.getElementById('channel-search');
const filterTargets = document.querySelectorAll('.channel-cloud span, .coverage-tags button');
function filterCoverage(value) {
  const query = value.trim().toLowerCase();
  filterTargets.forEach((item) => {
    const hit = !query || item.textContent.toLowerCase().includes(query);
    item.style.display = hit ? '' : 'none';
  });
}
if (channelSearch) {
  channelSearch.addEventListener('input', () => filterCoverage(channelSearch.value));
  document.querySelectorAll('.coverage-tags button').forEach((button) => {
    button.addEventListener('click', () => {
      channelSearch.value = button.textContent.trim();
      filterCoverage(channelSearch.value);
      channelSearch.focus();
    });
  });
}
