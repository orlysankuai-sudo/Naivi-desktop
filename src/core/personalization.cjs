// Model suggestions are data. Only bounded, source-grounded user preferences can persist.
const sensitive=/password|secret|api.?key|token|credential|\bsk-[\w-]+|密碼|金鑰|身份證|身分證|住址|電話|診斷|病史|宗教|政黨|性取向|https?:|[\w.+-]+@[\w.-]+|\d{7,}/i;
const instruction=/ignore (?:all|previous)|system prompt|override|execute|shell|忽略.*指令|系統提示|執行命令/i;
function mergeMemory(niv,candidates,prompt,{cid,root=null}={}){
 const topics=(niv.topics||[]).map(t=>({...t})),now=new Date().toISOString();
 if(!niv.enabled||niv.automatic===false)return niv;
 for(const c of (Array.isArray(candidates)?candidates:[]).slice(0,5)){
  if(!c||!['style','interest','background','project'].includes(c.category)||typeof c.name!=='string'||typeof c.evidence!=='string')continue;
  const name=c.name.trim(),evidence=c.evidence.trim();
  if(name.length<2||name.length>100||evidence.length<3||evidence.length>200||!prompt.includes(evidence)||sensitive.test(name+' '+evidence)||instruction.test(name+' '+evidence))continue;
  if(c.category==='project'&&!root)continue;
  const projectRoot=c.category==='project'?root:null,old=topics.find(t=>t.name===name&&(t.projectRoot||null)===projectRoot);
  if(old){old.seen=(old.seen||1)+1;old.updated=now;continue;}
  topics.push({name,weight:Math.max(1,Math.min(5,Math.round(Number(c.weight)||2))),category:c.category,projectRoot,evidence,source:'phiel-filtered',cid,seen:1,updated:now});
 }
 return {...niv,topics:topics.slice(-20)};
}
function relevantMemory(niv,root){return (niv.topics||[]).filter(t=>!t.projectRoot||t.projectRoot===root).map(({name,weight,category})=>({name,weight,category:category||'style'}));}
function validBrief(value,sections,memory){
 if(!Array.isArray(value?.sections)||value.sections.length!==sections.length)return null;
 const ids=new Set(sections.map(s=>s.id));let total=0;const seen=new Set(),result=[];
 for(const s of value.sections){if(!ids.has(s.id)||seen.has(s.id)||!Number.isFinite(s.weight)||s.weight<0||s.weight>100)return null;seen.add(s.id);total+=s.weight;result.push({id:s.id,weight:s.weight});}
 if(Math.abs(total-100)>1)return null;
 const indices=Array.isArray(value.memoryIndices)?value.memoryIndices.filter(i=>Number.isInteger(i)&&i>=0&&i<memory.length).slice(0,6):[];
 return {sections:result,preferences:indices.map(i=>memory[i])};
}
function preservesAnchors(original,revised){
 if(typeof revised!=='string'||!revised.trim())return false;
 const citations=[...new Set(original.match(/\[S\d+\]/g)||[])];
 if(citations.some(c=>!revised.includes(c)))return false;
 const code=s=>s.match(/```[\s\S]*?```/g)||[];
 return JSON.stringify(code(original))===JSON.stringify(code(revised));
}
module.exports={mergeMemory,relevantMemory,validBrief,preservesAnchors};
