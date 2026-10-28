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
  <section aria-labelledby="day-h"><h2 id="day-h">${n ? `Each day on its own: Day ${n} against the same day in past elections` : 'Each day on its own, in past elections'}</h2>
    <p class="sub">People who voted in person on each day of early voting, not added up. This shows whether a single day beat the same day in past elections. Mail ballots are left out because they arrive on their own schedule. Day 7 is the Sunday each year.</p>
    <div class="seg" role="group" aria-label="Measure"><button type="button" id="b-n" aria-pressed="true">Voters</button><button type="button" id="b-p" aria-pressed="false">Share of registered voters</button></div>
    <div class="legend">${[2018, 2022, 2024, 2026].map(y => `<span><i class="sw" style="background:${y === 2024 ? `repeating-linear-gradient(45deg, ${COL[y]} 0 2px, var(--surface) 2px 4px); box-shadow: inset 0 0 0 1px ${COL[y]}` : COL[y]}"></i>${y}${y === 2024 ? ' (presidential)' : ''}</span>`).join('')}</div>
    <p class="note" id="day-call"></p>
    <div class="chart" id="byday"></div>${MARK}</section>
  <section aria-labelledby="tx-h" id="tx-sec" hidden><h2 id="tx-h"></h2>
    <p class="sub">In-person early votes, added up through each day, as a share of registered voters. Mail ballots are left out here because many counties are slow to report them to the state. Past years use the Texas Secretary of State’s daily county counts for Tarrant and every other county, so Tarrant’s numbers here can differ slightly from the county’s own reports above.</p>
    <div class="seg" role="group" aria-label="Compare Tarrant with" id="tx-seg" hidden><button type="button" id="tx-all" aria-pressed="true">Rest of Texas</button><button type="button" id="tx-big" aria-pressed="false"></button></div>
    <p class="note" id="tx-call"></p>
    <div class="legend" id="tx-leg"></div>
    <div class="chart" id="tx"></div>
    <h3 style="margin-top:22px">Tarrant and other Texas counties, through Day <select id="tx-day" aria-label="Early voting day"></select></h3>
    <div style="display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin:2px 0 10px">
      <div class="seg" role="group" aria-label="Show" style="margin:0"><button type="button" id="tt-p" aria-pressed="true">Share of registered voters</button><button type="button" id="tt-n" aria-pressed="false">Votes cast</button></div>
      <label style="font-size:13px;color:var(--ink-2)"><input type="checkbox" id="tt-all"> Show all Texas counties</label>
      <input type="search" id="tt-q" placeholder="Find a county" aria-label="Find a county" hidden style="font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--rule);border-radius:6px;background:var(--surface);color:var(--ink)">
    </div>
    <div style="overflow-x:auto"><table class="ntab" id="tx-tab"></table></div>
    <p class="note" id="tx-foot"></p>${MARK}</section>
  <section aria-labelledby="site-h" id="site-sec" hidden><h2 id="site-h"></h2>
    <p class="sub" id="site-sub"></p>
    <div class="ctl-row" style="display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin:4px 0 6px">
      <div class="seg" role="group" aria-label="Measure" style="margin:0"><button type="button" id="st-n" aria-pressed="true">Votes</button><button type="button" id="st-p" aria-pressed="false">Share of county</button></div>
      <label style="font-size:13px;color:var(--ink-2)">Through Day <select id="st-day"></select></label>
      <label style="font-size:13px;color:var(--ink-2)">Change compared with <select id="st-base"></select></label>
      <label style="font-size:13px;color:var(--ink-2)"><input type="checkbox" id="st-all"> Include sites used only once</label>
    </div>
    <p class="note" id="site-call"></p>
    <div style="overflow-x:auto"><table class="ntab" id="site-tab"></table></div><button type="button" id="st-more" class="more" style="margin-top:8px;font:inherit;font-size:13px;font-weight:600;border:1px solid var(--rule);background:var(--surface);color:var(--ink);padding:6px 12px;border-radius:6px;cursor:pointer" hidden></button>
    <p class="note">Voters can use any early voting site in the county, so a site’s count depends partly on which other sites were open nearby that year. “Share of county” is the site’s portion of all in-person early votes in the county through the same day, which takes out the difference between a presidential year and a midterm. Some sites were open only part of the period. Sites renamed between elections (for example the Southwest Sub-Courthouse, now the Dionne Phillips Bagsby Southwest Subcourthouse) are matched; a site that moved to a different building is listed separately.</p>${MARK}</section>
  <section aria-labelledby="tab-h"><h2 id="tab-h">Day by day: the numbers behind the build-up</h2><p class="sub">Ballots in so far (early in person plus mail), at the same point in each election. Percentages show where 2026 stands against each past year.</p>
    <div style="overflow-x:auto"><table class="ntab" id="days"></table></div></section>
  <section aria-labelledby="mail-h"><h2 id="mail-h">Mail ballots</h2><p class="sub" id="mail-sub"></p><ul class="kv" id="mail"></ul></section>
  <section aria-labelledby="who-h" id="who-sec" hidden><h2 id="who-h"></h2><p class="sub" id="who-sub"></p>
    <div class="two"><div class="panel"><h3>Their voting history</h3><ul class="kv" id="who-kv"></ul><p class="note">Age, sex and race are in the day-by-day table below.</p></div>
    <div class="panel"><h3>By commissioner precinct</h3><table class="ntab" id="who-comm"></table><p class="note">District pages show turnout so far for every precinct, district, city and school district. <a href="../electorate/index.html">The Electorate ›</a></p></div></div>
    <div id="bloc-wrap" hidden><h3 style="margin:22px 0 4px">By voting history, 2018 to 2026</h3>
    <p class="note" style="margin-top:0">Each registered voter falls in one group, from the March primaries of 2018, 2020, 2022, 2024 and 2026 and the November generals of 2018, 2020, 2022 and 2024. “Of voters” and “Of registered” show each group’s share of those who have voted and of all registered voters; “Turnout so far” is the share of the group that has already voted.</p>
    <div id="bloc-pies" style="display:flex;flex-wrap:wrap;gap:12px 36px;align-items:center;margin:10px 0 14px"></div>
    <div style="overflow-x:auto"><table class="ntab" id="bloc"></table></div></div>
    <div id="demo-day"></div>
    <div class="sizebar" id="who" style="margin-top:20px"></div>
    <div id="scen"></div>
    <div id="dl-wrap" hidden><h3 style="margin:22px 0 4px" id="dl-h"></h3>
      <p class="note" style="margin-top:0" id="dl-sub"></p>
      <div class="seg" role="group" aria-label="Voters shown"><button type="button" id="dl-day" aria-pressed="true">Each day on its own</button><button type="button" id="dl-cum" aria-pressed="false">All voters so far</button></div>
      <div class="chart" id="dl"></div>
      <div class="sb-key"><span><i class="sw" style="background:var(--dem)"></i>Democratic primary</span><span><i class="sw" style="background:var(--grid)"></i>Neither</span><span><i class="sw" style="background:var(--rep)"></i>Republican primary</span></div>
      <p class="note">Each voter’s most recent party primary since 2022. A primary ballot is not a November vote, and this is not a forecast. The bars on the right are past electorates, for scale.</p></div>
    <div id="nei-wrap" hidden><h3 style="margin:22px 0 4px" id="nei-h"></h3>
      <p class="note" style="margin-top:0">Share of 2026 voters so far with no Democratic or Republican primary on record since 2022, after each day of early voting. The dashed lines show the same share among past electorates: the higher the turnout, the more of these less predictable voters it brings in.</p>
      <div class="chart" id="nei"></div></div>${MARK}</section>
  <section aria-labelledby="fin-h"><h2 id="fin-h">How past elections finished</h2><p class="sub">Official totals. Most Tarrant County ballots are cast before Election Day: the early vote is the bulk of the race.</p>
    <div style="overflow-x:auto"><table class="ntab"><thead><tr><th>Election</th><th class="r">In person early</th><th class="r">Mail</th><th class="r">Election Day</th><th class="r">Total</th><th class="r">Turnout</th><th class="r">Before E-Day</th></tr></thead><tbody>
    ${[...Y].sort((a, b) => a.year - b.year).map(y => { const m = y.modes || { early: y.ev_total, mail: y.mail_total, eday: y.eday, total: y.final_total };
      const before = (m.early + m.mail) / (m.early + m.mail + m.eday);
      return `<tr><td>${y.year} ${y.kind.toLowerCase()}</td><td class="r num">${fmtN(m.early)}</td><td class="r num">${fmtN(m.mail)}</td><td class="r num">${fmtN(m.eday)}</td><td class="r num"><b>${fmtN(y.final_total)}</b></td><td class="r num">${pc1(y.final_total / y.registered)}</td><td class="r num">${pc1(before)}</td></tr>`; }).join('')}
    </tbody></table></div></section>
  <footer><b>How these numbers work</b><ul>
    <li>Source: Tarrant County Elections daily early voting, mail ballot and Election Day reports. Daily counts are preliminary; the final totals are the county’s official canvass, which also counts provisional and late mail ballots, so they run slightly higher than the daily reports add up to.</li>
    <li>2018’s daily reports have no Election Day count. Its split by voting method (36,703 mail, 434,029 early, 161,855 Election Day) comes from the county’s official cumulative report.</li>
    <li>Turnout shares use the registration count for each election: ${Y.map(y => `${y.year} ${fmtN(y.registered)}`).join(', ')}, and for 2026 ${C.registered_src === 'county' ? `the county’s own count of ${fmtN(C.registered)} active registered voters whose registration takes effect by Election Day${C.registered_sos ? ` (the Texas Secretary of State’s figure, ${fmtN(C.registered_sos)}, is lower; the county says it is incomplete, so it is used only in the Tarrant-against-Texas comparison, where every county is measured the same way)` : ''}` : C.registered_src === 'state' ? `the Texas Secretary of State’s count of ${fmtN(C.registered)} registered voters in Tarrant County` : `the ${fmtN(C.registered)} active voters on the county’s current voter file`}. Voters on the county’s suspense list (mostly people who have moved) are left out of every comparison on this page unless they have voted.</li>
    <li>“Who has voted” uses the county’s voter-level lists of returned mail ballots and early voters, matched by state voter ID to the voter file, with each voter counted once. Only totals are published. A primary vote shows which ballot a voter chose in a primary, not how they will vote in November.</li>
    ${C.who && C.who.all && C.who.all.race ? '<li>Race and ethnicity are estimates, not counts: each voter’s chances come from Census surname and first-name data and their Census block, adjusted so each tract matches its citizen voting-age makeup in the American Community Survey, then added up. Only totals are published.</li>' : ''}
    <li>Early voting ran 12 days each year, Monday through the Friday before Election Day, including one Sunday. 2026: Oct 19–30.</li>
  </ul><a href="https://seeitnameitfightit.com" target="_blank" rel="noopener">${esc(M.org)}</a> · <a href="../index.html">Follow the Money</a> · <a href="../electorate/index.html">The Electorate</a></footer>`);

  // ---------- section order (reads as a story): scorecard, build-up, each day, who has voted, Texas, day-by-day table,
  // sites, mail, past finishes. Sections are moved after they are written, so each keeps its own markup above.
  ['pace-h', 'day-h', 'who-h', 'tx-h', 'tab-h', 'site-h', 'mail-h', 'fin-h'].forEach(id => {
    const sec = app.querySelector(`section[aria-labelledby="${id}"]`), foot = app.querySelector('footer');
    if (sec && foot) app.insertBefore(sec, foot);
  });

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


  // ---------- each day on its own (in-person early votes that day)
  let bmode = 'n';
  function drawDays() {
    const box = $('#byday'), W = box.clientWidth, H = Math.max(240, Math.min(320, W * 0.52)), m = { l: 52, r: 12, t: 14, b: 34 };
    const yrs = [y18, y22, y24, C];
    const val = (y, r) => !r ? null : bmode === 'n' ? r.ev : r.ev / y.registered;
    const max = niceMax(Math.max(...yrs.flatMap(y => y.rows.map(r => val(y, r)))));
    const fv = v => bmode === 'n' ? fmtK(v) : (v * 100).toFixed(v * 100 < 10 ? 1 : 0) + '%';
    const gw = (W - m.l - m.r) / 12, pad = Math.max(2, gw * 0.14), bw = (gw - pad * 2) / 4;
    const yy = v => m.t + (1 - v / max) * (H - m.t - m.b);
    const ticks = [0, max / 4, max / 2, max * 3 / 4, max];
    let bars = '';
    for (let d = 1; d <= 12; d++) yrs.forEach((y, k) => { const v = val(y, y.rows[d - 1]); if (v == null) return;
      const x0 = m.l + (d - 1) * gw + pad + k * bw;
      bars += `<rect x="${(x0 + 0.5).toFixed(1)}" y="${yy(v).toFixed(1)}" width="${Math.max(1, bw - 1).toFixed(1)}" height="${(yy(0) - yy(v)).toFixed(1)}" fill="${y.year === 2024 ? 'url(#hatch24)' : COL[y.year]}" ${y.year === 2024 ? `stroke="${COL[2024]}" stroke-width="1"` : ''} rx="1"/>`; });
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="In-person early votes cast each day, 2026 against 2018, 2022 and 2024">
      <defs><pattern id="hatch24" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--surface)"/><rect width="2.5" height="5" fill="${COL[2024]}"/></pattern></defs>
      ${ticks.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${yy(v)}" y2="${yy(v)}" stroke="var(--grid)"/><text x="${m.l - 8}" y="${yy(v) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)" class="num">${fv(v)}</text>`).join('')}
      ${bars}
      ${Array.from({ length: 12 }, (_, i) => `<text x="${m.l + (i + 0.5) * gw}" y="${H - 14}" text-anchor="middle" font-size="11" fill="var(--ink-3)">${W < 520 ? i + 1 : 'Day ' + (i + 1)}</text>`).join('')}
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${m.l + i * gw}" y="0" width="${gw}" height="${H - m.b}" fill="transparent" class="b-hit" data-d="${i + 1}"/>`).join('')}
    </svg><div class="tip" id="b-tip"></div>`;
    const tip = $('#b-tip', box);
    box.querySelectorAll('.b-hit').forEach(h => {
      const show = () => { const d = +h.dataset.d, s = box.getBoundingClientRect().width / W, now = C.rows[d - 1];
        tip.innerHTML = `<b>Day ${d} of early voting, in person</b>` + yrs.filter(y => y.rows[d - 1]).map(y => { const r = y.rows[d - 1];
          const cmp = now && y !== C ? ` <small>${now.ev >= r.ev ? '2026 +' : '2026 −'}${Math.abs((now.ev / r.ev - 1) * 100).toFixed(0)}%</small>` : '';
          return `<div class="t-row"><span><i class="sw" style="background:${COL[y.year]}"></i> ${y.year} · ${dlab(r.date).slice(4)}</span><span>${fmtN(r.ev)} · ${pc1(r.ev / y.registered)}${cmp}</span></div>`; }).join('');
        tip.style.opacity = 1; tipPos(tip, box, (m.l + (d - 0.5) * gw) * s, 20); };
      const hide = () => { tip.style.opacity = 0; };
      h.addEventListener('mouseenter', show); h.addEventListener('mouseleave', hide);
      h.addEventListener('touchstart', () => { show(); setTimeout(hide, 2500); }, { passive: true });
    });
  }
  (function dayCall() {
    const c = $('#day-call'); if (!n) { c.hidden = true; return; }
    const r = C.rows[n - 1];
    const parts = [[2022, same(2022, n).ev], [2018, same(2018, n).ev], [2024, same(2024, n).ev]].map(([yr, b]) => { const x = r.ev / b - 1; return `${x >= 0 ? 'beat' : 'trailed'} ${yr} by <b class="num">${Math.abs(x * 100).toFixed(0)}%</b>`; });
    c.innerHTML = `Day ${n} (${dlab(r.date)}): <b class="num">${fmtN(r.ev)}</b> people voted in person. That ${parts[0]}, ${parts[1]} and ${parts[2]} on the same day.`;
  })();
  const setB = k => { bmode = k; $('#b-n').setAttribute('aria-pressed', k === 'n'); $('#b-p').setAttribute('aria-pressed', k === 'p'); drawDays(); };
  $('#b-n').onclick = () => setB('n'); $('#b-p').onclick = () => setB('p');


  // ---------- Tarrant against Texas (Secretary of State county counts)
  // Two comparisons: the rest of Texas (all 254 counties; 2022 on), or the rest of the largest counties the state
  // tracked in 2018 ("BASIS"), which lets 2018 be compared with later years on the same counties.
  const S = D.state || {}, SY = Object.keys(S).map(Number).sort((a, b) => a - b);
  const NB = Math.max(0, ...SY.map(y => S[y].basis_n || 0));
  let txB = 'TOTAL';
  const sRow = (y, d) => S[y] && S[y].rows.find(r => r.day === d);
  const share = c => c[2] / c[0];          // in-person early votes so far, as a share of registered voters
  const restSh = r => (r.c[txB][2] - r.c.TARRANT[2]) / (r.c[txB][0] - r.c.TARRANT[0]);
  const gapPts = r => (share(r.c.TARRANT) - restSh(r)) * 100;
  const txYears = () => SY.filter(y => txB === 'BASIS' ? S[y].rows.every(r => r.c.BASIS) : !S[y].partial);
  const restName = () => txB === 'BASIS' ? `the other ${NB - 1} largest counties` : 'the rest of Texas';
  const pts = g => `${g >= 0 ? '+' : '−'}${Math.abs(g).toFixed(1)}`;
  const aheadTxt = g => `${Math.abs(g).toFixed(1)} point${Math.abs(g).toFixed(1) === '1.0' ? '' : 's'} ${g >= 0 ? 'ahead of' : 'behind'}`;
  const nS = S[2026] ? S[2026].rows.at(-1).day : 0;
  const CNAME = k => k === 'TOTAL' ? 'Texas' : k === 'BASIS' ? `${NB} largest counties` : k.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  function drawTx() {
    const box = $('#tx'), W = box.clientWidth, H = Math.max(220, Math.min(300, W * 0.48)), m = { l: 52, r: 74, t: 14, b: 34 };
    const ser = txYears().map(y => ({ y, p: S[y].rows.map(r => ({ d: r.day, g: gapPts(r) })) }));
    const gs = ser.flatMap(s => s.p.map(p => p.g));
    let lo = Math.min(0, ...gs), hi = Math.max(0, ...gs); const padv = Math.max(0.5, (hi - lo) * 0.12); lo = Math.floor(lo - padv); hi = Math.ceil(hi + padv);
    const x = d => m.l + (d - 1) / 11 * (W - m.l - m.r), yy = g => m.t + (hi - g) / (hi - lo) * (H - m.t - m.b);
    const step = (hi - lo) <= 4 ? 1 : (hi - lo) <= 10 ? 2 : 5;
    const ticks = []; for (let g = Math.ceil(lo / step) * step; g <= hi; g += step) ticks.push(g);
    const ly = {}; ser.map(s => ({ y: s.y, v: yy(s.p.at(-1).g) + (s.y === 2026 ? -9 : 4) })).sort((a, b) => a.v - b.v).forEach((o, i, arr) => { if (i && o.v - arr[i - 1].v < 13) o.v = arr[i - 1].v + 13; ly[o.y] = o.v; });
    const lines = ser.map(s => { const c = COL[s.y], dash = DASH[s.y] || '';
      const path = s.p.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${yy(p.g).toFixed(1)}`).join(''), e = s.p.at(-1);
      return `<path d="${path}" fill="none" stroke="${c}" stroke-width="${s.y === 2026 ? 3 : 2}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round" stroke-linejoin="round"/>
        ${s.y === 2026 ? s.p.map(p => `<circle cx="${x(p.d)}" cy="${yy(p.g)}" r="4" fill="var(--ink)" stroke="var(--surface)" stroke-width="2"/>`).join('') : ''}
        <text x="${x(e.d) + 7}" y="${ly[s.y]}" font-size="11" fill="var(--ink-2)" class="num">${s.y} ${pts(e.g)}</text>`; }).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tarrant County's early turnout minus ${restName()}, in percentage points, by day of early voting">
      ${ticks.map(g => `<line x1="${m.l}" x2="${W - m.r}" y1="${yy(g)}" y2="${yy(g)}" stroke="${g === 0 ? 'var(--ink-3)' : 'var(--grid)'}"/><text x="${m.l - 8}" y="${yy(g) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)" class="num">${g === 0 ? 'Even' : pts(g)}</text>`).join('')}
      <text x="${m.l + 4}" y="${m.t + 4}" font-size="11" fill="var(--ink-3)">↑ Tarrant ahead of ${restName()}</text><text x="${m.l + 4}" y="${H - m.b - 6}" font-size="11" fill="var(--ink-3)">↓ Tarrant behind</text>
      ${[1, 3, 5, 7, 9, 12].map(d => `<text x="${x(d)}" y="${H - 14}" text-anchor="middle" font-size="11" fill="var(--ink-3)">Day ${d}</text>`).join('')}
      ${lines}
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${x(i + 1) - (W - m.l - m.r) / 22}" y="0" width="${(W - m.l - m.r) / 11}" height="${H - m.b}" fill="transparent" class="x-hit" data-d="${i + 1}"/>`).join('')}
    </svg><div class="tip" id="x-tip"></div>`;
    const tip = $('#x-tip', box);
    box.querySelectorAll('.x-hit').forEach(h => {
      const show = () => { const d = +h.dataset.d, sc = box.getBoundingClientRect().width / W;
        tip.innerHTML = `<b>Through Day ${d} of early voting</b>` + txYears().filter(y => sRow(y, d)).map(y => { const r = sRow(y, d);
          return `<div class="t-row"><span><i class="sw" style="background:${COL[y]}"></i> ${y}</span><span>Tarrant ${pc1(share(r.c.TARRANT))} · others ${pc1(restSh(r))} · <b>${pts(gapPts(r))}</b></span></div>`; }).join('');
        tip.style.opacity = 1; tipPos(tip, box, x(d) * sc, 20); };
      const hide = () => { tip.style.opacity = 0; };
      h.addEventListener('mouseenter', show); h.addEventListener('mouseleave', hide);
      h.addEventListener('touchstart', () => { show(); setTimeout(hide, 2500); }, { passive: true });
    });
  }
  function txText() {
    const ys = txYears(), fin = y => S[y].rows.at(-1), rn = restName();
    if (nS) {
      const r = sRow(2026, nS), g = gapPts(r);
      // 2026 compares Tarrant with the counties that have reported; past years on that day use the same counties
      const cmpGap = y => { const c = txB === 'TOTAL' && r.cmp && r.cmp[y]; if (!c) return gapPts(sRow(y, nS)); const [t0, a] = c; return (share(t0) - (a[2] - t0[2]) / (a[0] - t0[0])) * 100; };
      const past = ys.filter(y => y !== 2026 && sRow(y, nS)).map(y => `${y}: ${pts(cmpGap(String(y)))}`).join(', ');
      const t = r.c.TARRANT, T = r.c[txB], dayT = t[1] / t[0], dayS = (T[1] - t[1]) / (T[0] - t[0]);
      const rp = txB === 'TOTAL' && r.rep, rn2 = rp ? 'the other Texas counties that have reported' : rn;
      $('#tx-call').innerHTML = `Through Day ${nS}, Tarrant is <b>${aheadTxt(g)}</b> ${rn2}${past ? ` (same day in ${past} points${rp ? ', measured on the same counties' : ''})` : ''}.` +
        (txB === 'TOTAL' && !r.rep ? ` Tarrant has cast <b class="num">${pc1(t[2] / T[2])}</b> of all in-person early votes in Texas so far, with <b class="num">${pc1(t[0] / T[0])}</b> of the state’s registered voters.` : '') +
        (txB === 'TOTAL' && r.rep ? ` The state has usable counts from <b>${r.rep} of 254 counties</b> for Day ${nS}${r.unrep && r.unrep.length ? `; not yet reported or incomplete: ${r.unrep.map(CNAME).join(', ')}${r.rep < 250 ? ' and others' : ''}` : ''}.${r.src === 'county' ? ' Tarrant’s 2026 figure comes from the county’s own report because the state’s was incomplete.' : ''}${r.fed && r.fed.length ? ` ${r.fed.map(CNAME).join(' and ')} ${r.fed.length > 1 ? 'come' : 'comes'} from ${r.fed.length > 1 ? 'those counties’ own reports' : 'the county’s own report'}, because the state’s figure was wrong.` : ''}` : '') +
        ` On Day ${nS} alone, <b class="num">${pc1(dayT)}</b> of Tarrant’s registered voters voted in person, against <b class="num">${pc1(dayS)}</b> in ${rn2}.`;
    } else {
      $('#tx-call').innerHTML = `Share of registered voters who voted early in person, Tarrant against ${rn}, by the end of early voting: ` +
        ys.map(y => { const r = fin(y); return `${y}, <b class="num">${pc1(share(r.c.TARRANT))}</b> to <b class="num">${pc1(restSh(r))}</b> (${pts(gapPts(r))} points)`; }).join('; ') + '. 2026 appears here once the state posts its first daily count.';
    }
    $('#tx-leg').innerHTML = ys.map(y => `<span><i class="sw" style="background:${COL[y]}"></i>${y}${y === 2024 ? ' (presidential)' : ''}</span>`).join('') + `<span style="color:var(--ink-3)">Points ahead of (+) or behind (−) ${rn}</span>`;
  }
  let ttMode = 'p';
  function txTable(d) {
    const showAll = $('#tt-all') && $('#tt-all').checked, q = showAll ? ($('#tt-q').value || '').trim().toUpperCase() : '';
    // a county's numbers for this day: the full record for the big counties, or the compact all-county list
    const getC = (y, k) => { const r = sRow(y, d); if (!r) return null; if (r.c[k]) return r.c[k];
      const A = S[y].all && S[y].all[k]; if (!A) return null; const v = A[1][S[y].rows.indexOf(r)]; return v == null || !A[0] ? null : [A[0], 0, v, 0, 0]; };
    const unrepAt = (y, k) => { const r = sRow(y, d); if (!r || y !== 2026) return false; if (r.unrep && r.unrep.includes(k)) return true;
      const A = S[y].all && S[y].all[k]; return !!A && A[1][S[y].rows.indexOf(r)] == null; };
    let keys = [...new Set(SY.flatMap(y => Object.keys((sRow(y, d) || S[y].rows.at(-1)).c)))].filter(k => k !== 'TOTAL' && k !== 'BASIS');
    if (showAll) keys = [...new Set(SY.flatMap(y => Object.keys(S[y].all || {})))].filter(k => !q || k.includes(q) || k === 'TARRANT');   // Tarrant stays in for comparison
    const regAll = k => { for (const y of [...SY].reverse()) { const A = S[y].all && S[y].all[k]; if (A && A[0]) return A[0]; } return 0; };
    keys.sort((a, b) => a === 'TARRANT' ? -1 : b === 'TARRANT' ? 1 : showAll ? regAll(b) - regAll(a) : 0);
    const totals = [...(NB ? ['BASIS'] : []), 'TOTAL'];
    const has26 = !!sRow(2026, d), base = SY.includes(2022) ? 2022 : null;
    const N = ttMode === 'n';                  // votes cast instead of share of registered voters
    const val = (y, k) => { const r = sRow(y, d); if (!r || (k === 'TOTAL' && (S[y].partial || r.rep))) return null; const c = k === 'TOTAL' || k === 'BASIS' ? r.c[k] : getC(y, k); return c ? (N ? c[2] : share(c)) : null; };
    const cell = (y, k) => { const v = val(y, k); if (v == null && unrepAt(y, k)) return '<span style="color:var(--ink-3)">not reported</span>'; return v == null ? '<span style="color:var(--ink-3)">—</span>' : N ? fmtN(v) : pc1(v); };
    const chg = k => { const a = val(2026, k), b = val(base, k); if (a == null || b == null || !b) return ''; return N ? `${a >= b ? '+' : '−'}${Math.abs((a / b - 1) * 100).toFixed(0)}%` : `${pts((a - b) * 100)} pts`; };
    // registered voters, newest year the county appears in (any day), to show each county's size
    const regOf = k => { for (const y of [...SY].reverse()) { if (k === 'TOTAL' && S[y].partial) continue; const r = S[y].rows.find(x => x.c[k]); if (r && !(k === 'TOTAL' && r.rep)) return r.c[k][0]; } return regAll(k) || null; };
    const lastY = has26 ? 2026 : SY.filter(y => !S[y].partial).at(-1) || SY.at(-1), mxv = N ? Math.max(...keys.map(k => val(lastY, k) || 0), 1) : 1;
    const bar = k => { const v = val(lastY, k); return N && v != null && k !== 'TOTAL' && k !== 'BASIS' ? `<span aria-hidden="true" style="display:inline-block;vertical-align:middle;height:8px;width:${Math.max(2, v / mxv * 90)}px;background:${k === 'TARRANT' ? 'var(--ink)' : 'var(--ink-3)'};border-radius:2px;margin-left:6px"></span>` : ''; };
    $('#tx-tab').innerHTML = `<thead><tr><th>County</th>${N ? '<th class="r">Registered</th>' : ''}${SY.map(y => `<th class="r">${y}</th>`).join('')}${has26 && base ? `<th class="r">2026 vs ${base}</th>` : ''}${N ? `<th aria-label="${lastY} votes, to scale"></th>` : ''}</tr></thead><tbody>${
      [...keys, ...totals].map((k, i) => `<tr${k === 'TARRANT' ? ' style="font-weight:600"' : ''}${i === keys.length ? ' style="border-top:2px solid var(--grid)"' : ''}><td style="white-space:nowrap;overflow-wrap:normal">${CNAME(k)}</td>${N ? `<td class="r num" style="color:var(--ink-2)">${regOf(k) ? fmtN(regOf(k)) : '—'}</td>` : ''}${SY.map(y => `<td class="r num">${cell(y, k)}</td>`).join('')}${has26 && base ? `<td class="r num">${chg(k)}</td>` : ''}${N ? `<td style="min-width:96px">${bar(k)}</td>` : ''}</tr>`).join('')}</tbody>`;
  }
  if (SY.length) {
    $('#tx-sec').hidden = false;
    const r0 = nS ? sRow(2026, nS) : null;
    // the state posts its county counts about a day after the county does, so this section can trail the rest of the page
    if (n && nS && nS < n) $('#tx-sec .sub').insertAdjacentHTML('beforeend', ` <b>The state’s figures run about a day behind the county’s: ${nS ? `this section is through Day ${nS}` : '2026 appears once the state posts its first daily count'}, while the rest of this page is through Day ${n}.</b>`);
    $('#tx-h').textContent = r0
      ? `Tarrant against Texas: ${pc1(share(r0.c.TARRANT))} of Tarrant voters have voted early in person, against ${pc1(restSh(r0))} ${r0.rep ? 'in the Texas counties that have reported' : 'in the rest of the state'}`
      : 'Tarrant against Texas in past elections';
    if (NB) {
      const part = SY.filter(y => S[y].partial);
      $('#tx-seg').hidden = false; $('#tx-big').textContent = `${NB} largest counties${part.length ? ` (adds ${part.join(', ')})` : ''}`;
      const setTx = k => { txB = k; $('#tx-all').setAttribute('aria-pressed', k === 'TOTAL'); $('#tx-big').setAttribute('aria-pressed', k === 'BASIS'); txText(); drawTx(); };
      $('#tx-all').onclick = () => setTx('TOTAL'); $('#tx-big').onclick = () => setTx('BASIS');
    }
    txText();
    const part = SY.filter(y => S[y].partial);
    const txFoot = () => $('#tx-foot').innerHTML = (ttMode === 'n'
      ? `In-person early votes cast through the chosen day, next to each county’s registered voters (the newest count available), with bars drawn to scale for the latest year shown.`
      : `Share of registered voters who have voted early in person through the chosen day.`) + ` Source: Texas Secretary of State, early voting by county. “Rest of Texas” is every other county combined.` +
      (S[2026] && S[2026].screened ? ' In 2026 many counties report to the state late or only in part, so a county is left out of a day’s comparison when its count is missing or less than half the typical county’s pace against its own 2022 count; the 2022 and 2024 comparisons for that day use the same counties, and the Texas row stays blank until every county has reported.' : '') +
      (part.length ? ` In ${part.join(', ')} the state reported only its ${NB} largest counties, so there is no statewide figure for that year; the “${NB} largest counties” comparison uses those same counties in every year.` : '');
    txFoot();
    const dsel = $('#tx-day'), dflt = nS || 12;
    dsel.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}"${i + 1 === dflt ? ' selected' : ''}>${i + 1}</option>`).join('');
    dsel.onchange = () => txTable(+dsel.value); txTable(dflt);
    const setTt = k => { ttMode = k; $('#tt-p').setAttribute('aria-pressed', k === 'p'); $('#tt-n').setAttribute('aria-pressed', k === 'n');
      txTable(+dsel.value); txFoot(); };
    $('#tt-p').onclick = () => setTt('p'); $('#tt-n').onclick = () => setTt('n');
    $('#tt-all').onchange = () => { $('#tt-q').hidden = !$('#tt-all').checked; txTable(+dsel.value); };
    $('#tt-q').oninput = () => txTable(+dsel.value);
  }


  // ---------- early voting sites through the years
  const SP = D.sites || {}, CS = C.sites || null;
  const ST = { ...Object.fromEntries(Object.entries(SP).map(([y, v]) => [+y, v])), ...(CS ? { 2026: CS } : {}) };
  const STY = Object.keys(ST).map(Number).sort((a, b) => a - b);
  const nSite = CS ? Object.values(CS)[0].length : 0;
  let stMode = CS ? 'n' : 'p', stSort = { k: 'base', dir: -1 }, stOpen = false;
  function siteTable() {
    const d = +$('#st-day').value, base = +$('#st-base').value, last = STY.at(-1), showAll = $('#st-all').checked;
    const upTo = (y, nm) => { const a = ST[y][nm]; if (!a || (y === 2026 && d > nSite)) return null; return a.slice(0, Math.min(d, a.length)).reduce((x, v) => x + v, 0); };
    const cTot = {}; STY.forEach(y => { cTot[y] = y === 2026 && d > nSite ? null : Object.values(ST[y]).reduce((t, a) => t + a.slice(0, d).reduce((x, v) => x + v, 0), 0); });
    const val = (y, nm) => { const v = upTo(y, nm); return v == null ? null : stMode === 'n' ? v : v / cTot[y]; };
    const names = [...new Set(STY.flatMap(y => Object.keys(ST[y])))];
    const used = nm => STY.filter(y => ST[y][nm]).length;
    const rows = names.filter(nm => showAll || used(nm) >= 2).map(nm => {
      const v = Object.fromEntries(STY.map(y => [y, val(y, nm)])); const a = v[last], b = v[base];
      const ch = a != null && b != null && b > 0 && last !== base ? (stMode === 'n' ? a / b - 1 : (a - b) * 100) : null;
      return { nm, v, ch, n: used(nm) };
    });
    const key = r => stSort.k === 'name' ? r.nm : stSort.k === 'base' ? (r.ch ?? -1e9) : (r.v[stSort.k] ?? -1);
    rows.sort((a, b) => { const x = key(a), y = key(b); return (typeof x === 'string' ? x.localeCompare(y) : x - y) * stSort.dir; });
    const fmt = v => v == null ? '<span style="color:var(--ink-3)">—</span>' : stMode === 'n' ? fmtN(v) : (v * 100).toFixed(1) + '%';
    const chTxt = c => c == null ? '' : stMode === 'n' ? `${c >= 0 ? '+' : '−'}${Math.abs(c * 100).toFixed(0)}%` : `${c >= 0 ? '+' : '−'}${Math.abs(c).toFixed(1)} pts`;
    const spark = r => { const vals = STY.map(y => r.v[y]), mx = Math.max(...vals.map(v => v || 0)) || 1, bw = 7;
      return `<svg width="${STY.length * (bw + 2)}" height="18" aria-hidden="true" style="vertical-align:middle">${vals.map((v, i) => v == null ? '' : `<rect x="${i * (bw + 2)}" y="${18 - Math.max(1, v / mx * 18)}" width="${bw}" height="${Math.max(1, v / mx * 18)}" fill="${y2c(STY[i])}" rx="1"/>`).join('')}</svg>`; };
    function y2c(y) { return y === 2024 ? 'url(#hatch24s)' : COL[y]; }
    const arrow = k => stSort.k === k ? (stSort.dir < 0 ? ' ↓' : ' ↑') : '';
    const narrow = app.clientWidth < 560, COLS = narrow && last !== base ? [base, last] : STY;   // phones: just the two years being compared
    $('#site-tab').innerHTML = `<thead><tr><th data-k="name" style="cursor:pointer">Site${arrow('name')}</th>${COLS.map(y => `<th class="r" data-k="${y}" style="cursor:pointer">${y}${arrow(String(y))}</th>`).join('')}${narrow ? '' : '<th aria-label="Trend"></th>'}${last !== base ? `<th class="r" data-k="base" style="cursor:pointer">${last} vs ${base}${arrow('base')}</th>` : ''}</tr></thead><tbody>${
      rows.slice(0, stOpen ? rows.length : 15).map(r => `<tr><td style="min-width:${narrow ? 130 : 170}px;overflow-wrap:normal">${esc(r.nm)}</td>${COLS.map(y => `<td class="r num">${fmt(r.v[y])}</td>`).join('')}${narrow ? '' : `<td>${spark(r)}</td>`}${last !== base ? `<td class="r num"${r.ch != null ? ` style="color:${r.ch >= 0 ? 'var(--ink)' : 'var(--ink-3)'}"` : ''}>${chTxt(r.ch)}</td>` : ''}</tr>`).join('')}
      <tr style="border-top:2px solid var(--grid)"><td><b>All sites</b></td>${COLS.map(y => `<td class="r num"><b>${cTot[y] == null ? '—' : stMode === 'n' ? fmtN(cTot[y]) : '100%'}</b></td>`).join('')}${narrow ? '' : '<td></td>'}${last !== base ? `<td class="r num">${stMode === 'n' && cTot[base] && cTot[last] != null ? chTxt(cTot[last] / cTot[base] - 1) : ''}</td>` : ''}</tr></tbody>`;
    const more = $('#st-more'); more.hidden = rows.length <= 15; more.textContent = stOpen ? 'Show fewer sites' : `Show all ${rows.length} sites`; more.onclick = () => { stOpen = !stOpen; siteTable(); };
    $('#site-tab').querySelectorAll('th[data-k]').forEach(th => th.onclick = () => { const k = th.dataset.k; stSort = { k, dir: stSort.k === k ? -stSort.dir : (k === 'name' ? 1 : -1) }; siteTable(); });
    // summary sentence
    const both = rows.filter(r => r.v[last] != null && r.v[base] != null && last !== base);
    if (both.length) {
      const up = both.filter(r => (stMode === 'n' ? r.v[last] / r.v[base] - 1 : r.v[last] - r.v[base]) >= 0).length;
      // gains and drops: leave out sites with a tiny base, where a few hundred votes read as a huge percentage
      const big = both.filter(r => stMode === 'p' || (upTo(base, r.nm) || 0) >= 250 * d);
      const byCh = [...big].sort((a, b) => b.ch - a.ch), drops = byCh.filter(r => r.ch < 0).reverse().slice(0, 3);
      const nm = r => `${esc(r.nm)} (${chTxt(r.ch)})`;
      $('#site-call').innerHTML = `Through Day ${d}, <b>${up} of ${both.length}</b> sites used in both ${base} and ${last} drew ${stMode === 'n' ? 'more early voters' : 'a bigger share of the county’s early vote'} in ${last}.` +
        (byCh.length ? ` Biggest gains${stMode === 'n' ? ' among the busier sites' : ''}: ${byCh.filter(r => r.ch >= 0).slice(0, 3).map(nm).join(', ')}.` : '') +
        (drops.length ? ` ${drops.length === 1 ? 'Only drop' : 'Biggest drops'}: ${drops.map(nm).join(', ')}.` : byCh.length ? ` Smallest gains: ${byCh.slice(-3).reverse().map(nm).join(', ')}.` : '');
    } else $('#site-call').textContent = '';
  }
  if (STY.length >= 2) {
    $('#site-sec').hidden = false;
    $('#site-h').textContent = CS ? `Early voting sites: Day ${nSite} against the same sites in past elections` : 'Early voting sites: how turnout changed at the same locations';
    const cnt = y => Object.keys(ST[y]).length, past = STY.filter(y => y !== 2026);
    const every = Object.keys(ST[past[0]]).filter(nm => past.every(y => ST[y][nm])).length;
    $('#site-sub').textContent = `In-person early votes at each voting location, added up through the chosen day. The county used ${STY.map(y => `${cnt(y)} sites in ${y}`).join(', ')}; ${every} were used in every one of ${past.join(', ')}. Click a column heading to sort.`;
    $('#st-day').innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}"${i + 1 === (nSite || 12) ? ' selected' : ''}>${i + 1}</option>`).join('');
    const bases = STY.slice(0, -1);
    $('#st-base').innerHTML = bases.map(y => `<option value="${y}"${y === (CS ? 2022 : bases.at(-1)) ? ' selected' : ''}>${y}</option>`).join('');
    $('#st-n').setAttribute('aria-pressed', stMode === 'n'); $('#st-p').setAttribute('aria-pressed', stMode === 'p');
    const setSt = k => { stMode = k; $('#st-n').setAttribute('aria-pressed', k === 'n'); $('#st-p').setAttribute('aria-pressed', k === 'p'); siteTable(); };
    $('#st-n').onclick = () => setSt('n'); $('#st-p').onclick = () => setSt('p');
    ['#st-day', '#st-base', '#st-all'].forEach(q => $(q).onchange = siteTable);
    document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><pattern id="hatch24s" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="4" fill="var(--surface)"/><rect width="2" height="4" fill="${COL[2024]}"/></pattern></defs></svg>`);
    siteTable();
  }


  // ---------- primary history (D / neither / R) of each early-voting day's voters, as 100% bars building to Election Day
  let dlMode = 'day';
  function drawLean() {
    const NE = D.current.who.neither, B = D.current.who.base, box = $('#dl'); $('#dl-wrap').hidden = false;
    const evs = D.ev_days_2026, cum = dlMode === 'cum';
    const src = cum ? (NE.series || []).filter(r => r[3] && evs.includes(r[0])).map(r => [r[0], r[1], r[3][0], r[3][1], r[3][2]]) : (NE.daily || []).filter(r => evs.includes(r[0]));
    const byDay = {}; src.forEach(r => { byDay[evs.indexOf(r[0]) + 1] = r; });
    const slots = evs.map((d, i) => ({ lab: `Day ${i + 1}`, sm: String(i + 1), sub: dlab(d), r: byDay[i + 1] }));
    slots.push({ lab: 'Election Day', sm: 'ED', sub: dlab(D.current.election), r: null, gap: true });
    [['All 2022 voters', '2022'], ['All 2024 voters', '2024']].forEach(([k, sm], i) => { const p = B[k]; if (p) slots.push({ lab: k, sm, sub: 'all voters', r: [null, p.n, p.lean[0], p.lean[1], p.lean[2]], ref: true, gap: i === 0 }); });
    const done = src.at(-1), dn = done ? evs.indexOf(done[0]) + 1 : 0;
    const pct = (r, i) => r[i] / ((r[2] + r[3] + r[4]) || 1), mg = r => { const g = (pct(r, 2) - pct(r, 3)) * 100; return `${g >= 0 ? 'D' : 'R'}+${Math.abs(g).toFixed(1)}`; };
    if (done) {
      const prev = byDay[dn - 1];
      $('#dl-h').textContent = cum
        ? `After ${dn} day${dn > 1 ? 's' : ''}: ${Math.round(pct(done, 2) * 100)}% of all 2026 voters so far chose a Democratic primary last, ${Math.round(pct(done, 4) * 100)}% neither, ${Math.round(pct(done, 3) * 100)}% Republican (${mg(done)})`
        : `Day ${dn} (${dlab(done[0])}): ${Math.round(pct(done, 2) * 100)}% of the day’s in-person voters chose a Democratic primary last, ${Math.round(pct(done, 4) * 100)}% neither, ${Math.round(pct(done, 3) * 100)}% Republican (${mg(done)}${prev ? `, against ${mg(prev)} on Day ${dn - 1}` : ''})`;
    }
    $('#dl-sub').textContent = cum
      ? 'Everyone who has voted so far after each day of early voting, mail ballots included, by the most recent party primary they voted in.'
      : 'The voters who voted in person on each day of early voting (new names on that day’s county list), by the most recent party primary they voted in. Mail ballots are left out here.';
    const W = box.clientWidth, seg = (v, col, fg) => ({ v, col, fg });
    const parts = r => [seg(pct(r, 2), 'var(--dem)', '#fff'), seg(pct(r, 4), 'var(--grid)', 'var(--ink)'), seg(pct(r, 3), 'var(--rep)', '#fff')];
    const tipTxt = s => s.r ? `${s.lab}${s.ref ? '' : ` (${s.sub})`}: ${fmtN(s.r[2] + s.r[3] + s.r[4])} voters · D ${pc1(pct(s.r, 2))} · Neither ${pc1(pct(s.r, 4))} · R ${pc1(pct(s.r, 3))} · ${mg(s.r)}` : `${s.lab}: still to come`;
    if (W >= 600) {           // columns, left to right toward Election Day
      const H = 300, m = { l: 38, r: 4, t: 22, b: 40 }, gaps = slots.filter(x => x.gap).length;
      const gw = (W - m.l - m.r) / (slots.length + gaps * 0.6), bw = Math.min(46, gw * 0.78), ch = H - m.t - m.b;
      let x = m.l, out = '';
      slots.forEach(sl => { if (sl.gap) x += gw * 0.6; const cx = x + gw / 2, x0 = cx - bw / 2;
        if (!sl.r) out += `<rect x="${x0}" y="${m.t}" width="${bw}" height="${ch}" fill="none" stroke="var(--grid)" stroke-dasharray="3 3"><title>${esc(tipTxt(sl))}</title></rect>`;
        else { let y = m.t + ch; out += `<g opacity="${sl.ref ? 0.75 : 1}"><title>${esc(tipTxt(sl))}</title>` + parts(sl.r).map(p => { const h = p.v * ch; y -= h;
            return `<rect x="${x0}" y="${y.toFixed(1)}" width="${bw}" height="${Math.max(0, h).toFixed(1)}" fill="${p.col}"/>` + (h >= 15 && bw >= 24 ? `<text x="${cx}" y="${(y + h / 2 + 4).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${p.fg}" class="num">${Math.round(p.v * 100)}</text>` : ''); }).join('') + '</g>';
          out += `<text x="${cx}" y="${m.t - 7}" text-anchor="middle" font-size="10" fill="var(--ink-2)" class="num">${mg(sl.r)}</text>`; }
        out += `<text x="${cx}" y="${H - 22}" text-anchor="middle" font-size="11" fill="${sl.r || sl.ref ? 'var(--ink-2)' : 'var(--ink-3)'}">${bw >= 34 && !sl.ref ? sl.lab.replace('Election Day', 'E-Day') : sl.sm}</text>`;
        if (!sl.ref) out += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="9.5" fill="var(--ink-3)">${sl.sub.slice(4)}</text>`;
        else out += `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="9.5" fill="var(--ink-3)">all</text>`;
        x += gw; });
      out += [0, .5, 1].map(v => `<text x="${m.l - 6}" y="${(m.t + (1 - v) * ch + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--ink-3)" class="num">${v * 100}%</text>`).join('');
      box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Primary history of each early-voting day's voters, as shares adding to 100%">${out}</svg>`;
    } else {                  // phones: one row per day, top to bottom toward Election Day
      box.innerHTML = `<div class="sizebar">${slots.map(sl => `<div class="sb-row" style="margin:${sl.gap ? '14px' : '4px'} 0 4px" title="${esc(tipTxt(sl))}"><div class="sb-label"><b>${esc(sl.lab)}${sl.ref ? '' : ` <small style="font-weight:400;color:var(--ink-3)">${sl.sub}</small>`}</b><span class="num">${sl.r ? `${fmtN(sl.r[2] + sl.r[3] + sl.r[4])} · ${mg(sl.r)}` : ''}</span></div>
        <div class="sb-track" style="height:20px;${sl.r ? '' : 'background:none;border:1px dashed var(--grid)'}${sl.ref ? ';opacity:.75' : ''}">${sl.r ? parts(sl.r).map(p => p.v > 0 ? `<div class="sb-seg" style="flex:${p.v} 1 0;background:${p.col};color:${p.fg}">${p.v >= .12 ? Math.round(p.v * 100) + '%' : ''}</div>` : '').join('') : ''}</div></div>`).join('')}</div>`;
    }
  }
  const setDl = k => { dlMode = k; $('#dl-day').setAttribute('aria-pressed', k === 'day'); $('#dl-cum').setAttribute('aria-pressed', k === 'cum'); drawLean(); };
  $('#dl-day').onclick = () => setDl('day'); $('#dl-cum').onclick = () => setDl('cum');

  // "what if" sliders: how the votes cast so far would add up under the reader's own assumptions about crossover and the Neither break
  const scenarioHtml = (lean, o) => {
    if (!lean || lean.length !== 3 || lean.some(v => v == null) || lean[0] + lean[1] + lean[2] < 100) return '';
    const id = 'sc' + Math.random().toString(36).slice(2, 7);
    const sl = (k, lab, v, min) => `<label style="display:block;margin:10px 0 2px"><span style="display:flex;justify-content:space-between;gap:8px"><span>${lab}</span><b class="num" data-scv="${k}">${v}%</b></span>
      <input type="range" min="${min}" max="100" step="1" value="${v}" data-sck="${k}" style="width:100%;accent-color:var(--ink)" aria-label="${lab}"></label>`;
    return `<div class="panel" id="${id}" data-sc="${lean.join(',')}" style="margin-top:18px">
      <h3 style="margin-top:0">What if? Add up the votes cast so far your way</h3>
      <p class="note" style="margin-top:0">Move the sliders to set how each group votes${o && o.where ? ' ' + o.where : ''}. Every voter is grouped by the most recent party primary they chose since 2022. This counts only ballots already cast${o && o.through ? `, through ${o.through}` : ''}. It is not a forecast, and it is not how anyone actually voted: ballots are secret.</p>
      ${sl('d', 'Democratic primary voters who vote Democratic', 95, 50)}
      ${sl('r', 'Republican primary voters who vote Republican', 95, 50)}
      ${sl('n', 'Voters with neither primary who vote Democratic', 50, 0)}
      <div data-sco style="margin-top:14px"></div>
      <p class="note"><button type="button" data-screset style="font:inherit;cursor:pointer;background:none;border:0;padding:0;text-decoration:underline;color:inherit">Reset</button> · Third-party and write-in votes are left out.</p></div>`;
  };
  const scenarioDraw = box => {
    const [D, R, N] = box.dataset.sc.split(',').map(Number), v = k => +box.querySelector(`[data-sck="${k}"]`).value / 100;
    const a = v('d'), b = v('r'), c = v('n'), dv = D * a + R * (1 - b) + N * c, rv = D * (1 - a) + R * b + N * (1 - c), t = dv + rv || 1;
    box.querySelectorAll('[data-sck]').forEach(i => { box.querySelector(`[data-scv="${i.dataset.sck}"]`).textContent = i.value + '%'; });
    const f = x => Math.round(x).toLocaleString('en-US'), m = (dv - rv) / t * 100, lead = dv >= rv ? 'D' : 'R';
    box.querySelector('[data-sco]').innerHTML = `<div class="sb-track" style="height:26px"><div class="sb-seg" style="flex:${dv / t} 1 0;background:var(--dem);color:#fff">D ${(dv / t * 100).toFixed(1)}%</div><div class="sb-seg" style="flex:${rv / t} 1 0;background:var(--rep);color:#fff">R ${(rv / t * 100).toFixed(1)}%</div></div>
      <p style="margin:8px 0 0"><b>${Math.abs(m) < 0.05 ? 'Dead even' : `${lead}+${Math.abs(m).toFixed(1)}`}</b>${Math.abs(m) < 0.05 ? '' : `, a lead of <b class="num">${f(Math.abs(dv - rv))}</b> votes`}: about <span class="num">${f(dv)}</span> Democratic to <span class="num">${f(rv)}</span> Republican, out of <span class="num">${f(D + R + N)}</span> voters so far.</p>`;
  };
  document.addEventListener('input', e => { const i = e.target; if (!i.dataset || !i.dataset.sck) return; scenarioDraw(i.closest('[data-sc]')); });
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-screset]'); if (!b) return; const box = b.closest('[data-sc]');
    box.querySelectorAll('[data-sck]').forEach(i => { i.value = i.dataset.sck === 'n' ? 50 : 95; }); scenarioDraw(box); });
  const scenarioInit = () => document.querySelectorAll('[data-sc]').forEach(scenarioDraw);
  setTimeout(scenarioInit, 0);
  // who voted, by age, sex and estimated race: all voters so far, or one early-voting day (in person) or mail ballots alone
  const demoDayHtml = (SF, G, bands, o) => {
    if (!SF || !SF.age || !SF.sex || !G || !G.age || !G.sex || !bands) return '';
    const z = v => v == null ? 0 : v, T = a => (a || []).reduce((s, v) => s + z(v), 0) || 1;
    const fN = v => Math.round(v).toLocaleString('en-US'), p0 = (a, b) => b && a != null ? Math.round(a / b * 100) + '%' : '—';
    const r10 = v => v == null || v < 10 ? '<10' : (Math.round(v / 10) * 10).toLocaleString('en-US');
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dlb = i => { const d = new Date((SF.day1 || '2026-10-19') + 'T12:00:00'); d.setDate(d.getDate() + i); return `${WD[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`; };
    const rc = !!(SF.race && G.race), RL = ['Hispanic', 'White', 'Black', 'Asian or Pacific Islander', 'Other or multiracial'];
    const groups = [['Age on Election Day', 'age', bands], ['Sex, as recorded', 'sex', ['Women', 'Men', 'Not recorded']]].concat(rc ? [['Race and ethnicity, estimated', 'race', RL]] : []);
    const view = (V, all) => {          // V: {age, sex, race} for the voters shown
      const grp = l => `<tr><th colspan="${all ? 5 : 5}" style="text-align:left;padding-top:12px">${l}</th></tr>`;
      const body = groups.map(([h, k, labs]) => !V[k] ? '' : grp(h) + labs.map((l, i) => { const v = V[k][i], g = G[k][i], est = k === 'race';
        return `<tr><td style="overflow-wrap:normal">${l}</td><td class="r num">${est ? r10(v) : v == null ? '<10' : fN(v)}</td><td class="r num">${p0(v, T(V[k]))}</td>`
          + (all ? `<td class="r num">${p0(g, T(G[k]))}</td><td class="r num">${g && v != null ? p0(v, g) : '—'}</td>` : `<td class="r num">${p0(SF[k][i], T(SF[k]))}</td><td class="r num">${p0(g, T(G[k]))}</td>`) + '</tr>'; }).join('')).join('');
      const head = all ? '<th class="r">Voted so far</th><th class="r">Share of voters</th><th class="r">Share of active voters</th><th class="r">Turnout so far</th>'
                       : '<th class="r">Voters</th><th class="r">Share of these voters</th><th class="r">Share of all voters so far</th><th class="r">Share of active voters</th>';
      return `<div style="overflow-x:auto"><table class="ntab race-tab" style="white-space:nowrap"><thead><tr><th>Group</th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    };
    const DD = SF.dd, n = DD && DD.age ? DD.age.length - 1 : 0, pick = i => ({ age: DD.age[i], sex: DD.sex[i], race: DD.race && DD.race[i] });
    const opts = [['all', 'All voters so far', view(SF, true)]];
    for (let i = n; i >= 1; i--) if (T(DD.age[i]) > 1) opts.push([String(i), `Day ${i}, ${dlb(i - 1)}: in person`, view(pick(i), false)]);
    if (n && T(DD.age[0]) > 1) opts.push(['0', 'Mail ballots', view(pick(0), false)]);
    const id = 'dm' + Math.random().toString(36).slice(2, 7);
    return `<h3 style="margin:22px 0 4px">${o.title}</h3>
      ${opts.length > 1 ? `<label class="note" style="display:block;margin:4px 0 8px">Show <select id="${id}" data-dm="${id}" style="font:inherit;margin-left:4px">${opts.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>` : ''}
      ${opts.map(([k, , h], i) => `<div data-dmv="${id}" data-k="${k}"${i ? ' hidden' : ''}>${h}</div>`).join('')}
      <p class="note">“All voters so far” compares each group’s share of the voters with its share of active voters: a group whose share of voters is bigger is turning out ahead of the rest. Pick a day to see only the people who voted in person that day, next to the share among all voters so far.${rc ? ' Race and ethnicity are estimates, rounded to the nearest 10.' : ''} Counts under 10 are withheld.${o.note || ''}</p>`;
  };
  document.addEventListener('change', e => { const s = e.target; if (!s.dataset || !s.dataset.dm) return;
    document.querySelectorAll(`[data-dmv="${s.dataset.dm}"]`).forEach(d => { d.hidden = d.dataset.k !== s.value; }); });
  // ---------- "neither" share of 2026 voters, day by day, against past electorates
  function drawNei() {
    const NE = D.current.who.neither, box = $('#nei'); $('#nei-wrap').hidden = false;
    const evs = D.ev_days_2026, pts = NE.series.filter(([d]) => evs.includes(d)).map(([d, n, v]) => ({ x: evs.indexOf(d) + 1, v, n, d }));
    const last = NE.series.at(-1), refs = Object.entries(NE.ref);
    $('#nei-h').textContent = `${pc1(last[2])} of 2026 voters so far have no primary on record, against ${pc1(NE.ref['All 2022 voters'])} of all 2022 voters and ${pc1(NE.ref['All 2024 voters'])} of all 2024 voters`;
    const W = box.clientWidth, H = Math.max(200, Math.min(260, W * 0.42)), m = { l: 40, r: 10, t: 12, b: 30 };
    const max = Math.max(0.6, ...refs.map(([, v]) => v + 0.05)), x = d => m.l + (d - 1) / 11 * (W - m.l - m.r), yy = v => m.t + (1 - v / max) * (H - m.t - m.b);
    const short = k => W < 520 ? k.replace('early and mail voters', 'early+mail').replace('All ', 'all ') : k;
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.x).toFixed(1)},${yy(p.v).toFixed(1)}`).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of 2026 voters with no primary history, by day of early voting, against past electorates">
      ${[0, .2, .4, .6].filter(v => v <= max).map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${yy(v)}" y2="${yy(v)}" stroke="var(--grid)"/><text x="${m.l - 6}" y="${yy(v) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)" class="num">${v * 100}%</text>`).join('')}
      ${refs.map(([k, v]) => `<line x1="${m.l}" x2="${W - m.r}" y1="${yy(v)}" y2="${yy(v)}" stroke="${/2024/.test(k) ? COL[2024] : COL[2022]}" stroke-width="1.5" stroke-dasharray="4 4"/><text x="${W - m.r}" y="${yy(v) - 4}" text-anchor="end" font-size="11" fill="var(--ink-2)">${short(k)} <tspan class="num">${pc1(v)}</tspan></text>`).join('')}
      ${[1, 3, 5, 7, 9, 12].map(d => `<text x="${x(d)}" y="${H - 10}" text-anchor="${d === 1 ? 'start' : d === 12 ? 'end' : 'middle'}" font-size="11" fill="var(--ink-3)">Day ${d}</text>`).join('')}
      <path d="${path}" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
      ${pts.map(p => `<circle cx="${x(p.x)}" cy="${yy(p.v)}" r="4" fill="var(--ink)" stroke="var(--surface)" stroke-width="2"><title>Day ${p.x} (${dlab(p.d)}): ${pc1(p.v)} of ${fmtN(p.n)} voters</title></circle>`).join('')}
      ${pts.length ? `<text x="${x(pts.at(-1).x)}" y="${yy(pts.at(-1).v) - 10}" text-anchor="middle" font-size="12" font-weight="600" fill="var(--ink)" class="num">2026 ${pc1(pts.at(-1).v)}</text>` : ''}
    </svg>`;
  }

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
    ].map(([l, v, rv]) => `<li><span>${l} <small>all registered: ${pc1(rv / REG.n)}</small></span><span>${pc1(v / WA.n)}</span></li>`).join('') +
      `<li class="kv-h"><span><b>How they voted</b></span><span></span></li>` +
      kinds.map(k => `<li><span>${k === 'mail' ? 'Mail ballots' : 'Early in person'}</span><span>${fmtN(W.rosters[k].voters)}</span></li>`).join('');
    // primary history: secondary, with its caveat
    const row = (lab, p) => { const t = p.n || 1, seg = (v, col, txt) => v > 0 ? `<div class="sb-seg" style="flex:${v / t} 1 0;background:${col};color:${col === 'var(--grid)' ? 'var(--ink)' : '#fff'}">${v / t >= .12 ? txt + ' ' + Math.round(v / t * 100) + '%' : ''}</div>` : '';
      return `<div class="sb-row"><div class="sb-label"><b>${esc(lab)}</b><span class="num">${fmtN(p.n)} · ${gtxt(gap(p))}</span></div><div class="sb-track" style="height:22px">${seg(p.lean[0], 'var(--dem)', 'D')}${seg(p.lean[2], 'var(--grid)', 'Neither')}${seg(p.lean[1], 'var(--rep)', 'R')}</div></div>`; };
    $('#who').innerHTML = `<p class="note" style="margin:0">By primary history: the most recent party primary each voter chose since 2022. A primary ballot is not a November vote, and the large 2026 Democratic primary makes every 2026 group look more Democratic on this measure.</p>` +
      row('2026 so far', WA) + kinds.filter(() => kinds.length > 1).map(k => row(`2026 ${k === 'mail' ? 'mail' : 'early in person'}`, W.rosters[k])).join('') +
      Object.entries(B).filter(([, p]) => p).map(([k, p]) => row(k, p)).join('');
    if (WA.bloc && REG.bloc && WA.bloc.length === 16) {
      const BL = [['Democratic primaries only'], ['D1', 'Voted in 1'], ['D2', 'Voted in 2'], ['D3', 'Voted in 3'], ['D4', 'Voted in 4'], ['D5', 'Voted in all 5'],
        ['Republican primaries only'], ['R1', 'Voted in 1'], ['R2', 'Voted in 2'], ['R3', 'Voted in 3'], ['R4', 'Voted in 4'], ['R5', 'Voted in all 5'],
        ['Both parties’ primaries'], ['MIXD', 'Most recent: Democratic'], ['MIXR', 'Most recent: Republican'],
        ['Other voters'], ['GEN', 'No primaries; voted in a midterm November'],
        ['PRES1', 'No primaries; one presidential November only'], ['PRES2', 'No primaries; both presidential Novembers only'], ['NONE', 'No vote on record, 2018 to 2026']];
      const KEYS = ['D1', 'D2', 'D3', 'D4', 'D5', 'R1', 'R2', 'R3', 'R4', 'R5', 'MIXD', 'MIXR', 'PRES1', 'PRES2', 'GEN', 'NONE'];
      const at = k => KEYS.indexOf(k), sumK = (p, ks) => ks.reduce((t, k) => t + p.bloc[at(k)], 0);
      const row = (lab, ks, strong) => { const w = sumK(WA, ks), r = sumK(REG, ks);
        return `<tr${strong ? ' style="font-weight:600"' : ''}><td style="${strong ? '' : 'padding-left:14px;'}white-space:nowrap">${lab}</td><td class="r num">${fmtN(r)}</td><td class="r num">${fmtN(w)}</td><td class="r num">${pc1(w / WA.n)}</td><td class="r num">${pc1(r / REG.n)}</td><td class="r num">${r ? pc1(w / r) : '—'}</td></tr>`; };
      const groups = { 'Democratic primaries only': ['D1', 'D2', 'D3', 'D4', 'D5'], 'Republican primaries only': ['R1', 'R2', 'R3', 'R4', 'R5'], 'Both parties’ primaries': ['MIXD', 'MIXR'] };
      $('#bloc').innerHTML = `<thead><tr><th>Group</th><th class="r">Registered</th><th class="r">Voted</th><th class="r">Of voters</th><th class="r">Of registered</th><th class="r">Turnout so far</th></tr></thead><tbody>${
        BL.map(([a, b]) => b ? row(b, [a]) : groups[a] ? row(a, groups[a], true) : `<tr><td colspan="6" style="font-weight:600;padding-top:12px">${a}</td></tr>`).join('')}
        <tr style="border-top:2px solid var(--grid);font-weight:600"><td>Everyone</td><td class="r num">${fmtN(REG.n)}</td><td class="r num">${fmtN(WA.n)}</td><td class="r num">100%</td><td class="r num">100%</td><td class="r num">${pc1(WA.n / REG.n)}</td></tr></tbody>`;
      // pie charts: the five big groups, for those who have voted so far and for all registered voters
      const BIG = [['Democratic primaries only', ['D1', 'D2', 'D3', 'D4', 'D5'], 'var(--dem)'],
        ['Republican primaries only', ['R1', 'R2', 'R3', 'R4', 'R5'], 'var(--rep)'],
        ['Both parties’ primaries', ['MIXD', 'MIXR'], 'color-mix(in srgb, var(--dem) 50%, var(--rep))'],
        ['Novembers only, no primaries', ['GEN', 'PRES1', 'PRES2'], 'var(--ink-3)'],
        ['No vote on record', ['NONE'], 'color-mix(in srgb, var(--ink-3) 35%, var(--surface))']];
      const pie = (p, title, size) => { const tot = p.n, R0 = size / 2, r0 = R0 * 0.56; let a = -Math.PI / 2;
        const arcs = BIG.map(([l, ks, col]) => { const v = sumK(p, ks), da = v / tot * 2 * Math.PI; if (!v) return '';
          const a1 = a + Math.min(da, 2 * Math.PI - 1e-4), lg = da > Math.PI ? 1 : 0, P = (r, t) => `${(R0 + r * Math.cos(t)).toFixed(2)},${(R0 + r * Math.sin(t)).toFixed(2)}`;
          const d = `M${P(R0, a)} A${R0},${R0} 0 ${lg} 1 ${P(R0, a1)} L${P(r0, a1)} A${r0},${r0} 0 ${lg} 0 ${P(r0, a)} Z`; a = a1;
          return `<path d="${d}" fill="${col}" stroke="var(--surface)" stroke-width="1.5"><title>${l}: ${pc1(v / tot)}</title></path>`; }).join('');
        return `<figure style="margin:0;text-align:center"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${title} by voting history">${arcs}
          <text x="${R0}" y="${R0 - 2}" text-anchor="middle" font-size="12" fill="var(--ink-2)">${title.split(' ')[0]}</text><text x="${R0}" y="${R0 + 14}" text-anchor="middle" font-size="12" fill="var(--ink-2)">${title.split(' ').slice(1).join(' ')}</text></svg></figure>`; };
      $('#bloc-pies').innerHTML = pie(WA, 'Voted so far', 168) + pie(REG, 'All registered', 132) +
        `<ul class="kv" style="flex:1 1 260px;margin:0">${BIG.map(([l, ks, col]) => `<li><span><i class="sw" style="background:${col}"></i> ${l}</span><span><b class="num">${pc1(sumK(WA, ks) / WA.n)}</b> <small>of registered: ${pc1(sumK(REG, ks) / REG.n)}</small></span></li>`).join('')}</ul>`;
      $('#bloc-wrap').hidden = false;
    }
    if (W.neither && W.neither.series.length) drawNei();
    if (W.neither && (W.neither.daily || []).length) drawLean();
    $('#scen').innerHTML = scenarioHtml(WA.lean, { where: 'across Tarrant County', through: WA.through ? dlab(WA.through) : '' }); scenarioInit();
    if (W.demo) $('#demo-day').innerHTML = demoDayHtml(W.demo, W.demo.base, W.demo.age_bands, { title: 'Who has voted, day by day: age, sex and race', note: ' Measured against active registered voters plus anyone who has voted.' });
    $('#who-comm').innerHTML = `<thead><tr><th>Pct</th><th class="r">Voted</th><th class="r">Lean</th><th class="r">2022 early + mail</th></tr></thead><tbody>${['01', '02', '03', '04'].map(c => {
      const a = WA.comm[c], t = a[0] + a[1] + a[2], b = ref && ref.comm[c], tb = b ? b[0] + b[1] + b[2] : 0;
      return `<tr><td>${+c}</td><td class="r num">${fmtN(t)}</td><td class="r num">${t ? gtxt((a[0] - a[1]) / t * 100) : '—'}</td><td class="r num">${tb ? gtxt((b[0] - b[1]) / tb * 100) : '—'}</td></tr>`; }).join('')}</tbody>`;
  }

  const drawAll = () => { draw(); drawDays(); if (SY.length) drawTx(); if (STY.length >= 2) siteTable(); if (C.who && C.who.neither && C.who.neither.series.length) drawNei(); if (C.who && C.who.neither && (C.who.neither.daily || []).length) drawLean(); };
  drawAll();
  let rt; if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(drawAll, 80); }).observe(app);
})();
