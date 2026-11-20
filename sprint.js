/* sprint.js – ladda EFTER script.js. Kräver HTML-blocken i sprint.html (#mnav, #pgs, #tdlg) i index.html. */
(function(){
'use strict';
if(typeof S=='undefined'||typeof render!='function'||typeof who!='function'||typeof lum!='function'||typeof addD!='function'||typeof ymd!='function'||typeof T0=='undefined'){console.error('sprint.js: hittar inte script.js. Ladda sprint.js efter script.js i index.html.');return}
var need=['mnav','pgs','tdlg','tpl-backlog','tpl-sprint','tpl-kcol','tpl-kc','tpl-hr','tpl-chip','tpl-brow','tpl-proj','tpl-arow','tpl-pcard','tpl-pnote','tpl-link','tpl-chk'].filter(function(i){return !document.getElementById(i)});
if(need.length){console.error('sprint.js: HTML saknas i index.html. Lägg in allt från sprint.html. Saknas: '+need.join(', '));return}
/* ---------- data ---------- */
var PAL=['#3A52E0','#D9772B','#2E9D6B','#8E44AD','#C0392B','#16A085'],
COLS=[['todo','Att göra'],['doing','Pågår'],['pause','Pausad'],['done','Klar']],PS={on:'Pågår',pause:'Pausad',stop:'Stannat av'};
S.projects=S.projects||[{id:1,n:'Kreativet',c:PAL[0],ps:'on',links:[],dump:'',note:'',upd:iso(0),chk:{}}];
S.always=S.always||[{id:1,t:'Const: mål och målgrupp definierade'},{id:2,t:'Var: status uppdaterad i veckan'},{id:3,t:'Const: projektmappen delad med teamet'}];
S.sprints=S.sprints||[];S.stale=S.stale||7;S.pg=S.pg||'over';
S.sf=S.sf||{me:0,who:'',tag:'',q:'',st:'',bq:'',bp:'',sq:''};
S.data.todo.forEach(function(x){if(!x.upd)x.upd=iso(0)});
function mkSp(s){return {id:uid(),n:'Sprint '+(S.sprints.length+1),s:s,e:ymd(addD(P(s),20)),dod:'',mt:0}}   /* 21 dagar = 3 veckor */
if(!S.sprints.length){var m0=new Date(T0);m0.setDate(m0.getDate()-(m0.getDay()+6)%7);S.sprints.push(mkSp(ymd(m0)))}
if(!S.cur||!S.sprints.some(function(s){return s.id==S.cur})){S.cur=(S.sprints.filter(function(s){return iso(0)>=s.s&&iso(0)<=s.e})[0]||S.sprints[0]).id}

/* ---------- hjälpare ---------- */
var T=function(){return S.data.todo},cur=function(){return S.sprints.filter(function(s){return s.id==S.cur})[0]||S.sprints[0]},
proj=function(id){return S.projects.filter(function(p){return p.id==id})[0]},days=function(d){return Math.round((T0-P(d))/864e5)},est=function(x){return x.est||2};
function stOf(x){return x.done?'done':(x.st&&x.st!='done'?x.st:'todo')}
function setSt(x,v){x.st=v;x.upd=iso(0);x.done=v=='done'?1:0;if(x.done)x.dn=iso(0);else delete x.dn}
/* en uppgift hör till en sprint om den lagts dit manuellt, eller om deadline/planerade pass ligger inom sprintens datum */
function inSp(x,sp){if(x.sp)return x.sp==sp.id;return !!(x.d&&x.d>=sp.s&&x.d<=sp.e)||S.data.sch.some(function(y){return y.k=='w'&&y.src==x.id&&y.d>=sp.s&&y.d<=sp.e})}
function anySp(x){return S.sprints.some(function(sp){return inSp(x,sp)})}
function fl(x){var f=S.sf,t=(x.tags||[]).join(' ').toLowerCase(),q=(f.q||'').toLowerCase();
if(f.me&&x.o!=S.me)return false;if(f.who&&x.o!=f.who)return false;if(f.tag&&t.indexOf(f.tag.toLowerCase())<0)return false;if(f.st&&stOf(x)!=f.st)return false;
return !q||(x.t+' '+(x.desc||'')+' '+t).toLowerCase().indexOf(q)>-1}
function pj(x){var p=proj(x.p);return p?'<span class="pj" style="background:'+p.c+';color:'+(lum(p.c)>.55?'#14213D':'#fff')+'">'+E(p.n)+'</span>':''}
function tg(x){return lock(x)+(x.tags||[]).map(function(t){return '<span class="tg">#'+E(t)+'</span>'}).join('')}
function popts(sel,lab){return '<option value="">'+lab+'</option>'+S.projects.map(function(p){return '<option value="'+p.id+'"'+(p.id==sel?' selected':'')+'>'+E(p.n)+'</option>'}).join('')}
function eopts(v){return [1,2,3,4,6,8,12,16].map(function(h){return '<option value="'+h+'"'+(h==(v||2)?' selected':'')+'>'+h+' h</option>'}).join('')}

/* ---------- sidor (markup finns i sprint.html som <template>) ---------- */
function tp(id,d){return $(id).innerHTML.replace(/\{\{(\w+)\}\}/g,function(m,k){return d[k]==null?'':d[k]})}
function each(a,id,f){return a.map(function(x,i){return tp(id,f(x,i))}).join('')}
function kc(x){var s=stOf(x),sd=days(x.upd||iso(0)),stale=s=='doing'&&sd>=S.stale;
return tp('tpl-kc',{id:x.id,t:E(x.t),pj:pj(x),tg:tg(x),h:est(x),sr:x.sr?'<span class="sr">P'+x.sr+'</span>':'',who:who(x,false),nt:s=='pause'&&x.note?'<p class="nt">'+E(x.note)+'</p>':'',warn:stale?'<p class="warn">⚠ Ingen uppdatering på '+sd+' dagar</p>':''})}
function pgSprint(){var sp=cur(),f=S.sf,q=(f.sq||'').toLowerCase(),
all=T().filter(function(x){return inSp(x,sp)}),shown=all.filter(fl).sort(function(a,b){return (a.sr||9)-(b.sr||9)}),
n=Math.round((P(sp.e)-P(sp.s))/864e5)+1,tot={},mx=1;
all.forEach(function(x){var o=tot[x.o||0]=tot[x.o||0]||{t:0,d:0};o.t+=est(x);if(x.done)o.d+=est(x);if(o.t>mx)mx=o.t});
var hrs=each(Object.keys(tot),'tpl-hr',function(k){var p=S.people.filter(function(q){return q.id==k})[0],o=tot[k];return {name:E(p?p.n:'Ingen ägare'),w:o.t/mx*100,t:o.t,d:o.d}})||'<p class="empty">Inga uppgifter i sprinten ännu. Uppgifter med deadline i perioden hamnar här automatiskt.</p>',
stale=all.filter(function(x){return stOf(x)=='doing'&&days(x.upd)>=S.stale}).length;
return tp('tpl-sprint',{n:n,weeks:(n/7).toFixed(1).replace('.',','),sq:E(f.sq||''),
chips:each(S.sprints.filter(function(s){return !q||(s.n+' '+s.s+' '+s.e).toLowerCase().indexOf(q)>-1}),'tpl-chip',function(s){return {on:s.id==sp.id?' on':'',id:s.id,label:E(s.n)+' · '+s.s.slice(5)+' – '+s.e.slice(5)}}),
name:E(sp.n),s:sp.s,e:sp.e,mdis:sp.mt?' disabled':'',mtxt:sp.mt?'Sprintmöten bokade':'Boka sprintmöten',dod:E(sp.dod||''),
hrs:hrs,stale:stale?'<p class="warn">⚠ '+stale+' pågående uppgift'+(stale>1?'er':'')+' saknar uppdatering på '+S.stale+'+ dagar</p>':'',
shown:shown.length,all:all.length,q:E(f.q||''),tag:E(f.tag||''),
whoopts:S.people.map(function(p){return '<option value="'+p.id+'"'+(p.id==f.who?' selected':'')+'>'+E(p.n)+'</option>'}).join(''),
stopts:COLS.map(function(c){return '<option value="'+c[0]+'"'+(c[0]==f.st?' selected':'')+'>'+c[1]+'</option>'}).join(''),
cols:each(COLS,'tpl-kcol',function(c){var it=shown.filter(function(x){return stOf(x)==c[0]});return {col:c[0],name:c[1],n:it.length,cards:it.map(kc).join('')}})})}
function pgBacklog(){var f=S.sf,q=(f.bq||'').toLowerCase(),
items=T().filter(function(x){return !x.done&&!anySp(x)&&mine(x)&&(!f.bp||x.p==f.bp)&&(!q||(x.t+' '+(x.desc||'')+' '+(x.tags||[]).join(' ')).toLowerCase().indexOf(q)>-1)});
return tp('tpl-backlog',{popts:popts('','Inget projekt'),eopts:eopts(),count:items.length,sprint:E(cur().n),bq:E(f.bq||''),bpopts:popts(f.bp,'Alla projekt'),
list:items.length?'<ul>'+each(items,'tpl-brow',function(x){return {id:x.id,t:E(x.t),pj:pj(x),tg:tg(x),h:est(x),who:who(x,false),sprint:E(cur().n)}})+'</ul>':'<p class="empty">'+(f.me?'Inga uppgifter i backloggen är tilldelade dig. Välj Alla för att se hela backloggen.':'Backloggen är tom.')+'</p>'})}
function pcard(p){var d=days(p.upd||iso(0)),stale=p.ps=='on'&&d>=S.stale,ts=T().filter(function(x){return x.p==p.id}),dn=ts.filter(function(x){return x.done}).length;
return tp('tpl-pcard',{id:p.id,c:p.c,n:E(p.n),d:d,done:dn,total:ts.length,
psopts:Object.keys(PS).map(function(k){return '<option value="'+k+'"'+(k==p.ps?' selected':'')+'>'+PS[k]+'</option>'}).join(''),
stale:stale?'<p class="warn">⚠ Ingen uppdatering på '+d+' dagar. Skriv en rad i braindumpen eller ändra status.</p>':'',
dump:E(p.dump||''),note:p.ps!='on'?tp('tpl-pnote',{id:p.id,note:E(p.note||'')}):'',
links:each(p.links,'tpl-link',function(l,i){return {u:E(l.u),t:E(l.t),id:p.id,i:i}}),
chk:each(S.always,'tpl-chk',function(a){return {id:p.id,aid:a.id,t:E(a.t),checked:p.chk[a.id]?' checked':''}})})}
function pgProj(){return tp('tpl-proj',{stale:S.stale,always:each(S.always,'tpl-arow',function(a){return {id:a.id,t:E(a.t)}}),cards:S.projects.map(pcard).join('')})}

/* ---------- navigering ---------- */
var nav=$('mnav'),pgs=$('pgs');
var PG={backlog:pgBacklog,sprint:pgSprint,proj:pgProj},tm;   /* PG.wb läggs till av whiteboard.js */
window.SPG=PG;
function rp(){if(PG[S.pg])pgs.innerHTML=PG[S.pg]();if(window.onPage)window.onPage(S.pg)}
function rpKeep(t){var k='[data-sc="'+t.dataset.sc+'"][data-fd="'+t.dataset.fd+'"]',pos=t.selectionStart;rp();var n=pgs.querySelector(k);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}}
function show(){var o=S.pg=='over';$('grid').style.display=o?'':'none';pgs.style.display=o?'none':'';nav.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.pg==S.pg)});rp()}
var _r=render;render=function(){_r();rp()};

