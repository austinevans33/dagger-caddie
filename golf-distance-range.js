// Golfers speak in approximate carries, not laser-perfect numbers.
// This parser deliberately does not invent precision.
export function parseGolfDistance(input){
 const raw=String(input??'').trim().toLowerCase().replace(/,/g,'');
 const match=/^(?:(?:about|around|roughly|maybe|like|~|approx\.?|approximately)\s*)?(\d{1,3})(?:\s*(?:-|–|—|to|or)\s*(\d{1,3}))?\s*(?:yards?|yds?|y)?\s*(?:ish)?$/.exec(raw);
 if(!match)return null;
 const a=Number(match[1]),b=match[2]?Number(match[2]):a;
 if(a<1||b>700||b<a||b-a>100)return null;
 const approximate=/about|around|roughly|maybe|like|~|approx|ish/.test(raw)||b!==a;
 return Object.freeze({min:a,max:b,approximate,label:a===b?(approximate?'about '+a:a+'')+' yards':a+'–'+b+' yards'});
}
