'use strict';
const SAVE='obyavka_v1';
let S=null;
const U={tab:'home',cat:null,q:'',itemId:null,chatId:null,modal:null,favOnly:false};
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const r50=n=>Math.max(50,Math.round(n/50)*50);
const r10=n=>Math.max(10,Math.round(n/10)*10);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const clone=o=>JSON.parse(JSON.stringify(o));
const fmt=n=>Math.round(n).toLocaleString('ru-RU').replace(/ | /g,' ')+' ₽';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wpick=(vals,w)=>{let t=w.reduce((a,b)=>a+b),r=Math.random()*t;for(let i=0;i<vals.length;i++){if((r-=w[i])<0)return vals[i]}return vals[0]};
const fill=(s,o)=>s.replace(/\{(\w+)\}/g,(m,k)=>o[k]!==undefined?o[k]:m);
const RANKS=[[0,'Новичок'],[20000,'Барыга'],[50000,'Перекуп'],[150000,'Опытный перекуп'],[400000,'Автодилер'],[1000000,'Король барахолки']];
const GOAL=1000000;

function save(){try{localStorage.setItem(SAVE,JSON.stringify(S))}catch(e){}}
function load(){try{const j=localStorage.getItem(SAVE);if(j){S=JSON.parse(j);S.chats.forEach(c=>{c.typing=0;c._qe=0});return true}}catch(e){}return false}
function newGame(){
  S={money:15000,day:1,hour:9,rep:50,nid:1,clock:0,stats:{bought:0,sold:0,profit:0,avoided:0,lost:0},market:[],inv:[],ads:[],chats:[],favs:[],pending:[],won:false};
  for(let i=0;i<26;i++)S.market.push(genListing());
  save();
}

// ---------- генерация ----------
function genItem(){
  const [cat,name,emoji,base,defs]=pick(CATALOG);
  const cond=wpick([0,1,2,3],[1,4,4,2]);
  const clean=r10(base*[1,.85,.68,.5][cond]*rnd(.92,1.08));
  let defect=null;
  if(Math.random()<(cond===3?.55:.35)){const cost=r50(clean*rnd(.12,.3));defect={text:pick(defs),cost,fix:r50(cost*rnd(.5,.7))}}
  return {id:S.nid++,cat,name,emoji,base,cond,clean,value:clean-(defect?defect.cost:0),defect,paid:0,hue:ri(0,360),est:r50(clean*rnd(.93,1.07))};
}
function genListing(){
  const item=genItem();
  const scam=Math.random()<.12;
  const pers=scam?'скам':pick(['вежливый','вежливый','жадный','срочно','хам','хитрый']);
  let ask;
  if(scam)ask=r50(item.clean*rnd(.5,.7));
  else{const r=Math.random();ask=r50(r<.2?item.value*rnd(.55,.82):r<.65?item.value*rnd(.92,1.15):item.value*rnd(1.2,1.6))}
  const newbie=scam||Math.random()<.07;
  const seller={name:pick(NAMES),avatar:pick(FACES),pers,rev:newbie?ri(0,3):ri(4,180),rating:newbie?(Math.random()<.5?0:5):+rnd(4.3,5).toFixed(1),since:newbie?'на сайте с этого месяца':pick(['на сайте с 2019','на сайте с 2021','на сайте с 2023','на сайте с 2017'])};
  const discl=!scam&&!!item.defect&&pers!=='хитрый'&&Math.random()<.45;
  let desc=`${item.name}. Состояние: ${COND[item.cond].toLowerCase()}. ${pick(REASONS)}`;
  if(discl)desc+=` Дефект: ${item.defect.text}.`;
  if(scam)desc+=' Отправка только по предоплате!';
  return {id:S.nid++,item,ask,seller,posted:S.day,place:pick(PLACES),desc,discl,min:r50(ask*PM[pers]),photos:ri(2,4)};
}
const rankOf=w=>{let r=RANKS[0][1];for(const [n,t] of RANKS)if(w>=n)r=t;return r};
function netWorth(){return S.money+S.inv.reduce((a,i)=>a+i.value,0)+S.ads.filter(a=>a.status==='active').reduce((a,x)=>a+x.item.value,0)+S.pending.reduce((a,p)=>a+p.item.value,0)}

