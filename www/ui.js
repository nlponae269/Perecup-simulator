'use strict';
const $=s=>document.querySelector(s);
const hh=h=>String(h).padStart(2,'0')+':00';
const bg=(h,i=0)=>`background:linear-gradient(${135+i*40}deg,hsl(${h},75%,${90-i*4}%),hsl(${(h+40)%360},70%,${79-i*5}%))`;
const ICON={
 home:'<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
 fav:'<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9.2C1.8 7.4 4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3 0 5.2 2.9 4 6.3C19 15.6 12 20 12 20z"/></svg>',
 msg:'<svg viewBox="0 0 24 24"><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/></svg>',
 me:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>'};
let toastT;
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('show'),2800)}
function ping(){try{if(navigator.vibrate)navigator.vibrate(40)}catch(e){}}

// ---------- шапка / навигация ----------
function renderTop(){
  $('#top').innerHTML=`<div class="logo"><i>О</i>Объявка</div><div class="grow"></div><div class="pill"><small>день ${S.day} · ${hh(S.hour)}</small></div><div class="pill">💰 ${fmt(S.money)}</div>`;
}
function unreadTotal(){return S.chats.reduce((a,c)=>a+(c.unread||0),0)}
function renderNav(){
  const u=unreadTotal();
  const b=(t,ic,l,extra='')=>`<button data-act="tab" data-t="${t}" class="${U.tab===t?'on':''}">${ic}<span>${l}</span>${extra}</button>`;
  $('#nav').innerHTML=b('home',ICON.home,'Главная')+b('fav',ICON.fav,'Избранное')+
   `<button data-act="tab" data-t="sell" class="${U.tab==='sell'?'on':''}"><span class="pb">+</span><span>Продать</span></button>`+
   b('msg',ICON.msg,'Сообщения',u?`<span class="badge">${u}</span>`:'')+b('me',ICON.me,'Профиль');
}

