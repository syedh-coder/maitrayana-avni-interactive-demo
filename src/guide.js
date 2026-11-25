'use strict';
/* ================= guide state ================= */
const G = {lang: 'en', mode: 'guided', page: 'lessons', lesson: null, i: 0, fin: false, lastType: 0, key: '', done: {}, tg: null, enhArea: '', enhQ: '', featOn: -1, ovClosed: {}};
try { const sv = JSON.parse(localStorage.getItem('maitrayana-guide') || '{}'); if (sv.done) G.done = sv.done; G.ovMini = !!sv.ovMini; } catch (e) {}
const persist = () => { try { localStorage.setItem('maitrayana-guide', JSON.stringify({done: G.done, ovMini: G.ovMini})); } catch (e) {} };
/* Guide sentences are in English, the app's only language for Maitrayana. {0}, {1} fill in names and values. */
const L = (en, ...a) => { let s = en; a.forEach((x, i) => { s = s.split('{' + i + '}').join(x); }); return s; };
const tx = s => s ? L(s) : '';
const unesc = s => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'"}[e]));
// a bold app word in a step shows as the phone shows it, in the phone's language
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, (_, x) => '<b>' + esc(AppLang.t(unesc(x))) + '</b>');
const val = v => typeof v === 'function' ? v() : v;
const recentlyTyped = () => Date.now() - G.lastType < 1100;
const OVSEC = [['avni', '📖', 'Avni in one minute'], ['j1', '🏫', 'Journey 1: a site, a batch and its participants'], ['j2', '🏐', 'Journey 2: programmes and session attendance'], ['j3', '🤝', 'Journey 3: common sessions and the dashboards'], ['col', '🎨', 'Colours you will see']];
const OVSHORT = {avni: 'Basics', j1: 'Set up', j2: 'Sessions', j3: 'Common', col: 'Colours'};
const VIDEO = 'https://drive.google.com/file/d/1rWvvL1ErhlaeOv3TT0mvyjxd_CpYZfI9/view';

