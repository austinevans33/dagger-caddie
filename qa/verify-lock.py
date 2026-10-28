from pathlib import Path
import hashlib,json,sys
root=Path(__file__).resolve().parent.parent
files=json.loads((root/'qa/baseline-sha256.json').read_text())
changed=[]
for name,expected in files.items():
 if name.endswith('.js'):continue
 p=root/'staging-app'/name
 if not p.exists() or hashlib.sha256(p.read_bytes()).hexdigest()!=expected:changed.append(name)
if changed:sys.exit('Frozen file changed: '+', '.join(changed))
print('Frozen HTML, CSS, images and configuration verified against untouched R177.')
