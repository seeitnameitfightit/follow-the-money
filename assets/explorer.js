/* Follow the Money: "Who funds Texas politics?" explorer. Reads data/filers.json and data/f/<id>.json (built by build_explorer.py). */
(function () {
  const BASE = ((document.currentScript && document.currentScript.src) || '').replace(/assets\/[^/]*$/, '') + 'explorer/data/';
  const WEB = ((document.currentScript && document.currentScript.src) || '').replace(/assets\/[^/]*$/, '') + 'web/';
  const LOGO = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '') + 'sinifi-logo.png';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt$ = v => '$' + Math.round(v).toLocaleString('en-US');
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  const fmtK = v => { const a = Math.abs(v); return a >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? '$' + (v / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M' : a >= 1e3 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v); };
  const poss = s => s + (s.endsWith('s') ? '’' : '’s');
  const COLS = ['#2F5FA8', '#C8463D', '#2E6B4F', '#B8860B', '#7B4FA0', '#1F8A9E', '#C26A2B', '#5B6B7A', '#A04B77', '#6B8E23'];

  const css = document.createElement('style');
  css.textContent = `
  .ex-h .eyebrow{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--web)}
  .ex-h h1{font-family:var(--display);font-size:clamp(28px,7vw,40px);line-height:1.1;margin:4px 0 8px}
  .ex-h p{color:var(--ink-2);margin:0;max-width:60ch}
  .ex-ctl{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,15rem);gap:12px;align-items:end}
  .ex-ctl label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:var(--ink-2);position:relative}
  .ex-ctl input,.ex-ctl select{font:inherit;font-size:15px;color:var(--ink);background:var(--surface);border:1px solid var(--rule);border-radius:8px;padding:9px 10px;min-height:42px;width:100%;box-sizing:border-box}
  .ex-ctl input:focus-visible,.ex-ctl select:focus-visible{outline:2px solid var(--focus);outline-offset:1px}
  .ex-res{position:absolute;top:100%;left:0;right:0;z-index:20;margin:2px 0 0;padding:4px;list-style:none;background:var(--surface);border:1px solid var(--rule);border-radius:8px;box-shadow:0 8px 24px #0002;max-height:340px;overflow:auto}
  .ex-res li button{all:unset;box-sizing:border-box;display:flex;justify-content:space-between;gap:10px;width:100%;padding:8px 10px;border-radius:6px;cursor:pointer;font-size:14px;color:var(--ink)}
  .ex-res li button:hover,.ex-res li button[aria-selected="true"]{background:var(--chip)}
  .ex-res small{color:var(--ink-3);font-size:12px;white-space:nowrap}
  .ex-res .sub{display:block;font-size:11px;color:var(--ink-3);font-weight:500}
  .ex-who{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;justify-content:space-between}
  .ex-who h2{font-family:var(--display);font-size:clamp(22px,5.5vw,28px);margin:0}
  .ex-who span{font-size:13px;color:var(--ink-2)}
  .ex-pie{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:24px;align-items:start}
  .ex-pie svg{width:100%;height:auto;display:block}
  .ex-note{font-size:12px;color:var(--ink-3);line-height:1.5}
  .ex-note p{margin:0 0 6px}
  .ex-msg{padding:24px 0;color:var(--ink-2)}
  .ex-out h3{font-family:var(--display);font-size:20px;margin:0 0 12px}
  .ex-out{margin-top:34px;padding-top:6px;border-top:2px solid var(--rule)}
  .ex-out>h2{font-family:var(--display);font-size:clamp(22px,5.5vw,28px);margin:18px 0 4px}
  .ex-tl{margin-top:30px}
  .ex-tl svg{width:100%;height:auto;display:block;overflow:visible}
  .ex-tl .lg{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:13px;color:var(--ink-2);margin:0 0 6px}
  .ex-tl .lg i{display:inline-block;width:11px;height:11px;border-radius:2px;margin-right:6px;vertical-align:-1px}
  .ex-tl .lg i.ln{height:3px;vertical-align:3px;border-radius:2px}
  .ex-tl .pk{font-size:14px;color:var(--ink-2);margin:6px 0 0}
  .ex-tl h3{font-family:var(--display);font-size:20px;margin:0 0 12px}
  .ex-cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.15fr);gap:28px;align-items:start;margin-top:8px}
  .ex-cat{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}
  .ex-cat li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;font-size:14px}
  .ex-cat .bar{grid-column:1/-1;height:7px;background:var(--chip);border-radius:4px;overflow:hidden}
  .ex-cat .bar i{display:block;height:100%;background:var(--web);border-radius:4px}
  .ex-cat li span:nth-child(2),.ex-pay td:last-child{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .ex-cat small{color:var(--ink-3);font-weight:500}
  .ex-pay{width:100%;border-collapse:collapse;font-size:14px}
  .ex-pay th{font-size:12px;font-weight:600;color:var(--ink-2);text-align:left;padding:0 6px 6px 0;border-bottom:1px solid var(--rule)}
  .ex-pay th:last-child{text-align:right}
  .ex-pay td{padding:7px 6px 7px 0;border-bottom:1px solid var(--rule);vertical-align:top}
  .ex-pay td small{display:block;color:var(--ink-3);font-size:12px}
  .ex-pay td:first-child{width:1.6em;color:var(--ink-3)}
  @media (max-width:640px){.ex-cols{grid-template-columns:1fr}.ex-ctl{grid-template-columns:1fr}.ex-pie{grid-template-columns:1fr}.ex-pie svg{max-width:300px;margin:0 auto}}`;
  document.head.appendChild(css);

  const app = $('#app');
  app.innerHTML = `<a class="brand" href="https://seeitnameitfightit.com" target="_blank" rel="noopener"><img src="${LOGO}" alt="See It. Name It. Fight It." width="44" height="36"></a>
    <p class="crumb"><a href="../index.html">Home</a> › <a href="../money/index.html">TX Campaign Finance</a> › Who funds Texas politics?</p><header class="ex-h"><div class="eyebrow">TX Campaign Finance</div><h1>Who funds Texas politics?</h1>
    <p>Pick any candidate, PAC or party to see the ten donors behind its money, and where it spends it. Everything here comes from public Texas Ethics Commission filings.</p></header>
    <section class="ex-ctl" aria-label="Choose who and when">
      <label>Candidate, PAC or party<input id="ex-q" type="search" autocomplete="off" spellcheck="false" placeholder="Start typing a name" role="combobox" aria-expanded="false" aria-controls="ex-res" aria-autocomplete="list"><ul class="ex-res" id="ex-res" role="listbox" hidden></ul></label>
      <label>Time period<select id="ex-per"></select></label></section>
    <div id="ex-out" aria-live="polite"><p class="ex-msg">Loading…</p></div>
    <section class="ex-note" id="ex-note"></section>`;

  let IDX = null, filers = [], cur = null, per = null, resItems = [], sel = -1;
  const cache = {};
  const load = id => cache[id] ? Promise.resolve(cache[id]) : fetch(BASE + 'f/' + id + '.json').then(r => { if (!r.ok) throw 0; return r.json(); }).then(d => (cache[id] = d));

  function hashSet() { try { history.replaceState(null, '', '#' + cur.id + (per !== IDX.meta.default_period ? '/' + per : '')); } catch (e) { } }

  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function timelineHTML() {
    const M = IDX.meta, T = cur.ts, plab = (M.periods.find(p => p[0] === per) || [0, ''])[1], pl = plab.charAt(0).toLowerCase() + plab.slice(1);
    const head = `<section class="ex-tl" aria-label="When the money moved"><h3>When the money moved</h3>`;
    const ym = s => +s.slice(0, 4) * 12 + (+s.slice(5, 7) - 1);
    if (!T || !M.starts) return head + `<p class="ex-msg" style="padding:0">No dated activity to chart.</p></section>`;
    const end = Math.max(ym(M.through), ym(M.out_through || M.through));
    let lo = Math.max(ym(M.starts[per]), ym(T.s));
    if (end - lo < 5) lo = end - 5;
    const n = end - lo + 1, c = [], x = [];
    for (let i = lo; i <= end; i++) { const k = i - ym(T.s); c.push(k >= 0 ? (T.c[k] || 0) : 0); x.push(k >= 0 ? (T.x[k] || 0) : 0); }
    const mx = Math.max(...c, ...x, 1);
    if (!c.some(v => v) && !x.some(v => v)) return head + `<p class="ex-msg" style="padding:0">No dated activity in ${esc(pl)}.</p></section>`;
    const step = (v => { const r = v / 4, p = Math.pow(10, Math.floor(Math.log10(r))), f = r / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; })(mx);
    const W = 640, H = 230, L = 52, R = 6, Tp = 8, B = 26, pw = W - L - R, ph = H - Tp - B, top = Math.ceil(mx / step) * step, bw = pw / n;
    const Y = v => Tp + ph - v / top * ph, lab = i => MON[i % 12] + ' ' + Math.floor(i / 12), hasX = x.some(v => v);
    let g = '';
    for (let v = 0; v <= top + 1e-6; v += step) g += `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--rule)"/><text x="${L - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--ink-3)">${fmtK(v)}</text>`;
    const stepM = [1, 3, 6, 12, 24, 60].find(s => n / s <= 8) || 60;
    for (let i = lo; i <= end; i++) {
      const cx = L + (i - lo + .5) * bw, show = stepM >= 12 ? (i % 12 === 0 && Math.floor(i / 12) % (stepM / 12) === 0) : (i % stepM === 0);
      if (show) g += `<text x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--ink-3)">${stepM >= 12 ? Math.floor(i / 12) : MON[i % 12] + (i % 12 === 0 || i === lo ? ' ’' + String(Math.floor(i / 12)).slice(2) : '')}</text>`;
    }
    const gap = bw > 6 ? 1.5 : bw > 2.5 ? .6 : 0;
    g += c.map((v, k) => v > 0 ? `<rect x="${(L + k * bw + gap / 2).toFixed(2)}" y="${Y(v).toFixed(1)}" width="${Math.max(.8, bw - gap).toFixed(2)}" height="${(Tp + ph - Y(v)).toFixed(1)}" fill="${COLS[0]}"/>` : '').join('');
    if (hasX) g += `<polyline points="${x.map((v, k) => `${(L + (k + .5) * bw).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${COLS[1]}" stroke-width="2" stroke-linejoin="round"/>`;
    g += c.map((v, k) => `<rect x="${(L + k * bw).toFixed(2)}" y="${Tp}" width="${bw.toFixed(2)}" height="${ph}" fill="transparent"><title>${lab(lo + k)}: ${fmt$(v)} in${hasX ? ', ' + fmt$(x[k]) + ' out' : ''}</title></rect>`).join('');
    const pk = c.indexOf(Math.max(...c)), pkx = x.indexOf(Math.max(...x));
    const note = (c[pk] > 0 ? `Biggest month for money in: ${lab(lo + pk)}, ${fmt$(c[pk])}.` : '') + (x[pkx] > 0 ? ` Biggest month for money out: ${lab(lo + pkx)}, ${fmt$(x[pkx])}.` : '');
    return head + `<p class="lg"><span><i style="background:${COLS[0]}"></i>Contributions in, by month</span>${hasX ? `<span><i class="ln" style="background:${COLS[1]}"></i>Spending out, by month</span>` : ''}</p>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(cur.name)}: itemized contributions and spending by month. ${esc(note)}">${g}</svg><p class="pk">${esc(note)}</p></section>`;
  }

  function spendHTML() {
    const M = IDX.meta, plab = (M.periods.find(p => p[0] === per) || [0, ''])[1], X = cur.out && cur.out[per];
    const head = `<section class="ex-out" aria-label="Dollars out"><h2>Where the money went</h2>`;
    if (!X) return head + `<p class="ex-msg">No itemized expenditures reported for ${esc(plab.charAt(0).toLowerCase() + plab.slice(1))}.</p></section>`;
    const mx = Math.max(...X.cats.map(c => c[1]), 1), tp = X.top.reduce((a, r) => a + r[2], 0);
    const cats = X.cats.map(c => `<li><span>${esc(c[0])} <small>${fmtN(c[2])} payment${c[2] === 1 ? '' : 's'}</small></span><span>${fmt$(c[1])}</span><span class="bar"><i style="width:${Math.max(1, c[1] / mx * 100).toFixed(1)}%"></i></span></li>`).join('');
    const pay = X.top.map((r, i) => {
      const nm = r[5] ? `<a class="ex-jump" href="#${r[5]}/${per}" title="See this committee’s own donors and spending">${esc(r[0])}</a>` : esc(r[0]);
      const tag = r[4] ? ` <a class="webtag" href="${WEB + r[4]}/index.html" title="See this donor in the Money Web">Money Web</a>` : '';
      return `<tr><td>${i + 1}</td><td>${nm}${tag}<small>${fmtN(r[3])} payment${r[3] === 1 ? '' : 's'}</small></td><td>${fmt$(r[2])}</td></tr>`;
    }).join('');
    return head + `<p class="ex-msg" style="padding:0 0 6px">Itemized spending, ${esc(plab.charAt(0).toLowerCase() + plab.slice(1))}.</p>
      <div class="stats"><div><b>${fmtK(X.total)}</b><span>itemized spending</span></div><div><b>${fmtN(X.n)}</b><span>payments to ${fmtN(X.payees)} payees</span></div><div><b>${X.total ? Math.round(tp / X.total * 100) : 0}%</b><span>went to the top ${X.top.length} payees</span></div></div>
      <div class="ex-cols"><div><h3>By category</h3><ul class="ex-cat">${cats}</ul></div>
      <div><h3>Top ${X.top.length === 1 ? 'payee' : X.top.length + ' payees'}</h3><table class="ex-pay"><thead><tr><th></th><th>Paid to</th><th>Total</th></tr></thead><tbody>${pay}</tbody></table></div></div></section>`;
  }

  function render() {
    const P = cur.periods[per], M = IDX.meta, plab = (M.periods.find(p => p[0] === per) || [0, ''])[1];
    const out = $('#ex-out');
    if (!P) { out.innerHTML = `<div class="ex-who"><h2>${esc(cur.name)}</h2><span>${esc(cur.type)}</span></div><p class="ex-msg">No itemized contributions reported for ${esc(plab.charAt(0).toLowerCase() + plab.slice(1))}. Try a longer time period.</p>` + timelineHTML() + spendHTML(); return; }
    const top = P.top, topSum = top.reduce((a, r) => a + r[2], 0), rest = Math.max(0, P.total - topSum), pct = (a, b) => b ? Math.round(a / b * 100) : 0;
    const slices = top.map((r, i) => ({ name: r[0], kind: r[1], amt: r[2], n: r[3], href: r[4] ? WEB + r[4] + '/index.html' : null, col: COLS[i], rank: i + 1 }));
    if (rest > 0) slices.push({ name: 'All others', meta: fmtN(Math.max(0, P.donors - top.length)) + ' other donors', amt: rest, n: null, col: 'color-mix(in oklab, var(--ink-3) 30%, var(--surface))', rank: '', other: true });
    const tot = slices.reduce((a, s) => a + s.amt, 0) || 1, R0 = 100, cx = 110, cy = 110; let a0 = -Math.PI / 2;
    const paths = slices.map((s, i) => {
      const frac = s.amt / tot, a1 = a0 + frac * 2 * Math.PI, large = frac > .5 ? 1 : 0;
      const p0 = [cx + R0 * Math.cos(a0), cy + R0 * Math.sin(a0)], p1 = [cx + R0 * Math.cos(a1), cy + R0 * Math.sin(a1)];
      const d = frac >= .9999 ? `M${cx},${cy - R0} A${R0},${R0} 0 1 1 ${cx - .01},${cy - R0} Z` : `M${cx},${cy} L${p0[0].toFixed(2)},${p0[1].toFixed(2)} A${R0},${R0} 0 ${large} 1 ${p1[0].toFixed(2)},${p1[1].toFixed(2)} Z`;
      const am = (a0 + a1) / 2, lr = frac > .25 ? R0 * .55 : R0 * .7;
      const lbl = frac >= .06 ? `<text x="${(cx + lr * Math.cos(am)).toFixed(1)}" y="${(cy + lr * Math.sin(am) + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${s.other ? 'var(--ink)' : '#fff'}" pointer-events="none">${Math.round(frac * 100)}%</text>` : '';
      a0 = a1;
      return `<path d="${d}" fill="${s.col}" stroke="var(--surface)" stroke-width="1.5" data-i="${i}" class="slice"><title>${esc(s.name)}: ${fmt$(s.amt)} (${(frac * 100).toFixed(1)}%)</title></path>${lbl}`;
    }).join('');
    const mainHTML = `
      <div class="ex-who"><h2>${esc(cur.name)}</h2><span>${esc(cur.type)} · ${esc(plab)}</span></div>
      <div class="stats" style="margin-top:14px"><div><b>${fmtK(P.total)}</b><span>itemized contributions</span></div><div><b>${fmtN(P.n)}</b><span>contributions from ${fmtN(P.donors)} donors</span></div><div><b>${pct(topSum, P.total)}%</b><span>from the top ${top.length} donor${top.length === 1 ? '' : 's'}</span></div></div>
      <h3 style="font-family:var(--display);font-size:20px;margin:26px 0 12px">${top.length === 1 ? 'One donor supplied' : 'Ten donors supplied'} ${pct(topSum, P.total)}% of ${esc(poss(cur.name))} itemized money</h3>
      <div class="ex-pie"><svg viewBox="0 0 220 220" role="img" aria-label="${esc(cur.name)}: top ${top.length} donors gave ${pct(topSum, P.total)}% of itemized contributions">${paths}</svg>
      <ol class="pie-list">${slices.map((s, i) => `<li data-i="${i}"><i class="sw" style="background:${s.col}"></i><span class="pl-name"><b>${s.rank ? s.rank + '. ' : ''}${s.href ? `<a href="${s.href}" title="See this donor in the Money Web">${esc(s.name)}</a><span class="webtag">Money Web</span>` : esc(s.name)}</b><small>${s.other ? esc(s.meta) : (s.kind === 'E' ? 'Organization' : 'Individual') + ' · ' + fmtN(s.n) + ' contribution' + (s.n > 1 ? 's' : '')}</small></span><span class="pl-amt num">${fmt$(s.amt)}<small>${(s.amt / tot * 100).toFixed(1)}%</small></span></li>`).join('')}</ol></div>`;
    out.innerHTML = mainHTML + timelineHTML() + spendHTML();
    const hl = i => { out.querySelectorAll('.slice').forEach(p => p.style.opacity = (i === null || +p.dataset.i === i) ? 1 : .35); out.querySelectorAll('.pie-list li').forEach(li => li.classList.toggle('on', +li.dataset.i === i)); };
    out.querySelectorAll('.slice, .pie-list li').forEach(n => { n.addEventListener('mouseenter', () => hl(+n.dataset.i)); n.addEventListener('mouseleave', () => hl(null)); n.addEventListener('click', () => hl(+n.dataset.i)); });
  }

  function pick(id) {
    $('#ex-out').innerHTML = '<p class="ex-msg">Loading…</p>';
    return load(id).then(d => { cur = d; if (!d.periods[per] && id !== 'all') { const order = IDX.meta.periods.map(p => p[0]); const f = order.slice().reverse().find(k => d.periods[k]); if (f && !d.periods[per]) { /* keep chosen period; message explains */ } } hashSet(); render(); }).catch(() => { $('#ex-out').innerHTML = '<p class="ex-msg">Could not load that filer. Try another.</p>'; });
  }

  // ---- search box
  const q = $('#ex-q'), list = $('#ex-res');
  const closeList = () => { list.hidden = true; q.setAttribute('aria-expanded', 'false'); sel = -1; };
  function search(text) {
    const toks = text.toLowerCase().split(/\s+/).filter(Boolean);
    if (!toks.length) { closeList(); return; }
    resItems = [{ id: 'all', name: 'All Texas filers', type: 'Every filer combined', rec: 0 }].filter(r => toks.every(t => r.name.toLowerCase().includes(t)))
      .concat(filers.filter(r => toks.every(t => r[1].toLowerCase().includes(t))).sort((a, b) => (b[1].toLowerCase().startsWith(toks[0]) - a[1].toLowerCase().startsWith(toks[0])) || b[3] - a[3]).slice(0, 8).map(r => ({ id: r[0], name: r[1], type: r[2], rec: r[3] })));
    list.innerHTML = resItems.length ? resItems.map((r, i) => `<li role="option"><button type="button" data-i="${i}" aria-selected="false"><span>${esc(r.name)}<span class="sub">${esc(r.type)}</span></span>${r.rec ? `<small>${fmtK(r.rec)} since 2023</small>` : ''}</button></li>`).join('') : '<li style="padding:10px;color:var(--ink-3);font-size:13px">No match. Try fewer words, or the last name.</li>';
    list.hidden = false; q.setAttribute('aria-expanded', 'true'); sel = -1;
  }
  const choose = i => { const r = resItems[i]; if (!r) return; q.value = r.name; closeList(); pick(r.id); };
  q.addEventListener('input', () => search(q.value));
  q.addEventListener('focus', () => { q.select(); if (q.value && !list.hidden) return; });
  q.addEventListener('keydown', e => {
    const bs = [...list.querySelectorAll('button')];
    if (e.key === 'ArrowDown' && bs.length) { e.preventDefault(); sel = Math.min(bs.length - 1, sel + 1); }
    else if (e.key === 'ArrowUp' && bs.length) { e.preventDefault(); sel = Math.max(0, sel - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(sel >= 0 ? sel : 0); return; }
    else if (e.key === 'Escape') { closeList(); return; } else return;
    bs.forEach((b, i) => b.setAttribute('aria-selected', i === sel)); if (bs[sel]) bs[sel].scrollIntoView({ block: 'nearest' });
  });
  list.addEventListener('mousedown', e => { const b = e.target.closest('button'); if (b) { e.preventDefault(); choose(+b.dataset.i); } });
  document.addEventListener('click', e => { if (!e.target.closest('.ex-ctl')) closeList(); if (e.target.closest('a.ex-jump')) setTimeout(() => window.scrollTo(0, 0), 0); });

  // ---- boot
  fetch(BASE + 'filers.json').then(r => r.json()).then(d => {
    IDX = d; filers = d.filers; const M = d.meta;
    const [h, hp] = location.hash.slice(1).split('/'); per = M.periods.some(p => p[0] === hp) ? hp : M.default_period;
    const sp = $('#ex-per'); sp.innerHTML = M.periods.map(p => `<option value="${p[0]}"${p[0] === per ? ' selected' : ''}>${esc(p[1])}</option>`).join('');
    sp.addEventListener('change', () => { per = sp.value; hashSet(); render(); });
    const start = /^[0-9A-Za-z]+$/.test(h || '') ? h : 'all';
    $('#ex-note').innerHTML = `<p><b>How to read this.</b> Totals are itemized contributions only: the ones each campaign or committee listed by name in its reports. Small contributions that were not itemized are not included. Donors are matched on name and ZIP code for individuals and on name for organizations, so a donor who gave under two spellings or two addresses can appear twice.</p>
      <p>"All Texas filers" adds every committee together, so money passed from one PAC to another is counted at both ends. Slices tagged Money Web link to that donor’s page. Filings run through ${esc(new Date(M.through + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))}; late and corrected reports can change the numbers.</p>
      <p><b>Spending.</b> Itemized political expenditures: payments listed by name in each report, with credit card charges counted instead of the card payoff. Purchases of investments, payments from personal funds, non-political expenses and unpaid bills are left out. A payee linked by name opens that committee’s own page, so you can follow money from one committee to the next.</p>`;
    return pick(start).then(() => { if (cur && cur.id !== 'all') q.value = cur.name; });
  }).catch(() => { $('#ex-out').innerHTML = '<p class="ex-msg">Could not load the data. Please refresh.</p>'; });
  window.addEventListener('hashchange', () => { const [h, hp] = location.hash.slice(1).split('/'); if (IDX && h && (!cur || h !== cur.id)) { if (IDX.meta.periods.some(p => p[0] === hp)) { per = hp; $('#ex-per').value = hp; } pick(h).then(() => { if (cur.id !== 'all') q.value = cur.name; }); } });
})();
