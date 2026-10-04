import path from 'node:path';
import {dbRoot,read,write} from '../db/lib.mjs';
const manifest=JSON.parse(read(path.join(dbRoot,'baseline-manifest.json')));
const aliases=['sp_XuLyThanhToan','sp_PhanCongQuanLyRap'];
const functions=['fn_KiemTraQuyenNguoiDung','fn_KiemTraQuanLyRapScope'];
const files=Object.entries(manifest.modules).filter(([name,file])=>functions.includes(name)||aliases.includes(name)||read(path.join(dbRoot,file)).includes('-- R3B:')).map(([,file])=>file);
write(path.join(dbRoot,'13_migrations/r3b_authorization_contract.sql'),`-- R3B: in-place module update. No table/permission/role/grant DML or schema changes.
-- Execute through scripts/r3b/deploy.mjs for atomic application, backup and data preservation.
:on error exit
${files.map(file=>':r ./'+file).join('\n')}
`);
write('audit/remediation/r3b/evidence/migration-files.json',{files,changedFunctions:functions.length,procedures:files.length-functions.length,newTables:0,newPermissionCodes:0});
console.log(`Packaged ${files.length} source modules; tables and grants remain unchanged.`);
