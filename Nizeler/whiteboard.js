/* whiteboard.js – ladda EFTER sprint.js. Kräver <template id="wbtpl"> i index.html
   samt window.SPG och window.onPage-anropet i sprint.js. */
(function(){
'use strict';
if(!window.SPG||typeof S=='undefined'||!document.getElementById('wbtpl')){console.error('whiteboard.js: kräver sprint.js med raden window.SPG=PG, samt <template id="wbtpl"> i index.html.');return}

/* ---------- data ---------- */
var B=S.board=S.board||{els:[],links:[],strokes:[],last:[]};B.last=B.last||[];
/* migrering: lappar från den gamla whiteboarden (S.wb) görs om till element */
if(S.wb){if(!B.migr)S.wb.forEach(function(n){B.els.push({id:'m'+n.id,k:'note',x:n.x,y:n.y,w:190,h:120,t:n.t||'',bg:['#FFF3B0','#FFD3BC','#C4EBD6','#CFE0FF'][n.c%4]})});delete S.wb;delete B.migr;save()}
var tool='sel',sel=null,selL=null,link0=null,dg=null,pen=null,er=false,arm=0,msg='',SVGNS='http://www.w3.org/2000/svg';
var HINT={sel:'Dra för att flytta, dra i hörnet för att ändra storlek, dubbelklicka för att skriva. Delete tar bort det markerade.',pen:'Rita fritt med musen eller fingret.',erase:'Dra över en linje eller pil för att sudda den.',link:'Klicka på första formen och sedan på den andra för att dra en pil.',
free:'Rita en form med musen eller fingret. När du släpper sluts den och fylls. Därefter kan du flytta den, ändra storlek och byta färger.'};
var QE={};   /* tom = dubbelklick krävs för att skriva. Skriv {text:1,note:1} för att kunna skriva direkt vid enkelklick */
var SH={dia:'<polygon points="50,2 98,50 50,98 2,50"/>',circle:'<ellipse cx="50" cy="50" rx="48" ry="48"/>',tri:'<polygon points="50,4 97,96 3,96"/>',star:'<polygon points="50,3 61,36 97,37 68,58 79,92 50,72 21,92 32,58 3,37 39,36"/>',heart:'<path d="M50 90C10 60 2 35 20 18 33 6 46 12 50 26 54 12 67 6 80 18 98 35 90 60 50 90Z"/>',hex:'<polygon points="25,5 75,5 98,50 75,95 25,95 2,50"/>'};
var DEF={circle:[120,120,''],tri:[140,120,''],star:[140,135,''],heart:[130,120,''],hex:[150,120,''],box:[150,70,'Process'],round:[150,56,'Start'],dia:[160,110,'Beslut?'],text:[180,40,'Text'],note:[190,130,'']};
function el(id){return B.els.filter(function(e){return e.id==id})[0]}
function uid(){return 'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)}
function note(){var m=$('wmsg');if(m)m.textContent=msg}
function persist(){save();
if(!(window.DB&&DB.on)){try{var j=JSON.stringify(S).length;msg=j>4.5e6?'Tavlan börjar bli full ('+(j/1e6).toFixed(1)+' MB). Ta bort bilder du inte behöver.':''}catch(e){}}note()}

/* ---------- ritning ---------- */
function edge(e,tx,ty){var cx=e.x+e.w/2,cy=e.y+e.h/2,dx=tx-cx,dy=ty-cy;if(!dx&&!dy)return [cx,cy];var s=Math.min((e.w/2)/Math.abs(dx||1e-9),(e.h/2)/Math.abs(dy||1e-9));return [cx+dx*s,cy+dy*s]}
function pd(p){return 'M'+p.map(function(q){return q[0]+' '+q[1]}).join(' L')}
function svg(){var h='<defs><marker id="wah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>';
B.links.forEach(function(l){var a=el(l.a),b=el(l.b);if(!a||!b)return;var p=edge(a,b.x+b.w/2,b.y+b.h/2),q=edge(b,a.x+a.w/2,a.y+a.h/2),c='x1="'+p[0]+'" y1="'+p[1]+'" x2="'+q[0]+'" y2="'+q[1]+'"';
h+='<line '+c+' stroke="currentColor" stroke-width="'+(l.id==selL?4:2)+'" marker-end="url(#wah)"/><line class="wlh" data-lid="'+l.id+'" '+c+' stroke="transparent" stroke-width="16"/>'});
B.strokes.forEach(function(s){h+='<path class="wsk" data-sid="'+s.id+'" d="'+pd(s.pts)+(s.f?'Z':'')+'" fill="'+(s.f||'none')+'" stroke="'+s.c+'" stroke-width="'+s.w+'" stroke-linecap="round" stroke-linejoin="round"/>'});
$('wsv').innerHTML=h}
function nodes(){$('wel').innerHTML=B.els.map(function(e){var sh=e.k=='free'?'<path d="'+e.d+'"/>':SH[e.k],bg=(e.bg&&!sh)?'background:'+e.bg+';':'',col=e.bg?(lum(e.bg)>.55?'color:#14213D;':'color:#fff;'):'',
inner=e.k=='img'?'<img src="'+e.src+'" alt="'+E(e.name||'Bild')+'" draggable="false">':e.k=='file'?'<a href="'+e.src+'" download="'+E(e.name)+'">Fil: '+E(e.name)+'</a>':'<div class="wt">'+E(e.t||'')+'</div>';
return '<div class="wn wk-'+e.k+(e.id==sel?' on':'')+(e.id==link0?' lk':'')+'" data-id="'+e.id+'" style="left:'+e.x+'px;top:'+e.y+'px;width:'+e.w+'px;height:'+e.h+'px;'+col+'"><div class="wsh" style="'+bg+'">'+(sh?'<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="fill:'+(e.bg||'color-mix(in srgb,currentColor 18%,var(--cbg))')+';stroke:'+(e.c||'currentColor')+';stroke-width:'+(e.sw||2.5)+'"><g class="wsel">'+sh+'</g><g class="wlkg">'+sh+'</g>'+sh+'</svg>':'')+'</div>'+inner+'<i class="rz" data-rz="1"></i></div>'}).join('')}
function mark(){document.querySelectorAll('.wn').forEach(function(n){n.classList.toggle('on',n.dataset.id==sel)});svg()}
function tb(){var v=$('wbv');if(!v)return;v.className='t-'+tool;document.querySelectorAll('[data-w^="tool:"]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.w=='tool:'+tool)});var h=$('whint');if(h)h.textContent=HINT[tool]||'';note()}
var UI={wpc:'#3A52E0',wpw:'4',wfc:'#FFF3B0'};   /* pennans färg, tjocklek och fyllning behålls när tavlan ritas om */
function draw(){if(!$('wbv'))return;Object.keys(UI).forEach(function(k){var i=$(k);if(i&&i.value!=UI[k])i.value=UI[k]});nodes();svg();tb()}

/* ---------- element ---------- */
function mid(w,h){var b=$('wbb');return [Math.max(10,Math.round(b.scrollLeft+b.clientWidth/2-w/2+Math.random()*40)),Math.max(10,Math.round(b.scrollTop+b.clientHeight/2-h/2+Math.random()*40))]}
function place(e){var m=mid(e.w,e.h);e.x=m[0];e.y=m[1];B.els.push(e);B.last.push(['e',e.id]);sel=e.id;selL=null;tool='sel';persist();draw();if(QE[e.k])edit(e.id)}
function edit(id){var n=document.querySelector('.wn[data-id="'+id+'"]'),t=n&&n.querySelector('.wt');if(!t)return;t.contentEditable='true';t.focus();var r=document.createRange();r.selectNodeContents(t);r.collapse(false);var s=window.getSelection();s.removeAllRanges();s.addRange(r)}
function add(k){var d=DEF[k],e={id:uid(),k:k,w:d[0],h:d[1],t:d[2]};if(k=='note')e.bg='#FFF3B0';place(e)}
function shrink(f,cb){var r=new FileReader();r.onload=function(){var im=new Image();im.onload=function(){var s=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL(f.type=='image/png'?'image/png':'image/jpeg',.82),c.width,c.height)};im.src=r.result};r.readAsDataURL(f)}
function files(list){Array.prototype.forEach.call(list,function(f){
if(/^image\//.test(f.type)){shrink(f,function(src,w,h){var s=Math.min(1,300/w);place({id:uid(),k:'img',w:Math.round(w*s),h:Math.round(h*s),src:src,name:f.name})})}
else if(f.size>7e5){msg='Filen "'+f.name+'" är för stor (max ca 0,7 MB). Lägg den i projektets mapp och länka den.';note()}
else{var r=new FileReader();r.onload=function(){place({id:uid(),k:'file',w:210,h:60,src:r.result,name:f.name})};r.readAsDataURL(f)}})}
function delSel(){if(sel){B.els=B.els.filter(function(e){return e.id!=sel});B.links=B.links.filter(function(l){return l.a!=sel&&l.b!=sel});sel=null}else if(selL){B.links=B.links.filter(function(l){return l.id!=selL});selL=null}persist();draw()}
function undo(){while(B.last.length){var l=B.last.pop(),t=l[0],id=l[1],ok=false;
if(t=='e'&&el(id)){B.els=B.els.filter(function(e){return e.id!=id});B.links=B.links.filter(function(x){return x.a!=id&&x.b!=id});ok=true}
else if(t=='l'&&B.links.some(function(x){return x.id==id})){B.links=B.links.filter(function(x){return x.id!=id});ok=true}
else if(t=='s'&&B.strokes.some(function(x){return x.id==id})){B.strokes=B.strokes.filter(function(x){return x.id!=id});ok=true}
if(ok)break}persist();draw()}
function freeEl(pts,c,w,f){var xs=pts.map(function(p){return p[0]}),ys=pts.map(function(p){return p[1]}),x0=Math.min.apply(0,xs),y0=Math.min.apply(0,ys),W=Math.max(14,Math.max.apply(0,xs)-x0),H=Math.max(14,Math.max.apply(0,ys)-y0);
return {id:uid(),k:'free',x:x0,y:y0,w:W,h:H,t:'',bg:f,c:c,sw:w,d:'M'+pts.map(function(p){return ((p[0]-x0)/W*100).toFixed(1)+' '+((p[1]-y0)/H*100).toFixed(1)}).join(' L')+' Z'}}
function pt(ev){var r=$('wbv').getBoundingClientRect();return [Math.round(ev.clientX-r.left),Math.round(ev.clientY-r.top)]}
function ers(ev){var t=document.elementFromPoint(ev.clientX,ev.clientY);if(!t||!t.dataset)return;
if(t.dataset.sid){B.strokes=B.strokes.filter(function(s){return s.id!=t.dataset.sid});svg();persist()}
else if(t.dataset.lid){B.links=B.links.filter(function(l){return l.id!=t.dataset.lid});svg();persist()}}

/* ---------- händelser ---------- */
function closeMenu(){document.querySelectorAll('.wmenu').forEach(function(m){m.hidden=true});document.querySelectorAll('[aria-haspopup]').forEach(function(b){b.setAttribute('aria-expanded','false')})}
function toggleMenu(id,b){var m=$(id),was=m.hidden;closeMenu();if(was){m.hidden=false;b.setAttribute('aria-expanded','true')}}
function zorder(m){var e=sel&&el(sel);if(!e){msg='Markera ett element först.';note();return}var i=B.els.indexOf(e);B.els.splice(i,1);B.els.splice(m=='front'?B.els.length:m=='back'?0:m=='up'?Math.min(B.els.length,i+1):Math.max(0,i-1),0,e);msg='';persist();draw()}
document.addEventListener('click',function(ev){if($('wbv')&&!(ev.target.closest&&ev.target.closest('.wdd')))closeMenu()});
document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('[data-w]');if(!b||!$('wbv'))return;var a=b.dataset.w.split(':');
if(a[0]=='tool'){tool=a[1];link0=null;closeMenu();draw()}
else if(a[0]=='shapes')toggleMenu('wmenu',b)
else if(a[0]=='zmenu')toggleMenu('wzmenu',b)
else if(a[0]=='z'){closeMenu();zorder(a[1])}
else if(a[0]=='shape'){closeMenu();add(a[1])}
else if(a[0]=='add')add(a[1]);
else if(a[0]=='file')$('wfile').click();
else if(a[0]=='undo')undo();
else if(a[0]=='del')delSel();
else if(a[0]=='clear'){if(!arm){arm=1;b.textContent='Säker?';setTimeout(function(){arm=0;b.textContent='Rensa tavlan'},3000)}else{arm=0;b.textContent='Rensa tavlan';B.els=[];B.links=[];B.strokes=[];B.last=[];sel=selL=link0=null;persist();draw()}}});
document.addEventListener('pointerdown',function(ev){var v=$('wbv');if(!v||!v.contains(ev.target))return;
if(ev.target.closest('.wt')&&ev.target.closest('.wt').isContentEditable)return;
var p=pt(ev);
if((tool=='pen'||tool=='free')&&ev.target.closest('#wsv')){pen={pts:[p,p],c:$('wpc').value,w:+$('wpw').value,f:tool=='free'?($('wfc').value||'#FFF3B0'):null};var t=document.createElementNS(SVGNS,'path');t.setAttribute('d',pd(pen.pts));t.setAttribute('fill',pen.f||'none');t.setAttribute('stroke',pen.c);t.setAttribute('stroke-width',pen.w);t.setAttribute('stroke-linecap','round');t.setAttribute('stroke-linejoin','round');$('wsv').appendChild(t);pen.el=t;return}
if(tool=='erase'){er=true;ers(ev);return}
var lh=ev.target.closest('.wlh'),n=ev.target.closest('.wn');
if(tool=='sel'&&lh){selL=lh.dataset.lid;sel=null;draw();return}
if(tool=='link'){if(!n)return;if(!link0)link0=n.dataset.id;else if(link0!=n.dataset.id){var l={id:uid(),a:link0,b:n.dataset.id};B.links.push(l);B.last.push(['l',l.id]);link0=null;persist()}else link0=null;draw();return}
if(tool=='sel'){selL=null;if(!n){sel=null;draw();return}var e=el(n.dataset.id);sel=e.id;
dg=ev.target.closest('.rz')?{m:'rz',e:e}:{m:'mv',e:e,ox:p[0]-e.x,oy:p[1]-e.y,sx:p[0],sy:p[1],mv:0};ev.preventDefault();mark()}});
document.addEventListener('pointermove',function(ev){
if(pen){var p=pt(ev),l=pen.pts[pen.pts.length-1];if(Math.abs(p[0]-l[0])+Math.abs(p[1]-l[1])>2){pen.pts.push(p);pen.el.setAttribute('d',pd(pen.pts))}return}
if(er){ers(ev);return}
if(dg){var p2=pt(ev),e=dg.e;if(dg.m=='mv'){if(Math.abs(p2[0]-dg.sx)+Math.abs(p2[1]-dg.sy)>4)dg.mv=1;if(dg.mv){e.x=Math.max(0,p2[0]-dg.ox);e.y=Math.max(0,p2[1]-dg.oy)}}else{e.w=Math.max(60,p2[0]-e.x);e.h=Math.max(40,p2[1]-e.y)}
var d=document.querySelector('.wn[data-id="'+e.id+'"]');if(d){d.style.left=e.x+'px';d.style.top=e.y+'px';d.style.width=e.w+'px';d.style.height=e.h+'px'}svg()}});
document.addEventListener('pointerup',function(){
if(pen){if(pen.f){var fe=freeEl(pen.pts,pen.c,pen.w,pen.f);B.els.push(fe);B.last.push(['e',fe.id]);sel=fe.id;selL=null;tool='sel';pen=null;persist();draw()}else{var s={id:uid(),c:pen.c,w:pen.w,pts:pen.pts};B.strokes.push(s);B.last.push(['s',s.id]);pen=null;persist();svg()}}
er=false;if(dg){var q=dg;dg=null;persist();if(q.m=='mv'&&!q.mv&&QE[q.e.k])edit(q.e.id)}});
document.addEventListener('dblclick',function(ev){var n=ev.target.closest&&ev.target.closest('.wn');if(!n||tool!='sel')return;var t=n.querySelector('.wt');if(!t||t.isContentEditable)return;edit(n.dataset.id)});
document.addEventListener('focusout',function(ev){var t=ev.target;if(t.classList&&t.classList.contains('wt')&&t.isContentEditable){var n=t.closest('.wn'),e=n&&el(n.dataset.id);if(e){e.t=t.innerText.replace(/\n$/,'');t.contentEditable='false';persist()}}});
document.addEventListener('keydown',function(ev){if(!$('wbv'))return;var a=document.activeElement;
if(a&&a.classList&&a.classList.contains('wt')&&a.isContentEditable){if(ev.key=='Escape')a.blur();return}
if(a&&(a.isContentEditable||/INPUT|TEXTAREA|SELECT/.test(a.tagName))||document.querySelector('dialog[open]'))return;
if(ev.key=='Delete'||ev.key=='Backspace'){ev.preventDefault();delSel()}else if(ev.key=='Escape'){sel=selL=link0=null;closeMenu();draw()}});
/* färg och tjocklek: Fyllning gäller allt utom bild/fil, Penna och Tjocklek gäller former */
function canFill(e){return e&&e.k!='img'&&e.k!='file'}
function isShape(e){return e&&(SH[e.k]||e.k=='free')}
document.addEventListener('input',function(ev){var id=ev.target.id,e=sel&&el(sel);if(id in UI)UI[id]=ev.target.value;
if(id=='wfc'&&canFill(e)){e.bg=ev.target.value;nodes()}
else if(id=='wpc'&&isShape(e)){e.c=ev.target.value;nodes()}});
document.addEventListener('change',function(ev){var t=ev.target,e=sel&&el(sel);if(t.id in UI)UI[t.id]=t.value;
if(t.id=='wfile'){files(t.files);t.value=''}
else if(t.id=='wfc'&&canFill(e))persist();
else if(t.id=='wpc'&&isShape(e))persist();
else if(t.id=='wpw'&&isShape(e)){e.sw=+t.value;nodes();persist()}});
/* migrering: äldre fria former (ritade som streck) görs om till riktiga element */
var mig=0;B.strokes=B.strokes.filter(function(s){if(!s.f)return true;B.els.push(freeEl(s.pts,s.c,s.w,s.f));mig=1;return false});if(mig)save();

/* ---------- koppling till sprint.js ---------- */
/* verktyg och markering nollställs när man går till tavlan, inte när den ritas om (t.ex. när någon annan ändrar något) */
var lastPg=null;
window.SPG.wb=function(){return $('wbtpl').innerHTML};
window.onPage=function(p){if(p=='wb'){if(lastPg!='wb'){tool='sel';sel=selL=link0=null}else if(sel&&!el(sel))sel=null;draw()}lastPg=p};
if(S.pg=='wb')render();
})();