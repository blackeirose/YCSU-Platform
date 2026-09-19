import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {writingCard} from '../assets/js/writing-model.mjs';

const article={slug:'visual-fixture',title:'A clear idea',date:'2026-09-18',category:'Education',cover:'/writing/visual-fixture/cover.webp',excerpt:'An editorial excerpt.'};
test('Writing card uses singular and plural counts with cover before featured article title and no Product metadata',()=>{
 for(const [count,label] of [[0,'0 ARTICLES'],[1,'1 ARTICLE'],[2,'2 ARTICLES']]){
  const dom=new JSDOM(writingCard(Array.from({length:count},(_,i)=>({...article,slug:'fixture-'+i}))));
  const card=dom.window.document.querySelector('.writing-card');
  assert.equal(card.querySelector('.writing-count').textContent,label);
  assert.ok(card.querySelector('.writing-cover').compareDocumentPosition(card.querySelector('.writing-article-title'))&dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
  assert.equal(card.querySelectorAll('.badge,.version-row,.meta-list').length,0);
  if(count)assert.equal(card.querySelector('.writing-date').textContent,'2026-09-18 · Education');
  dom.window.close();
 }
});
test('reader has compact sans editorial typography and a bounded readable measure',async()=>{
 const css=await readFile(new URL('../assets/writing.css',import.meta.url),'utf8');
 const dom=new JSDOM(`<style>${css}</style><section class="writing-reader"><header class="article-header"><h1>Title</h1></header><div class="article-body"><p>Body</p></div></section>`);
 const style=dom.window.getComputedStyle(dom.window.document.querySelector('.article-body'));
 assert.ok(parseFloat(style.fontSize)>=17&&parseFloat(style.fontSize)<=19);
 assert.ok(parseFloat(style.lineHeight)>=1.55&&parseFloat(style.lineHeight)<=1.7);
 assert.ok(parseFloat(style.maxWidth)>=650&&parseFloat(style.maxWidth)<=760);
 assert.doesNotMatch(style.fontFamily,/Georgia|serif/);
 dom.window.close();
});
