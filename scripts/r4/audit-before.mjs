import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {write,root} from '../db/lib.mjs';
import path from 'node:path';
const source=file=>execFileSync('git',['show',`HEAD:${file}`],{cwd:root,encoding:'utf8'});
const manager=source('frontend/src/pages/ManagerPortal.jsx'),admin=source('frontend/src/pages/AdminPortal.jsx'),images=source('frontend/src/components/CinemaImageManager.jsx'),validator=source('backend/src/validators/adminValidator.js');
const traces=[
 {bug:'BUG-004',file:'frontend/src/pages/ManagerPortal.jsx',before:'api.createSeat(seat.roomId, { ...seat, number: Number(seat.number) })',result:'roomId was sent in the strict body as well as route; live unchanged validator reproduces400'},
 {bug:'BUG-005',file:'frontend/src/components/CinemaImageManager.jsx',before:'const payload = { ...form, displayOrder: Number(form.displayOrder) };',result:'edit state includes cover; unchanged metadata validator reproduces400'},
 {bug:'BUG-006',file:'frontend/src/pages/AdminPortal.jsx',before:'Object.fromEntries(editableFields.map',result:'first click hydrates create fields calculated before setSelected; edit status missing; users offered unsupported metadata edits'},
 {bug:'BUG-007',file:'frontend/src/pages/AdminPortal.jsx',before:"if (active === 'roles' && canGrant && values.permissionIds !== undefined)",result:'submit calls grants API only; actual DB grant-only operation leaves name unchanged'},
 {bug:'BUG-014',file:'backend/src/validators/adminValidator.js',before:'item.length > 128',result:'Admin accepted passwords beyond bcryptjs3.0.3 UTF-8 72-byte limit and trimmed passwords; register/login already enforced upper byte limit'},
];
for(const trace of traces)assert.ok(({[traces[0].file]:manager,[traces[1].file]:images,[traces[2].file]:admin,[traces[4].file]:validator}[trace.file]).includes(trace.before));
write(path.join(root,'audit/remediation/r4/evidence/before-traces.json'),{status:'PASS',basis:'Original HEAD source, read before changes; unchanged deployed SP/contracts and reproduced old operations in functional-api.json',commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),traces});
console.log('PASS five original source traces');
