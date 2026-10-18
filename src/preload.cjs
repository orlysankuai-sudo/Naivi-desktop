const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('naivi',Object.freeze({call:(action,data)=>ipcRenderer.invoke('naivi:call',action,data),events:callback=>{const listener=(_e,event)=>callback(event);ipcRenderer.on('naivi:event',listener);return ()=>ipcRenderer.removeListener('naivi:event',listener);}}));
