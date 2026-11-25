"""Assemble the single-file guide: dist/index.html (works offline). Run: python3 tools/build.py"""
import base64, json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rd = lambda *p: open(os.path.join(root, *p), encoding='utf-8').read()
uri = lambda mime, *p: 'data:' + mime + ';base64,' + base64.b64encode(open(os.path.join(root, *p), 'rb').read()).decode()
data = json.loads(rd('data', 'bundle.json'))
app = {'bundle': data['bundle'], 'locations': data['locations'], 'source': data['source'], 'features': json.loads(rd('data', 'features.json')),
       'icons': {k: uri('image/png', 'data', 'icons', k + '.png') for k in ('person', 'individual', 'group')},
       'photos': {k: uri('image/jpeg', 'data', 'photos', k + '.jpg') for k in ('netball', 'lifeskill', 'general', 'hub')}}
# Avni's own code first: models, moment and lodash (rt.js), then rules-config, which the bundle's rules call
js = [rd('tools', 'vendor', 'rt.js'), rd('tools', 'vendor', 'rules-config.js'), 'const APP = ' + json.dumps(app, ensure_ascii=False, separators=(',', ':')) + ';']
js += [rd('src', f) for f in ('core.js', 'engine.js', 'applang.js', 'ui.js', 'lessons.js', 'guide.js', 'track.js', 'main.js')]
js = '\n'.join(js).replace('</script', '<\\/script')
html = rd('src', 'index.tpl.html').replace('/*__CSS__*/', rd('src', 'styles.css')).replace('/*__JS__*/', js).replace('__AVNI_LOGO__', uri('image/png', 'data', 'icons', 'avni-logo.png'))
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
out = os.path.join(root, 'dist', 'index.html')
open(out, 'w', encoding='utf-8').write(html)
print('built', out, os.path.getsize(out), 'bytes')
