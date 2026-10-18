const crypto=require('node:crypto'),crypt=require('./remote-crypto.cjs');
class RemoteClient{
 constructor({api,load,save,execute,busy=()=>false}){Object.assign(this,{api,load,save,execute,busy});this.running=false;this.stopped=false;}
 list(){return this.load().map(({key,deviceToken,seen,...t})=>t);}
 async create(options){const key=crypto.randomBytes(32).toString('hex'),deviceToken=crypto.randomBytes(32).toString('hex'),id=crypto.randomUUID();const r=await this.api('/api/naivi/remote',{id,accessHash:crypt.hash(crypt.accessToken(key)),deviceHash:crypt.hash(deviceToken)});const t={id,key,deviceToken,url:r.url,expiresAt:r.expiresAt,seen:[],...options};this.save([...this.load(),t]);return {...r,key};}
 async revoke(id){const tasks=this.load(),t=tasks.find(t=>t.id===id);if(!t)throw Error('Remote task not found.');t.revoked=true;this.save(tasks);await this.api('/api/naivi/remote/'+id+'/revoke',{},t.deviceToken);}
 start(){this.stopped=false;this.timer=setInterval(()=>this.tick().catch(()=>{}),3000);this.timer.unref?.();}
 stop(){this.stopped=true;clearInterval(this.timer);}
 async tick(){if(this.running||this.stopped||this.busy())return;this.running=true;try{for(const t of this.load()){if(this.stopped||t.revoked||t.expiresAt<=Date.now())continue;const r=await this.api('/api/naivi/remote/'+t.id+'/poll',{},t.deviceToken);for(const command of r.commands||[]){if(this.stopped)break;let summary='',result;try{const current=this.load().find(x=>x.id===t.id);const m=crypt.verify(current,command.box);if(m.id!==command.id)throw Error('Command identifier mismatch.');current.seen.push(m.id);current.seen=current.seen.slice(-2000);this.save(this.load().map(x=>x.id===t.id?current:x));result=await this.execute(current,m.prompt);summary=String(result).slice(0,1800);}catch(e){result='Task not executed or incomplete: '+e.message;summary=result;}const output=crypt.seal(t.key,t.id,{commandId:command.id,text:String(result),finished:new Date().toISOString()});await this.api('/api/naivi/remote/'+t.id+'/complete',{commandId:command.id,box:output,summary},t.deviceToken);}}}finally{this.running=false;}}
}
module.exports={RemoteClient};
