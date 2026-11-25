'use strict';
/* Lessons. They follow Maitrayana's demo video: a new site, a batch, its participants, the five programmes and every kind of session.
   App labels are written as the phone shows them. */
const CARD = n => (BUNDLE.reportCard.find(c => c.name === n && !c.voided) || {}).uuid;
const byName = name => () => (DB.subjects.find(s => fullName(s) === name) || {}).uuid;
const BATCH = () => DB.demo.batch.uuid;
const tap = (s, a, v, t, why) => ({k: 'tap', s, a, v, t, why});
const info = (s, sel, t, why) => ({k: 'info', s, sel, t, why});
const typ = (s, sel, value, test, t, why) => ({k: 'type', s, sel, val: value, test, t, why});
const form = (s, demo, notes, core, sum, x) => Object.assign({k: 'form', s, demo: demo || {}, notes: notes || {}, core, sum}, x || {});
// start a lesson with the video's records made up to a level (see addDemo in core.js), on the batch or on Home
const onBatch = (level, tab, prog) => () => { addDemo(level); S.stack = [{n: 'home'}, {n: 'subject', id: BATCH(), tab: tab || 'profile', prog: prog && PROGRAMS[prog]}]; };
const withDemo = level => () => { addDemo(level); };
const GIRLS = ['Priya Sharma', 'Kavya Reddy', 'Anitha Kumar'];
const lastSession = type => DB.encounters.filter(e => e.subjectUuid === BATCH() && e.type === type).pop();

const GROUPS = [['start', 'Start here'], ['setup', 'Set up: site, batch, participants'], ['prog', 'Programmes and session attendance'], ['common', 'Common sessions'], ['review', 'See your work'], ['stops', 'Checks and roles']];

/* One session-attendance lesson. Every session form has the same four parts, so the lessons share their steps. */
function sessLesson(o) {
  const prog = o.prog && PROGRAMS[o.prog], f = prog ? formFor('ProgramEncounter', 'Batch', o.type, prog) : formFor('Encounter', 'Batch', o.type), p = sessionParts(f);
  const who = o.present || GIRLS, away = GIRLS.filter(n => !who.includes(n)), K = el => cname(el);
  const demo = {[K(p.topic)]: o.topic, [K(p.photo)]: o.photo, [K(p.who)]: who};
  const notes = {[K(p.topic)]: o.topicNote, [K(p.photo)]: 'The photo is saved with the session. It goes to the server at the next Sync.', [K(p.who)]: 'The list is this batch\'s own participants. Leave a girl unticked if she did not come.'};
  const open = prog ? [tap(0, 'pv:new', undefined, 'Tap **Session Attendance**.', o.openWhy), tap(0, 'pv:type', o.type, `Tap **${o.type}**.`)]
    : [tap(0, 'newform', undefined, 'Tap **New Form**.', o.openWhy), tap(0, 'type', o.type, `Tap **${o.type}**.`)];
  return {id: o.id, g: o.g, e: o.e, t: o.t, d: o.d, setup: onBatch(o.level || 5, prog ? 'programs' : 'general', o.prog),
    flow: [[prog ? 'Session Attendance, choose the form' : 'New Form, choose the form'], ['What was covered'], ['Photo of the session'], ['Tick who came'], ['The app counts present and not present', 1], ['Check and Save']],
    steps: [...(o.intro ? [info(0, o.introSel || '.plist', o.intro)] : []), ...open,
      form(1, demo, notes, null, 'The summary shows the session, the photo and who came. Tap **Save**.',
        {stageFn: () => isEmpty(F.obs[K(p.topic)]) ? 1 : isEmpty(F.obs[K(p.photo)]) ? 2 : 3, pageDone: `The app counted by itself: **${who.length}** present, **${away.length}** not present.`}),
      info(5, '[data-enc]', o.after)],
    take: o.take,
    check: () => { const e = lastSession(o.type); return (e && e.encounterDateTime === T && e.obs[K(p.nums[0])] === who.length && e.obs[K(p.nums[1])] === away.length && e.obs[K(p.photo)] === o.photo) || 'session not saved with the right counts'; }};
}

