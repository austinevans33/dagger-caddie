import {summarizeTrip} from './trip-settlement.js';
// A deterministic, fact-only recap. Never invent scores, shots, or reversals.
export function buildTripRecap(trip){
 const ledger=summarizeTrip(trip);
 const names=new Map(trip.players.map(p=>[p.id,p.name]));
 const rows=trip.players.map(p=>({id:p.id,name:p.name,netCents:ledger.netCents[p.id]}))
   .sort((a,b)=>b.netCents-a.netCents||a.name.localeCompare(b.name));
 const winner=rows[0]?.netCents>0?rows[0]:null;
 const donor=rows.at(-1)?.netCents<0?rows.at(-1):null;
 const money=n=>'$'+(Math.abs(n)/100).toFixed(2);
 const headlines=[];
 if(winner)headlines.push(winner.name+' ran the money table: +'+money(winner.netCents)+'.');
 if(donor)headlines.push(donor.name+' generously sponsored the festivities: -'+money(donor.netCents)+'.');
 if(!winner&&!donor)headlines.push('A clean sweep of absolutely nobody. The ledger is even.');
 return {title:trip.name+' · The Clubhouse Report',status:ledger.provisional?'PROVISIONAL':'FINAL',
   completedRounds:ledger.completedRounds,pendingRounds:ledger.pendingRounds,
   countedGames:ledger.countedGames,pendingGames:ledger.pendingGames,
   leaderboard:rows,headlines,
   settlements:ledger.provisional?[]:ledger.transfers.map(t=>({
    from:names.get(t.from),to:names.get(t.to),amountCents:t.amountCents})),
   disclaimer:ledger.provisional?'More rounds or games remain. No final payment instructions.':
    'Final balances reflect completed recorded games only.'};
}
