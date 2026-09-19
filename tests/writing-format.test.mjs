import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {formatSelection} from '../assets/js/writing-format.mjs';
import {parseArticle,serializeArticle,markdown,articleHtml} from '../assets/js/writing-content.mjs';
import {articleEditor} from '../assets/js/writing-editor.mjs';
const source=await readFile(new URL('fixtures/content/writing/qa-first.md',import.meta.url),'utf8');
test('old articles default to 18; only numeric 17/18/19/20 frontmatter round-trips',()=>{
 assert.equal(parseArticle(source).body_font_size,18);
 for(const size of [12,13,14,15,16,17,18,19,20])assert.equal(parseArticle(serializeArticle({...parseArticle(source),body_font_size:size})).body_font_size,size);
 for(const value of ['11','21','18.5','"18"','null','true','"18px"','"18; color:red"'])assert.throws(()=>parseArticle(source.replace('slug:',`body_font_size: ${value}\nslug:`)),/body_font_size/);
});
for(const action of ['bold','italic'])test(`${action} selection preserves surrounding text and toggles repeatedly`,()=>{
 const text='Before selected words after.',mark=action==='bold'?'**':'*';let result=formatSelection(text,7,21,action);
 assert.equal(result.text,`Before ${mark}selected words${mark} after.`);
 assert.equal(formatSelection(result.text,result.start,result.end,action).text,text);
 assert.equal(formatSelection(mark+'word'+mark,0,4+2*mark.length,action).text,'word');
 assert.match(markdown(result.text),action==='bold'?/<strong>selected words<\/strong>/:/<em>selected words<\/em>/);
});
test('mixed bold/italic and nested emphasis render and serialize cleanly',()=>{
 let result=formatSelection('A reaction.',2,10,'bold');result=formatSelection(result.text,result.start,result.end,'italic');
 assert.equal(result.text,'A ***reaction***.');assert.equal(markdown(result.text),'<p>A <strong><em>reaction</em></strong>.</p>');
 assert.equal(formatSelection(result.text,result.start,result.end,'bold').text,'A *reaction*.');
 assert.equal(formatSelection(result.text,result.start,result.end,'italic').text,'A **reaction**.');
 for(const body of ['**Bold with *italic* inside**','*Italic with **bold** inside*',result.text]){const a=parseArticle(serializeArticle({...parseArticle(source),body}));assert.equal(a.body,body);const dom=new JSDOM(a.html);assert.equal(dom.window.document.querySelectorAll('strong').length,1);assert.equal(dom.window.document.querySelectorAll('em').length,1);dom.window.close();}
});
test('heading/subheading/quote/link map to safe Markdown and preserve existing image',()=>{
 const image='\n\n![Image](/writing/qa-first/cover.webp)';
 for(const [action,prefix,tag] of [['h2','## ','h2'],['h3','### ','h3'],['quote','> ','blockquote']]){const r=formatSelection('A heading'+image,0,9,action);assert.equal(r.text,prefix+'A heading'+image);assert.match(markdown(r.text),new RegExp('<'+tag+'>A heading'));assert.equal(formatSelection(r.text,r.start,r.end,action).text,'A heading'+image);}
 const r=formatSelection('A label'+image,2,7,'link','https://example.com/path');assert.equal(r.text,'A [label](https://example.com/path)'+image);assert.match(markdown(r.text),/href="https:\/\/example.com\/path"/);assert.match(markdown(r.text),/src="\/writing\/qa-first\/cover.webp"/);
 for(const url of ['javascript:alert(1)','https://user:secret@example.com','https://example.com/a b'])assert.throws(()=>formatSelection('label',0,5,'link',url));
});
test('paragraph emphasis preserves whitespace, rejects code/image selections and empty selection',()=>{
 assert.equal(formatSelection(' first\n\nsecond ',0,15,'bold').text,' **first**\n\n**second** ');
 for(const text of ['`code`','![Image](/writing/qa-first/cover.webp)','[label](https://example.com)','```\ncode\n```'])assert.throws(()=>formatSelection(text,0,text.length,'bold'));
 assert.throws(()=>formatSelection('word',1,1,'bold'));
 assert.throws(()=>formatSelection('```\ncode\n```',4,8,'h2'));
});
test('body size affects only body; title metadata and sidebar CSS stay identical',async()=>{
 const css=await readFile(new URL('../assets/writing.css',import.meta.url),'utf8');let baseline;
 for(const size of [12,13,14,15,16,17,18,19,20]){const dom=new JSDOM(`<style>${css}</style><div class="writing-index"><strong>Index</strong></div>${articleHtml({...parseArticle(source),body_font_size:size})}`);const d=dom.window.document,style=el=>dom.window.getComputedStyle(d.querySelector(el));assert.equal(style('.article-body').fontSize,size+'px');const rest=['.article-header h1','.writing-date','.writing-index strong'].map(el=>style(el).fontSize);baseline??=rest;assert.deepEqual(rest,baseline);dom.window.close();}
});
test('toolbar preserves selection on click, previews immediately and submits numeric body size',async()=>{
 const dom=new JSDOM('<body>'),w=dom.window;globalThis.document=w.document;let saved,current=true;
 const form=articleEditor({article:{...parseArticle(source),body:'Before selected after.'},save:async data=>{saved=data},cancel(){},isCurrent:()=>current});document.body.append(form);const body=form.elements.namedItem('body');body.focus();body.setSelectionRange(7,15);body.dispatchEvent(new w.Event('select'));form.querySelector('[data-format=bold]').click();assert.equal(body.value,'Before **selected** after.');assert.equal(form.querySelector('.edit-preview strong').textContent,'selected');form.querySelector('[data-format=italic]').click();assert.equal(form.querySelector('.edit-preview strong em').textContent,'selected');
 const size=form.elements.namedItem('body_font_size');size.value='20';size.dispatchEvent(new w.Event('change'));assert.equal(form.querySelector('.edit-preview').dataset.bodySize,'20');form.dispatchEvent(new w.Event('submit',{cancelable:true}));assert.equal(saved.body_font_size,20);assert.equal(saved.body,'Before ***selected*** after.');current=false;const before=body.value;form.querySelector('[data-format=bold]').click();assert.equal(body.value,before);dom.window.close();
});

test('multi-paragraph repeated emphasis restores source; partial and mixed markup never corrupts',()=>{
 for(const action of ['bold','italic']){const text='first\n\nsecond';const r=formatSelection(text,0,text.length,action);assert.equal(formatSelection(r.text,r.start,r.end,action).text,text);}
 for(const [text,start,end,action] of [['**hello world**',2,7,'bold'],['*hello world*',1,6,'italic'],['**one** and **two**',0,18,'bold']])assert.throws(()=>formatSelection(text,start,end,action),/complete emphasized/);
});

test('link formatting never discards existing emphasis and token delimiters cannot enter Markdown',()=>{
 assert.throws(()=>formatSelection('**bold**',0,8,'link','https://example.com'),/plain text/);
 assert.throws(()=>markdown('![\u00001\u0000](https://example.com) [x](https://example.com)'),/control character/);
});

test('inline emphasis leaves heading quote and list structure intact',()=>{
 for(const text of ['- first\n- second','## Heading\n\nparagraph','> Quote','1. Item'])for(const action of ['bold','italic','link'])assert.throws(()=>formatSelection(text,0,text.length,action,'https://example.com'),/inside a heading/);
 assert.equal(formatSelection('## Heading',3,10,'bold').text,'## **Heading**');
});
