// House Ghost: hole-by-hole match-play scoring for a real golfer against a
// separately entered Ghost score. Does not invent a ghost's shots or wagers.
export function scoreHouseGhost(holes,holesPlanned=18){
 if(![9,18].includes(holesPlanned)||!Array.isArray(holes)||holes.length>holesPlanned)
   throw new Error('Invalid House Ghost match');
 let lead=0;const history=[];
 holes.forEach((h,i)=>{
  if(!h||!Number.isInteger(h.player)||!Number.isInteger(h.ghost)||
    h.player<1||h.player>20||h.ghost<1||h.ghost>20)
   throw new Error('Invalid Ghost hole score');
  if(h.hole!=null&&h.hole!==i+1)throw new Error('Ghost holes must be ordered');
  if(Math.abs(lead)>holesPlanned-i)throw new Error('Match already decided');
  lead+=Math.sign(h.ghost-h.player);
  const remaining=holesPlanned-i-1;
  history.push({hole:i+1,result:h.player<h.ghost?'golfer':h.player>h.ghost?'ghost':'halved',
   lead,remaining,clinched:Math.abs(lead)>remaining});
 });
 const remaining=holesPlanned-holes.length;
 const clinched=Math.abs(lead)>remaining||remaining===0;
 return {holesPlayed:holes.length,holesRemaining:remaining,lead,
   status:!clinched?'active':lead>0?'golfer-wins':lead<0?'ghost-wins':'halved',
   history};
}
