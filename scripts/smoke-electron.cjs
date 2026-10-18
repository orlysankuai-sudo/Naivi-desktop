// Isolated QA only. Never shipped; does not bypass production authentication.
const {app,BrowserWindow,ipcMain,safeStorage}=require('electron');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../test-results');fs.mkdirSync(out,{recursive:true});
app.setPath('userData',path.join(out,'qa-profile-'+(process.argv.includes('--fixture')?'fixture':'actual')));
const pause=ms=>new Promise(r=>setTimeout(r,ms));let done=false;
const deadline=setTimeout(()=>{console.error('FAIL: QA timeout');app.exit(1);},90000);
async function check(win,fixture){try{
 await pause(1500);const run=async script=>{try{return await win.webContents.executeJavaScript(script);}catch(e){throw Error(script.slice(0,180)+' :: '+e.message);}};
 assert.equal(await run('typeof require'),'undefined');assert.equal(await run('typeof window.naivi.call'),'function');
 const errors=[];win.webContents.on('console-message',(_e,_level,message)=>{if(/Uncaught|Unable to load preload/.test(message))errors.push(message);});
 if(!fixture){
  const state=await run("window.naivi.call('bootstrap')");assert(state.ok);assert.equal(state.value.user,null);assert.equal(await run("!!document.querySelector('[data-act=consent]')"),true);
  const denied=await run("window.naivi.call('run',{prompt:'test'})");assert.equal(denied.ok,false);
  assert.equal(await run("window.naivi.call('bootstrap').then(r=>JSON.stringify(r).includes('secret'))"),false);
  assert(safeStorage.isEncryptionAvailable(),'OS encrypted storage unavailable');
  assert.equal((await fetch('https://cygnus.sankuai.asia/api/health',{signal:AbortSignal.timeout(15000)})).status,200,'Desktop HTTPS certificate trust');
  // Actual boot stays hidden to avoid interrupting the user. Visual capture uses the offscreen fixture below.
 }else{
  assert.equal(await run("document.querySelectorAll('.message').length"),2);
  assert.equal(await run("document.querySelectorAll('.node[open]').length"),0);
  assert.equal(await run("document.querySelectorAll('.message-content script,.message-content img').length"),0);
  assert.equal(await run("document.querySelectorAll('.section-nav a').length"),2);
  assert.equal(await run("document.querySelector('.section-nav a').textContent"),'Evidence');
  assert.equal(await run("document.body.textContent.includes('Emotionality is actually quite important')"),true);
  await run("document.querySelector('[data-act=settings]').click()");await pause(400);
  await run("document.querySelector('#theme').value='light';document.querySelector('[data-act=save-appearance]').click()");await pause(400);
  assert.equal(await run("document.documentElement.dataset.theme"),'light');
  fs.writeFileSync(path.join(out,'desktop-light.png'),(await win.webContents.capturePage()).toPNG());
  await run("document.querySelector('[data-act=view-flow]').click()");assert.equal(await run("document.querySelectorAll('.diagram path').length"),1);
  await run("document.querySelector('[data-act=settings]').click()");await pause(400);
  await run("document.querySelector('#theme').value='dark';document.querySelector('[data-act=save-appearance]').click()");await pause(400);
  fs.writeFileSync(path.join(out,'desktop-dark.png'),(await win.webContents.capturePage()).toPNG());
  const icon=await run("new Promise(resolve=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(img,0,0,256,256);resolve(c.toDataURL('image/png').split(',')[1]);};img.src='fox.svg';})");
  const png=Buffer.from(icon,'base64'),header=Buffer.alloc(22);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);header.writeUInt32LE(png.length,14);header.writeUInt32LE(22,18);fs.writeFileSync(path.resolve(__dirname,'../src/renderer/naivi.ico'),Buffer.concat([header,png]));
  win.setSize(900,700);await pause(200);assert.equal(await run('document.documentElement.scrollWidth <= innerWidth'),true);
  await run("document.querySelector('[data-act=style]').click()");await pause(400);await run("document.querySelector('[data-act=preview-style]').click()");await pause(400);
  assert.equal(await run("document.querySelector('#style-preview').getAttribute('sandbox')"),'');
  assert.equal(await run("document.querySelector('#style-preview').contentDocument"),null);
  await run("document.querySelector('#close-modal').click()");
  const performance=await run(`(async()=>{const host=document.querySelector('#messages'),sample=host.lastElementChild;for(let i=0;i<60;i++)host.append(sample.cloneNode(true));const times=[];let previous;for(let i=0;i<80;i++){const now=await new Promise(requestAnimationFrame);if(previous)times.push(now-previous);previous=now;host.scrollTop=i*80;}times.sort((a,b)=>a-b);return {messages:host.children.length,medianFrameMs:times[Math.floor(times.length/2)],p95FrameMs:times[Math.floor(times.length*.95)],environment:'offscreen Electron QA; not a general hardware benchmark'};})()`);
  fs.writeFileSync(path.join(out,'ui-performance.json'),JSON.stringify(performance,null,2));
  win.setSize(1460,940);await pause(300);
  assert.equal(await run("Boolean(document.querySelector('[data-agent=Aeri]'))"),false);
  await run("document.querySelector('[data-act=toggle-left]').click();document.querySelector('[data-act=toggle-right]').click()");await pause(500);
  assert.equal(await run("document.querySelector('.app-shell').classList.contains('left-collapsed')&&document.querySelector('.app-shell').classList.contains('right-collapsed')"),true);
  await run("document.querySelector('.reopen-left').click();document.querySelector('.top-actions [data-act=toggle-right]').click()");await pause(450);
  const small=await run("document.querySelector('#prompt').getBoundingClientRect().height");
  await run("const input=document.querySelector('#prompt');input.value='Line of user input\\n'.repeat(12);input.dispatchEvent(new Event('input',{bubbles:true}));");
  const tall=await run("document.querySelector('#prompt').getBoundingClientRect().height");assert(tall>small+80,'Composer should grow');
  win.webContents.send('naivi:event',{type:'node',cid:'qa',node:{id:'thinking',stage:'Scope',agent:'Phiel',state:'running',provider:'QA',model:'fixture',started:new Date().toISOString(),parents:[],text:'Fixture'}});
  win.webContents.send('naivi:event',{type:'node',cid:'qa',node:{id:'failure',stage:'Image observations',agent:'Avis',state:'error',provider:'QA',model:'fixture',started:new Date().toISOString(),parents:[],error:'Fixture error'}});await pause(800);
  assert.equal(await run("!!document.querySelector('[data-agent=Phiel][data-state=thinking] .agent-orb')"),true);assert.equal(await run("!!document.querySelector('[data-agent=Avis][data-state=failed] .agent-orb')"),true);
  fs.writeFileSync(path.join(out,'fox-states.png'),(await win.webContents.capturePage()).toPNG());
  await run("document.querySelector('[data-act=new]').click()");await pause(500);
  assert.equal(await run("document.querySelector('[data-act=new]').disabled"),true);
  await run("document.querySelector('[data-act=new]').click()");assert.equal(await run("window.naivi.call('bootstrap').then(r=>r.value.conversations.length)"),2);
  fs.writeFileSync(path.join(out,'desktop-home-v2.png'),(await win.webContents.capturePage()).toPNG());
  assert.equal(await run("document.querySelector('#prompt').value"),'');
  await run("document.querySelector('[data-act=settings]').click()");await pause(400);fs.writeFileSync(path.join(out,'settings-v2.png'),(await win.webContents.capturePage()).toPNG());
  assert.equal(await run("document.querySelectorAll('input[type=color]').length"),0);
  const originalLanguage=await run("document.documentElement.lang");
  const originalSize=await run("getComputedStyle(document.documentElement).getPropertyValue('--reading-size')");
  await run("document.querySelector('#font-size').value='21';document.querySelector('#font-size').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#language').value='zh-Hans';document.querySelector('#language').dispatchEvent(new Event('change',{bubbles:true}))");await pause(150);
  assert.equal(await run("getComputedStyle(document.querySelector('.font-specimen')).fontSize"),'21px');
  assert.equal(await run("getComputedStyle(document.documentElement).getPropertyValue('--reading-size')"),originalSize);
  assert.equal(await run("document.documentElement.lang"),originalLanguage);
  const closePosition=await run("document.querySelector('#close-modal').getBoundingClientRect().top");
  await run("document.querySelector('#modal-body').scrollTop=10000");await pause(100);
  assert.equal(await run("document.querySelector('#close-modal').getBoundingClientRect().top"),closePosition);
  await run("document.querySelector('[data-tab=niv]').click();document.querySelector('#niv-enabled').checked=true;document.querySelector('[data-tab=appearance]').click()");await pause(100);
  assert.equal(await run("document.querySelector('#font-size').value"),'21');
  await run("document.querySelector('#close-modal').click()");await pause(100);
  await run("document.querySelector('[data-act=settings]').click()");await pause(100);
  assert.equal(await run("document.querySelector('#font-size').value"),'15');
  await run("document.querySelector('#language').value='zh-Hans';document.querySelector('#language').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-act=save-appearance]').click()");await pause(250);
  assert.equal(await run("document.documentElement.lang"),'zh-Hans');
  await run("document.querySelector('[data-act=settings]').click()");await pause(100);
  assert.equal(await run("document.querySelector('[data-act=save-appearance]').textContent"),'保存设置');
  await run("document.querySelector('#language').value='en';document.querySelector('#language').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-act=save-appearance]').click()");await pause(200);
  await run("document.querySelector('[data-act=settings]').click()");await pause(100);
  await run("document.querySelector('#accent').nextElementSibling.querySelector('button').click()");await pause(200);
  assert.equal(await run("document.querySelector('#accent').nextElementSibling.querySelectorAll('[role=option]').length"),5);
  fs.writeFileSync(path.join(out,'styled-select.png'),(await win.webContents.capturePage()).toPNG());
  await run("document.querySelector('#close-modal').click()");
  await run("document.querySelector('[data-act=load][data-id=qa]').click()");await pause(400);
  await run("document.querySelector('[data-act=view-flow]').click()");
  await run("document.querySelector('.node').open=true");
  assert.equal(await run("document.querySelectorAll('.node-markdown table').length>0"),true);
  assert.equal(await run("getComputedStyle(document.querySelector('.node-markdown')).fontSize"),'11px');
  await pause(600);fs.writeFileSync(path.join(out,'markdown-orbs.png'),(await win.webContents.capturePage()).toPNG());

 }
 if(fixture){
  await run("document.querySelector('[data-act=choose-models]').click()");await pause(150);
  await run("document.querySelector('[data-act=set-models]').click()");await pause(200);
  assert.equal(await run("document.querySelector('.model-pill')!==null"),true);
  await run("document.querySelector('[data-act=settings]').click()");await pause(200);
  win.webContents.send('naivi:event',{type:'failed',cid:'qa',message:'Connection QA notice'});await pause(200);
  assert.equal(await run("document.querySelector('#toast').matches(':popover-open')"),true);
  assert.equal(await run("document.querySelector('#modal').open"),true);
  await run("document.querySelector('#language').value='en';document.querySelector('#language').dispatchEvent(new Event('change',{bubbles:true}))");await pause(250);
  const untranslated=[];
  for(const tab of ['appearance','providers','niv','account']){
   await run(`document.querySelector('[data-act=settings-tab][data-tab=${tab}]').click()`);await pause(200);
   untranslated.push(...await run(`(()=>{const out=[],walk=document.createTreeWalker(document.querySelector('#modal-body'),NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){if(n.parentElement.closest('option[value^=zh],textarea,input'))continue;if(/[\\u3400-\\u9fff]/.test(n.nodeValue))out.push(n.nodeValue);}return out;})()`));
  }
  fs.writeFileSync(path.join(out,'untranslated-v4.json'),JSON.stringify(untranslated,null,2));
  await run("document.querySelector('#close-modal').click();document.querySelector('.conversation').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true}))");await pause(200);
  assert.equal(await run("document.querySelectorAll('.context-actions button').length"),4);
  await run("document.querySelector('#close-modal').click()");
  await run(`(async()=>{const v=await import(new URL('viewport.js',location.href).href),host=document.querySelector('#messages');host.innerHTML='<div style="height:5000px">Scroll fixture</div>';v.restoreViewport('qa',{top:0,follow:true});await new Promise(r=>setTimeout(r,100));if(host.scrollHeight-host.clientHeight-host.scrollTop>2)throw Error('Not following bottom');host.firstElementChild.style.height='6000px';await new Promise(r=>setTimeout(r,100));if(host.scrollHeight-host.clientHeight-host.scrollTop>2)throw Error('New output not followed');host.scrollTop=300;host.dispatchEvent(new Event('scroll'));const saved=v.captureViewport('qa');host.innerHTML='<div style="height:6500px">Rerender</div>';v.restoreViewport('qa',saved);await new Promise(r=>setTimeout(r,100));if(Math.abs(host.scrollTop-300)>2)throw Error('Reader position lost');return true;})()`);}
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,fixture?'ui-smoke.json':'app-smoke.json'),JSON.stringify({passed:true,fixture,testedAt:new Date().toISOString(),electron:process.versions.electron,node:process.versions.node,checks:fixture?'theme, layout, collapsed artifacts, real-edge drawing, Niv navigation, escaped HTML, sandbox preview':'real app boot, legal gate, no Node renderer, IPC gate, OS encryption'},null,2));
 console.log('PASS: '+(fixture?'renderer fixture interactions':'actual Electron application and security gate'));done=true;clearTimeout(deadline);app.exit(0);
 }catch(e){console.error('FAIL: '+e.stack);app.exit(1);}}