// ---------- экраны ----------
function cardHTML(l){
  const chat=S.chats.some(c=>c.type==='buy'&&c.lid===l.id);
  const fav=S.favs.includes(l.id);
  return `<div class="card" data-act="item" data-id="${l.id}"><div class="ph" style="${bg(l.item.hue)}">${l.item.emoji}<span class="heart ${fav?'on':''}" data-act="fav" data-id="${l.id}">${fav?'♥':'♡'}</span>${chat?'<span class="tag">💬 диалог</span>':''}</div><div class="price">${fmt(l.ask)}</div><div class="ttl">${esc(l.item.name)}</div><div class="sub">${esc(l.place)} · ${l.posted===S.day?'сегодня':S.day-l.posted+' дн. назад'}</div></div>`;
}
function feedHTML(){
  const q=U.q.trim().toLowerCase();
  const list=S.market.filter(l=>(!U.cat||l.item.cat===U.cat)&&(!q||l.item.name.toLowerCase().includes(q)));
  return list.length?`<div class="grid">${list.map(cardHTML).join('')}</div>`:'<div class="empty"><span class="big">🔍</span>Ничего не найдено</div>';
}
function screenHome(){
  return `<div class="search">🔍<input id="q" placeholder="Поиск по объявлениям" value="${esc(U.q)}" autocomplete="off"></div>
  <div class="chips"><button class="chip ${!U.cat?'on':''}" data-act="cat" data-c="">Все</button>${Object.entries(CATS).map(([k,v])=>`<button class="chip ${U.cat===k?'on':''}" data-act="cat" data-c="${k}">${v[1]} ${v[0]}</button>`).join('')}</div>
  <div id="feed">${feedHTML()}</div>`;
}
function screenFav(){
  const l=S.market.filter(x=>S.favs.includes(x.id));
  return `<h2>Избранное</h2>`+(l.length?`<div class="grid">${l.map(cardHTML).join('')}</div>`:'<div class="empty"><span class="big">♡</span>Нажимайте на сердечко в карточке, чтобы следить за выгодными лотами</div>');
}
function screenSell(){
  let h='<h2>Продать</h2>';
  const ads=S.ads;
  h+=`<h3>Мои объявления (${ads.length})</h3>`;
  if(!ads.length)h+='<div class="sub">Нет активных объявлений.</div>';
  for(const a of ads){
    const n=S.chats.filter(c=>c.type==='sell'&&c.aid===a.id&&(c.status==='open'||c.status==='agreed')).length;
    h+=`<div class="row"><div class="thumb" style="${bg(a.item.hue)}">${a.item.emoji}</div><div class="grow"><b>${fmt(a.price)}</b>${a.promo?' 🚀':''}<div>${esc(a.item.name)}</div><div class="sub">👁 ${a.views} · 💬 ${n} · ${7-(S.day-a.posted)} дн. до конца</div></div><button class="btn sm ghost" data-act="unad" data-id="${a.id}">Снять</button></div>`;
  }
  h+=`<h3>Мои вещи (${S.inv.length})</h3>`;
  if(!S.inv.length)h+='<div class="empty"><span class="big">📦</span>Пока пусто. Найдите выгодный лот на главной, договоритесь о цене и купите — потом перепродайте дороже.</div>';
  for(const it of S.inv){
    h+=`<div class="row" style="align-items:flex-start"><div class="thumb" style="${bg(it.hue)}">${it.emoji}</div><div class="grow"><b>${esc(it.name)}</b><div class="sub">${COND[it.cond]} · куплено за ${fmt(it.paid)}</div>${it.defect?`<div style="color:var(--bad);font-size:13px;margin-top:2px">⚠ ${esc(it.defect.text)}</div>`:''}<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn sm" data-act="post" data-id="${it.id}">Выставить</button>${it.defect?`<button class="btn sm sec" data-act="repair" data-id="${it.id}">🔧 Починить ${fmt(it.defect.fix)}</button>`:''}</div></div></div>`;
  }
  if(S.pending.length)h+=`<h3>В пути</h3>`+S.pending.map(p=>`<div class="row"><div class="thumb" style="${bg(p.item.hue)}">📦</div><div class="grow">${esc(p.item.name)}<div class="sub">придёт на день ${p.arrive}</div></div></div>`).join('');
  return h;
}
function statusTag(c){return {dead:'закрыт',done:'сделка ✅',agreed:'договорились'}[c.status]||''}
function screenMsg(){
  const cs=[...S.chats].filter(c=>c.msgs.length).sort((a,b)=>b.last-a.last);
  if(!cs.length)return '<h2>Сообщения</h2><div class="empty"><span class="big">💬</span>Диалогов пока нет. Напишите продавцу или подождите покупателей, когда выставите вещь.</div>';
  return '<h2>Сообщения</h2>'+cs.map(c=>{
    const b=c.type==='buy',who=b?c.L.seller:c.buyer,it=b?c.L.item:(adOf(c)?adOf(c).item:null),last=c.msgs[c.msgs.length-1];
    return `<button class="row" data-act="chat" data-id="${c.id}"><div class="av">${who.avatar}</div><div class="grow" style="min-width:0"><div style="display:flex;justify-content:space-between"><b>${esc(who.name)}</b><span class="sub">${b?'покупка':'продажа'}</span></div><div class="sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it?it.name:(c.itemName||'товар'))} ${statusTag(c)?'· '+statusTag(c):''}</div><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${c.unread?'font-weight:700':'color:var(--mut)'}">${esc(last.text)}</div></div>${c.unread?'<span class="dot"></span>':''}</button>`;
  }).join('');
}
function screenMe(){
  const w=netWorth(),pct=Math.min(100,w/GOAL*100);
  const st=S.stats;
  return `<h2>Профиль</h2>
  <div class="row" style="border:0"><div class="av" style="width:60px;height:60px;font-size:32px">😎</div><div><b style="font-size:18px">${rankOf(w)}</b><div class="sub">Репутация: ${'★'.repeat(Math.round(S.rep/20))}${'☆'.repeat(5-Math.round(S.rep/20))} (${Math.round(S.rep)}/100)</div></div></div>
  <div class="sub">Капитал: <b style="color:var(--tx)">${fmt(w)}</b> из ${fmt(GOAL)}</div><div class="bar"><i style="width:${pct}%"></i></div>
  <div class="stat"><div><b>${st.bought}</b>куплено</div><div><b>${st.sold}</b>продано</div><div><b style="color:${st.profit>=0?'var(--ok)':'var(--bad)'}">${fmt(st.profit)}</b>прибыль со сделок</div><div><b>${st.avoided}/${st.lost}</b>мошенников раскрыто / обманули</div></div>
  <div style="display:flex;flex-direction:column;gap:10px">
  <button class="btn sec full" data-act="skip">⏭ Пропустить день</button>
  <button class="btn sec full" data-act="gig" ${S.money<500&&!S.inv.length&&!S.ads.length?'':'disabled'}>🚚 Подработка: разгрузка (+1 000 ₽, если на нуле)</button>
  <button class="btn ghost full" data-act="help">❓ Как играть</button>
  <button class="btn ghost full" data-act="reset" style="color:var(--bad)">Начать заново</button></div>
  <p class="sub" style="text-align:center;margin-top:18px">«Объявка» — учебный симулятор. Все персонажи, цены и объявления вымышлены.</p>`;
}
let homeSig='';
function renderScreen(force){
  const sc=$('#screen'),st=sc.scrollTop;
  if(U.tab==='home'&&!force){const sig=S.market.length+':'+S.day+':'+S.favs.length+':'+S.chats.length+':'+U.cat;if(sig===homeSig&&sc.firstChild)return;homeSig=sig}
  else homeSig='';
  const f={home:screenHome,fav:screenFav,sell:screenSell,msg:screenMsg,me:screenMe}[U.tab];
  sc.innerHTML=f();sc.scrollTop=st;
}

