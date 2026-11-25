'use strict';
/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const isEmpty = v => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
const QS = new URLSearchParams(location.search);
const SELFTEST = QS.has('selftest') || QS.has('qa');

/* ---------- icons (Material paths, 24x24) ---------- */
const IC = {
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  sync: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  chev: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  dash: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  addbox: 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',
  r0: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
  r1: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
  c0: 'M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
  c1: 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  next: 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z',
  prev: 'M6 6h2v12H6zm3.5 6l8.5 6V6z',
  bksp: 'M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z',
  down: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
  up: 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  dots: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  place: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z',
  user: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22z',
  cam: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
  folder: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
  video: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
  okc: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  logout: 'M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
  hist: 'M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',
  list: 'M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z',
  face: 'M9 11.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm6 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37a9.974 9.974 0 0 0 10.41 3.97c.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z',
  arrd: 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z',
  key: 'M12.65 10A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  prog: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V5h14v14zM7 7h2v6H7zm4 0h2v9h-2zm4 0h2v4h-2z',
  sort: 'M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z',
  filterx: 'M14.76 20.83L17.6 18l-2.84-2.83 1.41-1.41L19 16.57l2.83-2.81 1.41 1.41L20.43 18l2.81 2.83-1.41 1.41L19 19.4l-2.83 2.84-1.41-1.41M12 12v7.88c.04.3-.06.62-.29.83a.996.996 0 0 1-1.41 0L8.29 18.7a.989.989 0 0 1-.29-.83V12h-.03L2.21 4.62a1 1 0 0 1 .17-1.4c.19-.14.4-.22.62-.22h14c.22 0 .43.08.62.22a1 1 0 0 1 .17 1.4L12.03 12H12z',
  minus: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z',
  plus: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',
  profile: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  photo: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  group: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'
};
const ic = (n, s = 24, c = 'currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" aria-hidden="true"><path d="${IC[n]}"/></svg>`;

/* ---------- dates (ISO strings, local) ---------- */
const D = {
  p: iso => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d, 12); },
  iso: dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`,
  add: (iso, n) => { const d = D.p(iso); d.setDate(d.getDate() + n); return D.iso(d); },
  addM: (iso, n) => { const d = D.p(iso); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return D.iso(d); },
  som: iso => iso.slice(0, 8) + '01',
  eom: iso => { const d = D.p(iso); return D.iso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12)); },
  dow: iso => D.p(iso).getDay(),
  M: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  W: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  dmy: iso => iso ? iso.split('-').reverse().join('-') : '',
  long: iso => { const d = D.p(iso); return `${String(d.getDate()).padStart(2, '0')} ${D.M[d.getMonth()]} ${d.getFullYear()}`; },
  obs: iso => { const d = D.p(iso); return `${D.M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; },
  wk: iso => { const d = D.p(iso); return `${D.W[d.getDay()]} ${d.getDate()} ${D.M[d.getMonth()]}`; },
  months: (a, b) => { const x = D.p(a), y = D.p(b); let m = (y.getFullYear() - x.getFullYear()) * 12 + y.getMonth() - x.getMonth(); if (y.getDate() < x.getDate()) m--; return m; }
};
// Practice "today". ?date=YYYY-MM-DD moves the page (and the rules' clock) to another day.
const TODAY_REAL = D.iso(new Date());
let T = /^\d{4}-\d\d-\d\d$/.test(QS.get('date') || '') ? QS.get('date') : TODAY_REAL;
if (T !== TODAY_REAL) (() => {                          // the rules read the date through moment(); move the clock for them too
  const Real = Date, offset = D.p(T).getTime() - D.p(TODAY_REAL).getTime();
  class FixedNow extends Real { constructor(...a) { if (a.length) super(...a); else super(Real.now() + offset); } static now() { return Real.now() + offset; } }
  window.Date = FixedNow;
})();

/* ---------- practice users (made-up names) ----------
   coach: the login used in the demo video, which may do everything (Avni's Administrators group: all privileges).
   staff and manager: the bundle's own user groups, with exactly the privileges set for them in UAT. */
