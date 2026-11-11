// Reconcile a new tee-specific provider response with a previously validated
// scorecard for the SAME course + tee. Never infer absent yards or mix conflicts.
const clean=holes=>{
 if(!Array.isArray(holes)||holes.length>18)return null;
 const found=new Map();
 for(const hole of holes){
  if(!Number.isInteger(hole?.number)||hole.number<1||hole.number>18||
     !Number.isInteger(hole.par)||hole.par<3||hole.par>6||
     !Number.isInteger(hole.yards)||hole.yards<50||hole.yards>800||
     found.has(hole.number))return null;
  found.set(hole.number,hole);
 }
 return found;
};
export function reconcileProviderScorecard(incoming,previous){
 const now=clean(incoming),old=clean(previous);
 if(!now||!now.size)return Object.freeze({holes:[],mode:'invalid-provider',preserved:false});
 if(!old||!old.size)return Object.freeze({holes:[...now.values()].sort((a,b)=>a.number-b.number),mode:'provider-only',preserved:false});
 // A conflicting par OR tee yardage invalidates the entire merge, not just
 // the conflicted hole. Use the fresh provider response but never mix courses.
 for(const [n,h] of now){
  const prior=old.get(n);
  if(prior&&(prior.par!==h.par||prior.yards!==h.yards))
   return Object.freeze({holes:[...now.values()].sort((a,b)=>a.number-b.number),mode:'provider-conflict',preserved:false});
 }
 const combined=new Map(old);
 for(const [n,h] of now)combined.set(n,h);
 return Object.freeze({
  holes:[...combined.values()].sort((a,b)=>a.number-b.number),
  mode:combined.size>now.size?'provider-and-cache':'provider-only',
  preserved:combined.size>now.size
 });
}