/* ================= what should the learner touch next? ================= */
function setInput(el, v) { el.focus({preventScroll: true}); el.value = v; el.dispatchEvent(new Event('input', {bubbles: true})); G.lastType = 0; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); Guide.sync(); }
const clickSel = sel => () => { const el = $('#phone ' + sel); if (el) doAction(el); };
// The answer a lesson wants for a question, in the form the phone stores it (names of records become their ids).
function wanted(st, el) {
  const d = cdef(el), demo = val(st.demo[cname(el)]);
  if (d.dataType === 'Subject') { const list = subjectChoices(el), id = n => (list.find(c => fullName(c) === n) || {}).uuid;
    return isMulti(el) ? (demo ? demo.map(id).filter(Boolean) : list.map(c => c.uuid)) : demo ? id(demo) : undefined; }
  return demo;
}
const same = (a, b) => Array.isArray(a) || Array.isArray(b) ? _.isEqual([...(a || [])].sort(), [...(b || [])].sort()) : _.isEqual(a, b);
function fieldTarget(st, el, errs) {
  const d = cdef(el), key = cname(el), demo = wanted(st, el), cur = F.obs[key];
  const node = $$('#phone .fe[data-f]').find(e => e.dataset.f === el.uuid), why = tx(st.notes[key]), lab = el.name;
  const done = fn => () => { fn(); G.lastType = 0; renderPhone(); };
  if (errs.length && d.dataType !== 'Subject' && d.dataType !== 'Image') return {el: node, why, txt: L('Fix **{0}**: {1}', lab, errs[0]), auto: done(() => fset(el, undefined, d.dataType === 'Numeric' ? String(demo) : demo))};
  if (d.dataType === 'Image') return {el: node && node.querySelector('[data-a="f:img"]'), why, txt: L('For **{0}**, tap the **folder** icon to pick a photo from the phone.', lab), auto: clickSel(`.fe[data-f="${el.uuid}"] [data-a="f:img"]`)};
  if (d.dataType === 'Subject' && isMulti(el)) { const have = cur || [], add = demo.find(u => !have.includes(u)), drop = have.find(u => !demo.includes(u)), u = add || drop, c = subj(u);
    return {el: $$('#phone .arow').find(e => e.dataset.v === u), why, txt: add ? L('**{0}** came to the session. Tick her name.', fullName(c)) : L('**{0}** did not come. Untick her name.', fullName(c)), auto: clickSel(`.arow[data-v="${u}"]`)}; }
  if (d.dataType === 'Subject') return {el: $$('#phone .srow').find(e => e.dataset.v === demo), why, txt: L('For **{0}**, tap **{1}**.', lab, fullName(subj(demo))), auto: clickSel(`.srow[data-v="${demo}"]`)};
  const opts = d.dataType === 'Coded' ? answersOf(el).filter(o => allowed(stOf(F, el), o)) : [];
  const dv = demo !== undefined ? demo : d.dataType === 'Coded' ? (isMulti(el) ? [opts[0]] : opts[0]) : d.dataType === 'Numeric' ? 1 : d.dataType === 'Date' ? T : 'Practice';
  const shown = d.dataType === 'Date' ? D.dmy(dv) : Array.isArray(dv) ? dv.join(', ') : String(dv);
  const txt = d.dataType === 'Coded' ? L('For **{0}**, tap **{1}**.', lab, shown) : d.dataType === 'Date' ? L('For **{0}**, tap **Choose a date** and pick **{1}**.', lab, shown) : L('Type **{0}**. Example: **{1}**', lab, shown);
  return {el: node, txt, why, auto: done(() => fset(el, undefined, d.dataType === 'Numeric' ? String(dv) : dv))};
}
function coreTarget(st, k) {
  const c = _.mapValues(st.core || {}, val), el = $$('#phone .fe[data-f]').find(e => e.dataset.f === 'core:' + k), why = tx(st.notes['core:' + k]);
  const set = fn => () => { fn(); G.lastType = 0; renderPhone(); };
  if (k === 'first') return {el, why, txt: L('Type the **First Name**. Example: **{0}**', c.first), auto: set(() => F.subject.firstName = c.first)};
  if (k === 'last') return {el, why, txt: L('Type the **Last Name**. Example: **{0}**', c.last), auto: set(() => F.subject.lastName = c.last)};
  if (k === 'dob') return {el, why, txt: L('Type the **Age**: **{0}** Years. The app works out the date of birth.', c.age), auto: set(() => { F.core.age = c.age; F.core.ageUnit = 'Years'; setDobFromAge(); })};
  if (k === 'gender') return {el, why, txt: L('For **Sex**, tap **{0}**.', c.gender), auto: set(() => F.subject.gender = c.gender)};
  if (k === 'name') return {el, why, txt: L('Type the **{0} Name**. Example: **{1}**', F.sType, c.name), auto: set(() => { F.subject.firstName = c.name; })};
  const want = ADDRESS.map(n => locBy(n).uuid), i = want.findIndex((u, j) => F.core.path[j] !== u), l = LOCS[want[i]];        // one level at a time: State, then Region
  return {el: $$('#phone [data-a="f:addr"]').find(e => e.dataset.v === l.uuid), why, txt: i === 0 ? L('For **Address**, tap the {0} **{1}**.', l.type, l.name) : L('Now tap the {0} **{1}**.', l.type, l.name), auto: clickSel(`[data-a="f:addr"][data-v="${l.uuid}"]`)};
}
const ADDRESS = ['Karnataka', 'Banglore'];
function formTarget(st) {
  const m = S.modal;
  if (m && m.t === 'dp') return {el: $('#phone .dp'), txt: L('Tap the date, then tap **OK**.'), auto: clickSel('[data-a="dp:ok"]')};
  if (m && m.t === 'dlg') return {el: $('#phone .dlg'), txt: L('Tap **NO** to stay in the form.'), auto: clickSel('[data-a="dlg"][data-v="1"]')};
  if (m && m.t === 'gallery') { const k = wanted(st, elBy(m.k)) || 'general'; return {el: $(`#phone [data-a="img:pick"][data-v="${k}"]`), txt: L('This is the phone\'s gallery. Tap the glowing photo of today\'s session.'), auto: clickSel(`[data-a="img:pick"][data-v="${k}"]`)}; }
  if (topScr().n === 'summary') return {el: $('#phone [data-a="f:save"]'), txt: tx(st.sum) || L('This is the summary. Check your answers, then tap **Save**.'), auto: clickSel('[data-a="f:save"]'),
    why: L('Nothing is saved until you tap Save.')};
  if (topScr().n !== 'form' || !F) return null;
  const ae = document.activeElement, typing = ae && ae.dataset && ae.dataset.in && recentlyTyped() ? ae : null, g = F.pages[F.page];
  if (g.core) {
    const keys = isPerson(F.subject) ? ['first', 'last', 'dob', 'gender', 'village'] : ['name', 'village'], s = F.subject, want = val((st.core || {}).name);
    for (const k of keys) {
      const empty = k === 'first' ? !s.firstName : k === 'last' ? !s.lastName : k === 'dob' ? !s.dob : k === 'gender' ? !s.gender : k === 'village' ? !s.village : (want ? s.firstName !== want : !s.firstName);
      const here = typing && typing.dataset.in === 'core' && ((typing.dataset.k === 'firstName' && (k === 'first' || k === 'name')) || (typing.dataset.k === 'lastName' && k === 'last') || (typing.dataset.k === 'age' && k === 'dob'));
      if (empty || here) return coreTarget(st, k);
    }
  } else for (const it of itemsOf(F.page)) {
    const el = it.el; if (kvOf(el, 'editable') === false) continue;
    const key = cname(el), v = F.obs[key], errs = errsOf(el).filter(e => e !== MSG.empty), w = wanted(st, el);
    const want = w !== undefined ? !same(v, w) && !(cdef(el).dataType === 'Numeric' && String(v) === String(w)) : el.mandatory && isEmpty(v);
    const here = typing && typing.dataset.in === 'f' && typing.dataset.k === el.uuid;
    if (want || errs.length || here) {
      if (errs.length && st.expect && st.expect[key]) return {el: $$('#phone .fe[data-f]').find(e => e.dataset.f === el.uuid), txt: tx(st.expect[key]), why: L('The app shows the message in red: {0}', errs[0]), info: 1};
      return fieldTarget(st, el, errs);
    }
  }
  if (F.formErrs.length) return {el: $('#phone .fmsg'), txt: L('Fix this first: {0}', F.formErrs[0]), info: 1};
  const last = stepPage(1) >= F.pages.length, note = g.enrolDate ? L('The **Enrolment Date** is today. ') : !g.core && tx(st.pageDone) ? tx(st.pageDone) + ' ' : '';
  return {el: $('#phone [data-a="f:next"]'), txt: note + (last ? L('Tap **NEXT** to see the summary.') : L('This page is complete. Tap **NEXT**.')), auto: clickSel('[data-a="f:next"]')};
}

