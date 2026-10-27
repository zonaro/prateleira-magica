import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'assets/js/page-turn.js'),'utf8');
const html=fs.readFileSync(path.join(root,'livro.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/css/app.css'),'utf8');
let mobile=true, reduced=false, memory=8, cores=8;
let eventLog=[], instances=[], rafId=0, timerId=0;
const raf=new Map(), timers=new Map(), storage=new Map();
function page() {
  return {
    hidden:false,
    inert:false,
    attrs:{},
    setAttribute(name,value) { this.attrs[name]=value; }
  };
}
const parent={ insertBefore(element){ element.parentNode=this; } };
const events={};
const book={
  parentNode:parent, nextSibling:null,clientWidth:360,style:{},
  classList:{
    flags:{},
    toggle(name,enabled){this.flags[name]=enabled;},
  },
  replaceChildren(...nodes){this.nodes=nodes;},
  getBoundingClientRect(){return {width:this.clientWidth};},
  addEventListener(name,fn){events[name]=fn;},
  removeEventListener(name){delete events[name];}
};
class FakeFlip {
  constructor(element,settings){
    this.element=element; this.settings=settings;this.handlers={};instances.push(this);
  }
  on(type,fn){this.handlers[type]=fn;}
  loadFromHTML(items){this.pages=items;}
  turnToPage(index){this.current=index;if(this.handlers.flip)this.handlers.flip({data:index});}
  flip(index){this.pending=index;this.handlers.changeState({data:'flipping'});}
  finish(){this.current=this.pending;this.handlers.flip({data:this.current});this.handlers.changeState({data:'read'});}
  getUI(){return { removeHandlers(){},setHandlers(){} };}
  destroy(){book.parentNode=null;this.destroyed=true;}
}
const window={
  St:{ PageFlip:FakeFlip },document:{hidden:false},innerHeight:800,
  navigator:{ get deviceMemory(){return memory;},get hardwareConcurrency(){return cores;} },
  matchMedia(query){return { matches:query.includes('reduced-motion')?reduced:mobile };},
  localStorage:{getItem(key){return storage.get(key)||null;},setItem(key,v){storage.set(key,v);},removeItem(key){storage.delete(key);}},
  requestAnimationFrame(fn){rafId++;raf.set(rafId,fn);return rafId;},
  cancelAnimationFrame(id){raf.delete(id);},
  setTimeout(fn){timerId++;timers.set(timerId,fn);return timerId;},
  clearTimeout(id){timers.delete(id);}
};
vm.runInNewContext(source,{window,console});
const adapter=window.LivrinhoPageTurn;
function mount(count=4,settings={}) {
  const nodes=Array.from({length:count},page);
  const callback=(index)=>eventLog.push(index);
  const result=adapter.mount(book,nodes,0,callback,{
    onModeChange:(change)=>eventLog.push(change.mode+':'+change.reason),
    ...settings
  });
  return {nodes,result};
}
function flushFrame(timestamp) {
  const entry=raf.entries().next().value;
  assert(entry,'Era esperado um quadro de animação');
  raf.delete(entry[0]);entry[1](timestamp);
}

// Pouca RAM: não cria PageFlip, mas mantém uma folha visível por vez.
memory=2;cores=2;
let {nodes,result}=mount();
assert.equal(result.mode,'light');
assert.equal(instances.length,0);
assert.equal(nodes[0].hidden,false);
assert.equal(nodes[1].hidden,true);
assert.equal(book.classList.flags['reader-simple'],true);
assert.equal(adapter.busy(),false);
assert.equal(adapter.go(2),true);
assert.equal(nodes[2].hidden,false);
assert.equal(nodes[0].hidden,true);
assert.equal(eventLog.at(-1),2);
assert.equal(adapter.go(6),false,'Sem pular páginas que ainda não foram montadas');
assert(events.touchstart && events.touchend);
events.touchstart({touches:[{clientX:330,clientY:100}],target:{closest(){return null;}}});
events.touchend({changedTouches:[{clientX:50,clientY:115}]});
assert.equal(eventLog.at(-1),3,'Swipe horizontal permite avançar no modo leve');
events.touchstart({touches:[{clientX:320,clientY:100}],target:{closest(){return null;}}});
events.touchend({changedTouches:[{clientX:220,clientY:290}]});
assert.equal(eventLog.at(-1),3,'Rolagem vertical não pode mudar de página');
adapter.destroy();
assert.equal(book.classList.flags['reader-simple'],false);

