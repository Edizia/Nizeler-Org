var K='bento-v2',NAMES={dl:'Deadlines',cal:'Kalender',prio:'Prioriteter',sch:'Schema',todo:'Att göra',dn:'Avklarat'},LV=['Hög','Medel','Låg'];
var T0=new Date();T0.setHours(0,0,0,0);
function iso(o){var d=new Date(T0);d.setDate(d.getDate()+o);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function P(s){return new Date(s+'T00:00')}
function E(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function defs(){return{
sch:[{h:'09:00',t:'Föreläsning: Prototyper',s:'Sal M2'},{h:'12:00',t:'Lunch',s:'Med projektgruppen'},{h:'13:30',t:'Handledning',s:'Digitalt · 30 min'},{h:'15:00',t:'Skrivtid: rapport',s:'Utan avbrott'}],
todo:[{t:'Lämna in rapport',d:iso(2),l:0,est:4,o:1},{t:'Prototyp till användartest',d:iso(6),l:0,est:8,o:2},{t:'Skicka offert',d:iso(9),l:1,est:3,o:1},{t:'Slutredovisning',d:iso(24),l:2,est:6},{t:'Svara på kundens mejl',l:1},{t:'Städa upp Figma-filen',l:2},{t:'Skriv klart slutsatsen',l:1},{t:'Exportera skärmar från Figma',l:null,done:1}]}}
var TEAM=!!(window.DB&&DB.on);   /* inloggad i ett team via db.js */
var S=TEAM?DB.S:null;if(!S){try{S=JSON.parse(localStorage.getItem(K))}catch(e){}}
S=S||{};S.theme=S.theme||'auto';S.layout=S.layout||'bento';S.colors=S.colors||{};S.data=S.data||defs();
S.data.todo=S.data.todo||[];S.data.sch=S.data.sch||[];S.plan=S.plan||{on:true,start:'09:00',end:'17:00',max:4,wk:false};S.people=S.people||[{id:1,n:'Jag',c:'#3A52E0'},{id:2,n:'Alex',c:'#D9772B'},{id:3,n:'Sam',c:'#2E9D6B'}];S.me=S.me||S.people[0].id;S.hidden=S.hidden||{};
if(S.data.dl){S.data.dl.forEach(function(x){S.data.todo.push({t:x.t,d:x.d,l:null,done:0})});delete S.data.dl}
if(S.data.prio){S.data.prio.forEach(function(x){S.data.todo.push({t:x.t,l:x.l,done:0})});delete S.data.prio}
S.data.sch.forEach(function(x){if(!x.d)x.d=iso(0)});S.data.todo.forEach(function(x){if(x.id==null)x.id=uid()});
var armed=0,sel=iso(0),edit=false,cm={y:T0.getFullYear(),m:T0.getMonth()};
/* unika id:n, så att två personer aldrig skapar samma id */
function uid(){return window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,10)}
/* värde från ett <select>: siffror blir tal (äldre lokala id:n), annat behålls som text */
function idv(v){return v===''||v==null?null:/^\d+$/.test(v)?+v:v}
/* "Mina": bara uppgifter som är tilldelade mig */
function mine(x){return !(S.sf&&S.sf.me)||x.o==S.me}
function lock(x){return x.priv?'<span class="tag">Privat</span>':''}
var dirty=true;function saveRaw(){if(TEAM){DB.saveLocal();DB.sync();return}try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}function save(){dirty=true;saveRaw()}
var $=function(id){return document.getElementById(id)};
function ed(k,i,f,v){return '<span '+(edit?'contenteditable="true" class="ed" ':'')+'data-k="'+k+'" data-i="'+i+'" data-f="'+f+'">'+E(v)+'</span>'}
function del(k,i){return edit?'<button class="x" data-del="'+k+':'+i+'" aria-label="Ta bort">×</button>':''}
function add(k){return (k=='sch'&&edit)?'<button class="add" data-add="sch">+ Lägg till</button>':''}
function left(d){return Math.round((P(d)-T0)/864e5)}
function openT(){return S.data.todo.filter(function(x){return !x.done})}
function row(k,i){return k=='sch'?S.data.sch[+i]:S.data.todo.filter(function(x){return x.id==i})[0]}
function dlab(d,sh){return P(d).toLocaleDateString('sv-SE',{weekday:sh?'short':'long',day:'numeric',month:'long'})}
function dinp(x){return '<input type="date" value="'+(x.d||'')+'" data-k="todo" data-i="'+x.id+'" data-f="d" aria-label="Deadline">'}
function ini(n){return String(n||'?').trim().split(/\s+/).map(function(w){return w.charAt(0)}).join('').slice(0,2).toUpperCase()}
function who(x,btn,nm){var p=S.people.filter(function(q){return q.id==x.o})[0];
if(!p)return btn?'<button class="av none" data-own="'+x.id+'" title="Ingen ägare. Klicka för att tilldela" aria-label="Tilldela ägare">+</button>':'';
var st='background:'+p.c+';color:'+(lum(p.c)>.55?'#14213D':'#fff'),a='title="'+E(p.n)+'" aria-label="Ägare: '+E(p.n)+'"',txt=E(ini(p.n)),nn=nm?'<span class="dt">'+E(p.n)+'</span>':'';
return (btn?'<button class="av" style="'+st+'" data-own="'+x.id+'" '+a+'>'+txt+'</button>':'<span class="av" style="'+st+'" '+a+'>'+txt+'</span>')+nn}
function ownOpts(){return '<option value="">Ingen</option>'+S.people.map(function(p){return '<option value="'+p.id+'">'+E(p.n)+'</option>'}).join('')}
function peopleUI(){if(TEAM){teamUI();return}$('ppl').innerHTML=S.people.map(function(p){return '<div class="prow"><input type="color" value="'+p.c+'" data-pc="'+p.id+'" aria-label="Färg"><input type="text" value="'+E(p.n)+'" data-pn="'+p.id+'" aria-label="Namn">'+(S.people.length>1?'<button class="x" data-pdel="'+p.id+'" aria-label="Ta bort person">×</button>':'')+'</div>'}).join('')+'<div class="crow"><label for="meSel">Jag är</label><select id="meSel">'+S.people.map(function(p){return '<option value="'+p.id+'"'+(p.id==S.me?' selected':'')+'>'+E(p.n)+'</option>'}).join('')+'</select></div><p class="hint2">Planeraren lägger bara in arbetstid för uppgifter som är tilldelade dig eller saknar ägare.</p>'}
function teamUI(){var own=DB.role=='owner';
$('acct').innerHTML='Inloggad som '+E(DB.email||'')+'<br>Team: '+E(DB.teamName||'')+(own?' (du är ägare)':'');
$('ppl').innerHTML=S.people.map(function(p){if(p.id==S.me)return '<div class="prow"><input type="color" value="'+p.c+'" data-pc="'+p.id+'" aria-label="Din färg"><input type="text" value="'+E(p.n)+'" data-pn="'+p.id+'" aria-label="Ditt namn"><span class="hint2">du</span></div>';
var st='background:'+p.c+';color:'+(lum(p.c)>.55?'#14213D':'#fff');
return '<div class="prow"><span class="av" style="'+st+'">'+E(ini(p.n))+'</span><span class="pn">'+E(p.n)+'</span>'+(own?'<button class="x" data-pdel="'+p.id+'" aria-label="Ta bort '+E(p.n)+' ur teamet">×</button>':'')+'</div>'}).join('')
+'<div id="inv"></div><p class="hint2">Du kan ändra ditt eget namn och din färg. Planeraren lägger bara in arbetstid för uppgifter som är tilldelade dig eller saknar ägare.</p>';
$('addP').textContent='Bjud in till teamet'}
function fh(h){return h==1?'1 timme':String(h).replace('.',',')+' timmar'}
function rDl(){var a=openT().filter(function(x){return x.d&&mine(x)}).sort(function(x,y){return x.d<y.d?-1:x.d>y.d?1:0});
if(!a.length)return '<p class="empty">Inga deadlines. Lägg till en uppgift med datum under Att göra.</p>';
return '<ul>'+a.map(function(x){var n=left(x.d),w=n<0?100:Math.max(5,Math.min(100,100-n*4));
return '<li><div class="m"><b>'+ed('todo',x.id,'t',x.t)+'</b><span>'+(edit?dinp(x):dlab(x.d))+'</span><div class="bar"><i style="width:'+w+'%"></i></div></div><span class="when'+(n<=3?' red':n<=7?' yel':'')+'">'+(n<0?'Försenad':n==0?'Idag':n+' d')+'</span>'+who(x,false)+del('todo',x.id)+'</li>'}).join('')+'</ul>'}
function rCal(){var y=cm.y,m=cm.m,f=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate(),h='<div class="days">',ds=openT().filter(mine).map(function(x){return x.d}).concat(S.data.sch.filter(function(x){return x.k!='w'}).map(function(x){return x.d})),H=hol(y),hl=[],ms=new Date(y,m,1).toLocaleDateString('sv-SE',{month:'short'});
$('mon').textContent=cap(new Date(y,m,1).toLocaleDateString('sv-SE',{month:'long',year:'numeric'}));
['M','T','O','T','F','L','S'].forEach(function(x,i){h+='<div class="hd'+(i==6?' red':'')+'">'+x+'</div>'});
for(var i=0;i<f;i++)h+='<div></div>';
for(var d=1;d<=n;d++){var s=y+'-'+('0'+(m+1)).slice(-2)+'-'+('0'+d).slice(-2),hn=H[s],red=hn||new Date(y,m,d).getDay()==0;if(hn)hl.push('<li>'+d+' '+ms+' · '+hn+'</li>');
h+='<button class="d'+(s==iso(0)?' today':'')+(s==sel?' sel':'')+(red?' red':'')+(ds.indexOf(s)>-1?' ev':'')+'" data-day="'+s+'" title="'+(hn||'')+'" aria-label="'+dlab(s)+(hn?', '+hn:'')+'" aria-pressed="'+(s==sel)+'"><span>'+d+'</span></button>'}
return h+'</div><p class="tipc">Klicka på en dag, eller dra över flera dagar, för att lägga till en händelse eller påminnelse.</p>'+(hl.length?'<ul class="hol">'+hl.join('')+'</ul>':'')}
function rPrio(){var a=openT().filter(function(x){return x.l!=null&&mine(x)}).sort(function(x,y){return x.l-y.l});
if(!a.length)return '<p class="empty">Inga prioriterade uppgifter. Välj prioritet när du lägger till under Att göra.</p>';
var c=[0,0,0];a.forEach(function(x){c[x.l]++});var tot=a.length;
var bars=LV.map(function(n,j){return '<div class="pb"><div><span>'+n+'</span><span>'+c[j]+'</span></div><div class="t"><i style="width:'+(c[j]/tot*100)+'%"></i></div></div>'}).join('');
return '<div class="bars">'+bars+'</div><ul>'+a.map(function(x){return '<li><button class="chip l'+x.l+'" data-lvl="'+x.id+'" aria-label="Byt prioritet"><span>'+LV[x.l]+'</span></button>'+ed('todo',x.id,'t',x.t)+who(x,false)+del('todo',x.id)+'</li>'}).join('')+'</ul>'+(c[0]?'<p class="tip">Börja med: '+E(a[0].t)+'</p>':'')}
function rSch(){var a=[];S.data.sch.forEach(function(x,i){if(x.d==sel)a.push({x:x,i:i})});a.sort(function(p,q){return (p.x.h||'')<(q.x.h||'')?-1:1});
$('schd').textContent=sel==iso(0)?'idag':dlab(sel,1);var wn=(S.plan.msg?'<p class="note">'+E(S.plan.msg)+'</p>':'')+(S.plan.warn||[]).map(function(w){return '<p class="warn">⚠ '+E(w)+'</p>'}).join('');
if(!a.length)return wn+'<p class="empty">Inget inplanerat. Tryck på + i kalendern för att lägga till en händelse eller påminnelse, eller på Planera för att fördela arbetstid.</p>'+add('sch');
return wn+'<ul>'+a.map(function(o){var x=o.x,i=o.i;return '<li><time>'+ed('sch',i,'h',x.h||'–')+'</time><div class="blk"><b>'+(x.k=='p'?'<span class="tag">Påminnelse</span>':x.k=='w'?'<span class="tag">Planerat</span>':'')+ed('sch',i,'t',x.t)+'</b>'+((x.s||edit)?'<span class="s">'+ed('sch',i,'s',x.s||'–')+'</span>':'')+'</div>'+del('sch',i)+'</li>'}).join('')+'</ul>'+add('sch')}
function rTodo(){var o=S.data.todo.filter(function(x){return !x.done&&mine(x)});$('cnt').textContent=o.length+' kvar';
if(!o.length)return '<p class="empty">'+(S.sf&&S.sf.me?'Inga uppgifter är tilldelade dig. Välj Alla för att se teamets uppgifter.':'Inget kvar att göra. Tryck på + för att lägga till.')+'</p>';
return '<ul>'+o.map(function(x){return '<li><button class="box" data-tg="'+x.id+'" aria-pressed="false" aria-label="Markera klar"><span></span></button><span class="lbl">'+ed('todo',x.id,'t',x.t)+'</span>'+lock(x)+who(x,true,true)+del('todo',x.id)+'</li>'}).join('')+'</ul>'}
function rDn(){var a=S.data.todo.filter(function(x){return x.done&&mine(x)}).sort(function(p,q){return (q.dn||'')<(p.dn||'')?-1:1});$('dcnt').textContent=a.length?a.length+' st':'';
if(!a.length)return '<p class="empty">Avbockade uppgifter hamnar här.</p>';
return '<ul>'+a.map(function(x){return '<li class="done"><button class="box" data-tg="'+x.id+'" aria-pressed="true" aria-label="Markera som ej klar"><span>✓</span></button><span class="lbl">'+ed('todo',x.id,'t',x.t)+'</span>'+who(x,false,true)+(x.dn?'<span class="dt">'+P(x.dn).toLocaleDateString('sv-SE',{day:'numeric',month:'short'})+'</span>':'')+del('todo',x.id)+'</li>'}).join('')+'</ul>'}
function render(){if(dirty){dirty=false;if(S.plan.on&&sig()!=S.plan.sig){plan();S.plan.sig=sig()}saveRaw()}
$('b-dl').innerHTML=rDl();$('b-cal').innerHTML=rCal();$('b-prio').innerHTML=rPrio();$('b-sch').innerHTML=rSch();$('b-todo').innerHTML=rTodo();$('b-dn').innerHTML=rDn();
document.querySelectorAll('[data-mine]').forEach(function(b){b.setAttribute('aria-pressed',+b.dataset.mine==(S.sf&&S.sf.me?1:0))});
$('h1').textContent=cap(T0.toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'}));
var c=openT().filter(function(x){return mine(x)&&x.d&&left(x.d)>=0&&left(x.d)<=7}).length;$('sub').textContent=c+' deadlines de närmaste 7 dagarna'}
function easter(y){var a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=(h+l-7*m+114)%31+1;return new Date(y,mo-1,da)}
function addD(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function ymd(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
var HC={};
function hol(y){if(HC[y])return HC[y];var h={},e=easter(y);
function a(d,n){h[ymd(d)]=n}
a(new Date(y,0,1),'Nyårsdagen');a(new Date(y,0,6),'Trettondedag jul');a(addD(e,-2),'Långfredagen');a(e,'Påskdagen');a(addD(e,1),'Annandag påsk');a(new Date(y,4,1),'Första maj');a(addD(e,39),'Kristi himmelsfärdsdag');a(addD(e,49),'Pingstdagen');a(new Date(y,5,6),'Nationaldagen');
var m=new Date(y,5,20);while(m.getDay()!=6)m.setDate(m.getDate()+1);a(m,'Midsommardagen');
var o=new Date(y,9,31);while(o.getDay()!=6)o.setDate(o.getDate()+1);a(o,'Alla helgons dag');
a(new Date(y,11,25),'Juldagen');a(new Date(y,11,26),'Annandag jul');return HC[y]=h}
function openEv(d,e){$('evdate').value=d;$('evend').value=e||'';$('evdlg').showModal();$('evtitle').focus()}
function addEv(){var t=$('evtitle').value.trim(),d=$('evdate').value,e=$('evend').value||d;if(!t||!d)return;if(e<d)e=d;
var g=Date.now(),c=P(d),z=P(e),n=0;
while(c<=z&&n<366){S.data.sch.push({t:t,h:$('evtime').value,s:$('evnote').value.trim(),d:ymd(c),k:$('evk').value,m:+$('evlen').value,b:$('evblk').checked?1:0,priv:$('evpriv').checked?1:0,g:g});c.setDate(c.getDate()+1);n++}
sel=d;var dd=P(d);cm.y=dd.getFullYear();cm.m=dd.getMonth();save();render();
$('evtitle').value='';$('evtime').value='';$('evnote').value='';$('evend').value='';$('evblk').checked=false;$('evpriv').checked=false;$('evk').value='e';$('evlen').value='60';$('evdlg').close()}
function toMin(h){var p=h.split(':');return +p[0]*60+(+p[1]||0)}
function fm(n){return ('0'+Math.floor(n/60)).slice(-2)+':'+('0'+n%60).slice(-2)}
function off(ds){if(S.plan.wk)return false;var d=P(ds),g=d.getDay();return g==0||g==6||!!hol(d.getFullYear())[ds]}
function sig(){return JSON.stringify([S.plan.start,S.plan.end,S.plan.max,S.plan.wk,S.me,iso(0),openT().map(function(x){return [x.id,x.d,x.l,x.est,x.t,x.o]}),S.data.sch.filter(function(x){return x.k!='w'}).map(function(x){return [x.d,x.h,x.m,x.b]})])}
function plan(){var pl=S.plan,now=new Date(),nowM=now.getHours()*60+now.getMinutes(),today=iso(0),ws=toMin(pl.start),we=toMin(pl.end),cap=pl.max*60,done={},busy={},load={},warn=[],blocked={},LOG=[],MIN=S.plan.min||90;
S.data.sch=S.data.sch.filter(function(x){if(x.k!='w')return true;var m=x.m||60,past=x.d<today||(x.d==today&&toMin(x.h)+m<=nowM);if(past)done[x.src]=(done[x.src]||0)+m;return past});
S.data.sch.forEach(function(x){if(x.b)blocked[x.d]=1;if(x.h&&x.h!='–'){(busy[x.d]=busy[x.d]||[]).push([toMin(x.h),toMin(x.h)+(x.m||60)]);if(x.k=='w')load[x.d]=(load[x.d]||0)+(x.m||60)}});
function gap(ds,min){var b=(busy[ds]||[]).concat([[720,780]]).sort(function(p,q){return p[0]-q[0]}),c=ds==today?Math.max(ws,Math.ceil(nowM/15)*15):ws;
for(var i=0;i<b.length;i++){if(b[i][1]<=c)continue;var e=Math.min(b[i][0],we);if(e-c>=min)return [c,e];c=Math.max(c,b[i][1])}
return we-c>=min?[c,we]:null}
function put(t,ds,want,minL){var w0=want;want=Math.min(want,cap-(load[ds]||0));var mn=Math.min(minL||30,w0);if(want<mn||mn<=0)return 0;var g=gap(ds,mn);if(!g)return 0;
var len=Math.min(want,g[1]-g[0]);if(len>=30)len=Math.floor(len/15)*15;if(len<=0)return 0;
(busy[ds]=busy[ds]||[]).push([g[0],g[0]+len]);load[ds]=(load[ds]||0)+len;
var it={t:'Arbeta med: '+t.t,h:fm(g[0]),m:len,d:ds,k:'w',src:t.id,s:fm(g[0])+'–'+fm(g[0]+len)+(t.l==0?' · hög prio':'')};S.data.sch.push(it);LOG.push({ds:ds,st:g[0],len:len,it:it});return len}
function undo(){LOG.forEach(function(g){var i=S.data.sch.indexOf(g.it);if(i>-1)S.data.sch.splice(i,1);var b=busy[g.ds];for(var j=b.length-1;j>=0;j--){if(b[j][0]==g.st&&b[j][1]==g.st+g.len){b.splice(j,1);break}}load[g.ds]-=g.len});LOG=[]}
var tasks=openT().filter(function(x){return (!x.d||x.d>=today)&&(!x.o||x.o==S.me)}).sort(function(a,b){var p=a.d||'9999',q=b.d||'9999';return p<q?-1:p>q?1:(a.l==null?3:a.l)-(b.l==null?3:b.l)});
tasks.forEach(function(t){var total=Math.round((t.est||2)*60)-(done[t.id]||0);if(total<=0)return;
var n=t.d?left(t.d):[7,14,21][t.l==null?1:t.l],m=t.d?Math.min(Math.max(1,Math.ceil(n*(t.l===0?.3:.2))),n):0,need=total,ok=false;
for(;m>=0&&!ok;m--){var D=[],used={};for(var k=0;k<=n-m;k++){var ds=iso(k);if(!off(ds)&&!blocked[ds])D.push(ds)}
LOG=[];need=total;
if(D.length){var cnt=Math.max(1,Math.min(D.length,Math.floor(total/MIN))),base=Math.floor(total/cnt/15)*15,rem=total-base*cnt;
for(var i=0;i<cnt;i++){var add=Math.min(15,rem);rem-=add;var len=base+add,idx=Math.floor(i*D.length/cnt),placed=0;
for(var pz=0;pz<2&&!placed;pz++){for(var o=0;o<D.length&&!placed;o++){var dd=D[(idx+o)%D.length];if(used[dd])continue;placed=put(t,dd,len,pz?30:len);if(placed)used[dd]=1}}
need-=placed}
for(var q=0;q<D.length&&need>0;q++){while(need>0){var c=put(t,D[q],Math.min(need,120));if(!c)break;need-=c}}}
if(need<=0||m==0)ok=true;else undo()}
if(need>0)warn.push('Hinner inte: "'+t.t+'" saknar '+fh(need/60)+(t.d?' före deadline. Utöka arbetsdagen eller flytta deadlinen.':' inom '+n+' dagar. Utöka arbetsdagen eller minska tiden.'))});
S.plan.warn=warn;
var wk=S.data.sch.filter(function(x){return x.k=='w'&&x.d>=today}).sort(function(a,b){return a.d<b.d?-1:a.d>b.d?1:a.h<b.h?-1:1}),srcs={};wk.forEach(function(x){srcs[x.src]=1});var ns=Object.keys(srcs).length;
S.plan.msg=wk.length?'Planerat: '+wk.length+' pass för '+ns+(ns==1?' uppgift':' uppgifter')+'. Första passet: '+P(wk[0].d).toLocaleDateString('sv-SE',{weekday:'short',day:'numeric',month:'short'})+' kl. '+wk[0].h+'.':(tasks.length?'Inget kunde planeras. Kontrollera arbetsdagens tider i menyn.':'Inget att planera. Lägg till uppgifter i Att göra, gärna med beräknad tid.')}
function lum(h){var r=parseInt(h.substr(1,2),16),g=parseInt(h.substr(3,2),16),b=parseInt(h.substr(5,2),16);return(.299*r+.587*g+.114*b)/255}
function hex(c){var m=c.match(/\d+/g);return '#'+m.slice(0,3).map(function(v){return('0'+(+v).toString(16)).slice(-2)}).join('')}
function look(){if(S.layout=='custom')dashEnsure('bento');var r=document.documentElement;S.theme=='auto'?r.removeAttribute('data-theme'):r.setAttribute('data-theme',S.theme);
$('grid').setAttribute('data-layout',S.layout);
['dl','cal','prio','sch','todo','dn'].forEach(function(k){var el=document.querySelector('.'+k),c=S.colors[k];
if(c){var lt=lum(c)>.55;el.style.setProperty('--cbg',c);el.style.color=lt?'#14213D':'#FFFFFF';el.style.setProperty('--red',lt?'#B3261E':'#FF7A70');el.style.setProperty('--yel',lt?'#946200':'#FFD54A')}else{el.style.removeProperty('--cbg');el.style.removeProperty('color');el.style.removeProperty('--red');el.style.removeProperty('--yel')}});
document.querySelectorAll('[data-th]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.th==S.theme)});
document.querySelectorAll('[data-lay]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.lay==S.layout)});
$('planOn').setAttribute('aria-pressed',S.plan.on);$('pwk').setAttribute('aria-pressed',S.plan.wk);$('pstart').value=S.plan.start;$('pend').value=S.plan.end;$('pmax').value=S.plan.max;$('editBtn').setAttribute('aria-pressed',edit);$('editBtn').textContent=edit?'Redigering på':'Redigering av';document.body.classList.toggle('editing',!!edit);dashApply()}
function cols(){peopleUI();dashVis();$('cols').innerHTML=Object.keys(NAMES).map(function(k){var v=S.colors[k]||hex(getComputedStyle(document.querySelector('.'+k)).backgroundColor);
return '<div class="crow"><label for="c-'+k+'">'+NAMES[k]+'</label><input type="color" id="c-'+k+'" data-col="'+k+'" value="'+v+'"></div>'}).join('')}
document.addEventListener('click',function(ev){var t=ev.target.closest('button');if(!t)return;var D=t.dataset;
if(t.id=='menuBtn'){$('menu').classList.add('open');cols()}
else if(t.id=='close'){$('menu').classList.remove('open')}
else if(t.id=='layReset'){S.cards=dashPreset('bento');S.hidden={};save();dashApply();dashVis()}
else if(D.open){$('no').innerHTML=ownOpts();$('no').value=S.me;$('dlg').showModal();$('nt').focus()}
else if(D.cancel){t.closest('dialog').close()}
else if(D.evopen){openEv(sel)}
else if(D.day){if(ev.detail==0)clickDay(D.day)}
else if(D.own){var w=row('todo',D.own),ids=[null].concat(S.people.map(function(p){return p.id}));w.o=ids[(ids.indexOf(w.o==null?null:w.o)+1)%ids.length];save();render()}
else if(t.id=='clr'){if(!S.data.todo.some(function(x){return x.done}))return;if(!armed){armed=1;t.textContent='Bekräfta rensning';setTimeout(function(){armed=0;t.textContent='Rensa avklarade'},3500)}else{armed=0;t.textContent='Rensa avklarade';S.data.todo=S.data.todo.filter(function(x){return !x.done});save();render()}}
else if(t.id=='addP'&&TEAM){t.disabled=true;DB.invite().then(function(link){$('inv').innerHTML='<p class="hint2">Skicka länken till den du vill bjuda in. Den gäller i 7 dagar.</p><div class="prow"><input type="text" readonly value="'+E(link)+'" aria-label="Inbjudningslänk"><button class="pill" data-copy="1">Kopiera</button></div>'}).catch(function(e){$('inv').innerHTML='<p class="warn">'+E(e.message)+'</p>'}).then(function(){t.disabled=false})}
else if(D.copy){var inp=t.parentNode.querySelector('input');inp.select();(navigator.clipboard?navigator.clipboard.writeText(inp.value):Promise.reject()).then(function(){t.textContent='Kopierad!'},function(){document.execCommand('copy');t.textContent='Kopierad!'})}
else if(t.id=='logout'&&TEAM){DB.signOut()}
else if(D.mine!==undefined){S.sf=S.sf||{};S.sf.me=+D.mine;save();render()}
else if(D.pdel&&TEAM){var pp=S.people.filter(function(p){return p.id==D.pdel})[0];if(pp&&confirm('Ta bort '+pp.n+' ur teamet? Personens privata uppgifter raderas. Delade uppgifter blir kvar utan ägare.')){DB.remove(D.pdel).then(function(){S.data.todo.forEach(function(x){if(x.o==D.pdel)x.o=null});save();peopleUI();render()},function(e){alert(e.message)})}}
else if(t.id=='addP'){var mx=0,pal=['#8E44AD','#C0392B','#16A085','#2C3E50','#D4A017'];S.people.forEach(function(p){if(p.id>mx)mx=p.id});S.people.push({id:mx+1,n:'Ny person',c:pal[S.people.length%pal.length]});save();peopleUI();render()}
else if(D.pdel){var pid=+D.pdel;if(S.people.length>1){S.people=S.people.filter(function(p){return p.id!=pid});S.data.todo.forEach(function(x){if(x.o==pid)x.o=null});if(S.me==pid)S.me=S.people[0].id;save();peopleUI();render()}}
else if(t.id=='planOn'){S.plan.on=!S.plan.on;save();look();render()}
else if(t.id=='pwk'){S.plan.wk=!S.plan.wk;save();look();render()}
else if(D.plan||t.id=='planNow'){plan();S.plan.sig=sig();var wd=S.data.sch.filter(function(x){return x.k=='w'&&x.d>=iso(0)}).map(function(x){return x.d}).sort();
if(wd.length&&wd.indexOf(sel)<0){sel=wd[0];var d0=P(sel);cm.y=d0.getFullYear();cm.m=d0.getMonth()}save();render()}
else if(t.id=='editBtn'){edit=!edit;look();render()}
else if(t.id=='reset'){S.colors={};save();look();cols()}
else if(D.th){S.theme=D.th;save();look();cols()}
else if(D.lay){S.layout=D.lay;save();look()}
else if(D.nav){cm.m+=+D.nav;var d=new Date(cm.y,cm.m,1);cm.y=d.getFullYear();cm.m=d.getMonth();render()}
else if(D.tg){var x=row('todo',D.tg);x.done=x.done?0:1;if(x.done)x.dn=iso(0);else delete x.dn;save();render()}
else if(D.lvl){var p=row('todo',D.lvl);p.l=(p.l+1)%3;save();render()}
else if(D.del){var q=D.del.split(':');if(q[0]=='sch')S.data.sch.splice(+q[1],1);else S.data.todo=S.data.todo.filter(function(z){return z.id!=q[1]});save();render()}
else if(D.add){S.data.sch.push({h:'10:00',t:'Ny aktivitet',s:'',d:sel});save();render()}});
document.addEventListener('submit',function(ev){ev.preventDefault();if(ev.target.id=='evf'){addEv();return}var t=$('nt').value.trim();if(!t)return;var p=$('np').value;
S.data.todo.push({id:uid(),t:t,l:p===''?null:+p,d:$('nd').value,est:+$('ne').value,o:idv($('no').value),priv:$('npriv').checked?1:0,done:0});save();render();$('nt').value='';$('npriv').checked=false;$('nd').value='';$('np').value='1';$('ne').value='2';$('dlg').close()});
document.addEventListener('focusout',function(ev){var t=ev.target;if(t.classList&&t.classList.contains('ed')){var r=row(t.dataset.k,t.dataset.i);if(r){var f2=t.dataset.f,v=t.textContent.trim();if(f2=='h'||f2=='s')r[f2]=(v=='–'||v=='--:--')?'':v;else r[f2]=v||'–';save()}}});
document.addEventListener('keydown',function(ev){if(ev.key=='Enter'&&ev.target.classList&&ev.target.classList.contains('ed')){ev.preventDefault();ev.target.blur()}if(ev.key=='Escape')$('menu').classList.remove('open')});
document.addEventListener('change',function(ev){var t=ev.target,id=t.id;
if(t.dataset&&t.dataset.vis){S.hidden[t.dataset.vis]=!t.checked;if(t.checked&&S.layout=='custom'){dashEnsure('bento');dashResolve(t.dataset.vis)}if(S.layout=='custom')dashCompact();save();dashApply();return}
if(id=='pstart'||id=='pend'){S.plan[id=='pstart'?'start':'end']=t.value||(id=='pstart'?'09:00':'17:00');save();render();return}
if(id=='pmax'){S.plan.max=Math.max(1,Math.min(12,+t.value||4));save();render();return}
if(t.dataset.f&&(t.type=='date'||t.tagName=='SELECT')){row(t.dataset.k,t.dataset.i)[t.dataset.f]=t.dataset.f=='est'?+t.value:(t.value||'');save();render()}});
document.addEventListener('input',function(ev){var t=ev.target,D=t.dataset||{};
if(D.col){S.colors[D.col]=t.value;save();look();return}
if(D.pn||D.pc){var p=S.people.filter(function(q){return q.id==(D.pn||D.pc)})[0];if(p){if(D.pn)p.n=t.value||'–';else p.c=t.value;save();render()}}});
var lastDay=null;
function clickDay(day){
  if(lastDay===day){            // andra klicket på samma dag
    lastDay=null;
    openEv(day);
    return;
  }
  lastDay=day;                  // första klicket: bara välj dagen
  sel=day;
  render();
}
var drag=null;
function rng(){var lo=drag.a<drag.b?drag.a:drag.b,hi=drag.a<drag.b?drag.b:drag.a;document.querySelectorAll('#b-cal .d').forEach(function(el){var d=el.dataset.day;el.classList.toggle('rng',d>=lo&&d<=hi)});return [lo,hi]}
document.addEventListener('pointerdown',function(ev){var b=ev.target.closest&&ev.target.closest('#b-cal .d');if(!b||ev.button>0)return;drag={a:b.dataset.day,b:b.dataset.day};rng()});
document.addEventListener('pointermove',function(ev){if(!drag)return;var el=document.elementFromPoint(ev.clientX,ev.clientY),b=el&&el.closest&&el.closest('#b-cal .d');if(b&&b.dataset.day!=drag.b){drag.b=b.dataset.day;rng()}});
document.addEventListener('pointerup',function(){
  if(!drag)return;
  var r=rng();
  drag=null;
  if(r[0]==r[1]){
    clickDay(r[0]);             // en enskild dag: kräver två klick
  }else{
    lastDay=null;               // flera dagar markerade: öppna direkt
    sel=r[0];
    render();
    openEv(r[0],r[1]);
  }
});
document.addEventListener('pointercancel',function(){if(drag){drag=null;render()}});
/* ---------- egen dashboard: visa/dölj, dra och ändra storlek på korten ---------- */
var DASH_KEYS=['dl','cal','prio','sch','todo','dn'],DASH_COLS=12,DASH_ROW=85,DASH_GAP=14,dd=null,
DASH_PRE={bento:{dl:[1,1,6,8],cal:[7,1,6,4],prio:[7,5,6,4],sch:[1,9,6,4],todo:[7,9,6,4],dn:[1,13,12,2]},   /* samma uppställning som bento i style.css */
two:{dl:[1,1,6,4],cal:[7,1,6,4],sch:[1,5,6,4],prio:[7,5,6,4],todo:[1,9,12,4],dn:[1,13,12,2]},
list:{dl:[1,1,12,4],todo:[1,5,12,4],dn:[1,9,12,2],sch:[1,11,12,4],prio:[1,15,12,3],cal:[1,18,12,4]}};
function dashPreset(n){var o={};DASH_KEYS.forEach(function(k){var a=(DASH_PRE[n]||DASH_PRE.bento)[k];o[k]={c:a[0],r:a[1],w:a[2],h:a[3]}});return o}
function dashEnsure(from){if(!S.cards)S.cards=dashPreset(from);DASH_KEYS.forEach(function(k){if(!S.cards[k])S.cards[k]=dashPreset('bento')[k]})}
function dashHit(A,B){return A.c<B.c+B.w&&B.c<A.c+A.w&&A.r<B.r+B.h&&B.r<A.r+A.h}
/* överlappar två kort flyttas det ena under det andra. Kortet du just flyttade ligger kvar. */
function dashResolve(first){var ks=DASH_KEYS.filter(function(k){return !S.hidden[k]}),g=0,ch=true;
while(ch&&g++<300){ch=false;ks.forEach(function(a){ks.forEach(function(b){if(a>=b)return;var A=S.cards[a],B=S.cards[b];if(!dashHit(A,B))return;
var pushB=a==first?true:b==first?false:A.r<=B.r,mv=pushB?B:A,st=pushB?A:B;mv.r=st.r+st.h;ch=true})})}}
/* efter varje ändring glider korten uppåt så att det inte blir tomma ytor */
function dashCompact(){var ks=DASH_KEYS.filter(function(k){return !S.hidden[k]}).sort(function(a,b){var A=S.cards[a],B=S.cards[b];return A.r-B.r||A.c-B.c}),done=[];
ks.forEach(function(k){var p=S.cards[k];while(p.r>1){p.r--;if(done.some(function(q){return dashHit(p,S.cards[q])})){p.r++;break}}done.push(k)})}
function dashFix(first){dashResolve(first);dashCompact()}
function dashEl(k){return document.querySelector('.grid .card.'+k)}
function dashApply(){var custom=S.layout=='custom';
DASH_KEYS.forEach(function(k){var c=dashEl(k);if(!c)return;c.style.display=S.hidden[k]?'none':'';
if(custom){var p=S.cards[k];c.style.gridColumn=p.c+' / span '+p.w;c.style.gridRow=p.r+' / span '+p.h;c.style.order=p.r*100+p.c}else{c.style.gridColumn='';c.style.gridRow='';c.style.order=''}
var z=c.querySelector('.cz');
if(custom&&edit){if(!z){z=document.createElement('i');z.className='cz';z.setAttribute('aria-label','Ändra storlek');c.appendChild(z)}}else if(z)z.remove()})}
function dashVis(){var e=$('cardvis');if(!e)return;
e.innerHTML=DASH_KEYS.map(function(k){return '<label class="crow"><span>'+E(NAMES[k]||k)+'</span><input type="checkbox" data-vis="'+k+'"'+(S.hidden[k]?'':' checked')+'></label>'}).join('')}
/* radernas verkliga höjder (korten växer med sitt innehåll), så att drag och släpp hamnar rätt */
function dashRows(){var cs=getComputedStyle($('grid')),gap=parseFloat(cs.rowGap)||DASH_GAP,st=[],en=[],y=0;
cs.gridTemplateRows.split(' ').map(parseFloat).filter(function(n){return n>0}).forEach(function(h){st.push(y);en.push(y+h);y+=h+gap});return {st:st,en:en,gap:gap}}
function dashRowAt(y,R,end){var a=end?R.en:R.st,best=0,bd=1e9;a.forEach(function(v,i){var d=Math.abs(v-y);if(d<bd){bd=d;best=i}});
var last=a.length?a[a.length-1]:0;if(!a.length||y>last+DASH_ROW/2)best=(a.length?a.length-1:0)+Math.round((y-last)/(DASH_ROW+R.gap));return Math.max(0,best)}
document.addEventListener('pointerdown',function(ev){
if(!edit||ev.button>0||!ev.target.closest)return;
var z=ev.target.closest('.cz'),h=ev.target.closest('.grid .card h2');
if(!z&&(!h||ev.target.closest('button,input,select,a,textarea')))return;
var c=(z||h).closest('.card'),k=DASH_KEYS.filter(function(x){return c.classList.contains(x)})[0];if(!k)return;
if(S.layout!='custom'){var from=S.layout;S.cards=null;dashEnsure(from);S.layout='custom';save();look()}   /* första draget gör nuvarande layout till en egen */
var r=c.getBoundingClientRect();
dd={k:k,c:c,m:z?'rz':'mv',sx:ev.clientX,sy:ev.clientY,ox:ev.clientX-r.left,oy:ev.clientY-r.top,r0:r};
if(dd.m=='mv'){var p=S.cards[k],gh=document.createElement('div');gh.className='dghost';gh.style.gridColumn=p.c+' / span '+p.w;gh.style.gridRow=p.r+' / span '+p.h;$('grid').appendChild(gh);dd.gh=gh;c.classList.add('drag')}
ev.preventDefault()});
document.addEventListener('pointermove',function(ev){if(!dd)return;var g=$('grid').getBoundingClientRect(),px=(g.width+DASH_GAP)/DASH_COLS,R=dashRows(),p=S.cards[dd.k];
if(dd.m=='mv'){dd.c.style.transform='translate('+(ev.clientX-dd.sx)+'px,'+(ev.clientY-dd.sy)+'px)';
dd.t={c:Math.max(1,Math.min(DASH_COLS+1-p.w,Math.round((ev.clientX-dd.ox-g.left)/px)+1)),r:dashRowAt(ev.clientY-dd.oy-g.top,R,false)+1};
dd.gh.style.gridColumn=dd.t.c+' / span '+p.w;dd.gh.style.gridRow=dd.t.r+' / span '+p.h}
else{var w=Math.max(3,Math.min(DASH_COLS+1-p.c,Math.round((ev.clientX-dd.r0.left+DASH_GAP)/px))),h=Math.max(2,dashRowAt(ev.clientY-g.top,R,true)+1-(p.r-1));
dd.t={w:w,h:h};dd.c.style.gridColumn=p.c+' / span '+w;dd.c.style.gridRow=p.r+' / span '+h}});
function dashStop(done){if(!dd)return;var p=S.cards[dd.k];
if(done&&dd.t){if(dd.m=='mv'){p.c=dd.t.c;p.r=dd.t.r}else{p.w=dd.t.w;p.h=dd.t.h}dashFix(dd.k)}
dd.c.style.transform='';dd.c.classList.remove('drag');if(dd.gh)dd.gh.remove();dd=null;save();dashApply()}
document.addEventListener('pointerup',function(){dashStop(true)});
document.addEventListener('pointercancel',function(){dashStop(false)});
look();render();
