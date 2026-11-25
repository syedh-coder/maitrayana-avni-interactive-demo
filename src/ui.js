'use strict';
/* ================= state ================= */
const S = {stack: [{n: 'home'}], modal: null, toast: null, exp: {}, search: {type: 'Participant', text: '', voided: false, extra: {}}, filter: {picked: [], tmp: []}, login: {u: '', p: ''}};
let F = null;                                   // the form being filled (null when no form is open)
const topScr = () => S.stack[S.stack.length - 1];
const go = (n, p = {}) => S.stack.push({n, ...p});
const goBack = () => { if (S.stack.length > 1) S.stack.pop(); };
const goHome = () => { S.stack = [{n: 'home'}]; F = null; S.modal = null; };
const toast = m => { S.toast = {m, id: Date.now()}; };
const later = (fn, ms) => SELFTEST ? fn() : setTimeout(fn, ms);
const live = notVoided;
const byWho = x => (x.by || USER.name) === USER.name ? 'You' : x.by;
const TYPES = () => BUNDLE.subjectTypes.filter(live).map(t => t.name).sort();

/* ================= dashboards ================= */
const cardRes = {};
const hasTypeFilter = d => filtersOf(d).some(f => (f.filterConfig || {}).type === 'SubjectType');
function cardOf(card, d) { const r = cardResult(card, d && hasTypeFilter(d) ? S.filter.picked : null); cardRes[card.uuid] = r; return r; }
function dashHTML(d, tag) {
  const flt = hasTypeFilter(d), applied = flt && S.filter.picked.length ? `<div class="afl"><span class="aclr" data-a="d:clear">${ic('filterx', 20, '#009688')}</span><div><b>Subject Type - </b>${S.filter.picked.map(esc).join(', ')}</div></div>` : '';
  return (flt ? `<div class="dtop"><span class="fbtn" data-a="d:filter">FILTER</span></div>${applied}` : '<div style="height:10px"></div>') + sectionsOf(d).map((sec, si) => `<div class="sec" data-sec="${tag}${si}"><h4>${esc(sec.name)}</h4><div class="cards">${sec.cards.map(c => {
    const n = cardOf(c, d).count;
    return `<div class="dc" style="background:${c.color || '#E7F3F8'}" data-a="card" data-v="${c.uuid}"><div class="n">${n}</div><div class="l">${esc(c.name)}</div><div class="cv">${ic('chev', 18, '#333')}</div></div>`; }).join('')}</div></div>`).join('') + '<div style="height:26px"></div>';
}

/* ================= shared pieces ================= */
function rowHTML(s, extra = '', act = 'open') {
  const sub = isPerson(s) ? `<div class="rs"><span>${s.gender}</span><span>${ageText(s)}</span></div>` : '';
  return `<div class="row" data-a="${act}" data-v="${s.uuid}"><div class="av">${esc(initials(s))}</div><div class="rt"><div class="rn">${esc(fullName(s))}${s.voided ? '<span style="color:#f00"> (VOIDED)</span>' : ''}</div>${sub}<div class="ra">${esc(villageName(s))}</div>${extra}</div></div>`;
}
const STAT = {due: ['Due', '#009688'], overdue: ['Overdue', '#d0011b'], future: ['Scheduled For', '#B8860B']};
function plannedHTML(list) {
  const open = list.filter(isOpen).sort((a, b) => a.earliestVisitDateTime < b.earliestVisitDateTime ? -1 : 1);
  return `<div class="cap">Visits Planned</div>` + (open.length ? open.map(e => { const st = STAT[vstat(e)];
    return `<div class="vc" data-enc="${e.uuid}"><div class="vt">${esc(e.name)}</div><div class="vd">Scheduled For: ${D.long(e.earliestVisitDateTime)}</div><span class="vb" style="background:${st[1]}">${st[0]}</span><div class="va"><span class="tl" data-a="visit:do" data-v="${e.uuid}">Do</span></div></div>`; }).join('')
    : `<div class="vc"><div class="vd" style="color:#222;font-size:15.5px">No planned visits</div></div>`);
}
const formOfEnc = e => { const n = e.enrolmentUuid && DB.enrolments.find(x => x.uuid === e.enrolmentUuid), st = subj(e.subjectUuid).type; return n ? formFor('ProgramEncounter', st, e.type, n.program) : formFor('Encounter', st, e.type); };
function completedHTML(list, cap, none, key) {
  const all = list.filter(e => e.encounterDateTime).sort((a, b) => a.encounterDateTime < b.encounterDateTime ? 1 : a.encounterDateTime > b.encounterDateTime ? -1 : (+a.uuid.split('-')[1] < +b.uuid.split('-')[1] ? 1 : -1));
  const more = all.length > 3, done = more && !S.exp['all' + key] ? all.slice(0, 3) : all;          // the latest three, then VIEW ALL
  return `<div class="cap capx"><span>${cap}</span>${more ? `<span class="vall" data-a="exp" data-v="all${key}">${S.exp['all' + key] ? 'VIEW LESS' : `VIEW ALL (${all.length})`}</span>` : ''}</div>` + (done.length ? done.map(e => { const ex = S.exp[e.uuid];
    return `<div class="vc" data-enc="${e.uuid}"><div class="vt">${esc(e.type)}</div><span class="exp" data-a="exp" data-v="${e.uuid}">${ic(ex ? 'up' : 'down', 26, '#666')}</span>` +
      `<div class="vd">Visit Date: ${D.long(e.encounterDateTime)} by ${esc(byWho(e))} </div><div class="vd">${e.earliestVisitDateTime ? 'Scheduled For: ' + D.long(e.earliestVisitDateTime) : 'Unplanned Visit'}</div>` + (ex ? obsTable(formOfEnc(e), e.obs) : '') +
      `<div class="va">${can('EditVisit', subj(e.subjectUuid).type, e.type) ? `<span class="tl" data-a="visit:edit" data-v="${e.uuid}">Edit</span>` : ''}<span class="tl" data-a="noop" data-v="Share">Share</span></div></div>`; }).join('')
    : `<div class="vc"><div class="vd" style="color:#222;font-size:15.5px">${none}</div></div>`);
}
const photoHTML = v => `<img class="pic" src="${APP.photos[v] || APP.photos.general}" alt="Session photo">`;
function fmtv(el, v) {
  if (isEmpty(v)) return '';
  const d = cdef(el);
  if (d.dataType === 'Date' || d.dataType === 'DateTime') return D.obs(v);
  if (d.dataType === 'Image') return photoHTML(v);
  if (d.dataType === 'Subject') return (Array.isArray(v) ? v : [v]).map(u => `<span class="schip">${esc(fullName(subj(u)))}</span>`).join('');
  if (Array.isArray(v)) return v.map(esc).join(', ');
  return esc(v) + (d.unit ? ' ' + esc(d.unit) : '');
}
function obsTable(form, obs, editAct) {
  if (!form) return '';
  let h = '';
  pagesOf(form).forEach((g, pi) => {
    let rows = '';
    topElements(g).forEach(el => { const v = obs[cname(el)]; if (!isEmpty(v)) rows += `<tr><td>${esc(cname(el))}</td><td>${fmtv(el, v)}</td></tr>`; });      // the phone's tables show the concept's name, which can differ from the question's label
    if (rows) h += `<tr><th colspan="2">${esc(g.display || g.name)}${editAct ? `<span data-a="${editAct}" data-v="${pi}">Edit</span>` : ''}</th></tr>` + rows;
  });
  return `<table class="obs">${h}</table>`;
}

