// Pure Starter's Desk search/ranking. No Firebase, storage or round state access.
// Consumers pass the already-approved catalog; this helper never creates courses.
const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function searchStarterDesk(courses, query, {limit=20, recentIds=[], favoriteIds=[]}={}) {
  if (!Array.isArray(courses)) return [];
  const term=normalize(query);
  if (term.length<2) return [];
  const recent=new Set(recentIds), favorites=new Set(favoriteIds);
  const unique=new Set();
  const results=[];
  for (const course of courses) {
    if (!course || typeof course.name!=='string' || !course.name.trim()) continue;
    const id=String(course.provider??'')+':'+String(course.providerCourseId??course.id??'');
    if (unique.has(id)) continue;
    unique.add(id);
    const name=normalize(course.name), region=normalize(course.region);
    const full=name+' '+region;
    const index=full.indexOf(term);
    if (index<0) continue;
    const exact=name===term ? 100 : name.startsWith(term) ? 70 : name.includes(term) ? 40 : 15;
    const bonus=(favorites.has(id)||favorites.has(course.providerCourseId)||favorites.has(course.id)?8:0)
      +(recent.has(id)||recent.has(course.providerCourseId)||recent.has(course.id)?4:0);
    results.push({course,rank:exact+bonus,position:index,id});
  }
  results.sort((a,b)=>b.rank-a.rank||a.position-b.position||a.course.name.localeCompare(b.course.name)||a.id.localeCompare(b.id));
  return results.slice(0,Math.max(0,Math.min(100,Number.isFinite(limit)?Math.trunc(limit):20))).map(x=>x.course);
}