const ROLES = {
  coach: {name: 'Asha Rao', login: 'asha@maitrayana_demo', groups: ['Everyone', 'Admin (Pooja & Corina)'], all: true, role: ['Coach (demo login)']},
  staff: {name: 'Meera Iyer', login: 'meera@maitrayana_demo', groups: ['Everyone', 'Staff in their own cities'], role: ['City staff']},
  manager: {name: 'Nandini Hegde', login: 'nandini@maitrayana_demo', groups: ['Everyone', 'Managers'], role: ['Manager']}
};
let ROLE = 'coach', USER = ROLES.coach;
const setRole = r => { ROLE = r; USER = ROLES[r]; };

/* ---------- database (Avni's shape: subjects, programme enrolments, encounters, group members) ---------- */
let DB, UID = 0;
const uid = p => p + '-' + (++UID);
const subj = id => DB.subjects.find(s => s.uuid === id);
const isPerson = s => s && s.type === 'Participant';
const fullName = s => !s ? '' : isPerson(s) ? `${s.firstName} ${s.lastName}`.trim() : s.firstName;
const initials = s => fullName(s).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const ageYears = (dob, asOf = T) => Math.floor(D.months(dob, asOf) / 12);
const ageText = s => { const m = D.months(s.dob, T); return m >= 12 ? `${Math.floor(m / 12)} ${m >= 24 ? 'Years' : 'Year'}` : `${m} ${m === 1 ? 'Month' : 'Months'}`; };
const villageName = s => s && s.village ? pathOf(s.village).join(', ') : '';                     // "Karnataka, Banglore", as the phone shows it
const encOf = s => DB.encounters.filter(e => e.subjectUuid === s.uuid && !e.voided && !e.enrolmentUuid);    // common (general) sessions
const progEncOf = n => DB.encounters.filter(e => e.enrolmentUuid === n.uuid && !e.voided);
const enrolmentsOf = s => DB.enrolments.filter(n => n.subjectUuid === s.uuid && !n.voided);
const activeEnrolment = (s, program) => enrolmentsOf(s).find(n => n.program === program && !n.exitDateTime);
const membersOf = g => DB.groupSubjects.filter(m => m.groupUuid === g.uuid && !m.voided);
const groupsOf = p => DB.groupSubjects.filter(m => m.memberUuid === p.uuid && !m.voided).map(m => subj(m.groupUuid)).filter(Boolean);
const vstat = (e, asOn = T) => e.encounterDateTime ? 'done' : e.cancelDateTime ? 'cancelled' : asOn > e.maxVisitDateTime ? 'overdue' : asOn >= e.earliestVisitDateTime ? 'due' : 'future';

/* The session forms all have the same shape: what was covered, a photo, who came, and two counts the app works out. */
const sessionParts = form => { const els = pagesOf(form).flatMap(topElements), dt = el => cdef(el).dataType;
  return {topic: els.find(el => dt(el) === 'Coded'), photo: els.find(el => dt(el) === 'Image'), who: els.find(el => dt(el) === 'Subject'), nums: els.filter(el => dt(el) === 'Numeric')}; };
function sessionObs(form, topic, photo, present, total) {
  const p = sessionParts(form), o = {};
  o[cname(p.topic)] = topic || answersOf(p.topic)[0]; o[cname(p.photo)] = photo; o[cname(p.who)] = present;
  if (p.nums[0]) o[cname(p.nums[0])] = present.length; if (p.nums[1]) o[cname(p.nums[1])] = total - present.length;
  return o;
}
const PROGRAMS = {nirman: 'A_Nirman', pragati: 'B_Pragati', akanksha: 'C_Akanksha', vriddhi: 'D_Vriddhi', siddhi: 'E_Siddhi'};

