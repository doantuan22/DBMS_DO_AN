// Close only an interrupted run's dedicated, temporally identified test Chrome profile via CDP.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const out=path.resolve(process.argv[2]);
assert.ok(out.includes(path.join('docs','evidence','r8-2','runs')));
assert.ok(fs.existsSync(path.join(out,'crash-recovery.json')));
assert.ok(!fs.existsSync(path.join(out,'browser-recovery.json')));
const start=fs.statSync(path.join(out,'startup.json')).mtimeMs,closed=[],identified=[];
for(const name of fs.readdirSync(os.tmpdir())){
 if(!name.startsWith('cinema-r82-browser-'))continue;
 const profile=path.join(os.tmpdir(),name),created=fs.statSync(profile).birthtimeMs;
 if(created<start-1000||created>start+30000)continue;
 const portFile=path.join(profile,'DevToolsActivePort');if(!fs.existsSync(portFile))continue;
 const port=Number(fs.readFileSync(portFile,'utf8').split('\n')[0]);assert.ok(port>0&&port<65536);
 identified.push({ownedTempProfile:profile,CDPPort:port});
 let version;try{version=await(await fetch(`http://127.0.0.1:${port}/json/version`,{signal:AbortSignal.timeout(1000)})).json();}catch{continue;}
 const ws=new WebSocket(version.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.send(JSON.stringify({id:1,method:'Browser.close'}));
 await new Promise(resolve=>{ws.onclose=resolve;setTimeout(()=>{ws.close();resolve();},2000);});
 closed.push({ownedTempProfile:profile,CDPPort:port,status:'CLOSED'});
}
assert.equal(identified.length,1,'Expected exactly one interrupted owned profile');
fs.writeFileSync(path.join(out,'browser-recovery.json'),JSON.stringify({status:'PASS',identified,closed,
 finalState:closed.length?'CLOSED':'ALREADY_STOPPED: dedicated profile CDP endpoint not listening'},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',ownedBrowsersClosed:closed.length,identified:identified.length}));