// ---------- карточка товара ----------
function showItem(id){
  const l=S.market.find(x=>x.id===id);if(!l)return;
  U.itemId=id;const it=l.item,s=l.seller,chat=S.chats.find(c=>c.type==='buy'&&c.lid===id);
  const slides=Array.from({length:l.photos},(_,i)=>`<div class="slide" style="${bg(it.hue,i)}"><span style="transform:rotate(${(i-1)*8}deg) scale(${1-i*.08})">${it.emoji}</span></div>`).join('');
  const fav=S.favs.includes(id);
  $('#itemLayer').innerHTML=`<div class="lhead"><button class="back" data-act="closeItem">‹</button><div class="grow"></div><button class="back" data-act="fav" data-id="${id}">${fav?'♥':'♡'}</button></div>
  <div class="lbody"><div class="slider">${slides}</div><div class="pad">
  <div class="price" style="font-size:26px">${fmt(l.ask)}</div>
  <h2 style="margin:2px 0 4px">${esc(it.name)}</h2><div class="sub">${esc(l.place)} · ${l.posted===S.day?'сегодня':S.day-l.posted+' дн. назад'}</div>
  <div style="margin-top:10px"><span class="pill" style="display:inline-block">Рыночная оценка (без дефектов): ≈ ${fmt(it.est)}</span></div>
  <h3>Характеристики</h3>
  <div class="kv"><span>Состояние</span><span>${COND[it.cond]}</span></div>
  <div class="kv"><span>Категория</span><span>${CATS[it.cat][0]}</span></div>
  ${l.discl?`<div class="kv"><span>Дефект</span><span style="color:var(--bad)">${esc(it.defect.text)}</span></div>`:''}
  <h3>Описание</h3><div>${esc(l.desc)}</div>
  <h3>Продавец</h3>
  <div class="row" style="border:0"><div class="av">${s.avatar}</div><div><b>${esc(s.name)}</b><div class="sub"><span class="stars">${s.rating?s.rating.toFixed(1)+' ★':'нет оценок'}</span> · ${s.rev} отзывов</div><div class="sub">${s.since}</div></div></div>
  ${s.rev<4?'<div class="warn">⚠ У продавца мало отзывов. Будьте осторожны с предоплатой.</div>':''}
  </div></div>
  <div class="lbar"><button class="btn sec grow" data-act="deliv" data-id="${id}" style="flex-direction:column;line-height:1.1;font-size:13px">Купить с доставкой<small>${fmt(l.ask+250)}</small></button><button class="btn grow" data-act="write" data-id="${id}">${chat?'Продолжить диалог':'Написать'}</button></div>`;
  $('#itemLayer').classList.add('show');
}
function closeItem(){U.itemId=null;$('#itemLayer').classList.remove('show')}

