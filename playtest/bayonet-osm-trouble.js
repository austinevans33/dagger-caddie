// Bayonet at Puppy Creek: qualitative LEFT/RIGHT trouble indicators only.
// Source: OpenStreetMap-derived OpenYardage course survey, dated 2026-09-12:
// https://openyardage.com/en/course/bayonet-at-puppy-creek.html
// OSM contributors · ODbL 1.0. Distances in that survey are computed from a
// reference tee and MUST NOT be shown as selected-tee carries or pin distances.
// Source does not consistently identify the hazard TYPE in text: do not call
// these bunkers, water, OB, or safe landing areas without mapped polygons.
const SIDES=Object.freeze([
 'LR','LR','LR','LR','LR','LR','LR','R','LR',
 'L','','LR','R','LR','LR','LR','LR','LR'
]);
export function bayonetOsmTrouble(selection,holeNumber){
 if(selection?.course?.provider!=='opengolfapi'||
    String(selection.course.name||'').trim().toLowerCase()!=='bayonet at puppy creek'||
    !Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)return null;
 const sides=SIDES[holeNumber-1];
 if(!sides)return null;
 return Object.freeze({
  left:sides.includes('L'),right:sides.includes('R'),
  source:'OpenStreetMap · OpenYardage course survey (2026-09-12)',
  // These are route-level hints, not observed positions in Dagger's drawing.
  label:sides==='LR'?'OSM survey marks trouble on both sides of this hole':
   sides==='L'?'OSM survey marks trouble left of the playing route':
   'OSM survey marks trouble right of the playing route'
 });
}
