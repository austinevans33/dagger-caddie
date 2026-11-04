// Bayonet at Puppy Creek: user-provided course scorecard, November 4, 2026.
// Hole 18 Regular appears as 459 in uploaded image but this contradicts its
// 5752 printed total (by 9 yards). Grassy full scorecard shows 450, and
// bayonetgolf.com/course-tour/ confirms the 5752 total. Store 450 with audit.
// No GPS, live pin, elevation, or course geometry is inferred from a paper card.
export const BAYONET_SCORECARD_PROVENANCE=Object.freeze({
 name:'Bayonet at Puppy Creek',city:'Raeford, NC',
 source:'Course scorecard image supplied November 4, 2026',
 crossCheck:'https://www.bayonetgolf.com/course-tour/',
 holeCrossCheck:'https://www.grassy.golf/courses/bayonet-at-puppy-creek-us-nc/scorecard',
 audit:'Regular/White 18th hole: image appears to read 459; 450 is reconciled against independent hole listing and official 5752 total.',
 livePinDistance:false,geometryVerified:false
});
const par=[5,4,3,4,5,4,4,4,3,4,4,4,4,3,5,3,4,5];
const men=[7,1,15,3,13,9,11,5,17,14,8,16,4,6,12,10,2,18];
const women=[1,7,15,5,3,13,11,9,17,10,14,8,4,16,6,18,12,2];
const data={
 black:{label:'Professional / Black',total:6819,front:3461,back:3358,yards:[506,421,169,411,520,416,393,450,175,349,389,396,397,187,466,191,456,527]},
 blue:{label:'Championship / Blue',total:6281,front:3204,back:3077,yards:[471,398,153,386,493,356,365,419,163,316,348,354,357,166,449,161,431,495]},
 white:{label:'Regular / White',total:5752,front:2934,back:2818,yards:[433,370,134,366,440,326,345,378,142,292,308,317,346,140,415,148,402,450]},
 gold:{label:'Senior + Ladies / Gold',total:5122,front:2592,back:2530,yards:[388,330,121,296,402,298,309,317,131,272,277,282,314,133,378,132,329,413]},
 red:{label:'Junior + Ladies / Red',total:4251,front:2146,back:2105,yards:[307,284,113,240,363,218,285,267,69,264,213,246,254,116,339,94,241,338]}
};
function sum(a){return a.reduce((n,x)=>n+x,0)}
for(const [name,tee] of Object.entries(data)){
 if(tee.yards.length!==18||sum(tee.yards.slice(0,9))!==tee.front||sum(tee.yards.slice(9))!==tee.back||sum(tee.yards)!==tee.total)throw Error('Bayonet tee data checksum failed: '+name);
 Object.freeze(tee.yards);Object.freeze(tee);
}
if(sum(par.slice(0,9))!==36||sum(par.slice(9))!==36||new Set(men).size!==18||new Set(women).size!==18)throw Error('Bayonet par/handicap checksum failed');

export const BAYONET_TEES=Object.freeze(data);
export const BAYONET_PAR=Object.freeze(par);
export function bayonetTeeForSelection(selection){
 const course=selection?.course,tee=selection?.tee;
 if(course?.provider!=='opengolfapi'||typeof course.name!=='string'||!/^bayonet at puppy creek(?: golf (?:club|course))?$/i.test(course.name.trim())||!tee)return null;
 const matched=Object.entries(data).find(([,row])=>tee.totalYards===row.total);
 if(!matched)return null;
 const [color,row]=matched;
 // Don't silently equate a mismatched color/name to the total yardage.
 const name=String(tee.name||'').toLowerCase();
 const expected={black:/black|professional/,blue:/blue|championship/,white:/white|regular/,gold:/gold|senior|ladies/,red:/red|junior|ladies/}[color];
 if(!expected.test(name))return null;
 return {color,row};
}
export function bayonetVerifiedScorecard(selection){
 const match=bayonetTeeForSelection(selection);
 if(!match)return null;
 const holes=Object.freeze(par.map((value,index)=>Object.freeze({
  number:index+1,par:value,yards:match.row.yards[index],
  handicapMen:men[index],handicapWomen:women[index],hazards:Object.freeze([])
 })));
 return Object.freeze({holes,selection,source:'bayonet-club-scorecard',provenance:BAYONET_SCORECARD_PROVENANCE,livePinDistance:false,
  state:'club-scorecard',verifiedTee:match.color});
}