const PRIYA = {'Mobile number': '9845011665', 'Has the participant been registered before?': 'No', 'Are you attending education currently?': ['School'], 'Name of the school/college/institute': 'Govt Girls High School, Shivajinagar', 'Grade/Course': '9',
  'What are you currently doing?': 'Not working', 'Marital Status': 'Unmarried', 'Who do you live with?': 'Mother only', Address: 'Shivajinagar, Bengaluru', 'Emergency contact no': '9845098450',
  'Do you have any medical conditions?': 'No', 'Do you have any allergies?': 'Yes', 'If yes, list the allergies and explain': 'Dust allergy, sneezing during outdoor sessions', 'Is there a medication that you are currently taking?': 'No',
  'Is there anything you CANNOT eat due to medical, religious, or personal reasons?': 'No', 'Do you have difficulty seeing, even if wearing glasses?': 'No difficulty', 'Do you have difficulty hearing, even if wearing a hearing aid?': 'No difficulty',
  'Do you have difficulty walking or climbing steps?': 'No difficulty', 'Do you have difficulty remembering or concentrating?': 'No difficulty', 'Do you have difficulty with self-care, such as washing all over or getting dressed?': 'No difficulty',
  'Using usual language, do you have difficulty communicating, such as understanding or being understood?': 'No difficulty'};
const enrolSteps = (s, key, name, first) => [
  tap(s, 'enrol:open', undefined, first ? 'Tap **+ Enrol in Program**.' : `Tap **+ Enrol in Program** again, for **${name}**.`),
  tap(s, 'enrol:pick', PROGRAMS[key], `Tap **${name}**.`, first ? 'Only the programmes this batch can still join are listed.' : null),
  form(s, {}, {}, null, `Check the batch and the date, then tap **Save**.`)];

