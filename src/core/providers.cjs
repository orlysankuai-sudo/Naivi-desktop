const {randomUUID}=require('node:crypto');
function validateProvider(p){
 const url=new URL(p.baseURL);if(url.username||url.password||url.search||url.hash)throw Error('API 位址不可包含帳密、查詢或片段');
 if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw Error('API 需要 HTTPS；本機模型可用 localhost HTTP');
 if(!['openai','anthropic'].includes(p.protocol))throw Error('Unsupported protocol');if(!p.name?.trim()||!p.model?.trim()||p.model.length>150)throw Error('請填模型名稱與 ID');
 if(p.outputCapacity!==undefined&&(!Number.isSafeInteger(p.outputCapacity)||p.outputCapacity<1))throw Error('Provider output capacity must be a positive integer.');
 return {id:p.id||randomUUID(),name:p.name.trim().slice(0,60),model:p.model.trim(),baseURL:url.href.replace(/\/$/,''),protocol:p.protocol,vision:p.vision===true,...(p.outputCapacity?{outputCapacity:p.outputCapacity}:{})};
}
function endpoint(p){return p.baseURL+(p.protocol==='anthropic'?'/messages':'/chat/completions');}
async function callModel(provider,{system,messages,images=[],signal,onDelta=()=>{},onUsage=()=>{},maxTokens=null},fetchImpl=fetch){
 const p=validateProvider(provider);const headers={'Content-Type':'application/json'};let body;
 if(p.protocol==='anthropic'){
  headers['x-api-key']=provider.key;headers['anthropic-version']='2023-06-01';
  const ms=messages.map(m=>({...m}));if(images.length){const last=ms.at(-1);last.content=[{type:'text',text:last.content},...images.map(img=>({type:'image',source:{type:'base64',media_type:img.mime,data:img.data}}))];}
  let capacity=maxTokens||p.outputCapacity;
  if(!capacity){const info=await fetchImpl(p.baseURL+'/models/'+encodeURIComponent(p.model),{headers,redirect:'error',signal:AbortSignal.timeout(20000)});if(info.ok){const data=await info.json();capacity=data.max_tokens||data.max_output_tokens||data.capabilities?.max_output_tokens;}else await info.body?.cancel();}
  if(!Number.isSafeInteger(capacity)||capacity<1)throw Error('This Anthropic endpoint requires max_tokens. Set the model’s supported maximum output in Models, or choose a custom output limit.');
  body={model:p.model,system,messages:ms,max_tokens:capacity,stream:true};
 }else{headers.Authorization='Bearer '+provider.key;const ms=messages.map(m=>({...m}));if(images.length){const last=ms.at(-1);last.content=[{type:'text',text:last.content},...images.map(img=>({type:'image_url',image_url:{url:'data:'+img.mime+';base64,'+img.data}}))];}body={model:p.model,messages:[{role:'system',content:system},...ms],...(maxTokens?{max_tokens:maxTokens}:{}),stream:true,stream_options:{include_usage:true}};}
 if(new URL(p.baseURL).hostname==='api.deepseek.com')body.thinking={type:'disabled'};
 if(images.length&&!p.vision)throw Error('請選擇已確認支援圖片的模型');
 const response=await fetchImpl(endpoint(p),{method:'POST',headers,body:JSON.stringify(body),redirect:'error',signal:AbortSignal.any([signal||new AbortController().signal,AbortSignal.timeout(900000)])});
 if(!response.ok){await response.body?.cancel();throw Error('模型服務回傳 HTTP '+response.status+'；請檢查端點、型號、額度與金鑰。');}
 let usage={input:0,output:0,cached:0,reported:false};let truncated=false;let text='',buffer='',done=false;const decoder=new TextDecoder();
 for await(const chunk of response.body){buffer+=decoder.decode(chunk,{stream:true});if(buffer.length>150000)throw Error('模型封包過大');let n;while((n=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,n).trim();buffer=buffer.slice(n+1);if(!line.startsWith('data:'))continue;const data=line.slice(5).trim();if(data==='[DONE]'){done=true;continue;}let event;try{event=JSON.parse(data);}catch{throw Error('模型串流格式錯誤');}const u=event.usage||event.message?.usage;if(u){usage.reported=true;if(p.protocol==='anthropic'){if(u.input_tokens!==undefined)usage.input=u.input_tokens+(u.cache_read_input_tokens||0)+(u.cache_creation_input_tokens||0);if(u.output_tokens!==undefined)usage.output=u.output_tokens;if(u.cache_read_input_tokens!==undefined)usage.cached=u.cache_read_input_tokens;}else{if(u.prompt_tokens!==undefined)usage.input=u.prompt_tokens;if(u.completion_tokens!==undefined)usage.output=u.completion_tokens;usage.cached=u.prompt_tokens_details?.cached_tokens??usage.cached;}onUsage({...usage});}if(event.error||event.type==='error')throw Error('模型串流回報錯誤');if(event.choices?.[0]?.finish_reason==='length'||event.delta?.stop_reason==='max_tokens')truncated=true;if(event.type==='message_stop')done=true;const delta=p.protocol==='anthropic'?event.delta?.type==='text_delta'?event.delta.text:'':event.choices?.[0]?.delta?.content;if(typeof delta==='string'&&delta){text+=delta;onDelta(delta);}}}
 if(truncated){const error=Error('The provider reached its output limit. Your partial output is saved; continue when ready.');error.partial=text;error.code='OUTPUT_LIMIT';throw error;}if(!done||!text.trim())throw Error('模型回覆未完整送達');return text;
}
module.exports={validateProvider,callModel};
