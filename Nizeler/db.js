/* db.js – konton, team och synk mot Supabase.
   Laddas sist i index.html och laddar sedan script.js, sprint.js och whiteboard.js.
   Är config.js tom körs appen lokalt i webbläsaren precis som förut. */
(function(){
'use strict';
var APP=['script.js','sprint.js','whiteboard.js'];
function g(id){return document.getElementById(id)}
function loadApp(){return APP.reduce(function(p,src){return p.then(function(){return new Promise(function(ok,fail){
  var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=function(){fail(new Error('Kunde inte ladda '+src))};document.body.appendChild(s)})})},Promise.resolve())
  .then(function(){document.body.classList.add('ready')})}

/* ---------- lokalt läge ---------- */
if(!window.SB_URL||!window.SB_KEY){document.body.classList.add('local');loadApp();return}

var DB=window.DB={on:true},sb,me,team,role,teamName,snap={},inflight={},mem='';
if(!window.supabase||!window.supabase.createClient){gate('auth','Kunde inte ladda Supabase. Kontrollera internetanslutningen och ladda om sidan.');return}
sb=window.supabase.createClient(window.SB_URL,window.SB_KEY);

/* ---------- hjälpare ---------- */
function uid(){return window.crypto&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,10)}
/* jämförbar JSON: samma innehåll ger samma text oavsett nyckelordning */
function stab(v){if(Array.isArray(v))return '['+v.map(stab).join(',')+']';
  if(v&&typeof v=='object')return '{'+Object.keys(v).sort().filter(function(k){return v[k]!==undefined&&typeof v[k]!='function'}).map(function(k){return JSON.stringify(k)+':'+stab(v[k])}).join(',')+'}';
  var j=JSON.stringify(v);return j===undefined?'null':j}
function fel(e){var m=(e&&(e.message||e.error_description||e.msg))||String(e),T={
  'Invalid login credentials':'Fel e-post eller lösenord.',
  'Email not confirmed':'Du behöver bekräfta din e-post först. Kolla inkorgen (och skräpposten).',
  'User already registered':'Det finns redan ett konto med den e-posten. Logga in i stället.',
  'rate limit':'För många försök just nu. Vänta en stund och försök igen.',
  'Failed to fetch':'Ingen kontakt med servern. Kontrollera internetanslutningen.'};
  for(var k in T)if(m.toLowerCase().indexOf(k.toLowerCase())>-1)return T[k];
  if(/password/i.test(m)&&/(least|short|characters)/i.test(m))return 'Lösenordet är för kort.';
  return m}
var COLORS=['#3A52E0','#D9772B','#2E9D6B','#8E44AD','#C0392B','#16A085'];
function pick(){return COLORS[Math.floor(Math.random()*COLORS.length)]}
function here(){return location.origin+location.pathname}

/* ---------- inloggningsrutan ---------- */
var mode='in';
function gate(view,msg,good){var G=g('gate');if(!G)return;G.hidden=false;
  ['g-auth','g-team','g-reset'].forEach(function(f){var e=g(f);if(e)e.hidden=f!='g-'+view});
  g('g-h').textContent={auth:mode=='up'?'Skapa konto':'Logga in',team:'Skapa ditt team',reset:'Välj nytt lösenord'}[view];
  say(msg||'',good);if(view=='auth')setMode(mode)}
function say(m,ok){var e=g('g-msg');if(e){e.textContent=m;e.classList.toggle('ok',!!ok)}}
function setMode(m){mode=m;var up=m=='up';document.querySelectorAll('.g-su').forEach(function(e){e.hidden=!up});
  g('g-h').textContent=up?'Skapa konto':'Logga in';g('g-go').textContent=up?'Skapa konto':'Logga in';
  g('g-mode').textContent=up?'Har du redan ett konto? Logga in':'Inget konto? Skapa ett';g('g-pw').autocomplete=up?'new-password':'current-password'}
function wait(f,on){f.querySelectorAll('button,input').forEach(function(b){b.disabled=on})}

document.addEventListener('click',function(ev){var t=ev.target.closest&&ev.target.closest('button');if(!t)return;
  if(t.id=='g-mode'){setMode(mode=='up'?'in':'up');say('')}
  else if(t.id=='g-forgot'){var em=g('g-email').value.trim();if(!em){say('Skriv din e-post först, så skickar vi en länk.');g('g-email').focus();return}
    sb.auth.resetPasswordForEmail(em,{redirectTo:here()}).then(function(r){say(r.error?fel(r.error):'Om e-posten finns hos oss har vi skickat en länk för att välja nytt lösenord.',!r.error)})}
  else if(t.dataset.out)DB.signOut()});

document.addEventListener('submit',function(ev){var f=ev.target;if(!f.id||f.id.indexOf('g-')!=0)return;ev.preventDefault();ev.stopImmediatePropagation();wait(f,true);say('');
  var done=function(){wait(f,false)};
  if(f.id=='g-auth'){var em=g('g-email').value.trim(),pw=g('g-pw').value;
    if(mode=='up'){var nm=g('g-name').value.trim();if(!nm){say('Skriv ditt namn.');done();return}
      sb.auth.signUp({email:em,password:pw,options:{data:{name:nm},emailRedirectTo:here()}}).then(function(r){done();
        if(r.error)return say(fel(r.error));
        if(r.data.session)return location.reload();
        say('Nästan klart! Vi har skickat ett mejl till '+em+'. Klicka på länken i mejlet för att aktivera kontot.',true)})}
    else sb.auth.signInWithPassword({email:em,password:pw}).then(function(r){if(r.error){done();return say(fel(r.error))}location.reload()})}
  else if(f.id=='g-team'){sb.rpc('create_team',{team_name:g('g-tname').value.trim(),my_name:g('g-tme').value.trim(),my_color:COLORS[0]}).then(function(r){
      if(r.error){done();return say(fel(r.error))}location.reload()})}
  else if(f.id=='g-reset'){sb.auth.updateUser({password:g('g-newpw').value}).then(function(r){done();
      if(r.error)return say(fel(r.error));g('gate').hidden=true;if(!document.body.classList.contains('ready'))location.replace(here())})}
},true);

sb.auth.onAuthStateChange(function(ev){if(ev=='PASSWORD_RECOVERY')setTimeout(function(){gate('reset')},0)});

/* ---------- data: vilka listor i S som delas med teamet ---------- */
var C={todo:function(){return S.data.todo},sch:function(){return S.data.sch},proj:function(){return S.projects},always:function(){return S.always},
  sprint:function(){return S.sprints},el:function(){return S.board.els},link:function(){return S.board.links},stroke:function(){return S.board.strokes}};
var PERSONAL=['theme','layout','colors','cards','hidden','plan','sf','pg','cur'];
var S;   /* samma objekt som window.S i script.js */
function isPriv(kind,x){return !!x.priv||(kind=='sch'&&x.k=='w')}   /* egna planerade arbetspass är alltid privata */
function LK(){return 'kreativet-'+me.id}

/* lägg in eller uppdatera en rad som kommer från databasen. Returnerar true om något ändrades. */
function apply(r){var key=r.kind+':'+r.id;
  if(r.kind=='cfg'){var j0=stab(r.data);if(snap[key]===j0||inflight[key]===j0)return false;if(r.id=='stale')S.stale=+r.data.v||7;snap[key]=j0;return true}
  if(!C[r.kind])return false;
  var d=r.data||{};d.priv=r.private?1:0;if(r.owner)d.by=r.owner;if(d.id==null)d.id=r.id;
  var j=stab(d);if(snap[key]===j||inflight[key]===j)return false;
  var a=C[r.kind](),i=-1;for(var n=0;n<a.length;n++)if(String(a[n].id)===String(r.id)){i=n;break}
  if(i>-1){var o=a[i];Object.keys(o).forEach(function(k){delete o[k]});Object.assign(o,d)}else a.push(d);   /* ändra på plats så att referenser i appen håller */
  snap[key]=j;return true}
function drop(kind,id){var key=kind+':'+id;if(!(key in snap))return false;delete snap[key];if(!C[kind])return true;
  var a=C[kind]();for(var n=a.length-1;n>=0;n--)if(String(a[n].id)===String(id))a.splice(n,1);return true}

function fetchAll(){var out=[],N=1000;
  function page(from){return sb.from('items').select('kind,id,data,private,owner').eq('team_id',team).order('kind').order('id').range(from,from+N-1).then(function(r){
    if(r.error)throw r.error;out=out.concat(r.data);return r.data.length<N?out:page(from+N)})}
  return page(0)}
function fetchMembers(){return sb.from('members').select('user_id,name,color,role').eq('team_id',team).order('joined_at').then(function(r){
  if(r.error)throw r.error;
  if(!r.data.some(function(m){return m.user_id==me.id})){location.reload();return}
  S.people=r.data.map(function(m){return {id:m.user_id,n:m.name,c:m.color,role:m.role}});
  var mine=S.people.filter(function(p){return p.id==me.id})[0];mem=stab([mine.n,mine.c])})}

/* ---------- start ---------- */
function boot(){
  var q=new URLSearchParams(location.search),code=q.get('join');
  if(code){sessionStorage.setItem('kv-join',code);q.delete('join');history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash)}
  return sb.auth.getSession().then(function(r){var ses=r.data&&r.data.session;
    if(!ses){var j=sessionStorage.getItem('kv-join');if(j)mode='up';gate('auth',j?'Du har blivit inbjuden till ett team. Skapa ett konto (eller logga in) för att gå med.':'',true);return}
    me=ses.user;DB.me=me.id;DB.email=me.email;
    return sb.from('members').select('team_id,role').eq('user_id',me.id).maybeSingle().then(function(m){if(m.error)throw m.error;
      var j=sessionStorage.getItem('kv-join'),nm=(me.user_metadata&&me.user_metadata.name)||me.email.split('@')[0];
      if(!m.data){
        if(j)return sb.rpc('join_team',{invite_code:j,my_name:nm,my_color:pick()}).then(function(r){sessionStorage.removeItem('kv-join');
          if(r.error){g('g-tme').value=nm;return gate('team',fel(r.error)+' Be om en ny inbjudan, eller skapa ett eget team.')}location.reload()});
        g('g-tme').value=nm;return gate('team')}
      if(j)sessionStorage.removeItem('kv-join');
      team=m.data.team_id;role=m.data.role;DB.team=team;DB.role=role;return start()})})
  .catch(function(e){console.error(e);gate('auth','Något gick fel: '+fel(e))})}

