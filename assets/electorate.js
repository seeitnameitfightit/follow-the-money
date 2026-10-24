/* The Electorate: renders the countywide profile, the directory and each district profile
   from the JSON embedded in the page (built by build_electorate.py). Totals only; no voter records. */
(function () {
  const ASSET = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');
  const LOGO = ASSET + 'sinifi-logo.png';
  const MARK = `<div class="mark"><img src="${LOGO}" alt="" width="22" height="18">See It. Name It. Fight It. · data.seeitnameitfightit.com</div>`;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dlabel = s => { const [y, m, d] = s.split('-'); return `${MONTHS[+m - 1]} ${+d}, ${y}`; };
  const n0 = v => (v == null ? 0 : v);                                   // null = a count under 10, withheld
  const fmtN = v => v == null ? 'fewer than 10' : Math.round(v).toLocaleString('en-US');
  const fmtS = v => v == null ? '<10' : Math.round(v).toLocaleString('en-US');
  const fmtK = v => { const a = Math.abs(v); if (a >= 1e6) return (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M'; if (a >= 1e4) return Math.round(v / 1e3) + 'K'; return Math.round(v).toLocaleString('en-US'); };
  const P = (a, b) => (b ? n0(a) / b : 0);
  const pc = (a, b) => b && a != null ? Math.round(n0(a) / b * 100) + '%' : '—';
  const pc1 = x => (x * 100).toFixed(1).replace(/\.0$/, '') + '%';
  const money = v => '$' + (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2));
  function tipPos(tip, box, x, y) { const w = box.clientWidth, tw = tip.offsetWidth; let l = x + 14; if (l + tw > w) l = x - tw - 14; if (l < 0) l = 0; tip.style.left = l + 'px'; tip.style.top = Math.max(0, y - 10) + 'px'; }
  const niceMax = v => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };

  const el = $('#electorate-data'); if (!el) return;
  const D = JSON.parse(el.textContent), M = D.meta, E = M.elections, G = D.geo, CTY = D.county || null;
  const isCounty = G.slug === 'tarrant', up = isCounty ? '../' : '../../';
  setTimeout(() => { const app = $('#app'); if (app && !app.querySelector('.brand')) app.insertAdjacentHTML('afterbegin', `<a class="brand" href="https://seeitnameitfightit.com" target="_blank" rel="noopener"><img src="${LOGO}" alt="See It. Name It. Fight It." width="64" height="52"></a>`); }, 0);

  const T = G.turnout, g22 = T.g22, g24 = T.g24, p26 = T.p26;
  const where = isCounty ? 'Tarrant County' : (G.partial ? `the Tarrant County part of ${G.name}` : G.name);
  const Where = where.charAt(0).toUpperCase() + where.slice(1);
  const ty = G.types, newTot = n0(ty[4]) + n0(ty[5]);

  // ---------- headline
  const h1 = `${fmtN(ty[3])} registered voters in ${where} sat out both of the last two November elections`;
  const dl = n0(p26.d) >= n0(p26.r);
  let dek = `In the March 2026 primaries, ${dl ? 'Democratic' : 'Republican'} ballots outnumbered ${dl ? 'Republican' : 'Democratic'} ballots <b class="num">${fmtN(dl ? p26.d : p26.r)}</b> to <b class="num">${fmtN(dl ? p26.r : p26.d)}</b>.`;
  if (newTot) dek += ` Since the 2022 midterm, <b class="num">${fmtN(newTot)}</b> people have registered here, and ${pc(ty[5], newTot)} of them have not voted yet.`;

  const tile = (v, l) => `<div><b class="num">${v}</b><span>${l}</span></div>`;
  const tiles = [
    tile(fmtK(G.reg), 'active registered voters'),
    tile(pc(g22.voted, g22.elig), 'voted in the Nov 2022 midterm'),
    tile(pc(g24.voted, g24.elig), 'voted in the Nov 2024 presidential'),
    tile(fmtK(n0(G.inactive)), 'on the suspense list, not counted here'),
    tile(fmtK(newTot), 'registered since Nov 2022'),
    tile(fmtK(G.reg + n0(G.inactive)), 'on the rolls, counting suspense'),
  ].join('');

  const partialNote = G.partial ? `<section class="notes"><p>${esc(G.name)} reaches beyond Tarrant County. This page covers only the voters on the Tarrant County rolls.</p></section>` : '';
  const crumb = isCounty ? `<p class="crumb"><a href="../index.html">Home</a></p>` : `<p class="crumb"><a href="../../index.html">Home</a> › <a href="../index.html">The Electorate</a></p>`;

  // ---------- races on the ballot here
  const raceCards = (D.races || []).map(r => {
    const per = !G.partial && G.reg ? ` · ${money(r.r[1] / G.reg)} vs. ${money(r.d[1] / G.reg)} cash per registered voter` : '';
    return `<li><a href="${up}races/${r.slug}/index.html"><b>${esc(r.office)}</b><small>${esc(r.r[0])} (R) vs. ${esc(r.d[0])} (D)${per}</small></a></li>`;
  }).join('');

  // ---------- official precinct results
  const lastName = nm => nm.replace(/,?\s+(Jr\.?|Sr\.?|III|II|IV)$/i, '').split(' ').pop();
  const split = c => { const t = c.total || 1, r = c.cands.find(x => x[1] === 'REP'), d = c.cands.find(x => x[1] === 'DEM'), oth = c.cands.filter(x => x[1] !== 'REP' && x[1] !== 'DEM');
    const ov = oth.reduce((a, x) => a + x[2], 0), ol = oth.length === 1 && oth[0][0] !== 'Others' ? `${lastName(oth[0][0])} (${oth[0][1] || 'other'})` : 'Others';
    return { r, d, rs: r ? r[2] / t : 0, ds: d ? d[2] / t : 0, os: ov / t, ol }; };
  const marg = c => { const top = c.cands.filter(x => x[0] !== 'Others').sort((a, b) => b[2] - a[2]); if (top.length < 2) return top.length ? `${lastName(top[0][0])} unopposed` : '';
    return `${lastName(top[0][0])} +${((top[0][2] - top[1][2]) / (c.total || 1) * 100).toFixed(1)}`; };
  const resRow = (c, cmp) => { const x = split(c);
    const seg = (v, col, txt, fg) => v > 0 ? `<div class="sb-seg" style="flex:${v} 1 0;background:${col};color:${fg}" title="${esc(txt)}">${v >= .14 ? esc(txt) : ''}</div>` : '';
    return `<div class="sb-row"><div class="sb-label"><b>${esc(c.contest)}</b><span class="num">${marg(c)}${cmp ? ` · countywide ${marg(cmp)}` : ''}</span></div>
      <div class="sb-track">${x.d ? seg(x.ds, 'var(--dem)', `${lastName(x.d[0])} ${pc1(x.ds)}`, '#fff') : ''}${seg(x.os, 'var(--grid)', `${x.ol} ${pc1(x.os)}`, 'var(--ink)')}${x.r ? seg(x.rs, 'var(--rep)', `${lastName(x.r[0])} ${pc1(x.rs)}`, '#fff') : ''}</div>
      <div class="sb-key">${c.cands.map(k => `<span>${k[1] === 'DEM' ? '<i class="dot d"></i>' : k[1] === 'REP' ? '<i class="dot r"></i>' : ''}${esc(k[0])} <b class="num">${fmtS(k[2])}</b></span>`).join('')}</div></div>`; };
  // primaries: one section, Democratic and Republican side by side
  const primRow = (c, hue) => { const t = c.total || 1;
    const segs = c.cands.map((k, i) => ({ k, v: k[2] / t, col: k[0] === 'Others' ? 'var(--grid)' : `color-mix(in oklab, var(${hue}) ${100 - i * 24}%, var(--surface))`, fg: i < 2 && k[0] !== 'Others' ? '#fff' : 'var(--ink)' }));
    return `<div class="sb-row"><div class="sb-label"><b>${esc(c.contest)}</b><span class="num">${fmtS(c.total)} votes</span></div>
      <div class="sb-track">${segs.map(x => x.v > 0 ? `<div class="sb-seg" style="flex:${x.v} 1 0;background:${x.col};color:${x.fg}" title="${esc(x.k[0])}: ${fmtS(x.k[2])} (${pc1(x.v)})">${x.v >= .16 ? esc(lastName(x.k[0])) : ''}</div>` : '').join('')}</div>
      <ul class="kv">${c.cands.map(k => `<li><span>${esc(k[0])}</span><span>${fmtS(k[2])} <small>${pc1(k[2] / t)}</small></span></li>`).join('')}</ul></div>`; };
  const PD = (G.results || []).find(r => r.kind === 'primary' && r.party === 'DEM'), PR = (G.results || []).find(r => r.kind === 'primary' && r.party === 'REP');
  const primaryHtml = !(PD || PR) ? '' : (() => {
    const bd = PD ? PD.ballots : 0, br = PR ? PR.ballots : 0, dl = bd >= br, tb = bd + br || 1;
    const est = [PD, PR].some(r => r && r.method === 'bridged' && r.split >= 0.02);
    return `<section aria-labelledby="res-p26"><h2 id="res-p26">${dl ? 'Democratic' : 'Republican'} primary ballots outnumbered ${dl ? 'Republican' : 'Democratic'} ballots ${fmtN(dl ? bd : br)} to ${fmtN(dl ? br : bd)} in March 2026</h2>
      <p class="sub">Official results from the county’s March 3, 2026 primary canvasses, which already use today’s precincts. May runoffs are not included.${est ? ' Some precincts here are split between districts; their votes are divided by where each precinct’s November 2024 voters live, so treat the figures as close estimates.' : ''}</p>
      <div class="sb-row"><div class="sb-label"><b>Primary ballots cast</b><span class="num">${fmtN(bd)} D · ${fmtN(br)} R</span></div>
        <div class="sb-track"><div class="sb-seg" style="flex:${bd / tb} 1 0;background:var(--dem);color:#fff">${pc1(bd / tb)}</div><div class="sb-seg" style="flex:${br / tb} 1 0;background:var(--rep);color:#fff">${pc1(br / tb)}</div></div></div>
      <div class="two" style="margin-top:18px">${[[PD, '--dem', 'd', 'Democratic primary'], [PR, '--rep', 'r', 'Republican primary']].map(([r, hue, k, lab]) => r ? `<div class="panel"><h3><i class="dot ${k}"></i>${lab}</h3><div class="sizebar">${r.contests.map(c => primRow(c, hue)).join('')}</div></div>` : '').join('')}</div>${MARK}</section>`;
  })();
  // the seat's own last race (and the last contested one, if that was unopposed)
  const seatHtml = !G.seat ? '' : (() => {
    const S = G.seat, r0 = S.races[0], top = r0.cands.filter(x => x[0] !== 'Others').sort((a, b) => b[2] - a[2]);
    const h = r0.contested ? `${lastName(top[0][0])} won this ${S.office} by ${((top[0][2] - top[1][2]) / (r0.total || 1) * 100).toFixed(1)} points in ${r0.short}`
                           : `${lastName(top[0][0])} won this ${S.office} unopposed in ${r0.short}`;
    const lines = r0.same_lines
      ? `The last general election for this seat${G.partial ? ', counting only its Tarrant County voters' : ''}. The district’s lines are the same today.`
      : `The last general election for this seat, under the district lines in place at the time${G.dim === 'cd' ? ' (Tarrant County voters only)' : ''}. Those lines have since been redrawn, so the voters in that race are not exactly the voters on this page.`;
    return `<section aria-labelledby="seat-h"><h2 id="seat-h">${esc(h)}</h2>
      <p class="sub">${lines} Official results from the county’s canvass, ${fmtN(r0.precincts)} precincts.</p>
      <div class="sizebar">${S.races.map((r, i) => resRow(Object.assign({}, r, { contest: `${r.contest}, ${r.label.replace(' general election', '')}${i ? ' (last contested race)' : ''}` }), null)).join('')}</div>${MARK}</section>`;
  })();
  // estimated race and ethnicity (BIFSG estimates summed over voters; only shown once published, see race_bisg.py)
  const raceHtml = !G.race ? '' : (() => {
    const RL = ['Hispanic', 'White', 'Black', 'Asian or Pacific Islander', 'Other or multiracial'], tot = G.race.reduce((a, v) => a + n0(v), 0) || 1;
    const RT = G.race_turnout || {}, tp = (key, i) => RT[key] && RT[key][i] && RT[key][i][0] ? pc(RT[key][i][1], RT[key][i][0]) : '—';
    const big = G.race.map((v, i) => [i, n0(v)]).sort((a, b) => b[1] - a[1]);
    const r100 = v => v == null ? '<100' : v < 100 ? '<100' : (Math.round(v / 100) * 100).toLocaleString('en-US');   // estimates: rounded
    return `<section aria-labelledby="race-h"><h2 id="race-h">An estimated ${pc(big[0][1], tot)} of active voters ${isCounty ? 'in the county' : 'here'} are ${RL[big[0][0]]}, and ${pc(big[1][1], tot)} are ${RL[big[1][0]]}</h2>
      <p class="sub">Estimates, not counts: the voter file does not record race or ethnicity. Each voter’s chances are figured from Census surname and first-name data and the makeup of their Census block, then adjusted so each Census tract’s totals match its citizen voting-age makeup in the Census Bureau’s American Community Survey, and added up.</p>
      <div style="overflow-x:auto"><table class="ntab race-tab" style="white-space:nowrap"><thead><tr><th>Group</th><th class="r">Active voters</th><th class="r">Share</th><th class="r">Voted Nov 2022</th><th class="r">Voted Nov 2024</th><th class="r">Voted Mar 2026 primary</th></tr></thead><tbody>
      ${RL.map((l, i) => `<tr><td style="overflow-wrap:normal">${l}</td><td class="r num">${r100(G.race[i])}</td><td class="r num">${pc(G.race[i], tot)}</td><td class="r num">${tp('g22', i)}</td><td class="r num">${tp('g24', i)}</td><td class="r num">${tp('p26', i)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="note">Voter counts are rounded to the nearest 100 because they are estimates. Turnout is the estimated share of each group’s eligible active voters who voted. The tract adjustment corrects a known tilt (many surnames are shared by Black and White Americans, which on their own push mixed neighborhoods toward White) and assumes each group registers at a similar rate within a tract, so groups that register less often, such as Hispanic voters, may be slightly overstated. Estimates are firmer for large groups and large areas; multiracial voters fold into “other.”</p></section>`;
  })();
  // 2026 turnout so far (county daily lists of returned mail ballots and early voters)
  const SF = G.so_far, CSF = CTY && CTY.so_far;
  const sofarHtml = !SF || !SF.voted ? '' : (() => {
    const of22 = SF.v22 ? SF.voted / SF.v22 : 0, c22 = CSF && CSF.v22 ? CSF.voted / CSF.v22 : null;
    const rel = c22 ? of22 / c22 - 1 : 0;
    const pace = c22 && !isCounty ? ` That’s ${Math.abs(rel) < 0.03 ? 'about even with' : `${Math.round(Math.abs(rel) * 100)}% ${rel > 0 ? 'ahead of' : 'behind'}`} the county’s pace (${pc1(c22)} of its 2022 total).` : '';
    const mx = Math.max(of22, c22 || 0, 0.01);
    return `<section aria-labelledby="sf-h"><h2 id="sf-h">${fmtN(SF.voted)} ${isCounty ? 'Tarrant County' : ''} voters ${isCounty ? '' : 'here '}have voted so far in the 2026 general election</h2>
      <p class="sub">Mail ballots returned and early votes cast${SF.through ? ` through ${dlabel(SF.through)}` : ''}, from the county’s daily lists. That’s ${pc(SF.voted, SF.reg)} of registered voters ${isCounty ? 'in the county' : 'here'}, and ${pc1(of22)} of the number who voted ${isCounty ? '' : 'here '}in the entire 2022 midterm.${pace}</p>
      <div class="hb"><div class="hb-row"><span class="hb-l">Of 2022 total</span><span class="hb-t"><i style="width:${Math.min(100, of22 / mx * 100)}%;background:var(--ink)"></i>${c22 && !isCounty ? `<em style="left:${Math.min(100, c22 / mx * 100)}%"></em>` : ''}</span><span class="hb-v num">${pc1(of22)}</span></div></div>
      ${!isCounty ? '<p class="note"><i class="cmk"></i> marks the countywide figure.</p>' : ''}${leanHtml()}<p class="note"><a href="${up}turnout/index.html">2026 Turnout Tracker ›</a></p>${MARK}</section>`;
    // primary history of the voters so far (D / neither / R), against the area's 2022 early and mail voters
    function leanHtml() {
      const ok = a => a && a.length === 3 && a.every(v => v != null), sum = a => a[0] + a[1] + a[2];
      if (!ok(SF.lean) || sum(SF.lean) < 50) return '';
      const gt = a => { const g = (a[0] - a[1]) / sum(a) * 100; return `${g >= 0 ? 'D' : 'R'}+${Math.abs(g).toFixed(1)}`; };
      const row = (lab, a) => { const t = sum(a), seg = (v, col, txt) => v > 0 ? `<div class="sb-seg" style="flex:${v / t} 1 0;background:${col};color:${col === 'var(--grid)' ? 'var(--ink)' : '#fff'}">${v / t >= .12 ? txt + ' ' + Math.round(v / t * 100) + '%' : ''}</div>` : '';
        return `<div class="sb-row"><div class="sb-label"><b>${lab}</b><span class="num">${fmtN(t)} · ${gt(a)}</span></div><div class="sb-track" style="height:22px">${seg(a[0], 'var(--dem)', 'D')}${seg(a[2], 'var(--grid)', 'Neither')}${seg(a[1], 'var(--rep)', 'R')}</div></div>`; };
      const rows = [['2026 so far', SF.lean]];
      if (ok(SF.lean22) && sum(SF.lean22) >= 50) rows.push(['2022 early and mail voters', SF.lean22]);
      if (!isCounty && CSF && ok(CSF.lean)) rows.push(['2026 so far, all of Tarrant County', CSF.lean]);
      // the last general-election result here, for comparison: the seat's own last contested race, or else the 2024 presidential
      const seatRace = G.seat && G.seat.races.find(r => r.contested);
      const pres = (G.results || []).filter(rs => rs.kind !== 'primary').map(rs => rs.contests.find(c => c.contest === 'President')).find(Boolean);
      const L = seatRace || pres, lrs = !seatRace && pres ? (G.results || []).find(rs => rs.contests.includes(pres)) : null;
      const lastRow = !L ? '' : (() => { const x = split(L), lab = seatRace ? `${L.contest}, ${L.short}` : `President, ${lrs ? lrs.short : '2024'}`;
        const mg = x.d && x.r ? `${x.ds >= x.rs ? 'D' : 'R'}+${(Math.abs(x.ds - x.rs) * 100).toFixed(1)}` : marg(L);
        const seg = (v, col, txt, fg) => v > 0 ? `<div class="sb-seg" style="flex:${v} 1 0;background:${col};color:${fg}">${v >= .12 ? txt + ' ' + Math.round(v * 100) + '%' : ''}</div>` : '';
        return `<div class="sb-row"><div class="sb-label"><b>Result: ${esc(lab)}</b><span class="num">${fmtN(L.total)} votes · ${mg}</span></div><div class="sb-track" style="height:22px">${seg(x.ds, 'var(--dem)', 'D', '#fff')}${seg(x.os, 'var(--grid)', x.ol === 'Others' ? 'Other' : x.ol, 'var(--ink)')}${seg(x.rs, 'var(--rep)', 'R', '#fff')}</div></div>`; })();
      return `<h3 style="margin:18px 0 4px">Who has voted ${isCounty ? '' : 'here '}so far, by primary history</h3><div class="sizebar">${rows.map(([l, a]) => row(l, a)).join('')}${lastRow}</div>
        <p class="note">The most recent party primary each voter chose since 2022: Democratic, Republican, or neither. A primary ballot is not a November vote and this is not a forecast; the large 2026 Democratic primary also makes 2026 voters look more Democratic on this measure than 2022 voters.${L ? ` The last bar is the actual November result ${seatRace ? `the last time this seat was contested${L.same_lines ? '' : ' (under the district lines of that election)'}` : `here in the ${lrs ? lrs.short : '2024'} presidential race`}, for comparison.` : ''}</p>`;
    }
  })();
  const resultsHtml = seatHtml + primaryHtml + (G.results || []).filter(rs => rs.kind !== 'primary').map(rs => {
    const pres = rs.contests.find(c => c.contest === 'President') || rs.contests[0], x = pres ? split(pres) : null;
    const cr = CTY && (CTY.results || []).find(z => z.key === rs.key);
    let h = `How ${where} voted in ${rs.short}`;
    if (x && x.r && x.d) { const w = x.rs >= x.ds ? x.r : x.d; h = `${lastName(w[0])} carried ${where} by ${Math.abs((x.rs - x.ds) * 100).toFixed(1)} points in ${rs.short}`; }
    return `<section aria-labelledby="res-${rs.key}"><h2 id="res-${rs.key}">${esc(h)}</h2>
      <p class="sub">${rs.method === 'bridged'
        ? `Official results from the county’s ${esc(rs.label)} canvass, added up within today’s lines.${rs.split >= 0.02 ? ` About ${Math.round(rs.split * 100)}% of these votes come from precincts now split between districts; those are divided by where each precinct’s November 2024 voters live, so treat the figures as close estimates.` : ''}`
        : `Official results from the county’s ${esc(rs.label)} canvass, added up across ${fmtN(rs.precincts)} precincts${G.partial ? ' in the Tarrant County part of the district' : ''}.`} About ${fmtN(rs.ballots)} ballots were cast, ${pc(rs.ballots, rs.registered)} of the voters registered at the time.</p>
      <div class="sizebar">${rs.contests.map(c => resRow(c, !c.own && cr ? cr.contests.find(z => z.contest === c.contest) : null)).join('')}</div>${MARK}</section>`; }).join('');

  const app = $('#app');
  app.insertAdjacentHTML('beforeend', `${crumb}
  <header><div class="eyebrow"><span>The Electorate</span><span>${esc(isCounty ? 'Countywide' : G.group)}</span></div>
    <h1>${esc(h1)}</h1><p class="dek">${dek}</p>
    <div class="asof">Tarrant County voter file, ${dlabel(M.file_date)} · ${fmtN(M.rows)} registration records</div></header>
  <section aria-label="Key numbers"><div class="stats">${tiles}</div></section>
  ${partialNote}
  ${sofarHtml}
  ${raceCards ? `<section aria-labelledby="ra-h"><h2 id="ra-h">On the ballot here</h2><p class="sub">${isCounty ? 'Countywide races' : 'Races'} tracked on Follow the Money${G.partial ? '' : ', with each campaign’s cash on hand divided by the number of registered voters'}.</p><ul class="hits">${raceCards}</ul></section>` : ''}
  <section aria-labelledby="to-h"><h2 id="to-h"></h2><p class="sub">Share of today’s registered voters who were on the rolls for each election and cast a ballot in it, back to the 2018 primaries. Hover or tap a bar for the count.</p>
    <div class="legend"><span><i class="sw" style="background:var(--seq-4)"></i><span id="to-leg">November elections</span></span><span><i class="sw" style="background:var(--dem)"></i>Democratic primary</span><span><i class="sw" style="background:var(--rep)"></i>Republican primary</span></div>
    <div class="seg" role="group" aria-label="Elections shown"><button type="button" id="to-ml" aria-pressed="true">March and November</button><button type="button" id="to-all" aria-pressed="false">Include May local elections</button></div>
    <div class="chart" id="turnout"></div>
    <p class="note">May elections are city, school and other local contests, and many voters have none on their ballot, so they are hidden by default. From November 2024 on, voters the county marked ineligible for an election are left out of the count; before that, everyone registered by Election Day is counted.</p></section>
  ${resultsHtml}
  <section aria-labelledby="ty-h"><h2 id="ty-h"></h2><p class="sub" id="ty-sub"></p><div class="sizebar" id="types"></div>${MARK}</section>
  <section aria-labelledby="pr-h"><h2 id="pr-h"></h2><p class="sub">Each voter is counted once, by the most recent party primary they voted in since 2022. Texas has no party registration, so this is the closest thing the voter file has to party.</p>
    <div class="sizebar" id="prim"></div></section>
  <section aria-labelledby="ag-h"><h2 id="ag-h"></h2><p class="sub" id="ag-sub"></p>
    <div class="seg" role="group" aria-label="Measure" id="ag-seg"></div><div class="hb" id="age"></div>${CTY ? '<p class="note"><i class="cmk"></i> marks the countywide figure.</p>' : ''}</section>
  ${raceHtml}
  <section aria-labelledby="rg-h"><h2 id="rg-h">How long they’ve been registered</h2><p class="sub">Registered voters by the date of their current registration.</p><div class="hb" id="regb"></div></section>
  <section><div class="two">
    <div class="panel"><h3>Sex, as recorded</h3><ul class="kv">${['Women', 'Men', 'Not recorded'].map((l, i) => `<li><span>${l}</span><span>${fmtS(G.sex[i])} <small>${pc(G.sex[i], G.reg)}</small></span></li>`).join('')}</ul></div>
    <div class="panel"><h3>How they voted in Nov 2024</h3><ul class="kv">${[['Early in person', 'early'], ['Election Day', 'eday'], ['By mail', 'mail']].map(([l, k]) => `<li><span>${l}</span><span>${fmtS(g24[k])} <small>${pc(g24[k], g24.voted)}</small></span></li>`).join('')}</ul></div>
  </div></section>
  ${D.directory ? `<section aria-labelledby="dir-h"><h2 id="dir-h">Every district, side by side</h2><p class="sub">Pick a district for its full profile. Turnout is the share of today’s registered voters who were on the rolls for that election and voted.</p>
    <label class="srch"><span>Filter</span><input id="f" type="search" placeholder="District number, city or school district" autocomplete="off"></label><div id="dir"></div></section>` : ''}
  <footer><b>How these numbers work</b><ul>
    <li>Source: the Tarrant County Elections voter registration and election history file (${fmtN(M.rows)} records, ${dlabel(M.file_date)}). Only totals are published here: no names, addresses or birth dates. Counts under 10 are withheld.</li>
    <li>The file lists the voters registered today. People who moved away or were removed since an election are not in it, so turnout here is the share of today’s voters, not the official turnout reported on election night.</li>
    <li>A voter counts as having voted when the county marks their ballot as cast early, on Election Day, by mail or provisionally. Provisional and mail ballots the county rejected are not counted as votes.</li>
    <li>Starting with the November 2024 election, the county marks every voter as eligible or ineligible for each election, so those turnout figures leave out voters it marked ineligible. For earlier elections, everyone registered by Election Day is counted as eligible.</li>
    ${M.history_file ? `<li>The county’s October file stops its election history at 2022. Elections from 2018 through 2021, May 2022 and November 2023 come from the county’s July 14, 2026 extract, matched by voter ID; voters who registered after that extract are left out of those elections. In the November 2020 column the county coded Election Day ballots as “P,” and they are counted as votes.</li>` : ''}
    <li>${fmtN(G.redacted)} records with history withheld by the county are left out of the turnout figures.${G.precincts ? ` This area covers ${fmtN(G.precincts)} voting precinct${G.precincts === 1 ? '' : 's'} with registered voters.` : ''}</li>
    <li>Every figure on this page counts active voters only, which lines up with the Texas Secretary of State’s registration count. ${G.inactive ? `The ${fmtN(G.inactive)} voters here on the county’s suspense list` : 'Voters on the county’s suspense list'} are left out: the county has had mail returned for them, so most have moved. They can still vote, and the county reactivates anyone who does.</li>
    <li>Ages are figured as of ${dlabel(M.as_of)}.</li>
    ${G.dim === 'city' ? '<li>City boundaries come from the jurisdiction code on each registration, not the mailing city.</li>' : ''}
    <li>Code definitions come from the county’s voter history file layout and district list.</li>
    ${(G.results || []).length ? '<li>Election results are the county’s official canvass by precinct. In 2025 the county renumbered its precincts by changing only the first digit, which now gives the commissioner precinct, so 2024 precinct 1001 is today’s x001. State House, State Board of Education and the Senate seats on the 2024 ballot are added up exactly from the precincts that voted in those races. Every other area is added up by today’s precinct lines; where a precinct is split between districts, its votes are divided by where its November 2024 voters live.' + ((G.results || []).filter(r => r.unplaced).map(r => ` ${fmtN(r.unplaced)} ${r.short} ballots from precincts with no clear successor today are left out of these area totals.`).join('')) + '</li>' : ''}
  </ul><a href="https://seeitnameitfightit.com" target="_blank" rel="noopener">${esc(M.org)}</a> · <a href="${up}index.html">Follow the Money</a>${isCounty ? '' : ' · <a href="../index.html">The Electorate</a>'}</footer>`);

  // ---------- turnout by election
  // May elections are left off by default: many voters have no May contest, so those bars understate turnout
  let showLocal = false;
  const ELS = () => showLocal ? E : E.filter(e => e.kind !== 'local');
  function turnoutHead() {
  const EE = ELS();
  const best = EE.filter(e => e.kind === 'general').reduce((a, e) => P(T[e.key].voted, T[e.key].elig) > P(T[a.key].voted, T[a.key].elig) ? e : a);
  const low = EE.reduce((a, e) => P(T[e.key].voted, T[e.key].elig) < P(T[a.key].voted, T[a.key].elig) ? e : a);
  $('#to-h').textContent = `Turnout ran from ${pc(T[best.key].voted, T[best.key].elig)} in the ${best.label} to ${pc(T[low.key].voted, T[low.key].elig)} in the ${low.label}`;
  }
  turnoutHead();
  function drawTurnout() {
    const EE = ELS();
    const box = $('#turnout'), W = box.clientWidth, H = Math.max(220, Math.min(290, W * 0.5)), m = { l: 36, r: 4, t: 18, b: 34 };
    const max = Math.min(1, niceMax(Math.max(...EE.map(e => P(T[e.key].voted, T[e.key].elig))) * 1.08));
    const band = (W - m.l - m.r) / EE.length, bw = Math.min(40, band * 0.62);
    const y = v => m.t + (1 - v / max) * (H - m.t - m.b);
    const rect = (x, v0, v1, col) => v1 > v0 ? `<rect x="${x}" y="${y(v1)}" width="${bw}" height="${Math.max(0.5, y(v0) - y(v1))}" fill="${col}" rx="2"/>` : '';
    const ticks = [0, max / 2, max];
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Turnout in each election since 2022 in ${esc(where)}">
      ${ticks.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)" class="num">${Math.round(v * 100)}%</text>`).join('')}
      ${EE.map((e, i) => { const t = T[e.key], x = m.l + i * band + (band - bw) / 2, tot = P(t.voted, t.elig);
        const bars = e.kind === 'primary' ? rect(x, 0, P(t.d, t.elig), 'var(--dem)') + rect(x, P(t.d, t.elig), tot, 'var(--rep)') : rect(x, 0, tot, 'var(--seq-4)');
        const [yy, mm] = e.date.split('-'), narrow = band < 34, newYear = !i || EE[i - 1].date.slice(0, 4) !== yy;
        const mon = narrow ? MONTHS[+mm - 1][0] : MONTHS[+mm - 1], fs = narrow ? 9 : 11;
        return bars + `<text x="${x + bw / 2}" y="${y(tot) - 5}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="var(--ink)" class="num">${Math.round(tot * 100)}${narrow ? '' : '%'}</text>
          <text x="${x + bw / 2}" y="${H - 18}" text-anchor="middle" font-size="${fs}" fill="var(--ink-3)">${mon}</text>${!narrow || newYear ? `<text x="${narrow ? m.l + i * band + 1 : x + bw / 2}" y="${H - 5}" text-anchor="${narrow ? 'start' : 'middle'}" font-size="10" fill="var(--ink-3)">’${yy.slice(2)}</text>` : ''}`; }).join('')}
      ${EE.map((e, i) => `<rect x="${m.l + i * band}" y="0" width="${band}" height="${H - m.b}" fill="transparent" data-i="${i}" class="to-hit"/>`).join('')}
    </svg><div class="tip" id="to-tip"></div>`;
    const tip = $('#to-tip', box);
    box.querySelectorAll('.to-hit').forEach(h => {
      const show = () => { const e = EE[+h.dataset.i], t = T[e.key], s = box.getBoundingClientRect().width / W;
        const rows = e.kind === 'primary'
          ? `<div class="t-row"><span><i class="dot d"></i> Democratic</span><span>${fmtS(t.d)}</span></div><div class="t-row"><span><i class="dot r"></i> Republican</span><span>${fmtS(t.r)}</span></div>`
          : `<div class="t-row"><span>Early</span><span>${fmtS(t.early)}</span></div><div class="t-row"><span>Election Day</span><span>${fmtS(t.eday)}</span></div><div class="t-row"><span>Mail</span><span>${fmtS(t.mail)}</span></div>`;
        tip.innerHTML = `<b>${esc(e.label)}</b><div class="t-row"><span>Voted</span><span>${fmtS(t.voted)} of ${fmtS(t.elig)}</span></div>${rows}`;
        tip.style.opacity = 1; tipPos(tip, box, (m.l + (+h.dataset.i + .5) * band) * s, 20); h.setAttribute('fill', 'var(--grid)'); h.setAttribute('fill-opacity', '.45'); };
      const hide = () => { tip.style.opacity = 0; h.setAttribute('fill', 'transparent'); };
      h.addEventListener('mouseenter', show); h.addEventListener('mouseleave', hide);
      h.addEventListener('touchstart', () => { box.querySelectorAll('.to-hit').forEach(o => o.setAttribute('fill', 'transparent')); show(); setTimeout(hide, 2200); }, { passive: true });
    });
  }

  const setLocal = v => { showLocal = v; $('#to-leg').textContent = v ? 'November and May elections' : 'November elections'; $('#to-ml').setAttribute('aria-pressed', !v); $('#to-all').setAttribute('aria-pressed', v); turnoutHead(); drawTurnout(); };
  $('#to-ml').onclick = () => setLocal(false); $('#to-all').onclick = () => setLocal(true);

  // ---------- voter types
  const ORDER = [0, 1, 2, 4, 5, 3], TCOL = ['var(--seq-5)', 'var(--seq-4)', 'var(--seq-3)', 'var(--chip)', 'var(--seq-2)', 'var(--seq-1)'];
  const tyTot = ty.reduce((a, b) => a + n0(b), 0);
  $('#ty-h').textContent = `${pc(n0(ty[0]), tyTot)} voted in both of the last two Novembers. ${pc(n0(ty[3]) + n0(ty[5]), tyTot)} have voted in neither.`;
  $('#ty-sub').textContent = `Every registered voter in ${where}, sorted by whether they turned out in the Nov 2022 midterm and the Nov 2024 presidential election. People who registered after the midterm are grouped by whether they have voted in any election since.`;
  $('#types').innerHTML = `<div class="sb-row"><div class="sb-label"><b>${esc(Where)}</b><span class="num">${fmtN(tyTot)} voters</span></div>
    <div class="sb-track">${ORDER.map(i => { const p = P(ty[i], tyTot); return p ? `<div class="sb-seg" style="flex:${p} 1 0;background:${TCOL[i]};color:${i === 0 || i === 1 ? 'var(--bg)' : 'var(--ink)'}" title="${esc(M.types[i])}: ${fmtS(ty[i])} (${pc1(p)})">${p >= .07 ? Math.round(p * 100) + '%' : ''}</div>` : ''; }).join('')}</div></div>
    <ul class="kv">${ORDER.map(i => `<li><span><i class="sw" style="background:${TCOL[i]};${i === 3 ? 'border:1px solid var(--ink-3)' : ''}"></i> ${esc(M.types[i])}</span><span>${fmtS(ty[i])} <small>${pc(ty[i], tyTot)}</small></span></li>`).join('')}</ul>`;

  // ---------- primaries
  const pr = G.primary, prTot = pr.reduce((a, b) => a + n0(b), 0), voters = n0(pr[0]) + n0(pr[1]);
  $('#pr-h').textContent = voters ? `${pc(n0(pr[2]), prTot)} haven’t voted in a party primary since 2022` : 'Primary voting since 2022';
  const prow = (lab, vals, cols, tot, note) => `<div class="sb-row"><div class="sb-label"><b>${lab}</b><span class="num">${note}</span></div><div class="sb-track">${vals.map((v, i) => { const p = P(v, tot); return p ? `<div class="sb-seg" style="flex:${p} 1 0;background:${cols[i]};color:${i < 2 ? '#fff' : 'var(--ink)'}">${p >= .07 ? Math.round(p * 100) + '%' : ''}</div>` : ''; }).join('')}</div></div>`;
  $('#prim').innerHTML = prow('Most recent primary since 2022', pr, ['var(--dem)', 'var(--rep)', 'var(--grid)'], prTot, `${fmtS(pr[0])} D · ${fmtS(pr[1])} R · ${fmtS(pr[2])} neither`)
    + E.filter(e => e.kind === 'primary').reverse().map(e => { const t = T[e.key]; return prow(e.label, [t.d, t.r], ['var(--dem)', 'var(--rep)'], n0(t.d) + n0(t.r), `${fmtS(t.d)} D · ${fmtS(t.r)} R`); }).join('')
    + `<div class="sb-key"><span><i class="sw" style="background:var(--dem)"></i>Democratic</span><span><i class="sw" style="background:var(--rep)"></i>Republican</span><span><i class="sw" style="background:var(--grid)"></i>No primary since 2022</span></div>`;

  // ---------- age
  const AB = M.age_bands, AT = G.age_turnout, CAT = CTY && CTY.age_turnout;
  const MODES = [['share', 'Who’s registered'], ['g18', '2018 midterm'], ['g20', '2020 presidential'], ['g22', '2022 midterm'], ['g24', '2024 presidential'], ['p26', '2026 primaries']].filter(([k]) => k === 'share' || M.age_turnout.includes(k));
  let agMode = 'share';
  const ageVal = (geo, mode, i) => mode === 'share' ? P(geo.age[i], geo.reg) : P(geo.age_turnout[mode][i][1], geo.age_turnout[mode][i][0]);
  function drawAge() {
    const vals = AB.map((_, i) => ageVal(G, agMode, i)), cv = CTY ? AB.map((_, i) => ageVal(CTY, agMode, i)) : null;
    const max = Math.max(...vals, ...(cv || [0])) || 1;
    $('#age').innerHTML = AB.map((b, i) => `<div class="hb-row"><span class="hb-l">${b}</span><span class="hb-t"><i style="width:${vals[i] / max * 100}%"></i>${cv ? `<em style="left:${cv[i] / max * 100}%"></em>` : ''}</span><span class="hb-v num">${agMode === 'share' ? pc1(vals[i]) : Math.round(vals[i] * 100) + '%'}</span></div>`).join('');
    const y = AB.slice(0, 2).map((_, i) => i), o = [4, 5, 6];
    if (agMode === 'share') {
      $('#ag-h').textContent = `${pc(n0(G.age[0]) + n0(G.age[1]), G.reg)} of registered voters here are under 35`;
      $('#ag-sub').textContent = `Registered voters by age on Election Day 2026. Switch to see how each age group turned out.`;
    } else {
      const at = AT[agMode], s = idx => idx.reduce((a, i) => [a[0] + n0(at[i][0]), a[1] + n0(at[i][1])], [0, 0]);
      const yy = s(y), oo = s(o), lab = E.find(e => e.key === agMode).label;
      $('#ag-h').textContent = `${lab}: ${pc(yy[1], yy[0])} of voters under 35 turned out, and ${pc(oo[1], oo[0])} of voters 55 and older`;
      $('#ag-sub').textContent = `Share of each age group who were registered for the ${lab} and voted in it.`;
    }
  }
  $('#ag-seg').innerHTML = MODES.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="${k === agMode}">${esc(l)}</button>`).join('');
  $('#ag-seg').querySelectorAll('button').forEach(b => b.onclick = () => { agMode = b.dataset.k; $('#ag-seg').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); drawAge(); });

  // ---------- registration recency
  (function () {
    const v = G.regband.map(x => P(x, G.reg)), cv = CTY ? CTY.regband.map(x => P(x, CTY.reg)) : null, max = Math.max(...v, ...(cv || [0])) || 1;
    $('#regb').innerHTML = M.reg_bands.map((b, i) => `<div class="hb-row"><span class="hb-l">${esc(b)}</span><span class="hb-t"><i style="width:${v[i] / max * 100}%"></i>${cv ? `<em style="left:${cv[i] / max * 100}%"></em>` : ''}</span><span class="hb-v num">${pc1(v[i])}</span></div>`).join('');
  })();

  // ---------- directory (countywide page)
  if (D.directory) {
    $('#dir').innerHTML = D.directory.map(g => `<div class="dir-g"><h3 class="near-h">${esc(g.label)}</h3><table class="ntab"><thead><tr><th>District</th><th class="r">Registered</th><th class="r">Nov ’22</th><th class="r">Nov ’24</th><th class="r">Mar ’26 primary</th></tr></thead><tbody>
      ${g.items.map(x => `<tr data-q="${esc((x.name + ' ' + g.label).toLowerCase())}"><td><a href="${x.slug}/index.html">${esc(x.name)}</a>${x.partial ? ' <small class="pt">Tarrant part</small>' : ''}</td><td class="r num">${fmtS(x.reg)}</td><td class="r num">${x.g22}</td><td class="r num">${x.g24}</td><td class="r num"><span style="color:var(--dem)">${fmtS(x.d)}</span> · <span style="color:var(--rep)">${fmtS(x.r)}</span></td></tr>`).join('')}</tbody></table></div>`).join('');
    const f = $('#f'); f.addEventListener('input', () => { const v = f.value.trim().toLowerCase();
      document.querySelectorAll('#dir tr[data-q]').forEach(r => { r.hidden = !!v && !r.dataset.q.includes(v); });
      document.querySelectorAll('#dir .dir-g').forEach(g => { g.hidden = !g.querySelector('tr[data-q]:not([hidden])'); }); });
  }

  drawTurnout(); drawAge();
  let rt; if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(drawTurnout, 80); }).observe(app);
})();