/* ================= screens ================= */
const SCREENS = {
  login: () => ({noHdr: 1, body: `<div class="login"><div class="lg">avni</div><div style="color:#666;font-size:14px">Maitrayana</div>
    <div class="fe"><div class="fl">User ID</div><input class="ti" data-in="login" data-k="u" value="${esc(S.login.u)}" autocomplete="off"></div>
    <div class="fe"><div class="fl">Password</div><input class="ti" type="password" data-in="login" data-k="p" value="${esc(S.login.p)}" autocomplete="off"></div>
    <div class="lb" data-a="login:go">LOGIN</div><div class="fp">Forgot Password</div></div>`}),
  home: () => { const d = dashboardsFor().primary; return {title: 'Home', right: ['search', 'sync'], tabs: 'home', body: d ? dashHTML(d, 'h') : '<div class="empty">No dashboard</div>'}; },
  dash2: () => { const d = dashboardsFor().secondary; return {title: 'Home', right: ['sync'], tabs: 'dash2', body: dashHTML(d, 's')}; },
  dashlist: p => { const all = dashboardsFor().all, cur = all.find(d => d.name === p.name) || all[0]; return {title: 'Dashboards', back: 1, body: `<div class="dline"></div><div class="dtabs">${all.map(d => `<span class="${d === cur ? 'on' : ''}" data-a="dash:tab" data-v="${esc(d.name)}">${esc(d.name)}</span>`).join('')}</div>` + dashHTML(cur, 'x')}; },
  filter: () => ({title: 'FILTER', back: 1, right: ['home'], foot: `<div class="apply" data-a="fl:apply">Apply</div>`, body: `<div class="pad" style="padding:22px 24px"><div class="fe"><div class="fl">Subject Type</div><div class="rg" style="border:0">${TYPES().map(t =>
    `<div class="ro" data-a="fl:pick" data-v="${esc(t)}">${ic(S.filter.tmp.includes(t) ? 'c1' : 'c0', 22, S.filter.tmp.includes(t) ? '#009688' : '#444')}<span>${esc(t)}</span></div>`).join('')}</div></div></div>`}),
  cards: p => { const c = CARDU[p.id], r = cardRes[p.id] || cardOf(c), list = r.ids.map(subj).filter(Boolean);
    return {title: c.name.length > 30 ? c.name.slice(0, 30) + '...' : c.name, back: 1, right: ['home'], cls: 'gray', body: `<div class="cnt"><span>${list.length} matching results</span><span>Displayed: ${list.length}</span></div>` + (list.map(s => rowHTML(s)).join('') || '<div class="zero">No result found</div>')}; },
  search: () => { const extra = BUNDLE.searchFilters.filter(f => f.type === 'Concept' && (STU[f.subjectTypeUUID] || {}).name === S.search.type);
    return {title: 'Search', tabs: 'none', body: `<div class="pad"><div class="fe"><div class="fl">Choose type</div><div class="rg">${TYPES().map(t => `<div class="ro" data-a="s:type" data-v="${esc(t)}">${ic(S.search.type === t ? 'r1' : 'r0', 22, '#009688')}<span>${esc(t)}</span></div>`).join('')}</div></div>
    <div class="fe"><div class="fl">All text fields within observations of registration and enrolment</div><input class="ti" data-in="stext" value="${esc(S.search.text)}" autocomplete="off"></div>` +
    extra.map(f => `<div class="fe"><div class="fl">${esc(f.titleKey)}</div><input class="ti" data-in="sx" data-k="${esc(f.conceptName)}" value="${esc(S.search.extra[f.conceptName] || '')}" autocomplete="off"></div>`).join('') +
    `<div class="fe"><div class="fl">Include voided</div><div class="ck" data-a="s:void">${ic(S.search.voided ? 'c1' : 'c0', 26, S.search.voided ? '#009688' : '#999')}<span style="margin-left:14px">Yes</span></div></div></div><div class="sbm" data-a="s:submit">Submit</div>`}; },
  results: p => { const q = S.search.text.trim().toLowerCase(), type = p.type || S.search.type, text = s => (fullName(s) + ' ' + Object.values(s.obs).join(' ')).toLowerCase();
    const xs = p.pick ? [] : Object.entries(S.search.extra).filter(([, v]) => v && v.trim());
    const list = DB.subjects.filter(s => s.type === type && (S.search.voided || live(s)) && (!q || text(s).includes(q)) && xs.every(([k, v]) => String(s.obs[k] || '').toLowerCase().includes(v.trim().toLowerCase())) && (!p.exclude || !p.exclude.includes(s.uuid)))
      .sort((a, b) => fullName(a) < fullName(b) ? -1 : 1);
    return {title: p.pick ? `${fullName(subj(p.pick))} - Add Member - Search` : 'Search Results', back: 1, right: ['home'], cls: 'gray', body: `<div class="cnt"><span>${list.length} matching results</span></div>` + (list.map(s => rowHTML(s, '', p.pick ? 'am:pick' : 'open')).join('') || `<div class="empty">No results</div>`)}; },
  register: () => { const ts = BUNDLE.subjectTypes.filter(t => live(t) && can('RegisterSubject', t.name)).sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
    return {title: 'Register', tabs: 'register', cls: 'gray', body: `<div class="rlist">${ts.map(t => `<div class="rtype" data-a="rtype" data-v="${esc(t.name)}"><span class="rti"><img src="${APP.icons[t.type.toLowerCase()] || APP.icons.individual}" alt=""></span><span class="rtn">${esc(t.name)}</span><span class="rtc">${ic('chev', 40, '#009688')}</span></div>`).join('') || '<div class="empty">Your user cannot register records</div>'}</div>`}; },
  more: () => ({noHdr: 1, tabs: 'more', cls: 'gray', body: `<div class="mu">${ic('user', 44, '#fff')}<div><b>${USER.login} - ${esc(USER.name)} (Maitrayana demo)</b><span>Edit Settings</span></div></div>` +
    [[['dash', 'Dashboards'], ['video', 'Video List']], [['sync', 'Entity Sync Status'], ['hist', 'Setup fast sync']], [['key', 'Change Password'], ['logout', 'Logout']], [['hist', 'Upload app info']]]
      .map(g => `<div class="mg">${g.map(([i, n]) => `<div class="mi" data-a="more" data-v="${n}">${ic(i, 26, '#444')}<span>${n}</span>${n === 'Logout' ? '' : ic('chev', 34, '#35a99b')}</div>`).join('')}</div>`).join('') +
    `<div class="minfo"><small>Server:</small> https://server.avniproject.org<br><small>Backend:</small> realm<br><small>Database Schema :</small> 220</div>`}),
  subject: p => subjectScreen(p),
  addMember: p => addMemberScreen(p),
  chooseVisit: p => ({title: 'Choose Visit', back: 1, right: ['home'], body: `<div class="cvh">Unplanned Visits</div>` + eligibleVisits(subj(p.id), p.prog).map(t => `<div class="cvi" data-a="pv:type" data-v="${esc(t)}"><span style="flex:1">${esc(t)}</span>${ic('chev', 38, '#bbb')}</div>`).join('')}),
  form: () => formScreen(),
  summary: () => summaryScreen()
};