const LESSONS = [
  /* ---------------- start ---------------- */
  {id: 'login', g: 'start', e: '🔑', t: 'Log in and Sync', d: 'Log in once, then Sync before and after your sessions.',
    setup: () => { S.stack = [{n: 'login'}]; },
    flow: [['Log in with your user ID'], ['The app downloads your sites, batches and forms', 1], ['Home opens'], ['Sync after your work']],
    steps: [
      typ(0, '[data-in="login"][data-k="u"]', 'asha@maitrayana_demo', () => S.login.u.length >= 3, 'Type your **User ID**. Example: **asha@maitrayana_demo**', 'Your admin gives you the user ID. It ends with the name of the organisation.'),
      typ(0, '[data-in="login"][data-k="p"]', 'demo1234', () => S.login.p.length >= 3, 'Type your **Password**.'),
      tap(0, 'login:go', undefined, 'Tap **LOGIN**.'),
      tap(1, 'sync:ok', undefined, 'The app is bringing your data. When you see **Sync Complete**, tap **OK**.', 'The first sync needs internet and can take a few minutes on a slow network.'),
      info(2, '[data-sec="h0"]', 'This is your **Home**. Each coloured box is a **card**. The big number tells how many records are behind it.'),
      tap(3, 'hdr:sync', undefined, 'Tap **Sync** (the two round arrows, top right).', 'Sync sends your saved sessions and photos to the server and brings new work.'),
      tap(3, 'sync:ok', undefined, 'Wait for **Sync Complete**, then tap **OK**.')
    ],
    take: ['The app works without internet. Only Sync needs internet.', 'Sync before you leave for a session and again after it.']},

  {id: 'home', g: 'start', e: '🏠', t: 'Read Home and Total', d: 'Recent work on Home, all-time numbers on Total, and the filter.',
    flow: [['Home: recent registrations'], ['Home: recent sessions, programme by programme'], ['Open a card'], ['Total: all-time numbers'], ['Filter by record type']],
    steps: [
      info(0, '[data-sec="h0"]', '**Registrations** counts the batches, participants and sites registered **today**.'),
      info(1, '[data-sec="h1"]', 'Below, every programme has its own section and colour: **Nirman**, **Akanksha**, **Pragati**, **Vriddhi**, **Siddhi**, then **General and Community**. Each card counts the batches with a session of that kind in the last 3 days.'),
      tap(2, 'card', CARD('Recent Nirman Netball Session Attendance'), 'Tap the **Recent Nirman Netball Session Attendance** card.'),
      info(2, '.row', 'This batch had a Nirman netball session in the last 3 days. Tap a row to open the batch.'),
      tap(2, 'hdr:home', undefined, 'Tap **Home** (top right) to go back.', 'The Home icon works from every screen.'),
      tap(3, 'tab', 'dash2', 'Tap **Total** at the bottom.'),
      info(3, '[data-sec="s0"]', '**Total** shows the all-time numbers: every batch, participant and site, and the batches with sessions in each programme.'),
      tap(4, 'd:filter', undefined, 'Tap **FILTER**.'),
      tap(4, 'fl:pick', 'Batch', 'Tick **Batch**.'),
      tap(4, 'fl:apply', undefined, 'Tap **Apply**.'),
      info(4, '.afl', 'The grey box shows the filter: **Subject Type - Batch**. The cards now count batches only. The small icon removes the filter.')
    ],
    take: ['**Home** is what happened recently. **Total** is everything so far.', 'A card with 0 means nothing of that kind was recorded in its period.']},

  {id: 'search', g: 'start', e: '🔍', t: 'Find a participant', d: 'Search by name and open her page.',
    flow: [['Tap Search'], ['Choose the type and type a name'], ['Open the participant'], ['Read her page']],
    steps: [
      tap(0, 'hdr:search', undefined, 'Tap the **Search** icon (magnifying glass) at the top.'),
      tap(1, 's:type', 'Participant', 'Under **Choose type**, tap **Participant**.', 'Choose Batch or Site to find those instead.'),
      typ(1, '[data-in="stext"]', 'Divya', () => S.search.text.trim().length >= 3, 'Type the name. Example: **Divya**', 'A part of the name, the school or the phone number also works.'),
      tap(1, 's:submit', undefined, 'Tap **Submit**.'),
      tap(2, 'open', byName('Divya Gowda'), 'Tap **Divya Gowda** in the results.'),
      info(3, '.ph', 'This is her page: name, age and address at the top. The chip below is the batch she belongs to.'),
      tap(3, 'exp', () => 'reg' + byName('Divya Gowda')(), 'Tap the small arrow in **Registration Details**.'),
      info(3, '.obs', 'Her registration answers, section by section: contact, education, career, background, health and functional difficulty.')
    ],
    take: ['Search before registering, so nobody is entered twice.']},

  /* ---------------- set up ---------------- */
  {id: 'site', g: 'setup', e: '🏫', t: 'Register a site', d: 'School or Community: the app asks for the right contact.',
    flow: [['Register tab, Site'], ['Site name and address'], ['Type of site'], ['The matching contact is asked', 1], ['Check and Save']],
    steps: [
      tap(0, 'tab', 'register', 'Tap **Register** at the bottom.', 'Register lists the three kinds of record: Batch, Participant and Site.'),
      tap(0, 'rtype', 'Site', 'Tap **Site**.'),
      form(1, {'Type of Site': 'Community', Address: 'Near Shivajinagar Bus Stand, Bengaluru', 'Coach Name': 'Lakshmi N', "Coach's number": '9845012345'},
        {'core:name': 'Write the name people use for the place.', 'core:village': 'The address is picked from a list, never typed: first the State, then the Region.', 'Type of Site': 'Community asks for the site coach. School asks for the school\'s point of contact instead.', "Coach's number": 'Exactly 10 digits.'},
        {name: 'Shivajinagar Community Hall'}, null, {stages: [1, 2]}),
      info(4, '.ph', 'The site is saved. It can now be chosen when a batch is created.')
    ],
    take: ['One site can have many batches.', 'School or Community decides which contact the app asks for.'],
    check: () => DB.subjects.some(s => s.type === 'Site' && s.firstName === 'Shivajinagar Community Hall' && s.obs['Coach Name'] === 'Lakshmi N' && !s.obs["Point of contact's name"]) || 'site not saved'},

  {id: 'batch', g: 'setup', e: '👥', t: 'Create a batch', d: 'Name, address, its site and the donor.', setup: withDemo(1),
    flow: [['Register tab, Batch'], ['Batch name and address'], ['Link the site'], ['Choose the donor'], ['Check and Save']],
    steps: [
      tap(0, 'tab', 'register', 'Tap **Register**.'),
      tap(0, 'rtype', 'Batch', 'Tap **Batch**.'),
      form(1, {'Site Name': 'Shivajinagar Community Hall', 'Donor Name': 'Women Win'},
        {'core:name': 'A name that tells the place and the group.', 'Site Name': 'Every registered site is listed. The batch stays linked to the one you pick.', 'Donor Name': 'One donor from Maitrayana\'s fixed list.'},
        {name: 'Shivajinagar Girls Batch'}, null, {stages: [1, 3]}),
      info(4, '[data-mem]', 'The batch is saved and its page opens. **Participants (0)**: next, add the girls.')
    ],
    take: ['A batch belongs to one site and one donor.', 'Participants and programmes are added from the batch\'s own page.'],
    check: () => DB.subjects.some(s => s.type === 'Batch' && s.firstName === 'Shivajinagar Girls Batch' && s.obs['Site Name'] === DB.demo.site.uuid && s.obs['Donor Name'] === 'Women Win') || 'batch not saved'},

  {id: 'participant', g: 'setup', e: '➕', t: 'Add a participant', d: 'Register a girl straight from her batch.', setup: onBatch(2),
    flow: [['Open the batch'], ['Add participant, Register new Participant'], ['Name, age, address'], ['Contact and earlier registration'], ['Education and work'], ['Family and emergency contact'], ['Health'], ['Functional difficulty'], ['Save: she is in the batch', 1]],
    steps: [
      info(0, '[data-mem]', 'This is **Shivajinagar Girls Batch**. It has no participants yet.'),
      tap(1, 'am:open', undefined, 'Tap **Add participant**.'),
      tap(1, 'rtype', 'Participant', 'Tap **Register new Participant**.', 'Use **Search existing Participant** for a girl who is already registered.'),
      form(2, PRIYA,
        {'core:dob': 'Type the age if she does not know her date of birth.', 'Has the participant been registered before?': 'Yes would ask for the year and the earlier site.', 'Are you attending education currently?': 'Anything other than No asks for the institute and the grade or course.',
          'Who do you live with?': 'Other asks you to write who.', 'Do you have any allergies?': 'Yes opens a box to list them. The other health questions work the same way.', 'If yes, list the allergies and explain': 'Write what a coach should know during a session.'},
        {first: 'Priya', last: 'Sharma', age: 15, gender: 'Female'}, 'Everything is on one screen. Check it, then tap **Save**.', {stages: [2, 3, 3, 4, 4, 5, 6, 7]}),
      info(8, '[data-mem]', '**Participants (1)**: Priya is already a member. You did not add her to the batch separately, because the registration started from the batch.')
    ],
    take: ['Register participants from the batch, so they become members at once.', 'Questions marked * must be answered.', 'Some questions appear only after an answer, such as the allergy details.'],
    check: () => { const p = DB.subjects.find(s => s.firstName === 'Priya' && s.lastName === 'Sharma'); return (p && membersOf(DB.demo.batch).some(m => m.memberUuid === p.uuid) && ageYears(p.dob) === 15 && p.obs['If yes, list the allergies and explain'] && !p.obs['Registration year']) || 'Priya not saved as a member'; }},

  {id: 'existing', g: 'setup', e: '🔁', t: 'Add a girl already registered', d: 'Search her instead of registering her twice.', setup: onBatch(3),
    flow: [['Open the batch'], ['Add participant'], ['Search existing Participant'], ['Save']],
    steps: [
      info(0, '[data-mem]', 'The batch has three participants. **Divya Gowda** is already registered in another batch and joins this one too.'),
      tap(1, 'am:open', undefined, 'Tap **Add participant**.'),
      tap(2, 'am:search', undefined, 'Tap **Search existing Participant**.'),
      tap(2, 'am:pick', byName('Divya Gowda'), 'Tap **Divya Gowda**.'),
      tap(3, 'am:save', undefined, 'Tap **SAVE**.'),
      info(3, '[data-mem]', '**Participants (4)**. Divya keeps her one record, with her registration answers as they were.')
    ],
    take: ['One girl, one record. Search first.'],
    check: () => membersOf(DB.demo.batch).length === 4 || 'not added'},

  /* ---------------- programmes ---------------- */
  {id: 'enrol', g: 'prog', e: '📋', t: 'Enrol the batch in Nirman', d: 'A batch joins a programme before its sessions can be recorded.', setup: onBatch(3),
    flow: [['Open the batch, Programs tab'], ['Enrol in Program, Nirman'], ['Enrolment date'], ['Save: Session Attendance appears', 1]],
    steps: [
      tap(0, 'stab', 'programs', 'Tap **Programs** at the bottom of the batch page.'),
      info(0, '.pbody', 'The batch is **not enrolled in any program** yet.'),
      ...enrolSteps(1, 'nirman', 'Nirman', true),
      info(3, '.plist', '**Nirman** is now in the Program List, in its own colour, with a **Session Attendance** button beside it.')
    ],
    take: ['It is the batch that joins a programme, not each girl.', 'A batch can be in several programmes at the same time.'],
    check: () => !!activeEnrolment(DB.demo.batch, PROGRAMS.nirman) || 'not enrolled'},

  sessLesson({id: 'netball', g: 'prog', e: '🏐', t: 'Nirman: netball session', d: 'Skill covered, a photo, and who came.', level: 4, prog: 'nirman', type: 'Nirman Netball Session Attendance', topic: 'Shooting', photo: 'netball', present: ['Priya Sharma', 'Kavya Reddy'],
    openWhy: 'Nirman has two forms: a netball session and a life skill session.', topicNote: 'The netball skill practised today.',
    after: 'The session is under **Completed Visits** for Nirman: 2 present, 1 not present. You typed neither number.',
    take: ['Tick only the girls who came.', 'Present and not present are counted by the app.', 'One form for each session held.']}),

  sessLesson({id: 'lifeskill', g: 'prog', e: '💬', t: 'Nirman: life skill session', d: 'The same steps, with the life skill topic.', level: 4, prog: 'nirman', type: 'Nirman Lifeskill Session Attendance', topic: 'Communication', photo: 'lifeskill',
    topicNote: 'The life skill topic of today, from the Nirman curriculum.',
    after: 'Saved with all three present and nobody absent.',
    take: ['Netball and life skill sessions are recorded on separate forms.']}),

  {id: 'enrolrest', g: 'prog', e: '🗂️', t: 'Enrol in the other programmes', d: 'Akanksha, Pragati, Vriddhi and Siddhi.', setup: onBatch(4, 'programs', 'nirman'),
    flow: [['Akanksha'], ['Pragati'], ['Vriddhi'], ['Siddhi'], ['Five programmes, five colours']],
    steps: [
      ...enrolSteps(0, 'akanksha', 'Akanksha', true), ...enrolSteps(1, 'pragati', 'Pragati'), ...enrolSteps(2, 'vriddhi', 'Vriddhi'), ...enrolSteps(3, 'siddhi', 'Siddhi'),
      info(4, '.plist', 'The Program List now has all five programmes. Tap a programme to see its sessions and its **Session Attendance** button.')
    ],
    take: ['One enrolment for each programme.', 'Each programme brings its own session forms.'],
    check: () => Object.values(PROGRAMS).every(p => activeEnrolment(DB.demo.batch, p)) || 'not all enrolled'},

  sessLesson({id: 'akanksha', g: 'prog', e: '🌟', t: 'Akanksha session', d: 'A curriculum session such as My Vision.', prog: 'akanksha', type: 'Akanksha Session Attendance', topic: 'My Vision', photo: 'lifeskill',
    openWhy: 'Akanksha has an Akanksha session form and an Akanksha netball form.', topicNote: 'The sessions of the Akanksha curriculum: My Vision, Choosing Pathways, Skills I Need, My Mentor and more.',
    after: 'The Akanksha session is saved under **Completed Visits**.', take: ['Choose the session exactly as it was held.']}),

  sessLesson({id: 'pragati', g: 'prog', e: '🤾', t: 'Pragati: netball session', d: 'A netball drill from the Pragati list.', prog: 'pragati', type: 'Pragati Netball Session Attendance', topic: 'Dodging', photo: 'netball',
    openWhy: 'Pragati has a netball form and a life skill form.', topicNote: 'Pragati drills: two foot landing, dodging, shadowing, drive and shoot and more.',
    after: 'The Pragati netball session is saved.', take: ['Each programme keeps its own list of skills.']}),

  sessLesson({id: 'vriddhi', g: 'prog', e: '🌱', t: 'Vriddhi session', d: 'Two came, one did not.', prog: 'vriddhi', type: 'Vriddhi session attendance', topic: 'River of Life', photo: 'lifeskill', present: ['Priya Sharma', 'Kavya Reddy'],
    openWhy: 'Vriddhi has a session form and a netball form.', topicNote: 'The Vriddhi session held today.',
    after: 'Saved: 2 present, 1 not present.', take: ['An unticked girl is counted as not present.']}),

  sessLesson({id: 'siddhi', g: 'prog', e: '🎯', t: 'Siddhi session', d: 'Career guidance, classes, exposure visits and more.', prog: 'siddhi', type: 'Siddhi Session Attendance', topic: 'Career Guidance', photo: 'general',
    openWhy: 'Siddhi has three forms: Siddhi sessions, Siddhi netball sessions and Disha sessions.', topicNote: 'Siddhi sessions include exposure visits, mentoring, career guidance, English and computer classes, and internship days.',
    after: 'The Siddhi session is saved.', take: ['On this form the photo comes first, then the session.']}),

  /* ---------------- common sessions ---------------- */
  sessLesson({id: 'general', g: 'common', e: '🤝', t: 'General session', d: 'Baseline, parents meeting, graduation, elections…', type: 'General Session Attendance', topic: 'Baseline', photo: 'general',
    intro: 'Some sessions do not belong to one programme. They are on the batch\'s **Common Sessions** tab.', introSel: '.stabs',
    topicNote: 'Baseline and endline, parents meeting, graduation, peer leader and club elections, trainings and meetings.',
    after: 'The general session is under **Completed Encounters** on the Common Sessions tab.', take: ['Common sessions need no enrolment.']}),

  sessLesson({id: 'hub', g: 'common', e: '🏠', t: 'Community Hub session', d: 'NGO, volunteer, period champions, celebration.', type: 'Community Hub Attendance', topic: 'Celebration', photo: 'hub', present: ['Priya Sharma', 'Kavya Reddy'],
    topicNote: 'Hub sessions: NGO or external session, volunteer session, period champions session, celebration, follow up meeting.',
    after: 'Saved on the phone, even without a network. It reaches the server at the next Sync.', take: ['Everything you save stays on the phone until you Sync.']}),

  /* ---------------- review ---------------- */
  {id: 'batchview', g: 'review', e: '📒', t: 'Everything on the batch', d: 'Programmes, their sessions and the common sessions.', setup: onBatch(6, 'programs', 'nirman'),
    flow: [['Programs tab'], ['Pick a programme'], ['Open a saved session'], ['Common Sessions tab']],
    steps: [
      info(0, '.plist', 'The batch after a full day: five programmes. **Nirman** is selected, and its two sessions are listed below.'),
      tap(1, 'prog', PROGRAMS.akanksha, 'Tap **Akanksha** in the Program List.'),
      tap(2, 'exp', () => lastSession('Akanksha Session Attendance').uuid, 'Tap the small arrow on the **Akanksha Session Attendance** visit.'),
      info(2, '.obs', 'The saved session: the topic, the photo, the girls who came, and the two counts.'),
      tap(3, 'stab', 'general', 'Tap **Common Sessions** at the bottom.'),
      info(3, '[data-enc]', 'The general and community hub sessions of the batch are here.')
    ],
    take: ['The batch page is the whole story of the batch.']},

  {id: 'girlview', g: 'review', e: '🧒', t: 'A participant\'s page', d: 'Her details, section by section, and her batch.', setup: onBatch(6),
    flow: [['Batch, Participants'], ['Open a girl'], ['Registration details']],
    steps: [
      info(0, '[data-mem]', 'The three participants of the batch. A name opens that girl\'s page.'),
      tap(1, 'open', byName('Priya Sharma'), 'Tap **Priya Sharma**.'),
      info(1, '.gchip', 'The chip shows her batch. Tap it to go back to the batch.'),
      tap(2, 'exp', () => 'reg' + byName('Priya Sharma')(), 'Tap the small arrow in **Registration Details**.'),
      info(2, '.obs', 'Her answers by section, including the allergy the coach should know about.')
    ],
    take: ['Open a girl from her batch, or with Search.']},

  {id: 'after', g: 'review', e: '📊', t: 'Dashboards after a day\'s work', d: 'Home and Total update as soon as you save.', setup: withDemo(6),
    flow: [['Home: today\'s registrations'], ['Home: sessions in every programme'], ['Total']],
    steps: [
      info(0, '[data-sec="h0"]', 'After the day\'s work: **1** batch, **3** participants and **1** site registered today.'),
      info(1, '[data-sec="h1"]', 'Each programme section went up too: a session was recorded in Nirman, Akanksha, Pragati, Vriddhi and Siddhi, and in the common sessions.'),
      tap(2, 'tab', 'dash2', 'Tap **Total**.'),
      info(2, '[data-sec="s0"]', 'The all-time numbers moved as well. Nobody added anything up by hand.')
    ],
    take: ['The cards are counted from what you saved. There is no separate report to fill.']},

  {id: 'more', g: 'review', e: '⚙️', t: 'More, and Sync', d: 'Who is logged in, other dashboards, and sending your work.',
    flow: [['More tab'], ['Dashboards'], ['Sync']],
    steps: [
      tap(0, 'tab', 'more', 'Tap **More** at the bottom.'),
      info(0, '.mu', 'The top shows who is logged in. Below are Dashboards, the video list, the entity sync status, change password and logout.'),
      tap(1, 'more', 'Dashboards', 'Tap **Dashboards**.'),
      info(1, '.dtabs', 'Both dashboards, **Recent** and **Total**, can be opened from here too.'),
      tap(2, 'hdr:back', undefined, 'Tap the **back arrow** (top left).'),
      tap(2, 'tab', 'home', 'Tap **Home**.'),
      tap(2, 'hdr:sync', undefined, 'Tap **Sync** (top right).', 'One tap uploads the sites, batches, participants, sessions and photos, and downloads any changes.'),
      tap(2, 'sync:ok', undefined, 'When you see **Sync Complete**, tap **OK**.')
    ],
    take: ['Sync whenever you are back on the network.']},

  /* ---------------- checks and roles ---------------- */
  {id: 'wrongphone', g: 'stops', e: '☎️', t: 'A wrong phone number', d: 'The app refuses a coach number that is not 10 digits.',
    flow: [['Register a site'], ['Type a short number'], ['The app stops you', 1], ['Correct it and Save']],
    steps: [
      tap(0, 'tab', 'register', 'Tap **Register**.'), tap(0, 'rtype', 'Site', 'Tap **Site**.'),
      form(1, {'Type of Site': 'Community', Address: '2nd Cross, Hebbal, Bengaluru', 'Coach Name': 'Savitha R', "Coach's number": '98450'}, {}, {name: 'Hebbal Community Hall'}, null,
        {stages: [0, 1], expect: {"Coach's number": 'The app stops you: **98450** is not a 10 digit number. The message stays until you correct it.'}, fix: {"Coach's number": '9845076543'}})
    ],
    take: ['A coach or school contact number has exactly 10 digits.'],
    check: () => DB.subjects.some(s => s.firstName === 'Hebbal Community Hall' && String(s.obs["Coach's number"]) === '9845076543') || 'site not saved after the fix'},

  {id: 'wrongmobile', g: 'stops', e: '📵', t: 'A participant\'s wrong mobile number', d: 'Her mobile number and emergency contact must have 10 digits.', setup: onBatch(2),
    flow: [['Add participant from the batch'], ['Name, age, address'], ['Type a short mobile number'], ['The app stops you', 1], ['Leave the form']],
    steps: [
      tap(0, 'am:open', undefined, 'Tap **Add participant**.'), tap(0, 'rtype', 'Participant', 'Tap **Register new Participant**.'),
      form(1, {'Mobile number': '98450'}, {}, {first: 'Kavya', last: 'Reddy', age: 14, gender: 'Female'}, null,
        {stages: [1, 2], expect: {'Mobile number': 'The app stops you: **98450** is not a 10 digit number. You cannot go to the next page until it is corrected.'}, endOnStop: 1}),
      tap(4, 'hdr:home', undefined, 'In real work you would correct the number. Here, tap **Home** to leave the form.'),
      tap(4, 'dlg', '0', 'Tap **YES**.')
    ],
    take: ['Mobile number and emergency contact: exactly 10 digits, numbers only.']},

  {id: 'school', g: 'stops', e: '🏫', t: 'School or Community', d: 'The questions change with the type of site.',
    flow: [['Register a site'], ['Choose School'], ['The app asks for the school\'s contact', 1], ['Save']],
    steps: [
      tap(0, 'tab', 'register', 'Tap **Register**.'), tap(0, 'rtype', 'Site', 'Tap **Site**.'),
      form(1, {'Type of Site': 'School', Address: 'Jayanagar 4th Block, Bengaluru', "Point of contact's name": 'Geetha Prasad', "Point of contact's Number": '9845065432'},
        {'Type of Site': 'Watch the questions below change as soon as you choose.', "Point of contact's name": 'For a school the app asks for the point of contact, not for a coach.'}, {name: 'Jayanagar Government School'}, null, {stages: [0, 1]})
    ],
    take: ['You never see questions that do not apply to the site.'],
    check: () => DB.subjects.some(s => s.firstName === 'Jayanagar Government School' && s.obs["Point of contact's name"] === 'Geetha Prasad' && !s.obs['Coach Name']) || 'school site not saved'},

  {id: 'staff', g: 'stops', e: '🧑‍🏫', t: 'What city staff can do', d: 'The UAT user group for staff: batches, participants and sessions, but not sites.', role: 'staff', setup: withDemo(6),
    flow: [['Register tab'], ['Open a batch'], ['Record, but not edit']],
    steps: [
      tap(0, 'tab', 'register', 'You are now logged in with the **Staff in their own cities** user group. Tap **Register**.'),
      info(0, '.rlist', 'Only **Batch** and **Participant** are listed. In the current UAT setup this group can see sites but cannot register one.'),
      tap(1, 'tab', 'home', 'Tap **Home**.'),
      tap(1, 'card', CARD('Recent Batch Registrations'), 'Tap **Recent Batch Registrations**.'),
      tap(1, 'open', BATCH, 'Tap **Shivajinagar Girls Batch**.'),
      tap(2, 'stab', 'programs', 'Tap **Programs**.'),
      info(2, '.plist', 'Staff can record with **Session Attendance**. A saved session has no **Edit** for this group, and the batch has no **Void** or **Edit**.')
    ],
    take: ['What you can do depends on your user group.', 'If staff should also register sites or edit sessions, the group\'s privileges need to be changed in Avni.']},

  {id: 'manager', g: 'stops', e: '👀', t: 'What a manager sees', d: 'Managers can look at everything and change nothing.', role: 'manager', setup: withDemo(6),
    flow: [['Register tab'], ['Open a batch'], ['No buttons to add or record']],
    steps: [
      tap(0, 'tab', 'register', 'You are now logged in as a **manager**. Tap **Register**.'),
      info(0, '.rlist', 'The list is empty: a manager cannot register sites, batches or participants.'),
      tap(1, 'tab', 'home', 'Tap **Home**.'),
      tap(1, 'card', CARD('Recent Batch Registrations'), 'Tap **Recent Batch Registrations**.'),
      tap(1, 'open', BATCH, 'Tap **Shivajinagar Girls Batch**.'),
      tap(2, 'stab', 'programs', 'Tap **Programs**.'),
      info(2, '.plist', 'The manager sees the programmes and every saved session, but there is no **Enrol in Program** and no **Session Attendance** button.')
    ],
    take: ['What you can do depends on your user group.']}
];

