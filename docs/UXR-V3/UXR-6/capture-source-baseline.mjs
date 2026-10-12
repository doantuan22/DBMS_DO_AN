import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = process.cwd(), target = path.resolve('.audit-output', `uxr6-source-before-${Date.now()}`);
if (!target.startsWith(path.resolve(root, '.audit-output') + path.sep)) throw new Error('Wrong snapshot target');
const files = [];
function copyTree(relative) {
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const file = path.join(relative, entry.name);
    if (entry.isDirectory()) copyTree(file);
    else if (entry.isFile()) copy(file);
  }
}
function copy(file) {
  const content = fs.readFileSync(path.join(root, file)), output = path.join(target, file);
  fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, content);
  files.push({ file: file.replaceAll('\\', '/'), hash: crypto.createHash('sha256').update(content).digest('hex') });
}
copyTree('frontend/src'); copyTree('frontend/public'); copyTree('shared');
for (const file of ['frontend/index.html', 'frontend/vite.config.js', 'frontend/package.json']) copy(file);
fs.symlinkSync(path.resolve('frontend/node_modules'), path.join(target, 'frontend/node_modules'), 'junction');
const evidence = { timestamp: new Date().toISOString(), target, source: 'actual working tree before UXR-6 at commit b3d7f59, includes completed UXR-0 through UXR-5', files };
fs.writeFileSync(new URL('./source-baseline.json', import.meta.url), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ target, files: files.length }));
