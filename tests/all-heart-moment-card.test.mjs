import test from 'node:test';
import assert from 'node:assert/strict';
import {mountAllHeartMoment} from '../playtest/all-heart-moment-card.js';
class Element {
 constructor(tag,doc){this.tag=tag;this.ownerDocument=doc;this.children=[];this.listeners={};this.textContent='';this.attributes={};}
 replaceChildren(...children){this.children=children}
 append(...children){this.children.push(...children)}
 setAttribute(k,v){this.attributes[k]=v}
 addEventListener(k,fn){this.listeners[k]=fn}
 click(){this.listeners.click?.()}
}
function setup(){const doc={createElement(tag){return new Element(tag,doc)}};return new Element('root',doc)}
const base={courseId:'kings-grant-fayetteville-nc',holeNumber:6,par:4,strokeIndex:15,moneyRoomPlayers:3};
test('dare requires explicit action and does not create a bet',()=>{
 const root=setup();let accepted=0;let dismissed=0;
 const moment=mountAllHeartMoment({root,context:base,onAccept:()=>accepted++,onDismiss:()=>dismissed++});
 assert.equal(moment.type,'dare');assert.equal(accepted,0);assert.equal(dismissed,0);
 const card=root.children[0];assert.equal(card.attributes['aria-label'],'All Heart Moment');
 card.children.at(-1).children[0].click();
 assert.equal(accepted,1);assert.equal(root.children.length,0);
});
test('dismissal invokes callback without accepting',()=>{
 const root=setup();let dismissed=null;
 mountAllHeartMoment({root,context:base,onDismiss:m=>dismissed=m.key});
 root.children[0].children.at(-1).children[1].click();
 assert.equal(dismissed,'kings-grant-fayetteville-nc:6');
 assert.equal(root.children.length,0);
});
test('disabled and unverified moments render nothing',()=>{
 const root=setup();assert.equal(mountAllHeartMoment({root,context:{...base,enabled:false}}),null);
 assert.equal(root.children.length,0);
});
test('verified legend source opens safely',()=>{
 const root=setup();
 const historicalChallenge={verified:true,courseId:base.courseId,holeNumber:6,player:'Verified player',event:'Verified event',strokes:4,sourceUrl:'https://example.org/result'};
 const m=mountAllHeartMoment({root,context:{...base,historicalChallenge}});
 assert.equal(m.type,'legend');
 const source=root.children[0].children.find(x=>x.tag==='a');
 assert.equal(source.rel,'noopener noreferrer');assert.equal(source.href,historicalChallenge.sourceUrl);
});
