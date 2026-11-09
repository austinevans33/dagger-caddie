// Manual, shareable recap. No network calls or persistent storage.
export function makeRoundReceipt({course='',holes=18,game='',players=[],highlight=''}={}) {
 if(!Number.isInteger(holes)||holes<1||holes>36)throw Error('Enter a valid number of holes.');
 if(!Array.isArray(players)||players.length<2||players.length>4)throw Error('Add 2 to 4 players.');
 const names=new Set();
 const rows=players.map(p=>{
  const name=String(p.name||'').trim().slice(0,45);
  if(!name||names.has(name.toLowerCase()))throw Error('Use unique player names.');
  names.add(name.toLowerCase());
  if(p.net===''||p.net===null||p.net===undefined)throw Error('Enter every player’s final net amount.');
  const net=Number(p.net);
  if(!Number.isFinite(net)||Math.abs(net)>100000||Math.abs(net*100-Math.round(net*100))>1e-7)throw Error('Enter valid dollar amounts (two decimals max).');
  return {name,cents:Math.round(net*100)};
 });
 if(rows.reduce((a,p)=>a+p.cents,0)!==0)throw Error('Net winnings and losses must add up to $0. Check the Ledger.');
 const tidy=s=>String(s||'').replace(/[\r\n\t]+/g,' ').trim();
 const money=c=>(c>0?'+':c<0?'-':'')+'$'+(Math.abs(c)/100).toFixed(2);
 const leader=[...rows].sort((a,b)=>b.cents-a.cents)[0];
 return ['⛳ DAGGER COUNTRY CLUB — THE 19TH HOLE',tidy(course).slice(0,90)||'The course',holes+' holes'+(tidy(game)?' · '+tidy(game).slice(0,60):''),'',...rows.map(p=>p.name+': '+money(p.cents)),'',leader.cents>0?'🏆 Top earner: '+leader.name:'🤝 Nobody took home the money',...(tidy(highlight)?['','🍻 Moment of the round: '+tidy(highlight).slice(0,400)]:[]),'','As It Lies.'].join('\n');
}
