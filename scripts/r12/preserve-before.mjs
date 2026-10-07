import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root,evidenceRoot,read,write } from './common.mjs';
import { walk } from '../db/lib.mjs';
const files=[...walk(path.join(root,'docs/r0-20261007')),...walk(path.join(root,'docs/audit-20261007')),
  ...walk(path.join(root,'docs/evidence/r11')),...walk(path.join(root,'scripts/r11')),
  ...['database/08_procedures/manager/sp_Manager_Room_Delete.sql','database/08_procedures/admin/usp_Admin_Room_Delete.sql',
    'database/11_tests/rooms/delete_atomicity.sql','database/11_tests/concurrency/room-delete-vs-showtime.mjs',
    'docs/evidence/R1_ROOM_DELETE.md','docs/R0_TASK_1_REPORT.md','docs/PROJECT_ACCEPTED_CONSTRAINTS.md'].map(file=>path.join(root,file))];
const sha=value=>crypto.createHash('sha256').update(value.replace(/\r\n/g,'\n')).digest('hex');
write(path.join(evidenceRoot,'preserved-before.json'),{at:new Date().toISOString(),gitStatus:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}),
  files:files.map(file=>({file:path.relative(root,file).replaceAll('\\','/'),sha256:sha(read(file))}))});
console.log(`Captured ${files.length} existing R0/R1.1 artifacts for preservation checks.`);