/* ---------- uppgiftsdialog ---------- */
var dl=$('tdlg');
var g=function(k){return $('td-'+k)};
function det(id){var x=T().filter(function(z){return z.id==id})[0];if(!x)return;dl.dataset.id=id;
function o(v,t,s){return '<option value="'+v+'"'+(String(s)==String(v)?' selected':'')+'>'+t+'</option>'}
g('t').value=x.t;g('desc').value=x.desc||'';g('crit').value=x.crit||'';g('note').value=x.note||'';g('est').value=est(x);g('tg').value=(x.tags||[]).join(', ');
g('p').innerHTML=o('','Inget projekt','')+S.projects.map(function(p){return o(p.id,E(p.n),x.p)}).join('');
g('sp').innerHTML=o('','Auto (efter datum)',x.sp||'')+S.sprints.map(function(s){return o(s.id,E(s.n),x.sp)}).join('');
g('sr').innerHTML=o('','–',x.sr||'')+[1,2,3,4,5].map(function(n){return o(n,'P'+n+(n==1?' (högst)':''),x.sr)}).join('');
g('st').innerHTML=COLS.map(function(c){return o(c[0],c[1],stOf(x))}).join('');
g('o').innerHTML=o('','Ingen','')+S.people.map(function(p){return o(p.id,E(p.n),x.o)}).join('');
g('priv').checked=!!x.priv;g('priv').disabled=!!(window.DB&&DB.on&&!DB.canPriv(x));dl.showModal()}
function saveDet(){var x=T().filter(function(z){return z.id==dl.dataset.id})[0];if(!x)return;
x.t=g('t').value.trim()||x.t;x.desc=g('desc').value;x.crit=g('crit').value;x.note=g('note').value;x.est=+g('est').value||2;
x.p=idv(g('p').value)??undefined;x.sp=idv(g('sp').value)??undefined;x.sr=g('sr').value?+g('sr').value:undefined;x.o=idv(g('o').value);
if(!g('priv').disabled)x.priv=g('priv').checked?1:0;
x.tags=g('tg').value.split(',').map(function(t){return t.trim()}).filter(Boolean);
var ns=g('st').value;if(ns!=stOf(x))setSt(x,ns);else x.upd=iso(0);save();dl.close();render()}

