(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const noMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const box = $('#ascii');
  const inkEl = $('#ascii-ink');
  const accEl = $('#ascii-acc');
  if (!box || !inkEl || !accEl) return;

  const GLYPHS = ' .:-=+*#%@';
  const COLS = 34;
  const BOOKS = [
    {
      title: 'East of Eden',
      quote: 'And now that you do not have to be perfect, you can be good.',
      author: 'John Steinbeck'
    },
    {
      title: 'Villette',
      quote: 'I am no bird; and no net ensnares me: I am a free human being with an independent will.',
      author: 'Charlotte Bronte'
    },
    {
      title: 'Persuasion',
      quote: 'You pierce my soul. I am half agony, half hope.',
      author: 'Jane Austen'
    }
  ];
  const pageCache = new Map();
  const HX = 0.60;
  const HY = 0.88;
  const HZ = 0.05;
  const LX = -0.448;
  const LY = 0.647;
  const LZ = -0.617;
  let C = 0;
  let R = 0;
  let cw = 5;
  let chH = 8;
  let aspect = 0.6;
  let page = 0;
  let flash = 0;
  let lastTurn = 0;
  let ptx = 0;
  let pty = 0;
  let tx = 0;
  let ty = 0;
  let dv = 0.02;
  const t0 = performance.now();

  function wrapWords(text, width) {
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      if (!line) line = word;
      else if (line.length + 1 + word.length <= width) line += ' ' + word;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function pageLines(pageIdx) {
    const key = pageIdx % BOOKS.length;
    if (pageCache.has(key)) return pageCache.get(key);
    const book = BOOKS[key];
    const header = '#'.repeat(Math.min(COLS, book.title.length + 4));
    const quoteLines = wrapWords(book.quote, COLS);
    const rows = [header, ''];
    rows.push(...quoteLines);
    while (rows.length < 8) rows.push('');
    rows.push(book.author);
    while (rows.length < 10) rows.push('');
    pageCache.set(key, rows);
    return rows;
  }

  function fit() {
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (!w || !h) return;
    R = Math.max(38, Math.min(62, Math.round(h / 8)));
    chH = h / R;
    inkEl.style.fontSize = accEl.style.fontSize = chH + 'px';
    inkEl.textContent = 'M'.repeat(40);
    const probe = document.createRange();
    probe.selectNodeContents(inkEl);
    const pw = probe.getBoundingClientRect().width;
    cw = pw > 0 ? pw / 40 : chH * 0.6;
    aspect = cw / chH;
    C = Math.max(20, Math.floor(w / cw));
    render(performance.now());
  }

  function front(u, v, base, out) {
    out.ch = '';
    out.acc = false;
    if (u < 0.02 || u > 0.98 || v < dv || v > 1 - dv) { out.d = 0.6; return; }
    if (u > 0.09 && u < 0.91 && v > 0.06 && v < 0.66) {
      const su = (u - 0.09) / 0.82;
      const sv = (v - 0.06) / 0.60;
      const ds = dv / 0.60;
      if (su < 0.024 || su > 0.976 || sv < ds || sv > 1 - ds) { out.d = 0.66; return; }
      if (flash > 1) { out.d = 1; return; }
      if (flash === 1) { out.d = 0.12; return; }
      if (sv > 0.9) {
        const n = BOOKS.length;
        out.d = (sv < 0.9 + ds && su > 0.09 && su < 0.91)
          ? (su < 0.09 + 0.82 * ((page % n) + 1) / n ? 0.8 : 0.14) : 0;
        return;
      }
      const mu = (su - 0.09) / 0.82;
      const mv = (sv - 0.09) / 0.78;
      if (mu < 0 || mu > 1 || mv < 0 || mv > 1) { out.d = 0; return; }
      const N = 10;
      const li = Math.floor(mv * N);
      const f = mv * N - li;
      if (f >= N * ds / 0.78) { out.d = 0; return; }
      const lines = pageLines(page);
      const lineText = lines[li] || '';
      const col = Math.floor(mu * COLS);
      if (col >= lineText.length) { out.d = 0; return; }
      out.ch = lineText[col];
      out.acc = li === 8 && lineText.length > 0;
      return;
    }
    if (v > 0.735 && v < 0.925 && u > 0.1 && u < 0.9) {
      const kx = (u - 0.1) / 0.8 * 10;
      const ky = (v - 0.735) / 0.19 * 4;
      const fx = kx - Math.floor(kx);
      const fy = ky - Math.floor(ky);
      if (fx > 0.2 && fx < 0.8 && fy >= 0.2 && fy < 0.2 + 4 * dv / 0.19) { out.d = 0.78; return; }
    }
    if ((u < 0.05 || u > 0.95) && v > 0.2 && v < 0.56) { out.d = 0.5; return; }
    out.d = base;
  }

  function render(now) {
    if (!C || !R) return;
    const t = (now - t0) / 1000;
    ptx += (tx - ptx) * 0.18;
    pty += (ty - pty) * 0.18;
    const yaw = -0.22 + 0.58 * Math.sin(t * 0.5) + ptx * 0.4;
    const pitch = 0.2 + 0.05 * Math.sin(t * 0.37) + pty * 0.18;
    const roll = 0;
    dv = 1 / (R * HY * Math.cos(pitch));
    const cy = Math.cos(yaw);
    const sy2 = Math.sin(yaw);
    const cx = Math.cos(pitch);
    const sx2 = Math.sin(pitch);
    const cz = Math.cos(roll);
    const sz = Math.sin(roll);
    const m = [
      cy * cz + sy2 * sx2 * sz, -cy * sz + sy2 * sx2 * cz, sy2 * cx,
      cx * sz, cx * cz, -sx2,
      -sy2 * cz + cy * sx2 * sz, sy2 * sz + cy * sx2 * cz, cy * cx
    ];
    const hx = [HX, HY, HZ];
    const d = [m[6], m[7], m[8]];
    const o = [0, 0, 0];
    const out = { d: 0, ch: '', acc: false };
    let ink = '';
    let acc = '';
    for (let r = 0; r < R; r++) {
      const y = 1 - 2 * (r + 0.5) / R;
      let li = '';
      let la = '';
      for (let c = 0; c < C; c++) {
        const x = (c + 0.5 - C / 2) * aspect * 2 / R;
        o[0] = m[0] * x + m[3] * y - m[6] * 10;
        o[1] = m[1] * x + m[4] * y - m[7] * 10;
        o[2] = m[2] * x + m[5] * y - m[8] * 10;
        let tmin = -1e9;
        let tmax = 1e9;
        let ax = -1;
        let sg = 0;
        let hit = true;
        for (let i = 0; i < 3; i++) {
          if (Math.abs(d[i]) < 1e-6) {
            if (Math.abs(o[i]) > hx[i]) { hit = false; break; }
            continue;
          }
          let t1 = (-hx[i] - o[i]) / d[i];
          let t2 = (hx[i] - o[i]) / d[i];
          let s = -1;
          if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; s = 1; }
          if (t1 > tmin) { tmin = t1; ax = i; sg = s; }
          if (t2 < tmax) tmax = t2;
          if (tmin > tmax) { hit = false; break; }
        }
        if (!hit || ax < 0) { li += ' '; la += ' '; continue; }
        const nx = m[ax] * sg;
        const ny = m[3 + ax] * sg;
        const nz = m[6 + ax] * sg;
        const diff = Math.max(0, nx * LX + ny * LY + nz * LZ);
        if (ax === 2 && sg < 0) {
          const px = o[0] + d[0] * tmin;
          const py = o[1] + d[1] * tmin;
          front((px + HX) / (2 * HX), (HY - py) / (2 * HY), 0.14 + 0.22 * (1 - diff), out);
          const g = out.ch || GLYPHS[Math.round(Math.min(1, out.d) * 9)];
          if (out.acc) { li += ' '; la += g; } else { li += g; la += ' '; }
        } else {
          li += GLYPHS[Math.round(Math.min(1, 0.58 + 0.42 * (1 - diff)) * 9)];
          la += ' ';
        }
      }
      ink += li + '\n';
      acc += la + '\n';
    }
    inkEl.textContent = ink;
    accEl.textContent = acc;
  }

  function tickFrame() {
    if (document.hidden || noMotion.matches) return;
    const now = performance.now();
    if (flash > 0) { flash--; if (flash === 0) page++; }
    else if (now - lastTurn > 4600) { lastTurn = now; flash = 3; }
    render(now);
  }

  box.addEventListener('pointermove', e => {
    const b = box.getBoundingClientRect();
    tx = ((e.clientX - b.left) / b.width - 0.5) * 2;
    ty = ((e.clientY - b.top) / b.height - 0.5) * 2;
  });
  box.addEventListener('pointerleave', () => { tx = 0; ty = 0; });

  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(box);
  else window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  else fit();
  lastTurn = performance.now();
  setInterval(tickFrame, 72);
})();
