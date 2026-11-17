/* Follow the Money: The Million Plus Club. Reads club/data/club.json (built by build_club.py). */
(function () {
  const SRC = (document.currentScript && document.currentScript.src) || '';
  const ROOT = SRC.replace(/assets\/[^/]*$/, ''), LOGO = SRC.replace(/[^/]*$/, '') + 'sinifi-logo.png';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt$ = v => '$' + Math.round(v).toLocaleString('en-US'), fmtN = v => Math.round(v).toLocaleString('en-US');
  const fmtK = v => { const a = Math.abs(v); return a >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? '$' + (v / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M' : a >= 1e3 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v); };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], BLUE = '#2F5FA8';
  const dlong = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const css = document.createElement('style');
  css.textContent = `
  .mp-h .eyebrow{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--web)}
  .mp-h h1{font-family:var(--display);font-size:clamp(28px,7vw,40px);line-height:1.1;margin:4px 0 8px}
  .mp-h p{color:var(--ink-2);margin:0;max-width:62ch}
  .mp-ctl{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;margin-top:6px}
  .mp-seg{display:inline-flex;border:1px solid var(--rule);border-radius:9px;overflow:hidden;background:var(--surface)}
  .mp-seg button{font:inherit;font-size:14px;font-weight:600;color:var(--ink-2);background:none;border:0;padding:9px 12px;cursor:pointer;min-height:42px}
  .mp-seg button+button{border-left:1px solid var(--rule)}
  .mp-seg button[aria-pressed="true"]{background:var(--ink);color:var(--surface)}
  .mp-seg button:focus-visible,.mp-q:focus-visible{outline:2px solid var(--focus);outline-offset:-2px}
  .mp-q{flex:1 1 200px;font:inherit;font-size:15px;color:var(--ink);background:var(--surface);border:1px solid var(--rule);border-radius:8px;padding:9px 10px;min-height:42px;box-sizing:border-box;min-width:0}
  .mp-list{list-style:none;margin:8px 0 0;padding:0}
  .mp-list li{border-top:1px solid var(--rule)}
  .mp-list a{display:grid;grid-template-columns:2.2em minmax(0,1fr) auto;gap:2px 10px;padding:11px 2px;color:var(--ink);text-decoration:none}
  .mp-list a:hover .nm{text-decoration:underline}
  .mp-list .rk{color:var(--ink-3);font-variant-numeric:tabular-nums}
  .mp-list .nm{font-weight:600}
  .mp-list .sub{grid-column:2;font-size:13px;color:var(--ink-2)}
  .mp-list .amt{font-variant-numeric:tabular-nums;font-weight:700;text-align:right;grid-row:1}
  .mp-list .cnt{grid-column:3;grid-row:2;font-size:12px;color:var(--ink-3);text-align:right;white-space:nowrap}
  .mp-bar{grid-column:2/-1;height:5px;background:var(--chip);border-radius:3px;overflow:hidden;margin-top:3px}.mp-bar i{display:block;height:100%;background:var(--web)}
  .mp-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.04em;padding:1px 6px;border-radius:5px;background:var(--chip);color:var(--ink-2);margin-left:6px;vertical-align:1px;text-decoration:none}
  .mp-back{font-size:14px;margin:0}
  .mp-who{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline;justify-content:space-between}
  .mp-who h2{font-family:var(--display);font-size:clamp(24px,6vw,32px);margin:0}.mp-who span{font-size:13px;color:var(--ink-2)}
  .mp-d h3{font-family:var(--display);font-size:20px;margin:26px 0 12px}
  .mp-rec{width:100%;border-collapse:collapse;font-size:14px}
  .mp-rec td{padding:8px 6px 8px 0;border-bottom:1px solid var(--rule);vertical-align:top}
  .mp-rec td:first-child{width:1.6em;color:var(--ink-3)}.mp-rec td:last-child{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .mp-rec small{display:block;color:var(--ink-3);font-size:12px}
  .mp-d svg{width:100%;height:auto;display:block;overflow:visible}
  .mp-note{font-size:12px;color:var(--ink-3);line-height:1.5}.mp-note p{margin:0 0 6px}
  .mp-msg{padding:20px 0;color:var(--ink-2)}`;
  document.head.appendChild(css);

  const app = $('#app');
  app.innerHTML = `<a class="brand" href="https://seeitnameitfightit.com" target="_blank" rel="noopener"><img src="${LOGO}" alt="See It. Name It. Fight It." width="44" height="36"></a>
    <p class="crumb"><a href="../index.html">Home</a> › <a href="../money/index.html">TX Campaign Finance</a> › The Million Plus Club</p><div id="mp"><p class="mp-msg">Loading…</p></div>`;
  let D = null, M = null, filt = 'P', qtext = '';

  function listView() {
    const all = D, people = all.filter(d => d.kind === 'P'), comm = all.filter(d => d.kind === 'C');
    const rows = (filt === 'P' ? people : filt === 'C' ? comm : all).filter(d => !qtext || qtext.toLowerCase().split(/\s+/).every(t => d.name.toLowerCase().includes(t)));
    const mx = Math.max(...rows.map(d => d.total), 1), sum = a => a.reduce((s, d) => s + d.total, 0);
    $('#mp').innerHTML = `<header class="mp-h"><div class="eyebrow">TX Campaign Finance</div><h1>The Million Plus Club</h1>
      <p>Everyone who has given at least $1 million in itemized contributions to Texas candidates, PACs and parties since January 1, 2023. A floor and no ceiling.</p></header>
      <div class="stats" style="margin-top:14px"><div><b>${fmtN(all.length)}</b><span>donors at $1M or more</span></div><div><b>${fmtK(sum(all))}</b><span>given in all</span></div><div><b>${fmtK(sum(people))}</b><span>from ${fmtN(people.length)} people and companies</span></div></div>
      <div class="mp-ctl"><div class="mp-seg" role="group" aria-label="Who to show">
        <button type="button" data-f="P" aria-pressed="${filt === 'P'}">People & companies ${people.length}</button><button type="button" data-f="C" aria-pressed="${filt === 'C'}">Committees ${comm.length}</button><button type="button" data-f="A" aria-pressed="${filt === 'A'}">Everyone ${all.length}</button></div>
        <input class="mp-q" id="mp-q" type="search" placeholder="Search by name" autocomplete="off" spellcheck="false" value="${esc(qtext)}"></div>
      <ol class="mp-list" aria-label="Donors ranked by dollars given">${rows.map((d, i) => `<li><a href="#${esc(d.id)}"><span class="rk">${i + 1}</span><span><span class="nm">${esc(d.name)}</span>${d.web ? '<span class="mp-tag" title="Also in the Money Web">Money Web</span>' : ''}${d.kind === 'C' ? '<span class="mp-tag">Committee</span>' : ''}</span><span class="amt">${fmtK(d.total)}</span>
        <span class="sub">${d.st ? esc(d.st) + ' · ' : ''}mostly to ${esc(d.top[0] ? d.top[0][0] : 'n/a')}</span><span class="cnt">${fmtN(d.n)} contributions</span><span class="mp-bar"><i style="width:${Math.max(1, d.total / mx * 100).toFixed(1)}%"></i></span></a></li>`).join('') || '<li><p class="mp-msg">No donors match.</p></li>'}</ol>
      <section class="mp-note" style="margin-top:18px"><p><b>How to read this.</b> Totals are itemized contributions since ${esc(dlong(M.since))}, through ${esc(dlong(M.through))}. Small contributions that were not itemized are not counted. Donors are matched on name and ZIP code, so a donor who gave under two spellings can appear twice. The exception is anyone in the Money Web, whose names are combined there.</p>
      <p>“Committees” are organizations that file their own campaign finance reports. Most of their money was passed along from other donors, so the first list is the better read on who is putting new money into Texas politics.</p></section>`;
    $('#mp').querySelectorAll('.mp-seg button').forEach(b => b.addEventListener('click', () => { filt = b.dataset.f; listView(); }));
    const q = $('#mp-q'); q.addEventListener('input', () => { qtext = q.value; const p = q.selectionStart; listView(); const n = $('#mp-q'); n.focus(); n.setSelectionRange(p, p); });
  }

  function chart(d) {
    const ym0 = +M.start.slice(0, 4) * 12 + (+M.start.slice(5, 7) - 1), n = d.c.length, mx = Math.max(...d.c, 1);
    const step = (v => { const r = v / 4, p = Math.pow(10, Math.floor(Math.log10(r))), f = r / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; })(mx);
    const W = 640, H = 220, L = 52, R = 6, Tp = 8, B = 26, pw = W - L - R, ph = H - Tp - B, top = Math.ceil(mx / step) * step, bw = pw / n, Y = v => Tp + ph - v / top * ph;
    const lab = i => MON[(ym0 + i) % 12] + ' ' + Math.floor((ym0 + i) / 12);
    let g = '';
    for (let v = 0; v <= top + 1e-6; v += step) g += `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--rule)"/><text x="${L - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--ink-3)">${fmtK(v)}</text>`;
    for (let i = 0; i < n; i++) if ((ym0 + i) % 12 === 0 || i === 0 && n < 8) g += `<text x="${(L + (i + .5) * bw).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--ink-3)">${Math.floor((ym0 + i) / 12)}</text>`;
    g += d.c.map((v, k) => v > 0 ? `<rect x="${(L + k * bw + .6).toFixed(2)}" y="${Y(v).toFixed(1)}" width="${Math.max(.8, bw - 1.2).toFixed(2)}" height="${(Tp + ph - Y(v)).toFixed(1)}" fill="${BLUE}"/>` : '').join('');
    g += d.c.map((v, k) => `<rect x="${(L + k * bw).toFixed(2)}" y="${Tp}" width="${bw.toFixed(2)}" height="${ph}" fill="transparent"><title>${lab(k)}: ${fmt$(v)}</title></rect>`).join('');
    const pk = d.c.indexOf(mx);
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(d.name)}: contributions by month. Biggest month ${lab(pk)}, ${fmt$(mx)}.">${g}</svg><p class="mp-note" style="margin-top:6px">Biggest month: ${lab(pk)}, ${fmt$(mx)}.</p>`;
  }

  function detail(d) {
    const topSum = d.top.reduce((a, r) => a + r[2], 0), pct = d.total ? Math.round(topSum / d.total * 100) : 0, mx = Math.max(...d.top.map(r => r[2]), 1);
    $('#mp').innerHTML = `<p class="mp-back"><a href="#" id="mp-back">‹ All Million Plus Club donors</a></p>
      <div class="mp-d"><div class="mp-who"><h2>${esc(d.name)}</h2><span>${d.kind === 'C' ? 'Committee' : d.type === 'E' ? 'Company or organization' : 'Individual'}${d.st ? ' · ' + esc(d.st) : ''}</span></div>
      <div class="stats" style="margin-top:14px"><div><b>${fmtK(d.total)}</b><span>since Jan 1, 2023</span></div><div><b>${fmtN(d.n)}</b><span>contributions</span></div><div><b>${fmtN(d.nrec)}</b><span>${d.nrec === 1 ? 'committee' : 'committees and candidates'} funded</span></div></div>
      <p style="margin:14px 0 0">${d.web ? `<a class="webtag" href="${ROOT}web/${esc(d.web)}/index.html">Money Web profile</a> ` : ''}${d.own ? `<a class="webtag" href="${ROOT}explorer/index.html#${esc(d.own)}/p2023">This committee’s own donors and spending</a>` : ''}</p>
      <h3>Who got the money</h3><table class="mp-rec"><tbody>${d.top.map((r, i) => `<tr><td>${i + 1}</td><td>${r[1] ? `<a href="${ROOT}explorer/index.html#${esc(r[1])}/p2023">${esc(r[0])}</a>` : esc(r[0])}<small>${fmtN(r[3])} contribution${r[3] === 1 ? '' : 's'}</small></td><td>${fmt$(r[2])}</td></tr>`).join('')}</tbody></table>
      ${d.nrec > d.top.length ? `<p class="mp-note" style="margin-top:6px">The top ${d.top.length} of ${fmtN(d.nrec)} recipients, ${pct}% of the total.</p>` : ''}
      <h3>When the money moved</h3>${chart(d)}</div>
      <section class="mp-note" style="margin-top:18px"><p>Itemized contributions since ${esc(dlong(M.since))}, through ${esc(dlong(M.through))}. Recipients link to their own page in the donor explorer.</p></section>`;
    $('#mp-back').addEventListener('click', e => { e.preventDefault(); history.pushState(null, '', location.pathname); route(); });
  }

  function route() {
    if (!D) return;
    const h = decodeURIComponent(location.hash.slice(1)), d = D.find(x => x.id === h);
    if (d) { detail(d); document.title = d.name + ' · The Million Plus Club'; window.scrollTo(0, 0); }
    else { document.title = 'The Million Plus Club · See It. Name It. Fight It.'; listView(); }
  }
  fetch(ROOT + 'club/data/club.json').then(r => r.json()).then(j => { D = j.donors; M = j.meta; route(); })
    .catch(() => { $('#mp').innerHTML = '<p class="mp-msg">Could not load the data. Please refresh.</p>'; });
  window.addEventListener('hashchange', route);
})();
