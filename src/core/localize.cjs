const en=require('./locales.json');
function localize(text,language){text=String(text);if(language==='en')for(const k of Object.keys(en).sort((a,b)=>b.length-a.length))text=text.replaceAll(k,en[k]);return text;}
module.exports={localize};