function start(){
  var P={};try{P=JSON.parse(localStorage.getItem(LK()))||{}}catch(e){}
  S={};PERSONAL.forEach(function(k){if(P[k]!=null)S[k]=P[k]});
  S.data={todo:[],sch:[]};S.projects=[];S.always=[];S.sprints=[];S.board={els:[],links:[],strokes:[],last:P.wblast||[]};S.me=me.id;
  DB.S=S;
  return Promise.all([fetchAll(),fetchMembers(),sb.from('teams').select('name').eq('id',team).single()]).then(function(res){
    var rows=res[0];teamName=res[2].data&&res[2].data.name;DB.teamName=teamName;
    rows.forEach(apply);
    if(!rows.length&&role=='owner')importLocal();
    return loadApp()}).then(function(){listen();DB.sync()})}

/* första gången ägaren startar ett tomt team tas den lokala datan med */
function importLocal(){var flag='kreativet-imported-'+team;if(localStorage.getItem(flag))return;localStorage.setItem(flag,'1');
  var o=null;try{o=JSON.parse(localStorage.getItem('bento-v2'))}catch(e){}if(!o)return;
  var own=function(x){x.o=(x.o!=null&&x.o==o.me)?me.id:null;return x};
  if(o.data){S.data.todo=(o.data.todo||[]).map(own);S.data.sch=(o.data.sch||[]).filter(function(x){return x.k!='w'})}
  ['projects','always','sprints'].forEach(function(k){if(o[k])S[k]=o[k]});
  if(o.board){S.board.els=o.board.els||[];S.board.links=o.board.links||[];S.board.strokes=o.board.strokes||[]}
  if(o.stale)S.stale=o.stale;
  PERSONAL.forEach(function(k){if(o[k]!=null&&S[k]==null)S[k]=o[k]});if(S.cur==null&&o.cur!=null)S.cur=o.cur}

