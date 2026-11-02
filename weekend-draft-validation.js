// Validate a local weekend match before displaying or saving it.
// Reject corrupted drafts rather than silently changing the wager.
export function validateWeekendDraft(x){
 if(!x||!Array.isArray(x.names)||x.names.length!==2||x.names.some(n=>typeof n!=='string'||!n.trim()||n.length>40))throw Error('Invalid match players');
 if(!Array.isArray(x.holes)||x.holes.length>18||x.holes.some(h=>!Array.isArray(h)||h.length!==2||h.some(n=>!Number.isInteger(n)||n<1||n>20)))throw Error('Invalid saved scores');
 if(!Array.isArray(x.games)||!x.games.length||x.games.length>3||new Set(x.games.map(g=>g.id)).size!==x.games.length)throw Error('Invalid games');
 for(const g of x.games)if(!['skins','hole','nassau'].includes(g.format)||!Number.isSafeInteger(g.stakeCents)||g.stakeCents<0||g.stakeCents>1000000)throw Error('Invalid stake');
 return {names:[...x.names],holes:x.holes.map(h=>[...h]),games:x.games.map(g=>({...g}))};
}