function regCard(s, canEdit) {
  const ex = S.exp['reg' + s.uuid], form = formFor('IndividualProfile', s.type);
  return `<div class="cap">Registration Details</div><div class="vc" data-reg="1"><div class="vt" style="padding-right:26px">Registration Date:  ${D.long(s.registrationDate)} by ${esc(byWho(s))}</div><span class="exp" data-a="exp" data-v="reg${s.uuid}">${ic(ex ? 'up' : 'down', 22, '#666')}</span>` +
    (ex ? obsTable(form, s.obs, canEdit ? 'reg:edit' : null) : '') +
    `<div class="va">${can('VoidSubject', s.type) ? '<span class="red" data-a="reg:void">Void</span>' : ''}${canEdit ? '<span class="tl" data-a="reg:edit" data-v="-1">Edit</span>' : ''}<span class="tl" data-a="noop" data-v="Share">Share</span></div></div>`;
}
// white text as on the phone, dark text where the programme's colour is too pale to read white on
const inkOn = hex => { const n = parseInt(hex.slice(1), 16), l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; return l > 0.72 ? '#1b5e20' : '#fff'; };
const subjectTabs = s => hasPrograms(s) ? [['profile', 'profile', 'Profile'], ['programs', 'prog', TR('programsEnrolled')], ['general', 'list', TR('general')]] : null;
function subjectScreen(p) {
  const s = subj(p.id), person = isPerson(s), group = STN[s.type].group, canEdit = can('EditSubject', s.type), tabs = subjectTabs(s), tab = tabs ? (p.tab || 'profile') : 'profile';
  const line = person ? `${s.gender}, ${ageText(s)}, ${villageName(s)}` : villageName(s);
  let b = `<div class="ph"><div class="av">${esc(initials(s))}</div><div class="pn"><b>${esc(fullName(s))}${s.voided ? ' (voided)' : ''}</b><span>${esc(line)}</span></div><div class="loc" data-a="noop" data-v="Location">${ic('place', 38, '#009688')}<div>Location</div></div></div>`;
  if (person) groupsOf(s).forEach(g => { b += `<div class="gchip"><span data-a="open" data-v="${g.uuid}">${esc(fullName(g))} Group</span></div>`; });
  const enrolLink = tabs && eligiblePrograms(s).length ? `<div class="enl" data-a="enrol:open">+ ${esc(TR('enrolInProgram'))}</div>` : '';
  b += `<div class="pbody">`;
  if (tab === 'profile') {
    b += enrolLink;
    if (!tabs && hasGeneralVisits(s)) { const vs = eligibleVisits(s);       // one possible form shows as its own button, as on the phone
      if (vs.length === 1) b += `<div class="nfb"><span class="tbtn" data-a="type" data-v="${esc(vs[0])}">${esc(vs[0])}</span></div>`; else if (vs.length) b += `<div class="nfb"><span class="tbtn" data-a="newform">${esc(TR('newGeneralVisit'))}</span></div>`; }
    b += regCard(s, canEdit);
    if (!tabs && hasGeneralVisits(s)) b += plannedHTML(encOf(s)) + completedHTML(encOf(s), 'Completed Encounters', 'No previous visits', s.uuid);
    if (group) { const ms = membersOf(s), ex = S.exp['mem' + s.uuid] !== false;
      b += `<div class="vc" data-mem="1"><div class="mhead" data-a="exp" data-v="mem${s.uuid}"><span>${esc(TR('members'))} (${ms.length})</span>${can('AddMember', s.type) ? `<span class="tl" data-a="am:open">${esc(TR('addMember'))}</span>` : ''}<span class="exp">${ic(ex ? 'up' : 'down', 22, '#666')}</span></div>` +
        (ex && ms.length ? `<div class="mcard"><div class="mh2"><span>Name</span><span>Actions</span></div>` + ms.map(m => { const c = subj(m.memberUuid);
          return `<div class="mrow"><div class="av">${esc(initials(c))}</div><div class="mn"><a data-a="open" data-v="${c.uuid}">${esc(fullName(c))}</a><sup>0</sup><small>Member</small></div><span data-a="mem:menu" data-v="${m.uuid}">${ic('dots', 25, '#148be4')}</span></div>`; }).join('') + `</div>` : '') + `</div>`; }
  } else if (tab === 'programs') {
    const ens = enrolmentsOf(s).filter(n => !n.exitDateTime), cur = ens.find(n => n.program === p.prog) || ens[0];
    b += enrolLink + `<div class="cap">Program List</div>`;
    if (!cur) b += `<div class="vc" style="display:inline-block;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.18)"><div class="vd" style="color:#222;font-size:15.5px;max-width:120px">${esc(TR('notEnrolledInAnyProgram'))}</div></div>`;
    else { const col = (PRN[cur.program] || {}).colour || '#009688', vs = eligibleVisits(s, cur.program);
      b += `<div class="plist"><div class="pcol">${ens.map(n => { const c = (PRN[n.program] || {}).colour || '#009688', on = n === cur;
        return `<div class="pbtn ${on ? '' : 'off'}" style="${on ? `background:${c};color:${inkOn(c)}` : `color:${c};border-color:${c}`}" data-a="prog" data-v="${esc(n.program)}">${esc(progLabel(n.program))}</div>`; }).join('')}</div>` +
        (vs.length ? `<span class="tbtn" data-a="pv:new">${esc(TR('newProgramVisit'))}</span>` : '') + `</div>` +
        `<div class="cap">Summary</div><div class="psum">Program name: ${esc(progLabel(cur.program))}</div>` + plannedHTML(progEncOf(cur)) +
        `<div class="cap">Enrolment Details</div><div class="vc" data-enrol="1"><div class="vt">${esc(progLabel(cur.program))}</div><div class="vd">Enrolled on: ${D.long(cur.enrolmentDateTime)} by ${esc(byWho(cur))}</div><div class="va"><span class="red" data-a="noop" data-v="Exit">Exit</span><span class="tl" data-a="noop" data-v="Edit enrolment">Edit</span><span class="tl" data-a="noop" data-v="Share">Share</span></div></div>` +
        completedHTML(progEncOf(cur), 'Completed Visits', 'No completed visits', cur.uuid); }
  } else {
    if (eligibleVisits(s).length) b += `<div class="nfb"><span class="tbtn" data-a="newform">${esc(TR('newGeneralVisit'))}</span></div>`;
    b += plannedHTML(encOf(s)) + completedHTML(encOf(s), 'Completed Encounters', 'No previous visits', s.uuid);
  }
  b += `</div>`;
  const foot = tabs ? `<div class="stabs">${tabs.map(([k, i, n]) => `<div class="stab ${tab === k ? 'on' : ''}" data-a="stab" data-v="${k}">${ic(i, 21)}<span>${esc(n)}</span></div>`).join('')}</div>` : '';
  return {title: 'Dashboard', back: 1, right: ['home'], foot, body: b + '<div style="height:60px"></div>'};
}
function addMemberScreen(p) {
  const g = subj(p.id), c = p.member && subj(p.member);
  let b = `<div class="fe"><div class="fl">Role <i>*</i></div><div class="rov rolebox">Member</div></div>
    <div class="fe"><div class="fl" style="font-size:15px">Membership start date <i>*</i></div><span class="dv" data-a="am:date">${D.dmy(p.start || T)} ${ic('bksp', 20, '#009688')}</span></div>`;
  b += `<div class="fe" style="padding-top:20px"><div class="fl">Group Member <i>*</i></div>` +
    (c ? `<div class="amsel"><span>${esc(fullName(c))}</span><span data-a="am:search">${ic('search', 36, '#009688')}</span></div>` : `<div class="cbtn" data-a="am:search">Search existing Participant</div>`) +
    (p.err ? `<div class="err">${esc(p.err)}</div>` : '') + (c ? '' : `<div style="text-align:center;margin:20px 0 0">OR</div><div class="cbtn" data-a="rtype" data-v="Participant">Register new Participant</div>`) + `</div>`;
  if (c) b += `<div class="fbt"><div class="fb pv" data-a="hdr:back">${ic('prev', 17)} PREVIOUS</div><div class="fb nx" data-a="am:save">SAVE ${ic('next', 17)}</div></div>`;
  return {title: 'Add Member', back: 1, right: ['home'], body: `<div class="pad" style="padding:28px 28px 60px">${b}</div>`};
}