// ---------- чат ----------
function showChat(id){
  const c=S.chats.find(x=>x.id===id);if(!c)return;
  U.chatId=id;c.unread=0;
  const b=c.type==='buy',who=b?c.L.seller:c.buyer,it=b?c.L.item:(adOf(c)?adOf(c).item:{emoji:'📦',name:c.itemName||'товар',hue:200});
  const price=b?c.L.ask:(adOf(c)?adOf(c).price:0);
  $('#chatLayer').innerHTML=`<div class="lhead"><button class="back" data-act="closeChat">‹</button><div class="av" style="width:38px;height:38px;font-size:20px">${who.avatar}</div><div class="grow" style="min-width:0"><b>${esc(who.name)}</b><div class="sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.name)}${price?' · '+fmt(price):''}</div></div></div>
  <div class="lbody" id="cbody"></div><div class="quick" id="cquick"></div>
  <div class="lbar"><input class="inp" id="cinp" placeholder="Сообщение" autocomplete="off" enterkeyhint="send"><button class="send" data-act="send">➤</button></div>`;
  $('#chatLayer').classList.add('show');updateChat(true);renderNav();
}
function closeChat(){U.chatId=null;$('#chatLayer').classList.remove('show');renderNav();renderScreen(true)}
function quickList(c){
  if(c.status==='dead'||c.status==='done')return [];
  if(c.type==='buy'){
    const o=r50(c.cur*.8);
    return ['Здравствуйте! Актуально?','Какое состояние? Есть дефекты?','Торг уместен?','Какая последняя цена?',`Отдадите за ${o}?`,'Можно посмотреть?','Не актуально, спасибо'];
  }
  const ad=adOf(c);const p=ad?ad.price:0;
  return ['Здравствуйте! Да, актуально.','Всё исправно, дефектов нет','Есть небольшой дефект, учту в цене','Торг уместен, но немного','Последняя цена '+r50(p*.93),'Не торгуюсь','Приезжайте сегодня'];
}
function updateChat(scroll){
  const c=S.chats.find(x=>x.id===U.chatId);if(!c)return;
  const body=$('#cbody');if(!body)return;
  const nearBottom=scroll||body.scrollHeight-body.scrollTop-body.clientHeight<120;
  const closed=c.status==='dead'||c.status==='done';
  let h='<div class="msgs">';
  c.msgs.forEach((m,i)=>{
    if(m.from==='sys')h+=`<div class="sys">${esc(m.text)}</div>`;
    else{
      h+=`<div class="bub ${m.from}">${esc(m.text)}<span class="t">${hh(m.h)}</span></div>`;
      if(m.actions)h+=`<div class="acts">${m.actions.map((a,j)=>`<button data-act="mact" data-m="${i}" data-a="${j}" ${(m.used||closed)?'disabled':''}>${esc(a.t)}</button>`).join('')}</div>`;
    }
  });
  if(c.typing)h+='<div class="bub them typing"><i></i><i></i><i></i></div>';
  h+='</div>';
  body.innerHTML=h;
  if(nearBottom)body.scrollTop=body.scrollHeight;
  $('#cquick').innerHTML=quickList(c).map(t=>`<button data-act="qs" data-t="${esc(t)}">${esc(t)}</button>`).join('');
  const inp=$('#cinp');if(inp)inp.disabled=closed;
}
function doSend(txt){
  const c=S.chats.find(x=>x.id===U.chatId);if(!c)return;
  const inp=$('#cinp');const t=txt!==undefined?txt:inp.value;if(!t.trim())return;
  if(txt===undefined)inp.value='';
  sendMsg(c,t);
}

