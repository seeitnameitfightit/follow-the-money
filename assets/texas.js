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

  function home() {
    const S = D.state, m26 = mg(S.d26, S.r26), to = S.cast / S.reg * 100;
    document.title = 'Texas: every county, 1992 to 2026 · See It. Name It. Fight It.';
    app.innerHTML = `<header><div class="eyebrow"><span>Texas</span><span>254 counties</span><span>1992 to 2026</span></div>
      <h1>Texas, county by county</h1>
      <p class="dek">Texas went ${lb(m26)} for governor in 2026, with ${S.blue} Democratic counties. This is where each county's story lives: how it voted every election since 1992, who lives there, and how it stacks up against the state.</p>
      <p class="asof">Each county page starts from the series <b>Texas didn't swing. It climbed.</b> A few counties are up so far; the rest are coming.</p></header>
    <section class="tx-sec"><div class="stats"><div><b class="${cls(m26)}">${lb(m26)}</b><span>Texas margin, governor 2026</span></div><div><b>${S.blue}</b><span>Democratic counties, 2026</span></div><div><b>${to.toFixed(1)}%</b><span>of registered voters cast a ballot</span></div></div></section>
    <section class="tx-sec"><h2>The map</h2><p class="sub">Every county by its 2026 governor margin. Counties with their own page have a dark outline: click one.</p><div class="tx-map" id="map"></div>${mapKey()}</section>
    <section class="tx-sec"><h2>Texas since 1992</h2><p class="sub">Statewide margin in the top-of-ticket race each election. Up is more Democratic.</p><div id="sl"></div><p class="note">President in presidential years, governor in the other midterms, U.S. Senate in 2006 and 2018. Hover or touch a year to see it.</p></section>
    <section class="tx-sec"><h2>Find a county</h2><div class="tx-find"><input id="q" type="search" placeholder="Search 254 counties" aria-label="Search counties"></div>
      <table class="tx-tab" id="ct"><thead><tr><th><button data-s="name">County</button></th><th class="n"><button data-s="m">2026 margin</button></th><th class="n hm"><button data-s="g">Growth, 2000–24</button></th><th class="hm">Group</th></tr></thead><tbody></tbody></table>
      <p class="note">Growth is population change from the 2000 Census to the 2024 estimate. The group is the county's growth group from the series: Shrinking, 0–25%, 25–75% or 75%+. Tarrant County has its own full section: <a href="${ROOT}tarrant/index.html">Tarrant County</a>. For the 2026 turnout and vote by county, see <a href="${ROOT}turnout/index.html">2026 Across Texas</a>.</p></section>`;
    app.querySelector('#sl').appendChild(chart([{ name: 'Texas', v: S.m, cls: 'ln' }], { label: 'Texas statewide margin, 1992 to 2026', races: RACES }));
    drawMap(app.querySelector('#map'), 'home');
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
