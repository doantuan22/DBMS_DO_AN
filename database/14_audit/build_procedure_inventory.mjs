// Static source inventory for safe runtime test selection; no database writes.
import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const DIR=path.join(ROOT,'database','08_procedures');
const files=[];const walk=(d)=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.toLowerCase().endsWith('.sql'))files.push(p);}};walk(DIR);
const stripComments=(s)=>s.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/^\s*--.*$/gm,' ');
const objects=[];
for(const file of files){const raw=fs.readFileSync(file,'utf8');const src=stripComments(raw);const m=src.match(/CREATE\s+OR\s+ALTER\s+PROCEDURE\s+(?:\[?dbo\]?\s*\.\s*)?\[?([\w]+)\]?([\s\S]*?)\bAS\s+BEGIN\b/i)||src.match(/CREATE\s+PROCEDURE\s+(?:\[?dbo\]?\s*\.\s*)?\[?([\w]+)\]?([\s\S]*?)\bAS\s+BEGIN\b/i);if(!m)continue;const name=m[1];const header=m[2];const body=src.slice((m.index??0)+m[0].length);const dmlSource=body.replace(/N?'(?:''|[^'])*'/g,' ');
 const dmlMatch=dmlSource.match(/\b(?:INSERT\s+(?:INTO\s+)?|UPDATE\s+|DELETE\s+(?:FROM\s+)?|MERGE\s+(?:INTO\s+)?)(?:dbo\s*\.|\[|#|@|[\w])/i);
 const directWrite=Boolean(dmlMatch);
 const firstThrow=[...dmlSource.matchAll(/\bTHROW\s+(\d+)/gi)].map(x=>({number:Number(x[1]),index:x.index})).find(x=>!dmlMatch||x.index<dmlMatch.index)??null;
 const calls=[...dmlSource.matchAll(/\bEXEC(?:UTE)?\s+(?:dbo\s*\.\s*)\[?([\w]+)\]?/gi)].map(x=>x[1]);
 const params=[];const paramRe=/@([\w]+)\s+([\w\[\]]+(?:\s*\([^)]*\))?)(?:\s*=\s*([^,\r\n)]+?))?(?=\s*[,)]|\s*$)/g;let pm;while((pm=paramRe.exec(header))){params.push({name:pm[1],type:pm[2].replace(/\s+/g,' ').trim(),default:pm[3]?.trim()??null});}
 objects.push({name,file:path.relative(ROOT,file).replaceAll('\\','/'),directWrite,firstDmlIndex:dmlMatch?.index??null,firstThrowBeforeDml:firstThrow,calls:[...new Set(calls)],params});}
const byName=new Map(objects.map(x=>[x.name.toLowerCase(),x]));
function writes(obj,seen=new Set()){if(obj.directWrite)return true;const key=obj.name.toLowerCase();if(seen.has(key))return false;seen.add(key);return obj.calls.some(n=>byName.has(n.toLowerCase())&&writes(byName.get(n.toLowerCase()),seen));}
for(const x of objects)x.writeCapable=writes(x);
const evidencePath=path.join(ROOT,'.audit-output','main-source-procedure-inventory.json');fs.mkdirSync(path.dirname(evidencePath),{recursive:true});fs.writeFileSync(evidencePath,JSON.stringify({createdAt:new Date().toISOString(),count:objects.length,objects},null,2));
console.log(JSON.stringify({count:objects.length,directWrite:objects.filter(x=>x.directWrite).length,writeCapable:objects.filter(x=>x.writeCapable).length,readOnly:objects.filter(x=>!x.writeCapable).length,evidence:path.relative(ROOT,evidencePath),writeProcedures:objects.filter(x=>x.writeCapable).map(x=>({name:x.name,file:x.file,params:x.params.map(p=>`@${p.name} ${p.type}${p.default?`=${p.default}`:''}`)}))},null,2));
