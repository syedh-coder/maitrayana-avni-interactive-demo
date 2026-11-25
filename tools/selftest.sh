#!/bin/bash
# usage: selftest.sh [extra query]  -> prints the self-test result of every lesson
root="$(cd "$(dirname "$0")/.." && pwd)"
"${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=20000 --window-size=1400,950 --dump-dom "file://${root// /%20}/dist/index.html?selftest=1$1" 2>/dev/null \
 | python3 -I -c "
import sys,re,json,html
d=sys.stdin.read(); m=re.search(r'<pre id=\"selftest\">(.*?)</pre>',d,re.S)
if not m: print('NO SELFTEST OUTPUT; page length',len(d)); sys.exit(1)
r=json.loads(html.unescape(m.group(1)))
print('PASS' if r['pass'] else 'FAIL','| today',r['today'],'|',r['cards'])
for x in r['results']: print(' ', 'ok ' if x['ok'] else 'BAD', x['id'], x.get('actions'), x.get('err') or '')
for e in r['errors']: print('  JSERR',e)
"
