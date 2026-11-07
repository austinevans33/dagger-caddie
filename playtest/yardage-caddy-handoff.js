// UI-only, one-time handoff from verified Yardage Book facts to existing Caddy composer.
// Never sends an AI request or writes scoring, wagers, Firebase or a target-distance field.
const KEY='dcc_yardage_caddy_handoff_v1';
const MAX_AGE=20*60*1000;
export function composeHoleQuestion({courseName,teeName,holeNumber,par,yards,trouble}={}){
 if(!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)return null;
 const safeText=(v,max)=>typeof v==='string'?v.trim().slice(0,Math.max(0,max)).replace(/[\r\n]+/g,' '):'';
 const course=safeText(courseName,100),tee=safeText(teeName,50);
 if(!course||!tee)return null;
 const verified=Number.isInteger(par)&&par>=3&&par<=6&&Number.isInteger(yards)&&yards>=50&&yards<=800;
 const detail=verified?'Par '+par+', '+yards+' yards from the '+tee+' tee (scorecard tee distance, NOT my current distance to the pin).':'Hole details not yet verified for my selected tee.';
 const intro='I am playing '+course+', hole '+holeNumber+', '+tee+' tees. '+detail;
 const request=' Help me plan a safe target and club strategy. Please ask me for current distance, lie, pin position and wind before giving a specific club or carry.';
 const mapped=safeText(trouble,Math.min(135,600-intro.length-request.length-30));
 const sketch=mapped?' My approximate book shows '+mapped+'.':'';
 return intro+sketch+request;
}
export function saveHoleQuestion(session,question,now=Date.now(),context=null){
 if(typeof question!=='string'||question.length<20||question.length>600||!Number.isSafeInteger(now))return false;
 try{session.setItem(KEY,JSON.stringify({version:1,question,createdAt:now,context:normalizeContext(context)}));return true}catch{return false}
}
function normalizeContext(context){
 const {selectionKey,holeNumber}=context||{};
 return typeof selectionKey==='string'&&selectionKey.length<=250&&Number.isInteger(holeNumber)&&holeNumber>=1&&holeNumber<=18
  ?{selectionKey,holeNumber}:null;
}
export function takeHoleQuestion(session,now=Date.now(),{withContext=false}={}){
 try{
  const value=session.getItem(KEY);session.removeItem(KEY);
  if(!value||value.length>1200)return null;
  const data=JSON.parse(value);
  return data?.version===1&&Number.isSafeInteger(data.createdAt)&&now>=data.createdAt&&now-data.createdAt<=MAX_AGE&&typeof data.question==='string'&&data.question.length>=20&&data.question.length<=600?(withContext?{question:data.question,context:normalizeContext(data.context)}:data.question):null;
 }catch{return null}
}
