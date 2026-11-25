"""Reads a Maitrayana Avni bundle zip (App Designer export) and writes data/bundle.json for the demo.
Voided rows and forms that no live mapping uses are dropped, so the page stays small.
Locations come from the bundle itself (Karnataka > Banglore). Run: python3 tools/make_bundle.py path/to/bundle.zip"""
import json, os, sys, zipfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if len(sys.argv) < 2: sys.exit('usage: python3 tools/make_bundle.py path/to/bundle.zip')
ZIP = sys.argv[1]
z = zipfile.ZipFile(ZIP)
rd = lambda n: json.loads(z.read(n))
live = lambda rows: [r for r in rows if not r.get('voided')]

b = {k: live(rd(k + '.json')) for k in ['subjectTypes', 'programs', 'encounterTypes', 'formMappings', 'reportCard', 'groups', 'groupRole', 'addressLevelTypes']}
b['concepts'] = rd('concepts.json')                       # all of them: old answers may still be referred to by uuid
ids = lambda k: {r['uuid'] for r in b[k]}
st, pr, et = ids('subjectTypes'), ids('programs'), ids('encounterTypes')
b['formMappings'] = [m for m in b['formMappings'] if m.get('subjectTypeUUID') in st and (not m.get('programUUID') or m['programUUID'] in pr) and (not m.get('encounterTypeUUID') or m['encounterTypeUUID'] in et)]
used = {m['formUUID'] for m in b['formMappings']}
b['forms'] = [f for f in (rd(n) for n in z.namelist() if n.startswith('forms/') and n.endswith('.json')) if f['uuid'] in used and not f.get('voided')]
b['reportDashboard'] = live(rd('reportDashboard.json'))
gname = {g['uuid']: g['name'] for g in b['groups']}
dname = {d['uuid']: d['name'] for d in b['reportDashboard']}
b['groupDashboards'] = [dict(g, groupName=gname[g['groupUUID']], dashboardName=dname[g['dashboardUUID']]) for g in live(rd('groupDashboards.json')) if g.get('groupUUID') in gname and g.get('dashboardUUID') in dname]
# only what the phone uses from each privilege row
b['groupPrivilege'] = [{k: p.get(k) for k in ('groupUUID', 'privilegeType', 'subjectTypeUUID', 'programUUID', 'encounterTypeUUID', 'programEncounterTypeUUID') if p.get(k)}
                       for p in rd('groupPrivilege.json') if p.get('allow') and not p.get('voided') and p.get('groupUUID') in gname]
b['translations'] = rd('translations/en.json')
b['searchFilters'] = rd('organisationConfig.json').get('settings', {}).get('searchFilters', [])

types = {t['uuid']: t for t in b['addressLevelTypes']}
locs = [{'uuid': l['uuid'], 'name': l['name'], 'type': l['type'], 'level': l['level'], 'parent': (l.get('parent') or {}).get('uuid')} for l in live(rd('locations.json'))]
out = {'bundle': b, 'locations': locs, 'source': os.path.basename(ZIP)}
dst = os.path.join(ROOT, 'data', 'bundle.json')
json.dump(out, open(dst, 'w'), separators=(',', ':'), ensure_ascii=False)
print('forms', len(b['forms']), 'concepts', len(b['concepts']), 'programs', len(b['programs']), 'cards', len(b['reportCard']), 'locations', [l['name'] for l in locs], 'size', os.path.getsize(dst))