/* ================= form engine (Maitrayana's real forms and rules) ================= */
const DATE_LABEL = {reg: 'Registration date', enc: 'Visit Date', cancel: 'Cancel Date', enrol: 'Enrolment Date'};
const dateLabel = () => F.kind === 'enc' && !encProgram() ? 'Visit date' : DATE_LABEL[F.kind];
const pathIds = uuid => { const out = []; let x = LOCS[uuid]; while (x) { out.unshift(x.uuid); x = LOCS[x.parent]; } return out; };
function startForm(o) {
  const form = o.form, kind = o.kind;
  const f = {kind, form, sType: o.sType, subject: clone(o.subject || {uuid: uid('N'), type: o.sType, firstName: '', lastName: '', registrationDate: T, obs: {}}),
    enc: o.enc ? clone(o.enc) : null, enrol: o.enrol ? clone(o.enrol) : null, obs: clone(o.obs || {}), date: o.date || T, page: o.startPage || 0, tried: -1, edit: !!o.edit, formErrs: [], core: {ageUnit: 'Years', path: []}, addTo: o.addTo};
  if (kind === 'reg') { f.pages = [{core: 1}, ...pagesOf(form)]; f.subject.registrationDate = f.date; if (f.subject.dob) f.core.age = ageYears(f.subject.dob); if (f.subject.village) f.core.path = pathIds(f.subject.village); }
  else if (kind === 'enrol') f.pages = [{enrolDate: 1}, ...pagesOf(form)];
  else f.pages = pagesOf(form);
  F = f; evaluate(F); go('form');
}
const formSubject = () => F.kind === 'reg' ? F.subject : subj((F.enc || F.enrol).subjectUuid);
const holderOf = () => F.obs;
function fset(el, gi, v) { if (isEmpty(v)) delete F.obs[cname(el)]; else F.obs[cname(el)] = v; }
function itemsOf(pi) {                     // the visible questions on a page: [{el}]
  const g = F.pages[pi]; if (g.core || g.enrolDate) return [];
  return topElements(g).filter(el => stOf(F, el).visibility).map(el => ({el}));
}
const pageHas = pi => F.pages[pi].core || F.pages[pi].enrolDate || pageVisible(F, F.pages[pi]);
const stepPage = dir => { let i = F.page + dir; while (i >= 0 && i < F.pages.length && !pageHas(i)) i += dir; return i; };
const errsOf = el => fieldErrors(F, el, F.obs, stOf(F, el), F.tried === F.page);
// the records a "pick a record" question offers: a batch's own members for attendance, every record of the type otherwise
const subjectChoices = el => kvOf(el, 'displayAllGroupMembers') && F.enc ? membersOf(subj(F.enc.subjectUuid)).map(m => subj(m.memberUuid)).filter(live)
  : DB.subjects.filter(s => live(s) && s.type === subjectTypeOf(el)).sort((a, b) => fullName(a) < fullName(b) ? -1 : 1);

