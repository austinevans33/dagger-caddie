import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTournament,addTournamentTeam,changeTournamentStatus,submitTournamentScore} from '../functions/tournament-event.mjs';
const uid='captain-001',director='director-001';
test('deployed tournament engine remains byte-identical to tested pure domain',()=>{
 assert.equal(readFileSync('functions/tournament-event.mjs','utf8'),readFileSync('scripts/tournament-event.mjs','utf8'));
 assert.equal(readFileSync('functions/tournament-scoring.mjs','utf8'),readFileSync('scripts/tournament-scoring.mjs','utf8'));
});
test('Firebase callable is auth-gated, uses Admin transactions and never trusts client role',()=>{
 const src=readFileSync('functions/tournament-api.js','utf8');
 assert.match(src,/request\.auth\?\.uid/);
 assert.match(src,/runTransaction\(async transaction/);
 assert.match(src,/actorId:uid/);
 assert.match(src,/expectedTeamRevision:body\.expectedTeamRevision/);
 assert.doesNotMatch(src,/actorId:body\./);
 assert.match(src,/throw new HttpsError\('unauthenticated'/);
});
test('Firestore rules deny all client writes to tournaments while preserving Money Room rules',()=>{
 const rules=readFileSync('firestore.rules','utf8');
 assert.match(rules,/match \/tournaments\/\{eventId\}/);
 assert.match(rules,/allow list, create, update, delete: if false/);
 assert.match(rules,/match \/rooms\/\{roomId\}/);
 assert.match(rules,/match \/competitions\/\{competitionId\}/);
});
test('server engine rejects impersonated captains and stale revisions',()=>{
 let event=createTournament({id:'event-001',name:'Scramble',hostUid:director,courseIdentity:'course|tee',holes:18,teamLimit:36,mutationId:'create-001'}).event;
 event=addTournamentTeam({event,actorId:director,teamId:'team-001',name:'The Dogs',captainUid:uid,startHole:4,mutationId:'add-001'}).event;
 event=changeTournamentStatus({event,actorId:director,status:'live',mutationId:'start-001'}).event;
 assert.equal(submitTournamentScore({event,actorId:'stranger',teamId:'team-001',hole:4,strokes:3,expectedTeamRevision:0,mutationId:'score-001'}).reason,'not-captain');
 event=submitTournamentScore({event,actorId:uid,teamId:'team-001',hole:4,strokes:3,expectedTeamRevision:0,mutationId:'score-001'}).event;
 assert.equal(submitTournamentScore({event,actorId:uid,teamId:'team-001',hole:5,strokes:3,expectedTeamRevision:0,mutationId:'score-002'}).reason,'stale-revision');
 assert.equal(event.teams[0].scores[4],3);
});
