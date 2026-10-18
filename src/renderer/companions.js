// Cosmetic poses never delay a task or change model state.
const pauses=new Map();
export function idleChance(elapsed){return elapsed>=60000?.17:.035;}
export function pauseDuration(elapsed,random=Math.random){return elapsed>=60000?4000+random()*4000:1200+random()*1800;}
export function syncCompanions(){const now=Date.now(),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches||document.body.classList.contains('no-effects');for(const a of document.querySelectorAll('.agent[data-agent]')){const key=a.dataset.agent,thinking=a.dataset.state==='thinking';let pose=pauses.get(key)||{until:0,next:now+5000};if(!thinking||reduced||document.hidden){a.classList.remove('daydreaming');pauses.delete(key);continue;}if(now>=pose.until&&now>=pose.next){const elapsed=now-Number(a.dataset.runStart||now);if(Math.random()<idleChance(elapsed)){pose.until=now+pauseDuration(elapsed);pose.next=pose.until+8000;}else pose.next=now+1500;}a.classList.toggle('daydreaming',now<pose.until);pauses.set(key,pose);}}
setInterval(syncCompanions,1000);
