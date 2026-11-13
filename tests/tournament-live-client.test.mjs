import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync('playtest/tournament-hq-live.html','utf8');
test('staging preview uses existing member auth and authenticated callable adapter',()=>{
 assert.match(page,/getApps\(\)\[0\]\|\|initializeApp\(firebaseConfig\)/);
 assert.match(page,/createTournamentTransport/);
 assert.match(page,/onAuthStateChanged\(auth,user=>/);
 assert.match(page,/if\(!user\)\{stopWatch\(\)/);
});
test('captain join link includes actual event and team and one-use private token',()=>{
 assert.match(page,/url\.searchParams\.set\('event',activeId\)/);
 assert.match(page,/url\.searchParams\.set\('team',teamId\)/);
 assert.match(page,/url\.searchParams\.set\('invite',result\.invite\)/);
 assert.match(page,/doAction\('join-team',\{teamId,invite:/);
 assert.match(page,/history\.replaceState/);
});
test('scoring sends server-checked revision and correct actual next shotgun hole',()=>{
 assert.match(page,/shotgunOrder\(team\.startHole,model\.holes\)/);
 assert.match(page,/doAction\('score',\{teamId:team\.id,hole,strokes:Number\(\$\('strokes'\)\.value\),expectedTeamRevision:team\.revision\}\)/);
 assert.doesNotMatch(page,/\b(?:addDoc|setDoc|updateDoc)\s*\(/);
});
test('leaderboard never fabricates event par or falsely labels offline data as live',()=>{
 assert.match(page,/OFFLINE CACHE/);
 assert.match(page,/card\.identity===event\.courseIdentity/);
 assert.match(page,/tournamentLeaderboard\(event,verified\.holes\)/);
 assert.match(page,/Course\/tee scorecard not verified/);
 assert.doesNotMatch(page,/DEMO-PAR-4-NOT-VERIFIED/);
});
test('real event preview is not part of public production navigation',()=>{
 const index=readFileSync('index.html','utf8');
 assert.doesNotMatch(index,/tournament-hq-live\.html/);
 assert.match(page,/STAGING DEVELOPMENT SCREEN/);
});

test('event creation requires exact verified course and tee from Dagger, not arbitrary text',()=>{
 assert.match(page,/readActiveRound\(localStorage\)/);
 assert.match(page,/yardageSelectionKey\(selection\)/);
 assert.match(page,/readCourseScorecard\(localStorage,selection\)/);
 assert.match(page,/parMap\.size!==holeCount/);
 assert.match(page,/if\(!card\)return status/);
 assert.match(page,/courseIdentity:card\.identity/);
 assert.match(page,/<input id="identity" readonly/);
});