// ---------- модальные окна ----------
function openModal(m){U.modal=m;renderModal()}
function closeModal(){if(U.modal&&U.modal.type==='win')S.won=true;U.modal=null;renderModal();save()}
function renderModal(){
  const L=$('#modalLayer'),m=U.modal;
  if(!m){L.classList.remove('show');L.innerHTML='';return}
  let h='';
  if(m.type==='inspect'){
    const c=S.chats.find(x=>x.id===m.cid);
    if(!c||c.status==='done'){U.modal=null;L.classList.remove('show');L.innerHTML='';return}
    const it=c.L.item;
    h=`<h2>Осмотр: ${esc(it.name)}</h2><div class="ph" style="${bg(it.hue)};height:140px;aspect-ratio:auto;margin-bottom:12px">${it.emoji}</div>
    <div class="kv"><span>Состояние</span><span>${COND[it.cond]}</span></div>
    <div class="kv"><span>Договорная цена</span><span>${fmt(c.agreed)}</span></div>
    <div class="kv"><span>Рыночная оценка</span><span>≈ ${fmt(it.est)}</span></div>
    ${it.defect?`<div class="warn">⚠ При осмотре найдено: <b>${esc(it.defect.text)}</b>. Оценка ущерба ≈ ${fmt(it.defect.cost)}, ремонт ≈ ${fmt(it.defect.fix)}.${c.known||c.L.discl?'':' Продавец об этом не предупреждал.'}</div>`:'<div class="warn" style="background:#e5f8ee;color:#0b6b3b">✅ Скрытых дефектов не обнаружено.</div>'}
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:10px">
    <button class="btn full" data-act="ibuy">Купить за ${fmt(c.agreed)}</button>
    ${it.defect&&!c.discounted?'<button class="btn sec full" data-act="idisc">Попросить скидку за дефект</button>':''}
    <button class="btn ghost full" data-act="mclose">Уйти</button></div>`;
  }else if(m.type==='sellmeet'){
    const c=S.chats.find(x=>x.id===m.cid),ad=c&&adOf(c);if(!ad||c.status==='done'){U.modal=null;L.classList.remove('show');L.innerHTML='';return}
    const it=ad.item;
    h=`<h2>Встреча с ${esc(c.buyer.name)}</h2><div class="ph" style="${bg(it.hue)};height:120px;aspect-ratio:auto;margin-bottom:12px">${c.buyer.avatar}</div>`;
    if(c.sm.found)h+=`<div class="warn">🔍 Покупатель осматривает «${esc(it.name)}» и находит: <b>${esc(it.defect.text)}</b>.${c.sm.lied?' А вы говорили, что всё идеально — репутация пострадает.':''} Просит скинуть до <b>${fmt(c.sm.price)}</b>.</div><div style="display:flex;flex-direction:column;gap:10px"><button class="btn full" data-act="sdeal">Согласиться на ${fmt(c.sm.price)}</button><button class="btn ghost full" data-act="sdecl">Отказаться</button></div>`;
    else h+=`<div class="kv"><span>Договорная цена</span><span>${fmt(c.sm.price)}</span></div><div class="warn" style="background:#e5f8ee;color:#0b6b3b">✅ Покупатель осмотрел вещь — всё устраивает.</div><div style="display:flex;flex-direction:column;gap:10px"><button class="btn full" data-act="sdeal">Получить ${fmt(c.sm.price)}</button><button class="btn ghost full" data-act="mclose">Пока не продавать</button></div>`;
  }else if(m.type==='post'){
    const it=S.inv.find(x=>x.id===m.id);if(!it){U.modal=null;L.classList.remove('show');L.innerHTML='';return}
    h=`<h2>Новое объявление</h2><div class="row" style="border:0;padding-top:0"><div class="thumb" style="${bg(it.hue)}">${it.emoji}</div><div><b>${esc(it.name)}</b><div class="sub">${COND[it.cond]} · куплено за ${fmt(it.paid)}</div></div></div>
    <div class="sub" style="margin-bottom:6px">Ваша цена, ₽ (рыночная оценка без дефектов ≈ ${fmt(it.est)})</div>
    <input class="field" id="pPrice" type="number" inputmode="numeric" value="${r50(it.value*1.15)}">
    ${it.defect?`<label class="chk"><input type="checkbox" id="pDiscl"><span>Указать дефект в описании (<b>${esc(it.defect.text)}</b>). Честно — покупатели не найдут его на встрече.</span></label>`:''}
    <label class="chk"><input type="checkbox" id="pPromo"><span>🚀 Продвижение за 300 ₽ — в 2 раза больше покупателей</span></label>
    <div style="display:flex;gap:10px;margin-top:6px"><button class="btn ghost" data-act="mclose">Отмена</button><button class="btn grow" data-act="pubad" data-id="${it.id}">Опубликовать</button></div>`;
  }else if(m.type==='win'){
    h=`<h2>👑 Король барахолки!</h2><p>Ваш капитал превысил ${fmt(GOAL)}. Вы построили настоящую империю перекупа. Можно играть дальше — потолка нет.</p><button class="btn full" data-act="mclose">Продолжить</button>`;
  }else if(m.type==='help'){
    h=`<h2>Как играть</h2><p><b>Цель:</b> превратить 15 000 ₽ в 1 000 000 ₽, покупая дёшево и продавая дорого.</p>
    <p>🛍 <b>Покупка.</b> Найдите лот на главной, напишите продавцу и поторгуйтесь («Отдадите за 5000?», «Какая последняя цена?»). Когда договорились — «Поехать смотреть» (дорога 100 ₽). Можно купить сразу с доставкой (+250 ₽), но дефекты тогда не проверить.</p>
    <p>🔍 <b>Дефекты.</b> Спрашивайте про состояние: честные скажут правду, хитрые могут соврать. На осмотре дефект всегда виден — можно просить скидку.</p>
    <p>🏷 <b>Продажа.</b> «Продать» → выставьте вещь и цену, ждите покупателей. Не указали дефект — на встрече его могут найти.</p>
    <p>🚨 <b>Мошенники.</b> Предоплата незнакомцу, «код из СМС», продавцы без отзывов с ценой вполовину ниже рынка — классика. Не платите вперёд и не сообщайте коды.</p>
    <p>⏱ Время идёт само: час ≈ 4 секунды. Расходы на жизнь 150 ₽ в день, объявления живут 7 дней.</p><button class="btn full" data-act="mclose">Понятно</button>`;
  }
  L.innerHTML=`<div class="sheet">${h}</div>`;L.classList.add('show');
}

