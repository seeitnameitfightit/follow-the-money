/* Follow the Money: Money Web pages (hub, donor, PAC). Data is embedded as JSON by build_site.py / build_network.py. */
(function () {
  /* SINIFI brand: logo top-right on every page, small source mark on shareable pieces */
  const ASSET = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');
  const LOGO = ASSET + 'sinifi-logo.png';
  const MARK = `<div class="mark"><img src="${LOGO}" alt="" width="22" height="18">See It. Name It. Fight It. · data.seeitnameitfightit.com</div>`;
  setTimeout(() => { const app = document.getElementById('app'); if (app && !app.querySelector('.brand')) app.insertAdjacentHTML('afterbegin', `<a class="brand" href="https://seeitnameitfightit.com" target="_blank" rel="noopener"><img src="${LOGO}" alt="See It. Name It. Fight It." width="64" height="52"></a>`); }, 0);

  const $ = (s, el = document) => el.querySelector(s);
  const el = $('#net-data'); if (!el) return;
  const N = JSON.parse(el.textContent), M = N.meta, P = N.page;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt$ = v => '$' + Math.round(v).toLocaleString('en-US');
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  const fmtK = v => { const a = Math.abs(v); if (a >= 1e6) return '$' + (v / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M'; if (a >= 1e3) return '$' + Math.round(v / 1e3) + 'K'; return '$' + Math.round(v); };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dlabel = s => { const [y, m, d] = s.split('-'); return `${MONTHS[+m - 1]} ${+d}, ${y}`; };
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const poss = s => s + (s.endsWith('s') ? '’' : '’s');
  const hub = P === 'hub';
  const href = l => l ? (hub ? l.href.replace(/^\.\.\//, '') : l.href) : null;
  const a = (txt, l) => l ? `<a href="${href(l)}">${esc(txt)}</a>` : esc(txt);
  const since = dlabel(N.since);
  const home = hub ? '../' : '../../';
  const crumb = hub ? `<p class="crumb"><a href="../index.html">Home</a></p>` : `<p class="crumb"><a href="../../index.html">Home</a> › <a href="../index.html">${esc(N.web_title)}</a></p>`;
  const eyebrow = `<div class="eyebrow"><span>${esc(M.org)}</span><span>${esc(N.web_title)}</span></div>`;
  const asof = `<div class="asof">Itemized contributions since ${since} · Texas Ethics Commission data downloaded ${esc(M.data_downloaded)}</div>`;
  const method = `<section class="notes" aria-label="How this works"><p><b>How to read this.</b> Every figure comes from contributions reported to the Texas Ethics Commission since ${since}. When a donor gives to a PAC and that PAC gives to a candidate or another PAC, we credit each donor with a share of what the PAC passed on, in proportion to how much of the PAC’s money that donor supplied. Money in a PAC is pooled, so those pass-through figures are estimates of where the money came from, not a record of specific checks.</p><p>This shows who funds what. It does not show coordination between donors or committees. Federal PACs, nonprofits that do not disclose donors, and spending outside Texas campaign finance reports are not included.</p></section>`;
  const foot = `<footer>Figures come from <a href="https://www.ethics.state.tx.us/search/cf/" target="_blank" rel="noopener">Texas Ethics Commission</a> filings, downloaded ${esc(M.data_downloaded)}. Records replaced by amended reports are left out. <a href="https://seeitnameitfightit.com" target="_blank" rel="noopener">${esc(M.org)}</a></footer>`;
  const bars = (rows, max, opt = {}) => `<ol class="blist">${rows.map((r, i) => `<li><span class="bl-name"><b>${opt.rank ? (i + 1) + '. ' : ''}${a(r.name, r.link)}</b><small>${esc(r.sub || '')}</small></span><span class="bl-amt num">${fmtK(r.amt)}${r.small ? `<small>${esc(r.small)}</small>` : ''}</span><span class="bl-trk"><i style="width:${Math.max(.6, r.amt / (max || 1) * 100)}%"></i>${r.amt2 ? `<i class="b2" style="width:${Math.max(.6, r.amt2 / (max || 1) * 100)}%"></i>` : ''}</span></li>`).join('')}</ol>`;

  function pie(box, title, slices, total, bigLabel) {
    const shade = i => `color-mix(in oklab, var(--web) ${Math.round(100 - i * 7)}%, var(--surface))`;
    slices = slices.map((s, i) => ({ ...s, col: s.other ? 'color-mix(in oklab, var(--ink-3) 30%, var(--surface))' : shade(i), dark: !s.other && i < 5 }));
    const tot = slices.reduce((p, s) => p + s.amt, 0) || 1, R0 = 100, cx = 110, cy = 110; let a0 = -Math.PI / 2;
    const paths = slices.map((s, i) => {
      const frac = s.amt / tot, a1 = a0 + frac * 2 * Math.PI, large = frac > .5 ? 1 : 0;
      const p0 = [cx + R0 * Math.cos(a0), cy + R0 * Math.sin(a0)], p1 = [cx + R0 * Math.cos(a1), cy + R0 * Math.sin(a1)];
      const d = frac >= .9999 ? `M${cx},${cy - R0} A${R0},${R0} 0 1 1 ${cx - .01},${cy - R0} Z` : `M${cx},${cy} L${p0[0].toFixed(2)},${p0[1].toFixed(2)} A${R0},${R0} 0 ${large} 1 ${p1[0].toFixed(2)},${p1[1].toFixed(2)} Z`;
      const am = (a0 + a1) / 2, lr = frac > .25 ? R0 * .55 : R0 * .68;
      const lbl = frac >= .06 ? `<text x="${(cx + lr * Math.cos(am)).toFixed(1)}" y="${(cy + lr * Math.sin(am) + 4).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="700" fill="${s.dark ? 'var(--bg)' : 'var(--ink)'}" pointer-events="none">${Math.round(frac * 100)}%</text>` : '';
      a0 = a1;
      return `<path d="${d}" fill="${s.col}" stroke="var(--surface)" stroke-width="1.5" data-i="${i}" class="slice"><title>${esc(s.name)}: ${fmt$(s.amt)} (${(frac * 100).toFixed(1)}%)</title></path>${lbl}`;
    }).join('');
    box.innerHTML = `<div class="pie-head"><b>${esc(title)}</b><span class="num">${fmt$(total)}</span></div>
      <div class="pie-wrap"><svg viewBox="0 0 220 220" role="img" aria-label="${esc(title)}">${paths}</svg><div class="pie-big">${bigLabel}</div></div>
      <ol class="pie-list">${slices.map((s, i) => `<li data-i="${i}"><i class="sw" style="background:${s.col}"></i><span class="pl-name"><b>${s.other ? '' : (i + 1) + '. '}${a(s.name, s.link)}</b><small>${esc(s.meta || '')}</small></span><span class="pl-amt num">${fmt$(s.amt)}<small>${(s.amt / tot * 100).toFixed(1)}%</small></span></li>`).join('')}</ol>${MARK}`;
    const hl = i => { box.querySelectorAll('.slice').forEach(p => p.style.opacity = (i === null || +p.dataset.i === i) ? 1 : .35); box.querySelectorAll('.pie-list li').forEach(li => li.classList.toggle('on', +li.dataset.i === i)); };
    box.querySelectorAll('.slice, .pie-list li').forEach(n => { n.addEventListener('mouseenter', () => hl(+n.dataset.i)); n.addEventListener('mouseleave', () => hl(null)); n.addEventListener('click', () => hl(+n.dataset.i)); });
  }

  const app = $('#app');
  /* ---------------- HUB ---------------- */
  if (hub) {
    const H = N.hub, maxD = H.donors[0] ? H.donors[0].total : 1;
    const seedNames = H.seeds.map(s => s.name);
    const pacsTop = H.pacs.slice(0, 12);
    app.innerHTML = `${crumb}<header>${eyebrow}<h1>${H.ndonors} donors. ${fmtK(H.total)}. One web of money.</h1>
      <p class="dek">${esc(H.dek)}</p>${asof}</header>
      <section class="stats" aria-label="At a glance"><div><b class="num">${fmtK(H.total)}</b><span>given since ${since}</span></div><div><b class="num">${H.ndonors}</b><span>donors and family trusts</span></div><div><b class="num">${fmtN(H.ncommittees)}</b><span>committees funded directly</span></div></section>
      <section aria-labelledby="h-d"><h2 id="h-d">The donors</h2><p class="sub">Everyone who gave $500,000 or more to ${esc(seedNames.join(' or '))} since ${since}, plus Jeff Yass. Bars show everything each one gave to Texas committees in that time.</p>
        ${bars(H.donors.map(d => ({ name: d.name, link: { href: `../${d.slug}/index.html` }, amt: d.total, sub: `${d.home ? d.home + ' · ' : ''}top: ${d.top.map(t => t[0]).join(', ')}` })), maxD)}</section>
      <section aria-labelledby="h-p"><h2 id="h-p">The PACs in the middle</h2><p class="sub">PACs that got at least a quarter of their money from these donors, directly or through other PACs. The dark bar is the share traced to the web.</p>
        <div class="idx-list">${pacsTop.map(p => `<a class="card" href="${p.slug}/index.html"><div class="office">${esc(p.name)}<span>${pct(p.web, p.raised)}% ›</span></div>
          <div class="share"><i style="width:${pct(p.web, p.raised)}%"></i></div>
          <div class="foot num">${fmtK(p.web)} of ${fmtK(p.raised)} raised · ${esc(p.funders.join(', '))}</div></a>`).join('')}</div>
        ${H.pacs.length > pacsTop.length ? `<p class="note">${H.pacs.length - pacsTop.length} more: ${H.pacs.slice(12).map(p => `<a href="${p.slug}/index.html">${esc(p.name)}</a>`).join(' · ')}</p>` : ''}</section>
      <section aria-labelledby="h-f"><h2 id="h-f">Where the money lands</h2><p class="sub">The candidates and committees that received the most money from these donors, counting what reached them through PACs. Names under each are the biggest sources.</p>
        ${bars(H.finals.map(f => ({ name: f[0], link: f[3], amt: f[2], sub: `${f[1]} · ${f[4].join(', ')}` })), H.finals[0] ? H.finals[0][2] : 1, { rank: 1 })}</section>
      ${method}${foot}`;
    return;
  }
  /* ---------------- DONOR ---------------- */
  if (P === 'donor') {
    const D = N.donor, top = D.recipients.slice(0, 10), rest = D.recipients.slice(10);
    const restAmt = rest.reduce((p, r) => p + r[2], 0);
    const seedTxt = D.seed_gifts.filter(s => s[1] > 0).map(s => `${fmt$(s[1])} to ${s[0]}`).join(' and ');
    app.innerHTML = `${crumb}<header>${eyebrow}<h1>${esc(D.name)} ${D.household && D.household.length ? 'have' : 'has'} given ${fmtK(D.total)} to Texas committees since ${N.since.slice(0, 4)}</h1>
      <p class="dek">That money went to <b>${fmtN(D.n)}</b> committee${D.n === 1 ? '' : 's'}. ${fmtK(D.via_pacs)} of it (${pct(D.via_pacs, D.total)}%) went to PACs, which pass money on to candidates.${seedTxt ? ` That includes ${seedTxt}.` : ''}</p>${D.household && D.household.length ? `<p class="note">Household total: includes contributions made in the name of ${esc(D.household.join(' and '))}.</p>` : ''}${D.entities && D.entities.length ? D.entities.map(e => `<p class="note">Also includes ${esc(e.name)}: ${esc(e.why)}${e.url ? ` (<a href="${esc(e.url)}" target="_blank" rel="noopener">source</a>)` : ''}.</p>`).join('') : ''}${asof}</header>
      <section aria-labelledby="pie-h"><h2 id="pie-h">Where ${esc(poss(D.name))} money went</h2><p class="sub">Each committee that received ${esc(poss(D.name))} contributions directly, as reported. The ten largest get a slice; everything else is grouped.</p><div class="pie-panel" id="pie"></div></section>
      <section aria-labelledby="h-r"><h2 id="h-r">Who it reached in the end</h2><p class="sub">Candidates and committees that received ${esc(poss(D.name))} money directly or through PACs. The light part of each bar is the direct contribution; the rest arrived through PACs (an estimate).</p>
        ${D.reached.length ? bars(D.reached.map(r => ({ name: r[0], link: r[4], amt: r[2], amt2: r[3], sub: r[1], small: r[3] ? `${fmtK(r[3])} direct` : 'all through PACs' })), D.reached[0][2], { rank: 1 }) : '<p class="note">None found.</p>'}</section>
      <section aria-labelledby="h-n" class="names"><h2 id="h-n">Names matched in the filings</h2><p class="sub">Campaigns write donor names many ways. These are the spellings counted toward ${esc(D.name)} on this page, including spouses in the same household, with where each was listed and how much was given under it. Spot a missing variation? It can be added.</p>
        <table class="ntab"><thead><tr><th>Name as filed</th><th>City</th><th class="r">Count</th><th class="r">Amount</th></tr></thead><tbody>${D.names.map(n => `<tr><td>${esc(n[0])}</td><td>${esc(n[1])}</td><td class="r num">${fmtN(n[2])}</td><td class="r num">${fmt$(n[3])}</td></tr>`).join('')}</tbody></table>
        ${D.near && D.near.length ? `<h3 class="near-h">Similar names not counted</h3><p class="sub">Same last name and first initial, but left out because the city, state or first name did not match. Some may be other people; some may be the same donor.</p>
        <table class="ntab near"><tbody>${D.near.map(n => `<tr><td>${esc(n[0])}</td><td>${esc(n[1])}</td><td class="r num">${fmtN(n[2])}</td><td class="r num">${fmt$(n[3])}</td></tr>`).join('')}</tbody></table>` : ''}</section>
      ${method}${foot}`;
    const slices = top.map(r => ({ name: r[0], meta: r[1], amt: r[2], link: r[3] }));
    if (restAmt > 0) slices.push({ name: 'All others', meta: `${rest.length} more committee${rest.length === 1 ? '' : 's'}`, amt: restAmt, other: true });
    pie($('#pie'), D.name, slices, D.total, `<span class="num">${pct(top.reduce((p, r) => p + r[2], 0), D.total)}%</span>to the top ${top.length}`);
    return;
  }
  /* ---------------- PAC ---------------- */
  if (P === 'pac') {
    const C = N.pac, sh = pct(C.web, C.raised), lt = C.lookthrough.slice(0, 10), ltRest = C.lookthrough.slice(10).reduce((p, x) => p + x[1], 0);
    const nd = C.lookthrough.length;
    app.innerHTML = `${crumb}<header>${eyebrow}<h1>${sh}% of ${esc(poss(C.name))} money traces to ${nd} big donor${nd === 1 ? '' : 's'}</h1>
      <p class="dek">${esc(C.name)} raised <b>${fmt$(C.raised)}</b> in itemized contributions since ${since}. About <b>${fmt$(C.web)}</b> of it came from the donors in this web, either directly or through other PACs.</p>${asof}</header>
      <section aria-labelledby="pie-h"><h2 id="pie-h">Who is really behind ${esc(C.name)}</h2><p class="sub">Looking through PAC-to-PAC transfers to the people and trusts whose money it is. Everyone outside this web is grouped as “All other donors.”</p><div class="pie-panel" id="pie"></div></section>
      <section aria-labelledby="h-rep"><h2 id="h-rep">Top donors as reported</h2><p class="sub">What the PAC’s own reports list, before looking through other PACs.</p>
        ${bars(C.reported.map(r => ({ name: r[0], amt: r[1] })), C.reported[0] ? C.reported[0][1] : 1, { rank: 1 })}</section>
      <section aria-labelledby="h-g"><h2 id="h-g">Where ${esc(poss(C.name))} money went</h2><p class="sub">${C.gave.length ? `Contributions to other Texas committees since ${since}, as reported by the people who received them: ${fmt$(C.gave_total)} in all.` : 'No contributions to other Texas committees were found in this period.'}</p>
        ${C.gave.length ? bars(C.gave.map(g => ({ name: g[0], link: g[3], amt: g[2], sub: g[1] })), C.gave[0][2], { rank: 1 }) : ''}</section>
      ${method}${foot}`;
    const slices = lt.map(x => ({ name: x[0], amt: x[1], link: { href: `../${x[2]}/index.html` }, meta: '' }));
    if (ltRest > 0) slices.push({ name: 'Other donors in this web', amt: ltRest, other: true, meta: '' });
    if (C.raised - C.web > 0) slices.push({ name: 'All other donors', amt: C.raised - C.web, other: true, meta: 'outside this web' });
    pie($('#pie'), C.name, slices, C.raised, `<span class="num">${sh}%</span>from ${nd} donor${nd === 1 ? '' : 's'} in this web`);
  }
})();
