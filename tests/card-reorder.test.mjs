import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {createCardReorder} from '../assets/js/card-reorder.mjs';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const products=[1,2,3].map(i=>({id:`00000000-0000-0000-0000-00000000000${i}`,name:`Card ${i}`,sortOrder:i*10}));
function setup(save) {
 const dom=new JSDOM(`<body><div id="status"></div><main id="grid">${products.map(p=>`<article class="card" data-product-id="${p.id}"><h2>${p.name}</h2><a href="https://example.com">Open</a><p>Card text</p></article>`).join('')}</main></body>`);
 const w=dom.window,document=w.document,grid=document.getElementById('grid'),status=document.getElementById('status');
 Object.assign(globalThis,{window:w,document,Element:w.Element,innerHeight:900,getComputedStyle:()=>({gridTemplateColumns:'320px'})});
 let raf;globalThis.requestAnimationFrame=fn=>{raf=fn;return 1};globalThis.cancelAnimationFrame=()=>{raf=null};
 let captured=null;grid.setPointerCapture=id=>{captured=id};grid.hasPointerCapture=id=>captured===id;grid.releasePointerCapture=()=>{captured=null};
 w.scrollBy=()=>{};
 document.elementFromPoint=()=>grid.firstElementChild;
 [...grid.children].forEach((card,i)=>{card.getBoundingClientRect=()=>({left:0,top:i*300,width:320,height:280});});
 const controller=createCardReorder({grid,status,save});controller.setProducts(products);controller.setAllowed(true);
 function pointer(target,type,x=30,y=30,pointerType='touch') {
  const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:x,clientY:y});Object.defineProperties(e,{pointerId:{value:1},isPrimary:{value:true},pointerType:{value:pointerType}});target.dispatchEvent(e);return e;
 }
 return {w,document,grid,status,controller,pointer,tick:()=>raf?.(),order:()=>[...grid.children].map(c=>c.dataset.productId),close:()=>{controller.setAllowed(false);dom.window.close()}};
}

test('long press excludes links and ordinary taps; movement cancels pending hold',async()=>{
 let saves=0;const q=setup(async()=>{saves++;});
 try {
 const card=q.grid.firstElementChild;
 q.pointer(card.querySelector('a'),'pointerdown');await delay(530);
 assert.equal(q.document.querySelector('.reorder-ghost'),null);
 q.pointer(q.w,'pointerup');
 q.pointer(card.querySelector('p'),'pointerdown');q.pointer(q.w,'pointerup');await delay(530);
 assert.equal(q.document.querySelector('.reorder-ghost'),null);
 q.pointer(card.querySelector('p'),'pointerdown');q.pointer(q.w,'pointermove',60,60);await delay(530);
 assert.equal(q.document.querySelector('.reorder-ghost'),null);assert.equal(saves,0);
 }finally{q.close();}
});

test('active drag moves across rows; failed save rolls back; touch scrolling prevented only while dragging',async()=>{
 let rejectSave;const q=setup(()=>new Promise((_,reject)=>{rejectSave=reject}));
 try {
 const previous=q.order(), card=q.grid.firstElementChild;
 const ordinary=new q.w.Event('touchmove',{bubbles:true,cancelable:true});q.grid.dispatchEvent(ordinary);assert.equal(ordinary.defaultPrevented,false);
 q.pointer(card.querySelector('p'),'pointerdown');await delay(530);
 assert.ok(q.document.querySelector('.reorder-ghost'));assert.equal(q.grid.hasPointerCapture(1),true);
 const oldCapture=new q.w.Event('lostpointercapture',{bubbles:true});Object.defineProperty(oldCapture,'pointerId',{value:1});card.querySelector('p').dispatchEvent(oldCapture);
 assert.ok(q.document.querySelector('.reorder-ghost'),'transfer from implicit child capture must not cancel drag');
 const active=new q.w.Event('touchmove',{bubbles:true,cancelable:true});q.grid.dispatchEvent(active);assert.equal(active.defaultPrevented,true);
 q.document.elementFromPoint=()=>q.grid.lastElementChild;
 q.pointer(q.w,'pointermove',40,890);q.tick();assert.deepEqual(q.order(),[previous[1],previous[2],previous[0]]);
 q.pointer(q.w,'pointerup',40,890);assert.match(q.status.textContent,/Saving/);assert.equal(q.document.querySelector('.reorder-ghost'),null);
 rejectSave(new Error('Simulated persistence failure'));await delay(10);
 assert.deepEqual(q.order(),previous);assert.match(q.status.textContent,/Previous order restored/);assert.equal(q.document.body.classList.contains('is-reordering'),false);
 }finally{q.close();}
});

