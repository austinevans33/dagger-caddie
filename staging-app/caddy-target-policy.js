// Shared target policy. Center green is a strategy, not a fabricated GPS point.
export const DEFAULT_AIM_TARGET='center-green';
export function buildCaddyTarget({remainingYards,lie,aimTarget=DEFAULT_AIM_TARGET}={}){
 const distance=typeof remainingYards==='number'?remainingYards:Number(String(remainingYards??'').trim());
 if(!Number.isFinite(distance)||distance<1||distance>700)return Object.freeze({target:DEFAULT_AIM_TARGET,distanceYards:null,distanceSource:'golfer-needed',instruction:'Ask the golfer for current distance to center green. Never use tee scorecard yards as remaining distance.'});
 if(aimTarget!==DEFAULT_AIM_TARGET)return null;
 return Object.freeze({target:DEFAULT_AIM_TARGET,distanceYards:Math.round(distance),distanceSource:'golfer-reported',lie:typeof lie==='string'?lie.slice(0,35):'',instruction:'Aim at the middle of the green unless a verified safety reason warrants a different target. Use golfer-reported remaining yardage, not scorecard total.'});
}
