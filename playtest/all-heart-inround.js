import {installAllHeartBridge} from './all-heart-bridge.js';
import {installAllHeartActions} from './all-heart-actions.js';
import {installAllHeartScoreEvents} from './all-heart-score-events.js';

// Progressive enhancement only. The existing round engine remains the sole
// authority for scores, verified hole context, Ghost and wager state.
export function mountAllHeartInRound(doc=globalThis.document){
 if(!doc?.createElement || doc.getElementById('dccAllHeartMoment'))return;
 const games=doc.getElementById('gamesMenu');
 if(!games)return;
 const style=doc.createElement('style');
 style.textContent=`#dccAllHeartMoment:empty{display:none}.dcc-all-heart-moment{margin:10px 0;padding:14px;border:1px solid #a88a56;border-radius:12px;background:#efe3c8;color:#193b2a}.dcc-all-heart-moment small{font-size:10px;font-weight:800;letter-spacing:.14em}.dcc-all-heart-moment h3{margin:6px 0;font:700 19px Georgia,serif}.dcc-all-heart-moment p{margin:6px 0 10px}.dcc-all-heart-actions{display:flex;gap:8px;flex-wrap:wrap}.dcc-all-heart-actions button{min-height:44px;border-radius:9px;padding:8px 12px;background:#173d2c;color:#fff;border:0}.dcc-all-heart-actions button+button{background:transparent;color:#173d2c;border:1px solid #9c865f}`;
 doc.head.append(style);
 const root=doc.createElement('div');root.id='dccAllHeartMoment';
 root.setAttribute('aria-live','polite');
 games.prepend(root);
 installAllHeartBridge({document:doc});
 installAllHeartActions({document:doc});
 installAllHeartScoreEvents({doc,storage:globalThis.localStorage});
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mountAllHeartInRound(),{once:true});
 else mountAllHeartInRound();
}
