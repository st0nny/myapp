import admin from "firebase-admin";
admin.initializeApp({credential:admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))});
const db=admin.firestore();
function nowIn(tz){
 const p=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:tz,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).formatToParts(new Date()).map(x=>[x.type,x.value]));
 return {date:`${p.year}-${p.month}-${p.day}`,mins:+p.hour*60+ +p.minute};
}
const users=await db.collection("users").listDocuments();
for(const u of users){
 const todos=(await u.collection("items").where("kind","==","todo").get()).docs;
 const due=todos.filter(d=>{
  const x=d.data();if(x.done||x.notified||!x.due||!x.time)return false;
  const n=nowIn(x.tz||"Asia/Seoul");if(x.due!==n.date)return false;
  const diff=n.mins-(+x.time.slice(0,2)*60+ +x.time.slice(3,5));
  return diff>=0&&diff<=180;
 });
 if(!due.length)continue;
 const tokens=(await u.collection("devices").get()).docs.map(d=>d.id);
 if(!tokens.length)continue;
 for(const d of due){
  const x=d.data();
  const r=await admin.messaging().sendEachForMulticast({tokens,data:{title:"⏰ "+x.text,body:x.memo||(x.time+" 할일 시간이에요")},webpush:{headers:{Urgency:"high",TTL:"3600"}}});
  for(let i=0;i<r.responses.length;i++){
   const c=r.responses[i].error?.code||"";
   if(/not-registered|invalid-argument|invalid-registration/.test(c))await u.collection("devices").doc(tokens[i]).delete();
  }
  await d.ref.update({notified:true});
  console.log("sent:",x.text);
 }
}