function fieldHTML(el) {
  const st = stOf(F, el); if (!st.visibility) return '';
  const d = cdef(el), v = F.obs[cname(el)], errs = errsOf(el), ro = kvOf(el, 'editable') === false;
  const A = `data-k="${esc(el.uuid)}" data-g=""`;
  const lab = `<div class="fl">${esc(el.name)}${el.mandatory ? ' <i>*</i>' : ''}${d.unit ? `  (${esc(d.unit)})` : ''} </div>`;
  let b = '';
  if (ro) b = `<div class="rov">${isEmpty(v) ? '' : fmtv(el, v)}</div>`;
  else if (d.dataType === 'Coded') { const multi = isMulti(el), sel = multi ? (v || []) : [v];
    const opts = answersOf(el).filter(o => allowed(st, o));
    b = `<div class="rg ${errs.length ? 'bad' : ''}">${opts.map(o => `<div class="ro" data-a="f:opt" ${A} data-v="${esc(o)}">${ic(multi ? (sel.includes(o) ? 'c1' : 'c0') : (sel.includes(o) ? 'r1' : 'r0'), 22, '#009688')}<span>${esc(TR(o))}</span></div>`).join('')}</div>`; }
  else if (d.dataType === 'Subject' && isMulti(el)) { const sel = v || [], list = subjectChoices(el);
    b = `<div class="selall"><span data-a="f:all" ${A}>${list.length && sel.length === list.length ? 'Unselect All' : 'Select All'}</span></div>` + (list.map(c => `<div class="arow" data-a="f:opt" ${A} data-v="${c.uuid}"><div class="acard"><div class="av">${esc(initials(c))}</div><div><b>${esc(fullName(c))}</b><small>${esc(c.gender || '')}&nbsp;&nbsp;${c.dob ? ageText(c) : ''}</small><em>${esc(pathOf(c.village).reverse().join(', '))}</em></div></div>${ic(sel.includes(c.uuid) ? 'c1' : 'c0', 26, sel.includes(c.uuid) ? '#009688' : '#777')}</div>`).join('')
      || `<div class="rov" style="color:#888">${esc(TR('noGroupMembersAdded'))}</div>`); }
  else if (d.dataType === 'Subject') b = `<div class="rg one ${errs.length ? 'bad' : ''}">${subjectChoices(el).map(c => `<div class="ro srow" data-a="f:opt" ${A} data-v="${c.uuid}">${ic(v === c.uuid ? 'r1' : 'r0', 22, '#009688')}<span>${esc(fullName(c))}</span>${ic('down', 22, '#35a99b')}</div>`).join('')}</div>`;
  else if (d.dataType === 'Date' || d.dataType === 'DateTime') b = v ? `<span class="dv" data-a="f:date" ${A}>${D.dmy(v)} <span data-a="f:datecl" ${A}>${ic('bksp', 21, '#009688')}</span></span>` : `<span class="dv" data-a="f:date" ${A}>Choose a date</span>`;
  else if (d.dataType === 'Image' || d.dataType === 'ImageV2') b = `<div class="imgrow">${v ? `<div class="thumb">${photoHTML(v)}</div><span data-a="f:imgcl" ${A}>${ic('bksp', 30, '#35a99b')}</span>` : `<span data-a="f:img" ${A}>${ic('folder', 36, '#35a99b')}</span><span data-a="f:img" ${A}>${ic('cam', 36, '#35a99b')}</span>`}</div>`;
  else b = `<input class="ti" data-in="f" ${A} value="${esc(v ?? '')}" ${d.dataType === 'Numeric' ? 'inputmode="decimal"' : ''} autocomplete="off">`;
  return `<div class="fe" data-f="${esc(el.uuid)}" data-g="">${lab}${b}${errs.map(e => `<div class="err">${esc(e)}</div>`).join('')}</div>`;
}
const coreErr = k => {
  if (F.tried !== F.page) return [];
  const s = F.subject, empty = k === 'name' ? !s.firstName.trim() : k === 'first' ? !s.firstName.trim() : k === 'last' ? !s.lastName.trim() : k === 'dob' ? !s.dob : k === 'gender' ? !s.gender : !s.village;
  return empty ? ['There is no value specified'] : [];
};
// Address: one level at a time, as on the phone (State, then Region)
function addressHTML() {
  const path = F.core.path, e = coreErr('village'); let h = '';
  for (let i = 0; i <= path.length; i++) { const opts = kidsOf(i ? path[i - 1] : null); if (!opts.length) break;
    h += `<div class="alv"><div class="rgh"><span>${esc(opts[0].type)}</span>${i === 0 ? '<span class="any">Any</span>' : ''}</div><div class="rg one" style="border:0">${opts.map(l => `<div class="ro" data-a="f:addr" data-v="${l.uuid}">${ic(path[i] === l.uuid ? 'r1' : 'r0', 22, '#009688')}<span>${esc(l.name)}</span></div>`).join('')}</div></div>`; }
  return `<div class="fe" data-f="core:village"><div class="fl">Address <i>*</i> </div><div class="addr">${h}</div>${e.map(x => `<div class="err">${x}</div>`).join('')}</div>`;
}
function coreHTML() {
  const s = F.subject, st = STN[s.type], e = k => coreErr(k).map(x => `<div class="err">${x}</div>`).join('');
  const inp = (k, l, prop) => `<div class="fe" data-f="core:${k}"><div class="fl">${l} <i>*</i> </div><input class="ti" data-in="core" data-k="${prop}" value="${esc(s[prop] || '')}" autocomplete="off">${e(k)}</div>`;
  let b = `<div class="fe" style="margin-top:18px"><div class="fl">Registration date${st.type === 'Person' ? ' <i>*</i>' : ''}</div><span class="dv" data-a="f:vdate">${D.dmy(F.date)} ${ic('bksp', 21, '#009688')}</span></div>`;
  if (st.type === 'Person') b += inp('first', 'First Name', 'firstName') + inp('last', 'Last Name', 'lastName') +
    `<div class="fe" data-f="core:dob"><div class="fl">Date of Birth <i>*</i> </div><div class="dobrow"><span class="dv" data-a="f:dob">${s.dob ? D.dmy(s.dob) : 'Choose a date'}</span><span class="ro" data-a="f:verified">${ic(F.core.verified ? 'c1' : 'c0', 22, F.core.verified ? '#009688' : '#777')}<span>Verified</span></span></div><div class="fl" style="margin-top:2px">Age <i>*</i></div><div class="agerow"><input class="ti" data-in="core" data-k="age" inputmode="numeric" value="${esc(F.core.age ?? '')}">` +
    ['Years', 'Months'].map(u => `<span class="ro" data-a="f:ageu" data-v="${u}">${ic(F.core.ageUnit === u ? 'r1' : 'r0', 22, '#009688')}<span>${u}</span></span>`).join('') + `</div>${e('dob')}</div>` +
    `<div class="fe" data-f="core:gender"><div class="fl">Sex <i>*</i> </div><div class="rg one ${e('gender') ? 'bad' : ''}">${['Female', 'Male', 'Other'].map(g => `<div class="ro" data-a="f:gender" data-v="${g}">${ic(s.gender === g ? 'r1' : 'r0', 22, '#009688')}<span>${g}</span></div>`).join('')}</div>${e('gender')}</div>`;
  else b += `<div class="fe" data-f="core:name"><div class="fl">${esc(s.type)} Name <i>*</i> </div><input class="ti" data-in="core" data-k="firstName" value="${esc(s.firstName || '')}" autocomplete="off">${e('name')}</div>`;
  return b + addressHTML();
}
const regTitle = () => F.addTo && !F.edit ? 'Member  Registration' : `${F.sType} Registration`;          // the phone titles a registration started from a batch "Member Registration"
const encProgram = () => { const n = F.enc && F.enc.enrolmentUuid && DB.enrolments.find(x => x.uuid === F.enc.enrolmentUuid); return n ? n.program : null; };
function formTitle() {
  return F.kind === 'reg' ? regTitle() : F.kind === 'enrol' ? `${progLabel(F.enrol.program)} Enrolment` : F.kind === 'cancel' ? `${F.enc.type} Cancellation` : encProgram() ? `${fullName(formSubject())} - ${F.enc.type}` : `${F.enc.type} - Enter data`;
}
const subjectHead = s => `<div class="sh"><b>${esc(fullName(s))}</b><span>${esc(isPerson(s) ? `${s.gender}, ${ageText(s)}, ${villageName(s)}` : villageName(s))}</span></div>`;
function formScreen() {
  evaluate(F);
  const g = F.pages[F.page], first = stepPage(-1) < 0, dateRow = `<div class="fe" style="margin-top:18px"><div class="fl">${dateLabel()}</div><span class="dv" data-a="f:vdate">${D.dmy(F.date)} ${ic('bksp', 21, '#009688')}</span></div>`;
  let b = '', top = '';
  if (g.core) b += coreHTML();
  else if (g.enrolDate) { top = `<div class="sm">${subjectHead(formSubject())}</div>`; b += dateRow; }
  else {
    if (first && F.kind === 'enc' && !encProgram()) top = `<div class="sm">${subjectHead(formSubject())}</div>`;
    if (first && F.kind !== 'reg') b += dateRow;
    b += `<div class="fgt">${esc(g.display || g.name)}</div>` + topElements(g).map(el => fieldHTML(el)).join('');
  }
  if (F.formErrs.length) b += F.formErrs.map(e => `<div class="fmsg">${esc(e)}</div>`).join('');
  b += `<div class="fbt">${first ? '' : `<div class="fb pv" data-a="f:prev">${ic('prev', 17)} PREVIOUS</div>`}<div class="fb nx" data-a="f:next">NEXT ${ic('next', 17)}</div></div>`;
  return {title: formTitle(), back: 1, right: ['home'], body: `${top}<div class="fm">${b}</div>`};
}
function summaryScreen() {
  const s = formSubject(), pr = encProgram();
  const title = (F.kind === 'reg' ? regTitle() : F.kind === 'enrol' ? `${progLabel(F.enrol.program)}, ENROL` : pr ? `${progLabel(pr)}, ${F.enc.type}` : F.enc.type) + ' - Summary & Recommendations';
  const table = obsTable(F.form, F.obs), more = F.kind === 'reg' && !F.edit ? `<div class="another" data-a="noop" data-v="Save and register another">${F.addTo ? 'Save and Add another member' : `Save and register another ${esc(F.sType)}`}</div>` : '';
  return {title, back: 1, right: ['home'], body: `<div class="sm">${subjectHead(s)}` +
    (table.includes('<tr') ? `<div class="stb"><span>Scroll to Bottom to Save</span></div><h5 style="margin-top:22px">Observations</h5>${table}` : '<div style="height:18px"></div>') +
    `${more}<div class="fbt"><div class="fb pv" data-a="f:prev">${ic('prev', 17)} PREVIOUS</div><div class="fb nx" data-a="f:save">Save ${ic('next', 17)}</div></div></div>`};
}
function cleanObs(obs) { const o = {}; Object.entries(obs).forEach(([k, v]) => { if (!isEmpty(v)) o[k] = v; }); return o; }
function commit() {
  const obs = cleanObs(F.obs); let s, msg, at = {};
  if (F.kind === 'reg') {
    const raw = Object.assign({}, F.subject, {obs, registrationDate: F.date});
    if (F.edit) { s = subj(raw.uuid); Object.assign(s, raw); }
    else { s = Object.assign(raw, {by: USER.name}); DB.subjects.push(s); if (F.addTo) DB.groupSubjects.push({uuid: uid('M'), groupUuid: F.addTo, memberUuid: s.uuid, start: T, end: null}); }
    msg = 'Registration Saved';
  } else if (F.kind === 'enrol') {
    DB.enrolments.push(Object.assign({}, F.enrol, {enrolmentDateTime: F.date, exitDateTime: null, obs, by: USER.name}));
    s = subj(F.enrol.subjectUuid); msg = `${F.enrol.program} Enrolment Saved`; at = {tab: 'programs', prog: F.enrol.program};      // the phone's message carries the programme's stored name
  } else {
    let e = DB.encounters.find(x => x.uuid === F.enc.uuid);
    if (!e) { e = Object.assign({cancelObs: {}}, F.enc); DB.encounters.push(e); }
    if (F.kind === 'cancel') { e.cancelDateTime = F.date; e.cancelObs = obs; msg = 'Visit cancelled'; }
    else { e.encounterDateTime = F.date; e.obs = obs; e.by = e.by || USER.name; msg = `${e.type} Encounter Saved`; }
    s = subj(e.subjectUuid); at = encProgram() ? {tab: 'programs', prog: encProgram()} : hasPrograms(s) ? {tab: 'general'} : {};
  }
  touch(); S.unsynced = (S.unsynced || 0) + 1 + (F.kind === 'enc' && Object.keys(obs).some(k => (CON[k] || {}).dataType === 'Image') ? 1 : 0) + (F.kind === 'reg' && F.addTo && !F.edit ? 1 : 0);      // records waiting for the next Sync: the badge on the Sync icon
  const visits = F.kind === 'enrol' ? [] : scheduleFor(Object.assign({}, F, {obs, enc: F.enc && Object.assign({}, F.enc, F.kind === 'cancel' ? {cancelDateTime: F.date} : {encounterDateTime: F.date}), subject: s}));
  applySchedule(s.uuid, visits, F.enc && F.enc.enrolmentUuid); touch();
  S.last = {form: F.form.name, kind: F.kind, subject: s.uuid};
  const showId = F.kind === 'reg' && F.addTo && !F.edit ? F.addTo : s.uuid;      // a participant registered from a batch: the phone returns to the batch, member added
  F = null;
  const i = S.stack.map(x => x.n === 'subject' && x.id === showId).lastIndexOf(true);
  if (i < 0) { S.stack = S.stack.filter(x => !['form', 'summary', 'addMember', 'results', 'chooseVisit'].includes(x.n)); go('subject', Object.assign({id: showId}, at)); } else { S.stack.length = i + 1; Object.assign(S.stack[i], at); }
  toast(msg);
}

