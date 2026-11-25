'use strict';
window.__errs = [];
window.addEventListener('error', e => window.__errs.push(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
function fit() {
  const st = $('#stage'), bz = $('#bezel'), mobile = matchMedia('(max-width:980px)').matches;
  const bw = mobile ? 384 : 408, bh = mobile ? 832 : 856;
  const ov = $('#overview'), ow = document.body.classList.contains('ovw') && ov ? ov.offsetWidth + 28 : 0;
  const W = st.clientWidth - (mobile ? 0 : 32) - ow, H = st.clientHeight - (mobile ? ($('#mbar').offsetHeight || 0) : 48);
  const k = Math.max(0.3, Math.min(1.12, W / bw, H / bh));
  bz.style.transform = `scale(${k})`;
  const w = $('#phone-wrap'); w.style.width = bw * k + 'px'; w.style.height = bh * k + 'px';
}
window.addEventListener('DOMContentLoaded', () => {
  Guide.reset('coach'); bindPhone(); Guide.bind(); renderPhone(false); fit();
  Track.ev('session_start', {detail: innerWidth + 'x' + innerHeight});
  window.addEventListener('resize', () => { G.key = ''; Guide.render(); fit(); });
  setInterval(() => { const el = $('#phone .sb span'); if (el) { const n = new Date(); el.textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'); } }, 30000);
  if (QS.get('mode')) Guide.setMode(QS.get('mode'));
  if (QS.has('selftest')) {
    let res; try { res = Guide.selftest(); } catch (e) { res = [{id: 'selftest', ok: false, err: e.message}]; }
    const pre = document.createElement('pre'); pre.id = 'selftest';
    Guide.reset('coach');
    const cards = sectionsOf(dashboardsFor().primary).flatMap(s => s.cards).map(c => c.name.replace(/^Recent | Session Attendance| Attendance/g, '') + '=' + cardResult(c, null).count).join(' | ');
    pre.textContent = JSON.stringify({pass: res.every(r => r.ok) && !window.__errs.length, results: res, errors: window.__errs, today: T, cards});
    document.body.appendChild(pre);
  }
  if (QS.get('lesson')) { Guide.start(QS.get('lesson')); const n = +QS.get('steps') || 0; for (let i = 0; i < n && !G.fin; i++) Guide.auto(); }
  if (QS.get('open')) $('#guide').classList.add('open');
  if (QS.has('mini')) { G.ovMini = true; G.key = ''; Guide.render(); }
  if (QS.has('enh')) { G.page = 'enh'; G.enhQ = QS.get('enh') || ''; G.key = ''; Guide.render(); if (QS.get('feat')) Guide.openFeat(+QS.get('feat')); }
  if (QS.get('role')) { Guide.reset(QS.get('role')); G.key = ''; renderPhone(false); }
  if (QS.get('go')) { if (QS.get('demo')) addDemo(+QS.get('demo')); const [n, name, tab, prog] = QS.get('go').split('|'), sx = DB.subjects.find(x => fullName(x) === name);          // open a screen directly, for screenshots
    S.stack = n === 'subject' ? [{n: 'home'}, {n, id: sx.uuid, tab, prog}] : [{n}]; if (QS.get('visit')) ACT.type(QS.get('visit')); G.mode = 'free'; G.key = ''; renderPhone(false); }
});
