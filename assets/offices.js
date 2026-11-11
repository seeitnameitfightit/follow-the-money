/* Tarrant County hub ("Who serves") and the Elections shelf, from the JSON build_offices.py embeds in the page. */
(function () {
  const el = document.getElementById('offices-data'); if (!el) return;
  const D = JSON.parse(el.textContent);
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtN = v => v == null ? '' : Math.round(v).toLocaleString('en-US');
  const pc1 = v => (v * 100).toFixed(1) + '%';
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dt = s => new Date(s + 'T12:00:00');
  const dlong = s => { const d = dt(s); return `${DOW[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
  const dshort = s => { const d = dt(s); return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`; };
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const days = s => Math.round((dt(s) - today) / 864e5);
  const upcoming = (D.calendar || []).filter(c => days(c.date) >= 0);
  const PN = { D: 'Democrat', R: 'Republican' }, PC = { D: 'var(--dem)', R: 'var(--rep)' };
  const party = p => p && PN[p] ? `<span style="color:${PC[p]}">${PN[p]}</span>` : (p ? esc(p) : '<span class="muted">—</span>');
  const SRC = `<p class="note">Officeholders and terms come from Tarrant County’s roster of elected officials and the county’s results reports, checked against each city’s and school district’s own pages. November 2026 winners are from the unofficial election-night count until the county canvasses the results. <a href="../tarrant/index.html#method">How this list is kept</a></p>`;
  const calHtml = (list, root) => `<ol class="cal">${list.map(c => { const n = days(c.date);
    return `<li><div class="cal-d"><b>${dshort(c.date)}</b><small>${n === 0 ? 'today' : n === 1 ? 'tomorrow' : `${fmtN(n)} days away`}</small></div><div class="cal-t"><b>${esc(c.label)}</b>${c.detail ? `<small>${esc(c.detail)}</small>` : ''}${c.href ? ` <a href="${root}${c.href}">See the seats</a>` : ''}</div></li>`; }).join('')}</ol>`;
  const app = $('#app');

  /* ================= Tarrant: who serves ================= */
  if (D.page === 'tarrant') {
    const SEQ = ['var(--seq-5)', 'var(--seq-4)', 'var(--seq-3)', 'color-mix(in oklab,var(--seq-3) 60%,var(--seq-2))', 'var(--seq-2)', 'var(--seq-1)', 'color-mix(in oklab,var(--seq-1) 60%,var(--surface))'];
    const counts = D.counts.slice().sort((a, b) => b[1] - a[1]);
    const bar = `<div class="ob-bar" role="img" aria-label="${esc(counts.map(c => `${c[0]} ${c[1]}`).join(', '))}">${counts.map((c, i) => `<div style="flex:${c[1]} 1 0;background:${SEQ[i]};color:${i < 3 ? '#fff' : 'var(--ink)'}">${c[1] >= 6 ? c[1] : ''}</div>`).join('')}</div>
      <div class="ob-key">${counts.map((c, i) => `<span><i style="background:${SEQ[i]}"></i>${esc(c[0])} <b class="num">${c[1]}</b></span>`).join('')}</div>`;
    // ---- May 2027
    const yr = s => (String(s || '').match(/(\d{4})/) || [])[1] || '';
    const lastRace = s => {
      if (s.note && s.runoff) return `${pc1(s.pct)} in round one; ${esc(s.note.replace(/^Won/, 'won'))}`;
      if (s.runoff) return `Led round one with ${pc1(s.pct)}; runoff result being confirmed`;
      if (s.cancelled) return `Unopposed, election cancelled (${yr(s.last)})`;
      if (s.cands === 1) return `Unopposed (${yr(s.last)})`;
      if (s.pct != null) return `Won with ${pc1(s.pct)} (${yr(s.last)})${s.special ? ', special election' : ''}`;
      return s.last ? `Elected ${yr(s.last)}${s.special ? ' in a special election' : ''}` : '<span class="muted">Being confirmed</span>';
    };
    const byJ = {}; D.may.forEach(s => (byJ[s.jur] = byJ[s.jur] || []).push(s));
    const jOrder = Object.keys(byJ).sort((a, b) => a === 'Fort Worth' ? -1 : b === 'Fort Worth' ? 1 : (byJ[a][0].isd - byJ[b][0].isd) || (byJ[b].length - byJ[a].length) || a.localeCompare(b));
    const seatRow = s => `<tr data-q="${esc((s.jur + ' ' + s.seat + ' ' + (s.holder || '')).toLowerCase())}"><td>${esc(s.seat)}</td><td>${s.holder ? esc(s.holder) : '<span class="muted">Being confirmed</span>'}</td><td>${lastRace(s)}</td><td class="r num">${s.votes != null && !s.cancelled ? fmtN(s.votes) : '—'}</td><td class="r num">${s.cands || '—'}</td></tr>`;
    const fw = (byJ['Fort Worth'] || []).filter(s => /District/.test(s.seat) && s.votes);
    const fwLine = fw.length ? `<p class="note">In May 2025, Fort Worth’s council races drew between ${fmtN(Math.min(...fw.map(s => s.votes)))} and ${fmtN(Math.max(...fw.map(s => s.votes)))} votes each.</p>` : '';
    const seatList = ss => ss.map(s => s.seat.replace(/^(Council|Trustee),? /, '')).join(', ');
    const known = ss => ss.filter(s => s.holder).length;
    const mayTables = jOrder.map(j => `<details class="ob-j" data-g="may"${j === 'Fort Worth' ? ' open' : ''}><summary><h3>${esc(j)} <small>${byJ[j].length} seat${byJ[j].length === 1 ? '' : 's'}</small></h3><span>${esc(seatList(byJ[j]))}${known(byJ[j]) < byJ[j].length ? ` · ${known(byJ[j]) ? `${byJ[j].length - known(byJ[j])} holder${byJ[j].length - known(byJ[j]) === 1 ? '' : 's'} being confirmed` : 'holders being confirmed'}` : ''}</span></summary>
      <div class="tscroll"><table class="ntab ot may"><colgroup><col style="width:22%"><col style="width:24%"><col style="width:32%"><col style="width:11%"><col style="width:11%"></colgroup><thead><tr><th>Seat</th><th>Holds it</th><th>Last race</th><th class="r">Votes cast</th><th class="r">Candidates</th></tr></thead><tbody>${byJ[j].map(seatRow).join('')}</tbody></table></div>${j === 'Fort Worth' ? fwLine : ''}</details>`).join('');
    const offBy = k => D.off_may.filter(o => o.kind === k).map(o => o.jur);
    const offNote = [[offBy('november'), 'Hold elections in November instead'], [offBy('takeover'), 'Run by a state-appointed Board of Managers; the elected board is suspended'], [offBy('none'), 'No regular city election in May 2027']]
      .filter(x => x[0].length).map(([js, t]) => `<li><b>${esc(t)}:</b> ${esc(js.join(', '))}</li>`).join('');
    // ---- offices
    const officeRow = o => {
      const R = o.result, links = [o.el ? `<a href="../${o.el}">Voters</a>` : '', o.race ? `<a href="../${o.race}">2026 money</a>` : ''].filter(Boolean).join(' · ');
      let who, p, term, next;
      if (o.leaving) { who = `${esc(o.holder)}<small>${esc(o.leaving)}</small>`; p = party(o.party); term = esc(o.term); next = '—'; }
      else if (R) {
        const share = R.total ? R.wv / R.total : null;
        const how = !R.l ? 'Unopposed in Nov 2026' : `Won Nov 2026 with ${pc1(share)}${R.scope === 'Texas' ? ' statewide' : ''} (unofficial)`;
        who = `${esc(o.next_holder)}${o.new ? ' <b class="new">new</b>' : ''}<small>${how}${o.new ? ` · succeeds ${esc(o.holder)}` : ''}</small>`;
        p = party(o.next_party); term = o.term_next; next = `Nov ${o.term_next}`;
      } else if (o.pending) { who = `${esc(o.holder)}<small>Seat was on the Nov 2026 ballot; result being added</small>`; p = party(o.party); term = '—'; next = '—'; }
      else { who = esc(o.holder); p = party(o.party); term = esc(o.term); next = esc(o.next || ''); }
      return `<tr data-q="${esc((o.office + ' ' + o.holder + ' ' + (o.next_holder || '')).toLowerCase())}"><td>${esc(o.office)}</td><td>${who}</td><td>${p}</td><td class="num">${term}</td><td>${next}</td><td class="lk">${links}</td></tr>`;
    };
    const groups = D.groups.map((g, i) => `<details class="ob-g" id="g-${g.key}" data-g="${g.key}"${i === 0 ? ' open' : ''}><summary><h2>${esc(g.label)} <small class="num">${g.rows.filter(o => !o.leaving).length}</small></h2><span>${esc(g.note)}</span></summary>
      <div class="tscroll"><table class="ntab ot"><thead><tr><th>Office</th><th>Holds it${g.rows.some(o => o.result) ? ' from January 2027' : ''}</th><th>Party</th><th>Term ends</th><th>Next election</th><th></th></tr></thead><tbody>${g.rows.map(officeRow).join('')}</tbody></table></div></details>`).join('');
    // ---- special districts
    const spec = D.special.map(s => `<div class="ob-card"><b>${esc(s.name)}</b><span>${esc(s.what)}</span>${s.seats.length ? `<ul>${s.seats.map(x => x.runoff
        ? `<li>${esc(x.seat)}: <b>runoff ${dshort(x.runoff)}</b> <small>${esc(x.pair[0][0])} (${pc1(x.pair[0][1])}) vs. ${esc(x.pair[1][0])} (${pc1(x.pair[1][1])}); no one won a majority of ${fmtN(x.votes)} votes</small></li>`
        : `<li>${esc(x.seat)}: <b>${esc(x.holder)}</b> <small>won with ${pc1(x.pct)} of ${fmtN(x.votes)} votes</small></li>`).join('')}</ul>` : ''}${s.when ? `<small>${esc(s.when)}</small>` : ''}</div>`).join('');
    const total = D.total;
    app.innerHTML = `<p class="crumb"><a href="../index.html">Home</a> › Tarrant County</p>
      <header><div class="eyebrow"><span>Tarrant County</span><span>Who serves</span></div>
        <h1>Who serves Tarrant County, and when each seat is up</h1>
        <p class="dek">Every elected office that represents people in Tarrant County, from Congress to the constable. The federal, state and county offices are complete; city councils, school boards and special districts are added as each seat is confirmed.</p>
        <div class="asof">Holders from January 2027 reflect the unofficial November 3 results · list checked ${dshort(D.built)}</div></header>
      <section aria-labelledby="sc-h"><h2 id="sc-h">${total} federal, state and county offices</h2>${bar}
        <div class="ob-cards"><a class="ob-card" href="#may"><b>City councils and school boards</b><span>${D.may.length} seats confirmed on the May 1, 2027 ballot so far</span></a>
          <a class="ob-card" href="#special"><b>Special districts</b><span>${(() => { const t = (D.special.find(s => s.seats.length) || { seats: [] }).seats, ro = t.filter(x => x.runoff).length, w = t.length - ro;
          return `${w} appraisal board seat${w === 1 ? '' : 's'} decided in November${ro ? `, ${ro} in a ${dshort(t.find(x => x.runoff).runoff).replace(/, \d{4}$/, '')} runoff` : ''}; the college and water district boards are being confirmed`; })()}</span></a></div></section>
      <section aria-labelledby="cal-h"><h2 id="cal-h">What’s next on the ballot</h2>${calHtml(upcoming, '../')}</section>
      <section aria-label="Find an office" class="ob-filter"><label class="srch"><span>Find an office</span><input id="oq" type="search" placeholder="Office, name, city or school district" autocomplete="off"></label>
        <label class="ob-sel"><span>Show</span><select id="og"><option value="">Everything</option><option value="may">May 2027 seats</option>${D.groups.map(g => `<option value="${g.key}">${esc(g.label)}</option>`).join('')}<option value="special">Special districts</option></select></label></section>
      <section aria-labelledby="may-h" id="may" data-g="may"><h2 id="may-h">Up May 1, 2027</h2>
        <p class="sub">Nonpartisan city and school seats. Only seats that a city or district has confirmed for 2027 are listed; more are added as each is confirmed.</p>
        ${mayTables}${offNote ? `<ul class="ob-off">${offNote}</ul>` : ''}</section>
      <section aria-labelledby="sp-h" id="special" data-g="special"><h2 id="sp-h">Special districts</h2><div class="ob-cards">${spec}</div></section>
      <section aria-labelledby="all-h" id="all"><h2 id="all-h" class="vh">Federal, state and county offices</h2>${groups}</section>
      <section aria-labelledby="el-h" class="panel ob-el"><div><h2 id="el-h">The Electorate: who votes in each of these places</h2><p class="sub">Profiles for 136 areas, from commissioner precincts to school board districts: who is registered, who turns out, how each has voted since 2000, and a precinct-by-precinct map.</p></div><a class="btn" href="../electorate/index.html">Browse the Electorate</a></section>
      <section id="method" aria-labelledby="m-h"><h2 id="m-h">How this list is kept</h2>
        <p class="sub">Federal, state and county offices come from Tarrant County’s roster of elected officials. City and school seats come from each entity’s own election pages, ordinances and charters, with vote totals from the county’s cumulative results reports. A seat is listed for May 2027 only once the city or district has confirmed it; seats worked out from an election cycle wait until they are confirmed. After each election the list is updated from the county’s results and the refreshed roster.</p>${SRC}</section>`;
    // filter
    const q = $('#oq'), g = $('#og');
    const run = () => {
      const v = q.value.trim().toLowerCase(), gv = g.value;
      document.querySelectorAll('[data-g]').forEach(sec => {
        const k = sec.dataset.g, inG = !gv || gv === k || (gv === 'may' && sec.id === 'may');
        if (sec.id === 'may' || sec.id === 'special') { sec.hidden = !inG; }
        if (sec.classList.contains('ob-g')) { sec.hidden = !(!gv || gv === k); }
      });
      document.querySelectorAll('tr[data-q]').forEach(r => { r.hidden = !!v && !r.dataset.q.includes(v); });
      document.querySelectorAll('.ob-j').forEach(j => { const any = j.querySelector('tr[data-q]:not([hidden])'); j.hidden = !!v && !any; if (v && any) j.open = true; });
      document.querySelectorAll('.ob-g').forEach(d => { const any = d.querySelector('tr[data-q]:not([hidden])'); if (v) { d.hidden = d.hidden || !any; if (any) d.open = true; } });
    };
    q.addEventListener('input', run); g.addEventListener('change', run);
    if (location.hash && $(location.hash)) { const t = $(location.hash); if (t.tagName === 'DETAILS') t.open = true; }
    return;
  }

  /* ================= Elections shelf ================= */
  if (D.page === 'elections') {
    const S = D.sections || {}, n = k => S[k] && S[k].count;
    const card = (href, title, text, stat) => `<a class="ob-card" href="../${href}"><b>${title}</b>${stat ? `<span class="ob-stat num">${stat}</span>` : ''}<span>${text}</span></a>`;
    const nx = upcoming[0];
    app.innerHTML = `<p class="crumb"><a href="../index.html">Home</a> › Elections</p>
      <header><div class="eyebrow"><span>Elections</span></div><h1>Tarrant County elections</h1>
        <p class="dek">Results, turnout and the money in each race, starting with 2026. Each new election joins this shelf, and every district’s results go back to 2000.</p></header>
      ${nx ? `<section aria-labelledby="nx-h" class="next-up"><div><small>Next on the ballot</small><h2 id="nx-h">${dlong(nx.date)}</h2><p>${esc(nx.label)}${nx.detail ? `. ${esc(nx.detail)}.` : ''}</p>${nx.href ? `<a href="../${nx.href}">See the seats</a>` : ''}</div><div class="nu-n"><b class="num">${fmtN(days(nx.date))}</b><small>days away</small></div></section>` : ''}
      <section aria-labelledby="g26-h"><h2 id="g26-h">November 3, 2026 general election</h2><p class="sub">Unofficial until the county canvasses the results.</p>
        <div class="ob-cards">
          ${card('electorate/index.html', 'How Tarrant voted', 'County Judge, U.S. Senate and governor results countywide and in every district, with ticket-splitting district by district.')}
          ${card('turnout/index.html', '2026 Turnout Tracker', 'Final turnout from the election-night count, against 2018, 2022 and 2024, with the early vote day by day.', n('turnout') ? `${n('turnout')} ballots` : '')}
          ${card('statewide/index.html', 'Statewide races', 'Governor through railroad commissioner and the U.S. Senate: results across Texas and in Tarrant, and the money in each race.', n('statewide') ? `${n('statewide')} races` : '')}
          ${card('local/index.html', 'Tarrant County races', 'County Judge, commissioners, district attorney, clerks, justices of the peace and the courts: the money in each race.', n('local') ? `${n('local')} races` : '')}
          ${card('house/index.html', 'Texas House and Senate', 'Every contested legislative race in Texas, with the money in each.', n('house') ? `${n('house')} House races` : '')}
          ${card('sboe/index.html', 'State Board of Education and high courts', 'The State Board of Education and the state’s two highest courts.', '')}
        </div></section>
      <section aria-labelledby="p26-h"><h2 id="p26-h">March 3, 2026 primaries</h2>
        <div class="ob-cards">${card('electorate/index.html', 'Who voted in which primary', 'Democratic and Republican primary turnout in every district, and how primary voters broke in November.')}</div></section>
      <section aria-labelledby="hx-h"><h2 id="hx-h">Every November since 2000</h2>
        <div class="ob-cards">${card('electorate/index.html', 'How each district has moved', 'Top-of-ticket results and turnout from 2000 to 2026 for every district, matched to today’s lines, with a precinct-by-precinct map.')}</div></section>
      ${upcoming.length > 1 ? `<section aria-labelledby="cal-h"><h2 id="cal-h">After that</h2>${calHtml(upcoming.slice(1), '../')}</section>` : ''}`;
  }
})();
