/* Follow the Money: renders a race page or the index from the JSON embedded in the page (built by build_site.py). */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt$ = v => '$' + Math.round(v).toLocaleString('en-US');
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  const fmtK = v => {
    const a = Math.abs(v);
    if (a >= 1e6) return '$' + (v / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M';
    if (a >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v);
  };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const FULLM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dlabel = s => { const [y, m, d] = s.split('-'); return `${MONTHS[+m - 1]} ${+d}, ${y}`; };
  const T = s => new Date(s + 'T12:00:00').getTime();
  const niceMax = v => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const poss = s => s + (s.endsWith('s') ? '’' : '’s');
  const V = (x, one, many) => (x && x.plural ? many : one);  // verb agreement for plural names like 'Republicans'
  function tipPos(tip, box, x, y) {
    const w = box.clientWidth, tw = tip.offsetWidth;
    let left = x + 14; if (left + tw > w) left = x - tw - 14; if (left < 0) left = 0;
    tip.style.left = left + 'px'; tip.style.top = Math.max(0, y - 10) + 'px';
  }
  const ratioText = r => (r >= 10 ? Math.round(r) : r.toFixed(1).replace(/\.0$/, '')) + '\u2011to\u20111';

  /* ================= INDEX (home + section pages) ================= */
  const idxEl = $('#index-data');
  if (idxEl) {
    const I = JSON.parse(idxEl.textContent), M = I.meta;
    const raceHref = (slug, depth) => `${depth ? '../' : ''}races/${slug}/index.html`;
    const card = (r, depth) => {
      const max = Math.max(r.r[1], r.d[1]) || 1;
      const line = (c, k) => `<span class="nm"><i class="dot ${k}"></i>${esc(c[0])}</span><span class="trk"><i style="width:${Math.max(1, c[1] / max * 100)}%;background:var(--${k === 'r' ? 'rep' : 'dem'})"></i></span><span class="amt">${fmtK(c[1])}</span>`;
      return `<a class="card" href="${raceHref(r.slug, depth)}" data-q="${esc((r.office + ' ' + r.r[0] + ' ' + r.d[0] + ' ' + (r.district || '')).toLowerCase())}"><div class="office">${esc(r.office)}<span>Cash on hand ›</span></div>
        <div class="cm">${line(r.r, 'r')}${line(r.d, 'd')}</div>
        <div class="foot num">Donors this period: ${fmtN(r.r[3])} (R) · ${fmtN(r.d[3])} (D)</div></a>`;
    };
    const asof = `<div class="asof">${esc(M.period_label)} through ${dlabel(M.period_end)}</div>`;
    const foot = `<footer>Figures come from <a href="https://www.ethics.state.tx.us/search/cf/" target="_blank" rel="noopener">Texas Ethics Commission</a> filings, downloaded ${esc(M.data_downloaded)}, and from local filings for Tarrant County races. Records replaced by amended reports are left out. <a href="https://seeitnameitfightit.com" target="_blank" rel="noopener">${esc(M.org)}</a></footer>`;
    if (I.page === 'home') {
      const secs = I.sections.map(s => s.count
        ? `<a class="sec-card" href="${s.key}/index.html"><span class="sec-n num">${s.count}</span><span class="sec-t">${esc(s.label)}</span><span class="sec-d">${esc(s.desc)}</span><span class="sec-go">${s.count} ${s.unit ? s.unit : (s.count === 1 ? 'race' : 'races')} ›</span></a>`
        : `<div class="sec-card soon"><span class="sec-n">—</span><span class="sec-t">${esc(s.label)}</span><span class="sec-d">${esc(s.desc)}</span><span class="sec-go">Coming soon</span></div>`).join('');
      $('#app').innerHTML = `<header><div class="eyebrow"><span>${esc(M.org)}</span><span>${esc(M.election)}</span></div>
        <h1>${esc(M.site_title)}</h1>
        <p class="dek">Who has the cash, who has the donors and where the money comes from, race by race, from the governor’s office to your county commissioner.</p>${asof}</header>
        <section aria-label="Find a race"><label class="srch"><span>Find a race</span><input id="q" type="search" placeholder="District number or candidate name" autocomplete="off"></label><ul class="hits" id="hits"></ul></section>
        <section class="secs" aria-label="Sections">${secs}</section>${foot}`;
      const q = $('#q'), hits = $('#hits'), label = Object.fromEntries(I.sections.map(s => [s.key, s.label]));
      q.addEventListener('input', () => {
        const v = q.value.trim().toLowerCase(); if (!v) { hits.innerHTML = ''; return; }
        const m = I.races.filter(r => (r.office + ' ' + r.r + ' ' + r.d + ' ' + (r.district || '')).toLowerCase().includes(v) || String(r.district) === v).slice(0, 12);
        hits.innerHTML = m.length ? m.map(r => `<li><a href="races/${r.slug}/index.html"><b>${esc(r.office)}</b><small>${esc(r.r)} (R) vs. ${esc(r.d)} (D) · ${esc(label[r.group])}</small></a></li>`).join('') : '<li class="none">No matching races yet.</li>';
      });
      return;
    }
    if (I.page === 'section') {
      const S = I.section, list = I.races;
      $('#app').insertAdjacentHTML('beforeend', `<header><div class="eyebrow"><span>${esc(M.org)}</span><span>${esc(M.election)}</span></div>
        <h1>${esc(S.label)}</h1><p class="dek">${esc(S.desc)}</p>${asof}</header>
        ${list.length > 8 ? `<section aria-label="Filter"><label class="srch"><span>Filter</span><input id="f" type="search" placeholder="District number or candidate name" autocomplete="off"></label></section>` : ''}
        <section class="idx-list" id="list" aria-label="Races">${list.length ? list.map(r => card(r, 1)).join('') : '<p class="note">Races for this section are coming soon.</p>'}</section>${foot}`);
      const f = $('#f'); if (f) f.addEventListener('input', () => { const v = f.value.trim().toLowerCase();
        document.querySelectorAll('#list .card').forEach(c => { c.hidden = !!v && !c.dataset.q.includes(v); }); });
      return;
    }
    return;
  }

  /* ================= RACE ================= */
  const dataEl = $('#race-data'); if (!dataEl) return;
  const D = JSON.parse(dataEl.textContent), M = D.meta, R = D.r, Dm = D.d;
  const LOCAL = !!D.local, SINCE = LOCAL ? 'in the 30-day report period' : `since ${dlabel(M.cycle_start)}`, CYC = LOCAL ? 'this period' : 'this cycle';
  const C = { r: R, d: Dm };

  // ---- headline & dek
  const lead = R.period.coh >= Dm.period.coh ? 'r' : 'd', trail = lead === 'r' ? 'd' : 'r';
  const a = C[lead].period.coh, b = C[trail].period.coh, gap = a - b, ratio = b > 0 ? a / b : Infinity;
  let h1;
  if (ratio < 1.2) h1 = `${fmt$(gap)} separates ${R.short} and ${Dm.short} in cash`;
  else if (ratio >= 3) h1 = `${C[lead].short} ${V(C[lead], 'has', 'have')} a ${ratio === Infinity ? 'commanding' : ratioText(ratio)} cash advantage`;
  else h1 = `${C[lead].short} ${V(C[lead], 'leads', 'lead')} ${C[trail].short} in cash, ${fmtK(a)} to ${fmtK(b)}`;
  const dlead = R.period.donors >= Dm.period.donors ? 'r' : 'd', dtrail = dlead === 'r' ? 'd' : 'r';
  const dr = C[dtrail].period.donors ? C[dlead].period.donors / C[dtrail].period.donors : 0;
  let dek = `${R.short} had <b class="num">${fmtN(R.period.donors)}</b> donors this period. ${Dm.short} had <b class="num">${fmtN(Dm.period.donors)}</b>.`;
  if (dr >= 2) dek += ` That’s ${dr >= 10 ? Math.round(dr) : dr.toFixed(1).replace(/\.0$/, '')} times as many for ${C[dlead].short}.`;
  const rlead = R.period.raised >= Dm.period.raised ? 'r' : 'd';
  dek += ` ${C[rlead].short} raised more: ${fmtK(C[rlead].period.raised)} to ${fmtK(C[rlead === 'r' ? 'd' : 'r'].period.raised)}.`;

  // ---- tape
  const tape = [
    ['Cash on hand', 'coh', fmt$, true], ['Raised this period', 'raised', fmt$, true], ['Spent this period', 'spent', fmt$, false],
    ['Loans owed', 'loans', fmt$, false], ['Donors this period', 'donors', fmtN, true], ['Median contribution', 'median', fmt$, false]
  ].map(([label, k, f, mark]) => {
    const rv = R.period[k], dv = Dm.period[k];
    return `<div class="row"><div class="v r${mark && rv > dv ? ' win' : ''}">${f(rv)}</div><div class="lbl">${label}</div><div class="v d${mark && dv > rv ? ' win' : ''}">${f(dv)}</div></div>`;
  }).join('');

  const notes = (D.notes || []).map(n => `<p>${esc(n)}</p>`).join('');
  const periodStart = M.period_label;

  $('#app').insertAdjacentHTML('beforeend', `
  <header>
    <div class="eyebrow"><span>Texas · ${esc(D.office)}</span><span>${esc(M.election)}</span></div>
    <h1>${esc(h1)}</h1>
    <p class="dek">${dek}</p>
    <div class="asof">${esc(M.period_label)} · through ${dlabel(M.period_end)} · ${LOCAL ? 'Tarrant County filings' : 'Texas Ethics Commission'}</div>
  </header>
  <section aria-label="Head to head">
    <div class="tape">
      <div class="tape-head">
        <div class="cand r"><span class="party"><i class="dot r"></i>Republican</span><span class="name">${esc(R.name)}</span></div>
        <div class="vs">vs</div>
        <div class="cand d"><span class="party">Democrat<i class="dot d"></i></span><span class="name">${esc(Dm.name)}</span></div>
      </div>
      ${tape}
      <div class="tape-foot">A dot marks who leads. "This period" is the latest report period, ending ${dlabel(M.period_end)}. Loans are the balance owed.</div>
    </div>
  </section>
  ${notes ? `<section class="notes" aria-label="Notes on this race">${notes}</section>` : ''}
  <section aria-labelledby="pie-h"><h2 id="pie-h"></h2>
    <p class="sub">Each campaign\u2019s itemized contributions ${SINCE}. The ten biggest donors each get a slice; everyone else is grouped into All others. Hover or tap a slice for details.</p>
    <div class="pies"><div class="pie-panel" id="pie-r"></div><div class="pie-panel" id="pie-d"></div></div></section>
  <section id="coh-sec"><h2 id="coh-h"></h2><p class="sub" id="coh-sub"></p>
    <div class="legend"><span><i class="dot r"></i>${esc(R.short)}</span><span><i class="dot d"></i>${esc(Dm.short)}</span></div>
    <div class="chart" id="coh"></div></section>
  <section><h2 id="mo-h"></h2><p class="sub" id="mo-sub"></p>
    <div class="seg" role="group" aria-label="Measure"><button type="button" id="mo-donors" aria-pressed="true">Donors per month</button><button type="button" id="mo-dollars" aria-pressed="false">Dollars per month</button></div>
    <div class="legend"><span><i class="dot r"></i>${esc(R.short)}</span><span><i class="dot d"></i>${esc(Dm.short)}</span></div>
    <div class="chart" id="monthly"></div>
    <p class="note">The last month runs through ${dlabel(M.period_end)}, the end of the latest reporting period.</p></section>
  <section><h2>Big checks vs. small contributions</h2><p class="sub" id="size-sub"></p>
    <div class="seg" role="group" aria-label="Measure"><button type="button" id="sz-dollars" aria-pressed="true">Share of dollars</button><button type="button" id="sz-count" aria-pressed="false">Share of contributions</button></div>
    <div class="sizebar" id="sizebar"></div></section>

  <section><h2>Where the money comes from</h2><p class="sub">Top ${LOCAL ? '' : 'Texas '}cities by itemized dollars ${CYC}, with the number of contributions behind each.</p>
    <div class="two"><div class="panel"><h3><i class="dot r"></i>${esc(R.short)}</h3><ul class="kv" id="geo-r"></ul></div>
    <div class="panel"><h3><i class="dot d"></i>${esc(Dm.short)}</h3><ul class="kv" id="geo-d"></ul></div></div></section>
  <section><h2>Where the money goes</h2><p class="sub">Spending by category ${SINCE}.</p>
    <div class="two"><div class="panel"><h3><i class="dot r"></i>${esc(R.short)}</h3><ul class="kv" id="sp-r"></ul></div>
    <div class="panel"><h3><i class="dot d"></i>${esc(Dm.short)}</h3><ul class="kv" id="sp-d"></ul></div></div></section>
  <footer><b>How these numbers work</b><ul>
    <li>${LOCAL ? esc(D.source_note || 'Source: Tarrant County campaign finance filings.') : `Source: <a href="https://www.ethics.state.tx.us/search/cf/" target="_blank" rel="noopener">Texas Ethics Commission</a> bulk campaign finance data, downloaded ${esc(M.data_downloaded)}.`}</li>
    ${LOCAL ? '' : '<li>Records replaced by an amended report are left out.</li>'}
    <li>${LOCAL ? '"Donors" are unique contributors, matched on name. County reports cover only the 30-day period (Jul 1\u2013Sep 24, 2026), so there is no longer history here.' : `"Donors" are unique contributors, matched on name and ZIP code. "This cycle" means ${dlabel(M.cycle_start)} through ${dlabel(M.period_end)}.`}</li>
    <li>Contribution sizes, donors, cities and monthly figures use itemized monetary contributions. In-kind contributions are not included.</li>
  </ul><a href="https://seeitnameitfightit.com" target="_blank" rel="noopener">${esc(M.org)}</a> · <a href="../../index.html">All races</a></footer>`);

  // ---- cash on hand chart
  const cohSeries = { r: R.coh.map(([d, v]) => ({ d, t: T(d), v })), d: Dm.coh.map(([d, v]) => ({ d, t: T(d), v })) };
  (function cohText() {
    const r0 = cohSeries.r[0], d0 = cohSeries.d[0];
    if (r0 && d0) {
      const g0 = Math.abs(r0.v - d0.v), g1 = Math.abs(R.period.coh - Dm.period.coh);
      $('#coh-h').textContent = g1 < g0 ? `The cash gap shrank from ${fmtK(g0)} to ${fmtK(g1)}` : `The cash gap grew from ${fmtK(g0)} to ${fmtK(g1)}`;
    } else $('#coh-h').textContent = 'Cash on hand over the cycle';
    $('#coh-sub').textContent = `Cash on hand at the end of each reporting period since ${dlabel(M.cycle_start)}. Hover or tap for exact figures.`;
  })();
  function valAt(s, t) { let v = null; for (const p of s) { if (p.t <= t) v = p; } return v; }
  function drawCOH() {
    const box = $('#coh'), W = box.clientWidth, H = Math.max(240, Math.min(320, W * 0.55)), m = { l: 52, r: 74, t: 14, b: 30 };
    const all = [...cohSeries.r, ...cohSeries.d]; if (!all.length) { box.innerHTML = '<p class="note">No cash-on-hand reports this cycle.</p>'; return; }
    const t0 = Math.min(...all.map(p => p.t)), t1 = T(M.period_end);
    const max = niceMax(Math.max(...all.map(p => p.v)));
    const x = t => m.l + (t - t0) / ((t1 - t0) || 1) * (W - m.l - m.r), y = v => m.t + (1 - v / max) * (H - m.t - m.b);
    const ticks = [0, .25, .5, .75, 1].map(k => k * max);
    const prim = T('2026-03-03');
    const path = s => s.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
    const ends = ['r', 'd'].map(k => { const s = cohSeries[k]; return s.length ? { k, p: s.at(-1), yy: y(s.at(-1).v) } : null; }).filter(Boolean);
    if (ends.length === 2 && Math.abs(ends[0].yy - ends[1].yy) < 28) { const mid = (ends[0].yy + ends[1].yy) / 2, up = ends[0].yy <= ends[1].yy ? 0 : 1; ends[up].yy = mid - 14; ends[1 - up].yy = mid + 14; }
    const xt = []; for (let yr = new Date(t0).getFullYear(); yr <= 2026; yr++) for (const mo of [1, 7]) { const t = T(`${yr}-${String(mo).padStart(2, '0')}-01`); if (t >= t0 && t <= t1) xt.push([t, `${MONTHS[mo - 1]} ${yr}`]); }
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Cash on hand over time for ${esc(R.short)} and ${esc(Dm.short)}">
      ${ticks.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)" class="num">${fmtK(v)}</text>`).join('')}
      ${xt.map(([t, l]) => `<text x="${x(t)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--ink-3)">${l}</text>`).join('')}
      ${prim > t0 && prim < t1 ? `<line x1="${x(prim)}" x2="${x(prim)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--ink-3)" stroke-dasharray="3 3"/><text x="${x(prim) + 5}" y="${m.t + 10}" font-size="11" fill="var(--ink-2)">Primary</text>` : ''}
      ${['r', 'd'].map(k => `<path d="${path(cohSeries[k])}" fill="none" stroke="var(--${k === 'r' ? 'rep' : 'dem'})" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`).join('')}
      ${['r', 'd'].map(k => cohSeries[k].map(p => `<circle cx="${x(p.t)}" cy="${y(p.v)}" r="4" fill="var(--${k === 'r' ? 'rep' : 'dem'})" stroke="var(--surface)" stroke-width="2"/>`).join('')).join('')}
      ${ends.map(e => `<text x="${x(e.p.t) + 8}" y="${e.yy + 4}" font-size="12" font-weight="600" fill="var(--ink)" class="num">${fmtK(e.p.v)}</text>`).join('')}
      <line id="coh-x" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--ink-2)" opacity="0"/>
      <rect x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent" id="coh-hit"/></svg><div class="tip" id="coh-tip"></div>`;
    const hit = $('#coh-hit', box), tip = $('#coh-tip', box), cx = $('#coh-x', box);
    const dates = [...new Set(all.map(p => p.t))].sort((p, q) => p - q);
    const move = ev => {
      const rect = box.getBoundingClientRect(), s = W / rect.width;
      const px = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - rect.left) * s;
      let best = dates[0]; for (const t of dates) if (Math.abs(x(t) - px) < Math.abs(x(best) - px)) best = t;
      const rv = valAt(cohSeries.r, best), dv = valAt(cohSeries.d, best);
      cx.setAttribute('x1', x(best)); cx.setAttribute('x2', x(best)); cx.setAttribute('opacity', .35);
      const ds = new Date(best); const lab = `${MONTHS[ds.getMonth()]} ${ds.getDate()}, ${ds.getFullYear()}`;
      tip.innerHTML = `<b>${lab}</b><div class="t-row"><span><i class="dot r"></i> ${esc(R.short)}</span><span>${rv ? fmt$(rv.v) : '—'}</span></div><div class="t-row"><span><i class="dot d"></i> ${esc(Dm.short)}</span><span>${dv ? fmt$(dv.v) : '—'}</span></div>`;
      tip.style.opacity = 1; tipPos(tip, box, x(best) / s, 20);
    };
    const leave = () => { tip.style.opacity = 0; cx.setAttribute('opacity', 0); };
    hit.addEventListener('mousemove', move); hit.addEventListener('touchstart', move, { passive: true }); hit.addEventListener('touchmove', move, { passive: true });
    hit.addEventListener('mouseleave', leave); hit.addEventListener('touchend', () => setTimeout(leave, 1800));
  }

  // ---- monthly
  const months = []; { let [y, mo] = M.cycle_start.split('-').map(Number); const [ey, em] = M.period_end.split('-').map(Number);
    while (y < ey || (y === ey && mo <= em)) { months.push(`${y}-${String(mo).padStart(2, '0')}`); mo++; if (mo > 12) { mo = 1; y++; } } }
  // trim leading months where neither campaign had contributions
  while (months.length > 1 && !R.monthly[months[0]] && !Dm.monthly[months[0]]) months.shift();
  const MO = months.map(m => ({ m, rn: (R.monthly[m] || [0, 0])[0], r$: (R.monthly[m] || [0, 0])[1], dn: (Dm.monthly[m] || [0, 0])[0], d$: (Dm.monthly[m] || [0, 0])[1] }));
  (function moText() {
    const cands = [['r', 'rn'], ['d', 'dn']].map(([k, f]) => { const best = MO.reduce((a, b) => b[f] > a[f] ? b : a, MO[0]); return { k, best, n: best[f] }; });
    const big = cands[0].n >= cands[1].n ? cands[0] : cands[1], other = big === cands[0] ? cands[1] : cands[0];
    const [yy, mm] = big.best.m.split('-');
    if (big.n > C[other.k].cycle.donors && C[other.k].cycle.donors > 0)
      $('#mo-h').textContent = `${C[big.k].short} had more donors in ${FULLM[+mm - 1]} ${yy} than ${C[other.k].short} ${LOCAL ? 'had in the whole period' : V(C[other.k], 'has', 'have') + ' had all cycle'}`;
    else $('#mo-h').textContent = `${C[big.k].short} ${V(C[big.k], 'has', 'have')} had ${fmtN(C[big.k].cycle.donors)} donors ${CYC}; ${C[other.k].short} ${V(C[other.k], 'has', 'have')} had ${fmtN(C[other.k].cycle.donors)}`;
    $('#mo-sub').textContent = `Unique donors each month, ${R.short} and ${Dm.short}. Switch to dollars to see how much those donors gave.`;
  })();
  let moMode = 'donors';
  function drawMonthly() {
    const box = $('#monthly'), W = box.clientWidth, H = Math.max(220, Math.min(300, W * 0.5)), m = { l: 50, r: 8, t: 10, b: 34 };
    const rk = moMode === 'donors' ? 'rn' : 'r$', dk = moMode === 'donors' ? 'dn' : 'd$';
    const max = niceMax(Math.max(1, ...MO.flatMap(r => [r[rk], r[dk]])));
    const band = (W - m.l - m.r) / MO.length, bw = Math.max(1.5, Math.min(14, band / 2 - 2));
    const y = v => m.t + (1 - v / max) * (H - m.t - m.b), fv = moMode === 'donors' ? fmtN : fmtK;
    const bar = (xx, v, col) => { if (!v) return ''; const h = Math.max(1, H - m.b - y(v)), yy = H - m.b - h, rr = Math.min(3, bw / 2, h);
      return `<path d="M${xx},${H - m.b} V${yy + rr} Q${xx},${yy} ${xx + rr},${yy} H${xx + bw - rr} Q${xx + bw},${yy} ${xx + bw},${yy + rr} V${H - m.b} Z" fill="${col}"/>`; };
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${moMode === 'donors' ? 'Donors' : 'Dollars'} per month for ${esc(R.short)} and ${esc(Dm.short)}">
      ${[0, max / 2, max].map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)" class="num">${fv(v)}</text>`).join('')}
      ${MO.map((r, i) => { const x0 = m.l + i * band + (band - (bw * 2 + 2)) / 2; return bar(x0, r[rk], 'var(--rep)') + bar(x0 + bw + 2, r[dk], 'var(--dem)'); }).join('')}
      ${MO.map((r, i) => { const [yy, mm] = r.m.split('-'); return (mm === '01' || mm === '07') ? `<text x="${m.l + i * band + band / 2}" y="${H - 14}" text-anchor="middle" font-size="11" fill="var(--ink-3)">${MONTHS[+mm - 1]}</text><text x="${m.l + i * band + band / 2}" y="${H - 2}" text-anchor="middle" font-size="10" fill="var(--ink-3)">${yy}</text>` : ''; }).join('')}
      ${MO.map((r, i) => `<rect x="${m.l + i * band}" y="0" width="${band}" height="${H - m.b}" fill="transparent" data-i="${i}" class="mo-hit"/>`).join('')}
    </svg><div class="tip" id="mo-tip"></div>`;
    const tip = $('#mo-tip', box);
    box.querySelectorAll('.mo-hit').forEach(h => {
      const show = () => { const r = MO[+h.dataset.i], [yy, mm] = r.m.split('-'), s = box.getBoundingClientRect().width / W;
        tip.innerHTML = `<b>${MONTHS[+mm - 1]} ${yy}</b><div class="t-row"><span><i class="dot r"></i> ${esc(R.short)}</span><span>${fmtN(r.rn)} donors · ${fmt$(r.r$)}</span></div><div class="t-row"><span><i class="dot d"></i> ${esc(Dm.short)}</span><span>${fmtN(r.dn)} donors · ${fmt$(r.d$)}</span></div>`;
        tip.style.opacity = 1; tipPos(tip, box, (m.l + (+h.dataset.i + .5) * band) * s, 20); h.setAttribute('fill', 'var(--grid)'); h.setAttribute('fill-opacity', '.5'); };
      const hide = () => { tip.style.opacity = 0; h.setAttribute('fill', 'transparent'); };
      h.addEventListener('mouseenter', show); h.addEventListener('mouseleave', hide);
      h.addEventListener('touchstart', () => { box.querySelectorAll('.mo-hit').forEach(o => o.setAttribute('fill', 'transparent')); show(); setTimeout(hide, 2200); }, { passive: true });
    });
  }
  const setMo = mode => { moMode = mode; $('#mo-donors').setAttribute('aria-pressed', mode === 'donors'); $('#mo-dollars').setAttribute('aria-pressed', mode === 'dollars'); drawMonthly(); };
  $('#mo-donors').onclick = () => setMo('donors'); $('#mo-dollars').onclick = () => setMo('dollars');

  // ---- sizes
  const BANDS = ['$100 or less', '$101–$999', '$1,000–$9,999', '$10,000–$99,999', '$100,000+'], COLS = ['--seq-1', '--seq-2', '--seq-3', '--seq-4', '--seq-5'];
  let szMode = 'dollars';
  function drawSizes() {
    const share = (c, i, mode) => { const v = c.sizes[mode], t = v.reduce((p, q) => p + q, 0); return t ? v.slice(i).reduce((p, q) => p + q, 0) / t : 0; };
    const small = (c, mode) => { const v = c.sizes[mode], t = v.reduce((p, q) => p + q, 0); return t ? v[0] / t : 0; };
    $('#size-sub').textContent = szMode === 'dollars'
      ? `${LOCAL ? 'This period' : 'This cycle'}, ${pct(share(R, 3, 'dollars'), 1)}% of ${poss(R.short)} itemized dollars came in checks of $10,000 or more, and ${pct(small(R, 'dollars'), 1)}% in contributions of $100 or less. For ${Dm.short}: ${pct(share(Dm, 3, 'dollars'), 1)}% and ${pct(small(Dm, 'dollars'), 1)}%.`
      : `By count, ${pct(small(R, 'count'), 1)}% of ${poss(R.short)} ${fmtN(R.cycle.contributions)} contributions were $100 or less. For ${Dm.short}, it was ${pct(small(Dm, 'count'), 1)}% of ${fmtN(Dm.cycle.contributions)}.`;
    const row = k => { const c = C[k], vals = c.sizes[szMode], tot = vals.reduce((p, q) => p + q, 0);
      return `<div class="sb-row"><div class="sb-label"><b><i class="dot ${k}"></i> ${esc(c.name)}</b><span class="num">${szMode === 'dollars' ? fmt$(tot) + ' itemized' : fmtN(tot) + ' contributions'}</span></div>
        <div class="sb-track">${tot ? vals.map((v, i) => { if (!v) return ''; const p = v / tot; return `<div class="sb-seg" style="flex:${p} 1 0;background:var(${COLS[i]});color:${i >= 3 ? 'var(--bg)' : 'var(--ink)'}" title="${BANDS[i]}: ${szMode === 'dollars' ? fmt$(v) : fmtN(v) + ' contributions'} (${(p * 100).toFixed(1)}%)">${p >= .08 ? Math.round(p * 100) + '%' : ''}</div>`; }).join('') : ''}</div></div>`; };
    $('#sizebar').innerHTML = row('r') + row('d') + `<div class="sb-key">${BANDS.map((b, i) => `<span><i class="sw" style="background:var(${COLS[i]})"></i>${b}</span>`).join('')}</div>`;
  }
  const setSz = mode => { szMode = mode; $('#sz-dollars').setAttribute('aria-pressed', mode === 'dollars'); $('#sz-count').setAttribute('aria-pressed', mode === 'count'); drawSizes(); };
  $('#sz-dollars').onclick = () => setSz('dollars'); $('#sz-count').onclick = () => setSz('count');

  // ---- donor pies (top 10 donors + All others)
  function pieData(c) {
    const top = c.donors.slice(0, 10), topSum = top.reduce((p, r) => p + r[2], 0);
    const rest = Math.max(0, c.cycle.itemized - topSum);
    return { top, topSum, rest, total: c.cycle.itemized };
  }
  (function pieHead() {
    const pr = pieData(R), pd = pieData(Dm), sr = pct(pr.topSum, pr.total), sd = pct(pd.topSum, pd.total);
    $('#pie-h').textContent = `Ten donors supplied ${sr}% of ${poss(R.short)} money and ${sd}% of ${poss(Dm.short)}`;
  })();
  function drawPie(k) {
    const c = C[k], P = pieData(c), el = $('#pie-' + k), hue = k === 'r' ? '--rep' : '--dem';
    const shade = i => `color-mix(in oklab, var(${hue}) ${Math.round(100 - i * 6)}%, var(--surface))`;
    const slices = P.top.map((r, i) => ({ name: r[0], meta: r[1], amt: r[2], n: r[3], col: shade(i), rank: i + 1, dark: i < 5 }));
    if (P.rest > 0) slices.push({ name: 'All others', meta: `${fmtN(Math.max(0, c.cycle.donors - P.top.length))} other donors`, amt: P.rest, n: null, col: 'color-mix(in oklab, var(--ink-3) 30%, var(--surface))', rank: '', dark: false, other: true });
    const tot = slices.reduce((p, s) => p + s.amt, 0) || 1, R0 = 100, cx = 110, cy = 110;
    let a0 = -Math.PI / 2;
    const paths = slices.map((s, i) => {
      const frac = s.amt / tot, a1 = a0 + frac * 2 * Math.PI, large = frac > .5 ? 1 : 0;
      const p0 = [cx + R0 * Math.cos(a0), cy + R0 * Math.sin(a0)], p1 = [cx + R0 * Math.cos(a1), cy + R0 * Math.sin(a1)];
      const d = frac >= .9999 ? `M${cx},${cy - R0} A${R0},${R0} 0 1 1 ${cx - .01},${cy - R0} Z` : `M${cx},${cy} L${p0[0].toFixed(2)},${p0[1].toFixed(2)} A${R0},${R0} 0 ${large} 1 ${p1[0].toFixed(2)},${p1[1].toFixed(2)} Z`;
      const am = (a0 + a1) / 2, lr = frac > .25 ? R0 * .55 : R0 * .68;
      const lbl = frac >= .06 ? `<text x="${(cx + lr * Math.cos(am)).toFixed(1)}" y="${(cy + lr * Math.sin(am) + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${s.dark ? 'var(--bg)' : 'var(--ink)'}" pointer-events="none">${Math.round(frac * 100)}%</text>` : '';
      a0 = a1;
      return `<path d="${d}" fill="${s.col}" stroke="var(--surface)" stroke-width="1.5" data-i="${i}" class="slice"><title>${esc(s.name)}: ${fmt$(s.amt)} (${(frac * 100).toFixed(1)}%)</title></path>${lbl}`;
    }).join('');
    el.innerHTML = `<div class="pie-head"><b><i class="dot ${k}"></i> ${esc(c.name)}</b><span class="num">${fmt$(P.total)} itemized</span></div>
      <div class="pie-wrap"><svg viewBox="0 0 220 220" role="img" aria-label="${esc(c.name)}: top 10 donors gave ${pct(P.topSum, P.total)}% of itemized contributions">${paths}</svg>
      <div class="pie-big"><span class="num">${pct(P.topSum, P.total)}%</span>from the top ${P.top.length} donor${P.top.length === 1 ? '' : 's'}</div></div>
      <ol class="pie-list">${slices.map((s, i) => `<li data-i="${i}"><i class="sw" style="background:${s.col}"></i><span class="pl-name"><b>${s.rank ? s.rank + '. ' : ''}${esc(s.name)}</b><small>${esc(s.meta || '')}${s.n ? (s.meta ? ' · ' : '') + fmtN(s.n) + ' contribution' + (s.n > 1 ? 's' : '') : ''}</small></span><span class="pl-amt num">${fmt$(s.amt)}<small>${(s.amt / tot * 100).toFixed(1)}%</small></span></li>`).join('')}</ol>`;
    const hl = i => { el.querySelectorAll('.slice').forEach(p => p.style.opacity = (i === null || +p.dataset.i === i) ? 1 : .35); el.querySelectorAll('.pie-list li').forEach(li => li.classList.toggle('on', +li.dataset.i === i)); };
    el.querySelectorAll('.slice, .pie-list li').forEach(n => {
      n.addEventListener('mouseenter', () => hl(+n.dataset.i)); n.addEventListener('mouseleave', () => hl(null));
      n.addEventListener('click', () => hl(+n.dataset.i));
    });
  }

  // ---- geography & spending
  for (const k of ['r', 'd']) {
    const c = C[k];
    $('#geo-' + k).innerHTML = c.geo.map(([city, v, n]) => `<li><span>${esc(city)} <small>${fmtN(n)}</small></span><span>${fmt$(v)}</span></li>`).join('') +
      (c.oos ? `<li><span>Out of state <small>${fmtN(c.oos[1])} donors</small></span><span>${fmt$(c.oos[0])} <small>(${pct(c.oos[0], c.cycle.itemized)}%)</small></span></li>` : '');
    $('#sp-' + k).innerHTML = c.spend.map(([cat, v]) => `<li><span>${esc(cat)}</span><span>${fmt$(v)}</span></li>`).join('') || '<li><span>No expenditures reported</span><span></span></li>';
  }

  // ---- boot
  const hasHist = cohSeries.r.length > 1 || cohSeries.d.length > 1;
  if (!hasHist) $('#coh-sec').hidden = true;
  const drawAll = () => { if (hasHist) drawCOH(); drawMonthly(); };
  drawAll(); drawSizes(); drawPie('r'); drawPie('d');
  let rt; if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(drawAll, 80); }).observe($('#app'));
})();