/* Free explore: what each screen is for */
const HERE = {
  home: ['Home', ['Cards with a number. Tap a card to see the records behind it.', 'Search (top) finds a record; Sync sends your work.']],
  dash2: ['Total', ['All-time numbers for registrations and for each programme.', '**FILTER** narrows the cards to one record type.']],
  cards: ['A card\'s list', ['Every record the card counts. Tap a row to open it.']],
  search: ['Search', ['Choose the type, type a part of the name, tap Submit.']],
  results: ['Search results', ['Tap a row to open it.']],
  register: ['Register', ['Every record starts here: a site, a batch or a participant.', 'You see only what your user may register.']],
  subject: ['A record\'s page', ['**Profile**: registration details and, for a batch, its participants.', '**Programs**: the programmes of the batch and their sessions.', '**Common Sessions**: general and community hub sessions.']],
  chooseVisit: ['Choose Visit', ['The session forms of the selected programme.']],
  form: ['A form', ['Questions with * must be answered.', 'Some questions appear only after an answer.', 'NEXT checks the page; PREVIOUS goes back.']],
  summary: ['Summary', ['Check every answer. Nothing is saved until you tap Save.']],
  addMember: ['Add participant', ['Search an existing participant or register a new one.']],
  more: ['More', ['Dashboards, sync status, change password, logout.']],
  login: ['Login', ['Type your user ID and password.']],
  filter: ['Filter', ['Tick a record type, then Apply.']],
  dashlist: ['Dashboards', ['Every dashboard your user may open.']]
};
