import {twoPlayerAction} from './two-player-action.js';
// Local-only weekend match recap: no invented strokes, no payment collection.
export function weekendMatchReport({names,holes,games}){
 const action=twoPlayerAction({names,holes,games});
 const counted=Array.isArray(holes)?holes.filter(h=>Array.isArray(h)).length:0;
 const winner=action.balances[0]>0?0:action.balances[1]>0?1:-1;
 const amount=n=>'$'+(Math.abs(n)/100).toFixed(2);
 const line=winner<0?'The money table is level. Nobody bought dinner.':
   names[winner]+' takes the clubhouse bragging rights at +'+amount(action.balances[winner])+'.';
 return {title:'The Weekend Grudge Match',holesRecorded:counted,
  status:action.completed?'FINAL':'IN PLAY',balances:action.balances.slice(),
  games:action.results,headline:line,canSettle:action.completed,
  disclaimer:action.completed?'All configured game results calculated from recorded scores.':
  'Scores or game legs remain outstanding. No final payout instructions.'};
}