function seed() {
  UID = 0;
  const S = [], E = [], M = [], N = [];
  DB = {subjects: S, encounters: E, groupSubjects: M, enrolments: N};
  const BLR = locBy('Banglore').uuid, by = 'Asha Rao';
  const site = (name, type, address, person, phone, ago) => { const s = {uuid: uid('X'), type: 'Site', firstName: name, registrationDate: D.add(T, -ago), village: BLR, by,
    obs: Object.assign({'Type of Site': type, Address: address}, type === 'School' ? {"Point of contact's name": person, "Point of contact's Number": phone} : {'Coach Name': person, "Coach's number": phone})}; S.push(s); return s; };
  const batch = (name, st, donor, ago) => { const g = {uuid: uid('G'), type: 'Batch', firstName: name, registrationDate: D.add(T, -ago), village: BLR, by, obs: {'Site Name': st.uuid, 'Donor Name': donor}}; S.push(g); return g; };
  const girl = (g, first, last, age, school, ago, extra) => { const n = S.length, D4 = 'No difficulty';
    const p = {uuid: uid('P'), type: 'Participant', firstName: first, lastName: last, gender: 'Female', dob: D.add(D.addM(T, -12 * age), -50 - n * 7), registrationDate: D.add(T, -ago), village: BLR, by,
      obs: Object.assign({'Mobile number': String(9845010000 + n * 137), 'Has the participant been registered before?': 'No', 'Are you attending education currently?': ['School'], 'Name of the school/college/institute': school, 'Grade/Course': String(age - 6),
        'What are you currently doing?': 'Not working', 'Marital Status': 'Unmarried', 'Who do you live with?': 'Both parents', Address: 'Bengaluru', 'Emergency contact no': String(9845090000 + n * 211),
        'Do you have any medical conditions?': 'No', 'Do you have any allergies?': 'No', 'Is there a medication that you are currently taking?': 'No', 'Is there anything you CANNOT eat due to medical, religious, or personal reasons?': 'No',
        'Do you have difficulty seeing, even if wearing glasses?': D4, 'Do you have difficulty hearing, even if wearing a hearing aid?': D4, 'Do you have difficulty walking or climbing steps?': D4, 'Do you have difficulty remembering or concentrating?': D4,
        'Do you have difficulty with self-care, such as washing all over or getting dressed?': D4, 'Using usual language, do you have difficulty communicating, such as understanding or being understood?': D4}, extra || {})};
    S.push(p); M.push({uuid: uid('M'), groupUuid: g.uuid, memberUuid: p.uuid, start: p.registrationDate, end: null}); return p; };
  const enrol = (g, key, ago) => { const n = {uuid: uid('N'), subjectUuid: g.uuid, program: PROGRAMS[key], enrolmentDateTime: D.add(T, -ago), exitDateTime: null, obs: {}, by}; N.push(n); return n; };
  // one saved session: a programme session when key is given, a common session otherwise
  const session = (g, key, type, ago, topic, photo, absent) => { const n = key && activeEnrolment(g, PROGRAMS[key]), ms = membersOf(g).map(m => m.memberUuid), present = ms.filter((_, i) => !(absent || []).includes(i));
    const form = n ? formFor('ProgramEncounter', 'Batch', type, n.program) : formFor('Encounter', 'Batch', type);
    E.push({uuid: uid('E'), subjectUuid: g.uuid, enrolmentUuid: n ? n.uuid : null, type, name: type, encounterDateTime: D.add(T, -ago), earliestVisitDateTime: null, maxVisitDateTime: null, cancelDateTime: null,
      obs: sessionObs(form, topic, photo, present, ms.length), cancelObs: {}, by}); };

  const s1 = site('Indiranagar Government School', 'School', '100 Feet Road, Indiranagar, Bengaluru', 'Shobha Murthy', 9845011220, 20);
  const s2 = site('Koramangala Community Centre', 'Community', '6th Block, Koramangala, Bengaluru', 'Rekha D', 9845022331, 18);
  const s3 = site('RT Nagar High School', 'School', 'RT Nagar Main Road, Bengaluru', 'Vanitha Kumar', 9845033442, 15);
  const b1 = batch('Indiranagar Girls Batch', s1, 'Women Win', 14);
  [['Divya', 'Gowda', 14], ['Meghana', 'Shetty', 15], ['Sahana', 'Naik', 13], ['Bhoomika', 'Hegde', 16]].forEach(([f, l, a]) => girl(b1, f, l, a, 'Indiranagar Government School', 14));
  const b2 = batch('Koramangala Girls Batch', s2, 'Decathlon', 12);
  [['Lavanya', 'Murthy', 15], ['Chaitra', 'Rao', 14], ['Deepika', 'Nair', 16]].forEach(([f, l, a]) => girl(b2, f, l, a, 'Government High School, Koramangala', 12));
  const b3 = batch('RT Nagar Girls Batch', s3, 'Maitrayana', 9);
  [['Rakshita', 'Patil', 17], ['Sneha', 'Kulkarni', 18], ['Pallavi', 'Das', 17]].forEach(([f, l, a]) => girl(b3, f, l, a, 'RT Nagar High School', 9, {'Are you attending education currently?': ['Junior college/PUC'], 'Grade/Course': '1st PUC'}));
  enrol(b1, 'nirman', 13); enrol(b1, 'akanksha', 10); enrol(b2, 'pragati', 11); enrol(b2, 'vriddhi', 9); enrol(b3, 'siddhi', 8);
  session(b1, 'nirman', 'Nirman Netball Session Attendance', 9, 'Catching', 'netball');
  session(b1, 'nirman', 'Nirman Netball Session Attendance', 2, 'Chest Pass', 'netball', [2]);
  session(b1, 'nirman', 'Nirman Lifeskill Session Attendance', 6, null, 'lifeskill');
  session(b1, 'akanksha', 'Akanksha Session Attendance', 1, null, 'lifeskill', [0]);
  session(b2, 'pragati', 'Pragati Netball Session Attendance', 5, null, 'netball');
  session(b2, 'pragati', 'Pragati Lifeskill Session Attendance', 2, null, 'lifeskill', [1]);
  session(b2, 'vriddhi', 'Vriddhi session attendance', 7, null, 'lifeskill');
  session(b3, 'siddhi', 'Siddhi Session Attendance', 1, 'Career Guidance', 'general');
  session(b3, null, 'General Session Attendance', 8, 'Baseline', 'general');
  session(b3, null, 'Community Hub Attendance', 2, 'Volunteer session', 'hub', [2]);
  DB.base = {s1, s2, s3, b1, b2, b3};
  DB.demo = {};
  DB.make = {site, batch, girl, enrol, session};
  touch();
}
/* The demo video's own records, added as far as a lesson needs them:
   1 site, 2 batch, 3 three participants, 4 Nirman enrolment, 5 all five programmes, 6 one session of each kind. */
