/**
 * Animate UI Motion Engine (Vanilla JS — 60fps, Zero Dependencies)
 * ---------------------------------------------------------------------------
 * Implementa os padrões de motion design do Animate UI:
 *  - Scroll Progress Bar ([data-scroll-progress])
 *  - Gravity Stars & Soft Topography Background Canvas ([data-animate-bg="gravity"])
 *  - Splitting Text Blur-Slide ([data-split-text])
 *  - Rotating / Sliding Words ([data-rotate-words])
 *  - Counting Numbers ([data-count-to])
 *  - Motion Highlight / Sliding Pill Tabs ([data-sliding-tabs])
 *  - Spotlight + 3D Spring Tilt Cards ([data-spotlight-card])
 *  - Magnetic Buttons ([data-magnetic])
 *  - Animated Copy Buttons ([data-copy-text])
 */
(() => {
  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Scroll Progress Bar */
  function initScrollProgress() {
    if (document.querySelector('.aui-scroll-progress')) return;
    const bar = document.createElement('div');
    bar.className = 'aui-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.prepend(bar);

    let ticking = false;
    function update() {
      ticking = false;
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
      bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* 2. Gravity Stars & Soft Topography Canvas */
  function initGravityBackground() {
    if (prefersReducedMotion()) return;
    if (document.body.getAttribute('data-animate-bg') !== 'gravity') return;
    if (document.querySelector('.aui-gravity-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'aui-gravity-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    const pointer = { x: -9999, y: -9999, active: false };
    let rafId = null;
    let isPaused = false;

    function createParticles() {
      const count = Math.min(68, Math.max(28, Math.floor((width * height) / 26000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        r: Math.random() * 1.5 + 0.85,
        alpha: Math.random() * 0.35 + 0.18
      }));
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    }

    function drawTopographyLines(time, isLight) {
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.055)' : 'rgba(56, 189, 248, 0.045)';
      const bands = 4;
      for (let b = 0; b < bands; b++) {
        ctx.beginPath();
        const baseY = (height / (bands + 1)) * (b + 1);
        for (let x = 0; x <= width; x += 64) {
          const wave =
            Math.sin(x * 0.0028 + time * 0.00035 + b * 1.4) * 26 +
            Math.cos(x * 0.0014 - time * 0.00022 + b) * 14;
          const y = baseY + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    function tick(time) {
      if (isPaused) return;
      ctx.clearRect(0, 0, width, height);
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      drawTopographyLines(time, isLight);

      const dotRGB = isLight ? '2, 132, 199' : '56, 189, 248';
      const lineRGB = isLight ? '15, 23, 42' : '148, 163, 184';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Atração gravitacional muito suave ao ponteiro
        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 48000 && distSq > 64) {
            const force = 0.014 / Math.sqrt(distSq);
            p.vx += dx * force;
            p.vy += dy * force;
          }
        }

        // Amortecimento para manter movimento fluido e sereno
        p.vx *= 0.986;
        p.vy *= 0.986;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 0.72) {
          p.vx = (p.vx / speed) * 0.72;
          p.vy = (p.vy / speed) * 0.72;
        } else if (speed < 0.08) {
          p.vx += (Math.random() - 0.5) * 0.02;
          p.vy += (Math.random() - 0.5) * 0.02;
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;
        if (p.y < -12) p.y = height + 12;
        if (p.y > height + 12) p.y = -12;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotRGB}, ${p.alpha})`;
        ctx.fill();

        // Conexões sutis próximas
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 135) {
            const lineAlpha = (1 - dist / 135) * (isLight ? 0.09 : 0.11);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${lineRGB}, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener('pointermove', (ev) => {
      pointer.x = ev.clientX;
      pointer.y = ev.clientY;
      pointer.active = true;
    }, { passive: true });
    window.addEventListener('pointerleave', () => { pointer.active = false; });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => {
      isPaused = document.hidden;
      if (!isPaused) rafId = requestAnimationFrame(tick);
      else if (rafId) cancelAnimationFrame(rafId);
    });

    resize();
    rafId = requestAnimationFrame(tick);
  }

  /* 3. Splitting Text (Word-by-Word Blur + Slide) */
  function initSplittingText() {
    document.querySelectorAll('[data-split-text]').forEach((el) => {
      if (el.dataset.splitDone === '1') return;
      el.dataset.splitDone = '1';

      const original = el.textContent.trim();
      if (!original) return;
      el.setAttribute('aria-label', original);

      const words = original.split(/\s+/);
      el.innerHTML = words
        .map((w, idx) => `<span class="aui-split-word" aria-hidden="true" style="--split-delay:${idx * 46}ms">${w}</span>`)
        .join(' ');

      if (prefersReducedMotion()) {
        el.classList.add('is-split-visible');
        return;
      }

      requestAnimationFrame(() => {
        setTimeout(() => el.classList.add('is-split-visible'), 60);
      });
    });
  }

  /* 4. Rotating / Sliding Words */
  function initRotatingWords() {
    document.querySelectorAll('[data-rotate-words]').forEach((el) => {
      if (el.dataset.rotateDone === '1') return;
      el.dataset.rotateDone = '1';

      const words = (el.getAttribute('data-rotate-words') || '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      if (words.length < 2) return;

      el.classList.add('aui-rotate-wrap');
      el.innerHTML = words
        .map((w, i) => `<span class="aui-rotate-item${i === 0 ? ' is-current' : ''}">${w}</span>`)
        .join('');

      if (prefersReducedMotion()) return;

      const items = Array.from(el.querySelectorAll('.aui-rotate-item'));
      let index = 0;
      setInterval(() => {
        if (document.hidden) return;
        const prev = items[index];
        index = (index + 1) % items.length;
        const next = items[index];

        prev.classList.remove('is-current');
        prev.classList.add('is-exiting');
        next.classList.remove('is-exiting');
        next.classList.add('is-current');

        setTimeout(() => {
          prev.classList.remove('is-exiting');
        }, 540);
      }, 3100);
    });
  }

  /* 5. Counting Numbers */
  function initCountingNumbers() {
    const els = Array.from(document.querySelectorAll('[data-count-to]'));
    if (!els.length) return;

    function animateEl(el) {
      if (el.dataset.counted === '1') return;
      el.dataset.counted = '1';
      const target = Number(el.getAttribute('data-count-to') || 0);
      const suffix = el.getAttribute('data-count-suffix') || '';
      if (prefersReducedMotion()) {
        el.textContent = `${target}${suffix}`;
        return;
      }
      const duration = 900;
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
        const val = Math.round(eased * target);
        el.textContent = `${val}${suffix}`;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (typeof IntersectionObserver === 'undefined') {
      els.forEach(animateEl);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateEl(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    els.forEach((el) => observer.observe(el));
  }

  /* 6. Motion Highlight / Sliding Pill Tabs */
  function syncSlidingTabs(container) {
    const indicator = container.querySelector(':scope > .aui-tab-indicator');
    const activeBtn = container.querySelector(':scope > button.is-tab-active');
    if (!indicator || !activeBtn) return;

    const cRect = container.getBoundingClientRect();
    const bRect = activeBtn.getBoundingClientRect();
    const x = bRect.left - cRect.left;
    const y = bRect.top - cRect.top;

    indicator.style.width = `${bRect.width}px`;
    indicator.style.height = `${bRect.height}px`;
    indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    indicator.style.opacity = '1';
  }

  function initSlidingTabs() {
    document.querySelectorAll('[data-sliding-tabs]').forEach((container) => {
      if (container.dataset.slidingReady === '1') return;
      container.dataset.slidingReady = '1';

      const indicator = document.createElement('span');
      indicator.className = 'aui-tab-indicator';
      indicator.setAttribute('aria-hidden', 'true');
      indicator.style.opacity = '0';
      container.prepend(indicator);

      const buttons = Array.from(container.querySelectorAll(':scope > button'));
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          buttons.forEach((b) => b.classList.toggle('is-tab-active', b === btn));
          requestAnimationFrame(() => syncSlidingTabs(container));
        });
      });

      const ro = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => syncSlidingTabs(container))
        : null;
      if (ro) ro.observe(container);

      window.addEventListener('resize', () => syncSlidingTabs(container), { passive: true });
      requestAnimationFrame(() => syncSlidingTabs(container));
      setTimeout(() => syncSlidingTabs(container), 250);
    });
  }

  /* 7. Spotlight + Soft 3D Spring Tilt Cards */
  function initSpotlightCards() {
    if (prefersReducedMotion()) return;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (!finePointer) return;

    document.querySelectorAll('[data-spotlight-card]').forEach((card) => {
      if (card.dataset.spotReady === '1') return;
      card.dataset.spotReady = '1';

      const allowTilt = card.getAttribute('data-spotlight-card') !== 'flat';
      let currentRX = 0;
      let currentRY = 0;
      let targetRX = 0;
      let targetRY = 0;
      let raf = null;

      function animateTilt() {
        currentRX += (targetRX - currentRX) * 0.14;
        currentRY += (targetRY - currentRY) * 0.14;

        if (Math.abs(targetRX - currentRX) > 0.02 || Math.abs(targetRY - currentRY) > 0.02) {
          card.style.transform = `perspective(900px) rotateX(${currentRX.toFixed(2)}deg) rotateY(${currentRY.toFixed(2)}deg) translateY(-3px)`;
          raf = requestAnimationFrame(animateTilt);
        } else {
          if (targetRX === 0 && targetRY === 0) {
            card.style.transform = '';
          } else {
            card.style.transform = `perspective(900px) rotateX(${targetRX.toFixed(2)}deg) rotateY(${targetRY.toFixed(2)}deg) translateY(-3px)`;
          }
          raf = null;
        }
      }

      card.addEventListener('pointermove', (ev) => {
        const rect = card.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const y = ev.clientY - rect.top;
        card.style.setProperty('--mx', `${x.toFixed(1)}px`);
        card.style.setProperty('--my', `${y.toFixed(1)}px`);
        card.style.setProperty('--spot-opacity', '1');

        if (allowTilt) {
          const nx = (x / rect.width) - 0.5;
          const ny = (y / rect.height) - 0.5;
          targetRY = nx * 4.4;   // máx ±2.2deg
          targetRX = -ny * 4.4;  // máx ±2.2deg
          if (!raf) raf = requestAnimationFrame(animateTilt);
        }
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--spot-opacity', '0');
        if (allowTilt) {
          targetRX = 0;
          targetRY = 0;
          if (!raf) raf = requestAnimationFrame(animateTilt);
        }
      });
    });
  }

  /* 8. Magnetic Buttons */
  function initMagneticButtons() {
    if (prefersReducedMotion()) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      if (btn.dataset.magReady === '1') return;
      btn.dataset.magReady = '1';

      btn.addEventListener('pointermove', (ev) => {
        const rect = btn.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width - 0.5) * 7;
        const y = ((ev.clientY - rect.top) / rect.height - 0.5) * 6;
        btn.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - 1.5).toFixed(1)}px, 0)`;
      }, { passive: true });

      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* 9. Animated Copy Buttons */
  function initCopyButtons() {
    document.querySelectorAll('[data-copy-text]').forEach((btn) => {
      if (btn.dataset.copyReady === '1') return;
      btn.dataset.copyReady = '1';

      btn.classList.add('aui-copy-btn');
      btn.addEventListener('click', async () => {
        const text = btn.getAttribute('data-copy-text') || '';
        if (!text) return;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }

        const icon = btn.querySelector('isax-anim');
        const label = btn.querySelector('[data-copy-label]');
        const origLabel = label ? label.textContent : null;
        btn.classList.add('is-copied');
        if (icon) {
          icon.setAttribute('name', 'tick-circle');
          if (typeof icon.play === 'function') icon.play();
        }
        if (label) label.textContent = 'Copiado!';

        clearTimeout(btn._copyTimer);
        btn._copyTimer = setTimeout(() => {
          btn.classList.remove('is-copied');
          if (icon) icon.setAttribute('name', 'copy');
          if (label && origLabel !== null) label.textContent = origLabel;
        }, 1800);
      });
    });
  }

  function refreshAll() {
    initScrollProgress();
    initGravityBackground();
    initSplittingText();
    initRotatingWords();
    initCountingNumbers();
    initSlidingTabs();
    initSpotlightCards();
    initMagneticButtons();
    initCopyButtons();
  }

  document.addEventListener('DOMContentLoaded', refreshAll);

  window.AnimateUI = {
    refresh: refreshAll,
    syncSlidingTabs
  };
})();