/* ================= modals ================= */
function modalHTML() {
  const m = S.modal; if (!m) return '';
  if (m.t === 'dlg') return `<div class="ov"><div class="dlg"><h6>${esc(m.title)}</h6><p>${esc(m.msg)}</p><div class="da">${m.btns.map((b, i) => `<span data-a="dlg" data-v="${i}">${b}</span>`).join('')}</div></div></div>`;
  if (m.t === 'types') return `<div class="ov"><div class="types"><span class="x" data-a="modal:x">${ic('close', 28, '#333')}</span><h6>${m.title}</h6>${m.items.map(x => { const [v, l, c] = Array.isArray(x) ? x : [x, x]; return `<div class="tb" ${c ? `style="background:${c};color:${inkOn(c)}"` : ''} data-a="${m.act}" data-v="${esc(v)}">${esc(l)}</div>`; }).join('') || '<div style="padding:0 8px 14px;color:#777">Nothing available</div>'}</div></div>`;
  if (m.t === 'pick') return `<div class="ov"><div class="dlg"><h6>${esc(m.title)}</h6>${m.items.map(x => `<div class="ro" data-a="${m.act}" data-v="${esc(x)}">${ic(m.sel === x ? 'r1' : 'r0', 22, '#009688')}<span>${esc(x)}</span></div>`).join('')}<div class="da"><span data-a="modal:x">CANCEL</span></div></div></div>`;
  if (m.t === 'sync') return `<div class="ov"><div class="syncd">${m.done ? `Sync Complete ${ic('okc', 22, '#fff').replace('<svg', '<svg style="vertical-align:-4px"')}<div class="ok" data-a="sync:ok">OK</div>` : `Syncing Data<div style="font-size:13px;color:#bbb;margin-top:8px">${m.step}</div><div class="bar"><i style="width:${m.pc}%"></i></div>`}</div></div>`;
  if (m.t === 'gallery') return `<div class="ov"><div class="gal"><div class="galh"><span data-a="modal:x">${ic('close', 26, '#333')}</span><b>Photos</b><i>Albums</i></div><small>Recent</small><div class="galg">${Object.keys(APP.photos).map(k => `<img data-a="img:pick" data-v="${k}" src="${APP.photos[k]}" alt="${k} session photo">`).join('')}</div></div></div>`;
  if (m.t === 'menu') return `<div class="ov" style="background:transparent" data-a="modal:x"><div class="menu" style="right:26px;top:${m.y}px"><div style="color:#148be4" data-a="noop" data-v="Edit member">Edit</div><div style="color:#d0011b" data-a="mem:remove" data-v="${m.id}">Remove</div></div></div>`;
  if (m.t === 'dp') { const d = D.p(m.month), y = d.getFullYear(), mo = d.getMonth(), n = new Date(y, mo + 1, 0).getDate(), lead = new Date(y, mo, 1).getDay(), sd = D.p(m.value);
    return `<div class="ov"><div class="dp"><div class="dph"><small>${sd.getFullYear()}</small><b>${D.W[sd.getDay()]}, ${D.M[sd.getMonth()]} ${sd.getDate()}</b></div><div class="dpm"><span data-a="dp:mon" data-v="-1">‹</span><b>${D.M[mo]} ${y}</b><span data-a="dp:mon" data-v="1">›</span></div>
      <div class="dpg">${'SMTWTFS'.split('').map(c => `<i>${c}</i>`).join('')}${'<b></b>'.repeat(lead)}${[...Array(n)].map((_, i) => { const iso = D.iso(new Date(y, mo, i + 1, 12)); return `<span class="${iso === m.value ? 'sel' : ''} ${iso === T ? 'tod' : ''}" data-a="dp:day" data-v="${iso}">${i + 1}</span>`; }).join('')}</div>
      <div class="da"><span data-a="modal:x">CANCEL</span><span data-a="dp:ok">OK</span></div></div></div>`; }
  return '';
}
const openDP = (value, done) => { S.modal = {t: 'dp', value: value || T, month: D.som(value || T), done}; };
const confirmDlg = (title, msg, yes) => { S.modal = {t: 'dlg', title, msg, btns: ['YES', 'NO'], on: i => { if (i === 0) yes(); }}; };
const alertDlg = (title, msg) => { S.modal = {t: 'dlg', title, msg, btns: ['OK'], on: () => {}}; };
function runSync() {
  const steps = ['Uploading saved data', 'Uploading saved media files', 'Downloading new data from server'];
  S.modal = {t: 'sync', step: steps[0], pc: 8};
  [1, 2, 3].forEach(i => later(() => { if (!S.modal || S.modal.t !== 'sync') return; if (i < 3) { S.modal.step = steps[i]; S.modal.pc = i * 40; } else { S.modal.done = true; S.unsynced = 0; } renderPhone(true); }, i * 650));
}

