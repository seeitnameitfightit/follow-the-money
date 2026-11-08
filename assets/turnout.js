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
  const EVDONE = n >= 12;
  const proj = (() => { if (!EVDONE) return null;          // final turnout implied by each past year's early share
    const r = Y.filter(y => y.rows && y.rows[11] && y.final_total).map(y => { const sh = y.rows[11].total / y.final_total; return { year: y.year, share: sh, final: y.final_total, reg: y.registered, est: last.total / sh }; });
    if (!r.length) return null; const lo = Math.min(...r.map(x => x.est)), hi = Math.max(...r.map(x => x.est));
    return { rows: r, lo, hi }; })();
  const F = EVDONE && D.final && D.final.ballots ? D.final : null;     // election-night (unofficial) results are in
  const pastEday = y => y.final_total - y.rows[11].total;                // cast after early voting closed: Election Day plus late mail
  if (F) {
    const y22_ = Y.find(x => x.year === 2022), y24_ = Y.find(x => x.year === 2024), es = last.total / F.ballots;
    const shares = Y.filter(y => y.rows && y.rows[11] && y.final_total).map(y => ({ year: y.year, share: y.rows[11].total / y.final_total }));
    const topPast = shares.reduce((a, b) => b.share > a.share ? b : a, { share: 0 });
    h1 = `The votes are in: ${fmtN(F.ballots)} Tarrant County ballots, ${pc1(F.ballots / C.registered)} of registered voters`;
    dek = `Unofficial election-night results; the official totals come with the county’s canvass. That’s <b class="num">${vs(F.ballots, y22_.final_total).replace('ahead of', 'more than').replace('behind', 'fewer than')}</b> the 2022 midterm (${fmtN(y22_.final_total)}, ${pc1(y22_.final_total / y22_.registered)} turnout) and ${vs(F.ballots, y24_.final_total).replace('ahead of', 'more than').replace('behind', 'fewer than')} the 2024 presidential election. <b class="num">${pc1(es)}</b> of the ballots were cast before Election Day${es > topPast.share ? `, more than in any of the last three elections (${shares.map(x => `${x.year} ${Math.round(x.share * 100)}%`).join(', ')})` : ''}, and only about <b class="num">${fmtN(Math.round((F.ballots - last.total) / 1000) * 1000)}</b> came in after early voting closed, against ${fmtN(pastEday(y22_))} in 2022.`;
  } else if (EVDONE) {
    const s22 = same(2022, n).total, s24 = same(2024, n).total;
    h1 = `Early voting is over: ${fmtN(last.total)} Tarrant County ballots, ${pc1(last.total / C.registered)} of registered voters`;
    dek = `That’s ${vs(last.total, s22)} the 2022 midterm’s early vote and ${vs(last.total, s24)} the 2024 presidential election’s.${proj ? ` If Election Day follows the pattern of 2018, 2022 or 2024, the final count would land between <b class="num">${fmtN(Math.round(proj.lo / 1000) * 1000)}</b> and <b class="num">${fmtN(Math.round(proj.hi / 1000) * 1000)}</b> votes, <b class="num">${pc1(proj.lo / C.registered)}</b> to <b class="num">${pc1(proj.hi / C.registered)}</b> of registered voters. Turnout was 47% in the 2022 midterm and 64% in 2024.` : ''}`;
  } else if (n) {
    const s22 = same(2022, n).total, s18 = same(2018, n).total, s24 = same(2024, n).total;
    h1 = `Day ${n}: ${fmtN(last.total)} Tarrant County voters have cast ballots, ${vs(last.total, s22)} the 2022 pace`;
    dek = `That’s <b class="num">${pc1(last.total / C.registered)}</b> of registered voters after ${n} day${n > 1 ? 's' : ''} of early voting. At the same point, 2018 had <b class="num">${fmtN(s18)}</b>, 2022 had <b class="num">${fmtN(s22)}</b> and the 2024 presidential election had <b class="num">${fmtN(s24)}</b>.`;
  } else {
    h1 = 'Early voting for the Nov 3 general election starts Monday, Oct 19';
    dek = `This page will track Tarrant County ballots each day of early voting against the last two midterms and the 2024 presidential election.${mailNow ? ` <b class="num">${fmtN(mailNow)}</b> mail ballots are already back.` : ''}`;
  }
  const y22 = Y.find(x => x.year === 2022), y18 = Y.find(x => x.year === 2018), y24 = Y.find(x => x.year === 2024);
  const tile = (v, l) => `<div><b class="num">${v}</b><span>${l}</span></div>`;
  const CR = F && F.county_races;
  const tiles = F ? [
    tile(fmtK(F.ballots), 'ballots cast (unofficial)'), tile(pc1(F.ballots / C.registered), `of registered voters (2022: ${pc1(y22.final_total / y22.registered)})`),
    tile(`${F.ballots >= y22.final_total ? '+' : '−'}${Math.abs(Math.round((F.ballots / y22.final_total - 1) * 100))}%`, 'votes compared with the 2022 midterm'),
    tile(pc1(last.total / F.ballots), `voted early or by mail (2024: ${Math.round(y24.rows[11].total / y24.final_total * 100)}%)`),
    tile(fmtK(F.ballots - last.total), `cast on Election Day or by late mail (2022: ${fmtK(pastEday(y22))})`),
    CR && CR.n ? tile(`${CR.dem} of ${CR.n}`, 'contested countywide races won by Democrats (unofficial)') : tile(fmtK(y22.final_total), 'total 2022 votes, for scale')
  ] : EVDONE ? [
    tile(fmtK(last.total), 'ballots cast early'), tile(pc1(last.total / C.registered), 'of registered voters'), tile(proj ? `${fmtK(proj.lo)}–${fmtK(proj.hi)}` : '—', 'projected final vote'),
    tile(fmtK(last.ev_cum), 'early votes in person'), tile(fmtK(last.mail_cum), 'mail ballots returned'), tile(fmtK(y22.final_total), 'total 2022 votes, for scale')
  ] : n ? [
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
    <div class="asof">${F ? 'Unofficial election-night results from Tarrant County Elections · early voting from the county’s daily reports' : `Tarrant County Elections daily reports${n ? ` · through ${dlab(last.date)}` : ''}`} · updated ${esc(D.updated)}</div></header>
  <section aria-label="Key numbers"><div class="stats">${tiles.join('')}</div></section>
  ${F && (F.races3 || []).length ? (() => {
    const two = T => { const d = T.cands.find(x => x[1] === 'DEM'), r = T.cands.find(x => x[1] === 'REP'); return { d, r, m: d && r ? (d[2] - r[2]) / ((d[2] + r[2]) || 1) * 100 : 0 }; };
    const row = T => { const t = T.total || 1, { d, r, m } = two(T), o = t - (d ? d[2] : 0) - (r ? r[2] : 0);
      const seg = (c, col, fg) => c && c[2] > 0 ? `<div class="sb-seg" style="flex:${c[2] / t} 1 0;background:${col};color:${fg}" title="${esc(c[0])}: ${fmtN(c[2])}">${c[2] / t >= .12 ? `${esc(c[0].split(' ').pop())} ${pc1(c[2] / t)}` : ''}</div>` : '';
      return `<div class="sb-row"><div class="sb-label"><b>${esc(T.contest)}</b><span class="num">${fmtN(T.total)} votes · ${m >= 0 ? 'D' : 'R'}+${Math.abs(m).toFixed(1)}</span></div>
        <div class="sb-track" style="height:24px">${seg(d, 'var(--dem)', '#fff')}${o > 0 ? `<div class="sb-seg" style="flex:${o / t} 1 0;background:var(--grid)" title="Others: ${fmtN(o)}"></div>` : ''}${seg(r, 'var(--rep)', '#fff')}</div>
        <div class="sb-key">${T.cands.filter(k => k[2] > 0).slice(0, 3).map(k => `<span>${k[1] === 'DEM' ? '<i class="dot d"></i>' : k[1] === 'REP' ? '<i class="dot r"></i>' : ''}${esc(k[0])} <b class="num">${fmtN(k[2])}</b></span>`).join('')}</div></div>`; };
    const RS = F.races3, cj = RS.find(x => x.contest === 'County Judge'), se = RS.find(x => x.contest === 'U.S. Senate'), go = RS.find(x => x.contest === 'Governor');
    let note = '';
    if (cj && se) { const a = two(cj), b = two(se), g = go ? two(go) : null;
      note = `${esc(se.cands.find(x => x[1] === 'DEM')[0].split(' ').pop())} ran <b class="num">${(b.m - a.m).toFixed(1)}</b> points ahead of ${esc(a.d[0].split(' ').pop())} on the margin${g ? ` and ${(b.m - g.m).toFixed(1)} ahead of ${esc(g.d[0].split(' ').pop())}` : ''}: <b class="num">${fmtN(b.d[2] - a.d[2])}</b> more votes than ${esc(a.d[0].split(' ').pop())}, while ${esc(b.r[0].split(' ').pop())} got <b class="num">${fmtN(a.r[2] - b.r[2])}</b> fewer than ${esc(a.r[0].split(' ').pop())}. That gap is ticket-splitting: voters who backed the Democrat for Senate but the Republican further down the ballot. The district pages show where it happened.`; }
    return `<section aria-labelledby="cv-h" style="margin-top:6px"><h3 id="cv-h" style="margin:0 0 6px">How the county voted at the top of the ballot (unofficial)</h3><div class="sizebar">${RS.map(row).join('')}</div>${note ? `<p class="note">${note}</p>` : ''}</section>`; })() : ''}
  <section aria-labelledby="proj-h" id="proj-sec" hidden><h2 id="proj-h">What the early vote points to for the final turnout</h2><p class="sub" id="proj-sub"></p><div style="overflow-x:auto"><table class="ntab" id="proj-tab"></table></div><p class="note" id="proj-note"></p></section>
  ${F ? `<section aria-labelledby="cut-h" id="cut-sec" style="margin-top:28px;padding:16px 18px;border:1px solid var(--rule);border-left:4px solid var(--ink);border-radius:6px;background:var(--surface)">
    ${C.who && C.who.rosters && C.who.rosters['election day']
      ? `<h2 id="cut-h" style="font-size:1.1rem;margin:0 0 6px">Digging into the details</h2>
    <p style="margin:0">Above: the outcome, from the county’s unofficial election-night count and its daily early-voting reports. Below: how it happened. “Who voted” comes from the county’s voter lists, early, mail and the <b class="num">${fmtN(C.who.rosters['election day'].voters)}</b> Election Day in-person voters (mail ballots that arrived after ${dlab(last.date)} and provisional ballots aren’t on those lists yet). The “finish the ballot” section uses the precinct results; the statewide comparisons and the day-by-day detail cover early voting only. All of it will be updated once the county releases its official canvass.</p>`
      : `<h2 id="cut-h" style="font-size:1.1rem;margin:0 0 6px">Below this point: early voting only, for now</h2>
    <p style="margin:0">Everything above uses the county’s unofficial election-night count. The sections below are built from the county’s lists of who voted early and by mail, through the end of early voting on ${dlab(last.date)}, so they don’t include Election Day voters yet. They will be updated once the county releases its official canvass and its full list of who voted, including Election Day.</p>`}</section>` : ''}
  <section aria-labelledby="left-h" id="left-sec" hidden><h2 id="left-h"></h2><p class="sub" id="left-sub"></p><div class="sizebar" id="left-bars"></div><p class="note" style="margin-top:2px">Hover over or tap a bar for the numbers.</p><h3 style="margin-top:18px">By commissioner precinct</h3><div style="overflow-x:auto;max-width:560px"><table class="ntab" id="left-comm"></table></div><p class="note" id="left-note"></p></section>
  <section aria-labelledby="rof-h" id="rof-sec" hidden><h2 id="rof-h"></h2><p class="sub" id="rof-sub"></p><div class="sizebar" id="rof-bars"></div><div class="panel" style="margin-top:16px" id="rof-2026"></div><details style="margin-top:14px"><summary style="cursor:pointer;font-weight:600">Every countywide race, 2022 to 2026</summary><div style="overflow-x:auto"><table class="ntab" id="rof-tab" style="white-space:nowrap"></table></div></details><p class="note" id="rof-note"></p></section>
  <section aria-labelledby="eds-h" id="eds-sec" hidden><h2 id="eds-h"></h2><p class="sub" id="eds-sub"></p><h3 style="margin-top:14px" id="eds-top-h">The 15 sites likely to be busiest on Election Day</h3><div style="overflow-x:auto"><table class="ntab" id="eds-top" style="white-space:nowrap"></table></div><h3 style="margin-top:22px" id="eds-cl-h">The busiest 2024 Election Day sites that are closed this year</h3><div style="overflow-x:auto"><table class="ntab" id="eds-closed" style="white-space:nowrap"></table></div><p class="note" id="eds-note"></p></section>
  <section aria-labelledby="dd-h" id="dd-sec" hidden><h2 id="dd-h">Early voting, day by day</h2><p class="sub">The daily charts and tables from the 12 days of early voting, Oct 19–30, including votes by early-voting location.</p><button type="button" id="dd-btn" class="btn" style="font:inherit;cursor:pointer;padding:6px 12px;border:1px solid var(--rule);border-radius:6px;background:var(--surface);color:var(--ink)">Show the daily detail</button></section>
  <section aria-labelledby="pace-h"><h2 id="pace-h">${F ? 'How the vote built up, day by day, against past elections' : n ? 'Ballots in, day by day, against past elections' : 'How past elections built up, day by day'}</h2>
    <p class="sub">Early votes in person plus mail ballots returned, added up through each day of early voting. Days are lined up by their place in the 12-day early voting period. ${F ? 'The last point is the final count, including Election Day (2026: unofficial).' : 'The last point for past years is the final count, including Election Day.'}</p>
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
    <p class="note" id="tx-foot"></p>
    <div id="tx-fin" hidden></div>
    <div id="tx-pie" hidden></div>${MARK}</section>
  <section aria-labelledby="ry-h" id="ry-sec" hidden><h2 id="ry-h">Texas: add up the early vote your way</h2><p class="sub" id="ry-sub"></p>
    <label class="note" style="display:block;margin:4px 0 8px">Show <select id="ry-sel" style="font:inherit;margin-left:4px"></select></label><div id="ry-box"></div>
    <p class="note" id="ry-note"></p>${MARK}</section>
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
    <div class="two" id="who-two"><div class="panel"><h3>Their voting history</h3><ul class="kv" id="who-kv"></ul><p class="note">Age, sex and race are in the day-by-day table below.</p></div>
    <div class="panel"><h3>By commissioner precinct</h3><table class="ntab" id="who-comm"></table><p class="note">District pages show 2026 turnout for every precinct, district, city and school district. <a href="../electorate/index.html">The Electorate ›</a></p></div></div>
    <div id="bloc-wrap" hidden><h3 style="margin:22px 0 4px">By voting history, 2018 to 2026</h3>
    <p class="note" style="margin-top:0">Each registered voter falls in one group, from the March primaries of 2018, 2020, 2022, 2024 and 2026 and the November generals of 2018, 2020, 2022 and 2024. “Of voters” and “Of registered” show each group’s share of those who voted and of all registered voters; “Turnout” is the share of the group that voted.</p>
    <div id="bloc-pies" style="display:flex;flex-wrap:wrap;gap:12px 36px;align-items:center;margin:10px 0 14px"></div>
    <div style="overflow-x:auto"><table class="ntab" id="bloc"></table></div></div>
    <div id="demo-day"></div>
    <div class="sizebar" id="who" style="margin-top:20px"></div>
    <div id="scen"></div>
    <div id="dl-wrap" hidden><h3 style="margin:22px 0 4px" id="dl-h"></h3>
      <p class="note" style="margin-top:0" id="dl-sub"></p>
      <div class="seg" role="group" aria-label="Voters shown"><button type="button" id="dl-day" aria-pressed="true">Each day on its own</button><button type="button" id="dl-cum" aria-pressed="false">Running total</button></div>
      <div class="chart" id="dl"></div>
      <div class="sb-key"><span><i class="sw" style="background:var(--dem)"></i>Democratic primary</span><span><i class="sw" style="background:var(--grid)"></i>Neither</span><span><i class="sw" style="background:var(--rep)"></i>Republican primary</span></div>
      <p class="note">Each voter’s most recent party primary since 2022. A primary ballot is not a November vote. The bars on the right are past electorates, for scale.</p></div>
    <div id="nei-wrap" hidden><h3 style="margin:22px 0 4px" id="nei-h"></h3>
      <p class="note" style="margin-top:0">Share of 2026 voters so far with no Democratic or Republican primary on record since 2022, after each day of early voting. The dashed lines show the same share among past electorates: the higher the turnout, the more of these less predictable voters it brings in.</p>
      <div class="chart" id="nei"></div></div>${MARK}</section>
  <section aria-labelledby="fin-h"><h2 id="fin-h">${F ? 'How 2026 finished, against past elections' : 'How past elections finished'}</h2><p class="sub">${F ? 'Official totals for past years; 2026 is the county’s unofficial election-night count, and its Election Day column includes the few mail ballots that arrived after early voting ended.' : 'Official totals.'} Most Tarrant County ballots are cast before Election Day: the early vote is the bulk of the race.</p>
    <div style="overflow-x:auto"><table class="ntab"><thead><tr><th>Election</th><th class="r">In person early</th><th class="r">Mail</th><th class="r">Election Day</th><th class="r">Total</th><th class="r">Turnout</th><th class="r">Before E-Day</th></tr></thead><tbody>
    ${[...Y].sort((a, b) => a.year - b.year).map(y => { const m = y.modes || { early: y.ev_total, mail: y.mail_total, eday: y.eday, total: y.final_total };
      const before = (m.early + m.mail) / (m.early + m.mail + m.eday);
      return `<tr><td>${y.year} ${y.kind.toLowerCase()}</td><td class="r num">${fmtN(m.early)}</td><td class="r num">${fmtN(m.mail)}</td><td class="r num">${fmtN(m.eday)}</td><td class="r num"><b>${fmtN(y.final_total)}</b></td><td class="r num">${pc1(y.final_total / y.registered)}</td><td class="r num">${pc1(before)}</td></tr>`; }).join('')}
    ${F ? `<tr style="font-weight:600;border-top:2px solid var(--grid)"><td>2026 midterm <small style="font-weight:400">(unofficial)</small></td><td class="r num">${fmtN(last.ev_cum)}</td><td class="r num">${fmtN(last.mail_cum)}</td><td class="r num">${fmtN(F.ballots - last.total)}</td><td class="r num"><b>${fmtN(F.ballots)}</b></td><td class="r num">${pc1(F.ballots / C.registered)}</td><td class="r num">${pc1(last.total / F.ballots)}</td></tr>` : ''}
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
  // Texas what-if (Ryan Data), sites, mail, past finishes. Sections are moved after they are written, so each keeps its own markup above.
  (F ? ['fin-h', 'pace-h', 'proj-h', 'cut-h', 'who-h', 'eds-h', 'rof-h', 'tx-h', 'ry-h', 'dd-h', 'day-h', 'tab-h', 'site-h', 'mail-h', 'left-h'] : EVDONE ? ['proj-h', 'cut-h', 'left-h', 'rof-h', 'eds-h', 'pace-h', 'who-h', 'tx-h', 'ry-h', 'dd-h', 'day-h', 'tab-h', 'site-h', 'mail-h', 'fin-h'] : ['pace-h', 'day-h', 'who-h', 'rof-h', 'tx-h', 'ry-h', 'tab-h', 'site-h', 'mail-h', 'fin-h']).forEach(id => {
    const sec = app.querySelector(`section[aria-labelledby="${id}"]`), foot = app.querySelector('footer');
    if (sec && foot) app.insertBefore(sec, foot);
  });

  // ---------- pace chart
  let mode = 'n';
  function series(y) {
    const pts = y.rows.map(r => ({ x: r.day, v: r.total, r }));
    if (y.year !== 2026) pts.push({ x: 13.4, v: y.final_total, fin: true });
    else if (D.final && D.final.ballots && pts.length >= 12) pts.push({ x: 13.4, v: D.final.ballots, fin: true });   // unofficial final
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
  // the full election, per county (statewide results file + 2024 canvass): [2026 governor votes, D, R, registered 2026, 2024 president votes, Harris, Trump]
  const FT = D.fin_tx || null;
  const reg24 = k => { const A = (S[2024] && S[2024].all) || {}; if (k === 'TOTAL') return Object.values(A).reduce((a, v) => a + (v[0] || 0), 0); return A[k] ? A[k][0] : null; };
  const finSh = (y, k) => { const c = FT && FT[k]; if (!c) return null; if (y === 2026) return c[3] ? c[0] / c[3] : null; if (y === 2024) { const r = reg24(k); return r ? c[4] / r : null; } return null; };
  const finGap = y => { if (!FT || !FT.TARRANT || !FT.TOTAL || txB !== 'TOTAL') return null; const t = FT.TARRANT, T = FT.TOTAL;
    if (y === 2026) return (t[0] / t[3] - (T[0] - t[0]) / (T[3] - t[3])) * 100;
    if (y === 2024) { const rt = reg24('TARRANT'), rT = reg24('TOTAL'); return rt && rT ? (t[4] / rt - (T[4] - t[4]) / (rT - rt)) * 100 : null; } return null; };
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
    ser.forEach(s => { const g = finGap(s.y); if (g != null && s.p.length >= 12) s.p.push({ d: 13.4, g, fin: true }); });   // the full election (all votes)
    const FIN = ser.some(s => s.p.some(p => p.fin));
    const gs = ser.flatMap(s => s.p.map(p => p.g));
    let lo = Math.min(0, ...gs), hi = Math.max(0, ...gs); const padv = Math.max(0.5, (hi - lo) * 0.12); lo = Math.floor(lo - padv); hi = Math.ceil(hi + padv);
    const x = d => m.l + (d - 1) / (FIN ? 12.4 : 11) * (W - m.l - m.r), yy = g => m.t + (hi - g) / (hi - lo) * (H - m.t - m.b);
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
      ${[1, 3, 5, 7, 9, 12].map(d => `<text x="${x(d)}" y="${H - 14}" text-anchor="middle" font-size="11" fill="var(--ink-3)">Day ${d}</text>`).join('')}${FIN ? `<text x="${x(13.4)}" y="${H - 14}" text-anchor="middle" font-size="11" fill="var(--ink-3)">Final</text>` : ''}
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
  // the full election, county by county: turnout and the top-of-ticket margin, 2024 against 2026
  function finTable() {
    if (!FT || !F) return;
    const box = $('#tx-fin'); box.hidden = false;
    const mg = (d, r) => (d - r) / ((d + r) || 1) * 100, M = v => `${v >= 0 ? 'D' : 'R'}+${Math.abs(v).toFixed(1)}`;
    const keysAll = Object.keys(FT).filter(k => k !== 'TOTAL' && FT[k][3]).sort((a, b) => FT[b][3] - FT[a][3]);
    const render = () => {
      const all = $('#tf-all').checked, q = all ? ($('#tf-q').value || '').trim().toUpperCase() : '';
      let keys = all ? keysAll.filter(k => !q || k.includes(q) || k === 'TARRANT') : keysAll.slice(0, 20);
      keys = ['TARRANT', ...keys.filter(k => k !== 'TARRANT')];
      const row = k => { const c = FT[k], t26 = finSh(2026, k), t24 = finSh(2024, k), m26 = mg(c[1], c[2]), m24 = mg(c[5], c[6]), sh = m26 - m24;
        return `<tr${k === 'TARRANT' ? ' style="font-weight:600"' : k === 'TOTAL' ? ' style="border-top:2px solid var(--grid);font-weight:600"' : ''}><td style="white-space:nowrap">${CNAME(k)}</td><td class="r num">${fmtN(c[3])}</td><td class="r num">${t24 == null ? '—' : pc1(t24)}</td><td class="r num">${t26 == null ? '—' : pc1(t26)}</td><td class="r num">${t24 == null || t26 == null ? '—' : pts((t26 - t24) * 100)}</td><td class="r num">${M(m24)}</td><td class="r num">${M(m26)}</td><td class="r num"><b style="color:${sh >= 0 ? 'var(--dem)' : 'var(--rep)'}">${sh >= 0 ? 'D' : 'R'}+${Math.abs(sh).toFixed(1)}</b></td></tr>`; };
      $('#tf-tab').innerHTML = `<thead><tr><th>County</th><th class="r">Registered</th><th class="r">Turnout 2024</th><th class="r">Turnout 2026</th><th class="r">Change, pts</th><th class="r">2024 president</th><th class="r">2026 governor</th><th class="r">Shift</th></tr></thead><tbody>${[...keys, 'TOTAL'].map(row).join('')}</tbody>`;
    };
    const T = FT.TOTAL, t = FT.TARRANT, sT = mg(T[1], T[2]) - mg(T[5], T[6]), sTa = mg(t[1], t[2]) - mg(t[5], t[6]);
    box.innerHTML = `<h3 style="margin-top:26px">The full election, county by county: Texas moved ${sT >= 0 ? 'D' : 'R'}+${Math.abs(sT).toFixed(1)} from 2024, Tarrant ${sTa >= 0 ? 'D' : 'R'}+${Math.abs(sTa).toFixed(1)}</h3>
      <p class="note" style="margin-top:0">All votes, early and Election Day (unofficial). Turnout is votes in the race with the most votes (the 2024 presidential race, the 2026 governor’s race) as a share of the state’s registered-voter count. The margin is Democrat minus Republican, as a share of the two; the shift is the change in that margin. The governor’s race is used rather than the U.S. Senate race because heavy ticket-splitting toward Talarico makes the Senate race an outlier${(() => { const SN = D.fin_sen; if (!SN || !SN.TOTAL || !SN.TARRANT) return ''; const sh = c => mg(c[1], c[2]) - mg(c[5], c[6]), f = v => `${v >= 0 ? 'D' : 'R'}+${Math.abs(v).toFixed(1)}`; return `: measured on the Senate race, Texas moved <b class="num">${f(sh(SN.TOTAL))}</b> and Tarrant <b class="num">${f(sh(SN.TARRANT))}</b> from 2024`; })()}.</p>
      <div style="display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin:2px 0 10px"><label style="font-size:13px;color:var(--ink-2)"><input type="checkbox" id="tf-all"> Show all Texas counties</label>
        <input type="search" id="tf-q" placeholder="Find a county" aria-label="Find a county" hidden style="font:inherit;font-size:13px;padding:5px 8px;border:1px solid var(--rule);border-radius:6px;background:var(--surface);color:var(--ink)"></div>
      <div style="overflow-x:auto"><table class="ntab" id="tf-tab" style="white-space:nowrap"></table></div>
      <p class="note">The 20 counties with the most registered voters, unless “all” is checked. Sources: statewide election-night results by county (2026, unofficial); Texas Secretary of State 2024 canvass and its registered-voter counts.</p>`;
    $('#tf-all').onchange = () => { $('#tf-q').hidden = !$('#tf-all').checked; render(); };
    $('#tf-q').oninput = render;
    render();
  }
  if (SY.length) {
    $('#tx-sec').hidden = false;
    finTable();
    const r0 = nS ? sRow(2026, nS) : null;
    // the state posts its county counts about a day after the county does, so this section can trail the rest of the page
    if (n && nS && nS < n) $('#tx-sec .sub').insertAdjacentHTML('beforeend', ` <b>The state’s figures run about a day behind the county’s: ${nS ? `this section is through Day ${nS}` : '2026 appears once the state posts its first daily count'}, while the rest of this page is through Day ${n}.</b>`);
    $('#tx-h').textContent = r0
      ? `Tarrant against Texas: ${pc1(share(r0.c.TARRANT))} of Tarrant voters voted early in person, against ${pc1(restSh(r0))} ${r0.rep ? 'in the Texas counties that have reported' : 'in the rest of the state'}`
      : 'Tarrant against Texas in past elections';
    if (F && D.sw26) { const X = D.sw26, tp = X.tarrant[0] / X.tarrant[1], sp = X.tx[0] / X.tx[1];
      $('#tx-h').textContent = `Tarrant against Texas: ${pc1(tp)} of Tarrant’s registered voters voted in the ${X.race} race, against ${pc1(sp)} statewide`;
      $('#tx-sec .sub').insertAdjacentHTML('afterbegin', `<b>Final, unofficial:</b> ${fmtN(X.tarrant[0])} votes in the ${X.race} race in Tarrant County and ${fmtN(X.tx[0])} across Texas, out of ${fmtN(X.tarrant[1])} and ${fmtN(X.tx[1])} registered voters on the state’s count (the race with the most votes, so a close stand-in for turnout). The charts below compare the early vote. `); }
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
      : `Share of registered voters who voted early in person through the chosen day.`) + ` Source: Texas Secretary of State, early voting by county. “Rest of Texas” is every other county combined.` +
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


  // ---------- estimated vote by group (subgroup_model in build_turnout.py): office x category grid, NYT-style
  const SHOW_SUB = false;          // estimated-vote-by-group grid: built but off (Chris, Nov 7)
  function subGrid(SB, box) {
    let office = SB.offices['County Judge'] ? 'County Judge' : Object.keys(SB.offices)[0], view = 'est', cat = 'sex';
    const CATS = { sex: ['Sex', ['Women', 'Men']], age: ['Age', ['18–34', '35–54', '55–64', '65 and older']], prim: ['Primary history', ['Democratic primary', 'Neither', 'Republican primary']] };
    const M = v => `${v >= 0 ? 'D' : 'R'}+${Math.abs(v)}`;
    const bg = v => { const a = Math.min(55, 8 + Math.abs(v) * 0.6); return `color-mix(in oklab, var(${v >= 0 ? '--dem' : '--rep'}) ${a}%, var(--surface))`; };
    const fg = v => Math.abs(v) >= 70 ? 'var(--ink)' : `var(${v >= 0 ? '--dem' : '--rep'})`;
    const cell = v => v == null ? `<td class="sg-na">No<br>estimate</td>` : view === 'est'
      ? `<td style="background:${bg(v)};color:${fg(v)}">${M(v)}</td>`
      : `<td style="background:${bg(v[0])};color:${fg(v[0])}">${M(v[0])}<small>Neither ${v[1]}%</small></td>`;
    const draw = () => {
      const C = view === 'est' ? SB.offices[office].cells : SB.prim, O = SB.offices[office];
      const sel = (id, opts, cur) => `<select data-sg="${id}" style="font:inherit;padding:6px 10px;border:1px solid var(--rule);border-radius:8px;background:var(--surface);color:var(--ink)">${opts.map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
      const btn = (v, l) => `<button type="button" data-sgv="${v}" aria-pressed="${v === view}">${l}</button>`;
      const head = `<tr><th style="text-align:left"><b>Tarrant</b><br><small>% of voters</small></th>${SB.cols.map((c, i) => `<th>${c}<br><small>${i ? SB.share_col[i] + '%' : '100%'}</small></th>`).join('')}</tr>`;
      const row = r => `<tr><th style="text-align:left">${r}<br><small>${SB.share_row[r]}%</small></th>${C[r].map(cell).join('')}</tr>`;
      box.innerHTML = `<h3 style="margin:26px 0 4px">How different groups of voters likely voted</h3>
        <p class="note" style="margin-top:0">Pick an office and a category. ${view === 'est' ? `Estimated 2026 margins (unofficial), Democrat minus Republican as a share of the two. Countywide, the model gives ${M(O.cells.All[0])} for ${esc(office)}; the actual result was ${M(Math.round(O.actual))}.` : 'Primary-history balance among 2026 voters: Democratic-primary minus Republican-primary voters, as a share of everyone in the group, with the share who had no primary since 2022. These are counts from the voter file (race is estimated), not votes.'}</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:8px 0 10px">
          <label class="note" style="margin:0">Office ${sel('o', Object.keys(SB.offices).map(k => [k, k]), office)}</label>
          <label class="note" style="margin:0">Category ${sel('c', Object.entries(CATS).map(([k, v]) => [k, v[0]]), cat)}</label>
          <div class="seg" role="group" aria-label="Measure" style="margin:0">${btn('est', 'Estimated margin')}${btn('prim', 'Primary history')}</div></div>
        <div style="overflow-x:auto"><table class="sg">${head}<tbody>${row('All')}<tr class="sg-g"><th colspan="${SB.cols.length + 1}">${CATS[cat][0]}</th></tr>${CATS[cat][1].map(row).join('')}</tbody></table></div>
        <p class="note">${view === 'est' ? `How the estimate works: Democratic-primary voters are counted ${SB.dl}% Democratic and Republican-primary voters ${SB.rl}% Republican (a 3-point base crossover plus the countywide governor crossover, rounded up). Voters with no primary since 2022 vote Democratic at a rate that depends on their estimated race, fitted so every precinct’s result matches the county’s unofficial count as closely as possible; for ${esc(office)} that rate is ${Object.entries({ White: 'w', Black: 'b', Hispanic: 'h', Asian: 'a', Other: 'o' }).map(([l, k]) => `${l} ${O.p[k]}%`).join(', ')}. Precinct-level estimates exaggerate differences between groups that live together, so each rate is pulled partway toward the overall Neither rate. Within each race, differences by sex, age and primary history come from how many in each group voted in a Democratic or Republican primary; the Neither rate itself varies only by race. Treat every cell as a rough estimate: ballots are secret, race is itself an estimate from names and neighborhoods, and cells built on fewer than 2,000 estimated voters are left out.` : 'Race is estimated from Census surname and first-name data and each voter’s Census block. Cells built on fewer than 2,000 estimated voters are left out.'}</p>`;
      box.querySelectorAll('[data-sg]').forEach(s_ => s_.onchange = () => { if (s_.dataset.sg === 'o') office = s_.value; else cat = s_.value; draw(); });
      box.querySelectorAll('[data-sgv]').forEach(b => b.onclick = () => { view = b.dataset.sgv; draw(); });
    };
    if (!$('#sg-css')) document.head.insertAdjacentHTML('beforeend', `<style id="sg-css">
      table.sg{border-collapse:separate;border-spacing:2px;width:100%;min-width:560px;font-variant-numeric:tabular-nums}
      table.sg th{font-weight:500;font-size:14px;color:var(--ink);text-align:center;padding:6px 6px;vertical-align:bottom}
      table.sg th small,table.sg td small{display:block;font-size:11.5px;color:var(--ink-3);font-weight:400}
      table.sg td{text-align:center;padding:12px 6px;font-size:16px;font-weight:500;border-radius:2px}
      table.sg td small{color:inherit;opacity:.75}
      table.sg tr.sg-g th{text-align:left;font-weight:700;font-size:15px;padding-top:14px}
      table.sg td.sg-na{color:var(--ink-3);font-size:12px;font-weight:400;background:repeating-linear-gradient(135deg,var(--grid) 0 1px,transparent 1px 7px)}</style>`);
    draw();
  }

  // ---------- primary history (D / neither / R) of each early-voting day's voters, as 100% bars building to Election Day
  let dlMode = 'day';
  function drawLean() {
    const NE = D.current.who.neither, B = D.current.who.base, box = $('#dl'); $('#dl-wrap').hidden = false;
    const evs = D.ev_days_2026.concat([D.current.election]), cum = dlMode === 'cum';
    const src = cum ? (NE.series || []).filter(r => r[3] && evs.includes(r[0])).map(r => [r[0], r[1], r[3][0], r[3][1], r[3][2]]) : (NE.daily || []).filter(r => evs.includes(r[0]));
    const byDay = {}; src.forEach(r => { byDay[evs.indexOf(r[0]) + 1] = r; });
    const slots = evs.slice(0, -1).map((d, i) => ({ lab: `Day ${i + 1}`, sm: String(i + 1), sub: dlab(d), r: byDay[i + 1] }));
    slots.push({ lab: 'Election Day', sm: 'ED', sub: dlab(D.current.election), r: byDay[evs.length] || null, gap: true });
    [['All 2022 voters', '2022'], ['All 2024 voters', '2024']].forEach(([k, sm], i) => { const p = B[k]; if (p) slots.push({ lab: k, sm, sub: 'all voters', r: [null, p.n, p.lean[0], p.lean[1], p.lean[2]], ref: true, gap: i === 0 }); });
    const done = src.at(-1), dn = done ? evs.indexOf(done[0]) + 1 : 0;
    const pct = (r, i) => r[i] / ((r[2] + r[3] + r[4]) || 1), mg = r => { const g = (pct(r, 2) - pct(r, 3)) * 100; return `${g >= 0 ? 'D' : 'R'}+${Math.abs(g).toFixed(1)}`; };
    if (done && dn === evs.length) {
      const e0 = (NE.series || []).filter(r => r[3] && r[0] === evs[evs.length - 2]).map(r => [r[0], r[1], r[3][0], r[3][1], r[3][2]])[0];
      $('#dl-h').textContent = cum
        ? `All 2026 voters (unofficial): ${Math.round(pct(done, 2) * 100)}% chose a Democratic primary last, ${Math.round(pct(done, 4) * 100)}% neither, ${Math.round(pct(done, 3) * 100)}% Republican (${mg(done)})`
        : `Election Day: ${Math.round(pct(done, 2) * 100)}% of in-person voters chose a Democratic primary last, ${Math.round(pct(done, 4) * 100)}% neither, ${Math.round(pct(done, 3) * 100)}% Republican (${mg(done)}${e0 ? `, against ${mg(e0)} for everyone who voted early or by mail` : ''})`;
    } else if (done) {
      const prev = byDay[dn - 1];
      $('#dl-h').textContent = cum
        ? `After ${dn} day${dn > 1 ? 's' : ''}: ${Math.round(pct(done, 2) * 100)}% of all 2026 voters so far chose a Democratic primary last, ${Math.round(pct(done, 4) * 100)}% neither, ${Math.round(pct(done, 3) * 100)}% Republican (${mg(done)})`
        : `Day ${dn} (${dlab(done[0])}): ${Math.round(pct(done, 2) * 100)}% of the day’s in-person voters chose a Democratic primary last, ${Math.round(pct(done, 4) * 100)}% neither, ${Math.round(pct(done, 3) * 100)}% Republican (${mg(done)}${prev ? `, against ${mg(prev)} on Day ${dn - 1}` : ''})`;
    }
    $('#dl-sub').textContent = cum
      ? 'Everyone who had voted by the end of each day of early voting, mail ballots included, by the most recent party primary they voted in.' + (byDay[evs.length] ? ' The Election Day bar is everyone on the county’s lists, early, mail and Election Day.' : '')
      : 'The voters who voted in person on each day of early voting (new names on that day’s county list), by the most recent party primary they voted in. Mail ballots are left out here.' + (byDay[evs.length] ? ' The Election Day bar is the county’s list of Election Day in-person voters.' : '');
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
    // starting points: D-primary 99%; R-primary 100 minus (3-point base + this area's governor crossover), rounded up;
    // Neither at the share that reproduces the actual result here, when there is one
    const gx = o && o.gx != null && isFinite(o.gx) ? o.gx : null, rl = gx != null ? Math.max(50, Math.min(100, 100 - Math.ceil(3 + gx))) : 95;
    let nd0 = 50;
    if (o && o.actual) { const [Dl, Rl, Nl] = lean, Tl = Dl + Rl + Nl, p0 = (o.actual[1] * Tl - .99 * Dl - (1 - rl / 100) * Rl) / Nl; if (Nl && p0 >= 0 && p0 <= 1) nd0 = Math.round(p0 * 100); }
    const defNote = gx != null ? ` The Republican-primary slider starts at ${rl}%: a 3-point base crossover plus the ${gx >= 0 ? '' : '−'}${Math.abs(gx).toFixed(1)}-point governor crossover here (the governor’s margin minus the County Judge margin), rounded up.${o && o.actual && nd0 !== 50 ? ` Neither starts at ${nd0}%, the share that matches the actual ${esc(o.actual[0])} result.` : ''}` : '';
    const sl = (k, lab, v, min) => `<label style="display:block;margin:10px 0 2px"><span style="display:flex;justify-content:space-between;gap:8px"><span>${lab}</span><b class="num" data-scv="${k}">${v}%</b></span>
      <input type="range" min="${min}" max="100" step="1" value="${v}" data-sck="${k}" style="width:100%;accent-color:var(--ink)" aria-label="${lab}"></label>`;
    return `<div class="panel" id="${id}" data-sc="${lean.join(',')}" data-def="99,${rl},${nd0}"${o && o.actual ? ` data-act="${esc(o.actual[0])}|${o.actual[1]}"` : ''} style="margin-top:18px">
      <h3 style="margin-top:0">What if? Add up the 2026 vote your way</h3>
      <p class="note" style="margin-top:0">Move the sliders to set how each group votes${o && o.where ? ' ' + o.where : ''}. ${o && o.def ? o.def : 'Every voter is grouped by the most recent party primary they chose since 2022.'} It counts the voters on record${o && o.through ? `, through ${o.through}` : ''}. It is not how anyone actually voted: ballots are secret.${defNote}${o && o.actual ? ' Compare the result with the actual one below.' : ''}</p>
      ${sl('d', 'Democratic primary voters who vote Democratic', 99, 50)}
      ${sl('r', 'Republican primary voters who vote Republican', rl, 50)}
      ${sl('n', 'Voters with neither primary who vote Democratic', nd0, 0)}
      <div data-sco style="margin-top:14px"></div>
      <p class="note"><button type="button" data-screset style="font:inherit;cursor:pointer;background:none;border:0;padding:0;text-decoration:underline;color:inherit">Reset</button> · Third-party and write-in votes are left out.</p></div>`;
  };
  // the actual result, and the Neither share that reproduces it at the chosen loyalty settings
  const actualHtml = (box, D, R, N, a, b) => {
    const A = box.dataset.act; if (!A || !N) return '';
    const i = A.lastIndexOf('|'), lab = A.slice(0, i), ds = +A.slice(i + 1), g = (2 * ds - 1) * 100;
    const p = (ds * (D + R + N) - D * a - R * (1 - b)) / N, ok = p >= 0 && p <= 1;
    return `<p class="note" style="margin:10px 0 0;padding-top:8px;border-top:1px solid var(--rule)"><b>Actual result, ${esc(lab)} (unofficial): ${g >= 0 ? 'D' : 'R'}+${Math.abs(g).toFixed(1)}</b> (two-party). ${ok
      ? `With Democratic primary voters at ${Math.round(a * 100)}% and Republican primary voters at ${Math.round(b * 100)}%, voters with neither primary would have had to vote about <b>${Math.round(p * 100)}%</b> Democratic to produce it. <button type="button" data-scmatch="${Math.round(p * 100)}" style="font:inherit;cursor:pointer;background:none;border:0;padding:0;text-decoration:underline;color:inherit">Set the Neither slider to match</button>`
      : 'No Neither share matches it at these loyalty settings.'} This is an estimate from totals; ballots are secret.</p>`;
  };
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-scmatch]'); if (!b) return; const box = b.closest('[data-sc]');
    box.querySelector('[data-sck="n"]').value = b.dataset.scmatch; scenarioDraw(box); });
  const scenarioDraw = box => {
    const [D, R, N] = box.dataset.sc.split(',').map(Number), v = k => +box.querySelector(`[data-sck="${k}"]`).value / 100;
    const a = v('d'), b = v('r'), c = v('n'), dv = D * a + R * (1 - b) + N * c, rv = D * (1 - a) + R * b + N * (1 - c), t = dv + rv || 1;
    box.querySelectorAll('[data-sck]').forEach(i => { box.querySelector(`[data-scv="${i.dataset.sck}"]`).textContent = i.value + '%'; });
    const f = x => Math.round(x).toLocaleString('en-US'), m = (dv - rv) / t * 100, lead = dv >= rv ? 'D' : 'R';
    box.querySelector('[data-sco]').innerHTML = `<div class="sb-track" style="height:26px"><div class="sb-seg" style="flex:${dv / t} 1 0;background:var(--dem);color:#fff">D ${(dv / t * 100).toFixed(1)}%</div><div class="sb-seg" style="flex:${rv / t} 1 0;background:var(--rep);color:#fff">R ${(rv / t * 100).toFixed(1)}%</div></div>
      <p style="margin:8px 0 0"><b>${Math.abs(m) < 0.05 ? 'Dead even' : `${lead}+${Math.abs(m).toFixed(1)}`}</b>${Math.abs(m) < 0.05 ? '' : `, a lead of <b class="num">${f(Math.abs(dv - rv))}</b> votes`}: about <span class="num">${f(dv)}</span> Democratic to <span class="num">${f(rv)}</span> Republican, out of <span class="num">${f(D + R + N)}</span> voters.</p>${actualHtml(box, D, R, N, a, b)}`;
  };
  document.addEventListener('input', e => { const i = e.target; if (!i.dataset || !i.dataset.sck) return; scenarioDraw(i.closest('[data-sc]')); });
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-screset]'); if (!b) return; const box = b.closest('[data-sc]');
    const df = (box.dataset.def || '99,95,50').split(',').map(Number);
    box.querySelectorAll('[data-sck]').forEach(i => { i.value = i.dataset.sck === 'n' ? df[2] : i.dataset.sck === 'd' ? df[0] : df[1]; }); scenarioDraw(box); });
  const scenarioInit = () => document.querySelectorAll('[data-sc]').forEach(scenarioDraw);
  setTimeout(scenarioInit, 0);
  // donut: 2026 in-person early votes by each county's 2024 presidential result, labeled with the change from 2022 or 2024,
  // either in votes cast or in turnout rate (share of registered voters)
  (function () {
    const CG = D.county_groups; if (!CG || !CG.groups) return;
    const G0 = CG.groups.filter(x => x.ev26 > 0); let G = G0, tot = G.reduce((a, x) => a + x.ev26, 0) || 1;
    // the full election (all votes, 2026 U.S. Senate against 2024 president), grouped the same way
    const BIN = [[0, .5], [.5, .6], [.6, .7], [.7, .8], [.8, 1.01]];
    const GF = FT && F ? CG.groups.map((g, i) => ({ label: g.label, i, counties: 0, ev26: 0, ev24: 0, reg26: 0, reg24: 0, d26: 0, r26: 0, d24: 0, r24: 0 })) : null;
    if (GF) Object.entries(FT).forEach(([k, c]) => { if (k === 'TOTAL' || !c[3]) return; const r_ = reg24(k); if (!r_) return;
      const sh = c[6] / ((c[5] + c[6]) || 1), b = BIN.findIndex(([a, z]) => sh >= a && sh < z); if (b < 0) return;
      const g = GF[b]; g.counties++; g.ev26 += c[0]; g.ev24 += c[4]; g.reg26 += c[3]; g.reg24 += r_; g.d26 += c[1]; g.r26 += c[2]; g.d24 += c[5]; g.r24 += c[6]; });
    let scope = GF ? 'fin' : 'ev';
    const mgn = (d, r) => (d - r) / ((d + r) || 1) * 100, Mg = v => `${v >= 0 ? 'D' : 'R'}+${Math.abs(v).toFixed(1)}`;
    const COLS = ['var(--dem)', 'color-mix(in oklab, var(--rep) 45%, var(--surface))', 'color-mix(in oklab, var(--rep) 65%, var(--surface))', 'color-mix(in oklab, var(--rep) 82%, var(--surface))', 'var(--rep)'];
    const has24 = G.every(x => x.vs24 != null), hasReg = G.every(x => x.reg26 && x.reg22);
    const sgn = v => (v >= 0 ? '+' : '−');
    let yr = '2022', ms = 'votes';
    $('#tx-pie').hidden = false;
    function draw() {
      const FIN = scope === 'fin';
      if (FIN) yr = '2024';
      G = FIN ? GF.filter(x => x.ev26 > 0) : G0; tot = G.reduce((a, x) => a + x.ev26, 0) || 1;
      const y = yr.slice(2), ev = x => x['ev' + y], rg = x => x['reg' + y];
      const rate = ms === 'rate';
      const val = x => rate ? (x.ev26 / x.reg26 - ev(x) / rg(x)) * 100 : (ev(x) ? x.ev26 / ev(x) - 1 : null);
      const lab = v => v == null || isNaN(v) ? '—' : rate ? `${sgn(v)}${Math.abs(v).toFixed(1)} pts` : `${sgn(v)}${Math.abs(v * 100).toFixed(0)}%`;
      const S = 360, cx = S / 2, cy = S / 2, R = 150, r0 = 88; let a0 = -Math.PI / 2, arcs = '';
      G.forEach((x, i) => { const a1 = a0 + x.ev26 / tot * 2 * Math.PI, big = a1 - a0 > Math.PI ? 1 : 0, p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
        const am = (a0 + a1) / 2, lr = (R + r0) / 2, sh = x.ev26 / tot;
        arcs += `<path d="M${p(R, a0)}A${R},${R} 0 ${big} 1 ${p(R, a1)}L${p(r0, a1)}A${r0},${r0} 0 ${big} 0 ${p(r0, a0)}Z" fill="${COLS[(x.i != null ? x.i : CG.groups.indexOf(x))]}" stroke="var(--surface)" stroke-width="2"><title>${esc(x.label)}: ${fmtN(x.ev26)} early votes (${pc1(sh)} of Texas); ${lab(val(x))} vs. ${yr}; ${x.counties} counties</title></path>`
          + (sh >= 0.06 ? `<text x="${cx + lr * Math.cos(am)}" y="${cy + lr * Math.sin(am) + 5}" text-anchor="middle" font-size="${rate ? 13 : 15}" font-weight="700" fill="${i === 0 || i === G.length - 1 ? '#fff' : 'var(--ink)'}" class="num">${lab(val(x))}</text>` : '');
        a0 = a1; });
      const S26 = G.reduce((a, x) => [a[0] + x.ev26, a[1] + x.reg26, a[2] + ev(x), a[3] + rg(x)], [0, 0, 0, 0]);
      const allv = rate ? (S26[0] / S26[1] - S26[2] / S26[3]) * 100 : (S26[2] ? S26[0] / S26[2] - 1 : null);
      const head = rate ? (yr === '2022' ? 'Turnout rates are up most in the counties Harris won and the closest Trump counties' : 'Against 2024, turnout rates have fallen least in the counties Harris won and the closest Trump counties')
        : (yr === '2022' ? 'Early voting is up most in the counties Harris won and the closest Trump counties' : 'Against the 2024 presidential year, early voting has fallen least in the counties Harris won and the closest Trump counties');
      const shifts = FIN ? G.map(x => mgn(x.d26, x.r26) - mgn(x.d24, x.r24)) : [];
      const best = FIN ? G.reduce((a, x) => (val(x) > val(a) ? x : a)) : null, mv = shifts.every(v => v > 0) ? ', and every group of counties moved toward Democrats' : '';
      const head2 = FIN ? (rate ? `The full election: turnout ${allv < 0 ? 'fell' : 'rose'} ${Math.abs(allv).toFixed(1)} points from 2024 statewide, ${allv < 0 ? 'least' : 'most'} in the counties where ${best.label === 'Harris won' ? 'Harris won' : best.label.replace('Trump ', 'Trump won ')}${mv}`
                                   : `The full election: ${Math.abs(allv * 100).toFixed(0)}% ${allv < 0 ? 'fewer' : 'more'} votes than 2024 statewide, the ${allv < 0 ? 'smallest drop' : 'biggest gain'} in the counties where ${best.label === 'Harris won' ? 'Harris won' : best.label.replace('Trump ', 'Trump won ')}${mv}`) : head;
      const what = FIN ? (rate ? 'the label is the change in turnout (votes for governor in 2026 and president in 2024, as a share of registered voters), in percentage points' : 'the label is the change in the number of votes, governor in 2026 against president in 2024') : rate ? `the label is the change in turnout (early votes as a share of registered voters) from the same point in ${yr}, in percentage points` : `the label is the change in the number of early votes from the same point in ${yr}`;
      const btn = (attr, v, cur, t) => `<button type="button" ${attr}="${v}" aria-pressed="${v === cur}">${t}</button>`;
      $('#tx-pie').innerHTML = `<h3 style="margin-top:26px">${head2}</h3>
        <p class="note" style="margin-top:0">${FIN ? 'All Texas votes, early and Election Day (unofficial): the 2026 governor’s race against the 2024 presidential race' : `Texas in-person early votes through Day ${CG.day} (${dlab(CG.through)})`}, grouped by how each county voted for president in 2024. Each slice is that group’s share of the 2026 ${FIN ? 'vote' : 'early vote'}; ${what}.</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px 14px;margin:4px 0 10px">
          ${GF ? `<div class="seg" role="group" aria-label="Votes counted" style="margin:0">${btn('data-cgs', 'fin', scope, 'Full election')}${btn('data-cgs', 'ev', scope, 'Early vote, through Day 12')}</div>` : ''}
          ${hasReg ? `<div class="seg" role="group" aria-label="Measure" style="margin:0">${btn('data-cgm', 'votes', ms, 'Change in votes')}${btn('data-cgm', 'rate', ms, 'Change in turnout rate')}</div>` : ''}
          ${has24 && !FIN ? `<div class="seg" role="group" aria-label="Compare with" style="margin:0">${btn('data-cgy', '2022', yr, 'vs. 2022 (midterm)')}${btn('data-cgy', '2024', yr, 'vs. 2024 (presidential)')}</div>` : ''}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:18px 30px;align-items:center">
          <svg viewBox="0 0 ${S} ${S}" width="300" style="max-width:100%" role="img" aria-label="Donut chart of 2026 early votes by 2024 county result, with the change from ${yr}">${arcs}
            <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="13" fill="var(--ink-2)">All of Texas</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="${rate ? 19 : 22}" font-weight="700" fill="var(--ink)" class="num">${lab(allv)}</text>
            <text x="${cx}" y="${cy + 36}" text-anchor="middle" font-size="11" fill="var(--ink-3)">vs. ${yr}</text></svg>
          <ul class="kv" style="flex:1 1 260px;margin:0">${G.map(x => `<li><span><i class="sw" style="background:${COLS[(x.i != null ? x.i : CG.groups.indexOf(x))]}"></i> ${esc(x.label)} <small>${x.counties} counties · ${rate ? `turnout ${pc1(x.ev26 / x.reg26)} in 2026, ${pc1(ev(x) / rg(x))} in ${yr}` : `${fmtN(x.ev26)} votes (${pc1(x.ev26 / tot)}) · ${yr}: ${fmtN(ev(x))}`}${FIN ? ` · margin ${Mg(mgn(x.d24, x.r24))} → ${Mg(mgn(x.d26, x.r26))}` : ''}</small></span><span class="num"><b>${lab(val(x))}</b></span></li>`).join('')}</ul>
        </div>
        <p class="note">2024 results: Texas Secretary of State county-by-county canvass (Trump’s share of the Trump + Harris vote). Early votes: in person only, from the state’s daily county reports, with county files used for Harris, Dallas, Bexar, Collin, Fort Bend and Tarrant. Turnout rates use the state’s registered-voter count for each county and year. Higher turnout shows where voters are showing up, not how they voted.</p>`;
      $('#tx-pie').querySelectorAll('[data-cgy]').forEach(b => b.onclick = () => { yr = b.dataset.cgy; draw(); });
      $('#tx-pie').querySelectorAll('[data-cgm]').forEach(b => b.onclick = () => { ms = b.dataset.cgm; draw(); });
      $('#tx-pie').querySelectorAll('[data-cgs]').forEach(b => b.onclick = () => { scope = b.dataset.cgs; if (scope === 'ev') yr = '2022'; draw(); });
    }
    draw();
  })();
  // statewide and county "what if" sliders from Ryan Data & Research's public early-voting reports (Derek Ryan),
  // plus legislative and congressional districts from VoteBuilder (VAN) when published (D.van)
  (function () {
    const RY = D.ryan || {}, VN = D.van || {}, KN = { HD: 'Texas House District', SD: 'Texas Senate District', CD: 'Congressional District' };
    const hasRy = RY.state || Object.keys(RY.counties || {}).length, vk = ['HD', 'SD', 'CD'].filter(k => VN[k]);
    if (!hasRy && !vk.length) return;
    $('#ry-sec').hidden = false;
    const thr = RY.through ? dlab(RY.through) : '';
    const defR = 'Voters are grouped by their primary history over the last four election cycles: Democratic (voted only in Democratic primaries, or in both with the most recent Democratic), Republican (the same for Republican primaries), or neither (general elections only, or no vote history).';
    const defV = 'Voters are grouped by primary history since 2022: Democratic (voted only in Democratic primaries), Republican (only Republican primaries), or neither (no primary since 2022).';
    $('#ry-sub').innerHTML = `Early voters across Texas, by primary history. Pick the state, a county${vk.length ? ' or a district' : ''}, then set how each group votes.${hasRy ? ` Statewide and county data: <b>Ryan Data &amp; Research (Derek Ryan)</b>, through Day ${RY.day}${thr ? ` (${thr})` : ''}.` : ''}`;
    const names = Object.keys(RY.counties || {}).sort();
    $('#ry-sel').innerHTML = (RY.state ? '<option value="s:">Statewide</option>' : '')
      + (names.length ? `<optgroup label="Counties">${names.map(n => `<option value="c:${esc(n)}">${esc(n)} County</option>`).join('')}</optgroup>` : '')
      + vk.map(k => `<optgroup label="${KN[k]}s">${Object.keys(VN[k].districts).sort((a, b) => a - b).map(d => `<option value="${k}:${d}">${KN[k]} ${d}</option>`).join('')}</optgroup>`).join('');
    const draw = () => {
      const [t, k] = $('#ry-sel').value.split(/:(.*)/s); let g, where, line, note;
      if (t === 's' || t === 'c') {
        g = t === 's' ? RY.state : RY.counties[k]; if (!g) return;
        where = t === 's' ? 'across Texas' : `in ${esc(k)} County`;
        line = `<b class="num">${fmtN(g.votes)}</b> early votes cast of <b class="num">${fmtN(g.reg)}</b> registered voters (${pc1(g.votes / g.reg)}) ${t === 's' ? 'statewide' : 'in ' + esc(k) + ' County'}, through Day ${RY.day}.`;
        note = `Source: Ryan Data &amp; Research (Derek Ryan), public Early Voting Report and Statewide Early Voters by County, Day ${RY.day}${thr ? `, through ${thr}` : ''}. Ryan Data’s reports run about a day behind this page’s Tarrant County figures, and they define primary history over four cycles, so their Tarrant numbers differ from the Tarrant sections above.${t === 'c' && g.exact === false ? ' This county’s figures are built from whole-percent shares, so each group can be off by up to half a point.' : ''}`;
        g = Object.assign({}, g, { def: defR, thr });
      } else {
        const V = VN[t], L = V.districts[k], vt = L[0] + L[1] + L[2], vthr = dlab(V.through);
        g = { lean: L, def: defV, thr: vthr }; where = `in ${KN[t]} ${k}`;
        line = `<b class="num">${fmtN(vt)}</b> early voters with records in VoteBuilder for ${KN[t]} ${k}, through ${vthr}.`;
        note = `Source: ${esc(VN.credit || 'VoteBuilder (VAN)')}, through ${vthr}. VoteBuilder’s early-vote records can lag the counties’ own counts, and voters who have voted in both parties’ primaries may not be counted in either party group.`;
      }
      $('#ry-box').innerHTML = `<p class="note" style="margin:0 0 4px">${line}</p>` + scenarioHtml(g.lean, { where, through: g.thr, def: g.def });
      $('#ry-note').innerHTML = note; scenarioInit(); };
    $('#ry-sel').onchange = draw; draw();
  })();
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
      const head = all ? '<th class="r">Voted</th><th class="r">Share of voters</th><th class="r">Share of active voters</th><th class="r">Turnout</th>'
                       : '<th class="r">Voters</th><th class="r">Share of these voters</th><th class="r">Share of all 2026 voters</th><th class="r">Share of active voters</th>';
      return `<div style="overflow-x:auto"><table class="ntab race-tab" style="white-space:nowrap"><thead><tr><th>Group</th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    };
    const DD = SF.dd, n = DD && DD.age ? DD.age.length - 1 : 0, pick = i => ({ age: DD.age[i], sex: DD.sex[i], race: DD.race && DD.race[i] });
    const opts = [['all', 'All 2026 voters', view(SF, true)]];
    for (let i = n; i >= 1; i--) if (T(DD.age[i]) > 1) opts.push([String(i), i > 12 ? 'Election Day, Tue Nov 3: in person' : `Day ${i}, ${dlb(i - 1)}: in person`, view(pick(i), false)]);
    if (n && T(DD.age[0]) > 1) opts.push(['0', 'Mail ballots', view(pick(0), false)]);
    if (SF.lean) opts.splice(1, 0, ...[['D', 'Democratic primary voters'], ['none', 'Neither: no primary since 2022'], ['R', 'Republican primary voters']]
      .filter(([k]) => SF.lean[k] && SF.lean[k].n).map(([k, l]) => { const x = SF.lean[k]; return ['l' + k, `${l} (all 2026 voters)`, view({ age: x.age, sex: x.sex, race: x.race }, false)]; }));
    const id = 'dm' + Math.random().toString(36).slice(2, 7);
    return `<h3 style="margin:22px 0 4px">${o.title}</h3>
      ${opts.length > 1 ? `<label class="note" style="display:block;margin:4px 0 8px">Show <select id="${id}" data-dm="${id}" style="font:inherit;margin-left:4px">${opts.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>` : ''}
      ${opts.map(([k, , h], i) => `<div data-dmv="${id}" data-k="${k}"${i ? ' hidden' : ''}>${h}</div>`).join('')}
      <p class="note">“All 2026 voters” compares each group’s share of the voters with its share of active voters: a group whose share of voters is bigger turned out ahead of the rest. Pick a day to see only the people who voted in person that day (or on Election Day), next to the share among all 2026 voters.${SF.lean ? ' The primary-history choices cover every 2026 voter in that group, early, mail and Election Day, by the most recent party primary they chose since 2022.' : ''}${rc ? ' Race and ethnicity are estimates, rounded to the nearest 10.' : ''} Counts under 10 are withheld.${o.note || ''}</p>`;
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
    $('#who-h').textContent = F ? 'Who voted' : `Who has voted so far: ${pc1(WA.dropoff / WA.n)} sat out the 2022 midterm, then voted in 2024, and ${pc1(WA.new22 / WA.n)} registered since 2022`;
    $('#who-sub').textContent = `The ${fmtN(WA.voters)} voters on the county’s lists of ${kinds.map(k => k === 'mail' ? 'returned mail ballots' : k === 'election day' ? 'Election Day voters' : 'early voters').join(', ').replace(/, ([^,]*)$/, ' and $1')}${WA.through ? ` through ${dlab(WA.through)}` : ''}, matched to the voter file by state voter ID (${fmtN(WA.n)} found). Each voter is counted once.`;
    $('#who-kv').innerHTML = [
      ['Sat out the 2022 midterm, then voted in 2024', WA.dropoff, REG.dropoff],
      ['Registered since the 2022 midterm', WA.new22, REG.new22],
      ['On the rolls in 2022 but did not vote', WA.skipped22, REG.skipped22],
    ].map(([l, v, rv]) => `<li><span>${l} <small>all registered: ${pc1(rv / REG.n)}</small></span><span>${pc1(v / WA.n)}</span></li>`).join('') +
      `<li class="kv-h"><span><b>How they voted</b></span><span></span></li>` +
      kinds.map(k => `<li><span>${k === 'mail' ? 'Mail ballots' : k === 'election day' ? 'Election Day in person' : 'Early in person'}</span><span>${fmtN(W.rosters[k].voters)}</span></li>`).join('');
    if (F) {      // after the election: just how they voted (the voting-history table below has the detail)
      $('#who-two').outerHTML = `<div class="panel" style="max-width:560px"><h3>How they voted</h3><ul class="kv">${kinds.map(k => `<li><span>${k === 'mail' ? 'Mail ballots' : k === 'election day' ? 'Election Day in person' : 'Early in person'}</span><span>${fmtN(W.rosters[k].voters)}</span></li>`).join('')}</ul>
        <p class="note">District pages show 2026 turnout for every precinct, district, city and school district. <a href="../electorate/index.html">The Electorate ›</a></p></div>${SHOW_SUB && W.sub ? '<div id="sub-box"></div>' : ''}`;
      if (SHOW_SUB && W.sub) subGrid(W.sub, $('#sub-box'));
    }
    // primary history: secondary, with its caveat
    const row = (lab, p) => { const t = p.n || 1, seg = (v, col, txt) => v > 0 ? `<div class="sb-seg" style="flex:${v / t} 1 0;background:${col};color:${col === 'var(--grid)' ? 'var(--ink)' : '#fff'}">${v / t >= .12 ? txt + ' ' + Math.round(v / t * 100) + '%' : ''}</div>` : '';
      return `<div class="sb-row"><div class="sb-label"><b>${esc(lab)}</b><span class="num">${fmtN(p.n)} · ${gtxt(gap(p))}</span></div><div class="sb-track" style="height:22px">${seg(p.lean[0], 'var(--dem)', 'D')}${seg(p.lean[2], 'var(--grid)', 'Neither')}${seg(p.lean[1], 'var(--rep)', 'R')}</div></div>`; };
    $('#who').innerHTML = `<p class="note" style="margin:0">By primary history: the most recent party primary each voter chose since 2022. A primary ballot is not a November vote, and the large 2026 Democratic primary makes every 2026 group look more Democratic on this measure.</p>` +
      row(F ? 'All 2026 voters' : '2026 so far', WA) + kinds.filter(() => kinds.length > 1).map(k => row(`2026 ${k === 'mail' ? 'mail' : k === 'election day' ? 'Election Day in person' : 'early in person'}`, W.rosters[k])).join('') +
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
      $('#bloc').innerHTML = `<thead><tr><th>Group</th><th class="r">Registered</th><th class="r">Voted</th><th class="r">Of voters</th><th class="r">Of registered</th><th class="r">${F ? 'Turnout' : 'Turnout so far'}</th></tr></thead><tbody>${
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
      $('#bloc-pies').innerHTML = pie(WA, F ? 'Voted in 2026' : 'Voted so far', 168) + pie(REG, 'All registered', 132) +
        `<ul class="kv" style="flex:1 1 260px;margin:0">${BIG.map(([l, ks, col]) => `<li><span><i class="sw" style="background:${col}"></i> ${l}</span><span><b class="num">${pc1(sumK(WA, ks) / WA.n)}</b> <small>of registered: ${pc1(sumK(REG, ks) / REG.n)}</small></span></li>`).join('')}</ul>`;
      $('#bloc-wrap').hidden = false;
    }
    if (W.neither && W.neither.series.length && !EVDONE) drawNei();
    if (W.neither && (W.neither.daily || []).length) drawLean();
    $('#scen').innerHTML = scenarioHtml(WA.lean, { where: 'across Tarrant County', through: WA.through ? dlab(WA.through) : '', gx: (() => { const R3 = D.final && D.final.races3 || [], m = nm => { const T = R3.find(x => x.contest === nm); if (!T) return null; const d = T.cands.find(x => x[1] === 'DEM'), r = T.cands.find(x => x[1] === 'REP'); return d && r ? (d[2] - r[2]) / (d[2] + r[2]) * 100 : null; }; const g = m('Governor'), c = m('County Judge'); return g != null && c != null ? g - c : null; })(), actual: (() => { const T = D.final && D.final.top_race; if (!T) return null; const d = T.cands.find(x => x[1] === 'DEM'), q = T.cands.find(x => x[1] === 'REP'); return d && q ? [T.contest, d[2] / (d[2] + q[2])] : null; })() }); scenarioInit();
    if (W.demo) $('#demo-day').innerHTML = demoDayHtml(W.demo, W.demo.base, W.demo.age_bands, { title: F ? 'Who voted, day by day: age, sex and race' : 'Who has voted, day by day: age, sex and race', note: ' Measured against active registered voters plus anyone who voted.' });
    if ($('#who-comm')) $('#who-comm').innerHTML = `<thead><tr><th>Pct</th><th class="r">Voted</th><th class="r">Lean</th><th class="r">2022 early + mail</th></tr></thead><tbody>${['01', '02', '03', '04'].map(c => {
      const a = WA.comm[c], t = a[0] + a[1] + a[2], b = ref && ref.comm[c], tb = b ? b[0] + b[1] + b[2] : 0;
      return `<tr><td>${+c}</td><td class="r num">${fmtN(t)}</td><td class="r num">${t ? gtxt((a[0] - a[1]) / t * 100) : '—'}</td><td class="r num">${tb ? gtxt((b[0] - b[1]) / tb * 100) : '—'}</td></tr>`; }).join('')}</tbody>`;
  }

  const drawAll = () => { draw(); drawDays(); if (SY.length) drawTx(); if (STY.length >= 2) siteTable(); if (C.who && C.who.neither && C.who.neither.series.length && !EVDONE) drawNei(); if (C.who && C.who.neither && (C.who.neither.daily || []).length) drawLean(); };


  // ---------- ballot roll-off: how many voters skip down-ballot races, by party, turned into votes
  (function () {
    const RO = D.rolloff; if (!RO || !RO.g24) return;
    const avg = (k, kind, f) => { const c = (RO[k] ? RO[k].contests : []).filter(x => x.kind === kind); return c.length ? c.reduce((a, x) => a + x[f], 0) / c.length : null; };
    const g = { c24: [avg('g24', 'county', 'd_skip'), avg('g24', 'county', 'r_skip')], s24: [avg('g24', 'state', 'd_skip'), avg('g24', 'state', 'r_skip')],
                c22: [avg('g22', 'county', 'd_skip'), avg('g22', 'county', 'r_skip')], s22: [avg('g22', 'state', 'd_skip'), avg('g22', 'state', 'r_skip')] };
    const net24 = avg('g24', 'county', 'net'), net22 = avg('g22', 'county', 'net');
    const R26 = RO.g26 && RO.g26.contests.length ? RO.g26 : null, c26 = R26 ? [avg('g26', 'county', 'd_skip'), avg('g26', 'county', 'r_skip')] : null, net26 = R26 ? avg('g26', 'county', 'net') : null;
    const p = v => (v * 100).toFixed(1) + '%', per = v => fmtN(Math.round(v * 100000 / 100) * 100);
    $('#rof-sec').hidden = false;
    $('#rof-h').textContent = c26 ? (c26[0] <= c26[1] * 1.1 ? `Finish the ballot: in 2024, Democratic voters skipped county races twice as often as Republicans. In 2026, the gap closed`
                                                          : `Finish the ballot: Democratic voters still skipped county races more often than Republicans in 2026`)
                                 : `Finish the ballot: in 2024, Democratic voters skipped county races about twice as often as Republican voters`;
    $('#rof-sub').innerHTML = `Texas ended straight-ticket voting in 2020, so every race has to be marked on its own. Some voters stop after the top races. In 2024, for every 100,000 people who voted for Kamala Harris, about <b class="num">${per(g.c24[0])}</b> skipped a typical contested county race; for every 100,000 Donald Trump voters, about <b class="num">${per(g.c24[1])}</b> did. That gap cost Democratic county candidates about <b class="num">${fmtN(Math.round(net24 / 100) * 100)}</b> net votes in each race.${c26 ? ` In 2026 (unofficial), about <b class="num">${per(c26[0])}</b> of every 100,000 Alisa Simmons voters for County Judge skipped a typical contested county race further down, against <b class="num">${per(c26[1])}</b> of every 100,000 Tim O’Hare voters. ${Math.abs(net26) < 1000 ? `That’s close to even: about <b class="num">${fmtN(Math.round(Math.abs(net26) / 10) * 10)}</b> net votes per race ${net26 >= 0 ? 'lost by' : 'gained by'} Democratic candidates.` : `That cost Democratic candidates about <b class="num">${fmtN(Math.round(net26 / 100) * 100)}</b> net votes per race.`}` : ''}`;
    const bar = (lab, a) => { const mx = 0.08; return `<div class="sb-row"><div class="sb-label"><b>${lab}</b><span class="num">D ${p(a[0])} · R ${p(a[1])}</span></div>
      <div style="display:grid;gap:3px"><div class="sb-track" style="height:14px;background:none"><div class="sb-seg" style="flex:0 0 ${Math.min(100, a[0] / mx * 100)}%;background:var(--dem)" title="Democratic top-of-ticket voters who skipped: ${p(a[0])}"></div></div>
      <div class="sb-track" style="height:14px;background:none"><div class="sb-seg" style="flex:0 0 ${Math.min(100, a[1] / mx * 100)}%;background:var(--rep)" title="Republican top-of-ticket voters who skipped: ${p(a[1])}"></div></div></div></div>`; };
    $('#rof-bars').innerHTML = `<p class="note" style="margin:0 0 6px">Share of each side’s top-of-ticket voters who skipped the race (blue: Democratic; red: Republican)</p>`
      + [...(c26 ? [['2026 · contested county races (unofficial; County Judge voters)', c26]] : []), ['2024 · contested county races (Sheriff, Tax Assessor, judges)', g.c24], ['2024 · statewide courts and Railroad Commissioner', g.s24], ['2022 · county races', g.c22], ['2022 · statewide offices and courts', g.s22]].filter(([, a]) => a[0] != null).map(([l, a]) => bar(l, a)).join('');
    // 2026: turn the rates into votes at this year's projected turnout
    const Yr = Y.filter(y => y.rows && y.rows[11] && y.final_total), lt = C.rows.length >= 12 ? C.rows[11].total : null;
    let lo = null, hi = null;
    if (lt && Yr.length) { const est = Yr.map(y => lt / (y.rows[11].total / y.final_total)); lo = Math.min(...est); hi = Math.max(...est); }
    const gap24 = g.c24[0] - g.c24[1], gap22 = g.c22[0] != null ? g.c22[0] - g.c22[1] : null;
    $('#rof-2026').innerHTML = c26 ? `<h3 style="margin-top:0">What it meant this year</h3>
      <ul class="kv" style="margin:6px 0 0">
        <li><span>Ballots that skipped a typical contested county race</span><span class="num"><b>${p(avg('g26', 'county', 'rolloff'))}</b></span></li>
        <li><span>Simmons voters who skipped one further down</span><span class="num"><b>${p(c26[0])}</b> <small>(2024 Harris voters: ${p(g.c24[0])})</small></span></li>
        <li><span>O’Hare voters who skipped one further down</span><span class="num"><b>${p(c26[1])}</b> <small>(2024 Trump voters: ${p(g.c24[1])})</small></span></li>
        <li><span>Net cost to Democratic candidates, per race</span><span class="num"><b>${net26 >= 0 ? fmtN(Math.round(net26 / 10) * 10) : `none (a gain of ${fmtN(Math.round(-net26 / 10) * 10)})`}</b> <small>(2024: ${fmtN(Math.round(net24 / 100) * 100)})</small></span></li>
      </ul>
      <p class="note" style="margin-bottom:0">In 2026 the yardstick is the County Judge race, the countywide race with the most votes, so the rates measure County Judge voters who left a later race blank. In 2024 it was the presidential race, which more casual voters fill in and then stop, so the two years are not measured on exactly the same scale. Still, the party gap that cost Democrats about ${fmtN(Math.round(net24 / 100) * 100)} votes a race in 2024 mostly disappeared.</p>` : lo ? `<h3 style="margin-top:0">What it could mean this year</h3>
      <p style="margin:6px 0">With about <b class="num">${fmtN(Math.round(lo / 1000) * 1000)}–${fmtN(Math.round(hi / 1000) * 1000)}</b> Tarrant County voters expected in 2026, the gap works out to:</p>
      <ul class="kv" style="margin:0">
        <li><span>If voters skip county races the way they did in <b>2024</b></span><span class="num"><b>${fmtN(Math.round(gap24 * lo / 2 / 100) * 100)}–${fmtN(Math.round(gap24 * hi / 2 / 100) * 100)}</b> net votes</span></li>
        ${gap22 != null ? `<li><span>If they skip the way they did in <b>2022</b></span><span class="num"><b>${fmtN(Math.round(gap22 * lo / 2 / 100) * 100)}–${fmtN(Math.round(gap22 * hi / 2 / 100) * 100)}</b> net votes</span></li>` : ''}
      </ul>
      <p class="note" style="margin-bottom:0">Per race, lost by Democratic candidates, assuming the top of the ticket splits about evenly. In a close commissioner, House or judicial race, that can be the whole margin.</p>`
      : `<p style="margin:0">At 2024’s rates, every 100,000 Democratic voters lose about ${fmtN(Math.round(gap24 * 100000 / 100) * 100)} net votes per county race to skipping.</p>`;
    const rows = [];
    ['g26', 'g24', 'g22'].forEach(k => (RO[k] ? RO[k].contests : []).forEach(x => rows.push([k === 'g26' ? '2026*' : k === 'g24' ? 2024 : 2022, x])));
    $('#rof-tab').innerHTML = `<thead><tr><th>Year</th><th>Race</th><th class="r">Ballots that skipped it</th><th class="r">D voters who skipped</th><th class="r">R voters who skipped</th><th class="r">Net cost to D</th></tr></thead><tbody>${rows.map(([y, x]) => `<tr><td>${y}</td><td>${esc(x.contest)}</td><td class="r num">${p(x.rolloff)}</td><td class="r num">${p(x.d_skip)}</td><td class="r num">${p(x.r_skip)}</td><td class="r num">${x.net >= 0 ? '' : '−'}${fmtN(Math.abs(x.net))}</td></tr>`).join('')}</tbody>`;
    $('#rof-note').textContent = `How this is measured: the county’s precinct canvass for Nov 2022 and Nov 2024, and its unofficial election-night results by precinct for Nov 2026 (marked *). “Ballots that skipped it” is ballots cast minus votes in the race. Who skipped is estimated by comparing precincts: where a precinct’s reference vote (Governor in 2022, President in 2024, County Judge in 2026) was more Democratic, more ballots left the race blank. These are estimates for groups of voters, not counts of individuals. Only countywide races with both a Democrat and a Republican are included; in races with only a Republican on the ballot, most Democratic voters leave it blank.`;
  })();
  // ---------- after early voting: projection, who's left, Election Day sites, collapsed daily detail
  if (EVDONE) (function () {
    const sec = id => app.querySelector(`section[aria-labelledby="${id}"]`);
    // projection
    if (proj) {
      $('#proj-sec').hidden = false;
      $('#proj-sub').textContent = `Through the 12 days of early voting, ${fmtN(last.total)} ballots are in. Here is what the final count would be if early voting makes up the same share of the total as in each past election.`;
      $('#proj-tab').innerHTML = `<thead><tr><th>If 2026 follows</th><th class="r">Early share of the final vote</th><th class="r">Final vote that year</th><th class="r">Implied 2026 final</th><th class="r">Implied 2026 turnout</th></tr></thead><tbody>${proj.rows.map(r => `<tr><td>${r.year}</td><td class="r num">${Math.round(r.share * 100)}%</td><td class="r num">${fmtN(r.final)} <small>(${pc1(r.final / r.reg)})</small></td><td class="r num"><b>${fmtN(Math.round(r.est / 1000) * 1000)}</b></td><td class="r num">${pc1(r.est / C.registered)}</td></tr>`).join('')}</tbody>`;
      if (F) { $('#proj-h').textContent = 'How the final count compares with what the early vote pointed to';
        $('#proj-sub').textContent = `After early voting closed, the pattern of past elections pointed to a final count between ${fmtN(Math.round(proj.lo / 1000) * 1000)} and ${fmtN(Math.round(proj.hi / 1000) * 1000)}. The unofficial count is ${fmtN(F.ballots)}, ${F.ballots < proj.lo ? 'below that range: Election Day added less than in any of those years' : F.ballots > proj.hi ? 'above that range' : 'inside that range'}.`;
        $('#proj-tab').insertAdjacentHTML('beforeend', `<tfoot><tr><td><b>Actual, 2026 (unofficial)</b></td><td class="r num"><b>${Math.round(last.total / F.ballots * 100)}%</b></td><td class="r num"></td><td class="r num"><b>${fmtN(F.ballots)}</b></td><td class="r num"><b>${pc1(F.ballots / C.registered)}</b></td></tr></tfoot>`);
        $('#proj-note').textContent = `Unofficial: the county’s election-night count, which can still change slightly in the canvass (late mail and provisional ballots). Turnout uses the county’s count of active registered voters (${fmtN(C.registered)}); the county’s results report lists ${fmtN(F.registered_county)} registered, counting voters on the suspense list, which puts turnout at ${pc1(F.ballots / F.registered_county)}.`; }
      else $('#proj-note').textContent = 'An estimate, not a forecast: it assumes Election Day adds the same share as in a past year. Early voting includes mail ballots received by the last day of early voting; a few more mail ballots will still arrive. Turnout uses the county’s registered-voter count.';
    }
    // who's left
    const L = C.who && C.who.left, WA = C.who && C.who.all;
    if (L && L.total && !F) {          // once the results are in, "who hasn't voted yet" is moot
      $('#left-sec').hidden = false;
      const tl = L.likely ? L.likely.reduce((a, v) => a + v, 0) : 0;
      $('#left-h').textContent = `${fmtN(L.total)} active voters haven’t voted yet${tl ? `; about ${fmtN(Math.round(tl / 1000) * 1000)} of them are likely to, judging by their voting records` : ''}`;
      $('#left-sub').textContent = 'Active registered voters not on the county’s lists of early and mail voters, by the most recent party primary they chose since 2022. “Likely” weights each voter by a turnout score built from their past voting (internal model), so it is an expected number, not a count of people.';
      const row = (lab, a, id) => { const t = a[0] + a[1] + a[2] || 1, parts = [['Democratic primary', a[0], 'var(--dem)', 'D'], ['Neither', a[2], 'var(--grid)', 'Neither'], ['Republican primary', a[1], 'var(--rep)', 'R']];
        const seg = ([nm, v, col, txt]) => v > 0 ? `<div class="sb-seg" style="flex:${v / t} 1 0;background:${col};color:${col === 'var(--grid)' ? 'var(--ink)' : '#fff'}" title="${nm}: ${fmtN(v)} (${pc1(v / t)})">${v / t >= .1 ? txt + ' ' + Math.round(v / t * 100) + '%' : ''}</div>` : '';
        const detail = parts.map(([nm, v]) => `${nm} <b class="num">${fmtN(v)}</b> (${pc1(v / t)})`).join(' · ');
        return `<div class="sb-row" style="cursor:pointer" data-lb="${id}"><div class="sb-label"><b>${lab}</b><span class="num">${fmtN(t)}</span></div><div class="sb-track" style="height:22px">${parts.map(seg).join('')}</div>
          <p class="note" data-lbd="${id}" hidden style="margin:4px 0 0">${detail}</p></div>`; };
      $('#left-bars').innerHTML = (WA ? row('Already voted', WA.lean, 'a') : '') + row('Not yet voted, all', L.lean, 'b') + (L.likely ? row('Not yet voted, likely to vote (weighted)', L.likely, 'c') : '');
      $('#left-bars').querySelectorAll('[data-lb]').forEach(r => { const d = r.querySelector('[data-lbd]'); r.onclick = () => { d.hidden = !d.hidden; }; r.onmouseenter = () => { d.hidden = false; }; r.onmouseleave = () => { if (!r.dataset.pin) d.hidden = true; };
        r.addEventListener('click', () => { r.dataset.pin = d.hidden ? '' : '1'; }); });
      if (L.comm) $('#left-comm').innerHTML = `<thead><tr><th>Pct</th><th class="r">Not yet voted</th><th class="r">Likely to vote (weighted)</th></tr></thead><tbody>${Object.entries(L.comm).map(([c, v]) => `<tr><td>${+c}</td><td class="r num">${fmtN(v.n[0] + v.n[1] + v.n[2])}</td><td class="r num">${fmtN(v.likely[0] + v.likely[1] + v.likely[2])}</td></tr>`).join('')}</tbody>`;
      $('#left-note').textContent = 'Groups are based on past primary voting, not on how anyone will vote on Tuesday. “Neither” voters have no primary record since 2022 and can go either way. Only totals are published.';
    }
    // Election Day sites
    const ES = D.ed_sites;
    if (ES && ES.top && !F) {          // planning section: dropped once results are in
      $('#eds-sec').hidden = false;
      const cl24 = ES.closed.filter(x => x.open_2024), v24 = cl24.reduce((a, x) => a + (x.ed_votes_2024 || 0), 0);
      const EDn = F && C.who && C.who.rosters && C.who.rosters['election day'] ? C.who.rosters['election day'].voters : null, EV_ = ES.ed_votes || {}, NS_ = ES.n_sites || { 2022: 316, 2024: 349 };
      const perSite = y => EV_[y] && NS_[y] ? Math.round(EV_[y] / NS_[y]) : null;
      $('#eds-h').textContent = EDn ? `Fewer Election Day sites, busier lines: about ${fmtN(Math.round(EDn / ES.n2026))} voters per vote center, against ${fmtN(perSite(2024) || 466)} in 2024`
                                    : `${ES.n2026} Election Day vote centers this year, down from 349 in 2024 and 316 in 2022`;
      $('#eds-sub').innerHTML = EDn ? `Tarrant County opened <b class="num">${ES.n2026}</b> Election Day vote centers, down from ${NS_[2024]} in 2024 and ${NS_[2022]} in 2022. <b class="num">${fmtN(EDn)}</b> people voted in person on Election Day (the county’s voter list, unofficial), about <b class="num">${fmtN(Math.round(EDn / ES.n2026))}</b> per site, against about ${fmtN(perSite(2024) || 466)} per site in 2024 and ${fmtN(perSite(2022) || 570)} in 2022. ${cl24.length} of the 2024 sites were not open this year; they handled <b class="num">${fmtN(v24)}</b> Election Day votes in 2024.`
      : `On Election Day you can vote at any vote center in the county. ${cl24.length} of the 2024 sites are not open this year; they handled <b class="num">${fmtN(v24)}</b> Election Day votes in 2024. The Commissioners Court approved this year’s list 3–2 on Sept. 1, 2026 (County Judge Tim O’Hare and Commissioners Matt Krause and Manny Ramirez for; Commissioners Roderick Miles and Alisa Simmons against).`;
      if (EDn) { $('#eds-top-h').textContent = 'The 15 sites we expected to be busiest on Election Day'; $('#eds-cl-h').textContent = 'The busiest 2024 Election Day sites that were closed this year'; }
      $('#eds-top').innerHTML = `<thead><tr><th>Site</th><th>City</th><th class="r">Load index</th><th class="r">2024 Election Day votes here</th><th class="r">From closed sites nearby</th><th class="r">2026 early votes here</th></tr></thead><tbody>${ES.top.slice(0, 15).map(r => `<tr><td>${esc(r.site)}${r.status === 'new for 2026' ? ' <small>(new)</small>' : ''}</td><td>${esc(r.city)}</td><td class="r num"><b>${(r.load_index || 0).toFixed(2)}</b></td><td class="r num">${r.ed_2024_here == null ? '—' : fmtN(r.ed_2024_here)}</td><td class="r num">${r.inherited_2024_ed_votes ? fmtN(r.inherited_2024_ed_votes) : '—'}</td><td class="r num">${r.ev_votes_so_far == null ? '—' : fmtN(r.ev_votes_so_far)}</td></tr>`).join('')}</tbody>`;
      $('#eds-closed').innerHTML = `<thead><tr><th>Closed site</th><th>City</th><th class="r">2024 Election Day votes</th><th>Nearest open site now</th><th class="r">Miles away</th></tr></thead><tbody>${cl24.sort((a, b) => (b.ed_votes_2024 || 0) - (a.ed_votes_2024 || 0)).slice(0, 12).map(r => `<tr><td>${esc(r.site)}</td><td>${esc(r.city)}</td><td class="r num">${fmtN(r.ed_votes_2024 || 0)}</td><td>${esc(r.nearest_2026_site)}</td><td class="r num">${(+r.miles_to_nearest_2026).toFixed(1)}</td></tr>`).join('')}</tbody>`;
      const ad = ES.added || {}, far = (ad['1 to 2 mi'] || 0) + (ad['more than 2 mi'] || 0), some = (ad['up to 0.5 mi'] || 0) + (ad['0.5 to 1 mi'] || 0);
      $('#eds-note').innerHTML = `Load index: 1.00 is an average site. It blends each site’s 2024 Election Day votes plus those of closed sites nearest it (40%), the voters living nearest it who had not voted yet, weighted by how likely they are to vote (40%), and its 2026 early votes (20%). Distances are straight-line miles. Compared with 2024, about ${fmtN(Math.round(some / 1000) * 1000)} active voters now live up to a mile farther from their nearest Election Day site and ${fmtN(Math.round(far / 100) * 100)} more than a mile farther. Sources: Tarrant County Elections vote center lists and Election Day counts by location (2022, 2024), 2026 vote center list; The Texan (Sept. 1, 2026).`;
    }
    // daily detail: hidden until asked for; mail folded into the scorecard; voting-history groups collapsed
    $('#dd-sec').hidden = false;
    ['day-h', 'tab-h', 'site-h'].forEach(id => { const x = sec(id); if (x) { x.dataset.dd = x.hidden ? 'off' : 'on'; x.hidden = true; } });
    const mail = sec('mail-h'); if (mail) mail.hidden = true;
    $('#dd-btn').onclick = () => { const show = $('#dd-btn').textContent.startsWith('Show');
      ['day-h', 'tab-h', 'site-h'].forEach(id => { const x = sec(id); if (x && x.dataset.dd === 'on') x.hidden = !show; });
      $('#dd-btn').textContent = show ? 'Hide the daily detail' : 'Show the daily detail'; if (show) { drawDays(); if (STY.length >= 2) siteTable(); } };
    const bw = $('#bloc-wrap'); if (bw && !bw.hidden) { const d = document.createElement('details'); d.innerHTML = '<summary style="cursor:pointer;font-weight:600;margin:22px 0 4px">By voting history, 2018 to 2026 (show)</summary>'; bw.parentNode.insertBefore(d, bw); d.appendChild(bw); const h = bw.querySelector('h3'); if (h) h.style.display = 'none'; }
  })();
  drawAll();
  let rt; if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(drawAll, 80); }).observe(app);
})();
