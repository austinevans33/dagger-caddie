// House Ghost safety: archive an unfinished draft before starting over.
// Capture only unfinished matches; completed-match handler stays unchanged.
const DRAFT='dcc_house_ghost_draft_v1',ARCHIVE='dcc_house_ghost_archive_v1';
export function archivePartialGhost(storage,{confirmArchive=()=>false,now=Date.now()}={}){
 const raw=storage.getItem(DRAFT);if(!raw)return {handled:false};
 const draft=JSON.parse(raw);
 if(!draft||!Array.isArray(draft.holes)||!draft.holes.length)return {handled:false};
 const length=draft.holesPlanned===9?9:18;
 const valid=draft.holes.length<=length&&draft.holes.every(h=>h&&[3,4,5].includes(h.par)&&Number.isInteger(h.player)&&h.player>=1&&h.player<=20&&Number.isInteger(h.ghost)&&h.ghost>=1&&h.ghost<=20);
 if(!valid)throw Error('Ghost draft is invalid; refusing to clear it.');
 let lead=0;for(const h of draft.holes){lead+=Math.sign(h.ghost-h.player);}
 const decided=Math.abs(lead)>(length-draft.holes.length)||draft.holes.length===length;
 // A decided match (including 7&5 on hole 13) also needs a safe archive path.

 if(!confirmArchive())return {handled:true,archived:false};
 const existing=JSON.parse(storage.getItem(ARCHIVE)||'[]');
 if(!Array.isArray(existing))throw Error('Ghost archive is invalid; draft preserved.');
 const id='ghost-'+now+'-'+Math.random().toString(36).slice(2);
 const record={version:1,id,archivedAt:new Date(now).toISOString(),tier:draft.tier,condition:draft.condition||'normal',holesPlanned:length,holes:draft.holes.map(h=>({...h})),result:{lead,status:(decided?'Completed':'Unfinished')+' · '+draft.holes.length+' of '+length+' holes',played:draft.holes.length}};
 // All-or-nothing from the golfer's perspective: never remove the only copy.
 storage.setItem(ARCHIVE,JSON.stringify([record,...existing]));
 try{storage.setItem(DRAFT,JSON.stringify({version:1,tier:draft.tier,holesPlanned:length,condition:null,holes:[]}));}
 catch(error){throw Error('Archived safely, but could not reset the draft. '+error.message);}
 return {handled:true,archived:true};
}
export function installPartialGhostArchive({doc=document,storage=localStorage,refresh=()=>location.reload()}={}){
 const reset=doc.getElementById('dccGhostReset');if(!reset)return false;
 reset.addEventListener('click',event=>{
  let current;try{current=JSON.parse(storage.getItem(DRAFT)||'null');}
  catch{return;}
  if(!current?.holes?.length)return;
  try{
   const result=archivePartialGhost(storage,{confirmArchive:()=>confirm('Archive this House Ghost match and start a new one? All recorded holes will be preserved.')});
   if(!result.handled)return;
   event.stopImmediatePropagation();event.preventDefault();
   if(result.archived)refresh();
   else {const message=doc.getElementById('dccGhostMessage');if(message)message.textContent='Current Ghost match retained; no changes made.';}
  }catch(error){
   event.stopImmediatePropagation();event.preventDefault();
   const message=doc.getElementById('dccGhostMessage');
   if(message)message.textContent='Could not safely archive this match. Your current scores were retained.';
   console.warn('House Ghost archive:',error);
  }
 },true);
 return true;
}
