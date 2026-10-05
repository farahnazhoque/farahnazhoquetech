(() => {
  const SITE = [
    { id: 'home', href: 'index.html', name: 'Home' },
    { id: 'experience', href: 'experience.html', name: 'Experience' },
    { id: 'about', href: 'about.html', name: 'About' }
  ];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const screenEl = $('#screen');
  const vp = $('#viewport');
  const wipe = $('#wipe');
  const pageId = document.body.dataset.page || 'home';
  const pageIndex = Math.max(0, SITE.findIndex(p => p.id === pageId));
  const noMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let busy = false;

  const RAMP = ['.', ':', '+', '#', '@'];
  const SEQ = [
    { lv: 0 }, { lv: 1 }, { lv: 2 },
    { lv: 4, solid: true, swap: true }, { lv: 3, solid: true }, { lv: 1, solid: true }, { lv: 0, solid: true }
  ];

  function refresh(then) {
    if (!screenEl || !wipe || noMotion.matches) {
      then();
      return;
    }
    if (busy) return;
    busy = true;
    const cols = Math.ceil(screenEl.clientWidth / 7) + 2;
    const rows = Math.ceil(screenEl.clientHeight / 12) + 1;
    let i = 0;
    wipe.hidden = false;
    (function step() {
      if (i >= SEQ.length) {
        wipe.hidden = true;
        wipe.textContent = '';
        wipe.classList.remove('solid');
        busy = false;
        then();
        return;
      }
      const s = SEQ[i++];
      wipe.classList.toggle('solid', !!s.solid);
      let out = '';
      for (let r = 0; r < rows; r++) {
        let line = '';
        for (let c = 0; c < cols; c++) {
          const n = Math.random();
          line += n < 0.18 ? ' ' : RAMP[Math.min(4, s.lv + (n > 0.72 ? 1 : 0))];
        }
        out += line + '\n';
      }
      wipe.textContent = out;
      if (s.swap) then();
      setTimeout(step, 58);
    })();
  }

  function navigate(href) {
    if (busy) return;
    const target = new URL(href, location.href);
    if (target.origin !== location.origin) {
      location.href = href;
      return;
    }
    refresh(() => { location.href = target.href; });
  }

  function isInternalPageLink(a) {
    if (!a || a.target === '_blank') return false;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:')) return false;
    const path = href.split('#')[0] || 'index.html';
    return SITE.some(p => p.href === path || (path === '' && p.href === 'index.html'));
  }

  /* ---- bottom bar ---- */
  const locText = $('#loc-text');
  const locBar = $('#loc-bar');
  const locPct = $('#loc-pct');
  const prev = $('#prev');
  const next = $('#next');

  function updateFoot() {
    if (!vp || !locText) return;
    const max = vp.scrollHeight - vp.clientHeight;
    const frac = max > 4 ? Math.min(1, Math.max(0, vp.scrollTop / max)) : 0;
    const p = (pageIndex + frac) / SITE.length;
    const cells = window.innerWidth < 600 ? 12 : 24;
    const on = Math.round(p * cells);
    locText.textContent = (pageIndex + 1) + '/' + SITE.length;
    locBar.textContent = '[' + '#'.repeat(on) + '-'.repeat(cells - on) + ']';
    locPct.textContent = String(Math.round(p * 100)).padStart(2, ' ') + '%';
    if (prev) {
      const hasPrev = pageIndex > 0;
      prev.setAttribute('aria-disabled', hasPrev ? 'false' : 'true');
      if (hasPrev) prev.href = SITE[pageIndex - 1].href;
    }
    if (next) {
      const hasNext = pageIndex < SITE.length - 1;
      next.setAttribute('aria-disabled', hasNext ? 'false' : 'true');
      if (hasNext) next.href = SITE[pageIndex + 1].href;
    }
  }

  if (vp) vp.addEventListener('scroll', updateFoot, { passive: true });
  window.addEventListener('resize', updateFoot);

  const turn = d => {
    const target = SITE[pageIndex + d];
    if (target) navigate(target.href);
  };

  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (link && isInternalPageLink(link)) {
      e.preventDefault();
      navigate(link.href);
      return;
    }
    if (!e.target.closest('#aa-panel') && !e.target.closest('#aa-btn')) closeAa();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAa();
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('#aa-panel')) return;
    if (e.key === 'ArrowRight') turn(1);
    if (e.key === 'ArrowLeft') turn(-1);
  });

  let sx = 0;
  let sy = 0;
  if (vp) {
    vp.addEventListener('touchstart', e => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    vp.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 80 && Math.abs(dy) < 45) turn(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---- clock ---- */
  const clock = $('#clock');
  function tick() {
    if (!clock) return;
    const d = new Date();
    let h = d.getHours() % 12;
    if (h === 0) h = 12;
    clock.textContent = h + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  tick();
  setInterval(tick, 20000);

  /* ---- Aa: display settings ---- */
  const aaBtn = $('#aa-btn');
  const aaPanel = $('#aa-panel');
  const sizes = [0.9, 1, 1.1, 1.2];
  const prefs = { size: 1, face: 'mono', mode: 'auto' };
  try {
    const saved = JSON.parse(localStorage.getItem('fh-display') || '{}');
    if (Number.isInteger(saved.size) && saved.size >= 0 && saved.size < sizes.length) prefs.size = saved.size;
    if (saved.face === 'mono' || saved.face === 'sans') prefs.face = saved.face;
    if (['auto', 'paper', 'night'].includes(saved.mode)) prefs.mode = saved.mode;
  } catch (e) {}

  function applyPrefs() {
    root.style.setProperty('--scale', sizes[prefs.size]);
    if (prefs.face === 'sans') root.dataset.face = 'sans';
    else delete root.dataset.face;
    if (prefs.mode === 'auto') delete root.dataset.mode;
    else root.dataset.mode = prefs.mode;
    $$('#size-dots i').forEach((d, i) => d.classList.toggle('on', i <= prefs.size));
    const down = $('#size-down');
    const up = $('#size-up');
    if (down) down.disabled = prefs.size === 0;
    if (up) up.disabled = prefs.size === sizes.length - 1;
    if (aaPanel) {
      $$('[data-face]', aaPanel).forEach(b =>
        b.setAttribute('aria-pressed', b.dataset.face === prefs.face ? 'true' : 'false'));
      $$('[data-mode]', aaPanel).forEach(b =>
        b.setAttribute('aria-pressed', b.dataset.mode === prefs.mode ? 'true' : 'false'));
    }
    try { localStorage.setItem('fh-display', JSON.stringify(prefs)); } catch (e) {}
    requestAnimationFrame(updateFoot);
  }

  function closeAa() {
    if (!aaPanel || !aaBtn) return;
    aaPanel.hidden = true;
    aaBtn.setAttribute('aria-expanded', 'false');
  }

  if (aaBtn && aaPanel) {
    aaBtn.addEventListener('click', () => {
      aaPanel.hidden = !aaPanel.hidden;
      aaBtn.setAttribute('aria-expanded', aaPanel.hidden ? 'false' : 'true');
    });
    $('#size-down')?.addEventListener('click', () => {
      if (prefs.size > 0) { prefs.size--; applyPrefs(); }
    });
    $('#size-up')?.addEventListener('click', () => {
      if (prefs.size < sizes.length - 1) { prefs.size++; applyPrefs(); }
    });
    $$('[data-face]', aaPanel).forEach(b =>
      b.addEventListener('click', () => { prefs.face = b.dataset.face; applyPrefs(); }));
    $$('[data-mode]', aaPanel).forEach(b =>
      b.addEventListener('click', () => {
        if (prefs.mode === b.dataset.mode) return;
        prefs.mode = b.dataset.mode;
        refresh(applyPrefs);
      }));
  }

  const mainPage = $('.page');
  if (mainPage) {
    mainPage.classList.add('enter');
  }

  applyPrefs();
  updateFoot();

  window.FH = { refresh, navigate, updateFoot };
})();
