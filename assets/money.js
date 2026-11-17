/* Follow the Money: the "TX Campaign Finance" hub (money/index.html). Data embedded by build_money_hub.py. */
(function () {
  const el = document.getElementById('hub-data'); if (!el) return;
  const H = JSON.parse(el.textContent), S = H.sections, E = H.explorer, C = H.club || {};
  const ASSET = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtN = v => Math.round(v).toLocaleString('en-US');
  const fmtK = v => { const a = Math.abs(v); return a >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? '$' + (v / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M' : a >= 1e3 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v); };
  const card = (href, eye, title, stat, statTxt, text, go) => `<div class="br-card"><a class="br-main" href="${href}"><span class="br-eye">${eye}</span><b class="br-t">${title}</b>
    ${stat ? `<span class="br-stat"><b class="num">${stat}</b><span>${statTxt}</span></span>` : ''}<span class="br-x">${text}</span><span class="br-go">${go} ›</span></a></div>`;
  const RACES = [['statewide', 'Statewide', 'races'], ['senate', 'Texas Senate', 'districts'], ['house', 'Texas House', 'districts'], ['sboe', 'State Board of Education', 'districts'], ['courts', 'High courts', 'seats'], ['local', 'Tarrant County races', 'races'], ['parties', 'County parties', 'counties']];
  const races = RACES.filter(([k]) => S[k] && S[k].count).map(([k, l, u]) => card(`../${k}/index.html`, 'Race by race', l, fmtN(S[k].count), u, esc(S[k].desc || ''), 'See the races')).join('');
  const dl = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  document.getElementById('app').innerHTML = `<a class="brand" href="https://seeitnameitfightit.com" target="_blank" rel="noopener"><img src="${ASSET}sinifi-logo.png" alt="See It. Name It. Fight It." width="44" height="36"></a>
    <p class="crumb"><a href="../index.html">Home</a> › TX Campaign Finance</p>
    <header><div class="eyebrow"><span>TX Campaign Finance</span></div><h1>Follow the money in Texas politics</h1>
      <p class="dek">Who gives, who gets it, and what it buys: itemized contributions from public Texas Ethics Commission filings, from statewide offices to Tarrant County, back to 2000.</p></header>
    <section aria-labelledby="st-h"><h2 id="st-h">Start here</h2><div class="br">
      ${card('../explorer/index.html', 'Search any filer', 'Who funds Texas politics?', E.filers ? fmtN(E.filers) : '', 'candidates, PACs and parties', `Pick any candidate, PAC or party and see the ten donors behind its money, for any time period. Filings through ${esc(dl(E.through))}.`, 'Explore the donors')}
      ${C.n ? card('../club/index.html', 'Donors at $1M or more', 'The Million Plus Club', fmtN(C.n), 'since 2023, ' + fmtK(C.total) + ' in all', 'A floor and no ceiling: every donor at a million dollars or more, with who they funded and when.', 'See the club') : ''}
      ${card('../web/index.html', 'The Money Web', 'The big donors behind the PACs', S.web && S.web.count ? fmtN(S.web.count) : '', 'major donors traced through every PAC and campaign', 'The same few donors fund Texans United for a Conservative Majority, Texans for Lawsuit Reform and a string of other PACs. Here is where their money goes.', 'Follow the web')}
    </div></section>
    <section aria-labelledby="rc-h"><h2 id="rc-h">The 2026 races</h2><div class="br">${races}</div></section>
    <footer>Figures come from <a href="https://www.ethics.state.tx.us/search/cf/" target="_blank" rel="noopener">Texas Ethics Commission</a> filings and, for Tarrant County races, local filings. Records replaced by amended reports are left out. <a href="https://seeitnameitfightit.com" target="_blank" rel="noopener">${esc(H.org)}</a></footer>`;
})();
