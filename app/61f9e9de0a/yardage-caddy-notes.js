// Personality notes on a scorecard page. Never assert unverified features, hazards or distances.
// These are general caddy prompts, not provider facts or AI responses.
import {recordedMissNotes} from './shot-record-context.js?v=friday-book-1';
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

// Compact, descriptive prompts using only the drawing's known features.
// The drawing has no measured carry or selected-tee location.
export function describeSketchTrouble(annotations, stages) {
 const labels = annotations?.labels || [];
 const named = labels.filter(label =>
  ['bunker', 'water'].includes(label.type) &&
  ['left', 'right', 'center'].includes(label.side) &&
  ['tee zone', 'landing corridor', 'approach', 'beyond green'].includes(label.stage) &&
  (!stages || stages.includes(label.stage))
 ).map(label => label.type + ' ' + label.side + ' near the ' + label.stage);
 return [...new Set(named)].slice(0, 3).join(', ');
}

export function sketchGamePlan({hole, annotations, profile = [], shotHistory = []} = {}) {
 const teeTrouble = describeSketchTrouble(annotations, ['tee zone', 'landing corridor']);
 const approachTrouble = describeSketchTrouble(annotations, ['approach', 'beyond green']);
 const hazards = annotations?.labels || [];
 const sides = new Set(hazards.filter(label => ['tee zone', 'landing corridor'].includes(label.stage)).map(label => label.side));
 const troubleSide = sides.size === 1 && !sides.has('center') ? [...sides][0] : null;
 const offTee = hole?.par === 3
  ? 'Pick a green section after confirming the actual carry and pin.'
  : troubleSide
    ? 'Start your target search on the ' + (troubleSide === 'left' ? 'right' : 'left') + ' half. Check that it gives you a clear approach.'
    : annotations?.mappedFairway
      ? 'Use the widest mapped part of the fairway as your starting target. Check how far it is from your tee.'
      : 'Check the fairway width and first trouble from the tee before picking a line.';
 const clubs = (Array.isArray(profile) ? profile : []).filter(club =>
  typeof club?.name==='string'&&/driver|(?:^|\b)[35]\s*wood\b/i.test(club?.name || '') &&
  Number(club.manualCarry ?? club.carry) >= 100 && Number(club.manualCarry ?? club.carry) <= 400
 ).sort((a, b) => Number(b.manualCarry ?? b.carry) - Number(a.manualCarry ?? a.carry)).slice(0, 2);
 const recorded = recordedMissNotes(shotHistory, clubs.map(club=>club.name)).join(' / ');
 const carries = clubs.map(club => club.name.slice(0, 28) + ' ' + Math.round(club.manualCarry ?? club.carry) + ' yd').join(' / ');
 return {
  offTee,
  miss: annotations?.reference?.note || (teeTrouble ? 'Watch for ' + teeTrouble + '. Check the clearance on the opposite side.' : 'Tee-shot miss locations are unconfirmed.'),
  approach: approachTrouble ? 'The sketch marks ' + approachTrouble + '. Confirm which green section has a clear entry.' : 'Confirm the green entrance and pin before choosing an approach.',
  play: hole?.par !== 3 && carries
   ? 'Your carries: ' + carries + '. ' + (recorded?'Recent outcomes: '+recorded+'. ':'') + 'Compare with the confirmed carry and landing space.'
   : 'Use your actual target distance, lie and wind to pick a club you can carry comfortably.'
 };
}
