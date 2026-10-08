import crypto from 'node:crypto';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, read, write, evidenceRoot } from './common.mjs';
import { walk } from '../db/lib.mjs';
const paths = ['docs/r0-20261007','docs/audit-20261007','docs/evidence/r11','docs/evidence/r12','scripts/r11','scripts/r12'];
const explicit = ['docs/R0_TASK_1_REPORT.md','docs/PROJECT_ACCEPTED_CONSTRAINTS.md','docs/evidence/R1_ROOM_DELETE.md','docs/evidence/R1_SHOWTIME_CONCURRENCY.md',
 'database/11_tests/rooms/delete_atomicity.sql','database/11_tests/showtimes/overlap_safety.sql',
 'database/11_tests/concurrency/room-delete-vs-showtime.mjs','database/11_tests/concurrency/showtime-overlap.mjs',
 'database/08_procedures/manager/sp_Manager_Room_Delete.sql','database/08_procedures/admin/usp_Admin_Room_Delete.sql',
 'database/08_procedures/manager/sp_Manager_Showtime_Create.sql','database/08_procedures/manager/sp_Manager_Showtime_Update.sql',
 'database/08_procedures/admin/usp_Admin_Showtime_Create.sql','database/08_procedures/admin/usp_Admin_Showtime_Update.sql',
 'database/08_procedures/system/sp_Showtime_CancelCascade.sql','database/08_procedures/system/sp_Showtime_ValidateTimes.sql',
 'database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql','database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql',
 'database/05_functions/fn_DonDangGiuGhe.sql','database/05_functions/fn_TinhGiaVe.sql','database/08_procedures/booking/sp_DatVe.sql',
 'database/08_procedures/public/sp_Promotion_Validate.sql'];
const files = [...paths.flatMap(p => walk(path.join(root,p))), ...explicit.map(p => path.join(root,p))];
const sha = v => crypto.createHash('sha256').update(v.replace(/\r\n/g,'\n')).digest('hex');
write(path.join(evidenceRoot,'preserved-before.json'), { at:new Date().toISOString(), gitStatus:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}),
 files:files.map(file => ({file:path.relative(root,file).replaceAll('\\','/'),sha256:sha(read(file))})) });
console.log(`Captured ${files.length} accepted artifacts/protected source files.`);
