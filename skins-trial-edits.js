// Pure local Skins trial editing; revisions are immutable and re-scored on read.
export function changeSkinsTrialHole(state,holeNumber,scores){
 if(!state||!Array.isArray(state.holes)||state.holes.length>18||
  !Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18||
  holeNumber>state.holes.length+1)throw Error('Invalid hole edit');
 const n=state.names?.length;
 if(!Number.isInteger(n)||n<2||n>4||
  !Array.isArray(scores)||scores.length!==n||
  !scores.every(s=>Number.isInteger(s)&&s>=1&&s<=20))throw Error('Invalid golfer scores');
 const holes=state.holes.map(h=>[...h]);holes[holeNumber-1]=[...scores];
 return {...state,holes};
}
export function undoSkinsTrialHole(state){
 if(!state||!Array.isArray(state.holes)||!state.holes.length)throw Error('Nothing to undo');
 return {...state,holes:state.holes.slice(0,-1).map(h=>[...h])};
}
