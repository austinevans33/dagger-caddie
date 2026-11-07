// Two concise, grounded notes beside the shared caddy-book hole illustration.
// Humor changes by caddy; never infer an unverified hazard, side or carry.
const names=Object.freeze({keith:'Keith',reginald:'Reginald',vinny:'Vinny',kyle:'Kyle'});
const personality=Object.freeze({
 keith:{tee:'Pick a target. Commit. No speeches.',approach:'The smart shot is still available. Surprisingly.'},
 reginald:{tee:'A sensible target would be a refreshing change.',approach:'The flag is a suggestion, not a royal summons.'},
 vinny:{tee:'Protect the card. The bets can wait.',approach:'Par pays in dignity. Sometimes actual money.'},
 kyle:{tee:'One target. No heroics. Execute.',approach:'Aim small, miss reasonably. That’s the mission.'}
});
const phrasing=Object.freeze({
 water:{keith:'Water in the picture. Try not to join it.',reginald:'The water is not a suitable landing area, sir.',vinny:'Water eats golf balls and side bets.',kyle:'Water hazard identified. Avoid the splash zone.'},
 bunker:{keith:'Bunkers are drawn for a reason. Notice them.',reginald:'The sand is decorative. Kindly keep it so.',vinny:'Sand is expensive when there’s action.',kyle:'Bunker ahead. No unnecessary beach trip.'}
});
function locatedLabel(annotations){
 const labels=Array.isArray(annotations?.labels)?annotations.labels:[];
 // Require both mapped feature and a usable placement before describing an actual hazard.
 return labels.find(x=>['water','bunker'].includes(x?.type)&&
 ['left','right','center'].includes(x?.side)&&
 ['tee zone','landing corridor','approach'].includes(x?.stage))||null;
}
export function pocketCaddyNotes({caddy='keith',hole=null,annotations=null}={}){
 const id=Object.hasOwn(names,caddy)?caddy:'keith';
 const par=Number(hole?.par);
 const fact=locatedLabel(annotations);
 const first=fact
  ?phrasing[fact.type][id]+' ('+fact.side+' '+(fact.stage==='tee zone'?'off the tee':fact.stage==='approach'?'near the green':'in the landing area')+'.)'
  :personality[id].tee;
 const second=par===3
  ?({keith:'Find the green. This is not a driving contest.',reginald:'The middle of the green remains fashionable.',vinny:'Take the easy three. Save the drama for later.',kyle:'Green first. Hero shot not required.'})[id]
  :personality[id].approach;
 return Object.freeze({name:names[id],lines:Object.freeze([first,second]),mapped:!!fact});
}
