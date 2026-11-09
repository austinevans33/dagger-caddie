import {matchbookText} from './matchbook.js';
import {loadHoleSketch,SKETCH_HEIGHT} from './hole-sketch.js?v=founders-reference-2';
import {renderSharedHoleSketch} from './shared-hole-sketch.js?v=paper-labels-1';

async function renderImage(card,venue,seal,svg,credit){
 const canvas=document.createElement('canvas');
 canvas.width=720;
 canvas.height=svg?1140:610;
 const ink=canvas.getContext('2d');
 if(!ink)return null;
 ink.fillStyle='#f5edda';ink.fillRect(0,0,canvas.width,canvas.height);
 ink.strokeStyle='#a88c57';ink.lineWidth=3;ink.strokeRect(18,18,684,canvas.height-36);
 ink.textAlign='center';ink.fillStyle='#18382b';
 const drawText=(text,y,font)=>{
  ink.font=font;
  let line='';
  for(const word of text.split(/\s+/)){
   const next=line?line+' '+word:word;
   if(line&&ink.measureText(next).width>600){ink.fillText(line,360,y+=33,600);line=word;}
   else line=next;
  }
  if(line)ink.fillText(line,360,y+=33,600);
  return y;
 };
 await seal.decode().catch(()=>{});
 if(seal.naturalWidth)ink.drawImage(seal,315,32,90,90);
 drawText('DAGGER COUNTRY CLUB',118,'700 18px system-ui');
 drawText('The Matchbook',161,'45px Georgia');
 let y=drawText(venue,226,'23px Georgia');
 y=drawText(card.headline,y+12,'700 28px Georgia');
 y=drawText(card.highlight,y+7,'22px Georgia');
 if(svg){
  const art=svg.cloneNode(true);
  art.setAttribute('width','300');art.setAttribute('height',String(SKETCH_HEIGHT));
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(art)],{type:'image/svg+xml;charset=utf-8'}));
  try{
   const map=new Image();
   map.src=url;await map.decode();
   const height=Math.min(324*SKETCH_HEIGHT/300,canvas.height-y-125);
   const width=height*300/SKETCH_HEIGHT;
   ink.drawImage(map,(canvas.width-width)/2,y+12,width,height);
  }finally{URL.revokeObjectURL(url);}
  if(credit)drawText(credit,canvas.height-112,'15px system-ui');
 }
 drawText('As It Lies.',canvas.height-76,'italic 22px Georgia');
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 return blob?new File([blob],'dagger-matchbook.png',{type:'image/png'}):null;
}

export function openMatchbook(card){
 if(!card||document.querySelector('#dcc-matchbook'))return;
 const dialog=document.createElement('dialog');
 dialog.id='dcc-matchbook';
 dialog.setAttribute('aria-labelledby','dcc-matchbook-title');
 dialog.innerHTML=`
 <style>
 #dcc-matchbook{width:min(430px,calc(100% - 22px));max-height:calc(100dvh - 24px);padding:0;border:1px solid #a88c57;border-radius:12px;background:#f5edda;color:#18382b;font:16px/1.45 Georgia,serif}
 #dcc-matchbook::backdrop{background:#0b2219d9}
 #dcc-matchbook header{text-align:center;padding:17px 12px 10px;border-bottom:1px solid #c6b185}
 #dcc-matchbook img{display:block;width:66px;height:66px;object-fit:contain;margin:0 auto 5px}
 #dcc-matchbook h2{margin:2px 0;font:25px Georgia,serif;color:inherit}
 #dcc-matchbook article{padding:12px 15px 15px}
 #dcc-matchbook p{margin:6px 0;color:inherit}
 #dcc-matchbook svg{display:block;width:100%;max-height:305px;background:#f3ead1}
 #dcc-matchbook figure{margin:9px 0;padding:4px;border:1px solid #c6b185;border-radius:8px}
 #dcc-matchbook figcaption{padding:4px;font:11px system-ui}
 #dcc-matchbook footer{display:flex;gap:8px;padding:0 15px 15px}
 #dcc-matchbook button{flex:1;min-height:44px;border:1px solid #a88c57;border-radius:8px;background:#17382b;color:#fff7e1;font:700 13px system-ui}
 #dcc-matchbook textarea{width:100%;min-height:100px;color:#17382b;background:#fff7e1}
 </style>
 <header><img src="dcc-approved-seal.png" alt="Dagger Country Club"><small>THE 19TH HOLE</small><h2 id="dcc-matchbook-title">The Matchbook</h2></header>
 <article><p data-course></p><strong data-headline></strong><p data-highlight></p>
 <figure hidden><svg role="img" aria-label="Verified hole drawing"></svg><figcaption></figcaption></figure>
 <p role="status"></p><textarea aria-label="Matchbook text" readonly hidden></textarea></article>
 <footer><button type="button" data-close>Close</button><button type="button" data-image hidden>Save image</button><button type="button" data-share>Share recap</button></footer>`;
 const find=selector=>dialog.querySelector(selector);
 const venue=[card.course,card.tee,card.opponent&&'vs '+card.opponent].filter(Boolean).join(' · ');
 find('[data-course]').textContent=venue;
 find('[data-headline]').textContent=card.headline;
 find('[data-highlight]').textContent=card.highlight;
 find('[data-close]').onclick=()=>dialog.close();
 const controller=new AbortController();
 dialog.addEventListener('close',()=>{controller.abort();dialog.remove();},{once:true});
 let imageFile=null;
 const prepareImage=(svg=null,credit='')=>void renderImage(card,venue,find('img'),svg,credit).then(file=>{
  if(controller.signal.aborted||!file)return;
  imageFile=file;find('[data-image]').hidden=false;
 }).catch(()=>{/* Text sharing remains available. */});
 find('[data-image]').onclick=()=>{
  if(!imageFile)return;
  const url=URL.createObjectURL(imageFile),link=document.createElement('a');
  link.href=url;link.download=imageFile.name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 find('[data-share]').onclick=async()=>{
  const text=matchbookText(card),status=find('[role="status"]');
  try{
   if(navigator.share){
    const files=imageFile&&navigator.canShare?.({files:[imageFile]})?[imageFile]:null;
    await navigator.share({title:'Dagger Country Club · The Matchbook',text,...(files?{files}:{})});
    return;
   }
   await navigator.clipboard.writeText(text);
   status.textContent='Recap copied.';
  }catch(error){
   if(error.name==='AbortError')return;
   const fallback=find('textarea');
   fallback.value=text;fallback.hidden=false;fallback.select();
   status.textContent='Select and copy your recap.';
  }
 };
 document.body.append(dialog);dialog.showModal();
 if(!card.selection){prepareImage();return;}
 void loadHoleSketch(card.selection,card.hole,{signal:controller.signal}).then(sketch=>{
  if(controller.signal.aborted)return;
  if(!sketch.annotations?.route){prepareImage();return;}
  const svg=find('svg');
  renderSharedHoleSketch(svg,sketch.shapes,sketch.annotations,{height:SKETCH_HEIGHT});
  const caption=find('figcaption');
  caption.textContent='No. '+card.hole+' · Yardage Book drawing. ';
  if(sketch.source){
   const credit=document.createElement('a');
   credit.href=sketch.source;credit.textContent=sketch.credit;caption.append(credit);
  }
  find('figure').hidden=false;
  prepareImage(svg,sketch.credit);
 }).catch(()=>{if(!controller.signal.aborted)prepareImage();});
}
