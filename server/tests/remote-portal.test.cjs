const {test}=require('node:test'),assert=require('node:assert/strict'),express=require('express'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {mountRemote}=require('../remote'),{RemoteClient}=require('../../src/core/remote-client.cjs');
test('actual portal WebCrypto interoperates with the local client and relay',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'naivi-portal-')),app=express();let tasks=[],executed='';app.use(express.json());mountRemote(app,{dataDir:dir,auth:(req,res,next)=>{req.user={email:'qa@example.test'};next();},send:async()=>true});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const api=async(route,body,token='')=>{const response=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});if(!response.ok)throw Error(await response.text());return response.json();};
 const client=new RemoteClient({api,load:()=>tasks,save:t=>tasks=t,execute:async(t,p)=>{executed=p;return 'Verified: '+p;}});
 try{const task=await client.create({cid:'portal'}),elements=new Map(),button={disabled:false};let poll;
 const element=()=>({textContent:'',value:'',hidden:false,children:[],append(v){this.children.push(v);},replaceChildren(...v){this.children=v;},querySelector:()=>button});
 const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../portal/remote.js'),'utf8'),{document:{getElementById:get,querySelectorAll:()=>[],createElement:element,documentElement:{}},location:{pathname:'/agent/remote/'+task.id},TextEncoder,TextDecoder,crypto:crypto.webcrypto,btoa,atob,fetch:(url,options)=>fetch(base+url,options),setInterval:f=>{poll=f;return 1;},clearInterval:()=>{},confirm:()=>true});
 get('key').value='f'.repeat(64);await get('unlock').onsubmit({preventDefault(){}});assert.match(get('status').textContent,/KEY/);
 get('key').value=task.key;await get('unlock').onsubmit({preventDefault(){}});assert.equal(get('workspace').hidden,false);assert.equal(get('unlock').hidden,true);assert.equal(get('key').value,'');
 get('prompt').value='Verify unicode: 中文';await get('send').onsubmit({preventDefault(){},submitter:button});await client.tick();await poll();assert.equal(executed,'Verify unicode: 中文');assert.equal(get('outputs').children[0].children[0].textContent,'Verified: Verify unicode: 中文');
 get('lock').onclick();assert.equal(get('outputs').children.length,0);assert.equal(get('workspace').hidden,true);
 }finally{client.stop();await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