/* ================= actions ================= */
const curScr = () => S.stack.slice().reverse().find(x => x.n === 'subject') || {};
const curSubject = () => subj(curScr().id);
const elBy = uuid => { for (const g of F.pages) if (!g.core) { const e = g.formElements.find(x => x.uuid === uuid); if (e) return e; } return null; };
const FKEY = el => ({el: elBy(el.dataset.k), gi: undefined});
const leaveForm = toHome => { const dirty = F && (Object.keys(cleanObs(F.obs)).some(k => typeof F.obs[k] !== 'number') || (F.kind === 'reg' && F.subject.firstName)); const doIt = () => { if (toHome) goHome(); else { F = null; S.stack = S.stack.filter(x => x.n !== 'form' && x.n !== 'summary'); } };
  if (!dirty) return doIt();
  confirmDlg(toHome ? 'Go to home screen' : 'Go back', toHome ? 'Are you sure you want to go back to home screen? You will lose all the form changes.' : 'Are you sure you want to go back? You will lose all the form changes.', doIt); };
const ACT = {
  noop: v => toast(`${v} is not part of this practice app`),
  'login:go': () => { if (!S.login.u || !S.login.p) return toast('Enter User ID and Password'); goHome(); runSync(); },
  tab: v => { F = null; S.stack = [{n: v}]; },
  'hdr:back': () => { const t = topScr().n; if (t === 'form') { const p = stepPage(-1); if (p >= 0) { F.page = p; F.tried = -1; } else leaveForm(false); } else goBack(); },
  'hdr:home': () => { if (['form', 'summary'].includes(topScr().n)) leaveForm(true); else goHome(); },
  'hdr:search': () => go('search'),
  'hdr:sync': () => runSync(),
  'sync:ok': () => { S.modal = null; },
  card: v => { if (!cardRes[v]) cardOf(CARDU[v]); go('cards', {id: v}); },
  open: v => go('subject', {id: v}),
  stab: v => { topScr().tab = v; },
  prog: v => { topScr().prog = v; },
  exp: v => { S.exp[v] = !(S.exp[v] ?? (v.startsWith('mem'))); },
  'd:filter': () => { S.filter.tmp = [...S.filter.picked]; go('filter'); },
  'd:clear': () => { S.filter.picked = []; },
  'fl:pick': v => { const t = S.filter.tmp, i = t.indexOf(v); if (i < 0) t.push(v); else t.splice(i, 1); },
  'fl:apply': () => { S.filter.picked = S.filter.tmp; goBack(); },
  'dash:tab': v => { topScr().name = v; },
  newform: () => { S.modal = {t: 'types', title: 'Types', items: eligibleVisits(curSubject()), act: 'type'}; },
  type: v => { S.modal = null; const s = curSubject(), open = encOf(s).find(e => e.type === v && isOpen(e));
    startForm({form: formFor('Encounter', s.type, v), kind: 'enc', enc: open || {uuid: uid('E'), subjectUuid: s.uuid, enrolmentUuid: null, type: v, name: v, obs: {}}}); },
  'enrol:open': () => { S.modal = {t: 'types', title: TR('enrolInProgram'), items: eligiblePrograms(curSubject()).map(p => [p, progLabel(p), (PRN[p] || {}).colour]), act: 'enrol:pick'}; },
  'enrol:pick': v => { S.modal = null; const s = curSubject(); startForm({form: formFor('ProgramEnrolment', s.type, null, v), kind: 'enrol', enrol: {uuid: uid('N'), subjectUuid: s.uuid, program: v, obs: {}}}); },
  'pv:new': () => { const t = curScr(), s = subj(t.id), ens = enrolmentsOf(s).filter(n => !n.exitDateTime), cur = ens.find(n => n.program === t.prog) || ens[0]; go('chooseVisit', {id: s.uuid, prog: cur.program}); },
  'pv:type': v => { const t = topScr(), s = subj(t.id), n = activeEnrolment(s, t.prog); S.stack.pop(); curScr().prog = t.prog;
    startForm({form: formFor('ProgramEncounter', s.type, v, t.prog), kind: 'enc', enc: {uuid: uid('E'), subjectUuid: s.uuid, enrolmentUuid: n.uuid, type: v, name: v, obs: {}}}); },
  'visit:do': v => { const e = DB.encounters.find(x => x.uuid === v); startForm({form: formOfEnc(e), kind: 'enc', enc: e}); },
  'visit:edit': v => { const e = DB.encounters.find(x => x.uuid === v); startForm({form: formOfEnc(e), kind: 'enc', enc: e, obs: e.obs, date: e.encounterDateTime, edit: 1}); },
  'reg:edit': v => { const s = curSubject(), form = formFor('IndividualProfile', s.type), lock = editAllowed(form, s);
    if (!lock.ok) return toast(lock.msg || 'This record cannot be edited');
    startForm({form, kind: 'reg', sType: s.type, subject: s, obs: s.obs, date: s.registrationDate, edit: 1, startPage: +v + 1}); },
  'reg:void': () => { const s = curSubject(); confirmDlg('Void the registration', 'Are you sure you want to void this registration?', () => { s.voided = true; touch(); goBack(); toast('Voided'); }); },
  rtype: v => { const add = topScr().n === 'addMember' ? topScr().id : null; startForm({form: formFor('IndividualProfile', v), kind: 'reg', sType: v, addTo: add}); },
  'am:open': () => go('addMember', {id: topScr().id}),
  'am:date': () => { const t = topScr(); openDP(t.start || T, d => { t.start = d; t.err = null; }); },
  'am:search': () => { go('results', {pick: topScr().id, type: 'Participant'}); },
  'am:pick': v => { goBack(); const t = topScr(), g = subj(t.id), p = subj(v); t.member = v;
    t.err = membersOf(g).some(m => m.memberUuid === v) ? 'Member is already present in the group' : memberCheck(g, p); },
  'am:save': () => { const t = topScr(), g = subj(t.id), p = subj(t.member);
    if (t.err) return alertDlg('Validation Error', t.err);
    DB.groupSubjects.push({uuid: uid('M'), groupUuid: g.uuid, memberUuid: p.uuid, start: t.start || T, end: null}); touch(); S.last = {member: p.uuid, group: g.uuid}; goBack(); toast('New member added'); },
  'mem:menu': (v, el) => { const r = el.getBoundingClientRect(), pr = $('#phone').getBoundingClientRect(), k = pr.width / 384; S.modal = {t: 'menu', id: v, y: Math.round((r.top - pr.top) / k)}; },
  'mem:remove': v => { S.modal = null; if (!can('RemoveMember', 'Batch')) return toast('Your user cannot remove members'); confirmDlg('Are you sure you want to remove the member from group?', 'Remove member from this group', () => { const m = DB.groupSubjects.find(x => x.uuid === v); m.voided = true; touch(); toast('Member removed'); }); },
  'modal:x': () => { S.modal = null; },
  dlg: v => { const m = S.modal; S.modal = null; m.on(+v); },
  more: v => { if (v === 'Logout') confirmDlg('Logout', 'Are you sure you want to logout?', () => { S.stack = [{n: 'login'}]; S.login = {u: '', p: ''}; }); else if (v === 'Dashboards') go('dashlist'); else toast(`${v} is not part of this practice app`); },
  's:type': v => { S.search.type = v; S.search.extra = {}; }, 's:void': () => { S.search.voided = !S.search.voided; }, 's:submit': () => go('results'),
  'dp:day': v => { S.modal.value = v; }, 'dp:mon': v => { S.modal.month = D.som(D.addM(S.modal.month, +v)); }, 'dp:ok': () => { const m = S.modal; S.modal = null; m.done(m.value); },
  /* form */
  'f:vdate': () => openDP(F.date, v => { F.date = v; if (F.kind === 'reg') F.subject.registrationDate = v; }),
  'f:dob': () => openDP(F.subject.dob || D.addM(T, -12 * 25), v => { F.subject.dob = v; const m = D.months(v, T); F.core.ageUnit = m >= 12 ? 'Years' : 'Months'; F.core.age = m >= 12 ? Math.floor(m / 12) : Math.max(m, 0); }),
  'f:ageu': v => { F.core.ageUnit = v; setDobFromAge(); },
  'f:gender': v => { F.subject.gender = v; }, 'f:verified': () => { F.core.verified = !F.core.verified; },
  'f:addr': v => { const lvl = pathIds(v).length - 1, same = F.core.path[lvl] === v; F.core.path = F.core.path.slice(0, lvl); if (!same) F.core.path[lvl] = v; F.subject.village = !same && !kidsOf(v).length ? v : null; },
  'f:opt': (v, el) => { const {el: e, gi} = FKEY(el), h = holderOf(e, gi) || {}, cur = h[cname(e)];
    if (isMulti(e)) { const a = [...(cur || [])], i = a.indexOf(v); if (i < 0) a.push(v); else a.splice(i, 1); fset(e, gi, a); }
    else fset(e, gi, cur === v ? undefined : v); },
  'f:date': (v, el) => { const {el: e, gi} = FKEY(el); openDP((holderOf(e, gi) || {})[cname(e)], d => fset(e, gi, d)); },
  'f:datecl': (v, el) => { const {el: e, gi} = FKEY(el); fset(e, gi, undefined); },
  'f:all': (v, el) => { const {el: e} = FKEY(el), all = subjectChoices(e).map(c => c.uuid), cur = F.obs[cname(e)] || []; fset(e, undefined, cur.length === all.length ? [] : all); },
  'f:img': (v, el) => { S.modal = {t: 'gallery', k: el.dataset.k}; },
  'img:pick': v => { const e = elBy(S.modal.k); S.modal = null; fset(e, undefined, v); },
  'f:imgcl': (v, el) => { fset(FKEY(el).el, undefined, undefined); },
  'f:prev': () => { if (topScr().n === 'summary') { goBack(); return; } F.page = stepPage(-1); F.tried = -1; F.formErrs = []; },
  'f:next': () => {
    F.tried = F.page; F.formErrs = []; evaluate(F);
    const g = F.pages[F.page];
    const bad = g.core ? (isPerson(F.subject) ? ['first', 'last', 'dob', 'gender', 'village'] : ['name', 'village']).some(k => coreErr(k).length) : itemsOf(F.page).some(it => errsOf(it.el).length);
    if (bad) return;
    const n = stepPage(1);
    if (n < F.pages.length) { F.page = n; F.tried = -1; return 'nav'; }
    F.tried = -1; go('summary');
  },
  'f:save': () => commit()
};
function setDobFromAge() { const n = parseInt(F.core.age, 10); if (!Number.isNaN(n) && n >= 0) F.subject.dob = F.core.ageUnit === 'Years' ? D.addM(T, -12 * n) : D.addM(T, -n); }

