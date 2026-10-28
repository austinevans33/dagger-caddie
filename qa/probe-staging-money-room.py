"""Real staging REST smoke test. Never accepts a production project or credentials.

Creates disposable anonymous test accounts and one clearly labelled QA room.
The room is archived on cleanup; account deletion is attempted. Rules may retain
QA documents because ordinary clients cannot delete rooms. No rules are changed.
"""
import json, re, secrets, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECT = 'dagger-country-club-staging'
config = (ROOT / 'staging-app/firebase-config.js').read_text()
assert re.search(r'projectId:\s*"' + PROJECT + '"', config)
API_KEY = re.search(r'apiKey:\s*"([^"]+)"', config).group(1)
AUTH = 'https://identitytoolkit.googleapis.com/v1/accounts:'
DB = f'https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents/'
report = {'project': PROJECT, 'backend': 'REAL deployed staging REST APIs; not a browser or physical-phone test', 'checks': [], 'cleanup': []}
accounts = []
room_id, invitation = secrets.token_hex(16), secrets.token_hex(8)
room_created = False
room_archived = False

def request(url, method='GET', body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(url, data=None if body is None else json.dumps(body).encode(), headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        try: result = json.load(error)
        except Exception: result = {'error': {'message': 'Non-JSON service response'}}
        return error.code, result

def check(name, passed, status=None, error=None):
    item = {'name': name, 'pass': bool(passed)}
    if status is not None: item['status'] = status
    if error: item['error'] = error
    report['checks'].append(item)
    print(json.dumps(item), flush=True)
    if not passed: raise RuntimeError(name)

def encode(value):
    if isinstance(value, bool): return {'booleanValue': value}
    if isinstance(value, int): return {'integerValue': str(value)}
    if isinstance(value, float): return {'doubleValue': value}
    if isinstance(value, str): return {'stringValue': value}
    if isinstance(value, list): return {'arrayValue': {'values': [encode(v) for v in value]}}
    if isinstance(value, dict): return {'mapValue': {'fields': {k: encode(v) for k, v in value.items()}}}
    raise TypeError(type(value))

def write(ref, data, token, masked=False):
    query = ('?' + '&'.join('updateMask.fieldPaths=' + k for k in data)) if masked else ''
    return request(DB + ref + query, 'PATCH', {'fields': {k: encode(v) for k, v in data.items()}}, token)

def signup(label):
    code, data = request(AUTH + 'signUp?key=' + API_KEY, 'POST', {'returnSecureToken': True})
    check(label + ' anonymous signup', code == 200 and bool(data.get('idToken')), code, data.get('error', {}).get('message'))
    accounts.append(data)
    return data

try:
    host, guest, outsider = signup('Host'), signup('Guest'), signup('Outsider')
    now = int(time.time() * 1000)
    model = {'name': 'QA ONLY — Sunday Money Room verification', 'hostUid': host['localId'], 'hostName': 'QA Host',
             'players': ['QA Host', 'QA Buddy'], 'format': 'hole', 'stake': 10, 'invite': invitation,
             'holes': {}, 'archived': False, 'created': now, 'lastChange': now, 'lastEditor': 'QA Host'}
    ref = 'rooms/' + room_id
    code, data = write(ref, model, host['idToken'])
    room_created = code == 200
    if room_created: report['test_room_path'] = ref
    check('Host creates a two-player room', room_created, code, data.get('error', {}).get('message'))
    code, _ = request(DB + ref, token=guest['idToken'])
    check('Nonmember cannot read room before joining', code == 403, code)
    code, _ = write(ref + '/members/' + outsider['localId'], {'uid': outsider['localId'], 'name': 'QA Wrong Invite', 'invite': secrets.token_hex(8), 'joined': now}, outsider['idToken'])
    check('Incorrect invitation cannot register membership', code == 403, code)
    member_ref = ref + '/members/' + guest['localId']
    membership = {'uid': guest['localId'], 'name': 'QA Buddy', 'invite': invitation, 'joined': now}
    code, data = write(member_ref, membership, guest['idToken'])
    check('Guest joins by invitation without membership pre-read', code == 200, code, data.get('error', {}).get('message'))
    code, _ = request(DB + ref, token=guest['idToken'])
    check('Registered guest can read live scorecard', code == 200, code)
    code, _ = write(ref, {'holes': {'1': [4, 5]}, 'lastEditor': 'QA Buddy', 'lastChange': now + 1}, guest['idToken'], masked=True)
    check('Guest cannot edit host scores', code == 403, code)
    code, data = write(ref, {'holes': {'1': [4, 5]}, 'lastEditor': 'QA Host', 'lastChange': now + 2}, host['idToken'], masked=True)
    check('Host records a hole', code == 200, code, data.get('error', {}).get('message'))
    code, data = request(DB + ref, token=guest['idToken'])
    values = data.get('fields', {}).get('holes', {}).get('mapValue', {}).get('fields', {}).get('1', {}).get('arrayValue', {}).get('values', [])
    check('Other identity reads saved scores', code == 200 and values == [encode(4), encode(5)], code)
    membership['joined'] = now + 3
    code, _ = write(member_ref, membership, guest['idToken'])
    check('Returning guest can rejoin using same invitation', code == 200, code)
    code, _ = write(ref, {'archived': True, 'lastChange': now + 4}, host['idToken'], masked=True)
    check('Host archives match', code == 200, code)
    room_archived = code == 200
    code, _ = write(ref, {'holes': {'1': [3, 5]}, 'lastEditor': 'QA Host', 'lastChange': now + 5}, host['idToken'], masked=True)
    check('Archived match rejects later score edits', code == 403, code)
    code, _ = request(DB + ref)
    check('Unauthenticated room access denied', code == 403, code)
except Exception as error:
    report['failure'] = str(error)
    print(json.dumps({'stopped': str(error)}), flush=True)
finally:
    if room_created and room_archived:
        report['cleanup'].append({'action': 'QA room already archived by verified host action', 'status': 200})
    if room_created and not room_archived:
        try:
            code, _ = write('rooms/' + room_id, {'archived': True, 'lastChange': int(time.time() * 1000)}, accounts[0]['idToken'], masked=True)
            report['cleanup'].append({'action': 'Archive labelled staging QA room', 'status': code})
        except Exception as error: report['cleanup'].append({'action': 'Archive QA room', 'error': type(error).__name__})
    for index, account in enumerate(accounts):
        try:
            code, _ = request(AUTH + 'delete?key=' + API_KEY, 'POST', {'idToken': account['idToken']})
            report['cleanup'].append({'action': f'Delete disposable staging auth identity {index + 1}', 'status': code})
        except Exception as error: report['cleanup'].append({'action': 'Delete disposable identity', 'error': type(error).__name__})
    result = ROOT / 'qa/results/staging-money-room-real.json'
    result.parent.mkdir(parents=True, exist_ok=True)
    result.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'checks': len(report['checks']), 'passed': sum(x['pass'] for x in report['checks']), 'cleanup': report['cleanup']}), flush=True)
