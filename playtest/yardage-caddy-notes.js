// Personality notes on a scorecard page. Never assert unverified features, hazards or distances.
// These are general caddy prompts, not provider facts or AI responses.
const names={keith:'Keith',reginald:'Reginald',vinny:'Vinny',kyle:'Kyle'};
const standard={
 keith:['Pick a committed target. Swing through it.','Take the club that covers the number with a normal swing.'],
 reginald:['Favor sound course management over a heroic recovery.','The center of the green is usually a distinguished choice.'],
 vinny:['Protect the card before you start chasing the bet.','A boring par keeps the ticket alive.'],
 kyle:['One target, one decision, no second guessing.','Play your number, not your adrenaline.']
};
export function readYardageCaddy(storage){
 try{const raw=JSON.parse(storage.getItem('dagger_selected_caddie'));return Object.hasOwn(names,raw)?raw:'keith';}catch{return 'keith';}
}
export function yardageCaddyNote({caddy='keith',hole=null}={}){
 const id=Object.hasOwn(names,caddy)?caddy:'keith';
 const par=Number(hole?.par),yards=Number(hole?.yards);
 const verified=Number.isInteger(par)&&par>=3&&par<=6&&Number.isInteger(yards)&&yards>=50&&yards<=800;
 const basic=standard[id];
 let suggestion=basic[0];
 if(verified){
  if(par===3)suggestion='Par 3 · The tee yardage is '+yards+'. Confirm the pin and wind before picking a carry.';
  else if(par===5)suggestion='Par 5 · Plan the next shot before choosing how aggressive to be off the tee.';
  else suggestion='Par '+par+' · Pick a landing area and leave yourself a comfortable next shot.';
 }
 return Object.freeze({name:names[id],caddy:id,advice:suggestion,second:basic[1],
  label:verified?'GENERAL CADDY NOTE · SCORECARD CONTEXT':'GENERAL CADDY NOTE · COURSE FACTS UNAVAILABLE',
  disclaimer:'Strategy prompt, not observed hole geometry or a live AI recommendation.'});
}