const Guide = {
  step() { return G.lesson && !G.fin ? G.lesson.steps[G.i] : null; },
  running() { return G.mode === 'guided' && !!G.lesson && !G.fin; },
  target() {
    const st = this.step(); if (!st) return null;
    if (st.k === 'tap') { const v = val(st.v), el = $$(`#phone [data-a="${st.a}"]`).find(e => v === undefined || e.dataset.v === String(v));
      return {el, txt: tx(st.t), why: tx(st.why), tag: st.tag, wait: !el, auto: () => { if (el) doAction(el); }}; }
    if (st.k === 'info') return {el: st.sel ? $('#phone ' + val(st.sel)) : null, txt: tx(st.t), why: tx(st.why), tag: st.tag, info: 1};
    if (st.k === 'type') { const el = $('#phone ' + st.sel); return {el, txt: tx(st.t), why: tx(st.why), tag: st.tag, wait: !el, auto: () => { if (el) setInput(el, val(st.val)); }}; }
    const tg = formTarget(st); if (tg && !tg.tag && st.tag) tg.tag = st.tag; return tg;
  },
  allow(el) {
    if (!this.running()) return true;
    const tg = G.tg; if (!tg || tg.info || !tg.el) return false;
    return tg.el === el || tg.el.contains(el);
  },
  nudge() {
    const tg = G.tg, h = $('#hint'); if (!h) return;
    h.textContent = tg && tg.info ? L('Read the note, then press Next') : L('Tap the highlighted part');
    h.classList.add('on'); clearTimeout(this._h); this._h = setTimeout(() => h.classList.remove('on'), 1500);
    if (tg && tg.el) { tg.el.classList.remove('g-shake'); void tg.el.offsetWidth; tg.el.classList.add('g-shake'); }
    const sc = $('.stepcard'); if (sc) { sc.classList.remove('g-shake'); void sc.offsetWidth; sc.classList.add('g-shake'); }
  },
  typed(force) { G.lastType = force ? 0 : Date.now(); clearTimeout(this._t); this._t = setTimeout(() => this.sync(), force ? 0 : 1150); },
  advance() { G.i++; Track.ev('step', {lesson: G.lesson.id, step: G.i});
    if (G.i >= G.lesson.steps.length) { G.fin = true; G.done[G.lesson.id] = 1; persist(); Track.ev('lesson_complete', {lesson: G.lesson.id, step: G.i, detail: Math.round((Date.now() - G.t0) / 1000)}); } },
  after(a, v) {
    const st = this.step(); if (!st || G.mode !== 'guided') return;
    if (st.k === 'tap' && st.a === a && (st._v === undefined || String(st._v) === String(v))) this.advance();
    else if (st.k === 'form' && a === 'f:save' && !F) this.advance();
    this.sync();
  },
  next() { const st = this.step(); if (st && (st.k === 'info' || (G.tg && G.tg.info))) { if (st.k === 'info') this.advance(); else if (st.k === 'form' && G.tg.info && st.expect) { if (st.endOnStop) this.advance(); else this.fixExpected(st); } this.sync(); } },
  fixExpected(st) {                                     // after a "the app stops you" note, put the right value in so the lesson can go on
    Object.entries(st.fix || {}).forEach(([k, v]) => { const it = itemsOf(F.page).find(x => cname(x.el) === k); if (it) fset(it.el, undefined, val(v)); });
    st.demo = Object.assign({}, st.demo, st.fix || {}); st.expect = null; renderPhone();
  },
  // Back = replay the lesson with "Do it for me" up to the last step the user actually saw (steps the app passes by itself are skipped)
  canBack() { return !!G.lesson && (G.fin || (G.hist || []).length > 1); },
  back() {
    if (!this.canBack()) return; const id = G.lesson.id, h = (G.hist || []).slice(); if (!G.fin) h.pop(); const want = h[h.length - 1] || 0;
    Track.ev('step', {lesson: id, step: want + 1, detail: 'back'});
    Track.mute = true; this.start(id); let n = 0;
    while (G.i < want && !G.fin && n++ < 500) { const b = this.sigAll(); this.auto(); if (b === this.sigAll()) break; }
    Track.mute = false; G.hist = h.length ? h : [G.i]; G.key = ''; renderPhone(); },
  sigAll() { return G.i + '|' + (G.tg && G.tg.txt) + '|' + sig() + '|' + JSON.stringify(S.modal && S.modal.t) + '|' + JSON.stringify(F && F.obs); },
  auto() { const tg = G.tg; if (!tg) return; if (G.lesson && !tg.info && !tg.wait) Track.ev('do_it_for_me', {lesson: G.lesson.id, step: G.i + 1}); if (tg.info) return this.next(); if (tg.auto) tg.auto(); },
  sync() {
    $$('#phone .g-target').forEach(e => e.classList.remove('g-target'));
    if (this.running()) { let st = this.step(), guard = 0; while (st && st.k === 'type' && st.test() && !recentlyTyped() && guard++ < 5) { this.advance(); st = this.step(); } }
    if (this.running()) {
      const st = this.step(), tg = G.tg = this.target();
      if (st.k === 'tap') st._v = val(st.v);
      if (tg && tg.el) { tg.el.classList.add('g-target'); this.reveal(tg.el); }
    } else G.tg = null;
    if (this.running() && G.hist && G.hist[G.hist.length - 1] !== G.i) G.hist.push(G.i);
    this.spot();
    this.render();
  },
  spot() {                                             // a soft dim over the phone with a hole around the part to touch
    const ph = $('#phone'); if (!ph) return; let sp = $('#spot');
    if (!sp) { sp = document.createElement('div'); sp.id = 'spot'; ph.appendChild(sp); const sc = $('#scr'); if (sc) sc.addEventListener('scroll', () => this.spot(), {passive: true}); }
    const el = this.running() && G.tg && G.tg.el && ph.contains(G.tg.el) ? G.tg.el : null;
    if (!el) { sp.style.opacity = 0; return; }
    const pr = ph.getBoundingClientRect(), r = el.getBoundingClientRect(), k = pr.width / ph.offsetWidth || 1, pad = 6;
    Object.assign(sp.style, {left: ((r.left - pr.left) / k - pad) + 'px', top: ((r.top - pr.top) / k - pad) + 'px', width: (r.width / k + 2 * pad) + 'px', height: (r.height / k + 2 * pad) + 'px', opacity: 1});
  },
  reveal(el) {
    const sc = $('#scr'); if (!sc || !sc.contains(el)) return;
    const k = sc.getBoundingClientRect().width / sc.offsetWidth || 1, r = el.getBoundingClientRect(), b = sc.getBoundingClientRect();
    const topY = (r.top - b.top) / k, botY = (r.bottom - b.top) / k, H = sc.clientHeight;
    if (topY < 12 || botY > H - 12) sc.scrollTop += topY - Math.min(H * 0.3, Math.max(12, (H - (botY - topY)) / 2));
  },
  reset(role) { seed(); setRole(role || ROLE); S.exp = {}; S.search = {type: 'Participant', text: '', voided: false, extra: {}}; S.filter = {picked: [], tmp: []}; S.login = {u: '', p: ''}; S.toast = null; S.unsynced = 0; Object.keys(cardRes).forEach(k => delete cardRes[k]); goHome(); },
  start(id) {
    const ls = LESSONS.find(l => l.id === id);
    ls.steps.forEach(st => { delete st._seen; if (st._demo0) { st.demo = st._demo0; st.expect = st._expect0; } else if (st.k === 'form') { st._demo0 = st.demo; st._expect0 = st.expect; } });
    this.reset(ls.role || 'coach');
    if (ls.setup) ls.setup();
    if (G.lesson && !G.fin && G.lesson.id !== ls.id) Track.ev('lesson_exit', {lesson: G.lesson.id, step: G.i + 1});
    G.lesson = ls; G.i = 0; G.hist = []; G.fin = false; G.mode = 'guided'; G.page = 'lessons'; G.featOn = -1; G.key = ''; G.lastType = 0; G.t0 = Date.now();
    Track.ev('lesson_start', {lesson: id});
    $('#guide').classList.remove('open');
    renderPhone(false);
    const gb = $('#gbody'); if (gb) gb.scrollTop = 0;
  },
  exit() { if (G.lesson && !G.fin) Track.ev('lesson_exit', {lesson: G.lesson.id, step: G.i + 1}); G.lesson = null; G.fin = false; G.tg = null; G.key = ''; goHome(); renderPhone(false); },
  setMode(m) { Track.ev('page', {detail: m}); G.mode = m; if (m === 'free') { G.lesson = null; G.fin = false; } G.key = ''; renderPhone(); },

  /* ---------- left panel ---------- */
  render() {
    const st = this.step(), tg = G.tg;
    const key = [matchMedia('(min-width:1180px)').matches, G.ovMini, G.lang, G.mode, G.page, G.enhArea, ROLE, G.lesson && G.lesson.id, G.i, G.fin, tg && tg.txt, tg && tg.wait, topScr().n, topScr().tab || '', F ? F.page + ':' + Object.keys(F.obs).length : ''].join('|');
    if (key === G.key) return; G.key = key;
    $('#gsub').textContent = L('Practice app for Maitrayana coaches and staff');
    $('#gmode').innerHTML = `<button class="${G.mode === 'guided' && G.page === 'lessons' ? 'on' : ''}" data-g="mode" data-v="guided"><span class="emo">🧭</span><span><b>${L('Guided lessons')}</b><small>${L('One step at a time')}</small></span></button>
      <button class="${G.mode === 'free' && G.page === 'lessons' ? 'on' : ''}" data-g="mode" data-v="free"><span class="emo">🖐️</span><span><b>${L('Free explore')}</b><small>${L('Tap anything you like')}</small></span></button>
      <button class="${G.page === 'enh' ? 'on' : ''}" data-g="enh"><span class="emo">✨</span><span><b>${L('What it does')}</b><small>${L('Every feature, simply')}</small></span></button>`;
    const body = $('#gbody');
    const home = G.page !== 'enh' && !G.lesson, wide = matchMedia('(min-width:1180px)').matches;
    body.innerHTML = G.page === 'enh' ? this.enhHTML() : G.lesson ? this.lessonHTML(st, tg) : this.homeHTML() + (wide ? '' : this.overviewHTML());
    document.body.classList.toggle('ovw', home && wide);
    $('#overview').classList.toggle('mini', home && wide && !!G.ovMini);
    $('#overview').innerHTML = !(home && wide) ? '' : G.ovMini ? this.railHTML() : `<div class="ovbar"><button class="ovt" data-g="ovt" title="${esc(L('Hide'))}">☰</button><b>${L('Overview')}</b></div>` + this.overviewHTML();
    $('#gact').innerHTML = G.page === 'enh' ? '' : this.actHTML(tg); $('#guide').classList.toggle('hasact', !!G.lesson && G.page !== 'enh');
    this.mbar(st, tg);
    document.documentElement.style.setProperty('--mbar', ($('#mbar').offsetHeight || 0) + 'px');
    if (typeof fit === 'function') fit();
  },
  // One button, always in the same place at the bottom of the guide: Next / Do it for me / Next lesson
  actHTML(tg) {
    if (!G.lesson) return '';
    const ls = G.lesson, n = ls.steps.length;
    if (G.fin) { const nx = LESSONS[LESSONS.indexOf(ls) + 1];
      return `<button class="actb" data-g="back">◂ ${L('Back')}</button><button class="act" data-g="${nx ? 'start' : 'exit'}" ${nx ? `data-v="${nx.id}"` : ''}>${nx ? L('Next lesson') : L('All lessons')} ▸</button><span class="actk">${L('Lesson complete')} 🎉</span>`; }
    const btn = !tg ? `<button class="act" disabled>${L('Please wait…')}</button>` : tg.info ? `<button class="act" data-g="next">${L('Next')} ▸</button>`
      : tg.wait ? `<button class="act" disabled>${L('Please wait…')}</button>` : `<button class="act alt" data-g="auto">${L('Do it for me')} ▸</button>`;
    return `<button class="actb" data-g="back" ${this.canBack() ? '' : 'disabled'}>◂ ${L('Back')}</button>` + btn + `<span class="actk">${L('Step')} ${G.i + 1} / ${n}<small>${tg && tg.info ? L('Read, then press Next') : L('Tap the glowing part, or press Do it for me')}</small></span>`;
  },
  stepBtns(tg) {
    if (!tg) return '';
    if (tg.info) return `<button class="btn pri" data-g="next">${L('Next')} ▸</button>`;
    if (tg.wait) return `<button class="btn" disabled>${L('Please wait…')}</button>`;
    return `<button class="btn" data-g="auto">${L('Do it for me')} ▸</button>`;
  },
  tagHTML() { return ''; },
  lessonHTML(st, tg) {
    const ls = G.lesson, n = ls.steps.length;
    // a long form moves through the flow page by page (stages[i] = flow stage of form page i); the summary is the last stage
    const stage = G.fin ? ls.flow.length : !st ? 0 : st.k === 'form' && topScr().n === 'summary' ? ls.flow.length - 1 : st.k === 'form' && st.stageFn && F ? st.stageFn() : st.k === 'form' && st.stages && F ? st.stages[Math.min(F.page, st.stages.length - 1)] : st.s;
    let h = `<div class="crumb"><button data-g="exit">← ${L('All lessons')}</button><button data-g="restart">↺ ${L('Start again')}</button><span class="rolechip">${esc(tx(ROLES[ROLE].role[0]))}</span></div><h1>${ls.e} ${esc(tx(ls.t))}</h1>
      <div class="progress"><i style="width:${Math.round((G.fin ? n : G.i) / n * 100)}%"></i></div>`;
    if (G.fin) {
      const idx = LESSONS.indexOf(ls), nx = LESSONS[idx + 1];
      h += `<div class="stepcard fin"><div class="sn"><span>${L('Lesson complete')} 🎉</span></div><div class="st">${L('Well done. Remember these points:')}</div><ul class="takeaways">${ls.take.map(t => `<li>${md(tx(t))}</li>`).join('')}</ul>
        <div class="sbtns">${nx ? `<button class="btn pri" data-g="start" data-v="${nx.id}">${L('Next lesson')}: ${esc(tx(nx.t))} ▸</button>` : ''}<button class="btn" data-g="restart">${L('Practise again')}</button><button class="btn" data-g="exit">${L('All lessons')}</button></div></div>`;
    } else {
      h += `<div class="stepcard ${tg && tg.wait ? 'warn' : ''} ${tg && tg.info && st.k === 'form' ? 'stop' : ''}"><div class="sn"><span>${L('Step')} ${G.i + 1} / ${n}</span><span>${tg && tg.info ? '👀 ' + L('Read') : '👆 ' + L('Your turn')}</span></div>
        <div class="st">${md(tg ? tg.txt : L('Follow the highlighted part on the phone.'))}</div>${tg && tg.why ? `<div class="sw">${md(tg.why)}</div>` : ''}${this.tagHTML(tg)}</div>`;
    }
    h += `<h2>${L('How this task flows')}</h2>` + ls.flow.map((f, i) => `${i ? '<div class="sline"></div>' : ''}<div class="stage ${f[1] ? 'auto' : ''} ${i < stage ? 'done' : i === stage ? 'cur' : ''}"><span class="sd">${i < stage ? '✓' : f[1] ? '⚙' : i + 1}</span><span>${esc(L(f[0]))}${f[1] ? `<small>${L('The app does this by itself')}</small>` : ''}</span></div>`).join('');
    if (ls.why) h += `<h2>${L('Why it matters')}</h2><p>${md(tx(ls.why))}</p>`;
    h += `<p class="muted" style="margin-top:16px">${L('Practice data only. Nothing here reaches the real app.')}</p>`;
    return h;
  },
  homeHTML() {
    const doneN = LESSONS.filter(l => G.done[l.id]).length;
    const node = (cls, i, en, sen) => `<div class="fnode ${cls}"><span class="fi">${i}</span><span><b>${L(en)}<span class="ftag ${cls === 'auto' || cls === 'dec' ? 'app' : 'you'}">${cls === 'auto' || cls === 'dec' ? L('App') : L('You')}</span></b><span>${L(sen)}</span></span></div>`, ar = '<div class="farrow"></div>';
    let h = '';
    if (G.mode === 'free') { const hr = HERE[topScr().n] || HERE.home;
      h += `<div class="herecard"><div class="hk">${L('You are here')}</div><h3>${esc(tx(hr[0]))}</h3><ul>${hr[1].map(p => `<li>${md(tx(p))}</li>`).join('')}</ul><div class="rolepick">${L('Practise as')}: ${Object.keys(ROLES).map(r => `<button class="${ROLE === r ? 'on' : ''}" data-g="role" data-v="${r}">${esc(tx(ROLES[r].role[0]))}</button>`).join('')}</div><div class="sbtns"><button class="btn" data-g="reset">↺ ${L('Reset practice data')}</button></div></div>`; }
    h += `<h1>${L('Learn the Maitrayana app by using it')}</h1><p class="lead">${L('The phone on the right works like Maitrayana\'s Avni app: the same screens, forms, checks and cards. Pick a lesson and follow the glowing box.')} <a class="vlink" href="${VIDEO}" target="_blank" rel="noopener">▶ ${L('Watch the demo video')}</a></p>
      <div class="how"><div><b>1</b>${md(L('Read the step. Press **Next** when it is only to read.'))}</div><div><b>2</b>${md(L('Tap the glowing part on the phone, or press **Do it for me**.'))}</div><div><b>3</b>${md(L('Press **Back** to see the previous step again.'))}</div></div>
      <div class="esearch hsearch"><span>🔍</span><input id="homeq" type="search" data-g-in="home" placeholder="${esc(L('Search features: attendance, photo, enrol…'))}" autocomplete="off"></div>
      <div class="progress"><i style="width:${Math.round(doneN / LESSONS.length * 100)}%"></i></div><div class="muted">${doneN} / ${LESSONS.length} ${L('lessons completed')}</div>`;
    GROUPS.forEach(([g, en]) => { const ls = LESSONS.filter(l => l.g === g); if (!ls.length) return;
      h += `<h2>${L(en)}</h2><div class="lgroup">` + ls.map(l => `<button class="lcard ${G.done[l.id] ? 'done' : ''}" data-g="start" data-v="${l.id}"><span class="le">${l.e}</span><span class="lt"><b>${esc(tx(l.t))}</b><span>${esc(tx(l.d))}</span></span><span class="lgo">${G.done[l.id] ? '✓ ' + L('Done') : L('Start') + ' ▸'}</span></button>`).join('') + `</div>`; });
    h += `<div class="note">${L('All names here are made up for practice. Nothing you do on this page reaches the real app or the server.')}</div>
      <p class="muted"><button class="linkbtn" data-g="reset">↺ ${L('Reset practice data')}</button>${Track.on ? ` · ${L('This page counts lesson use anonymously to improve the guide. No names are collected.')}` : ''}</p>`;
    return h;
  },
  // the folded sidebar (YouTube's mini guide): one icon per section; a tap opens the panel at that section
  railHTML() { return `<button class="ovt" data-g="ovt" title="${esc(L('Overview'))}">☰</button>` + OVSEC.map(([k, e, t]) => `<button class="rail" data-g="ovgo" data-v="${k}" title="${esc(L(t))}"><span>${e}</span><small>${esc(L(OVSHORT[k]))}</small></button>`).join(''); },
  osec(k, t) { return `<details class="osec" data-k="${k}" ${G.ovClosed[k] ? '' : 'open'}><summary>${L(t)}</summary>`; },   // collapsible overview section; closed ones stay closed across redraws
  overviewHTML() {
    const node = (cls, i, en, sen) => `<div class="fnode ${cls}"><span class="fi">${i}</span><span><b>${L(en)}<span class="ftag ${cls === 'auto' || cls === 'dec' ? 'app' : 'you'}">${cls === 'auto' || cls === 'dec' ? L('App') : L('You')}</span></b><span>${L(sen)}</span></span></div>`, ar = '<div class="farrow"></div>';
    let h = this.osec('avni', 'Avni in one minute') + `<div class="gloss">${[['🏫', 'Record', 'A site, a batch or a participant. You register it once.'], ['📝', 'Form', 'Questions you fill for a record. Some questions appear only after an answer.'],
      ['🏐', 'Session', 'A form filled on a date for a batch: what was covered, a photo, and who came.'], ['🟦', 'Card', 'A coloured box on Home. The number tells how many records are behind it.'], ['🔄', 'Sync', 'Sends your saved work to the server and brings new work. Needs internet.']]
      .map(([e, a, b]) => `<div><span>${e}</span><b>${L(a)}</b><small>${L(b)}</small></div>`).join('')}</div>`;
    h += '</details>' + this.osec('j1', 'Journey 1: a site, a batch and its participants') + `<div class="flow">` +
      node('', '🏫', 'Register the site', 'Name, address and the type: School or Community.') + ar +
      node('auto', '⚙️', 'The right contact is asked', 'A school asks for its point of contact; a community site asks for the coach.') + ar +
      node('', '👥', 'Create the batch', 'Name, address, its site and the donor.') + ar +
      node('', '➕', 'Add participants from the batch', 'Contact, education, career, family, health and functional difficulty.') + ar +
      node('auto', '⚙️', 'She becomes a member', 'Registering from the batch adds her to it. No second step.') + `</div>`;
    h += '</details>' + this.osec('j2', 'Journey 2: programmes and session attendance') + `<div class="flow">` +
      node('', '📋', 'Enrol the batch in a programme', 'Nirman, Pragati, Akanksha, Vriddhi or Siddhi. One enrolment each.') + ar +
      node('', '🏐', 'Open Session Attendance', 'Each programme has its own netball and life skill forms.') + ar +
      node('', '📷', 'Topic and photo', 'What was covered, and a picture of the session.') + ar +
      node('', '✅', 'Tick who came', 'The list is the batch\'s own participants.') + ar +
      node('auto', '⚙️', 'Present and not present are counted', 'The app works out both numbers from your ticks.') + `</div>`;
    h += '</details>' + this.osec('j3', 'Journey 3: common sessions and the dashboards') + `<div class="flow">` +
      node('', '🤝', 'Common Sessions tab', 'General sessions (baseline, parents meeting, graduation…) and Community Hub sessions.') + ar +
      node('auto', '⚙️', 'Home and Total update', 'Recent registrations and attendance go up as soon as you save.') + ar +
      node('end', '🔄', 'Sync', 'One tap sends records and photos to the server.') + `</div>`;
    h += `<div class="legend"><span><i style="background:#fff;border-color:var(--line)"></i>${L('You do this')}</span><span><i style="background:var(--auto-soft);border-color:#b9b9ee;border-style:dashed"></i>${L('The app does this by itself')}</span></div>`;
    h += '</details>' + this.osec('col', 'Colours you will see') + `<p class="muted" style="margin:0 0 8px">${L('Each programme has its own colour, on the Home cards and on the batch.')}</p><div class="pillrow">${Object.values(PROGRAMS).map(p => `<span class="pill"><span class="sw2" style="background:${PRN[p].colour}"></span>${esc(progLabel(p))}</span>`).join('')}</div>
      <div class="pillrow"><span class="pill"><span class="sw2" style="background:#b5f0e7"></span>${L('Registrations')}</span><span class="pill"><span class="sw2" style="background:#D9D3EE"></span>${L('General and Community')}</span></div>`;
    h += '</details>';
    return h;
  },
  /* ---------- What it does: every feature in plain words; a tap opens it on the phone ---------- */
  enhRows() {                                          // area chip + search words (every word must match somewhere in the row)
    const words = G.enhQ.toLowerCase().split(/\s+/).filter(Boolean);
    return APP.features.filter(r => (!G.enhArea || r.area === G.enhArea) && words.every(w =>
      [r.feature, r.area, r.what, r.benefit, r.where, r.keywords || '', r.lesson ? (LESSONS.find(l => l.id === r.lesson) || {}).t : ''].join(' ').toLowerCase().includes(w)));
  },
  enhListHTML() {
    const shown = this.enhRows();
    return `<div class="muted" style="margin:0 0 8px">${L('{0} of {1} shown', shown.length, APP.features.length)} · ${L('Tap a feature to see it on the phone.')}</div>` + (shown.map(r => { const i = APP.features.indexOf(r), ls = r.lesson && LESSONS.find(l => l.id === r.lesson);
      return `<div class="ecard ${G.featOn === i ? 'on' : ''}" data-g="feat" data-v="${i}" role="button" tabindex="0"><div class="eh"><b>${esc(r.feature)}</b><span class="eopen">${G.featOn === i ? L('On the phone') + ' ✓' : L('Open') + ' ▸'}</span></div>
      <div class="ea">${esc(r.area)} · ${esc(r.where)}</div><p>${esc(r.what)}</p><p class="eb">${esc(r.benefit)}</p>${ls ? `<button class="elearn" data-g="start" data-v="${ls.id}">${ls.e} ${L('Lesson')}: ${esc(ls.t)} ▸</button>` : ''}</div>`; }).join('')
      || `<div class="note">${L('Nothing matches your search.')}</div>`);
  },
  // "open" in data/features.json: home | total | register | search | more | filter | card:<card name> | batch[:tab[:programme]] | site | participant | choose:<programme> | regform:<type> | enrol
  openFeat(i) {
    const r = APP.features[i]; if (!r) return;
    G.lesson = null; G.fin = false; G.tg = null; F = null; S.modal = null; S.toast = null;
    this.reset('coach'); addDemo(6);                    // the video's own records, with the demo login
    const [k, a, b] = (r.open || 'home').split(':'), home = [{n: 'home'}], d = DB.demo, batch = (tab, prog) => [...home, {n: 'subject', id: d.batch.uuid, tab: tab || 'profile', prog: prog && PROGRAMS[prog]}];
    S.stack = k === 'total' ? [{n: 'dash2'}] : ['register', 'search', 'more'].includes(k) ? [{n: k}] : k === 'card' ? [...home, {n: 'cards', id: CARD(a)}] : k === 'batch' ? batch(a, b) : k === 'site' ? [...home, {n: 'subject', id: d.site.uuid}]
      : k === 'participant' ? [...home, {n: 'subject', id: d.priya.uuid}] : k === 'choose' ? [...batch('programs', a), {n: 'chooseVisit', id: d.batch.uuid, prog: PROGRAMS[a]}] : k === 'enrol' ? batch('programs') : home;
    if (k === 'filter') { S.stack = [{n: 'dash2'}]; ACT['d:filter'](); }
    if (k === 'participant') S.exp['reg' + d.priya.uuid] = true;
    if (k === 'regform') ACT.rtype(a);
    if (k === 'enrol') { DB.enrolments = DB.enrolments.filter(n => n.subjectUuid !== d.batch.uuid || n.program === PROGRAMS.nirman); touch(); ACT['enrol:open'](); }
    G.featOn = i; G.mode = 'free'; G.key = ''; Track.ev('page', {detail: 'feature: ' + r.feature});
    $('#guide').classList.remove('open'); renderPhone(false);
    const l = $('#enhlist'); if (l) l.innerHTML = this.enhListHTML();
  },
  enhHTML() {
    const rows = APP.features, areas = _.uniq(rows.map(r => r.area)), pick = G.enhArea;
    return `<h1>${L('What this app does')}</h1><p class="lead">${L('Everything Maitrayana\'s app does, in plain words. Search, or pick an area.')}</p>
      <div class="how"><div><b>${rows.length}</b>${L('features')}</div><div><b>${Object.keys(PROGRAMS).length}</b>${L('programmes')}</div><div><b>${areas.length}</b>${L('areas of the app')}</div></div>
      <div class="esearch"><span>🔍</span><input id="enhq" type="search" data-g-in="enh" placeholder="${esc(L('Search the features'))}" value="${esc(G.enhQ)}" autocomplete="off"></div>
      <div class="chiprow"><button class="${pick ? '' : 'on'}" data-g="area" data-v="">${L('All')}</button>${areas.map(a => `<button class="${pick === a ? 'on' : ''}" data-g="area" data-v="${esc(a)}">${esc(a)}</button>`).join('')}</div>
      <div id="enhlist">${this.enhListHTML()}</div>`;
  },
  mbar(st, tg) {
    const mb = $('#mbar');
    if (G.lesson && !G.fin) mb.innerHTML = `<div class="mk"><span>${esc(tx(G.lesson.t))} · ${G.i + 1}/${G.lesson.steps.length}</span><span>${tg && tg.info ? '👀' : '👆'}</span></div><div class="mt">${md(tg ? tg.txt : '')}</div><div class="mb"><button class="btn" data-g="back" ${this.canBack() ? '' : 'disabled'}>◂ ${L('Back')}</button>${this.stepBtns(tg)}<button class="btn" data-g="open">☰ ${L('Guide')}</button></div>`;
    else if (G.lesson) mb.innerHTML = `<div class="mk"><span>${L('Lesson complete')} 🎉</span></div><div class="mt">${esc(tx(G.lesson.t))}</div><div class="mb"><button class="btn pri" data-g="open">${L('See what you learnt')} ▸</button></div>`;
    else mb.innerHTML = `<div class="mk"><span>Maitrayana · ${L('practice app')}</span></div><div class="mt">${G.mode === 'free' ? L('Free explore: tap anything on the phone.') : L('Choose a lesson to begin.')}</div><div class="mb"><button class="btn pri" data-g="open">☰ ${L('Lessons')}</button></div>`;
  },
  bind() {
    const h = e => {
      const el = e.target.closest('[data-g]'); if (!el) return;
      const a = el.dataset.g, v = el.dataset.v;
      if (a === 'mode') { G.page = 'lessons'; G.featOn = -1; this.setMode(v); }
      else if (a === 'enh') { Track.ev('page', {detail: 'what-it-does'}); G.page = 'enh'; G.key = ''; this.render(); }
      else if (a === 'area') { G.enhArea = v; G.key = ''; this.render(); }
      else if (a === 'feat') { if (!e.target.closest('[data-g="start"]')) this.openFeat(+v); }
      else if (a === 'start') this.start(v);
      else if (a === 'restart') this.start(G.lesson.id);
      else if (a === 'exit') this.exit();
      else if (a === 'auto') this.auto();
      else if (a === 'back') this.back();
      else if (a === 'next') this.next();
      else if (a === 'role') { Track.ev('role_change', {detail: v}); this.reset(v); G.key = ''; renderPhone(false); }
      else if (a === 'ovt') { G.ovMini = !G.ovMini; Track.ev('overview', {detail: G.ovMini ? 'fold' : 'open'}); persist(); G.key = ''; this.render(); }
      else if (a === 'ovgo') { G.ovMini = false; G.ovClosed[v] = false; persist(); G.key = ''; this.render(); const d = $(`#overview .osec[data-k="${v}"]`); if (d) d.scrollIntoView({block: 'start', behavior: 'smooth'}); }
      else if (a === 'open') $('#guide').classList.add('open');
      else if (a === 'close') $('#guide').classList.remove('open');
      else if (a === 'reset') { this.reset(); G.key = ''; renderPhone(false); }
    };
    addEventListener('keydown', e => { if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return;
      const b = e.key === 'ArrowLeft' ? $('#gact .actb:not([disabled])') : (e.key === 'Enter' || e.key === 'ArrowRight') ? $('#gact .act:not([disabled])') : null;
      if (b) { e.preventDefault(); b.click(); } });
    $('#guide').addEventListener('click', h); $('#mbar').addEventListener('click', h); $('#overview').addEventListener('click', h);
    const tog = e => { const d = e.target; if (d.classList && d.classList.contains('osec')) G.ovClosed[d.dataset.k] = !d.open; };
    $('#overview').addEventListener('toggle', tog, true); $('#guide').addEventListener('toggle', tog, true);
    const refocus = () => { const q = $('#enhq'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } };
    $('#guide').addEventListener('keydown', e => { const c = e.target.closest && e.target.closest('.ecard[data-g="feat"]'); if (c && (e.key === 'Enter' || e.key === ' ') && e.target === c) { e.preventDefault(); this.openFeat(+c.dataset.v); } });
    $('#guide').addEventListener('input', e => {
      if (e.target.dataset.gIn === 'home') { G.enhQ = e.target.value; G.enhArea = ''; G.page = 'enh'; G.key = ''; this.render(); return refocus(); }   // typing on the first page moves to the feature list
      if (e.target.dataset.gIn !== 'enh') return; const v = e.target.value;
      clearTimeout(this._q); this._q = setTimeout(() => { G.enhQ = v; const l = $('#enhlist'); if (l) l.innerHTML = this.enhListHTML(); }, 250); });
  },

  /* ---------- self-test: plays every lesson with "Do it for me" ---------- */
  selftest() {
    const out = [];
    for (const ls of LESSONS) {
      let n = 0, err = null;
      try { this.start(ls.id); while (!G.fin && n++ < 500) { const before = this.sigAll();
        this.auto(); const after = this.sigAll();
        if (before === after && !G.fin) { err = 'stuck at step ' + (G.i + 1) + ': ' + (G.tg ? G.tg.txt : 'no target'); break; } }
        if (!err && ls.check) { const c = ls.check(); if (c !== true) err = 'check failed: ' + c; } }
      catch (e) { err = 'exception at step ' + (G.i + 1) + ': ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]; }
      out.push({id: ls.id, ok: G.fin && !err, actions: n, err});
    }
    return out;
  }
};
