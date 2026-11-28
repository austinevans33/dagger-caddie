import {mountAllHeartMoment} from './all-heart-moment-card.js';
import {allHeartRoundOffer, respondToAllHeart, completeAllHeartHole, reconcileAllHeartScores, allHeartClubRecord, ALL_HEART_DISABLED} from './all-heart-journal.js';
import {soloMatchbook, saveMatchbookRound} from './matchbook.js';

export function mountAllHeartInRound({doc, storage, root, record}) {
  const style=doc.createElement('style');
  style.textContent=`#dccAllHeartMoment:empty{display:none}.dcc-all-heart-moment{margin:10px 0;padding:14px;border:1px solid #a88a56;border-radius:12px;background:#efe3c8;color:#193b2a}.dcc-all-heart-moment small{font-size:10px;font-weight:800;letter-spacing:.14em}.dcc-all-heart-moment h3{margin:6px 0;font:700 19px Georgia,serif}.dcc-all-heart-moment p{margin:6px 0 10px}.dcc-all-heart-actions{display:flex;gap:8px;flex-wrap:wrap}.dcc-all-heart-actions button{min-height:44px;border-radius:9px;padding:8px 12px;background:#173d2c;color:#fff;border:0}.dcc-all-heart-actions button+button{background:transparent;color:#173d2c;border:1px solid #9c865f}`;
  doc.head.append(style);
  const preference=doc.createElement('label'),toggle=doc.createElement('input');
  toggle.type='checkbox';
  preference.append(toggle,doc.createTextNode(' All Heart Moments'));
  record.append(preference);
  const list=doc.createElement('ul');record.append(list);
  let current;
  function refresh(active,card) {
    current={active,card};
    root.replaceChildren();
    try {
      toggle.checked=storage.getItem(ALL_HEART_DISABLED)!=='true';
      reconcileAllHeartScores(storage,card);
      const entries=allHeartClubRecord(storage);
      list.replaceChildren(...entries.slice(0,12).map(entry=>{
        const item=doc.createElement('li');
        item.textContent=entry.course+' · Hole '+entry.hole+' · '+entry.receipt.headline+' '+entry.receipt.strokes+' strokes';
        return item;
      }));
      const offer=allHeartRoundOffer(storage,active,card);
      if(!offer)return;
      if(offer.state==='accepted'){
        const panel=doc.createElement('section');
        panel.className='dcc-all-heart-moment';
        panel.setAttribute('aria-label','Accepted All Heart challenge');
        const title=doc.createElement('strong');title.textContent=offer.moment.title;
        const target=doc.createElement('p');target.textContent='Hole '+offer.hole+' · Target '+offer.moment.targetStrokes+' strokes';
        panel.append(title,target);
        root.append(panel);
        return;
      }
      const answer=accepted=>{
        try {
          if(respondToAllHeart(storage,current.card,offer,accepted)) refresh(current.active,current.card);
        } catch {/* Score entry is independent. */}
      };
      mountAllHeartMoment({root,offeredMoment:offer.moment,onAccept:()=>answer(true),onDismiss:()=>answer(false)});
    } catch {/* All Heart is optional when storage is unavailable. */}
  }
  toggle.addEventListener('change',()=>{
    try {storage.setItem(ALL_HEART_DISABLED,String(!toggle.checked));refresh(current?.active,current?.card);} catch {}
  });
  return {refresh, scored(active,card,hole,scorecard){
    try {
      completeAllHeartHole(storage,card,hole);
      saveMatchbookRound(storage,soloMatchbook(active,card,scorecard));
    } catch {/* The score was committed before updating the Club Record. */}
  }};
}
