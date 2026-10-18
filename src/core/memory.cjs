// Local, explainable preference extraction. No extra model tokens or hidden profiling.
const rules=[['簡潔回答',/簡潔|簡短|少說|concise|brief/i],['詳細說明',/詳細|深入|逐步|in detail|step.by.step/i],['繁體中文',/繁體|traditional chinese/i],['前端設計',/前端|介面|排版|frontend|interface design/i],['程式開發',/代碼|程式|寫碼|coding|programming/i],['深色介面',/純黑|深色|黑色背景|dark mode/i],['動畫與互動',/動畫|動效|animation|microinteraction/i]];
function remember(niv,prompt){
 if(niv.enabled===false||niv.automatic===false)return niv;
 const text=String(prompt).replace(/```[\s\S]*?```/g,'').slice(0,6000),topics=(niv.topics||[]).map(t=>({...t})),now=new Date().toISOString();
 const explicit=/我(?:比較|更)?(?:喜歡|偏好|希望)|請(?:使用|保持)|i (?:prefer|like|want)/i.test(text);
 const candidates=[...rules];for(const match of text.matchAll(/(?:我(?:比較|更)?(?:喜歡|偏好)|\bI (?:prefer|like))\s*([^。！？!?\n；;]{2,70})/gi)){const name=match[1].trim();if(!/密碼|金鑰|token|password|api.?key|病|診斷|宗教|政黨|性取向|身份證|住址|電話|@|https?:/i.test(name))candidates.push([name,new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i')]);}
 for(const [name,pattern] of candidates){if(!pattern.test(text)||/(?:不喜歡|不要|討厭|don't like|do not want)/i.test(text))continue;const old=topics.find(t=>t.name===name);if(old){old.seen=(old.seen||1)+1;if(old.source==='automatic')old.weight=Math.min(5,Math.max(old.weight,explicit?3:1+Math.floor(old.seen/3)));old.updated=now;}else topics.push({name,weight:explicit?3:1,seen:1,source:'automatic',reason:explicit?'你直接表達的偏好':'對話中出現的興趣主題，可修改或刪除',updated:now});}
 return {...niv,enabled:true,automatic:true,topics:topics.slice(-20)};
}
module.exports={remember};
