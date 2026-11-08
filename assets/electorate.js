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
  // after the Nov 2026 election: lead with how the area voted (the seat's own race where there is one, else County Judge)
  const lnm = nm => nm.replace(/,?\s+(Jr\.?|Sr\.?|III|II|IV)$/i, '').split(' ').pop();
  const two = c => { if (!c) return null; const d = c.cands.find(x => x[1] === 'DEM'), r = c.cands.find(x => x[1] === 'REP'); return d && r ? { d, r, w: d[2] >= r[2] ? d : r, m: Math.abs(d[2] - r[2]) / ((d[2] + r[2]) || 1) * 100, D: d[2] >= r[2] } : null; };
  const R26 = (G.results || []).find(r => r.key === 'g26'), CJ = R26 && R26.contests.find(c => c.contest === 'County Judge');
  const SEAT26 = G.seat && G.seat.races[0] && G.seat.races[0].key === 'g26' && G.seat.races[0].contested ? G.seat.races[0] : null;
  const PRES24 = (G.results || []).find(r => r.key === 'g24'), P24 = two(PRES24 && PRES24.contests.find(c => c.contest === 'President'));
  const S6 = G.so_far && G.so_far.through >= '2026-11-03' ? G.so_far : null, CS6 = CTY && CTY.so_far;
  let h1, dek;
  const hs = two(SEAT26), hc = two(CJ);
  if (hs || hc) {
    h1 = hs ? `${lnm(hs.w[0])} won ${where} by ${hs.m.toFixed(1)} points in 2026` : `${lnm(hc.w[0])} carried ${where} by ${hc.m.toFixed(1)} points in the 2026 County Judge race`;
    dek = S6 ? `<b class="num">${fmtN(S6.voted)}</b> voters ${isCounty ? 'in the county' : 'here'} cast ballots in the Nov 2026 general election, ${pc(S6.voted, S6.reg)} of registered voters${!isCounty && CS6 && CS6.reg ? ` (countywide: ${pc(CS6.voted, CS6.reg)})` : ''}.` : '';
    if (hs && hc) dek += ` In the County Judge race, ${lnm(hc.w[0])} carried ${isCounty ? 'the county' : 'it'} by ${hc.m.toFixed(1)} points.`;
    if (P24 && hc) dek += ` In 2024, ${lnm(P24.w[0])} carried ${isCounty ? 'the county' : 'it'} by ${P24.m.toFixed(1)} points for president.`;
    dek += ' Unofficial results.';
  } else {
    h1 = `${fmtN(ty[3])} registered voters in ${where} sat out both of the last two November elections`;
    const dl = n0(p26.d) >= n0(p26.r);
    dek = `In the March 2026 primaries, ${dl ? 'Democratic' : 'Republican'} ballots outnumbered ${dl ? 'Republican' : 'Democratic'} ballots <b class="num">${fmtN(dl ? p26.d : p26.r)}</b> to <b class="num">${fmtN(dl ? p26.r : p26.d)}</b>.`;
    if (newTot) dek += ` Since the 2022 midterm, <b class="num">${fmtN(newTot)}</b> people have registered here, and ${pc(ty[5], newTot)} of them have not voted yet.`;
  }

  const tile = (v, l) => `<div><b class="num">${v}</b><span>${l}</span></div>`;
  const tiles = [
    tile(fmtK(G.reg), 'active registered voters'),
    ...(G.so_far && G.so_far.through >= '2026-11-03' ? [tile(pc(G.so_far.voted, G.so_far.reg), 'voted in Nov 2026 (unofficial)')] : []),
    tile(pc(g22.voted, g22.elig), 'voted in the Nov 2022 midterm'),
    tile(pc(g24.voted, g24.elig), 'voted in the Nov 2024 presidential'),
    tile(fmtK(n0(G.inactive)), 'on the suspense list, not counted here'),
    ...(G.so_far && G.so_far.through >= '2026-11-03' ? [] : [tile(fmtK(newTot), 'registered since Nov 2022')]),
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
    const now = r0.key === 'g26', uo = now && r0.official === false;
    const h = r0.contested ? `${lastName(top[0][0])} won this ${S.office} by ${((top[0][2] - top[1][2]) / (r0.total || 1) * 100).toFixed(1)} points in ${r0.short}${uo ? ', unofficial results' : ''}`
                           : `${lastName(top[0][0])} won this ${S.office} unopposed in ${r0.short}`;
    const lines = now
      ? `The ${r0.short} general election for this seat${G.partial ? ', counting only its Tarrant County voters' : ''}, on today’s lines. ${uo ? 'Unofficial election-night results from the county, by precinct; official totals come with the canvass.' : ''}${S.races.length > 1 ? ' The previous race for the seat is shown below it for comparison.' : ''}`
      : r0.same_lines
      ? `The last general election for this seat${G.partial ? ', counting only its Tarrant County voters' : ''}. The district’s lines are the same today.`
      : `The last general election for this seat, under the district lines in place at the time${G.dim === 'cd' ? ' (Tarrant County voters only)' : ''}. Those lines have since been redrawn, so the voters in that race are not exactly the voters on this page.`;
    return `<section aria-labelledby="seat-h"><h2 id="seat-h">${esc(h)}</h2>
      <p class="sub">${lines}${now ? '' : ` Official results from the county’s canvass, ${fmtN(r0.precincts)} precincts.`}</p>
      <div class="sizebar">${S.races.map((r, i) => resRow(Object.assign({}, r, { contest: `${r.contest}, ${r.label.replace(' general election', '')}${r.key === 'g26' && r.official === false ? ' (unofficial)' : ''}${i && !(i === 1 && S.races[0].key === 'g26') ? ' (last contested race)' : ''}${i && r.same_lines === false ? ' (old lines)' : ''}` }), null)).join('')}</div>${MARK}</section>`;
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
  // primary history (D / neither / R) of each early-voting day's voters here, as 100% bars building to Election Day
  const dayLeanHtml = (SF, where, refs) => {
    if (!SF || !SF.days || !SF.days.length || !SF.day1) return '';
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d0 = new Date(SF.day1 + 'T12:00:00'), dd = i => { const d = new Date(d0); d.setDate(d.getDate() + i); return `${MON[d.getMonth()]} ${d.getDate()}`; };
    const z = v => v == null ? 0 : v, tot = r => r ? z(r[0]) + z(r[1]) + z(r[2]) : 0, ok = r => tot(r) >= 50;
    const P = (r, i) => z(r[i]) / (tot(r) || 1), mg = r => { const g = (P(r, 0) - P(r, 1)) * 100; return `${g >= 0 ? 'D' : 'R'}+${Math.abs(g).toFixed(1)}`; };
    const f = v => Math.round(v).toLocaleString('en-US'), p1 = x => (x * 100).toFixed(1) + '%';
    const segs = r => [[P(r, 0), 'var(--dem)', '#fff'], [P(r, 2), 'var(--grid)', 'var(--ink)'], [P(r, 1), 'var(--rep)', '#fff']];
    const tip = s => s.r ? (ok(s.r) ? `${s.lab}${s.sub ? ` (${s.sub})` : ''}: ${f(tot(s.r))} voters · D ${p1(P(s.r, 0))} · Neither ${p1(P(s.r, 2))} · R ${p1(P(s.r, 1))} · ${mg(s.r)}` : `${s.lab}: fewer than 50 voters`) : `${s.lab}: still to come`;
    const build = arr => {
      const sl = Array.from({ length: 12 }, (_, i) => ({ lab: `Day ${i + 1}`, sm: String(i + 1), sub: dd(i), r: arr[i] || null, fut: i >= arr.length }));
      sl.push({ lab: 'Election Day', sm: 'ED', sub: 'Nov 3', r: arr[12] || null, fut: !arr[12], gap: true });
      (refs || []).forEach(([lab, sm, r], i) => r && sl.push({ lab, sm, sub: '', r, ref: true, gap: i === 0 }));
      // columns (wide screens)
      const W = 680, H = 290, m = { l: 34, r: 2, t: 20, b: 38 }, ng = sl.filter(x => x.gap).length, gw = (W - m.l - m.r) / (sl.length + ng * 0.6), bw = Math.min(40, gw * 0.78), ch = H - m.t - m.b;
      let x = m.l, svg = '';
      sl.forEach(s => { if (s.gap) x += gw * 0.6; const cx = x + gw / 2, x0 = cx - bw / 2;
        if (!s.r || !ok(s.r)) svg += `<rect x="${x0}" y="${m.t}" width="${bw}" height="${ch}" fill="none" stroke="var(--grid)" stroke-dasharray="3 3"><title>${tip(s)}</title></rect>` + (s.r && !s.fut ? `<text x="${cx}" y="${m.t + ch / 2}" text-anchor="middle" font-size="9" fill="var(--ink-3)">few</text>` : '');
        else { let y = m.t + ch; svg += `<g opacity="${s.ref ? .75 : 1}"><title>${tip(s)}</title>` + segs(s.r).map(([v, col, fg]) => { const h = v * ch; y -= h;
            return `<rect x="${x0}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" fill="${col}"/>` + (h >= 15 ? `<text x="${cx}" y="${(y + h / 2 + 4).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${fg}" class="num">${Math.round(v * 100)}</text>` : ''); }).join('') + '</g>'
            + `<text x="${cx}" y="${m.t - 6}" text-anchor="middle" font-size="9.5" fill="var(--ink-2)" class="num">${mg(s.r)}</text>`; }
        svg += `<text x="${cx}" y="${H - 21}" text-anchor="middle" font-size="10.5" fill="${s.fut && !s.ref ? 'var(--ink-3)' : 'var(--ink-2)'}">${s.sm}</text><text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="9" fill="var(--ink-3)">${s.ref ? '' : s.sub}</text>`;
        x += gw; });
      svg += [0, .5, 1].map(v => `<text x="${m.l - 5}" y="${(m.t + (1 - v) * ch + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--ink-3)" class="num">${v * 100}%</text>`).join('');
      const cols = `<svg class="dl-cols" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Primary history of each early-voting day's voters, as shares adding to 100%">${svg}</svg>`;
      // rows (phones)
      const rows = `<div class="dl-rows sizebar">${sl.filter(s => !s.fut || s.lab === 'Election Day').map(s => `<div class="sb-row" style="margin:${s.gap ? '12px' : '3px'} 0 3px" title="${tip(s)}"><div class="sb-label"><b>${s.lab}${s.sub ? ` <small style="font-weight:400;color:var(--ink-3)">${s.sub}</small>` : ''}</b><span class="num">${s.r && ok(s.r) ? `${f(tot(s.r))} · ${mg(s.r)}` : s.r ? 'fewer than 50' : ''}</span></div>
        <div class="sb-track" style="height:18px;${s.r && ok(s.r) ? '' : 'background:none;border:1px dashed var(--grid)'}${s.ref ? ';opacity:.75' : ''}">${s.r && ok(s.r) ? segs(s.r).map(([v, col, fg]) => v > 0 ? `<div class="sb-seg" style="flex:${v} 1 0;background:${col};color:${fg}">${v >= .12 ? Math.round(v * 100) + '%' : ''}</div>` : '').join('') : ''}</div></div>`).join('')}</div>`;
      return cols + rows;
    };
    const last = SF.days.at(-1), n = SF.days.length, prev = SF.days[n - 2];
    const e0 = n > 12 && SF.cum && SF.cum[11];
    const h = n > 12 && ok(last) ? `On Election Day ${where}, ${Math.round(P(last, 0) * 100)}% of in-person voters chose a Democratic primary last, ${Math.round(P(last, 2) * 100)}% neither, ${Math.round(P(last, 1) * 100)}% Republican (${mg(last)}${e0 && ok(e0) ? `, against ${mg(e0)} for everyone who voted early or by mail` : ''})`
      : ok(last) ? `Day ${n} here: ${Math.round(P(last, 0) * 100)}% of the day’s in-person voters chose a Democratic primary last, ${Math.round(P(last, 2) * 100)}% neither, ${Math.round(P(last, 1) * 100)}% Republican (${mg(last)}${prev && ok(prev) ? `, against ${mg(prev)} on Day ${n - 1}` : ''})` : 'Who voted each day, by primary history';
    const id = 'dl' + Math.random().toString(36).slice(2, 7);
    return `<style>.dl-rows{display:none!important}@media (max-width:599px){.dl-cols{display:none!important}.dl-rows{display:block!important}}</style>
      <h3 style="margin:22px 0 4px">${h}</h3>
      <p class="note" style="margin-top:0">Each early-voting day ${where}, by the most recent party primary each voter chose since 2022. “Each day on its own” counts only that day’s in-person voters; “Running total” adds them up, mail ballots included.${n > 12 ? ' The Election Day bar is the county’s list of Election Day in-person voters (unofficial; provisional and late mail ballots are not in it).' : ''} Days with fewer than 50 voters are left blank.</p>
      <div class="seg" role="group" aria-label="Voters shown" id="${id}"><button type="button" aria-pressed="true" data-m="d">Each day on its own</button><button type="button" aria-pressed="false" data-m="c">Running total</button></div>
      <div class="chart" data-dl="${id}" data-m="d">${build(SF.days)}</div><div class="chart" data-dl="${id}" data-m="c" hidden>${build(SF.cum || [])}</div>
      <div class="sb-key"><span><i class="sw" style="background:var(--dem)"></i>Democratic primary</span><span><i class="sw" style="background:var(--grid)"></i>Neither</span><span><i class="sw" style="background:var(--rep)"></i>Republican primary</span></div>
      <p class="note">A primary ballot is not a November vote.${(refs || []).some(r => r[2]) ? ' The bars on the right are for comparison.' : ''}</p>`;
  };
  document.addEventListener('click', e => { const b = e.target.closest('button[data-m]'); const g = b && b.parentElement; if (!g || !g.id || !g.id.startsWith('dl')) return;
    g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    document.querySelectorAll(`[data-dl="${g.id}"]`).forEach(c => { c.hidden = c.dataset.m !== b.dataset.m; }); });
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
    if (SF.ld) opts.splice(1, 0, ...[['D', 'Democratic primary voters'], ['none', 'Neither: no primary since 2022'], ['R', 'Republican primary voters']]
      .filter(([k]) => SF.ld[k] && SF.ld[k].n).map(([k, l]) => { const x = SF.ld[k]; return ['l' + k, `${l} (all 2026 voters)`, view({ age: x.age, sex: x.sex, race: x.race }, false)]; }));
    const id = 'dm' + Math.random().toString(36).slice(2, 7);
    return `<h3 style="margin:22px 0 4px">${o.title}</h3>
      ${opts.length > 1 ? `<label class="note" style="display:block;margin:4px 0 8px">Show <select id="${id}" data-dm="${id}" style="font:inherit;margin-left:4px">${opts.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>` : ''}
      ${opts.map(([k, , h], i) => `<div data-dmv="${id}" data-k="${k}"${i ? ' hidden' : ''}>${h}</div>`).join('')}
      <p class="note">“All 2026 voters” compares each group’s share of the voters with its share of active voters: a group whose share of voters is bigger turned out ahead of the rest. Pick a day to see only the people who voted in person that day (or on Election Day), next to the share among all 2026 voters.${SF.ld ? ' The primary-history choices cover every 2026 voter in that group, early, mail and Election Day, by the most recent party primary they chose since 2022.' : ''}${rc ? ' Race and ethnicity are estimates, rounded to the nearest 10.' : ''} Counts under 10 are withheld.${o.note || ''}</p>`;
  };
  document.addEventListener('change', e => { const s = e.target; if (!s.dataset || !s.dataset.dm) return;
    document.querySelectorAll(`[data-dmv="${s.dataset.dm}"]`).forEach(d => { d.hidden = d.dataset.k !== s.value; }); });
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
      <p class="note" style="margin-top:0">Move the sliders to set how each group votes${o && o.where ? ' ' + o.where : ''}. Every voter is grouped by the most recent party primary they chose since 2022. It counts the voters on record${o && o.through ? `, through ${o.through}` : ''}. It is not how anyone actually voted: ballots are secret.${defNote}${o && o.actual ? ' Compare the result with the actual one below.' : ''}</p>
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
  // 2026 turnout so far (county daily lists of returned mail ballots and early voters)
  const SF = G.so_far, CSF = CTY && CTY.so_far;
  const sofarHtml = !SF || !SF.voted ? '' : (() => {
    const of22 = SF.v22 ? SF.voted / SF.v22 : 0, c22 = CSF && CSF.v22 ? CSF.voted / CSF.v22 : null;
    const rel = c22 ? of22 / c22 - 1 : 0;
    const pace = c22 && !isCounty ? ` That’s ${Math.abs(rel) < 0.03 ? 'about even with' : `${Math.round(Math.abs(rel) * 100)}% ${rel > 0 ? 'ahead of' : 'behind'}`} the county as a whole (${c22 > 1 ? `${pc1(c22 - 1)} more than its 2022 total` : `${pc1(c22)} of its 2022 total`}).` : '';
    const mx = Math.max(of22, c22 || 0, 0.01);
    return `<section aria-labelledby="sf-h"><h2 id="sf-h">${fmtN(SF.voted)} ${isCounty ? 'Tarrant County' : ''} voters ${isCounty ? '' : 'here '}voted in the 2026 general election</h2>
      <p class="sub">${SF.through >= '2026-11-03' ? 'Early, mail and Election Day voters on the county’s lists (unofficial; late mail and provisional ballots are not in them yet)' : `Mail ballots returned and early votes cast${SF.through ? ` through ${dlabel(SF.through)}` : ''}, from the county’s daily lists`}. That’s ${pc(SF.voted, SF.reg)} of registered voters ${isCounty ? 'in the county' : 'here'}, and ${of22 > 1 ? `${pc1(of22 - 1)} more voters than ${isCounty ? '' : 'here '}in the entire 2022 midterm` : `${pc1(of22)} of the number who voted ${isCounty ? '' : 'here '}in the entire 2022 midterm`}.${pace}</p>
      <div class="hb"><div class="hb-row"><span class="hb-l">Of 2022 total</span><span class="hb-t"><i style="width:${Math.min(100, of22 / mx * 100)}%;background:var(--ink)"></i>${c22 && !isCounty ? `<em style="left:${Math.min(100, c22 / mx * 100)}%"></em>` : ''}</span><span class="hb-v num">${pc1(of22)}</span></div></div>
      ${!isCounty ? '<p class="note"><i class="cmk"></i> marks the countywide figure.</p>' : ''}${leanHtml()}${scenarioHtml(SF.lean, { where: isCounty ? 'in the county' : 'here', through: SF.through ? dlabel(SF.through) : '', gx: G.xo && G.xo.gov != null && G.xo.cj != null ? G.xo.gov - G.xo.cj : null, actual: (() => { const tp = r => { if (!r) return null; const d = r.cands.find(x => x[1] === 'DEM'), q = r.cands.find(x => x[1] === 'REP'); return d && q ? [r.contest, d[2] / (d[2] + q[2])] : null; }; const r26 = (G.results || []).find(r => r.key === 'g26'); return tp(G.seat && G.seat.races[0] && G.seat.races[0].key === 'g26' && G.seat.races[0].contested ? G.seat.races[0] : r26 ? r26.contests.find(c => c.contest === 'County Judge') : null); })() })}${dayLeanHtml(SF, isCounty ? 'in the county' : 'here', [['2022 early and mail voters here', '2022', SF.lean22 && SF.lean22.every(v => v != null) ? SF.lean22 : null]].concat(!isCounty && CSF && CSF.cum ? [['All 2026 voters, countywide', 'Cty', CSF.cum.at(-1)]] : []))}${demoDayHtml(SF, G, M.age_bands, { title: `Who voted${isCounty ? '' : ' here'}, by age, sex${SF.race ? ' and race' : ''}` })}<p class="note"><a href="${up}turnout/index.html">2026 Turnout Tracker ›</a></p>${MARK}</section>`;
    // who has voted so far by age, sex and estimated race, against the active voters here
    function demoHtml() {
      if (!SF.age || !SF.sex) return '';
      const z = v => v == null ? 0 : v, vt = SF.age.reduce((a, v) => a + z(v), 0) || 1, gt = G.age.reduce((a, v) => a + z(v), 0) || 1;
      const p0 = (a, b) => b && a != null ? Math.round(a / b * 100) + '%' : '—';
      const r10 = v => v == null || v < 10 ? '<10' : (Math.round(v / 10) * 10).toLocaleString('en-US');
      const row = (l, v, g, vT, gT, est) => `<tr><td style="overflow-wrap:normal">${l}</td><td class="r num">${est ? r10(v) : v == null ? '<10' : fmtN(v)}</td><td class="r num">${p0(v, vT)}</td><td class="r num">${p0(g, gT)}</td><td class="r num">${g && v != null ? p0(v, g) : '—'}</td></tr>`;
      const grp = l => `<tr><th colspan="5" style="text-align:left;padding-top:12px">${l}</th></tr>`;
      const sxT = SF.sex.reduce((a, v) => a + z(v), 0) || 1, gsT = G.sex.reduce((a, v) => a + z(v), 0) || 1;
      let body = grp('Age on Election Day') + M.age_bands.map((b, i) => row(b, SF.age[i], G.age[i], vt, gt)).join('')
        + grp('Sex, as recorded') + ['Women', 'Men', 'Not recorded'].map((l, i) => row(l, SF.sex[i], G.sex[i], sxT, gsT)).join('');
      if (SF.race && G.race) { const RL = ['Hispanic', 'White', 'Black', 'Asian or Pacific Islander', 'Other or multiracial'];
        const rT = SF.race.reduce((a, v) => a + z(v), 0) || 1, gR = G.race.reduce((a, v) => a + z(v), 0) || 1;
        body += grp('Race and ethnicity, estimated') + RL.map((l, i) => row(l, SF.race[i], G.race[i], rT, gR, true)).join(''); }
      return `<h3 style="margin:22px 0 4px">Who has voted ${isCounty ? '' : 'here '}so far, by age, sex${SF.race ? ' and race' : ''}</h3>
        <div style="overflow-x:auto"><table class="ntab race-tab" style="white-space:nowrap"><thead><tr><th>Group</th><th class="r">Voted</th><th class="r">Share of voters</th><th class="r">Share of active voters</th><th class="r">Turnout</th></tr></thead><tbody>${body}</tbody></table></div>
        <p class="note">Compare the two share columns: a group whose share of voters is bigger than its share of active voters turned out ahead of the rest. Turnout is each group’s 2026 voters divided by its active registered voters.${SF.race ? ' Race and ethnicity are estimates (see the race and ethnicity section below), rounded to the nearest 10.' : ''} Counts under 10 are withheld.</p>`;
    }
    // primary history of the voters so far (D / neither / R), against the area's 2022 early and mail voters
    function leanHtml() {
      const ok = a => a && a.length === 3 && a.every(v => v != null), sum = a => a[0] + a[1] + a[2];
      if (!ok(SF.lean) || sum(SF.lean) < 50) return '';
      const gt = a => { const g = (a[0] - a[1]) / sum(a) * 100; return `${g >= 0 ? 'D' : 'R'}+${Math.abs(g).toFixed(1)}`; };
      const row = (lab, a) => { const t = sum(a), seg = (v, col, txt) => v > 0 ? `<div class="sb-seg" style="flex:${v / t} 1 0;background:${col};color:${col === 'var(--grid)' ? 'var(--ink)' : '#fff'}">${v / t >= .12 ? txt + ' ' + Math.round(v / t * 100) + '%' : ''}</div>` : '';
        return `<div class="sb-row"><div class="sb-label"><b>${lab}</b><span class="num">${fmtN(t)} · ${gt(a)}</span></div><div class="sb-track" style="height:22px">${seg(a[0], 'var(--dem)', 'D')}${seg(a[2], 'var(--grid)', 'Neither')}${seg(a[1], 'var(--rep)', 'R')}</div></div>`; };
      const allIn = SF.through && SF.through >= '2026-11-03';
      const rows = [[allIn ? 'All 2026 voters (unofficial)' : '2026 so far', SF.lean]];
      if (ok(SF.lean22) && sum(SF.lean22) >= 50) rows.push(['2022 early and mail voters', SF.lean22]);
      if (!isCounty && CSF && ok(CSF.lean)) rows.push([allIn ? 'All 2026 voters, all of Tarrant County' : '2026 so far, all of Tarrant County', CSF.lean]);
      // the last general-election result here, for comparison: the seat's own last contested race, or else the 2024 presidential
      const now26 = G.seat && G.seat.races.find(r => r.key === 'g26');
      const seatRace = G.seat && G.seat.races.find(r => r.contested && r.key !== 'g26');
      const pres = (G.results || []).filter(rs => rs.kind !== 'primary').map(rs => rs.contests.find(c => c.contest === 'President')).find(Boolean);
      const L = seatRace || pres, lrs = !seatRace && pres ? (G.results || []).find(rs => rs.contests.includes(pres)) : null;
      const lastRow = !L ? '' : (() => { const x = split(L), lab = seatRace ? `${L.contest}, ${L.short}` : `President, ${lrs ? lrs.short : '2024'}`;
        const mg = x.d && x.r ? `${x.ds >= x.rs ? 'D' : 'R'}+${(Math.abs(x.ds - x.rs) * 100).toFixed(1)}` : marg(L);
        const seg = (v, col, txt, fg) => v > 0 ? `<div class="sb-seg" style="flex:${v} 1 0;background:${col};color:${fg}">${v >= .12 ? txt + ' ' + Math.round(v * 100) + '%' : ''}</div>` : '';
        return `<div class="sb-row"><div class="sb-label"><b>Result: ${esc(lab)}</b><span class="num">${fmtN(L.total)} votes · ${mg}</span></div><div class="sb-track" style="height:22px">${seg(x.ds, 'var(--dem)', 'D', '#fff')}${seg(x.os, 'var(--grid)', x.ol === 'Others' ? 'Other' : x.ol, 'var(--ink)')}${seg(x.rs, 'var(--rep)', 'R', '#fff')}</div></div>`; })();
      const nowRow = !now26 ? '' : (() => { const x = split(now26), lab = `${now26.contest}, 2026${now26.official === false ? ' (unofficial)' : ''}`;
        const mg = x.d && x.r ? `${x.ds >= x.rs ? 'D' : 'R'}+${(Math.abs(x.ds - x.rs) * 100).toFixed(1)}` : marg(now26);
        const seg = (v, col, txt, fg) => v > 0 ? `<div class="sb-seg" style="flex:${v} 1 0;background:${col};color:${fg}">${v >= .12 ? txt + ' ' + Math.round(v * 100) + '%' : ''}</div>` : '';
        return `<div class="sb-row"><div class="sb-label"><b>Result: ${esc(lab)}</b><span class="num">${fmtN(now26.total)} votes · ${mg}</span></div><div class="sb-track" style="height:22px">${seg(x.ds, 'var(--dem)', 'D', '#fff')}${seg(x.os, 'var(--grid)', x.ol === 'Others' ? 'Other' : x.ol, 'var(--ink)')}${seg(x.rs, 'var(--rep)', 'R', '#fff')}</div></div>`; })();
      return `<h3 style="margin:18px 0 4px">Who voted${isCounty ? '' : ' here'}, by primary history</h3><div class="sizebar">${rows.map(([l, a]) => row(l, a)).join('')}${nowRow}${lastRow}</div>
        <p class="note">The most recent party primary each voter chose since 2022: Democratic, Republican, or neither. A primary ballot is not a November vote; the large 2026 Democratic primary also makes 2026 voters look more Democratic on this measure than 2022 voters.${now26 ? ` The 2026 result bar is the county’s ${now26.official === false ? 'unofficial election-night count; official totals come with the canvass' : 'official canvass'}.` : ''}${L ? ` The last bar is the actual November result ${seatRace ? `the last time this seat was contested${L.same_lines ? '' : ' (under the district lines of that election)'}` : `here in the ${lrs ? lrs.short : '2024'} presidential race`}, for comparison.` : ''}</p>`;
    }
  })();
  // ticket-splitting: how far the U.S. Senate Democrat ran ahead of (or behind) the County Judge Democrat here
  const splitGap = (rs, cr) => {
    const pk = (R_, nm) => { const c = R_ && R_.contests.find(z => z.contest === nm); if (!c) return null; const d = c.cands.find(x => x[1] === 'DEM'), r = c.cands.find(x => x[1] === 'REP'); return d && r ? { d, r, m: (d[2] - r[2]) / ((d[2] + r[2]) || 1) * 100 } : null; };
    const cj = pk(rs, 'County Judge'), se = pk(rs, 'U.S. Senate'); if (!cj || !se) return '';
    const g = se.m - cj.m, ccj = pk(cr, 'County Judge'), cse = pk(cr, 'U.S. Senate'), cg = ccj && cse ? cse.m - ccj.m : null;
    const ln = x => esc(lastName(x[0])), dv = Math.round(se.d[2] - cj.d[2]), rv = Math.round(cj.r[2] - se.r[2]);
    return `<div class="panel" style="margin-top:14px"><p style="margin:0 0 4px;font-weight:600">Senate vs. County Judge: ${ln(se.d)} ran <span class="num">${Math.abs(g).toFixed(1)}</span> points ${g >= 0 ? 'ahead of' : 'behind'} ${ln(cj.d)} ${isCounty ? 'in the county' : 'here'}${cg != null && !isCounty ? ` <small style="font-weight:400;color:var(--ink-3)">(countywide: ${cg.toFixed(1)})</small>` : ''}</p>
      <p class="note" style="margin:0">${ln(se.d)} got <b class="num">${fmtN(dv)}</b> ${dv >= 0 ? 'more' : 'fewer'} votes than ${ln(cj.d)}, and ${ln(se.r)} got <b class="num">${fmtN(Math.abs(rv))}</b> ${rv >= 0 ? 'fewer' : 'more'} than ${ln(cj.r)}. When those two numbers are close, it points to ticket-splitting: voters who chose the Democrat for Senate and the Republican for County Judge.${cg != null && !isCounty ? (g > cg + 1 ? ' The gap here is wider than countywide.' : g < cg - 1 ? ' The gap here is narrower than countywide.' : ' The gap here is about the same as countywide.') : ''} Margins are Democrat minus Republican, as a share of the two.</p></div>`;
  };
  const genHtml = rs => {
    const pres = rs.contests.find(c => c.contest === 'President') || rs.contests[0], x = pres ? split(pres) : null;
    const cr = CTY && (CTY.results || []).find(z => z.key === rs.key);
    let h = `How ${where} voted in ${rs.short}`;
    if (x && x.r && x.d) { const w = x.rs >= x.ds ? x.r : x.d; h = `${lastName(w[0])} carried ${where} by ${Math.abs((x.rs - x.ds) * 100).toFixed(1)} points in ${rs.short}${pres.contest !== 'President' ? ` (${pres.contest})` : ''}`; }
    if (rs.key === 'g26' && (hs || hc)) h = `How ${where} voted in 2026, race by race`;     // the headline already gives the result
    const src = rs.official === false ? `unofficial election-night results for the ${esc(rs.label)}, by precinct` : `${esc(rs.label)} canvass`;
    return `<section aria-labelledby="res-${rs.key}"><h2 id="res-${rs.key}">${esc(h)}</h2>
      <p class="sub">${rs.method === 'bridged'
        ? `${rs.official === false ? 'The county’s' : 'Official results from the county’s'} ${src}, added up within today’s lines.${rs.split >= 0.02 ? ` About ${Math.round(rs.split * 100)}% of these votes come from precincts now split between districts; those are divided by where each precinct’s ${rs.key === 'g26' ? '2026' : 'November 2024'} voters live, so treat the figures as close estimates.` : ''}`
        : `${rs.official === false ? 'The county’s' : 'Official results from the county’s'} ${src}, added up across ${fmtN(rs.precincts)} precincts${G.partial ? ' in the Tarrant County part of the district' : ''}.`} ${rs.key === 'g26' && S6 ? `<b class="num">${fmtN(S6.voted)}</b> voters ${isCounty ? 'in the county' : 'here'} cast ballots, ${pc(S6.voted, S6.reg)} of registered voters.` : `About ${fmtN(rs.ballots)} ballots were cast, ${pc(rs.ballots, rs.registered)} of the voters registered at the time.`}</p>
      <div class="sizebar">${rs.contests.map(c => resRow(c, !c.own && cr ? cr.contests.find(z => z.contest === c.contest) : null)).join('')}</div>${rs.key === 'g26' ? splitGap(rs, cr) : ''}${MARK}</section>`; };
  const GEN = (G.results || []).filter(rs => rs.kind !== 'primary' && !rs.trend), G26 = GEN.filter(rs => rs.key === 'g26');
  // ---------- ten years of voting here: two-party margin by office, 2016-2026, plus turnout
  const trendHtml = (() => {
    const RS = G.results || [], get = (k, c) => { const r = RS.find(x => x.key === k), x = r && r.contests.find(z => z.contest === c); if (!x) return null;
      const d = x.cands.filter(q => q[1] === 'DEM').reduce((a, q) => a + q[2], 0), r_ = x.cands.filter(q => q[1] === 'REP').reduce((a, q) => a + q[2], 0); return d + r_ ? (d - r_) / (d + r_) * 100 : null; };
    const S = [['President', 'var(--ink)', '', [[2016, get('g16', 'President')], [2020, get('g20', 'President')], [2024, get('g24', 'President')]]],
               ['U.S. Senate', 'var(--ink-3)', '4 3', [[2018, get('g18', 'U.S. Senate')], [2020, get('g20', 'U.S. Senate')], [2024, get('g24', 'U.S. Senate')], [2026, get('g26', 'U.S. Senate')]]],
               ['Midterms', 'var(--dem)', '', [[2018, get('g18', 'U.S. Senate')], [2022, get('g22', 'Governor')], [2026, get('g26', 'Governor')]]]]   // drawn last, on top
      .map(([l, c, d, p]) => [l, c, d, p.filter(x => x[1] != null)]).filter(x => x[3].length >= 2);
    if (!S.length || !RS.some(r => r.trend)) return '';
    const M = v => `${v >= 0 ? 'D' : 'R'}+${Math.abs(v).toFixed(1)}`;
    const all = S.flatMap(x => x[3].map(p => p[1])), mx = Math.max(10, ...all.map(Math.abs)), top = Math.ceil(mx / 10) * 10;
    const W = 680, H = 260, m = { l: 46, r: 110, t: 14, b: 30 }, x = y => m.l + (y - 2016) / 10 * (W - m.l - m.r), yy = v => m.t + (top - v) / (2 * top) * (H - m.t - m.b);
    const ticks = []; for (let v = -top; v <= top; v += top <= 30 ? 10 : 20) ticks.push(v);
    let svg = ticks.map(v => `<line x1="${m.l}" x2="${W - m.r}" y1="${yy(v)}" y2="${yy(v)}" stroke="${v === 0 ? 'var(--ink-3)' : 'var(--grid)'}"/><text x="${m.l - 6}" y="${yy(v) + 4}" text-anchor="end" font-size="11" fill="var(--ink-3)" class="num">${v === 0 ? 'Even' : (v > 0 ? 'D+' : 'R+') + Math.abs(v)}</text>`).join('');
    svg += [2016, 2018, 2020, 2022, 2024, 2026].map(y => `<text x="${x(y)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="var(--ink-3)">${y}</text>`).join('');
    const ends = S.map(([l, c, d, p]) => ({ l, c, v: yy(p.at(-1)[1]) })).sort((a, b) => a.v - b.v); ends.forEach((o, i) => { if (i && o.v - ends[i - 1].v < 13) o.v = ends[i - 1].v + 13; });
    S.forEach(([l, c, d, p]) => { const e = ends.find(o => o.l === l);
      svg += `<path d="${p.map((q, i) => `${i ? 'L' : 'M'}${x(q[0]).toFixed(1)},${yy(q[1]).toFixed(1)}`).join('')}" fill="none" stroke="${c}" stroke-width="2.5" ${d ? `stroke-dasharray="${d}"` : ''}/>` +
        p.map(q => `<circle cx="${x(q[0])}" cy="${yy(q[1])}" r="4" fill="${c}" stroke="var(--surface)" stroke-width="1.5"><title>${l} ${q[0]}: ${M(q[1])}</title></circle>`).join('') +
        `<text x="${x(p.at(-1)[0]) + 8}" y="${e.v + 4}" font-size="11" fill="var(--ink-2)">${l} ${M(p.at(-1)[1])}</text>`; });
    const gv = S.find(z => z[0] === 'Midterms'), pr = S.find(z => z[0] === 'President');
    const g0 = gv && gv[3].find(q => q[0] === 2018), g1 = gv && gv[3].find(q => q[0] === 2026), p0 = pr && pr[3].find(q => q[0] === 2016), p1 = pr && pr[3].find(q => q[0] === 2024);
    const h = g0 && g1 ? `${Where} moved ${Math.abs(g1[1] - g0[1]).toFixed(1)} points ${g1[1] >= g0[1] ? 'toward Democrats' : 'toward Republicans'} between the last two midterms, from ${M(g0[1])} in 2018 to ${M(g1[1])} in 2026` : `Ten years of voting ${isCounty ? 'in Tarrant County' : 'here'}`;
    const tr = ['g16', 'g18', 'g20', 'g22', 'g24', 'g26'].map(k => RS.find(r => r.key === k)).filter(Boolean);
    return `<section aria-labelledby="tr-h"><h2 id="tr-h">${esc(h)}</h2>
      <p class="sub">The two-party margin ${isCounty ? 'countywide' : 'here'} at the top of the ballot in every November election since 2016. Midterms use the 2018 U.S. Senate race (Cruz vs. O’Rourke) and the 2022 and 2026 governor’s races; the dashed line follows every U.S. Senate race.${p0 && p1 ? ` For president, the margin went from ${M(p0[1])} in 2016 to ${M(p1[1])} in 2024.` : ''}</p>
      <div class="chart"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Two-party margin by election, 2016 to 2026">${svg}</svg></div>
      ${tr.length ? `<div style="overflow-x:auto"><table class="ntab" style="white-space:nowrap;margin-top:6px"><thead><tr><th>Turnout</th>${tr.map(r => `<th class="r">${r.short}</th>`).join('')}</tr></thead><tbody><tr><td>Ballots cast</td>${tr.map(r => `<td class="r num">${fmtN(r.ballots)}</td>`).join('')}</tr><tr><td>Share of registered</td>${tr.map(r => `<td class="r num">${pc(r.ballots, r.registered)}</td>`).join('')}</tr></tbody></table></div>` : ''}
      <p class="note">County precinct results for each election, added up within today’s lines. Precinct numbers changed over the decade, but the last three digits stayed the same, so each year’s results are matched to today’s precincts on those digits; where a precinct is now split between districts, its votes are divided by where its voters live today. Precinct lines also shifted over ten years, so smaller areas are close estimates. 2026 is unofficial. Registered voters are the county’s count at each election, suspense list included.</p>${MARK}</section>`;
  })();
  const topResults = seatHtml + G26.map(genHtml).join('') + trendHtml;          // the 2026 results: near the top of the page
  const resultsHtml = primaryHtml + GEN.filter(rs => rs.key !== 'g26').map(genHtml).join('');

  const app = $('#app');
  app.insertAdjacentHTML('beforeend', `${crumb}
  <header><div class="eyebrow"><span>The Electorate</span><span>${esc(isCounty ? 'Countywide' : G.group)}</span></div>
    <h1>${esc(h1)}</h1><p class="dek">${dek}</p>
    <div class="asof">Tarrant County voter file, ${dlabel(M.file_date)} · ${fmtN(M.rows)} registration records</div></header>
  <section aria-label="Key numbers"><div class="stats">${tiles}</div></section>
  ${partialNote}
  ${topResults}
  ${sofarHtml}
  ${raceCards ? `<section aria-labelledby="ra-h"><h2 id="ra-h">On the ballot here</h2><p class="sub">${isCounty ? 'Countywide races' : 'Races'} tracked on Follow the Money${G.partial ? '' : ', with each campaign’s cash on hand divided by the number of registered voters'}.</p><ul class="hits">${raceCards}</ul></section>` : ''}
  <section aria-labelledby="to-h"><h2 id="to-h"></h2><p class="sub">Share of today’s registered voters who were on the rolls for each election and cast a ballot in it, back to the 2018 primaries.${G.so_far && G.so_far.through >= '2026-11-03' ? ' The last bar (dark) is Nov 2026, from the county’s early, mail and Election Day voter lists (unofficial), measured against active voters plus anyone who voted.' : ''} Hover or tap a bar for the count.</p>
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
  ${D.directory && D.directory.some(g => g.items.some(x => x.xo)) ? `<section aria-labelledby="xo-h"><h2 id="xo-h">Ticket-splitting and the Neither break, district by district</h2>
    <p class="sub">The 2024 presidential margin, then the 2026 U.S. Senate, governor and County Judge margins (unofficial, Democrat minus Republican as a share of the two). With very little roll-off, the County Judge race is the closest thing to a straight party vote, so the gap between it and the Senate or governor race is a rough measure of crossover voting: “likely crossover” is how many points better the Democrat did in that race than in County Judge.</p>
    <label class="srch"><span>Filter</span><input id="fx" type="search" placeholder="District number, city or school district" autocomplete="off"></label><div id="xo"></div>
    <p class="note">“Neither → D” estimates the share of voters with no party primary since 2022 who voted Democratic for County Judge, assuming 99% of Democratic-primary voters and 95% of Republican-primary voters stayed with their party. All figures are estimates from totals: ballots are secret, areas with split precincts are close estimates, and the Neither estimate is less reliable where few voters have no primary history.</p></section>` : ''}
  ${D.directory && D.directory.some(g => g.items.some(x => x.tr)) ? `<section aria-labelledby="tt-h"><h2 id="tt-h">Ten years of change, district by district</h2>
    <p class="sub">The two-party margin in each November top-of-ticket race since 2016, added up within today’s lines, and how far each area moved between midterms (the 2018 U.S. Senate race to the 2026 governor’s race) and between presidential elections (2016 to 2024). 2018 uses the Senate race because the governor’s race that year had an unusually weak Democratic nominee.</p>
    <label class="srch"><span>Filter</span><input id="ftt" type="search" placeholder="District number, city or school district" autocomplete="off"></label><div id="ttab"></div>
    <p class="note">Each year’s precinct results are matched to today’s precincts by the last three digits of the precinct number. Lines shifted over the decade, so treat smaller areas as close estimates. 2026 is unofficial.</p></section>` : ''}
  ${D.directory && !(D.directory && D.directory.some(g => g.items.some(x => x.xo))) ? `<section aria-labelledby="dir-h"><h2 id="dir-h">Every district, side by side</h2><p class="sub">Pick a district for its full profile. Turnout is the share of today’s registered voters who were on the rolls for that election and voted${D.directory.some(g => g.items.some(x => x.g26)) ? '; Nov ’26 is from the county’s early, mail and Election Day voter lists (unofficial), as a share of active voters plus anyone who voted' : ''}.</p>
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
    ${(G.results || []).length ? '<li>Election results are the county’s official canvass by precinct. In 2025 the county renumbered its precincts by changing only the first digit, which now gives the commissioner precinct, so 2024 precinct 1001 is today’s x001. State House, State Board of Education and the Senate seats on the 2024 ballot are added up exactly from the precincts that voted in those races. Every other area is added up by today’s precinct lines; where a precinct is split between districts, its votes are divided by where its November 2024 voters live.' + ((G.results || []).filter(r => r.unplaced && !r.trend).map(r => ` ${fmtN(r.unplaced)} ${r.short} ballots from precincts with no clear successor today are left out of these area totals.`).join('')) + '</li>' : ''}
  </ul><a href="https://seeitnameitfightit.com" target="_blank" rel="noopener">${esc(M.org)}</a> · <a href="${up}index.html">Follow the Money</a>${isCounty ? '' : ' · <a href="../index.html">The Electorate</a>'}</footer>`);

  // ---------- turnout by election
  // May elections are left off by default: many voters have no May contest, so those bars understate turnout
  let showLocal = false;
  // Nov 2026 (unofficial): everyone on the county's early, mail and Election Day lists, against the same pool as the 2026 panels
  const SF6 = G.so_far, E6 = SF6 && SF6.through >= '2026-11-03' && SF6.voted && SF6.reg ? [{ key: 'g26', date: '2026-11-03', label: 'Nov 2026 midterm (unofficial)', kind: 'general' }] : [];
  if (E6.length) { const sm = r => r ? (r[0] || 0) + (r[1] || 0) + (r[2] || 0) : null; T.g26 = { voted: SF6.voted, elig: SF6.reg, early: SF6.cum && SF6.cum[11] ? sm(SF6.cum[11]) : null, eday: SF6.days && SF6.days[12] ? sm(SF6.days[12]) : null, mail: null, u: true }; }
  const ELS = () => (showLocal ? E : E.filter(e => e.kind !== 'local')).concat(E6);
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
        const bars = e.kind === 'primary' ? rect(x, 0, P(t.d, t.elig), 'var(--dem)') + rect(x, P(t.d, t.elig), tot, 'var(--rep)') : rect(x, 0, tot, t.u ? 'var(--ink)' : 'var(--seq-4)');
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
          : t.u ? `<div class="t-row"><span>Early and mail</span><span>${fmtS(t.early)}</span></div><div class="t-row"><span>Election Day</span><span>${fmtS(t.eday)}</span></div>`
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

  // ---------- ten-year trend table (countywide page)
  if (D.directory && $('#ttab')) {
    const M = v => v == null ? '—' : `<span style="color:${v >= 0 ? 'var(--dem)' : 'var(--rep)'}">${v >= 0 ? 'D' : 'R'}+${Math.abs(v).toFixed(1)}</span>`;
    const SH = (a, b) => a == null || b == null ? '—' : `<b style="color:${b - a >= 0 ? 'var(--dem)' : 'var(--rep)'}">${b - a >= 0 ? 'D' : 'R'}+${Math.abs(b - a).toFixed(1)}</b>`;
    const TH = 'style="white-space:normal;overflow-wrap:normal;word-break:keep-all;vertical-align:bottom;max-width:6em"';
    const head = `<thead><tr><th>District</th>${['President 2016', 'U.S. Senate 2018', 'President 2020', 'Governor 2022', 'President 2024', 'Governor 2026', 'Midterm shift', 'Presidential shift'].map(t => `<th class="r" ${TH}>${t}</th>`).join('')}</tr></thead>`;
    const row = (name, href, partial, t, q) => `<tr${q ? ` data-q="${esc(q.toLowerCase())}"` : ''}><td style="white-space:nowrap">${href ? `<a href="${href}">${esc(name)}</a>` : `<b>${esc(name)}</b>`}${partial ? ' <small class="pt">Tarrant part</small>' : ''}</td>${['p16', 'g18', 'p20', 'g22', 'p24', 'g26'].map(k => `<td class="r num">${M(t[k])}</td>`).join('')}<td class="r num">${SH(t.g18, t.g26)}</td><td class="r num">${SH(t.p16, t.p24)}</td></tr>`;
    $('#ttab').innerHTML = (D.tr_county ? `<div style="overflow-x:auto"><table class="ntab" style="white-space:nowrap">${head}<tbody>${row('Tarrant County', '', false, D.tr_county)}</tbody></table></div>` : '') +
      D.directory.filter(g => g.items.some(x => x.tr)).map((g, i) => `<details class="tt-g"${i < 1 ? ' open' : ''} style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">${esc(g.label)}</summary><div style="overflow-x:auto"><table class="ntab" style="white-space:nowrap">${head}<tbody>${g.items.filter(x => x.tr).map(x => row(x.name, x.slug + '/index.html', x.partial, x.tr, x.name + ' ' + g.label)).join('')}</tbody></table></div></details>`).join('');
    const ft = $('#ftt'); ft.addEventListener('input', () => { const v = ft.value.trim().toLowerCase();
      document.querySelectorAll('#ttab tr[data-q]').forEach(r => { r.hidden = !!v && !r.dataset.q.includes(v); });
      document.querySelectorAll('#ttab .tt-g').forEach(g => { const any = g.querySelector('tr[data-q]:not([hidden])'); g.hidden = !any; if (v && any) g.open = true; }); });
  }
  // ---------- crossover table (countywide page)
  if (D.directory && $('#xo')) {
    const M = v => v == null ? '—' : `<span style="color:${v >= 0 ? 'var(--dem)' : 'var(--rep)'}">${v >= 0 ? 'D' : 'R'}+${Math.abs(v).toFixed(1)}</span>`;
    const X = v => v == null ? '—' : `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}`;
    const row = (name, href, partial, x, q) => `<tr${q ? ` data-q="${esc(q.toLowerCase())}"` : ''}><td style="white-space:nowrap">${href ? `<a href="${href}">${esc(name)}</a>` : `<b>${esc(name)}</b>`}${partial ? ' <small class="pt">Tarrant part</small>' : ''}</td><td class="r num">${M(x.p24)}</td><td class="r num">${M(x.se)}</td><td class="r num">${M(x.gov)}</td><td class="r num">${M(x.cj)}</td><td class="r num"><b>${X(x.se != null && x.cj != null ? x.se - x.cj : null)}</b></td><td class="r num"><b>${X(x.gov != null && x.cj != null ? x.gov - x.cj : null)}</b></td><td class="r num">${x.nd == null ? '—' : Math.round(x.nd) + '%'}</td></tr>`;
    const TH = 'style="white-space:normal;overflow-wrap:normal;word-break:keep-all;hyphens:none;vertical-align:bottom;max-width:6.5em"';   // headers wrap between words only
    const head = `<thead><tr><th>District</th>${['2024 president', '2026 Senate', 'Governor', 'County Judge', 'Likely Senate crossover', 'Likely governor crossover', 'Neither →&nbsp;D'].map(t => `<th class="r" ${TH}>${t}</th>`).join('')}</tr></thead>`;
    $('#xo').innerHTML = (D.xo_county ? `<div style="overflow-x:auto"><table class="ntab" style="white-space:nowrap">${head}<tbody>${row('Tarrant County', '', false, D.xo_county)}</tbody></table></div>` : '') +
      D.directory.filter(g => g.items.some(x => x.xo)).map((g, i) => `<details class="xo-g"${i < 1 ? ' open' : ''} style="margin-top:12px"><summary style="cursor:pointer;font-weight:600">${esc(g.label)}</summary><div style="overflow-x:auto"><table class="ntab" style="white-space:nowrap">${head}<tbody>${g.items.filter(x => x.xo).map(x => row(x.name, x.slug + '/index.html', x.partial, x.xo, x.name + ' ' + g.label)).join('')}</tbody></table></div></details>`).join('');
  }
  if ($('#fx')) { const fx = $('#fx'); fx.addEventListener('input', () => { const v = fx.value.trim().toLowerCase();
      document.querySelectorAll('#xo tr[data-q]').forEach(r => { r.hidden = !!v && !r.dataset.q.includes(v); });
      document.querySelectorAll('#xo .xo-g').forEach(g => { const any = g.querySelector('tr[data-q]:not([hidden])'); g.hidden = !any; if (v && any) g.open = true; }); }); }
  // ---------- directory (countywide page): replaced by the crossover table once 2026 results are in
  if (D.directory && $('#dir')) {
    $('#dir').innerHTML = D.directory.map(g => `<div class="dir-g"><h3 class="near-h">${esc(g.label)}</h3><table class="ntab"><thead><tr><th>District</th><th class="r">Registered</th><th class="r">Nov ’22</th><th class="r">Nov ’24</th><th class="r">${g.items.some(x => x.g26) ? 'Nov ’26' : 'Mar ’26 primary'}</th></tr></thead><tbody>
      ${g.items.map(x => `<tr data-q="${esc((x.name + ' ' + g.label).toLowerCase())}"><td><a href="${x.slug}/index.html">${esc(x.name)}</a>${x.partial ? ' <small class="pt">Tarrant part</small>' : ''}</td><td class="r num">${fmtS(x.reg)}</td><td class="r num">${x.g22}</td><td class="r num">${x.g24}</td><td class="r num">${g.items.some(y => y.g26) ? (x.g26 || '—') : `<span style="color:var(--dem)">${fmtS(x.d)}</span> · <span style="color:var(--rep)">${fmtS(x.r)}</span>`}</td></tr>`).join('')}</tbody></table></div>`).join('');
    const f = $('#f'); f.addEventListener('input', () => { const v = f.value.trim().toLowerCase();
      document.querySelectorAll('#dir tr[data-q]').forEach(r => { r.hidden = !!v && !r.dataset.q.includes(v); });
      document.querySelectorAll('#dir .dir-g').forEach(g => { g.hidden = !g.querySelector('tr[data-q]:not([hidden])'); }); });
  }

  drawTurnout(); drawAge();
  let rt; if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(drawTurnout, 80); }).observe(app);
})();
