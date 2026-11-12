import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTournament,addTournamentTeam,claimTournamentTeam,changeTournamentStatus,submitTournamentScore} from '../functions/tournament-event.mjs';
const host='director-123',captain='captain-123';
function vacant(){
 let e=createTournament({id:'event-123',name:'DCC Open',hostUid:host,courseIdentity:'verified|tee',holes:18,mutationId:'create-001'}).event;
 e=addTournamentTeam({event:e,actorId:host,teamId:'team-001',name:'Diesel',captainUid:'pending-team-001',startHole:4,mutationId:'add-001'}).event;
 return e;
}
test('deployed domain modules match reviewed pure scoring modules',()=>{
 assert.equal(readFileSync('functions/tournament-event.mjs','utf8'),readFileSync('scripts/tournament-event.mjs','utf8'));
 assert.equal(readFileSync('functions/tournament-scoring.mjs','utf8'),readFileSync('scripts/tournament-scoring.mjs','utf8'));
});
test('invited captain may claim vacant team exactly once, without rewriting previous scores',()=>{
 const original=vacant();
 const result=claimTournamentTeam({event:original,actorId:captain,teamId:'team-001',inviteVerified:true,mutationId:'join-001'});
 assert.equal(result.ok,true);assert.equal(original.teams[0].captainId,'pending-team-001');
 assert.equal(result.event.teams[0].captainId,captain);assert.equal(result.event.teams[0].revision,1);
 assert.equal(result.event.audit.at(-1).kind,'captain-joined');
 assert.equal(claimTournamentTeam({event:result.event,actorId:'second-captain',teamId:'team-001',inviteVerified:true,mutationId:'join-002'}).reason,'already-claimed');
 assert.equal(claimTournamentTeam({event:original,actorId:captain,teamId:'team-001',inviteVerified:false,mutationId:'join-001'}).reason,'invalid-invitation');
});
test('claimed captain can post actual Hole 4 at new revision; spectator cannot',()=>{
 let event=claimTournamentTeam({event:vacant(),actorId:captain,teamId:'team-001',inviteVerified:true,mutationId:'join-001'}).event;
 event=changeTournamentStatus({event,actorId:host,status:'live',mutationId:'start-001'}).event;
 assert.equal(submitTournamentScore({event,actorId:'spectator',teamId:'team-001',hole:4,strokes:3,expectedTeamRevision:1,mutationId:'score-001'}).reason,'not-captain');
 const res=submitTournamentScore({event,actorId:captain,teamId:'team-001',hole:4,strokes:3,expectedTeamRevision:1,mutationId:'score-001'});
 assert.equal(res.ok,true);assert.equal(res.event.teams[0].scores[4],3);
});
test('one-use invite hash stays server-only and is marked claimed in same transaction',()=>{
 const src=readFileSync('functions/tournament-api.js','utf8'),rules=readFileSync('firestore.rules','utf8');
 assert.match(src,/randomBytes\(24\)\.toString\('base64url'\)/);
 assert.match(src,/timingSafeEqual/);
 assert.match(src,/transaction\.get\(inviteDoc\)/);
 assert.match(src,/transaction\.create\(ref\.collection\('invites'\)/);
 assert.match(src,/transaction\.update\(inviteDoc,\{claimed:true/);
 assert.match(rules,/match \/invites\/\{teamId\}/);
 assert.match(rules,/allow read, write: if false/);
});