/* ---------- spara ---------- */
var timer=null,busy=false,again=false,state='';
function status(s,txt){state=s;var e=g('sync');if(!e)return;e.className='sync '+s;e.textContent=txt}
DB.saveLocal=function(){try{var P={wblast:(S.board.last||[]).slice(-100)};PERSONAL.forEach(function(k){if(S[k]!=null)P[k]=S[k]});localStorage.setItem(LK(),JSON.stringify(P))}catch(e){}};
DB.sync=function(){clearTimeout(timer);timer=setTimeout(push,400)};
function push(){timer=null;if(!S||!team)return;if(busy){again=true;return}
  var up=[],seen={},dels={},keys=[];
  Object.keys(C).forEach(function(kind){C[kind]().forEach(function(x){
    if(x.id==null||x.id==='')x.id=uid();if(!x.by)x.by=me.id;x.priv=isPriv(kind,x)?1:0;
    var key=kind+':'+x.id;if(seen[key])return;seen[key]=1;var j=stab(x);
    if(snap[key]!==j){up.push({team_id:team,kind:kind,id:String(x.id),data:x,private:isPriv(kind,x)});keys.push([key,j])}})});
  var cv={v:S.stale||7},cj=stab(cv);seen['cfg:stale']=1;
  if(snap['cfg:stale']!==cj){up.push({team_id:team,kind:'cfg',id:'stale',data:cv,private:false});keys.push(['cfg:stale',cj])}
  Object.keys(snap).forEach(function(key){if(!seen[key]){var i=key.indexOf(':');(dels[key.slice(0,i)]=dels[key.slice(0,i)]||[]).push(key.slice(i+1))}});
  var mine=S.people&&S.people.filter(function(p){return p.id==me.id})[0],mj=mine?stab([mine.n,mine.c]):mem;
  if(!up.length&&!Object.keys(dels).length&&mj==mem){if(state!='err')status('ok','Sparat');return}
  busy=true;status('saving','Sparar…');keys.forEach(function(k){inflight[k[0]]=k[1]});
  var p=Promise.resolve();
  for(var i=0;i<up.length;i+=200)(function(chunk){p=p.then(function(){return sb.from('items').upsert(chunk,{onConflict:'team_id,kind,id'}).then(function(r){if(r.error)throw r.error})})})(up.slice(i,i+200));
  Object.keys(dels).forEach(function(kind){var ids=dels[kind];for(var i=0;i<ids.length;i+=200)(function(part){p=p.then(function(){
    return sb.from('items').delete().eq('team_id',team).eq('kind',kind).in('id',part).then(function(r){if(r.error)throw r.error})})})(ids.slice(i,i+200))});
  if(mj!=mem)p=p.then(function(){return sb.from('members').update({name:(mine.n||'–').slice(0,60),color:mine.c}).eq('user_id',me.id).then(function(r){if(r.error)throw r.error;mem=mj})});
  p.then(function(){keys.forEach(function(k){snap[k[0]]=k[1]});Object.keys(dels).forEach(function(kind){dels[kind].forEach(function(id){delete snap[kind+':'+id]})});status('ok','Sparat')})
   .catch(function(e){console.error('Synk:',e);status('err','Kunde inte spara – försöker igen');setTimeout(DB.sync,5000)})
   .then(function(){inflight={};busy=false;if(again){again=false;push()}})}
