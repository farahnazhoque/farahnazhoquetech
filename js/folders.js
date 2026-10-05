(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vp = $('#viewport');
  const folders = $$('.folder[data-role]');
  if (!folders.length) return;

  const noMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function openFolder(f, bring) {
    if (!f) return;
    folders.forEach(x => {
      const on = x === f;
      x.classList.toggle('open', on);
      $('.tab', x).setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    const role = f.dataset.role;
    try {
      history.replaceState(null, '', '#' + role);
    } catch (e) {}

    setTimeout(() => {
      if (!vp) return;
      const r = f.getBoundingClientRect();
      const v = vp.getBoundingClientRect();
      if (bring || r.top < v.top) {
        vp.scrollTo({ top: vp.scrollTop + (r.top - v.top) - 14, behavior: 'auto' });
      }
      window.FH?.updateFoot();
    }, noMotion.matches ? 0 : 270);
  }

  folders.forEach(f => $('.tab', f).addEventListener('click', () => openFolder(f, false)));

  document.addEventListener('click', e => {
    const role = e.target.closest('a[data-role]');
    if (!role) return;
    e.preventDefault();
    const f = folders.find(x => x.dataset.role === role.dataset.role);
    if (f) openFolder(f, true);
  });

  const hash = location.hash.slice(1);
  if (hash) {
    const f = folders.find(x => x.dataset.role === hash);
    if (f) openFolder(f, true);
  }
})();