// ---------- разбор текста ----------
function parse(t){
  const s=t.toLowerCase().replace(/(\d)[  ](?=\d{3}(?!\d))/g,'$1');
  const nums=[];let m;
  const re=/(\d+(?:[.,]\d+)?)(?:\s*(к|k|тыс[а-яё]*|тр)(?![а-яёa-z]))?/g;
  while((m=re.exec(s))){let n=parseFloat(m[1].replace(',','.'));if(m[2])n*=1000;nums.push(Math.round(n))}
  const has=r=>r.test(s);
  return {s,nums,greet:has(/привет|здравств|добр(ый|ое|ого)|хай/),avail:has(/актуал|продаё|продае|в наличии/),
    cond:has(/состоян|царап|дефект|проблем|работает|ремонт|вскрыв|бит[аыо]|полом|скол|трещин|батаре|акк/),
    bargain:has(/торг|последн|уступ|скин|скидк|дешевл|сбав|минимал/),deliv:has(/доставк|отправ|почт|сдэк|cdek|авито/),
    meet:has(/встреч|забра|приед|посмотр|осмотр|адрес|где|когда|сегодня/),bye:has(/не надо|не буду|передумал|отбой|не актуаль|до свидан/),thanks:has(/спасибо|благодар/)};
}

// ---------- чаты ----------
function addMsg(c,from,text,actions){
  c.msgs.push({from,text,h:S.hour,actions:actions||null});c.last=++S.clock;
  if(from==='them'&&U.chatId!==c.id){c.unread=(c.unread||0)+1;ping()}
  save();notify();
}
function reply(c,fn){
  const now=Date.now(),start=Math.max(now,c._qe||0),delay=ri(700,1500);
  c._qe=start+delay;c.typing=(c.typing||0)+1;notify();
  setTimeout(()=>{c.typing=Math.max(0,c.typing-1);fn();},c._qe-now);
}
function startBuyChat(lid){
  let c=S.chats.find(c=>c.type==='buy'&&c.lid===lid);if(c)return c;
  const L=S.market.find(l=>l.id===lid);if(!L)return null;
  c={id:S.nid++,type:'buy',lid,L:clone(L),status:'open',cur:L.ask,patience:PAT[L.seller.pers],agreed:null,msgs:[],unread:0,last:++S.clock,known:L.discl,trip:false,discounted:false};
  S.chats.push(c);save();return c;
}
function botBuy(c,text){
  const L=c.L,s=L.seller,it=L.item,T=TX[s.pers],P=parse(text);
  const say=(t,a)=>reply(c,()=>addMsg(c,'them',t,a));
  if(c.status==='dead'||c.status==='done')return;
  if(P.bye){c.status='dead';say(pick(T.bye));return}
  const off=P.nums.find(n=>n>=L.ask*.2&&n<=L.ask*1.6);
  const scamPay=p=>{c.status='agreed';c.agreed=p;say(fill(pick(T.pay),{p:fmt(p)}),[{k:'pay',v:p,t:'💸 Перевести '+fmt(p)},{k:'leave',t:'Отказаться'}])};
  if(s.pers==='скам'){
    if(off||P.meet||P.deliv||c.status==='agreed'){scamPay(c.agreed||Math.min(off||L.ask,L.ask));return}
    if(P.cond){say(pick(T.cond));return}
    if(P.avail){say(pick(T.avail));return}
    if(P.greet){say(pick(T.greet));return}
    say(pick(T.fallback));return;
  }
  const agree=p=>{c.status='agreed';c.agreed=p;say(fill(pick(T.agree),{p:fmt(p)}),[{k:'meet',t:'🚶 Поехать смотреть'}])};
  if(c.status==='agreed'){say(fill(pick(T.meet),{p:fmt(c.agreed)}),[{k:'meet',t:'🚶 Поехать смотреть'}]);return}
  const counter=()=>{
    c.patience--;
    c.cur=Math.max(L.min,r50(c.cur-(c.cur-L.min)*.45));
    say(fill(pick(T.counter),{p:fmt(c.cur)}));
    if(c.patience<=0){c.status='dead';say(pick(T.quit))}
  };
  if(off){
    if(off>=L.ask)agree(L.ask);
    else if(off>=L.min||off>=c.cur)agree(off);
    else if(off/L.ask<.5){c.patience--;say(pick(T.insult));if(c.patience<=0){c.status='dead';say(pick(T.quit))}}
    else counter();
    return;
  }
  if(P.bargain){counter();return}
  if(P.cond){
    if(it.defect&&!(s.pers==='хитрый'&&Math.random()<.7)&&!c.known){c.known=true;say(fill(pick(T.condD),{d:it.defect.text}))}
    else if(it.defect&&c.known)say(fill(pick(T.condD),{d:it.defect.text}));
    else say(fill(pick(T.cond),{c:COND[it.cond]}));
    return;
  }
  if(P.meet){agree(c.cur);return}
  if(P.deliv){say(pick(T.deliv));return}
  if(P.avail){say(pick(T.avail));return}
  if(P.greet){say(pick(T.greet));return}
  if(P.thanks){say(pick(T.thanks));return}
  say(pick(T.fallback));
}
function spawnBuyer(ad){
  const pers=wpick(['вежливый','торгаш','хам','спешит','скам'],[3,3,2,2,1.1]);
  const it=ad.item;
  const perceived=(ad.disclosed||!it.defect)?it.value:it.clean;
  const max=r50(perceived*rnd(.88,1.14)*(pers==='спешит'?1.05:pers==='хам'?.92:1));
  const buyer={name:pick(NAMES),avatar:pick(FACES),pers};
  const c={id:S.nid++,type:'sell',aid:ad.id,ad:null,buyer,max,patience:pers==='хам'?2:pers==='скам'?9:4,status:'open',offer:0,agreed:null,msgs:[],unread:0,last:++S.clock,admitted:false,lied:false,sm:null};
  const T=TXB[pers];
  let offer;
  if(pers==='вежливый')offer=ad.price<=max?ad.price:r50(Math.min(max,ad.price*.9));
  else if(pers==='торгаш')offer=r50(Math.min(max,ad.price*rnd(.62,.8)));
  else if(pers==='хам')offer=r50(Math.min(max,ad.price*rnd(.5,.65)));
  else if(pers==='спешит')offer=r50(Math.min(max,ad.price*.95));
  else offer=ad.price;
  c.offer=offer;S.chats.push(c);
  let txt=fill(pick(T.open),{o:fmt(offer),n:it.name});
  if(pers==='скам')addMsg(c,'them',txt,[{k:'code',t:'📩 Отправить код'},{k:'block',t:'🚫 Заблокировать'}]);
  else addMsg(c,'them',txt,pers==='вежливый'||pers==='спешит'?[{k:'accept',v:offer,t:'✅ Продать за '+fmt(offer)}]:null);
  toast('💬 Новое сообщение по «'+it.name+'»');
}
function adOf(c){return S.ads.find(a=>a.id===c.aid)}
function botSell(c,text){
  const ad=adOf(c);if(!ad||ad.status!=='active')return;
  if(c.status==='dead'||c.status==='done')return;
  const T=TXB[c.buyer.pers],P=parse(text),it=ad.item;
  const say=(t,a)=>reply(c,()=>addMsg(c,'them',t,a));
  if(c.buyer.pers==='скам'){say(pick(T.fallback),[{k:'code',t:'📩 Отправить код'},{k:'block',t:'🚫 Заблокировать'}]);return}
  if(P.bye){c.status='dead';say(pick(T.quit));return}
  // ответ про состояние
  if(it.defect&&!ad.disclosed&&!c.admitted){
    if(/(есть|нюанс|дефект|царап|скол|трещин|проблем|небольш|мелк)/.test(P.s)&&!/(нет|без)\s/.test(P.s)){
      c.admitted=true;c.max=r50(Math.min(c.max,Math.max(it.value,c.max-it.defect.cost)));
      if(c.offer>c.max)c.offer=c.max;
    }else if(/(нет|без|идеал|отлично|как нов|исправн|всё работает|все работает|не бит)/.test(P.s)){c.lied=true}
  }
  const agree=p=>{c.status='agreed';c.agreed=p;say(fill(pick(T.agree),{p:fmt(p)}),[{k:'meet',t:'🤝 Встретиться'}])};
  if(c.status==='agreed'){say(pick(T.meet),[{k:'meet',t:'🤝 Встретиться'}]);return}
  const off=P.nums.find(n=>n>=ad.price*.2&&n<=ad.price*1.6);
  if(off){
    if(off<=c.max)agree(off);
    else{
      c.patience--;
      if(c.patience<=0){c.status='dead';say(pick(T.quit));return}
      const np=r50(Math.min(c.max,c.offer+(c.max-c.offer)*.5));
      c.offer=Math.max(c.offer,np);
      say(fill(pick(T.raise),{p:fmt(c.offer)}),[{k:'accept',v:c.offer,t:'✅ Продать за '+fmt(c.offer)}]);
    }
    return;
  }
  if(P.bargain){
    c.patience--;
    if(c.patience<=0){c.status='dead';say(pick(T.quit));return}
    c.offer=Math.max(c.offer,r50(Math.min(c.max,c.offer+(c.max-c.offer)*.5)));
    say(fill(pick(T.raise),{p:fmt(c.offer)}),[{k:'accept',v:c.offer,t:'✅ Продать за '+fmt(c.offer)}]);return;
  }
  if(P.meet){if(ad.price<=c.max)agree(ad.price);else say(fill(pick(T.raise),{p:fmt(c.offer)}),[{k:'accept',v:c.offer,t:'✅ Продать за '+fmt(c.offer)}]);return}
  if(P.thanks){say(pick(T.thanks));return}
  say(pick(T.fallback),c.offer?[{k:'accept',v:c.offer,t:'✅ Продать за '+fmt(c.offer)}]:null);
}
function sendMsg(c,text){
  text=text.trim();if(!text)return;
  addMsg(c,'me',text);
  if(c.type==='buy')botBuy(c,text);else botSell(c,text);
}
function chatAction(c,i){
  const m=c.msgs[i];if(!m||!m.actions)return;
  const a=m.actions.find(x=>!x.used);
  return m;
}
function doAction(c,mi,ai){
  const m=c.msgs[mi],a=m&&m.actions&&m.actions[ai];if(!a||m.used)return;
  if(c.status==='dead'||c.status==='done'){toast('Диалог закрыт');return}
  const k=a.k;
  if(k==='meet'){if(c.type==='buy')openInspect(c);else openSellMeet(c);return}
  m.used=true;
  if(k==='pay'){
    if(S.money<a.v){m.used=false;toast('Не хватает денег');return}
    S.money-=a.v;S.stats.lost++;c.status='dead';
    addMsg(c,'me','Перевёл '+fmt(a.v));
    reply(c,()=>{addMsg(c,'sys','⚠️ Продавец удалил объявление и заблокировал вас. Это был мошенник — деньги потеряны.');});
    toast('🚨 Вас обманули: −'+fmt(a.v));
  }else if(k==='leave'){c.status='dead';addMsg(c,'me','Нет, спасибо, откажусь.');addMsg(c,'sys','Вы вышли из диалога');S.stats.avoided++;toast('🛡️ Разумно: схема мошенника распознана')}
  else if(k==='code'){
    const loss=Math.min(S.money,ri(1500,4500));S.money-=loss;S.stats.lost++;c.status='dead';
    addMsg(c,'me','Код: '+ri(1000,9999));
    addMsg(c,'sys','⚠️ Мошенник получил доступ к вашей карте. Списано '+fmt(loss)+'.');toast('🚨 Вас обманули: −'+fmt(loss));
  }else if(k==='block'){c.status='dead';S.stats.avoided++;S.rep=clamp(S.rep+1,0,100);addMsg(c,'sys','🛡️ Вы заблокировали подозрительного пользователя');toast('🛡️ Мошенник заблокирован')}
  else if(k==='accept'){
    c.status='agreed';c.agreed=a.v;addMsg(c,'me','Договорились, '+fmt(a.v));
    reply(c,()=>addMsg(c,'them',fill(pick(TXB[c.buyer.pers].agree),{p:fmt(a.v)}),[{k:'meet',t:'🤝 Встретиться'}]));
  }
  save();notify();
}

