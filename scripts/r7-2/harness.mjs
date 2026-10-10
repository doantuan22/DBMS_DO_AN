// Resolve unchanged R6 imports to absolute URLs and substitute only its offline adapter.
import fs from 'node:fs';
const original=new URL('../r6-group-c/harness.mjs',import.meta.url);
let source=fs.readFileSync(original,'utf8');
source=source.replace(/(['"])(\.\.?\/[^'"]+)\1/g,(_,quote,specifier)=>quote+(specifier==='./common.mjs'?new URL('./common.mjs',import.meta.url):new URL(specifier,original)).href+quote);
export const {start,sql,write,evidenceRoot}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