window.addEventListener('beforeunload',function(e){if(timer||busy){push();e.preventDefault();e.returnValue=''}});

/* ---------- ändringar från andra i teamet ---------- */
var pend=false,ptr=false;
function uiBusy(){var a=document.activeElement;return ptr||!!document.querySelector('dialog[open]')||!!(a&&a!==document.body&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&!(a.type=='checkbox'||a.type=='radio')))}
function changed(){window.dirty=true;pend=true;later()}
function later(){setTimeout(function(){if(pend&&!uiBusy()){pend=false;window.render()}},60)}
document.addEventListener('pointerdown',function(){ptr=true},true);
['pointerup','pointercancel','focusout'].forEach(function(t){document.addEventListener(t,function(){if(t!='focusout')ptr=false;later()},true)});
document.addEventListener('close',later,true);

var live=null,wasDown=false,hidAt=0;
function listen(){
  live=sb.channel('team-'+team)
  .on('postgres_changes',{event:'*',schema:'public',table:'items',filter:'team_id=eq.'+team},function(p){var c=false;
    if(p.eventType=='DELETE'){var o=p.old||{};if(o.team_id&&o.team_id!=team)return;c=drop(o.kind,o.id)}
    else if(p.new&&p.new.team_id==team)c=apply(p.new);
    if(c)changed()})
  .on('postgres_changes',{event:'*',schema:'public',table:'members',filter:'team_id=eq.'+team},function(){fetchMembers().then(changed)})
  .subscribe(function(s){if(s=='SUBSCRIBED'){if(wasDown){wasDown=false;refresh()}}else if(s=='CHANNEL_ERROR'||s=='TIMED_OUT'||s=='CLOSED')wasDown=true})}
/* hämta allt igen efter avbrott, så att inget missas */
function refresh(){return Promise.all([fetchAll(),fetchMembers()]).then(function(res){var c=false,have={};
  res[0].forEach(function(r){have[r.kind+':'+r.id]=1;if(apply(r))c=true});
  Object.keys(snap).forEach(function(key){if(!have[key]&&!(key in inflight)){var i=key.indexOf(':');if(drop(key.slice(0,i),key.slice(i+1)))c=true}});
  changed()}).catch(function(e){console.error('Uppdatering:',e)})}
document.addEventListener('visibilitychange',function(){if(document.hidden){hidAt=Date.now();if(timer)push()}else if(team&&hidAt&&Date.now()-hidAt>120000)refresh()});

/* ---------- för appen ---------- */
DB.canPriv=function(x){return !x||!x.by||x.by==me.id};
DB.invite=function(){return sb.rpc('create_invite').then(function(r){if(r.error)throw new Error(fel(r.error));return here()+'?join='+r.data})};
DB.remove=function(id){return sb.rpc('remove_member',{member:id}).then(function(r){if(r.error)throw new Error(fel(r.error));return fetchMembers().then(changed)})};
DB.signOut=function(){var go=function(){sb.auth.signOut().then(function(){location.replace(here())})};if(timer||busy){push();setTimeout(go,800)}else go()};

boot();
})();