// ---------- сделки ----------
function openInspect(c){
  if(!c.trip){if(S.money<100){toast('Нет денег даже на дорогу');return}S.money-=100;c.trip=true;toast('🚕 Дорога −100 ₽')}
  U.modal={type:'inspect',cid:c.id};save();notify();
}
function buyDeal(c){
  const p=c.agreed;if(S.money<p){toast('Не хватает денег: нужно '+fmt(p));return}
  S.money-=p;const it=clone(c.L.item);it.paid=p;S.inv.push(it);
  S.market=S.market.filter(l=>l.id!==c.lid);
  S.chats.filter(x=>x.type==='buy'&&x.lid===c.lid&&x!==c).forEach(x=>{if(x.status!=='done'){x.status='dead';x.msgs.push({from:'sys',text:'Товар продан другому',h:S.hour})}});
  c.status='done';S.stats.bought++;
  addMsg(c,'sys','✅ Вы купили «'+it.name+'» за '+fmt(p));
  U.modal=null;toast('🛍️ Куплено: '+it.name);save();notify();
}
function askDiscount(c){
  const it=c.L.item;if(!it.defect||c.discounted)return;c.discounted=true;
  const ok=Math.random()<DISC[c.L.seller.pers];
  if(ok){const np=Math.max(r50(c.agreed*.6),c.agreed-r50(it.defect.cost*.9));c.agreed=np;toast('Продавец скинул до '+fmt(np))}
  else toast('Продавец отказался уступать');
  save();notify();
}
function buyDelivery(lid){
  const L=S.market.find(l=>l.id===lid);if(!L)return;const p=L.ask+250;
  if(S.money<p){toast('Не хватает денег: нужно '+fmt(p));return}
  if(L.seller.pers==='скам'){toast('Доставка недоступна для этого объявления');return}
  S.money-=p;const it=clone(L.item);it.paid=p;
  S.pending.push({item:it,arrive:S.day+1});S.market=S.market.filter(l=>l.id!==lid);
  S.stats.bought++;toast('📦 Заказ оформлен, придёт завтра');closeItem();save();notify();
}
function postAd(itemId,price,disclosed,promo){
  const i=S.inv.findIndex(x=>x.id===itemId);if(i<0)return;
  if(promo){if(S.money<300){toast('Нет 300 ₽ на продвижение');return}S.money-=300}
  if(!(price>0)){toast('Укажите цену');return}
  const item=S.inv.splice(i,1)[0];
  S.ads.push({id:S.nid++,item,price:r50(price),disclosed:!!(disclosed&&item.defect),promo:!!promo,posted:S.day,status:'active',views:0});
  U.modal=null;U.tab='sell';save();notify();toast('📢 Объявление опубликовано');
}
function removeAd(aid,silent){
  const i=S.ads.findIndex(a=>a.id===aid);if(i<0)return;
  const ad=S.ads[i];S.ads.splice(i,1);S.inv.push(ad.item);
  S.chats.filter(c=>c.type==='sell'&&c.aid===aid&&c.status!=='done'&&c.status!=='dead').forEach(c=>{c.status='dead';c.msgs.push({from:'sys',text:'Объявление снято',h:S.hour})});
  if(!silent)toast('Объявление снято');save();notify();
}
function repairItem(id){
  const it=S.inv.find(x=>x.id===id);if(!it||!it.defect)return;
  if(S.money<it.defect.fix){toast('Не хватает денег на ремонт');return}
  S.money-=it.defect.fix;it.value=it.clean;it.defect=null;it.paid+=0;toast('🔧 Отремонтировано');save();notify();
}
function openSellMeet(c){
  const ad=adOf(c);if(!ad)return;
  if(!c.sm){
    const it=ad.item;let found=false;
    if(it.defect&&!ad.disclosed&&!c.admitted)found=Math.random()<.75;
    c.sm={found,price:c.agreed,lied:found&&c.lied};
    if(found){c.sm.price=Math.max(r50(c.agreed*.6),c.agreed-r50(it.defect.cost))}
  }
  U.modal={type:'sellmeet',cid:c.id};save();notify();
}
function sellDeal(c){
  const ad=adOf(c);if(!ad)return;const p=c.sm.price;
  S.money+=p;S.stats.sold++;S.stats.profit+=p-ad.item.paid;
  if(c.sm.lied)S.rep=clamp(S.rep-3,0,100);else S.rep=clamp(S.rep+2,0,100);
  S.ads=S.ads.filter(a=>a.id!==ad.id);
  S.chats.filter(x=>x.type==='sell'&&x.aid===ad.id&&x!==c).forEach(x=>{if(x.status!=='done'){x.status='dead';x.msgs.push({from:'sys',text:'Товар уже продан',h:S.hour})}});
  c.status='done';c.itemName=ad.item.name;c.msgs.push({from:'sys',text:'✅ Сделка: «'+ad.item.name+'» продан за '+fmt(p),h:S.hour});c.last=++S.clock;
  U.modal=null;toast('💰 Продано за '+fmt(p));checkWin();save();notify();
}
function declineSell(c){
  const ad=adOf(c);c.status='dead';c.msgs.push({from:'sys',text:'Сделка сорвалась',h:S.hour});c.last=++S.clock;
  if(c.sm&&c.sm.lied)S.rep=clamp(S.rep-3,0,100);
  U.modal=null;save();notify();
}
function checkWin(){if(!S.won&&netWorth()>=GOAL){S.won=true;U.modal={type:'win'}}}

