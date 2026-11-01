export function countScoredHoles(holes) {
 if (!Array.isArray(holes)) throw Error('Invalid holes');
 return holes.filter(h => Array.isArray(h) && h.every(Number.isInteger)).length;
}
