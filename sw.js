const C="my-space-v2";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(clients.claim()));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request)));
});
// FCM 푸시(data 메시지) 수신 -> 알림 표시
self.addEventListener("push",e=>{
 let j={};try{j=e.data.json();}catch(x){}
 const d=j.data||j.notification||j;
 e.waitUntil(self.registration.showNotification(d.title||"나의 공간",{body:d.body||"",icon:"icon-192.png",badge:"icon-192.png",tag:d.title}));
});
self.addEventListener("notificationclick",e=>{
 e.notification.close();
 e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>l.length?l[0].focus():clients.openWindow("./")));
});