// ---------- время ----------
function tick(){
  if(U.modal||document.hidden)return;
  S.hour++;
  if(S.hour>=24){S.hour=0;newDay()}
  const night=S.hour<8;
  for(const ad of S.ads){
    if(ad.status!=='active')continue;
    const perceived=(ad.disclosed||!ad.item.defect)?ad.item.value:ad.item.clean;
    const ratio=ad.price/perceived;
    const f=clamp((1.8-ratio)/.8,.05,1.6);
    ad.views+=ri(0,3);
    const active=S.chats.filter(c=>c.type==='sell'&&c.aid===ad.id&&(c.status==='open'||c.status==='agreed')).length;
    const p=.11*f*(ad.promo?2:1)*(.6+S.rep/100)*(night?.25:1);
    if(active<4&&Math.random()<p)spawnBuyer(ad);
  }
  save();notify();
}
function newDay(){
  S.day++;
  const cost=Math.min(S.money,150);S.money-=cost;
  const msgs=['🌅 День '+S.day+(cost?': расходы на жизнь −'+fmt(cost):'')];
  for(const p of S.pending.filter(p=>p.arrive<=S.day)){S.inv.push(p.item);msgs.push('📦 Доставка: '+p.item.name)}
  S.pending=S.pending.filter(p=>p.arrive>S.day);
  const keep=new Set(S.chats.filter(c=>c.type==='buy'&&(c.status==='open'||c.status==='agreed')).map(c=>c.lid));
  const removable=S.market.filter(l=>!keep.has(l.id)&&!S.favs.includes(l.id));
  for(let i=0;i<Math.min(6,removable.length);i++){const l=removable.splice(ri(0,removable.length-1),1)[0];S.market=S.market.filter(x=>x.id!==l.id)}
  while(S.market.length<28)S.market.unshift(genListing());
  S.chats.filter(c=>c.type==='buy'&&c.status==='open'&&!S.market.some(l=>l.id===c.lid)).forEach(c=>{c.status='dead';c.msgs.push({from:'sys',text:'Объявление снято с публикации',h:S.hour})});
  for(const ad of [...S.ads])if(S.day-ad.posted>=7){removeAd(ad.id,true);msgs.push('⌛ Объявление «'+ad.item.name+'» истекло')}
  toast(msgs.join('\n'));
}
function skipDay(){do{S.hour++;if(S.hour>=24){S.hour=0;newDay();break}}while(true);save();notify()}
