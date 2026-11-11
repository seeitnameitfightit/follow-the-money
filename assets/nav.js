/* Site-wide header: the three branches (Tarrant County, Elections, The Money Web). Added to every page by build_offices.py. */
(function () {
  if (document.querySelector('.site-nav')) return;
  const me = document.currentScript || [...document.scripts].find(x => /assets\/nav\.js/.test(x.src));
  if (!me) return;
  const root = me.src.replace(/assets\/nav\.js.*$/, '');
  const rel = location.href.startsWith(root) ? location.href.slice(root.length) : '';
  const top = rel.split(/[/?#]/)[0];
  const SEC = { tarrant: 't', electorate: 't', elections: 'e', turnout: 'e', web: 'm', races: 'm', statewide: 'm', senate: 'm', house: 'm', sboe: 'm', courts: 'm', local: 'm', parties: 'm' };
  const on = SEC[top] || '';
  const link = (k, href, label) => `<a href="${root}${href}"${on === k ? ' aria-current="page"' : ''}>${label}</a>`;
  document.body.insertAdjacentHTML('afterbegin', `<header class="site-nav"><div class="sn-in">
    <a class="sn-brand" href="${root}index.html"><b>See It. Name It. Fight It.</b><span>Data</span></a>
    <nav aria-label="Main">${link('t', 'tarrant/index.html', 'Tarrant County')}${link('e', 'elections/index.html', 'Elections')}${link('m', 'web/index.html', 'The Money Web')}</nav></div></header>`);
})();