function addDemo(level) {
  const m = DB.make, d = DB.demo;
  if (level >= 1) d.site = m.site('Shivajinagar Community Hall', 'Community', 'Near Shivajinagar Bus Stand, Bengaluru', 'Lakshmi N', 9845012345, 0);
  if (level >= 2) d.batch = m.batch('Shivajinagar Girls Batch', d.site, 'Women Win', 0);
  if (level >= 3) { const sch = 'Govt Girls High School, Shivajinagar';
    d.priya = m.girl(d.batch, 'Priya', 'Sharma', 15, sch, 0, {'Who do you live with?': 'Mother only', Address: 'Shivajinagar, Bengaluru', 'Do you have any allergies?': 'Yes', 'If yes, list the allergies and explain': 'Dust allergy, sneezing during outdoor sessions'});
    d.kavya = m.girl(d.batch, 'Kavya', 'Reddy', 14, sch, 0, {Address: 'Shivajinagar, Bengaluru'});
    d.anitha = m.girl(d.batch, 'Anitha', 'Kumar', 16, sch, 0, {Address: 'Shivajinagar, Bengaluru'}); }
  if (level >= 4) m.enrol(d.batch, 'nirman', 0);
  if (level >= 5) ['akanksha', 'pragati', 'vriddhi', 'siddhi'].forEach(k => m.enrol(d.batch, k, 0));
  if (level >= 6) { const b = d.batch;
    m.session(b, 'nirman', 'Nirman Netball Session Attendance', 0, 'Shooting', 'netball', [2]); m.session(b, 'nirman', 'Nirman Lifeskill Session Attendance', 0, null, 'lifeskill');
    m.session(b, 'akanksha', 'Akanksha Session Attendance', 0, 'My Vision', 'lifeskill'); m.session(b, 'pragati', 'Pragati Netball Session Attendance', 0, null, 'netball');
    m.session(b, 'vriddhi', 'Vriddhi session attendance', 0, null, 'lifeskill', [2]); m.session(b, 'siddhi', 'Siddhi Session Attendance', 0, 'Career Guidance', 'general');
    m.session(b, null, 'General Session Attendance', 0, 'Baseline', 'general'); m.session(b, null, 'Community Hub Attendance', 0, 'Celebration', 'hub', [2]); }
  touch();
}
