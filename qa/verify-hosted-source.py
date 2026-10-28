"""Compare a staging preview's public bytes with the tested application source."""
import concurrent.futures, hashlib, json, re, sys, urllib.request
from pathlib import Path
from urllib.parse import urlparse, quote

origin = sys.argv[1].rstrip('/')
parsed = urlparse(origin)
assert parsed.scheme == 'https'
assert re.fullmatch(r'dagger-country-club-staging--(?:sunday-test|qr-candidate)-[a-z0-9-]+\.web\.app', parsed.hostname)
root = Path(__file__).resolve().parent.parent
files = [p for p in (root / 'staging-app').rglob('*')
         if p.is_file() and (p.suffix in ['.html', '.css', '.js', '.json', '.png', '.svg', '.webp'] or p.name.endswith('.LICENSE.txt'))
         and p.name != 'firebase.json']

def compare(p):
    relative = p.relative_to(root / 'staging-app').as_posix()
    response = urllib.request.urlopen(origin + '/' + quote(relative) + '?dcc-source-check=1', timeout=30)
    data = response.read()
    return {'path': relative, 'pass': data == p.read_bytes(), 'status': response.status,
            'sha256': hashlib.sha256(data).hexdigest()}

with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    checks = list(pool.map(compare, files))
report = {'origin': origin, 'checks': checks, 'passed': sum(c['pass'] for c in checks)}
path = root / 'qa/results/hosted-source.json'
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'origin': origin, 'files': len(checks), 'passed': report['passed'], 'mismatches': [c['path'] for c in checks if not c['pass']]}))
assert report['passed'] == len(checks)
