/* 2026 Turnout Tracker: renders from the JSON embedded in the page (built by build_turnout.py). */
(function () {
  const ASSET = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');
  const LOGO = ASSET + 'sinifi-logo.png';
  const MARK = `<div class="mark"><img src="${LOGO}" alt="" width="22" height="18">See It. Name It. Fight It. · data.seeitnameitfightit.com</div>`;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  const fmtK = v => v >= 1e6 ? (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : v >= 1e4 ? Math.round(v / 1e3) + 'K' : fmtN(v);
  const pc1 = x => (x * 100).toFixed(1) + '%';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dt = s => new Date(s + 'T12:00:00');
  const dlab = s => { const d = dt(s); return `${WD[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`; };
  const niceMax = v => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
  function tipPos(tip, box, x, y) { const w = box.clientWidth, tw = tip.offsetWidth; let l = x + 14; if (l + tw > w) l = x - tw - 14; if (l < 0) l = 0; tip.style.left = l + 'px'; tip.style.top = Math.max(0, y - 10) + 'px'; }

  const el = $('#turnout-data'); if (!el) return;
  const D = JSON.parse(el.textContent), M = D.meta, Y = D.years, C = D.current;
  setTimeout(() => { const app = $('#app'); if (app && !app.querySelector('.brand')) app.insertAdjacentHTML('afterbegin', `<a class="brand" href="https://seeitnameitfightit.com" target="_blank" rel="noopener"><img src="${LOGO}" alt="See It. Name It. Fight It." width="64" height="52"></a>`); }, 0);

  const COL = { 2018: 'var(--seq-2)', 2022: 'var(--seq-4)', 2024: 'var(--seq-3)', 2026: 'var(--ink)' };
  const DASH = { 2024: '5 4' };
  const n = C.rows.length, last = n ? C.rows[n - 1] : null;
  const same = (y, day) => (Y.find(x => x.year === y).rows[day - 1] || {});
  const daysOut = (date, election) => Math.round((dt(election) - dt(date)) / 864e5);
  // mail ballots received by the same number of days before the election
  const mailBy = (yr, dOut) => Object.entries(yr.mail || {}).filter(([d]) => daysOut(d, yr.election) >= dOut).reduce((a, [, v]) => a + v, 0);
  const today = new Date(); const todayOut = daysOut(today.toISOString().slice(0, 10), C.election);
  const mailNow = C.mail_total || 0;
  const lastMailDate = Object.keys(C.mail || {}).sort().pop();

  // ---------- headline
  let h1, dek;
  const vs = (a, b) => { const r = a / b - 1; return `${Math.abs(r * 100).toFixed(0)}% ${r >= 0 ? 'ahead of' : 'behind'}`; };
  if (n) {
    const s22 = same(2022, n).total, s18 = same(2018, n).total, s24 = same(2024, n).total;
    h1 = `Day ${n}: ${fmtN(last.total)} Tarrant County voters have cast ballots, ${vs(last.total, s22)} the 2022 pace`;
    dek = `That’s <b class="num">${pc1(last.total / C.registered)}</b> of registered voters after ${n} day${n > 1 ? 's' : ''} of early voting. At the same point, 2018 had <b class="num">${fmtN(s18)}</b>, 2022 had <b class="num">${fmtN(s22)}</b> and the 2024 presidential election had <b class="num">${fmtN(s24)}</b>.`;
  } else {
    h1 = 'Early voting for the Nov 3 general election starts Monday, Oct 19';
    dek = `This page will track Tarrant County ballots each day of early voting against the last two midterms and the 2024 presidential election.${mailNow ? ` <b class="num">${fmtN(mailNow)}</b> mail ballots are already back.` : ''}`;
  }
  const y22 = Y.find(x => x.year === 2022), y18 = Y.find(x => x.year === 2018), y24 = Y.find(x => x.year === 2024);
  const tile = (v, l) => `<div><b class="num">${v}</b><span>${l}</span></div>`;
  const tiles = n ? [
    tile(fmtK(last.total), 'ballots in so far'), tile(fmtK(last.ev_cum), 'early votes in person'), tile(fmtK(last.mail_cum), 'mail ballots returned'),
    tile(pc1(last.total / C.registered), 'of registered voters'), tile(fmtK(last.ev), `voted in person on Day ${n}`), tile(fmtK(y22.final_total), 'total 2022 votes, for scale')
  ] : [
    tile(fmtK(C.registered), 'registered voters today'), tile(fmtK(mailNow), 'mail ballots returned so far'), tile('12', 'days of early voting, Oct 19–30'),
    tile(fmtK(y18.final_total), 'voted in the 2018 midterm'), tile(fmtK(y22.final_total), 'voted in the 2022 midterm'), tile(fmtK(y24.final_total), 'voted in 2024')
  ];

  const app = $('#app');
  app.insertAdjacentHTML('beforeend', `<p class="crumb"><a href="../index.html">Home</a> › <a href="../electorate/index.html">The Electorate</a></p>
  <header><div class="eyebrow"><span>2026 Turnout Tracker</span><span>General election Nov 3, 2026</span></div>
    <h1>${esc(h1)}</h1><p class="dek">${dek}</p>
    <div class="asof">Tarrant County Elections daily reports${n ? ` · through ${dlab(last.date)}` : ''} · updated ${esc(D.updated)}</div></header>
  <section aria-label="Key numbers"><div class="stats">${tiles.join('')}</div></section>
  <section aria-labelledby="pace-h"><h2 id="pace-h">${n ? 'Ballots in, day by day, against past elections' : 'How past elections built up, day by day'}</h2>
    <p class="sub">Early votes in person plus mail ballots returned, added up through each day of early voting. Days are lined up by their place in the 12-day early voting period. The last point for past years is the final count, including Election Day.</p>
    <div class="seg" role="group" aria-label="Measure"><button type="button" id="m-n" aria-pressed="true">Ballots</button><button type="button" id="m-p" aria-pressed="false">Share of registered voters</button></div>
    <div class="legend">${[2018, 2022, 2024, 2026].map(y => `<span><i class="sw" style="background:${COL[y]}"></i>${y}${y === 2024 ? ' (presidential)' : ''}</span>`).join('')}</div>
    <div class="chart" id="pace"></div>${MARK}</section>
  <section aria-labelledby="tab-h"><h2 id="tab-h">Day by day</h2><p class="sub">Ballots in so far (early in person plus mail), at the same point in each election. Percentages show where 2026 stands against each past year.</p>
    <div style="overflow-x:auto"><table class="ntab" id="days"></table></div></section>
  <section aria-labelledby="mail-h"><h2 id="mail-h">Mail ballots</h2><p class="sub" id="mail-sub"></p><ul class="kv" id="mail"></ul></section>
  <section aria-labelledby="who-h" id="who-sec" hidden><h2 id="who-h"></h2><p class="sub" id="who-sub"></p>
    <div class="two"><div class="panel"><h3>Who they are</h3><ul class="kv" id="who-kv"></ul></div>
    <div class="panel"><h3>By commissioner precinct</h3><table class="ntab" id="who-comm"></table><p class="note">District pages show turnout so far for every precinct, district, city and school district. <a href="../electorate/index.html">The Electorate ›</a></p></div></div>
    <div class="sizebar" id="who" style="margin-top:20px"></div>${MARK}</section>
  <section aria-labelledby="fin-h"><h2 id="fin-h">How past elections finished</h2><p class="sub">Official totals. Most Tarrant County ballots are cast before Election Day: the early vote is the bulk of the race.</p>
    <div style="overflow-x:auto"><table class="ntab"><thead><tr><th>Election</th><th class="r">In person early</th><th class="r">Mail</th><th class="r">Election Day</th><th class="r">Total</th><th class="r">Turnout</th><th class="r">Before E-Day</th></tr></thead><tbody>
    ${[...Y].sort((a, b) => a.year - b.year).map(y => { const m = y.modes || { early: y.ev_total, mail: y.mail_total, eday: y.eday, total: y.final_total };
      const before = (m.early + m.mail) / (m.early + m.mail + m.eday);
      return `<tr><td>${y.year} ${y.kind.toLowerCase()}</td><td class="r num">${fmtN(m.early)}</td><td class="r num">${fmtN(m.mail)}</td><td class="r num">${fmtN(m.eday)}</td><td class="r num"><b>${fmtN(y.final_total)}</b></td><td class="r num">${pc1(y.final_total / y.registered)}</td><td class="r num">${pc1(before)}</td></tr>`; }).join('')}
    </tbody></table></div></section>
  <footer><b>How these numbers work</b><ul>
    <li>Source: Tarrant County Elections daily early voting, mail ballot and Election Day reports. Daily counts are preliminary; the final totals are the county’s official canvass, which also counts provisional and late mail ballots, so they run slightly higher than the daily reports add up to.</li>
    <li>2018’s daily reports have no Election Day count. Its split by voting method (36,703 mail, 434,029 early, 161,855 Election Day) comes from the county’s official cumulative report.</li>
    <li>Turnout shares use the registration count for each election: ${Y.map(y => `${y.year} ${fmtN(y.registered)}`).join(', ')}, and for 2026 the ${fmtN(C.registered)} voters on the county’s current voter file (active and suspense).</li>
    <li>“Who has voted” uses the county’s voter-level lists of returned mail ballots and early voters, matched by state voter ID to the voter file, with each voter counted once. Only totals are published. A primary vote shows which ballot a voter chose in a primary, not how they will vote in November.</li>
    <li>Early voting ran 12 days each year, Monday through the Friday before Election Day, including one Sunday. 2026: Oct 19–30.</li>
  </ul><a href="https://seeitnameitfightit.com" target="_blank" rel="noopener">${esc(M.org)}</a> · <a href="../index.html">Follow the Money</a> · <a href="../electorate/index.html">The Electorate</a></footer>`);

  // ---------- pace chart
  let mode = 'n';
  function series(y) {
    const pts = y.rows.map(r => ({ x: r.day, v: r.total, r }));
    if (y.year !== 2026) pts.push({ x: 13.4, v: y.final_total, fin: true });
    return pts;
  }
  function draw() {
    const box = $('#pace'), W = box.clientWidth, H = Math.max(250, Math.min(340, W * 0.58)), m = { l: 52, r: 58, t: 14, b: 34 };
    const all = [...Y, C].filter(y => y.rows.length);
    const val = (y, v) => mode === 'n' ? v : v / y.registered;
    const max = niceMax(Math.max(...all.flatMap(y => series(y).map(p => val(y, p.v)))));
    const x = d => m.l + (d - 1) / 12.4 * (W - m.l - m.r), yy = v => m.t + (1 - v / max) * (H - m.t - m.b);
    const fv = v => mode === 'n' ? fmtK(v) : Math.round(v * 100) + '%';
    const lines = all.map(y => { const s = series(y);
      const ev = s.filter(p => !p.fin), fin = s.find(p => p.fin);
      const path = ev.map((p, i) => `${i ? 'L' : 'M'}${x(p.x).toFixed(1)},${yy(val(y, p.v)).toFixed(1)}`).join('');
      const tail = fin && ev.length ? `<path d="M${x(ev.at(-1).x)},${yy(val(y, ev.at(-1).v))} L${x(fin.x)},${yy(val(y, fin.v))}" stroke="${COL[y.year]}" stroke-width="1.5" stroke-dasharray="2 3" fill="none"/><circle cx="${x(fin.x)}" cy="${yy(val(y, fin.v))}" r="3.5" fill="${COL[y.year]}"/>
        <text x="${x(fin.x) + 7}" y="${yy(val(y, fin.v)) + 4}" font-size="11" fill="var(--ink-2)" class="num">${y.year} ${fv(val(y, fin.v))}</text>` : '';
      return `<path d="${path}" fill="none" stroke="${COL[y.year]}" stroke-width="${y.year === 2026 ? 3 : 2}" ${DASH[y.year] ? `stroke-dasharray="${DASH[y.year]}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>${tail}
        ${y.year === 2026 ? ev.map(p => `<circle cx="${x(p.x)}" cy="${yy(val(y, p.v))}" r="4" fill="var(--ink)" stroke="var(--surface)" stroke-width="2"/>`).join('') : ''}`; }).join('');
    const ticks = [0, max / 4, max / 2, max * 3 / 4, max];
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative ballots by day of early voting, 2026 against 2018, 2022 and 2024">
      ${ticks.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${yy(v)}" y2="${yy(v)}" stroke="var(--grid)"/><text x="${m.l - 8}" y="${yy(v) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)" class="num">${fv(v)}</text>`).join('')}
      ${[1, 3, 5, 7, 9, 12].map(d => `<text x="${x(d)}" y="${H - 14}" text-anchor="middle" font-size="11" fill="var(--ink-3)">Day ${d}</text>`).join('')}
      <text x="${x(13.4)}" y="${H - 14}" text-anchor="middle" font-size="11" fill="var(--ink-3)">Final</text>
      ${lines}
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${x(i + 1) - (W - m.l - m.r) / 25}" y="0" width="${(W - m.l - m.r) / 12.4}" height="${H - m.b}" fill="transparent" class="d-hit" data-d="${i + 1}"/>`).join('')}
    </svg><div class="tip" id="p-tip"></div>`;
    const tip = $('#p-tip', box);
    box.querySelectorAll('.d-hit').forEach(h => {
      const show = () => { const d = +h.dataset.d, s = box.getBoundingClientRect().width / W;
        tip.innerHTML = `<b>Day ${d} of early voting</b>` + [y18, y22, y24, C].filter(y => y.rows[d - 1]).map(y => `<div class="t-row"><span><i class="sw" style="background:${COL[y.year]}"></i> ${y.year} · ${dlab(y.rows[d - 1].date).slice(4)}</span><span>${fmtN(y.rows[d - 1].total)} · ${pc1(y.rows[d - 1].total / y.registered)}</span></div>`).join('');
        tip.style.opacity = 1; tipPos(tip, box, x(d) * s, 20); };
      const hide = () => { tip.style.opacity = 0; };
      h.addEventListener('mouseenter', show); h.addEventListener('mouseleave', hide);
      h.addEventListener('touchstart', () => { show(); setTimeout(hide, 2500); }, { passive: true });
    });
  }
  const setMode = k => { mode = k; $('#m-n').setAttribute('aria-pressed', k === 'n'); $('#m-p').setAttribute('aria-pressed', k === 'p'); draw(); };
  $('#m-n').onclick = () => setMode('n'); $('#m-p').onclick = () => setMode('p');

  // ---------- day table
  const diff = (a, b) => { if (a == null || !b) return ''; const r = a / b - 1; return `<small style="color:${r >= 0 ? 'var(--ink)' : 'var(--ink-3)'}">${r >= 0 ? '+' : '−'}${Math.abs(r * 100).toFixed(0)}%</small>`; };
  $('#days').innerHTML = `<thead><tr><th>Day</th><th>Date (2026)</th><th class="r">2018</th><th class="r">2022</th><th class="r">2024</th><th class="r">2026</th></tr></thead><tbody>${
    D.ev_days_2026.map((d, i) => { const r = C.rows[i], a = r ? r.total : null, s22 = same(2022, i + 1).total, s18 = same(2018, i + 1).total, s24 = same(2024, i + 1).total;
      return `<tr><td>${i + 1}</td><td>${dlab(d)}</td><td class="r num">${fmtN(s18)} ${diff(a, s18)}</td><td class="r num">${fmtN(s22)} ${diff(a, s22)}</td><td class="r num">${fmtN(s24)} ${diff(a, s24)}</td><td class="r num">${r ? `<b>${fmtN(a)}</b>` : '<span style="color:var(--ink-3)">—</span>'}</td></tr>`; }).join('')}</tbody>`;

  // ---------- mail
  const refOut = lastMailDate ? daysOut(lastMailDate, C.election) : Math.max(todayOut, 0);
  $('#mail-sub').textContent = mailNow
    ? `Mail ballots returned in 2026 through ${dlab(lastMailDate)}, ${refOut} days before Election Day, against the same point in past elections.`
    : `Mail ballots returned by this many days before Election Day in past elections. 2026 figures appear once the county posts its mail ballot report.`;
  $('#mail').innerHTML = [y18, y22, y24].map(y => `<li><span>${y.year} at ${refOut} days out <small>final ${fmtN(y.mail_total)}</small></span><span>${fmtN(mailBy(y, refOut))}</span></li>`).join('') +
    (mailNow ? `<li><span><b>2026</b></span><span><b>${fmtN(mailNow)}</b></span></li>` : '');

  // ---------- who has voted (county voter-level lists matched to the voter file)
  const W = C.who, WA = W && W.all;
  if (WA) {
    const B = W.base, REG = W.registered, ref = B['2022 early and mail voters'];
    const sh = (p, i) => p.lean[i] / (p.n || 1), gap = p => (sh(p, 0) - sh(p, 1)) * 100;
    const gtxt = g => `${g >= 0 ? 'D' : 'R'}+${Math.abs(g).toFixed(1)}`;
    const kinds = Object.keys(W.rosters);
    $('#who-sec').hidden = false;
    $('#who-h').textContent = `Who has voted so far: ${pc1(WA.dropoff / WA.n)} sat out the 2022 midterm, then voted in 2024, and ${pc1(WA.new22 / WA.n)} registered since 2022`;
    $('#who-sub').textContent = `The ${fmtN(WA.voters)} voters on the county’s lists of ${kinds.map(k => k === 'mail' ? 'returned mail ballots' : 'early voters').join(' and ')}${WA.through ? ` through ${dlab(WA.through)}` : ''}, matched to the voter file by state voter ID (${fmtN(WA.n)} found). Each voter is counted once.`;
    $('#who-kv').innerHTML = [
      ['Sat out the 2022 midterm, then voted in 2024', WA.dropoff, REG.dropoff],
      ['Registered since the 2022 midterm', WA.new22, REG.new22],
      ['On the rolls in 2022 but did not vote', WA.skipped22, REG.skipped22],
      ['Under 50', WA.age[0] + WA.age[1], REG.age[0] + REG.age[1]],
      ['65 or older', WA.age[3], REG.age[3]],
    ].map(([l, v, rv]) => `<li><span>${l} <small>all registered: ${pc1(rv / REG.n)}</small></span><span>${pc1(v / WA.n)}</span></li>`).join('') +
      kinds.map(k => `<li><span>${k === 'mail' ? 'Mail ballots' : 'Early in person'}</span><span>${fmtN(W.rosters[k].voters)}</span></li>`).join('');
    // primary history: secondary, with its caveat
    const row = (lab, p) => { const t = p.n || 1, seg = (v, col, txt) => v > 0 ? `<div class="sb-seg" style="flex:${v / t} 1 0;background:${col};color:${col === 'var(--grid)' ? 'var(--ink)' : '#fff'}">${v / t >= .12 ? txt + ' ' + Math.round(v / t * 100) + '%' : ''}</div>` : '';
      return `<div class="sb-row"><div class="sb-label"><b>${esc(lab)}</b><span class="num">${fmtN(p.n)} · ${gtxt(gap(p))}</span></div><div class="sb-track" style="height:22px">${seg(p.lean[0], 'var(--dem)', 'D')}${seg(p.lean[2], 'var(--grid)', 'Neither')}${seg(p.lean[1], 'var(--rep)', 'R')}</div></div>`; };
    $('#who').innerHTML = `<p class="note" style="margin:0">By primary history: the most recent party primary each voter chose since 2022. A primary ballot is not a November vote, and the large 2026 Democratic primary makes every 2026 group look more Democratic on this measure.</p>` +
      row('2026 so far', WA) + kinds.filter(() => kinds.length > 1).map(k => row(`2026 ${k === 'mail' ? 'mail' : 'early in person'}`, W.rosters[k])).join('') +
      Object.entries(B).filter(([, p]) => p).map(([k, p]) => row(k, p)).join('');
    $('#who-comm').innerHTML = `<thead><tr><th>Pct</th><th class="r">Voted</th><th class="r">Lean</th><th class="r">2022 early + mail</th></tr></thead><tbody>${['01', '02', '03', '04'].map(c => {
      const a = WA.comm[c], t = a[0] + a[1] + a[2], b = ref && ref.comm[c], tb = b ? b[0] + b[1] + b[2] : 0;
      return `<tr><td>${+c}</td><td class="r num">${fmtN(t)}</td><td class="r num">${t ? gtxt((a[0] - a[1]) / t * 100) : '—'}</td><td class="r num">${tb ? gtxt((b[0] - b[1]) / tb * 100) : '—'}</td></tr>`; }).join('')}</tbody>`;
  }

  draw();
  let rt; if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(draw, 80); }).observe(app);
})();
