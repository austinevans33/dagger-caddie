// Approved addition: optional per-point stake, balances, and archived Ledger entry.
export function bingoPayout(players, holes, stake) {
 if(!Array.isArray(players)||players.length<2||players.length>4||!Number.isFinite(stake)||stake<0||stake>10000||Math.abs(stake*100-Math.round(stake*100))>1e-7)throw Error('Enter a stake from $0 to $10,000 with at most two decimals.');
 const points=players.map(()=>0),cents=Math.round(stake*100);
 for(const h of holes){if(!Array.isArray(h)||h.length!==3||!h.every(v=>v===null||(Number.isInteger(v)&&v>=0&&v<players.length)))throw Error('Invalid Bingo awards.');for(const v of h)if(v!==null)points[v]++;}
 const total=points.reduce((a,b)=>a+b,0);
 return {points,score:points.map(p=>((players.length*p-total)*cents/100)||0),carry:1};
}
// Read-only receipt adapter for the approved visible Ledger archive. Never mark results paid.
export function bingoArchiveReceipts(records){
 if(!Array.isArray(records))return [];
 const seen=new Set();
 return records.filter(g=>{if(!g||g.format!=='bingo'||typeof g.bingoId!=='string'||!g.bingoId||!Array.isArray(g.bingoAwards)||seen.has(g.bingoId))return false;seen.add(g.bingoId);return true;}).map(g=>{
  const result=bingoPayout(g.players,g.bingoAwards,Number(g.stake));
  return {id:g.bingoId,ended:g.ended,stake:Number(g.stake),players:[...g.players],points:result.points,score:result.score};
 });
}
export function installBingoMoney(){
 const $=id=>document.getElementById(id),fmt=v=>(v>=0?'+':'−')+'$'+Math.abs(v).toFixed(2);
 const field=document.createElement('div');field.className='grid';
 const wrap=document.createElement('div'),label=document.createElement('label'),input=document.createElement('input');
 label.htmlFor=input.id='gStake';label.textContent='Stake per point ($)';input.type='number';input.min='0';input.max='10000';input.step='0.01';input.value='0';
 wrap.append(label,input);field.append(wrap);$('gStart').before(field);
 const priorMath=window.wagerMath;
 window.wagerMath=g=>g.format==='bingo'?bingoPayout(g.players,g.bingoAwards,Number(g.stake)):priorMath(g);
 const priorRender=window.renderBBB;
 window.renderBBB=()=>{priorRender();if(!activeG||activeG.stake===undefined)return;
 const payout=bingoPayout(activeG.players,activeG.holes,Number(activeG.stake));
 const ranks=[...$('bbbLiveStandings').querySelectorAll('.dcc-bbb-rank')];
 const sorted=activeG.players.map((_,i)=>i).sort((a,b)=>payout.points[b]-payout.points[a]||a-b);
 ranks.forEach((node,i)=>{node.querySelector('strong').textContent+=' · '+fmt(payout.score[sorted[i]]);});
 };
 const start=$('gStart').onclick;
 $('gStart').onclick=()=>{const stake=Number(input.value);try{if(input.value.trim()==='')throw Error('Enter a stake; use 0 for points only.');bingoPayout(['A','B'],[],stake);}catch(e){$('gStatus').textContent=e.message;return;}
 const old=activeG;start();if(activeG&&activeG!==old){activeG.stake=stake;activeG.moneyId=crypto.randomUUID();gStore();window.renderBBB();}};
 const finish=$('gFinish').onclick;
 $('gFinish').onclick=()=>{
 const game=activeG;if(!game||!game.holes.length)return;
 if(game.stake!==undefined){try{bingoPayout(game.players,game.holes,Number(game.stake));}catch(e){$('gStatus').textContent=e.message;return;}}
 finish();if(activeG||game.stake===undefined)return;
 syncArchive();
 };
 function syncArchive(){
 let changed=false;
 for(const g of gHistory){if(g.stake===undefined||!g.moneyId||wHistory.some(w=>w.bingoId===g.moneyId))continue;
 bingoPayout(g.players,g.holes,Number(g.stake));
 wHistory.push({players:[...g.players],format:'bingo',stake:g.stake,started:g.started,ended:g.ended,bingoId:g.moneyId,bingoAwards:g.holes.map(h=>[...h]),holes:g.holes.map(h=>g.players.map((_,i)=>h.filter(v=>v===i).length))});changed=true;}
 if(changed)wStore();window.renderFoursome();
 // Refresh the existing closure-scoped Club Record without changing member identity.
 if(changed)document.getElementById('refreshRecords')?.click();
 renderVisibleReceipts();
 }
 function renderVisibleReceipts(){
  // The legacy wager ticket is deliberately retired. Show read-only results
  // inside the *existing* approved Ledger archive, without moving or unhiding it.
  const archive=$('dccPropHistoryWrap');if(!archive)return;
  let section=$('dccBbbArchiveReceipts');
  if(!section){section=document.createElement('div');section.id='dccBbbArchiveReceipts';section.className='dcc-r66-list';section.setAttribute('aria-label','Bingo Bango Bongo archived results');section.setAttribute('aria-live','polite');archive.append(section);}
  section.replaceChildren();
  const records=bingoArchiveReceipts(wHistory);
  if(!records.length){section.hidden=true;return;}
  section.hidden=false;
  const heading=document.createElement('p');heading.className='dcc-r66-small';heading.textContent='BINGO BANGO BONGO · RECORDED RESULTS (NOT PAYMENTS)';section.append(heading);
  for(const receipt of records.slice().reverse()){
   const card=document.createElement('article');card.className='dcc-r66-slip';card.dataset.bingoId=receipt.id;
   const header=document.createElement('header');const title=document.createElement('strong');title.textContent='Bingo Bango Bongo · '+(Number.isFinite(Number(receipt.ended))?new Date(Number(receipt.ended)).toLocaleDateString():'Archived game');
   const state=document.createElement('span');state.className='dcc-r66-pill';state.textContent='RECORDED';header.append(title,state);card.append(header);
   const stake=document.createElement('p');stake.className='dcc-r66-small';stake.textContent='$'+receipt.stake.toFixed(2)+' per point · '+receipt.points.reduce((a,b)=>a+b,0)+' awarded points';card.append(stake);
   const payout=document.createElement('p');payout.textContent=receipt.players.map((name,i)=>name+' '+receipt.points[i]+' pts · '+fmt(receipt.score[i])).join(' | ');card.append(payout);
   section.append(card);
  }
 }

 // Retry idempotently on startup if the browser closed between the two archive writes.
 syncArchive();window.renderBBB();
 const validate=window.dccValidateGamesBackup;
 window.dccValidateGamesBackup=d=>{
 if(!d||!Array.isArray(d.wHistory))return validate(d);
 for(const g of [d.activeG,...(Array.isArray(d.gHistory)?d.gHistory:[])])if(g?.stake!==undefined)bingoPayout(g.players,g.holes,Number(g.stake));
 const normalized=d.wHistory.map(g=>{if(g?.format!=='bingo')return g;
 bingoPayout(g.players,g.bingoAwards,Number(g.stake));
 const expected=g.bingoAwards.map(h=>g.players.map((_,i)=>h.filter(v=>v===i).length));
 if(JSON.stringify(g.holes)!==JSON.stringify(expected))throw Error('Bingo archive points do not match awards.');
 return {...g,holes:expected.map(h=>h.map(v=>v+1))};});
 validate({...d,wHistory:normalized});return {activeW:d.activeW??null,wHistory:d.wHistory,activeG:d.activeG??null,gHistory:d.gHistory};
 };
 const showBingoPoints=e=>{const row=e.target.closest('tr');const g=row?wHistory[Number(row.dataset.archiveIndex)]:null;if(g?.format!=='bingo')return;
 [...$('dccArchiveHoles').rows].forEach((r,i)=>{g.holes[i].forEach((v,j)=>{r.cells[j+1].textContent=String(v);});});
 };
 $('wHistory').addEventListener('click',showBingoPoints);
 $('wHistory').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')showBingoPoints(e);});
}
