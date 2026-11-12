// Tournament HQ event state transitions: pure, deterministic, no network or storage.
// A future Firebase adapter must enforce permissions transactionally on the server.
import {recordCaptainScore,shotgunOrder,leaderboard,normalizeHolePars,validScrambleScore} from './tournament-scoring.mjs';

function fail(reason,event){return {ok:false,reason,event};}
function validName(name,max=64){return typeof name==='string'&&name.trim().length>0&&name.trim().length<=max;}
function validIdentifier(value){return typeof value==='string'&&/^[a-zA-Z0-9_-]{3,96}$/.test(value);}
function owner(event,actorId){return actorId===event?.hostUid;}
function stamp(event,actorId,kind,details,mutationId){
 return [...event.audit,{sequence:event.audit.length+1,actorId,kind,details,mutationId}];
}
function validMutationId(id){return validIdentifier(id);}
function seen(event,mutationId){return event.audit.some(x=>x.mutationId===mutationId);}
export function createTournament({id,name,hostUid,courseIdentity,holes,teamLimit=36,mutationId}){
 if(!validIdentifier(id)||!validIdentifier(hostUid)||!validMutationId(mutationId)||!validName(name,80)
  ||!validName(courseIdentity,200)||![9,18].includes(holes)
  ||!Number.isInteger(teamLimit)||teamLimit<2||teamLimit>144)return {ok:false,reason:'invalid-event'};
 const event={version:1,id,name:name.trim(),hostUid,courseIdentity,holes,teamLimit,status:'draft',
  teams:[],revision:0,audit:[]};
 event.audit=stamp(event,hostUid,'created',{teamLimit,holes},mutationId);
 return {ok:true,event};
}
export function addTournamentTeam({event,actorId,teamId,name,captainUid,startHole,startSlot='A',mutationId}){
 if(!owner(event,actorId))return fail('not-director',event);
 if(event.status!=='draft')return fail('not-draft',event);
 if(!validMutationId(mutationId)||seen(event,mutationId))return fail('duplicate-mutation',event);
 if(!validIdentifier(teamId)||!validName(name,48)||!validIdentifier(captainUid)
  ||!Number.isInteger(startHole)||startHole<1||startHole>event.holes
  ||!['A','B','C','D'].includes(startSlot))return fail('invalid-team',event);
 if(event.teams.length>=event.teamLimit)return fail('full',event);
 if(event.teams.some(t=>t.id===teamId||t.captainId===captainUid))return fail('duplicate-team-or-captain',event);
 const team={id:teamId,name:name.trim(),captainId:captainUid,startHole,startSlot,revision:0,scores:{},
  locked:false,disqualified:false};
 const next={...event,revision:event.revision+1,teams:[...event.teams,team]};
 next.audit=stamp(event,actorId,'team-added',{teamId,startHole,startSlot},mutationId);
 return {ok:true,event:next};
}
export function changeTournamentStatus({event,actorId,status,mutationId}){
 if(!owner(event,actorId))return fail('not-director',event);
 if(!validMutationId(mutationId)||seen(event,mutationId))return fail('duplicate-mutation',event);
 const transition={draft:'live',live:'final'};
 if(transition[event.status]!==status)return fail('invalid-transition',event);
 if(status==='live'&&event.teams.length===0)return fail('no-teams',event);
 const next={...event,status,revision:event.revision+1};
 next.audit=stamp(event,actorId,'status-changed',{status},mutationId);
 return {ok:true,event:next};
}
export function submitTournamentScore({event,actorId,teamId,hole,strokes,expectedTeamRevision,mutationId}){
 if(event?.status!=='live')return fail('not-live',event);
 if(!validMutationId(mutationId)||seen(event,mutationId))return fail('duplicate-mutation',event);
 const index=event.teams.findIndex(t=>t.id===teamId);
 if(index<0)return fail('missing-team',event);
 const result=recordCaptainScore({team:event.teams[index],actorId,hole,strokes,
  expectedRevision:expectedTeamRevision,holeCount:event.holes});
 if(!result.ok)return fail(result.reason,event);
 const teams=event.teams.map((t,i)=>i===index?result.team:t);
 const next={...event,revision:event.revision+1,teams};
 next.audit=stamp(event,actorId,'score-posted',{teamId,hole,strokes},mutationId);
 return {ok:true,event:next};
}
export function correctTournamentScore({event,actorId,teamId,hole,strokes,reason,mutationId}){
 if(!owner(event,actorId))return fail('not-director',event);
 if(event.status!=='live')return fail('not-live',event);
 if(!validMutationId(mutationId)||seen(event,mutationId))return fail('duplicate-mutation',event);
 if(!validName(reason,200)||!validScrambleScore(strokes))return fail('invalid-correction',event);
 const index=event.teams.findIndex(t=>t.id===teamId);
 if(index<0)return fail('missing-team',event);
 const team=event.teams[index];
 if(!shotgunOrder(team.startHole,event.holes).includes(hole)||
  !Object.hasOwn(team.scores,String(hole)))return fail('hole-not-recorded',event);
 if(team.scores[hole]===strokes)return fail('unchanged',event);
 const oldStrokes=team.scores[hole];
 const amended={...team,revision:team.revision+1,scores:{...team.scores,[hole]:strokes}};
 const next={...event,revision:event.revision+1,teams:event.teams.map((t,i)=>i===index?amended:t)};
 next.audit=stamp(event,actorId,'score-corrected',{teamId,hole,oldStrokes,newStrokes:strokes,reason},mutationId);
 return {ok:true,event:next};
}
export function tournamentLeaderboard(event,scorecardHoles){
 if(!event||![9,18].includes(event.holes))throw new Error('Tournament missing');
 const pars=normalizeHolePars(scorecardHoles,event.holes);
 return leaderboard(event.teams,pars,event.holes);
}
