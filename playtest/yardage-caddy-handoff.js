// UI-only, one-time handoff from verified Yardage Book facts to existing Caddy composer.
// Never sends an AI request or writes scoring, wagers, Firebase or a target-distance field.
const KEY='dcc_yardage_caddy_handoff_v1';
const MAX_AGE=20*60*1000;
export function composeHoleQuestion({courseName,teeName,holeNumber,par,yards}={}){
 if(!Number.isInteger(holeNumber)||holeNumber<1||holeNumber>18)return null;
 const safeText=(v,max)=>typeof v==='string'?v.trim().slice(0,max).replace(/[\r\n]+/g,' '):'';
 const course=safeText(courseName,100),tee=safeText(teeName,50);
 if(!course||!tee)return null;
 const verified=Number.isInteger(par)&&par>=3&&par<=6&&Number.isInteger(yards)&&yards>=50&&yards<=800;
 const detail=verified?'Par '+par+', '+yards+' yards from the '+tee+' tee (scorecard tee distance, NOT my current distance to the pin).':'Hole details not yet verified for my selected tee.';
 return 'I am playing '+course+', hole '+holeNumber+', '+tee+' tees. '+detail+' Help me plan a safe target and club strategy. Please ask me for current distance, lie, pin position and wind before giving a specific club or carry.';
}
export function saveHoleQuestion(session,question,now=Date.now()){
 if(typeof question!=='string'||question.length<20||question.length>600||!Number.isSafeInteger(now))return false;
 try{session.setItem(KEY,JSON.stringify({version:1,question,createdAt:now}));return true}catch{return false}
}
export function takeHoleQuestion(session,now=Date.now()){
 try{
  const value=session.getItem(KEY);session.removeItem(KEY);
  if(!value||value.length>900)return null;
  const data=JSON.parse(value);
  return data?.version===1&&Number.isSafeInteger(data.createdAt)&&now>=data.createdAt&&now-data.createdAt<=MAX_AGE&&typeof data.question==='string'&&data.question.length>=20&&data.question.length<=600?data.question:null;
 }catch{return null}
}