// ---------- события ----------
const curChat=()=>S.chats.find(x=>x.id===(U.modal&&U.modal.cid));
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act,id=+el.dataset.id;
  if(a==='tab'){U.tab=el.dataset.t;renderNav();renderScreen(true);$('#screen').scrollTop=0}
  else if(a==='cat'){U.cat=el.dataset.c||null;renderScreen(true)}
  else if(a==='fav'){e.stopPropagation();const i=S.favs.indexOf(id);if(i<0)S.favs.push(id);else S.favs.splice(i,1);save();if(U.itemId===id)showItem(id);renderScreen(true)}
  else if(a==='item')showItem(id);
  else if(a==='closeItem')closeItem();
  else if(a==='write'){const c=startBuyChat(id);if(c){closeItem();showChat(c.id)}else toast('Объявление уже снято')}
  else if(a==='deliv')buyDelivery(id);
  else if(a==='chat')showChat(id);
  else if(a==='closeChat')closeChat();
  else if(a==='send'){doSend();const i=$('#cinp');if(i)i.focus()}
  else if(a==='qs')doSend(el.dataset.t);
  else if(a==='mact'){const c=S.chats.find(x=>x.id===U.chatId);if(c)doAction(c,+el.dataset.m,+el.dataset.a);renderModal()}
  else if(a==='mclose')closeModal();
  else if(a==='ibuy'){buyDeal(curChat());renderModal()}
  else if(a==='idisc'){askDiscount(curChat());renderModal()}
  else if(a==='sdeal'){sellDeal(curChat());renderModal();renderScreen(true)}
  else if(a==='sdecl'){declineSell(curChat());renderModal()}
  else if(a==='post')openModal({type:'post',id});
  else if(a==='pubad'){const p=+$('#pPrice').value,d=$('#pDiscl')?$('#pDiscl').checked:false,pr=$('#pPromo').checked;postAd(id,p,d,pr);renderModal();renderScreen(true)}
  else if(a==='unad'){removeAd(id);renderScreen(true)}
  else if(a==='repair'){repairItem(id);renderScreen(true)}
  else if(a==='skip'){skipDay();renderScreen(true)}
  else if(a==='gig'){S.money+=1000;toast('🚚 +1 000 ₽');save();notify();renderScreen(true)}
  else if(a==='help')openModal({type:'help'});
  else if(a==='reset'){if(confirm('Начать заново? Прогресс будет потерян.')){closeItem();U.chatId=null;$('#chatLayer').classList.remove('show');U.modal=null;renderModal();newGame();notify();renderScreen(true)}}
});
document.addEventListener('input',e=>{if(e.target.id==='q'){U.q=e.target.value;$('#feed').innerHTML=feedHTML()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='cinp')doSend()});
window.goBack=function(){
  if(U.modal&&U.modal.type!=='win'){closeModal();return true}
  if(U.chatId){closeChat();return true}
  if(U.itemId){closeItem();return true}
  if(U.tab!=='home'){U.tab='home';renderNav();renderScreen(true);return true}
  return false;
};
function notify(){
  renderTop();renderNav();renderScreen();
  if(U.chatId)updateChat();
  if(U.modal&&(U.modal.type==='inspect'||U.modal.type==='sellmeet'))renderModal();
}
// ---------- старт ----------
if(!load())newGame();
if(!S.won)checkWin();
renderTop();renderNav();renderScreen(true);
setInterval(tick,4000);
try{if(!localStorage.getItem('obyavka_seen')){localStorage.setItem('obyavka_seen','1');openModal({type:'help'})}}catch(e){}