if(!process.argv.includes('--fixture')){
 app.on('browser-window-created',(_e,win)=>{win.hide();win.show=()=>{};win.webContents.once('did-finish-load',()=>check(win,false));});require('../src/main.cjs');
}else app.whenReady().then(async()=>{
 const now=new Date().toISOString(),state={accepted:true,termsVersion:'QA',user:{email:'qa@example.test',penName:'QA fixture'},settings:{cookieChoice:'necessary',theme:'dark',accent:'#ffffff',effects:true,allowSameModel:false},providers:[],conversations:[{id:'qa',title:'Design a quieter workspace'}],niv:{enabled:false,topics:[]},snaps:[]};
 const messages=[{id:'user1',role:'user',created:now,text:'How should Naivi collaborate?',meta:{}},{id:'answer1',role:'assistant',created:now,text:'## Overview\nStart with a clear question, then review the evidence.\n\n<script>throw Error("injection")</script>\n\n## Evidence\nThis is explicitly a UI test fixture, not a real model result. [S0]',meta:{kind:'generated',calls:5,durationMs:5000,layout:['part-1','part-0'],evidence:[]}}];
 const nodes=[{id:'scope1',stage:'Scope',agent:'Phiel',state:'done',text:'## Scope\n\n| Goal | State |\n\n|---|---|\n\n| **Readable** | Done |\n\n<div class="tip-box">Verified renderer fixture.</div>',provider:'QA',model:'fixture',started:now,durationMs:1000,parents:[]},{id:'review1',stage:'Independent review',agent:'Phiel',state:'done',text:'UI fixture: review notes.',provider:'QA',model:'fixture',started:now,durationMs:1000,parents:['scope1']}];
 ipcMain.handle('naivi:call',(_event,action,data)=>{if(action==='newConversation'){const c={id:'empty-qa',title:'New conversation'};if(!state.conversations.some(x=>x.id===c.id))state.conversations.unshift(c);return {ok:true,value:c};}if(action==='language'){state.settings.language=data.language;return {ok:true,value:state};}if(action==='settings'){Object.assign(state.settings,data);return {ok:true,value:state};}return {ok:true,value:action==='conversation'?(data.id==='empty-qa'?{messages:[],nodes:[],wiki:[]}:{messages,nodes,wiki:[]}):state};});
 const win=new BrowserWindow({width:1460,height:940,show:false,webPreferences:{offscreen:true,backgroundThrottling:false,preload:path.resolve(__dirname,'../src/preload.cjs'),sandbox:true,contextIsolation:true,nodeIntegration:false}});await win.loadFile(path.resolve(__dirname,'../src/renderer/index.html'));await check(win,true);
});
