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
// Provider-assigned mapped outlines can inform a conservative plan; generic artwork cannot.
// Never infer hazard distance, forced carry, layup yardage or safe side from an outline alone.
export function yardageCaddyNote({caddy='keith',hole=null,features=[],annotations=null,survey=null}={}){
 const id=Object.hasOwn(names,caddy)?caddy:'keith';
 const par=Number(hole?.par),yards=Number(hole?.yards);
 const verified=Number.isInteger(par)&&par>=3&&par<=6&&Number.isInteger(yards)&&yards>=50&&yards<=800;
 const basic=standard[id];
 const mapped=Array.isArray(features)?features.filter(f=>f&&Array.isArray(f.points)&&f.points.length>=3):[];
 const bunker=mapped.filter(f=>f.type==='bunker').length;
 const water=mapped.filter(f=>f.type==='water').length;
 const fairway=mapped.some(f=>f.type==='fairway');
 const green=mapped.some(f=>f.type==='green');
 const trouble=[];
 if(water)trouble.push(water+' mapped water '+(water===1?'area':'areas'));
 if(bunker)trouble.push(bunker+' mapped '+(bunker===1?'bunker':'bunkers'));
 const attack=verified?(par===3?
   'Par 3 · '+yards+' tee yards. Aim for a sensible green section, not a speculative pin carry.':
   par===5?'Par 5 · '+yards+' tee yards. Choose a tee shot that leaves a comfortable second; confirm your layup distance before attacking.':
   'Par '+par+' · '+yards+' tee yards. Choose a playable tee target and favor a full, comfortable approach.'):
   'Get the verified hole yardage and current target before choosing a club.';
 let suggestion=attack;
 let second=basic[1];
 const located=Array.isArray(annotations?.labels)?annotations.labels.filter(x=>
  ['water','bunker'].includes(x.type)&&['left','right','center'].includes(x.side)&&
  ['tee zone','landing corridor','approach','beyond green'].includes(x.stage)):[];
 if(located.length&&annotations?.route){
  const important=located.filter(x=>x.stage==='landing corridor'||x.stage==='approach');
  const source=important.length?important:located;
  const phrase=source.slice(0,3).map(x=>(x.type==='water'?'Water':'Bunker')+' '+x.side+' near '+x.stage).join('; ');
  suggestion+=' Approximate mapped trouble: '+phrase+'.';
  const left=source.some(x=>x.side==='left'),right=source.some(x=>x.side==='right');
  second=left&&right?'Trouble is mapped on both sides. Favor a conservative middle target after confirming real fairway width.':
   left?'Left-side trouble is mapped. Consider the center-right line only after checking clearance and distances.':
   right?'Right-side trouble is mapped. Consider the center-left line only after checking clearance and distances.':
   'Centerline trouble is mapped. Confirm the safe carry or layup before choosing the aggressive play.';
 }else if(trouble.length){
  suggestion+=' Mapped trouble: '+trouble.join(' and ')+'.';
  second=water?'Identify the water’s true carry and safe side from the sketch or on course before committing.':
   'Check the bunker placement on the sketch before selecting an aggressive line.';
 }else if(survey&&(survey.left||survey.right)){
  const sides=survey.left&&survey.right?'both sides':survey.left?'left':'right';
  suggestion=(verified?'Par '+par+' · '+yards+' tee yards. ':'')+
   'OSM course survey flags trouble on '+sides+' of the playing route.';
  second=survey.left&&survey.right?
   'TEE: Favor control over maximum distance; check the actual fairway width and hazard carries before choosing a line.':
   survey.left?'TEE: Check right-side clearance before favoring that side to avoid the mapped left-side trouble.':
   'TEE: Check left-side clearance before favoring that side to avoid the mapped right-side trouble.';
 }else if(fairway||green){
  second='The pencil marks show '+(fairway&&green?'fairway and green':'partial mapped golf features')+
   '; missing hazards are NOT evidence the route is clear.';
 }
 return Object.freeze({name:names[id],caddy:id,advice:suggestion,second,
  trouble:Object.freeze(trouble),mappedFeatureCount:mapped.length,
  label:located.length?'CADDY ATTACK PLAN · APPROXIMATE MAPPED TROUBLE':trouble.length?'CADDY ATTACK PLAN · MAPPED TROUBLE':survey?'CADDY PLAN · OSM SURVEY HINTS':verified?'CADDY ATTACK PLAN · VERIFIED TEE YARDAGE':'GENERAL CADDY NOTE · COURSE FACTS UNAVAILABLE',
  disclaimer:trouble.length?'Hazard outlines from hole-assigned provider data. Positions and distances require on-course confirmation.':
   survey?'OSM survey route is not measured from your selected tees. Check carry distances on course; obstacle types and exact positions remain unverified.':
   'No unverified hazards, precise landing areas or live pin distances assumed.'});
}
