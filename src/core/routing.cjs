// Local routing is deterministic: no extra model call or provider credential is needed.
const profiles={minimum:{reviewers:1,scope:false,memory:false},standard:{reviewers:1,scope:true,memory:true},complex:{reviewers:3,scope:true,memory:true}};
function route(providers,{mode='research',flow='standard'}={}){
 const profile=profiles[flow]||profiles.standard;
 const family=p=>String(p.model+' '+p.name).toLowerCase();
 const rank=(p,role)=>{const s=family(p);if(role==='draft'&&mode==='code')return /gpt|codex/.test(s)?0:/claude/.test(s)?1:/deepseek/.test(s)?2:3;if(role==='review')return /claude/.test(s)?0:/gpt/.test(s)?1:/gemini/.test(s)?2:3;return /deepseek/.test(s)?0:/gpt/.test(s)?1:/claude/.test(s)?2:3;};
 const pick=role=>[...providers].sort((a,b)=>rank(a,role)-rank(b,role))[0];
 const writer=pick('draft'),planner=pick('plan');
 const distinct=providers.filter(p=>p.baseURL+'|'+p.model!==writer?.baseURL+'|'+writer?.model);
 const reviewers=(distinct.length?distinct:[writer]).filter(Boolean).sort((a,b)=>rank(a,'review')-rank(b,'review')).slice(0,profile.reviewers);
 return {flow:profiles[flow]?flow:'standard',profile,planner,writer,reviewers,vision:providers.find(p=>p.vision),summary:{policy:'local-role-routing-v1',flow:profiles[flow]?flow:'standard',planner:planner?.model,writer:writer?.model,reviewers:reviewers.map(p=>p.model),vision:providers.find(p=>p.vision)?.model||null}};
}
module.exports={route,profiles};
