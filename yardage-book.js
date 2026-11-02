// Yardage-book copy generated only from verified scorecard facts.
// No fabricated doglegs, bunkers, carries, greens or pin distances.
export function buildYardagePage(facts,club=null) {
 if(!facts||typeof facts!=='object'||!Number.isInteger(facts.holeNumber)||
    facts.holeNumber<1||facts.holeNumber>18)return null;
 const hole=Number(facts.holeNumber);
 const par=Number.isInteger(facts.par)&&facts.par>=3&&facts.par<=6?facts.par:null;
 const yards=Number.isInteger(facts.teeYards)&&facts.teeYards>=50&&facts.teeYards<=800?facts.teeYards:null;
 const verified=yards!==null&&facts.scorecardSource==='opengolfapi-scorecard';
 const name=typeof facts.courseName==='string'?facts.courseName.slice(0,90):'Selected Course';
 const tee=typeof facts.teeName==='string'?facts.teeName.slice(0,60):'Selected Tee';
 let tip='Find a playable line. Plan the next shot, not the perfect shot.';
 if(par===3)tip='Middle of the green is good business. Pick the club you normally carry far enough.';
 if(par===4)tip='Find the wide part. Leave yourself a comfortable number coming in.';
 if(par===5)tip='Three good decisions beat one miracle. Lay up to a yardage you like.';
 const clubName=typeof club==='string'&&club.trim().length<=32?club.trim():null;
 return Object.freeze({
  holeNumber:hole,courseName:name,teeName:tee,par,yards:verified?yards:null,
  source:verified?'verified-scorecard':'hole-details-unavailable',
  yardageLabel:verified?`${yards} yds · tee-to-green scorecard`:'Tee yardage unavailable',
  strategy:tip,
  hazards:'Hazard and carry locations not verified for this hole.',
  club:clubName,
  distanceToPinVerified:false
 });
}
