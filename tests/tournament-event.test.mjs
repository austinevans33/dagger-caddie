import test from 'node:test';
import assert from 'node:assert/strict';
import {createTournament,addTournamentTeam,changeTournamentStatus,submitTournamentScore,correctTournamentScore,tournamentLeaderboard} from '../scripts/tournament-event.mjs';
const cfg={id:'scramble-2026',name:'DCC Open',hostUid:'host-123',courseIdentity:'verified-course|tee',holes:18,teamLimit:36,mutationId:'create-001'};
const create=()=>createTournament(cfg).event;
const add=(event,i,hole=4)=>addTournamentTeam({event,actorId:'host-123',teamId:'team-'+i,name:'Squad '+i,captainUid:'captain-'+i,startHole:hole,startSlot:i%2?'B':'A',mutationId:'add-'+i});
const live=(event)=>changeTournamentStatus({event,actorId:'host-123',status:'live',mutationId:'go-live'}).event;
test('director can create exactly 36 teams with distinct captains and concurrent shotgun slots',()=>{
 let e=create();
 for(let i=1;i<=36;i++){const r=add(e,i,(i-1)%18+1);assert.equal(r.ok,true);e=r.event;}
 assert.equal(e.teams.length,36);assert.equal(e.teams[0].startHole,1);assert.equal(e.teams[18].startHole,1);
 assert.equal(add(e,37).reason,'full');assert.equal(e.audit.length,37);
 assert.equal(add(e,1).reason,'duplicate-mutation');
});
test('no other team captain, spectator or anonymous user can create teams',()=>{
 const e=create();
 assert.equal(addTournamentTeam({event:e,actorId:'spectator',teamId:'team-X',name:'X',captainUid:'captain-X',startHole:4,mutationId:'evil-01'}).reason,'not-director');
});
test('captain cannot post before director opens event; cannot post to another team',()=>{
 let e=add(create(),1).event;
 assert.equal(submitTournamentScore({event:e,actorId:'captain-1',teamId:'team-1',hole:4,strokes:3,expectedTeamRevision:0,mutationId:'score-001'}).reason,'not-live');
 e=live(e);
 assert.equal(submitTournamentScore({event:e,actorId:'captain-2',teamId:'team-1',hole:4,strokes:3,expectedTeamRevision:0,mutationId:'score-001'}).reason,'not-captain');
 const a=submitTournamentScore({event:e,actorId:'captain-1',teamId:'team-1',hole:4,strokes:3,expectedTeamRevision:0,mutationId:'score-001'});
 assert.equal(a.ok,true);assert.equal(a.event.teams[0].scores[4],3);assert.equal(a.event.teams[0].revision,1);
 assert.equal(submitTournamentScore({event:a.event,actorId:'captain-1',teamId:'team-1',hole:4,strokes:3,expectedTeamRevision:0,mutationId:'score-001'}).reason,'duplicate-mutation');
 assert.equal(submitTournamentScore({event:a.event,actorId:'captain-1',teamId:'team-1',hole:5,strokes:3,expectedTeamRevision:0,mutationId:'score-002'}).reason,'stale-revision');
 assert.equal(e.teams[0].scores[4],undefined);
});
test('director corrections are traceable, existing hole only, and no team can edit finals',()=>{
 let e=live(add(create(),1).event);
 e=submitTournamentScore({event:e,actorId:'captain-1',teamId:'team-1',hole:4,strokes:3,expectedTeamRevision:0,mutationId:'score-001'}).event;
 assert.equal(correctTournamentScore({event:e,actorId:'captain-1',teamId:'team-1',hole:4,strokes:4,reason:'signed card',mutationId:'fix-001'}).reason,'not-director');
 assert.equal(correctTournamentScore({event:e,actorId:'host-123',teamId:'team-1',hole:5,strokes:4,reason:'signed card',mutationId:'fix-002'}).reason,'hole-not-recorded');
 const a=correctTournamentScore({event:e,actorId:'host-123',teamId:'team-1',hole:4,strokes:4,reason:'signed card correction',mutationId:'fix-001'});
 assert.equal(a.ok,true);assert.equal(a.event.audit.at(-1).details.oldStrokes,3);
 assert.equal(a.event.audit.at(-1).details.newStrokes,4);assert.equal(a.event.teams[0].revision,2);
 const f=changeTournamentStatus({event:a.event,actorId:'host-123',status:'final',mutationId:'final-001'});
 assert.equal(f.ok,true);
 assert.equal(submitTournamentScore({event:f.event,actorId:'captain-1',teamId:'team-1',hole:5,strokes:3,expectedTeamRevision:2,mutationId:'score-002'}).reason,'not-live');
 assert.equal(correctTournamentScore({event:f.event,actorId:'host-123',teamId:'team-1',hole:4,strokes:3,reason:'again',mutationId:'fix-003'}).reason,'not-live');
});
test('leaderboard uses scorecard fact for actual shotgun hole',()=>{
 let e=live(add(create(),1,4).event);
 e=submitTournamentScore({event:e,actorId:'captain-1',teamId:'team-1',hole:4,strokes:3,expectedTeamRevision:0,mutationId:'score-001'}).event;
 const rows=tournamentLeaderboard(e,[{number:4,par:5}]);assert.equal(rows[0].relative,-2);assert.equal(rows[0].thru,4);
});
test('director cannot transition empty event or reopen a final',()=>{
 const e=create();
 assert.equal(changeTournamentStatus({event:e,actorId:'host-123',status:'live',mutationId:'go-live'}).reason,'no-teams');
 const f=changeTournamentStatus({event:live(add(e,1).event),actorId:'host-123',status:'final',mutationId:'final-001'}).event;
 assert.equal(changeTournamentStatus({event:f,actorId:'host-123',status:'live',mutationId:'reopen-001'}).reason,'invalid-transition');
});
