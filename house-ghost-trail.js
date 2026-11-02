// House Ghost practice trail: reproducible, explicitly simulated strokes on a schematic.
// Not a physical ball flight, real mapped position, live pin location, or recorded shot.
function hash(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function simulateGhostHole({holeNumber,par=4,teeYards=390,seed='house-ghost'}={}){
 if(!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18||![3,4,5].includes(par)||!Number.isFinite(teeYards)||teeYards<80||teeYards>750)throw Error('Invalid ghost hole');
 const luck=hash(seed+':'+holeNumber)%7;const score=Math.max(2,Math.min(8,par+(luck===0?-1:luck>=5?1:0)));
 const putts=score<=2?1:(luck%3===0?1:2);const approachCount=Math.max(1,score-putts);
 const shots=[];let remaining=teeYards;
 for(let n=0;n<approachCount;n++){
  const left=approachCount-n;const nominal=n===0?(par===3?teeYards*.88:Math.min(teeYards*.66,235)):(remaining/left);
  const carry=Math.max(5,Math.min(remaining-3,Math.round(nominal/5)*5));
  remaining=Math.max(0,remaining-carry);
  const progress=Math.min(.94,(teeYards-remaining)/teeYards);
  const lateral=((hash(seed+':'+holeNumber+':'+n)%11)-5)/100;
  shots.push({number:shots.length+1,club:n===0?(par===3?'Approach iron':'Tee club'):remaining<35?'Wedge':'Approach club',
   distanceLabel:'about '+carry+' yards',lie:n===0?'Tee':remaining<35?'Greenside':'Fairway / playable',
   x:Number((.5+lateral).toFixed(2)),y:Number((.92-progress*.82).toFixed(2)),kind:'simulated',comment:n===0?'A playable start.':'The Ghost keeps moving.'});
 }
 for(let n=0;n<putts;n++)shots.push({number:shots.length+1,club:'Putter',distanceLabel:n===putts-1?'short putt':'putt',lie:n===putts-1?'Holed':'Green',x:.5,y:.08,kind:'simulated',comment:n===putts-1?'In the cup.':'Still putting.'});
 return Object.freeze({holeNumber,par,score,source:'schematic-simulation',shots,schematicOnly:true});
}
