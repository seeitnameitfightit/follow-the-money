/* Texas branch renderer: home (map + finder) and county pages. Reads <script id="texas-data">. */
(function () {
  const D = JSON.parse(document.getElementById('texas-data').textContent);
  const app = document.getElementById('app');
  const me = [...document.scripts].find(x => /assets\/texas\.js/.test(x.src));
  const ROOT = me.src.replace(/assets\/texas\.js.*$/, '');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const N = x => x == null ? 'n/a' : Math.round(x).toLocaleString('en-US');
  const lb = v => v == null ? 'n/a' : (v >= 0 ? 'D+' : 'R+') + Math.abs(v).toFixed(1);
  const cls = v => v >= 0 ? 'tx-d' : 'tx-r';
  const mg = (d, r) => (d - r) / (d + r) * 100;
  const years = D.state.years;
  const key = s => s.toLowerCase().replace(/[^a-z]/g, '');
  const col = m => { const a = Math.min(Math.abs(m), 40) / 40, t = 0.18 + 0.82 * a; const c = m >= 0 ? [47, 95, 168] : [200, 70, 61]; const w = 245; return `rgb(${c.map(x => Math.round(w + (x - w) * t)).join(',')})`; };
  const list = a => a.length < 2 ? a.join('') : a.length === 2 ? a.join(' and ') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

  const RN = { 'GOVERNOR': 'Governor', 'U. S. SENATOR': 'U.S. Senate', 'LIEUTENANT GOVERNOR': 'Lieutenant Governor', 'ATTORNEY GENERAL': 'Attorney General', 'COMPTROLLER OF PUBLIC ACCOUNTS': 'Comptroller', 'COMMISSIONER OF THE GENERAL LAND OFFICE': 'Land Commissioner', 'COMMISSIONER OF AGRICULTURE': 'Agriculture Commissioner', 'RAILROAD COMMISSIONER': 'Railroad Commissioner' };
  const pc1 = x => (x * 100).toFixed(1) + '%';
  const last = n => n.split(' ').slice(-1)[0];
  const bar = (label, v) => { const rv = v[1], dv = v[3], t = v[4] || (rv + dv), o = Math.max(0, t - rv - dv), m = mg(dv, rv);
    const seg = (c, f, txt, ttl) => f > 0 ? `<div class="sb-seg" style="flex:${f} 1 0;background:${c};color:#fff" title="${esc(ttl)}">${txt}</div>` : '';
    return `<div class="sb-row"><div class="sb-label"><b>${esc(label)}</b><span class="num">${N(t)} votes · <span class="${cls(m)}">${lb(m)}</span></span></div><div class="sb-track" style="height:22px">${seg('var(--dem)', dv / t, dv / t >= .14 ? `${esc(last(v[2]))} ${pc1(dv / t)}` : '', `${v[2]}: ${N(dv)}`)}${o > 0 ? `<div class="sb-seg" style="flex:${o / t} 1 0;background:var(--grid)" title="Others: ${N(o)}"></div>` : ''}${seg('var(--rep)', rv / t, rv / t >= .14 ? `${esc(last(v[0]))} ${pc1(rv / t)}` : '', `${v[0]}: ${N(rv)}`)}</div></div>`; };
  function chart(series, opts) {
    const W = 680, H = 300, L = 44, R = 12, T = 14, B = 26;
    const all = series.flatMap(s => s.v).filter(x => x != null);
    let lo = Math.min(0, ...all), hi = Math.max(0, ...all);
    const pad = Math.max(5, (hi - lo) * .06); lo -= pad; hi += pad;
    const step = (hi - lo) > 60 ? 20 : 10; lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    const x = i => L + (W - L - R) * i / (years.length - 1), y = v => T + (H - T - B) * (hi - v) / (hi - lo);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label)}">`;
    s += `<rect class="zd" x="${L}" y="${T}" width="${W - L - R}" height="${y(0) - T}"/><rect class="zr" x="${L}" y="${y(0)}" width="${W - L - R}" height="${H - B - y(0)}"/>`;
    for (let g = lo; g <= hi; g += step) { s += `<line class="${g === 0 ? 'zl' : 'gl'}" x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}"/><text class="ax" x="${L - 6}" y="${y(g) + 4}" text-anchor="end">${g === 0 ? 'Even' : (g > 0 ? 'D+' : 'R+') + Math.abs(g)}</text>`; }
    years.forEach((yr, i) => { if (i % 2 === 0 || years.length < 10) s += `<text class="ax" x="${x(i)}" y="${H - 8}" text-anchor="middle">${yr}</text>`; });
    s += `<text class="zt" x="${L + 6}" y="${T + 13}" fill="var(--dem)">MORE DEMOCRATIC</text><text class="zt" x="${L + 6}" y="${H - B - 6}" fill="var(--rep)">MORE REPUBLICAN</text>`;
    series.forEach(se => { const pts = se.v.map((v, i) => v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`).filter(Boolean); s += `<polyline class="${se.cls}" points="${pts.join(' ')}"/>`; });
    s += `<line class="cr" id="cx" x1="0" x2="0" y1="${T}" y2="${H - B}" style="display:none"/></svg><div class="tx-tip" style="display:none"></div>`;
    const box = document.createElement('div'); box.className = 'tx-ch'; box.innerHTML = s;
    const svg = box.querySelector('svg'), tip = box.querySelector('.tx-tip'), cx = box.querySelector('#cx');
    const move = e => {
      const r = svg.getBoundingClientRect(), px = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width * W;
      let i = Math.round((px - L) / (W - L - R) * (years.length - 1)); i = Math.max(0, Math.min(years.length - 1, i));
      cx.style.display = ''; cx.setAttribute('x1', x(i)); cx.setAttribute('x2', x(i));
      tip.innerHTML = `<b>${years[i]}</b>` + series.map(se => `<br>${esc(se.name)}: <span class="${cls(se.v[i])}">${lb(se.v[i])}</span>`).join('') + (opts.races ? `<br><small>${opts.races[i]}</small>` : '');
      tip.style.display = ''; const tx = x(i) / W * r.width; tip.style.left = Math.min(Math.max(tx - 50, 0), r.width - 150) + 'px'; tip.style.top = '8px';
    };
    const out = () => { tip.style.display = 'none'; cx.style.display = 'none'; };
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerleave', out); svg.addEventListener('touchmove', move, { passive: true }); svg.addEventListener('touchend', out);
    return box;
  }
  const RACE = i => { const y = years[i]; return y % 4 === 0 ? 'President' : (y === 2006 || y === 2018) ? 'U.S. Senate' : 'Governor'; };
  const RACES = years.map((y, i) => RACE(i));

  async function drawMap(host, mode, hereKey) {
    const M = await (await fetch(ROOT + 'assets/county_map.json?v=1')).json();
    const yi = M.years.length - 1, built = D.built || [];
    let h = `<svg viewBox="0 0 ${M.w} ${M.h}" role="img" aria-label="Map of Texas counties by 2026 governor margin">`;
    Object.keys(M.p).forEach(n => {
      const k = key(n), v = M.v[n] && M.v[n][yi], m = v ? v[0] : 0;
      const attrs = `d="${M.p[n]}" fill="${col(m)}" data-n="${esc(n)}" data-m="${m}"`;
      if (mode === 'home' && (built.includes(k) || k === 'tarrant')) h += `<a href="${ROOT}${k === 'tarrant' ? 'tarrant/index.html' : 'texas/county-' + k + '/'}"><path ${attrs}/></a>`;
      else if (mode === 'county') h += `<path ${attrs} class="${k === hereKey ? 'on' : 'dim'}"/>`;
      else h += `<path ${attrs}/>`;
    });
    h += '</svg><div class="tx-tip" style="display:none"></div>';
    host.innerHTML = h;
    if (mode === 'county') { const on = host.querySelector('path.on'); if (on) on.parentNode.appendChild(on); }
    const tip = host.querySelector('.tx-tip');
    host.addEventListener('pointermove', e => {
      const p = e.target.closest('path'); if (!p) { tip.style.display = 'none'; return; }
      const r = host.getBoundingClientRect(), m = +p.dataset.m;
      tip.innerHTML = `<b>${esc(p.dataset.n)}</b><br><span class="${cls(m)}">${lb(m)}</span> in 2026`;
      tip.style.display = ''; tip.style.left = Math.min(e.clientX - r.left + 12, r.width - 140) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px';
    });
    host.addEventListener('pointerleave', () => tip.style.display = 'none');
  }
  const mapKey = () => `<div class="tx-ml"><span><i style="background:${col(30)}"></i>Democratic</span><span><i style="background:${col(5)}"></i>Close</span><span><i style="background:${col(-5)}"></i>Close</span><span><i style="background:${col(-30)}"></i>Republican</span><span>Darker means a bigger margin.</span></div>`;

  function overTime(P) {
    const $ = s => app.querySelector(s), fmtN = N, mgn = (d, r) => (d + r) ? (d - r) / (d + r) * 100 : null, Y = null;
    const names = Object.keys(P.p), NY = P.years.length; let yi = NY - 1, mode = 'm', timer = null, hot = null;
    const tv0 = P.v.Tarrant; if (tv0 && D.tarTurn) P.years.forEach((yr, k) => { if (tv0[k] && D.tarTurn[yr] != null) tv0[k][1] = D.tarTurn[yr]; });
    $('#cm').innerHTML = `<svg viewBox="0 0 ${P.w} ${P.h}" role="img" aria-label="Map of Texas counties"><defs><pattern id="cm-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45) scale(${(P.w / 700).toFixed(2)})"><rect width="8" height="8" fill="var(--grid)"/><line x1="0" y1="0" x2="0" y2="8" stroke="var(--ink-3)" stroke-width="1.6" opacity=".5"/></pattern></defs><g class="pm-fg">${names.map(n => `<path class="pm-p" data-p="${esc(n)}" d="${P.p[n]}"/>`).join('')}</g><path d="${P.p.Tarrant}" fill="none" stroke="var(--ink)" stroke-width="2.5" vector-effect="non-scaling-stroke" pointer-events="none"/></svg><div class="pm-tip" hidden></div>`;
    const svg = $('#cm svg'), tip = $('#cm .pm-tip');
    const MG = v => v == null ? 'no result' : `${v >= 0 ? 'D' : 'R'}+${Math.abs(v).toFixed(1)}`;
    const col = n => { const v = P.v[n] && P.v[n][yi]; if (!v) return 'url(#cm-hatch)';
      if (mode === 'm') { const m = v[0]; if (m == null) return 'url(#cm-hatch)'; const k = Math.round(10 + 90 * Math.min(1, Math.abs(m) / 50) ** .8); return `color-mix(in oklab, var(${m >= 0 ? '--dem' : '--rep'}) ${k}%, var(--surface))`; }
      const t = v[1]; if (t == null) return 'url(#cm-hatch)'; const k = Math.round(6 + 84 * Math.max(0, Math.min(1, (t - 20) / 60))); return `color-mix(in oklab, var(--ink-2) ${k}%, var(--surface))`; };
    const HATCH = 'repeating-linear-gradient(45deg, var(--grid) 0 3px, color-mix(in oklab, var(--ink-3) 50%, var(--grid)) 3px 4.5px)';
    const key = () => { const sw = c => `<i class="sw" style="background:${c}"></i>`;
      $('#cm-key').innerHTML = mode === 'm'
        ? [-50, -30, -10, 0, 10, 30, 50].map(m => `<span>${sw(m ? `color-mix(in oklab, var(${m > 0 ? '--dem' : '--rep'}) ${Math.round(10 + 90 * Math.min(1, Math.abs(m) / 50) ** .8)}%, var(--surface))` : 'color-mix(in oklab, var(--dem) 10%, var(--surface))')}${m ? (m > 0 ? 'D+' : 'R+') + Math.abs(m) + (Math.abs(m) === 50 ? ' or more' : '') : 'Even'}</span>`).join('')
        : [30, 45, 60, 75].map(t => `<span>${sw(`color-mix(in oklab, var(--ink-2) ${Math.round(6 + 84 * Math.max(0, Math.min(1, (t - 20) / 60)))}%, var(--surface))`)}${t}%</span>`).join(''); };
    const draw = () => {
      svg.querySelectorAll('.pm-p').forEach(e => { e.style.fill = col(e.dataset.p); });
      const y = P.years[yi], vals = names.map(n => P.v[n] && P.v[n][yi]).filter(Boolean);
      $('#cm-lab').textContent = `${y} · ${P.race[yi]}`;
      const D_ = vals.reduce((a, v) => a + (v[3] || 0), 0), R_ = vals.reduce((a, v) => a + (v[2] || 0), 0), tot = vals.reduce((a, v) => a + (v[5] || 0), 0), reg = vals.reduce((a, v) => a + (v[4] || 0), 0);
      if (mode === 'm') { const d = vals.filter(v => v[0] != null && v[0] > 0).length, r = vals.filter(v => v[0] != null && v[0] < 0).length;
        $('#cm-sum').textContent = `In ${y}, Democrats carried ${d} Texas ${d === 1 ? 'county' : 'counties'} and Republicans ${r}. Statewide the ${P.race[yi]} race was ${MG(mgn(D_, R_))}.`; }
      else $('#cm-sum').textContent = `In ${y}, ${pc1(tot / reg)} of the registered voters on the state’s count voted in the ${P.race[yi]} race (${fmtN(tot)} votes).`;
      if (hot) showTip(hot.p, hot.x, hot.y); };
    const spark = n => { const v = P.v[n] || [], W = 220, H = 56, ms = v.map(x => x && x[0]), top = Math.max(20, ...ms.filter(m => m != null).map(Math.abs)), X = i => 6 + i / (NY - 1) * (W - 12), Yy = m => 4 + (top - m) / (2 * top) * (H - 8);
      let d = '', pen = false; ms.forEach((m, i) => { if (m == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${X(i).toFixed(1)},${Yy(m).toFixed(1)}`; pen = true; });
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><line x1="0" x2="${W}" y1="${Yy(0)}" y2="${Yy(0)}" stroke="var(--ink-3)" stroke-dasharray="2 3"/><path d="${d}" fill="none" stroke="var(--ink-2)" stroke-width="1.5"/>${ms.map((m, i) => m == null ? '' : `<circle cx="${X(i)}" cy="${Yy(m)}" r="${i === yi ? 4 : 2}" fill="var(${m >= 0 ? '--dem' : '--rep'})"/>`).join('')}<text x="2" y="${H - 1}" font-size="9" fill="var(--ink-3)">${P.years[0]}</text><text x="${W - 2}" y="${H - 1}" font-size="9" fill="var(--ink-3)" text-anchor="end">${P.years[NY - 1]}</text></svg>`; };
    const showTip = (n, x, y) => { const v = (P.v[n] || [])[yi] || [null, null], cd = P.cand[yi];
      tip.innerHTML = `<b>${esc(n)} County</b><br>${P.years[yi]} ${esc(P.race[yi])}: <b>${MG(v[0])}</b>${v[3] != null ? `<br><small>${esc(cd[1])} ${fmtN(v[3])} · ${esc(cd[0])} ${fmtN(v[2])}</small>` : ''}${v[1] != null ? `<br>turnout ${v[1]}%` : ''}${spark(n)}<small>Margin in each November election since ${P.years[0]}</small>`;
      tip.hidden = false; const box = $('#cm').getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.left = Math.max(4, Math.min(box.width - tw - 4, x + 14)) + 'px'; tip.style.top = Math.max(4, y - th - 12 < 0 ? y + 16 : y - th - 12) + 'px'; };
    const go = n => { const k = (n || '').toLowerCase().replace(/[^a-z]/g, ''), el = $('#cm-go'); if (!el) return; if (!n) { el.innerHTML = ''; return; }
      const lk = k === 'tarrant' ? ROOT + 'tarrant/index.html' : (D.built.includes(k) ? ROOT + 'texas/county-' + k + '/' : null);
      el.innerHTML = lk ? `<a href="${lk}">Open the ${esc(n)} County page ›</a>` : ''; };
    const at = ev => { const b = $('#cm').getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; };
    const setHot = (e, ev) => { svg.querySelectorAll('.pm-hot').forEach(x => x.classList.remove('pm-hot'));
      if (!e) { hot = null; tip.hidden = true; go(null); return; } e.classList.add('pm-hot'); e.parentNode.appendChild(e); const [x, y] = at(ev); hot = { p: e.dataset.p, x, y }; showTip(hot.p, x, y); go(hot.p); };
    svg.addEventListener('pointermove', ev => { if (ev.pointerType !== 'mouse') return; setHot(ev.target.closest('.pm-p'), ev); });
    svg.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') setHot(null); });
    svg.addEventListener('click', ev => { const e = ev.target.closest('.pm-p'); setHot(e && (!hot || hot.p !== e.dataset.p) ? e : null, ev); });
    const yr = $('#cm-yr'), play = $('#cm-play');
    const stop = () => { clearInterval(timer); timer = null; play.textContent = '▶'; play.setAttribute('aria-label', 'Play through the years'); };
    yr.addEventListener('input', () => { stop(); yi = +yr.value; draw(); });
    play.addEventListener('click', () => { if (timer) return stop(); if (yi >= NY - 1) { yi = 0; yr.value = 0; draw(); }
      play.textContent = '❚❚'; play.setAttribute('aria-label', 'Pause'); timer = setInterval(() => { if (yi >= NY - 1) return stop(); yi++; yr.value = yi; draw(); }, 1100); });
    document.querySelectorAll('#cm-mode button').forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; document.querySelectorAll('#cm-mode button').forEach(x => x.setAttribute('aria-pressed', x === b)); key(); draw(); }));
    key(); draw();
    // ---- counties against Texas, as a line chart
    (() => {
      const add = $('#cl-add'), cl = $('#cl'), PAL = ['#4a7db5', '#c0682f', '#2a7b73', '#c9a227', '#6b8e23', '#7b5ea7', '#b0447a'], MAXC = 8;
      let chosen = ['Tarrant'], cmode = 'm', hoverI = null, geo = null;
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      const TX = P.years.map((_, i) => { let r = 0, d = 0, rg = 0, tt = 0;
        names.forEach(n => { const v = P.v[n] && P.v[n][i]; if (!v) return; r += v[2] || 0; d += v[3] || 0; if (v[4]) { rg += v[4]; tt += v[5] || 0; } });
        return [mgn(d, r), rg ? Math.round(tt / rg * 1000) / 10 : null, r, d]; });
      const W = 860, H = 430, L = 54, R = 150, T = 16, B = 32, X = i => L + i / (NY - 1) * (W - L - R);
      const pres = P.race.map(r => r === 'President');
      const pick = (arr, i) => { const v = arr && arr[i]; return v ? (cmode === 'm' ? v[0] : v[1]) : null; };
      const lab = v => cmode === 'm' ? MG(v) : (v == null ? 'no data' : v.toFixed(1) + '%');
      const tick = v => cmode === 'm' ? (v === 0 ? 'Even' : (v > 0 ? 'D+' : 'R+') + Math.abs(v)) : v + '%';
      const colorOf = n => n === 'Tarrant' ? 'var(--ink)' : PAL[chosen.filter(x => x !== 'Tarrant').indexOf(n) % PAL.length];
      const lastIdx = a => { for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return i; return -1; };
      const chips = () => { $('#cl-chips').innerHTML = chosen.map(n => `<span style="display:inline-flex;align-items:center;gap:6px;border:1px solid var(--rule);border-radius:999px;padding:2px 4px 2px 10px;font-size:13px;background:var(--surface)"><i style="width:14px;height:4px;border-radius:2px;background:${colorOf(n)};display:inline-block"></i>${esc(n)}${chosen.length > 1 ? `<button type="button" data-n="${esc(n)}" aria-label="Remove ${esc(n)}" style="border:0;background:none;color:var(--ink-3);cursor:pointer;font-size:15px;line-height:1;padding:0 6px">×</button>` : ''}</span>`).join('');
        add.innerHTML = `<option value="">${chosen.length >= MAXC ? 'Remove one to add another' : 'Choose a county…'}</option>` + sorted.filter(n => !chosen.includes(n)).map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join(''); add.disabled = chosen.length >= MAXC; };
      const render = () => {
        chips();
        const S = chosen.map(n => ({ n, a: P.years.map((_, i) => pick(P.v[n], i)), c: colorOf(n), w: n === 'Tarrant' ? 4.5 : 2.4 }));
        const tv = P.years.map((_, i) => cmode === 'm' ? TX[i][0] : TX[i][1]), all = [...S.flatMap(s => s.a), ...tv].filter(x => x != null); let lo, hi; const ticks = [];
        if (cmode === 'm') { const m = Math.max(20, ...all.map(Math.abs)), st = m > 60 ? 50 : m > 30 ? 20 : 10, top = Math.ceil(m / st) * st; lo = -top; hi = top; for (let t = lo; t <= hi; t += st) ticks.push(t); }
        else { lo = Math.max(0, Math.floor((Math.min(...all, 100) - 5) / 10) * 10); hi = Math.min(100, Math.ceil((Math.max(...all, 0) + 5) / 10) * 10); const st = hi - lo > 50 ? 20 : 10; for (let t = lo; t <= hi; t += st) ticks.push(t); }
        const Y = v => T + (hi - v) / (hi - lo) * (H - T - B); geo = { S, tv };
        const path = a => { let d = '', pen = false; a.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`; pen = true; }); return d; };
        const dots = (a, c, r) => a.map((v, i) => v == null ? '' : `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="${r}" fill="${pres[i] ? c : 'var(--surface)'}" stroke="${c}" stroke-width="${pres[i] ? 1 : 2}"/>`).join('');
        const series = [...S.map(s => ({ name: s.n, a: s.a, c: s.c, w: s.w, dash: '' })), { name: 'Texas', a: tv, c: '#888', w: 2.8, dash: '7 5' }];
        // end labels, nudged apart so they do not overlap
        const ends = series.map(s => { const li = lastIdx(s.a); return li < 0 ? null : { s, li, y: Y(s.a[li]) }; }).filter(Boolean).sort((p, q) => p.y - q.y);
        ends.forEach((e, k) => { e.ly = k ? Math.max(e.y, ends[k - 1].ly + 15) : e.y; }); for (let k = ends.length - 1; k >= 0; k--) { const mx = H - B - 2 - (ends.length - 1 - k) * 15; if (ends[k].ly > mx) ends[k].ly = mx; }
        const sum = `In ${P.years[NY - 1]}: ` + series.map(s => `${s.name} ${lab(s.a[NY - 1])}`).join(', ') + '.';
        $('#cl-sum').textContent = sum;
        cl.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc('Line chart. ' + sum)}" style="width:100%;height:auto;max-height:520px">
          ${cmode === 'm' ? `<rect x="${L}" y="${T}" width="${W - L - R + 24}" height="${Y(0) - T}" fill="color-mix(in oklab, var(--dem) 9%, var(--surface))"/><text x="${L + 8}" y="${T + 16}" font-size="13" font-weight="700" fill="var(--ink)">More Democratic ↑</text><text x="${(L + W - R) / 2}" y="${H - B - 8}" font-size="13" font-weight="700" fill="var(--ink)" text-anchor="middle">More Republican ↓</text>` : ''}
          ${ticks.map(t => `<line x1="${L}" x2="${W - R + 24}" y1="${Y(t)}" y2="${Y(t)}" stroke="${cmode === 'm' && t === 0 ? 'var(--ink-2)' : 'var(--grid)'}" stroke-width="${cmode === 'm' && t === 0 ? 1.6 : 1}"/><text x="${L - 8}" y="${Y(t) + 4}" font-size="12" fill="var(--ink-2)" text-anchor="end">${tick(t)}</text>`).join('')}
          ${P.years.map((y, i) => `<text x="${X(i)}" y="${H - 10}" font-size="12" fill="var(--ink-2)" text-anchor="middle">${y}</text>`).join('')}
          ${[...series].reverse().map(s => `<path d="${path(s.a)}" fill="none" stroke="${s.c}" stroke-width="${s.w}" stroke-linejoin="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>${dots(s.a, s.c, s.w > 4 ? 5 : 3.5)}`).join('')}
          ${ends.map(e => `<text x="${X(e.li) + 12}" y="${e.ly + 4}" font-size="13"${e.s.name === 'Tarrant' ? ' font-weight="700"' : ''} fill="${e.s.c}">${esc(e.s.name)}  ${lab(e.s.a[e.li])}</text>`).join('')}
          <line id="cl-g" y1="${T}" y2="${H - B}" stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="3 3" hidden/>
          <rect x="${L}" y="${T}" width="${W - L - R + 24}" height="${H - T - B}" fill="transparent" style="cursor:crosshair"/></svg><div class="pm-tip" hidden style="max-width:280px"></div>`;
        $('#cl-key').innerHTML = `<span><svg width="12" height="12"><circle cx="6" cy="6" r="4.5" fill="var(--ink-2)"/></svg>Presidential year</span><span><svg width="12" height="12"><circle cx="6" cy="6" r="4" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="2"/></svg>Other year</span><span><i class="sw" style="background:repeating-linear-gradient(90deg,#888 0 6px,transparent 6px 10px);height:3px;border:0"></i>Texas</span>`;
        if (hoverI != null) show(hoverI);
      };
      const show = i => { const g = $('#cl-g'), tip = $('#cl .pm-tip'); if (!g || !geo) return; hoverI = i; const cd = P.cand[i];
        g.setAttribute('x1', X(i)); g.setAttribute('x2', X(i)); g.removeAttribute('hidden');
        const rows = [...geo.S.map(s => ({ n: s.n, v: s.a[i], c: s.c })), { n: 'Texas', v: geo.tv[i], c: '#888' }].sort((p, q) => (q.v ?? -1e9) - (p.v ?? -1e9));
        tip.innerHTML = `<b>${P.years[i]} ${esc(P.race[i])}</b><br><small>${esc(cd[1])} (D) vs ${esc(cd[0])} (R)</small>` + rows.map(r => `<div style="display:flex;justify-content:space-between;gap:14px"><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${r.c};margin-right:5px"></i>${esc(r.n)}</span><b>${lab(r.v)}</b></div>`).join('');
        tip.hidden = false; const box = cl.getBoundingClientRect(), px = X(i) / W * box.width, tw = tip.offsetWidth;
        tip.style.left = Math.max(4, px + 14 + tw > box.width - 4 ? px - tw - 14 : px + 14) + 'px'; tip.style.top = '8px'; };
      const move = ev => { const svg = $('#cl svg'); if (!svg) return; const b = svg.getBoundingClientRect(), x = (ev.clientX - b.left) / b.width * W; show(Math.max(0, Math.min(NY - 1, Math.round((x - L) / (W - L - R) * (NY - 1))))); };
      cl.addEventListener('pointermove', move); cl.addEventListener('pointerdown', move);
      cl.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') { hoverI = null; const g = $('#cl-g'), tip = $('#cl .pm-tip'); if (g) g.setAttribute('hidden', ''); if (tip) tip.hidden = true; } });
      add.addEventListener('change', () => { if (add.value && chosen.length < MAXC && !chosen.includes(add.value)) chosen.push(add.value); render(); });
      $('#cl-chips').addEventListener('click', ev => { const b = ev.target.closest('button[data-n]'); if (b && chosen.length > 1) { chosen = chosen.filter(n => n !== b.dataset.n); render(); } });
      document.querySelectorAll('#cl-mode button').forEach(b => b.addEventListener('click', () => { cmode = b.dataset.m; document.querySelectorAll('#cl-mode button').forEach(x => x.setAttribute('aria-pressed', x === b)); render(); }));
      render();
    })();
  }

  function home() {
    const S = D.state, m26 = mg(S.d26, S.r26), to = S.cast / S.reg * 100;
    document.title = 'Texas: every county, 1992 to 2026 · See It. Name It. Fight It.';
    app.innerHTML = `<header><div class="eyebrow"><span>Texas</span><span>254 counties</span><span>1992 to 2026</span></div>
      <h1>Texas, county by county</h1>
      <p class="dek">Texas went ${lb(m26)} for governor in 2026, with ${S.blue} Democratic counties. This is where each county's story lives: how it voted every election since 1992, who lives there, and how it stacks up against the state.</p>
      <p class="asof">Each county page starts from the series <b>Texas didn't swing. It climbed.</b> A few counties are up so far; the rest are coming.</p></header>
    <section class="tx-sec"><div class="stats"><div><b class="${cls(m26)}">${lb(m26)}</b><span>Texas margin, governor 2026</span></div><div><b>${S.blue}</b><span>Democratic counties, 2026</span></div><div><b>${to.toFixed(1)}%</b><span>of registered voters cast a ballot</span></div></div></section>
    <section class="tx-sec" id="cm-sec"><h2>County by county, 2000 to 2026</h2>
      <p class="sub">All 254 Texas counties, colored by the top-of-ticket result in each November election, or by turnout. Drag the slider or press play to watch the state change, and tap a county for its history. Tarrant is outlined.</p>
      <div class="pm-ctl"><div class="seg" role="group" aria-label="Color by" id="cm-mode"><button type="button" aria-pressed="true" data-m="m">Margin</button><button type="button" aria-pressed="false" data-m="t">Turnout</button></div>
        <button type="button" id="cm-play" class="pm-play" aria-label="Play through the years">▶</button><input type="range" id="cm-yr" min="0" max="13" step="1" value="13" aria-label="Election"><b id="cm-lab" class="pm-lab"></b></div>
      <p id="cm-sum" class="pm-sum"></p>
      <div class="pm" id="cm"><p class="note">Loading the map…</p></div><div id="cm-key" class="pm-key"></div><p id="cm-go" class="note"></p>
      <p class="note">The race shown is President in presidential years and governor in midterms, except 2006 and 2018, which use the U.S. Senate race (a four-way governor’s race in 2006, a weak Democratic nominee for governor in 2018). The margin is the Democrat minus the Republican as a share of the two. Turnout is the votes in that race as a share of the state’s registered voters; Tarrant’s own turnout uses the county’s registered-voter count. Sources: Texas Secretary of State county-by-county results, 2000 to 2026. For the 2026 map and every 2026 race, see <a href="${ROOT}turnout/index.html">2026 Across Texas</a>.</p></section>
    <section class="tx-sec"><h2>Texas since 1992</h2><p class="sub">Statewide margin in the top-of-ticket race each election. Up is more Democratic.</p><div id="sl"></div><p class="note">President in presidential years, governor in the other midterms, U.S. Senate in 2006 and 2018. Hover or touch a year to see it.</p></section>
    <section class="tx-sec" id="cl-sec"><h2>Any county against Texas, 2000 to 2026</h2>
      <p class="sub">Pick any of the 254 counties to see its top-of-ticket result in every November election since 2000, with the whole state as the dashed line. Add more counties to compare them. Hover or tap the chart for the numbers in each year.</p>
      <div class="pm-ctl"><label for="cl-add" style="font-size:13px;color:var(--ink-2)">Add a county</label>
        <select id="cl-add" style="font:inherit;font-size:14px;padding:5px 8px;border:1px solid var(--rule);border-radius:6px;background:var(--surface);color:var(--ink);min-width:12em"></select>
        <div class="seg" role="group" aria-label="Show" id="cl-mode"><button type="button" aria-pressed="true" data-m="m">Margin</button><button type="button" aria-pressed="false" data-m="t">Turnout</button></div></div>
      <div id="cl-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0"></div>
      <p id="cl-sum" class="pm-sum"></p>
      <div class="pm" id="cl"><p class="note">Loading the chart…</p></div><div id="cl-key" class="pm-key"></div>
      <p class="note">Same races and same numbers as the map above: President in presidential years (filled dots) and governor in midterms (hollow dots), except 2006 and 2018, which use the U.S. Senate race. Margin is the Democrat minus the Republican as a share of the two, so up is more Democratic. The dashed Texas line adds up all 254 counties. Turnout is the votes in that race as a share of registered voters on the state’s count (Tarrant uses the county’s own count); the state’s registered-voter counts are not available for 2020 to 2024, so those years are blank. The race changes with the year, so compare like years. Source: Texas Secretary of State county-by-county results.</p></section>
    <section class="tx-sec"><h2>Find a county</h2><div class="tx-find"><input id="q" type="search" placeholder="Search 254 counties" aria-label="Search counties"></div>
      <table class="tx-tab" id="ct"><thead><tr><th><button data-s="name">County</button></th><th class="n"><button data-s="m">2026 margin</button></th><th class="n hm"><button data-s="g">Growth, 2000–24</button></th><th class="hm">Group</th></tr></thead><tbody></tbody></table>
      <p class="note">Growth is population change from the 2000 Census to the 2024 estimate. The group is the county's growth group from the series: Shrinking, 0–25%, 25–75% or 75%+. Tarrant County has its own full section: <a href="${ROOT}tarrant/index.html">Tarrant County</a>. For the 2026 turnout and vote by county, see <a href="${ROOT}turnout/index.html">2026 Across Texas</a>.</p></section>`;
    app.querySelector('#sl').appendChild(chart([{ name: 'Texas', v: S.m, cls: 'ln' }], { label: 'Texas statewide margin, 1992 to 2026', races: RACES }));
    (async () => { let P; try { P = await (await fetch(ROOT + 'assets/county_map.json?v=1')).json(); } catch (e) { app.querySelector('#cm').innerHTML = '<p class="note">The map could not load.</p>'; return; } overTime(P); })();
    const tb = app.querySelector('#ct tbody'); let rows = D.counties.slice(), sk = 'name', dir = 1;
    const draw = () => {
      const q = app.querySelector('#q').value.trim().toLowerCase();
      rows.sort((a, b) => sk === 'name' ? dir * a.name.localeCompare(b.name) : dir * ((b[sk] ?? -999) - (a[sk] ?? -999)));
      tb.innerHTML = rows.map(c => { const lk = c.k === 'tarrant' ? ROOT + 'tarrant/index.html' : (D.built.includes(c.k) ? ROOT + 'texas/county-' + c.k + '/' : null);
        return `<tr data-t="${esc(c.name.toLowerCase())}"${q && !c.name.toLowerCase().includes(q) ? ' hidden' : ''}><td>${lk ? `<a href="${lk}">${esc(c.name)}</a>` : `<span class="soon">${esc(c.name)}</span>`}</td><td class="n"><span class="${cls(c.m)}">${lb(c.m)}</span></td><td class="n hm">${c.g == null ? 'n/a' : Math.round(c.g) + '%'}</td><td class="hm">${esc(c.cls)}</td></tr>`; }).join('');
    };
    app.querySelector('#q').addEventListener('input', draw);
    app.querySelectorAll('#ct th button').forEach(b => b.addEventListener('click', () => { const s = b.dataset.s; if (s === sk) dir = -dir; else { sk = s; dir = s === 'name' ? 1 : 1; } draw(); }));
    draw();
  }

  function county() {
    const c = D.county, S = D.state, i26 = years.length - 1;
    const m26 = c.m[i26], t26 = S.m[i26], diff = m26 - t26;
    const cmp = Math.abs(diff) < 0.05 ? 'right at the state margin' : `${Math.abs(diff).toFixed(1)} points ${diff > 0 ? 'more Democratic' : 'more Republican'} than Texas`;
    let hist = '';
    if (c.cross) {
      const x = c.cross;
      if (x.year === 2026) hist = `It had not voted Democratic in any of the 17 races before 2026.`;
      else hist = `It first voted Democratic in ${x.year}, at ${lb(x.margin)}.` + (x.back.length ? ` It went back to Republican in ${list(x.back.map(String))}.` : ' It has stayed Democratic since.');
    } else if (c.blue90) hist = m26 > 0 ? `It voted Democratic in ${c.nD} of the 18 races since 1992.` : `It last voted Democratic in ${c.lastD}.`;
    else hist = 'It has not voted Democratic in any of the 18 races since 1992.';
    const turn = c.reg ? c.cast / c.reg * 100 : null;
    document.title = `${c.name} County · Texas · See It. Name It. Fight It.`;
    const hh = c.hist || {}, ys = Object.keys(hh).map(Number).sort((a, b) => b - a);
    const rr = Object.keys(RN).filter(k => c.races[k]).map(k => [k, c.races[k]]);
    const gov = c.races['GOVERNOR'], sen = c.races['U. S. SENATOR'];
    let xo = '';
    if (gov && sen) { const dR = sen[1] - gov[1], dD = sen[3] - gov[3]; xo = `<p class="note">The 2026 numbers on this site use the governor's race. The Senate race had more crossover in it: ${esc(sen[0])} got ${N(Math.abs(dR))} ${dR < 0 ? 'fewer' : 'more'} votes than ${esc(gov[0])} here, and ${esc(sen[2])} got ${N(Math.abs(dD))} ${dD > 0 ? 'more' : 'fewer'} than ${esc(gov[2])}.</p>`; }
    app.innerHTML = `<p class="crumb"><a href="${ROOT}texas/index.html">Texas</a> › Counties › ${esc(c.name)}</p>
    <header><div class="eyebrow"><span>County</span><span>${esc(c.cls)} growth group</span></div>
      <h1>${esc(c.name)} County</h1>
      <p class="dek">${esc(c.name)} County voted <b class="${cls(m26)}">${lb(m26)}</b> for governor in 2026, ${cmp}. ${hist}</p></header>
    <section class="tx-sec"><div class="stats"><div><b class="${cls(m26)}">${lb(m26)}</b><span>Governor, 2026</span></div><div><b>${turn == null ? 'n/a' : turn.toFixed(1) + '%'}</b><span>of registered voters cast a ballot (Texas ${(S.cast / S.reg * 100).toFixed(1)}%)</span></div><div><b>${c.growth > 0 ? '+' : ''}${Math.round(c.growth)}%</b><span>population, 2000 to 2024</span></div></div></section>
    <section class="tx-sec"><h2>Where ${esc(c.name)} sits</h2><div class="tx-map" id="loc"></div></section>
    <section class="tx-sec"><h2>${esc(c.name)} and Texas, 1992 to 2026</h2><p class="sub">Margin in the top-of-ticket race each election. Up is more Democratic.</p><div id="lc"></div><div class="tx-key"><span><i></i>${esc(c.name)}</span><span><i class="t"></i>Texas</span></div><p class="note">President in presidential years, governor in the other midterms, U.S. Senate in 2006 and 2018. Hover or touch a year to see it.</p></section>
    ${c.cross ? `<section class="tx-sec"><h2>The crossing</h2><ul class="kv"><li><span>First Democratic result</span><span>${c.cross.year}, ${lb(c.cross.margin)}</span></li>${c.cross.worst != null ? `<li><span>Worst margin since</span><span class="${cls(c.cross.worst)}">${lb(c.cross.worst)}</span></li>` : ''}<li><span>Back to Republican</span><span>${c.cross.back.length ? c.cross.back.join(', ') : 'Never'}</span></li></ul><p class="note">A county's first Democratic result is its margin the first time it voted Democratic in this record. Counties that were already Democratic in the 1990s don't get this box.</p></section>` : ''}
    <section class="tx-sec"><h2>Election by election</h2><p class="sub">The top races in every November election on record for ${esc(c.name)} County, starting with 2026. Tap a year to open or close it. Blue is the Democrat, red is the Republican, gray is everyone else.</p>
      <details class="tx-yr" open><summary><b>2026</b><span>${rr.length ? esc(RN[rr[0][0]]) + ' ' + lb(mg(rr[0][1][3], rr[0][1][1])) : ''}</span></summary><div class="sizebar">${rr.map(([r, v]) => bar(RN[r] || r, v)).join('')}</div>${xo}</details>
      ${ys.map(y => { const L = hh[y], t = L[0]; return `<details class="tx-yr"><summary><b>${y}</b><span>${esc(t[0])} ${lb(mg(t[4], t[2]))}</span></summary><div class="sizebar">${L.map(r => bar(r[0], r.slice(1))).join('')}</div></details>`; }).join('')}</section>
    <section class="tx-sec"><h2>About the county</h2><ul class="kv"><li><span>Rank, 2026 margin</span><span>${c.rank} of 254 (1 = most Democratic)</span></li><li><span>Races won by Democrats since 1992</span><span>${c.nD} of 18</span></li><li><span>Non-white share</span><span>${c.nonwhite.toFixed(0)}% in 2000, ${c.nonwhite26.toFixed(0)}% in 2026 <small>(est.)</small></span></li><li><span>Diversity group (2000 share)</span><span>${esc(c.div)}</span></li><li><span>Growth group</span><span>${esc(c.cls)}</span></li><li><span>Population</span><span>${N(c.pop00)} in 2000, ${N(c.pop24)} in 2024</span></li><li><span>Registered voters, 2026</span><span>${N(c.reg)}</span></li><li><span>Ballots cast, 2026</span><span>${N(c.cast)}</span></li><li><span>Registered, did not vote</span><span>${N(c.reg - c.cast)}</span></li></ul></section>
    ${D.series ? `<section class="tx-sec"><h2>In the series</h2><p class="sub">${esc(D.series)}</p></section>` : ''}
    <section class="notes"><p><b>How to read this.</b> Margin is Democratic minus Republican, as a share of the two-party vote. Turnout is ballots cast divided by registered voters, from the Texas Secretary of State. Population is the 2000 Census and the 2024 estimate. The 2026 non-white share is an estimate. Races: Texas Secretary of State county results.</p></section>`;
    app.querySelector('#lc').appendChild(chart([{ name: 'Texas', v: S.m, cls: 'lt' }, { name: c.name, v: c.m, cls: 'ln' }], { label: `${c.name} County and Texas margin, 1992 to 2026`, races: RACES }));
    drawMap(app.querySelector('#loc'), 'county', c.k);
  }
  D.page === 'home' ? home() : county();
})();
