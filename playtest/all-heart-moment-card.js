import {chooseAllHeartMoment} from './all-heart-moments.js';

// A self-contained, opt-in presentation adapter. No score, wager, or Firebase
// writes. Host supplies only source-verified context and a round-scoped history.
export function mountAllHeartMoment({root,context,history={},onAccept=()=>{},onDismiss=()=>{}}={}){
 if(!root || typeof root.replaceChildren!=='function') return null;
 root.replaceChildren();
 const moment=chooseAllHeartMoment(context,history);
 if(!moment)return null;
 const doc=root.ownerDocument;
 const card=doc.createElement('section');
 card.className='dcc-all-heart-moment';
 card.setAttribute('aria-label','All Heart Moment');
 const eyebrow=doc.createElement('small');eyebrow.textContent='ALL HEART MOMENT';
 const title=doc.createElement('h3');title.textContent=moment.title;
 const copy=doc.createElement('p');copy.textContent=moment.description;
 card.append(eyebrow,title,copy);
 if(moment.sourceUrl){
  const source=doc.createElement('a');
  source.href=moment.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';
  source.textContent='View verified source';
  card.append(source);
 }
 const actions=doc.createElement('div');actions.className='dcc-all-heart-actions';
 const accept=doc.createElement('button');accept.type='button';
 accept.textContent=moment.type==='dare'?'Open Ticket Window':'Take the challenge';
 accept.addEventListener('click',()=>{root.replaceChildren();onAccept(moment)});
 const dismiss=doc.createElement('button');dismiss.type='button';
 dismiss.textContent='Not this hole';
 dismiss.addEventListener('click',()=>{root.replaceChildren();onDismiss(moment)});
 actions.append(accept,dismiss);card.append(actions);root.append(card);
 return moment;
}
