// The Competition Committee's canonical game roster.
// 'existing' means present in the legacy app, not certified multiplayer-ready.
export const DCC_GAME_ROSTER=Object.freeze([
 {id:'hole',name:'Hole-by-Hole',players:'2',input:'scores',tier:'weekend',state:'shared-preview'},
 {id:'skins',name:'Skins',players:'2–4',input:'scores',tier:'weekend',state:'shared-preview'},
 {id:'nassau',name:'Nassau',players:'2',input:'scores',tier:'weekend',state:'calculation-tested'},
 {id:'match',name:'Match Play',players:'2',input:'scores',tier:'weekend',state:'existing'},
 {id:'ghost',name:'House Ghost',players:'1+',input:'ghost-hole-results',tier:'signature',state:'existing'},
 {id:'bbb',name:'Bingo Bango Bongo',players:'2–4',input:'shot-order-and-events',tier:'signature',state:'existing'},
 {id:'wolf',name:'Wolf',players:'4',input:'partner-decisions-and-scores',tier:'foursome',state:'existing'},
 {id:'vegas',name:'Vegas',players:'4',input:'scores',tier:'foursome',state:'existing'},
 {id:'hammer',name:'Hammer',players:'4',input:'hammer-events',tier:'foursome',state:'existing'},
 {id:'round-robin',name:'6-6-6 / Round Robin',players:'4',input:'scores',tier:'foursome',state:'existing'},
 {id:'snake',name:'Snake',players:'2–4',input:'three-putt-events',tier:'side-action',state:'existing'},
 {id:'stableford',name:'Stableford',players:'1+',input:'scores-and-handicap',tier:'side-action',state:'existing'},
 {id:'three-putt-poker',name:'Three-Putt Poker',players:'2–4',input:'putts',tier:'experimental',state:'idea-only'}
]);
export function gameRosterByTier(tier){return DCC_GAME_ROSTER.filter(g=>g.tier===tier);}
export function compatibleAutoScoreGames(){return DCC_GAME_ROSTER.filter(g=>g.input==='scores'&&['shared-preview','calculation-tested'].includes(g.state));}