// Preferência manual sem animação mesmo em dispositivo rápido.
memory=8;cores=8;
adapter.setPreference('light');
result=mount().result;
assert.equal(result.mode,'light');
adapter.setPreference('animated');
result=mount().result;
assert.equal(result.mode,'animated');
assert.equal(instances.length,1);
assert.equal(instances[0].settings.drawShadow,false,'Sombras devem ser reduzidas no celular');
assert.equal(instances[0].settings.flippingTime,540);
assert.equal(adapter.go(1),true);
assert.equal(adapter.busy(),true);
flushFrame(16);
flushFrame(135);
flushFrame(235);
flushFrame(340); // 3 atrasos severos > 90ms
assert.equal(adapter.currentMode(),'light','Frames lentos devem desativar imediatamente a engine');
assert(instances[0].destroyed);
assert.equal(adapter.preference(),'auto','Após o engasgo, a preferência retorna a automático');
assert.equal(adapter.busy(),false,'Não pode ficar preso após desativar a animação');
assert.equal(adapter.go(1),true);
assert.equal(eventLog.at(-1),1);
assert(storage.has('prateleira-pageflip-slow-v1'),'Queda de desempenho deve ser lembrada');
assert.equal(raf.size,0);
assert.equal(timers.size,0);

// Não reintroduzir o lag ao abrir outro livro no mesmo aparelho.
result=mount().result;
assert.equal(result.mode,'light');
adapter.setPreference('animated'); // usuário explicitamente optou por experimentar
assert(!storage.has('prateleira-pageflip-slow-v1'));
result=mount().result;
assert.equal(result.mode,'animated');
adapter.go(1);
assert.equal(adapter.busy(),true);
const watchdog=[...timers.values()][0];
assert.equal(typeof watchdog,'function');
watchdog();
assert.equal(adapter.currentMode(),'light','Uma virada presa deve recuperar a leitura');
assert.equal(adapter.busy(),false);
assert.equal(adapter.go(1),true);

// Em aba oculta, rAF congelado não significa incapacidade do aparelho.
adapter.setPreference('animated');
mount();
adapter.go(1);
window.document.hidden=true;
flushFrame(16);
flushFrame(700);
assert.equal(adapter.currentMode(),'animated','Aba oculta não pode causar falso positivo');
window.document.hidden=false;
adapter.destroy();

// Preferência do sistema por menos movimento é respeitada inclusive manualmente.
reduced=true;
adapter.setPreference('animated');
result=mount().result;
assert.equal(result.mode,'light');
assert.equal(instances.at(-1).destroyed,true);
assert(html.includes('id="pageAnimationMode"') && html.includes('id="pageAnimationStatus"'));
assert(css.includes('.book.reader-simple > .flip-page[hidden]'), 'Esconder páginas não visíveis');
assert(css.includes('touch-action:pan-y'), 'Rolar texto verticalmente');
const reader=fs.readFileSync(path.join(root,'assets/js/reader.js'),'utf8');
assert(reader.includes("$('#pageAnimationMode').addEventListener('change'"));
assert(reader.includes('onModeChange: ({ mode, reason })'));
assert(reader.includes("pageTurn.currentMode() === 'light'"));
assert(reader.includes('returned && preferences?.unlockYoYo?.()'),
  'Desbloqueio do ioiô e progresso continuam integrados ao onPageFlip');
console.log('✓ Recuo automático por memória, CPU e movimento reduzido');
console.log('✓ Travamento de rAF ou virada presa recupera leitura e salva modo leve');
console.log('✓ Botões, swipe horizontal, rolagem vertical, novo livro e tentativa manual');