/* ---------- händelser ---------- */
function val(sel){var e=pgs.querySelector('[data-ad="'+sel+'"]');return e?e.value.trim():''}
var armedP=0;
document.addEventListener('click',function(ev){
var l=ev.target.closest('#b-todo .lbl,#b-dn .lbl');
if(l&&!l.querySelector('.ed[contenteditable]')){var sp0=l.querySelector('[data-i]');if(sp0){det(sp0.dataset.i);return}}
var b=ev.target.closest('[data-a],[data-pg]');if(!b)return;var D=b.dataset,a=D.a,id=idv(D.id),x=T().filter(function(z){return z.id==id})[0],sp=cur();
if(D.pg){S.pg=D.pg;save();show();return}
switch(a){
case 'open':det(id);break;
case 'tosp':if(x){x.sp=S.cur;x.upd=iso(0);save();render()}break;
case 'mv':if(x){var i=0;COLS.forEach(function(c,k){if(c[0]==stOf(x))i=k});i=Math.max(0,Math.min(3,i+ +D.d));setSt(x,COLS[i][0]);save();render();if(COLS[i][0]=='pause')det(id)}break;
case 'sp':S.cur=id;save();rp();break;
case 'nsp':var last=S.sprints.reduce(function(m,s){return s.e>m?s.e:m},'0000'),ns=mkSp(ymd(addD(P(last),1)));S.sprints.push(ns);S.cur=ns.id;save();rp();break;
case 'mtg':sp.mt=1;S.data.sch.push({t:'Sprintplanering: '+sp.n,h:'10:00',m:60,d:sp.s,k:'e',s:'Planera sprinten',b:0},{t:'Sprintreview: '+sp.n,h:'15:00',m:60,d:sp.e,k:'e',s:'Definition of done och retro',b:0});save();render();break;
case 'badd':var t=val('t');if(!t)break;S.data.todo.push({id:uid(),t:t,est:+val('e')||2,p:idv(val('p'))??undefined,tags:val('g').split(',').map(function(s){return s.trim()}).filter(Boolean),o:S.me,upd:iso(0),done:0});save();render();break;
case 'padd':S.projects.push({id:uid(),n:'Nytt projekt',c:PAL[S.projects.length%PAL.length],ps:'on',links:[],dump:'',note:'',upd:iso(0),chk:{}});save();rp();break;
case 'pdel':if(!armedP){armedP=id;b.textContent='Säker?';setTimeout(function(){armedP=0;b.textContent='×'},3000)}else{S.projects=S.projects.filter(function(p){return p.id!=id});T().forEach(function(z){if(z.p==id)z.p=undefined});armedP=0;save();render()}break;
case 'ladd':var p1=proj(id),n1=val('lt'+id),u1=val('lu'+id);if(p1&&u1){if(!/^(https?|file):/i.test(u1))u1='https://'+u1;p1.links.push({t:n1||u1,u:u1});p1.upd=iso(0);save();rp()}break;
case 'ldel':proj(id).links.splice(+D.i,1);save();rp();break;
case 'aadd':var at=val('al');if(at){S.always.push({id:uid(),t:at});save();rp()}break;
case 'adel':S.always=S.always.filter(function(z){return z.id!=id});save();rp();break;
case 'tdx':dl.close();break;
case 'tds':saveDet();break}});
pgs.addEventListener('input',function(ev){var t=ev.target,D=t.dataset,v=t.value;if(!D.sc||t.tagName=='SELECT'||t.type=='date'||t.type=='checkbox')return;
if(D.sc=='sp'){cur()[D.fd]=v;save()}
else if(D.sc=='pj'){var p=proj(D.id);p[D.fd]=v;if(D.fd=='dump'||D.fd=='note')p.upd=iso(0);save()}
else if(D.sc=='cfg'){S.stale=+v||7;save()}
else if(D.sc=='sf'){S.sf[D.fd]=v;clearTimeout(tm);tm=setTimeout(function(){rpKeep(t)},250)}});
pgs.addEventListener('change',function(ev){var t=ev.target,D=t.dataset;if(!D.sc)return;
if(D.sc=='sf'&&t.tagName=='SELECT'){S.sf[D.fd]=t.value;save();rp()}
else if(D.sc=='pj'&&t.tagName=='SELECT'){var p=proj(D.id);p[D.fd]=t.value;p.upd=iso(0);save();rp()}
else if(D.sc=='sp'&&t.type=='date'){var sp=cur();sp[D.fd]=t.value||sp[D.fd];if(D.fd=='s')sp.e=ymd(addD(P(sp.s),20));save();render()}
else if(D.sc=='chk'){var q=proj(D.id);q.chk[D.fd]=t.checked;q.upd=iso(0);save();rp()}});
/* drag och släpp i kanban */
pgs.addEventListener('dragstart',function(ev){var c=ev.target.closest('.kc');if(c)ev.dataTransfer.setData('text/plain',c.dataset.id)});
pgs.addEventListener('dragover',function(ev){if(ev.target.closest('.kcol'))ev.preventDefault()});
pgs.addEventListener('drop',function(ev){var c=ev.target.closest('.kcol');if(!c)return;ev.preventDefault();var id=+ev.dataTransfer.getData('text/plain'),x=T().filter(function(z){return z.id==id})[0];
if(x&&stOf(x)!=c.dataset.col){setSt(x,c.dataset.col);save();render();if(c.dataset.col=='pause')det(id)}});
save();show();
})();