/* ================= render + events ================= */
let lastSig = '';
const sig = () => S.stack.length + '|' + topScr().n + '|' + (topScr().id || '') + '|' + (topScr().tab || '') + '|' + (topScr().prog || '') + '|' + (F ? F.page : '');
function bottomTabs() { const d = dashboardsFor(); return [['home', 'home', 'Home'], ...(d.secondary ? [['dash2', 'dash', d.secondary.name]] : []), ['register', 'addbox', 'Register'], ['more', 'menu', 'More']]; }
function renderPhone(keep) {
  const t = topScr(), v = SCREENS[t.n](t), ph = $('#phone'), sc = $('#scr'), st = sc ? sc.scrollTop : 0, s2 = sig();
  const ae = document.activeElement, foc = ae && ae.dataset && ae.dataset.in ? {i: ae.dataset.in, k: ae.dataset.k || '', g: ae.dataset.g || '', a: ae.selectionStart, b: ae.selectionEnd} : null;
  const now = new Date();
  ph.innerHTML = `<div class="sb"><span>${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}</span><span class="sbi">▾ ◢ <span class="bat">80</span></span></div>` +
    (v.noHdr ? '' : `<div class="hd">${v.back ? `<div class="hb" data-a="hdr:back">${ic('back', 34, '#fff')}</div>` : ''}<div class="ttl">${esc(v.title)}</div>${(v.right || []).map(r => `<div class="hb hi" data-a="hdr:${r}">${ic(r, 31, '#fff')}${r === 'sync' && S.unsynced ? `<i class="sbadge">${S.unsynced}</i>` : ''}</div>`).join('')}</div>`) +
    `<div class="scr ${v.cls || ''}" id="scr">${v.body}</div>` + (v.foot || '') +
    (v.tabs ? `<div class="tabs">${bottomTabs().map(([k, i, n]) => `<div class="tab ${v.tabs === k ? 'on' : ''}" data-a="tab" data-v="${k}">${ic(i, 31)}<span>${esc(n)}</span></div>`).join('')}</div>` : '') +
    `<div class="nav"><i class="n1"></i><i class="n2"></i><i class="n3"></i></div>` + modalHTML() + (S.toast ? `<div class="toast" data-t="${S.toast.id}">${esc(S.toast.m)}</div>` : '') + `<div id="hint"></div>`;
  if (window.__appWords) AppLang.collect(ph, window.__appWords);
  AppLang.apply(ph);                                  // the phone speaks the language picked in the guide
  if (keep !== false && s2 === lastSig) $('#scr').scrollTop = st;
  lastSig = s2;
  if (foc) { const el = $$('#phone [data-in]').find(e => e.dataset.in === foc.i && (e.dataset.k || '') === foc.k && (e.dataset.g || '') === foc.g); if (el) { el.focus({preventScroll: true}); try { el.setSelectionRange(foc.a, foc.b); } catch (e) {} } }
  if (S.toast) { const id = S.toast.id; later(() => { if (S.toast && S.toast.id === id) { S.toast = null; const el = $('.toast'); if (el) el.remove(); } }, 2600); }
  if (typeof Track !== 'undefined') Track.screen(t.n);
  if (typeof Guide !== 'undefined') Guide.sync();
}
function doAction(el) {
  const a = el.dataset.a; if (!ACT[a]) return;
  ACT[a](el.dataset.v, el);
  renderPhone();
  if (typeof Guide !== 'undefined') Guide.after(a, el.dataset.v);
}
function bindPhone() {
  const ph = $('#phone');
  ph.addEventListener('click', e => {
    const el = e.target.closest('[data-a]'); if (!el || !ph.contains(el)) return;
    if (!Guide.allow(el)) { Guide.nudge(); return; }
    doAction(el);
  });
  ph.addEventListener('focusin', e => { if (e.target.dataset && e.target.dataset.in && !Guide.allow(e.target)) { e.target.blur(); Guide.nudge(); } });
  ph.addEventListener('input', e => {
    const el = e.target, k = el.dataset.in; if (!k) return;
    if (k === 'f') { const {el: fe, gi} = FKEY(el); fset(fe, gi, el.value); }
    else if (k === 'sx') S.search.extra[el.dataset.k] = el.value;
    else if (k === 'core') { if (el.dataset.k === 'age') { F.core.age = el.value; setDobFromAge(); } else F.subject[el.dataset.k] = el.value; }
    else if (k === 'stext') S.search.text = el.value;
    else if (k === 'login') S.login[el.dataset.k] = el.value;
    Guide.typed();
    if (k !== 'stext' && k !== 'login' && k !== 'sx') renderPhone(); else Guide.sync();
  });
  ph.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.in) { e.target.blur(); Guide.typed(true); } });
}
