const {DatabaseSync}=require('node:sqlite'),{randomUUID}=require('node:crypto');
class Store{
 constructor(file){this.db=new DatabaseSync(file);this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS kv(k TEXT PRIMARY KEY,v TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS conversations(id TEXT PRIMARY KEY,title TEXT,created TEXT);
 CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,cid TEXT REFERENCES conversations(id) ON DELETE CASCADE,role TEXT,text TEXT,created TEXT,meta TEXT);
 CREATE TABLE IF NOT EXISTS nodes(id TEXT PRIMARY KEY,cid TEXT REFERENCES conversations(id) ON DELETE CASCADE,data TEXT);
 CREATE TABLE IF NOT EXISTS wiki(id TEXT PRIMARY KEY,cid TEXT,data TEXT);
 CREATE TABLE IF NOT EXISTS snaps(id TEXT PRIMARY KEY,data TEXT);`);}
 get(k,fallback=null){const r=this.db.prepare('SELECT v FROM kv WHERE k=?').get(k);return r?JSON.parse(r.v):fallback;}
 set(k,v){this.db.prepare('INSERT OR REPLACE INTO kv VALUES(?,?)').run(k,JSON.stringify(v));}
 create(title='New conversation',projectRoot=null){const c={id:randomUUID(),title:title.slice(0,80),created:new Date().toISOString()};this.db.prepare('INSERT INTO conversations VALUES(?,?,?)').run(c.id,c.title,c.created);if(projectRoot)this.set('project:'+c.id,projectRoot);return {...c,projectRoot};}
 conversations(){return this.db.prepare('SELECT * FROM conversations ORDER BY created DESC').all().map(c=>({...c,projectRoot:this.get('project:'+c.id)}));}
 draft(projectRoot=null){return this.conversations().find(c=>c.projectRoot===projectRoot&&this.messages(c.id).length===0)||this.create('New conversation',projectRoot);}
 title(id,text){this.db.prepare("UPDATE conversations SET title=? WHERE id=? AND title='New conversation'").run(text.trim().replace(/\s+/g,' ').slice(0,60),id);}
 remove(id){this.db.prepare('DELETE FROM conversations WHERE id=?').run(id);}
 message(cid,role,text,meta={}){const m={id:randomUUID(),cid,role,text,created:new Date().toISOString(),meta};this.db.prepare('INSERT INTO messages VALUES(?,?,?,?,?,?)').run(m.id,cid,role,text,m.created,JSON.stringify(meta));return m;}
 messages(cid){return this.db.prepare('SELECT * FROM messages WHERE cid=? ORDER BY rowid').all(cid).map(m=>({...m,meta:JSON.parse(m.meta)}));}
 node(n){this.db.prepare('INSERT OR REPLACE INTO nodes VALUES(?,?,?)').run(n.id,n.cid,JSON.stringify(n));}
 nodes(cid){return this.db.prepare('SELECT data FROM nodes WHERE cid=? ORDER BY rowid').all(cid).map(n=>JSON.parse(n.data));}
 wiki(record){this.db.prepare('INSERT OR REPLACE INTO wiki VALUES(?,?,?)').run(record.id,record.cid,JSON.stringify(record));}
 wikis(cid){return this.db.prepare('SELECT data FROM wiki WHERE cid=? ORDER BY rowid DESC').all(cid).map(r=>JSON.parse(r.data));}
 snap(record){this.db.prepare('INSERT OR REPLACE INTO snaps VALUES(?,?)').run(record.slug,JSON.stringify(record));}
 snaps(){return this.db.prepare('SELECT data FROM snaps ORDER BY rowid DESC').all().map(r=>JSON.parse(r.data));}
 close(){this.db.close();}
}
module.exports={Store};
