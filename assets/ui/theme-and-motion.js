/**
 * DEV SENAI — Controlador de Tema (Dark/Light) & Scroll Reveal Fluido
 */
(() => {
  const THEME_KEY = 'devsenai-theme';

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  }

  function applyTheme(theme) {
    const normalized = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', normalized);
    document.documentElement.classList.toggle('dark', normalized === 'dark');
    try {
      localStorage.setItem(THEME_KEY, normalized);
    } catch {}

    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute(
        'aria-label',
        normalized === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'
      );
      const icon = btn.querySelector('isax-anim');
      if (icon) {
        icon.setAttribute('name', normalized === 'dark' ? 'sun' : 'moon');
        if (typeof icon.play === 'function') icon.play();
      }
      const label = btn.querySelector('[data-theme-label]');
      if (label) {
        label.textContent = normalized === 'dark' ? 'Claro' : 'Escuro';
      }
    });

    window.dispatchEvent(new CustomEvent('devsenai:theme-change', { detail: { theme: normalized } }));
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  function initScrollReveal() {
    const elements = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!elements.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      elements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = entry.target.getAttribute('data-reveal-delay');
            if (delay) {
              entry.target.style.setProperty('--reveal-delay', `${delay}ms`);
            }
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    // Garantia de segurança: nada fica oculto caso a página não dispare intersecção
    setTimeout(() => {
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.15) {
          el.classList.add('is-revealed');
        }
      });
    }, 900);
  }

  // Aplica o tema salvo imediatamente para evitar flash visual
  applyTheme(getSavedTheme());

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getSavedTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });
    initScrollReveal();
  });

  window.DevSenaiUI = {
    getTheme: getSavedTheme,
    applyTheme,
    toggleTheme,
    initScrollReveal
  };
})();
