(function(){
  const DATA_PATH = '8in1Mw-CzJvgG9Sg014LcDh5dcVxTUNb';
  const IS_LOCAL = ['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname);
  const qs = new URLSearchParams(location.search);
  const hs = new URLSearchParams(location.hash.slice(1));
  const t = qs.get('token') || hs.get('token');
  if (t) {
    localStorage.setItem('desk_token', t);
    // strip token from the visible URL
    qs.delete('token'); hs.delete('token');
    const q = qs.toString(), h = hs.toString();
    history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + (h ? '#' + h : ''));
  }
  const token = localStorage.getItem('desk_token');
  const dataPath = qs.get('d') || localStorage.getItem('desk_data_path') || DATA_PATH;
  if (qs.get('d')) localStorage.setItem('desk_data_path', qs.get('d'));
  const $ = id => document.getElementById(id);
  const AGENTS = ['scanner','auditor','analyst','executor','risk'];

  const GH_STATE = 'https://raw.githubusercontent.com/geldmaschine67-design/trading-desk-app/main/' + DATA_PATH + '/state.json?t=';
  async function getJSON(url){
    const r = await fetch(url, {cache:'no-store'});
    if (!r.ok) throw new Error(url.split('?')[0] + ' ' + r.status);
    return r.json();
  }
  async function poll(){
    try {
      let s, src;
      if (token && IS_LOCAL) {
        s = await getJSON('./api/state?token=' + encodeURIComponent(token)); src = 'local';
      } else {
        try { s = await getJSON(GH_STATE + Date.now()); src = 'github'; }
        catch (ghErr) { s = await getJSON('./' + dataPath + '/state.json?t=' + Date.now()); src = 'netlify'; }
      }
      render(s);
      $('health').textContent = 'OK'; $('health').className = 'dot on';
      $('err').textContent = 'source: ' + src;
    } catch(e) {
      $('health').textContent = 'OFFLINE'; $('health').className = 'dot off';
      $('err').textContent = String(e);
    }
  }
  function render(s){
    const mode = (s.mode||'PAPER').toUpperCase();
    $('mode').textContent = mode; $('mode').className = 'badge' + (mode==='LIVE'?' live':'');
    $('status').textContent = s.status || '–';
    $('pnl').textContent = Number(s.pnl||0).toFixed(2);
    $('updated').textContent = s.updated_at ? new Date(s.updated_at).toLocaleTimeString() : '–';
    const a = s.agents || {};
    $('agents').innerHTML = AGENTS.map(k => {
      const st = (a[k] && a[k].status) || 'unknown';
      return `<span class="pill s-${st.replace(/[^a-z]/gi,'')}"><b>${k[0].toUpperCase()+k.slice(1)}</b>${st}</span>`;
    }).join('');
    const p = s.positions || [];
    $('positions').textContent = p.length ? p.map(x => typeof x==='string'?x:
      (x.symbol ? `${x.symbol}  ${x.qty>0?'+':''}${x.qty} @ ${Number(x.avg).toFixed(2)}` : JSON.stringify(x))).join('\n') : 'None';
    const ls = s.last_signal, el = $('signal');
    if (el) el.textContent = ls ? `${ls.side} ${ls.qty} ${ls.symbol} @ ${ls.price}` + (ls.score!=null?` · score ${ls.score}`:'') + (ls.verdict?`\n${ls.verdict}`:'') : 'None';
  }
  poll(); setInterval(poll, 3000);
})();
