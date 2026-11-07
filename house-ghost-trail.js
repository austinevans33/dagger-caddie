// House Ghost practice trail: reproducible, explicitly simulated strokes on a schematic.
// Not a physical ball flight, real mapped position, live pin location, or recorded shot.
function hash(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
// Match the existing House Ghost four-tier gameplay weights; preview-only.
// Deterministic seed ensures replay/rewind never changes the result.
const SKILL=Object.freeze({
 scratch:{carry:255,spread:.7,outcomes:[-2,-1,0,1,2],weights:[2,19,59,16,4]},
 fiveTen:{carry:240,spread:1,outcomes:[-1,0,1,2,3],weights:[8,44,35,11,2]},
 tenFifteen:{carry:225,spread:1.35,outcomes:[-1,0,1,2,3],weights:[5,32,40,19,4]},
 fifteenTwenty:{carry:205,spread:1.8,outcomes:[-1,0,1,2,3],weights:[3,24,40,25,8]}
});
function skillResult(seed,hole,tier){
 const profile=SKILL[tier];if(!profile)return null;
 const roll=hash(seed+':tier:'+hole)%100;
 let threshold=0;
 for(let i=0;i<profile.weights.length;i++){
  threshold+=profile.weights[i];
  if(roll<threshold)return profile.outcomes[i];
 }
 return 0;
}
export function simulateGhostHole({holeNumber,par=4,teeYards=390,seed='house-ghost',tier=null}={}){
 if(!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18||![3,4,5].includes(par)||!Number.isFinite(teeYards)||teeYards<80||teeYards>750)throw Error('Invalid ghost hole');
 const luck=hash(seed+':'+holeNumber)%7;
 const delta=skillResult(seed,holeNumber,tier);
 const score=Math.max(2,Math.min(8,par+(delta===null?(luck===0?-1:luck>=5?1:0):delta)));
 const putts=score<=2?1:(luck%3===0?1:2);const approachCount=Math.max(1,score-putts);
 const skill=SKILL[tier];
 const shots=[];let remaining=teeYards;
 for(let n=0;n<approachCount;n++){
  const left=approachCount-n;const nominal=n===0?(par===3?teeYards*.88:Math.min(teeYards*.66,skill?.carry??235)):(remaining/left);
  const carry=Math.max(5,Math.min(remaining-3,Math.round(nominal/5)*5));
  remaining=Math.max(0,remaining-carry);
  const progress=Math.min(.94,(teeYards-remaining)/teeYards);
  const lateral=((hash(seed+':'+holeNumber+':'+n)%11)-5)/100*(skill?.spread??1);
  shots.push({number:shots.length+1,club:n===0?(par===3?'Approach iron':'Tee club'):remaining<35?'Wedge':'Approach club',
   distanceLabel:'about '+carry+' yards',lie:Math.abs(lateral)>.055?'Rough / recovery':n===0?'Tee':remaining<35?'Greenside':'Fairway / playable',
   x:Number((.5+lateral).toFixed(2)),y:Number((.92-progress*.82).toFixed(2)),kind:'simulated',comment:n===0?'A playable start.':'The Ghost keeps moving.'});
 }
 for(let n=0;n<putts;n++)shots.push({number:shots.length+1,club:'Putter',distanceLabel:n===putts-1?'short putt':'putt',lie:n===putts-1?'Holed':'Green',x:.5,y:.08,kind:'simulated',comment:n===putts-1?'In the cup.':'Still putting.'});
 return Object.freeze({holeNumber,par,score,source:'schematic-simulation',shots,schematicOnly:true});
}