test('Escape/cancel/permission loss restore order; keyboard drop saves ranks',async()=>{
 let saves=0;const q=setup(async payload=>{saves++;return {order:payload.data.order.map((id,i)=>({id,sortOrder:(i+1)*10}))}});
 try {
 const first=q.order()[0];
 q.grid.querySelector('.reorder-handle').dispatchEvent(new q.w.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));await delay(10);
 assert.equal(q.order()[1],first);assert.equal(saves,1);assert.match(q.status.textContent,/Order saved/);
 const before=q.order();q.pointer(q.grid.firstElementChild.querySelector('p'),'pointerdown');await delay(530);
 q.w.dispatchEvent(new q.w.KeyboardEvent('keydown',{key:'Escape'}));assert.deepEqual(q.order(),before);assert.equal(q.document.querySelector('.reorder-ghost'),null);
 q.pointer(q.grid.firstElementChild.querySelector('p'),'pointerdown');await delay(530);q.controller.setAllowed(false);
 assert.equal(q.document.querySelector('.reorder-ghost'),null);assert.equal(q.grid.querySelector('.reorder-handle'),null);assert.equal(saves,1);
 }finally{q.close();}
});


test('mouse grip starts on movement without waiting; mouse text and native dragging cannot steal the hold',async()=>{
 let saves=0;const q=setup(async payload=>{saves++;return {order:payload.data.order.map((id,i)=>({id,sortOrder:(i+1)*10}))}});
 try {
 const before=q.order(),card=q.grid.firstElementChild,grip=card.querySelector('.reorder-handle');
 const down=q.pointer(grip,'pointerdown',30,30,'mouse');assert.equal(down.defaultPrevented,true);
 q.document.elementFromPoint=()=>q.grid.lastElementChild;
 q.pointer(q.w,'pointermove',40,890,'mouse');
 assert.ok(q.document.querySelector('.reorder-ghost'),'direct grip movement starts immediately');
 assert.deepEqual(q.order(),[before[1],before[2],before[0]]);
 q.pointer(q.w,'pointerup',40,890,'mouse');await delay(10);
 assert.equal(saves,1);assert.match(q.status.textContent,/Order saved/);
 const text=q.grid.firstElementChild.querySelector('p');
 assert.equal(q.pointer(text,'pointerdown',30,30,'mouse').defaultPrevented,true);
 const native=new q.w.Event('dragstart',{bubbles:true,cancelable:true});text.dispatchEvent(native);assert.equal(native.defaultPrevented,true);
 q.pointer(q.w,'pointerup',30,30,'mouse');
 const link=q.grid.firstElementChild.querySelector('a');
 assert.equal(q.pointer(link,'pointerdown',30,30,'mouse').defaultPrevented,false);
 const linkDrag=new q.w.Event('dragstart',{bubbles:true,cancelable:true});link.dispatchEvent(linkDrag);assert.equal(linkDrag.defaultPrevented,false);
 }finally{q.close();}
});


test('drop flushes its final coordinates before the next animation frame; no-op drop clears active status',async()=>{
 let saves=0;const q=setup(async payload=>{saves++;return {order:payload.data.order.map((id,i)=>({id,sortOrder:(i+1)*10}))}});
 try {
 const before=q.order();
 q.pointer(q.grid.firstElementChild.querySelector('.reorder-handle'),'pointerdown',30,30,'mouse');
 q.pointer(q.w,'pointermove',35,30,'mouse');
 q.document.elementFromPoint=()=>q.grid.lastElementChild;
 q.pointer(q.w,'pointermove',40,850,'mouse'); // Deliberately do not run RAF.
 q.pointer(q.w,'pointerup',40,890,'mouse');await delay(10);
 assert.deepEqual(q.order(),[before[1],before[2],before[0]]);assert.equal(saves,1);
 q.document.elementFromPoint=()=>q.grid.firstElementChild;
 q.pointer(q.grid.firstElementChild.querySelector('.reorder-handle'),'pointerdown',30,30,'mouse');
 q.pointer(q.w,'pointermove',35,30,'mouse');q.pointer(q.w,'pointerup',35,30,'mouse');
 assert.match(q.status.textContent,/Order unchanged/);assert.equal(saves,1);assert.equal(q.document.querySelector('.reorder-ghost'),null);
 }finally{q.close();}
});
