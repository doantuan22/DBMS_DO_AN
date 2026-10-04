// R3A audit tooling only. Main DB operations in this file are SELECT-only.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import sql from '../../backend/node_modules/mssql/index.js';
import { root, dbRoot, read, write, walk, credentials, normalizeModule } from '../db/lib.mjs';
export { root, dbRoot, read, write, sql, normalizeModule };
export const directory = path.join(root,'audit/remediation/r3a');
export const evidence = path.join(directory,'evidence');
export const sha = value => crypto.createHash('sha256').update(value).digest('hex');
export const quote = value => '['+value.replaceAll(']',']]')+']';
export const ask = (pool, source) => new sql.Request(pool).query(source);
export function productionHashes() {
  return Object.fromEntries(['backend/src','frontend/src','database'].flatMap(dir=>walk(path.join(root,dir)))
    .filter(file=>!file.includes(path.sep+'_audit'+path.sep)&&/\.(?:js|jsx|sql|json|mjs)$/.test(file))
    .sort().map(file=>[path.relative(root,file).replaceAll('\\','/'),sha(fs.readFileSync(file))]));
}
export async function connect(database) {
  const env=credentials();
  return new sql.ConnectionPool({server:env.DB_SERVER||'localhost',port:Number(env.DB_PORT||1433),database,user:env.DB_USER,password:env.DB_PASSWORD,
    requestTimeout:180000,options:{encrypt:env.DB_ENCRYPT==='true',trustServerCertificate:env.DB_TRUST_SERVER_CERTIFICATE!=='false',useUTC:true}}).connect();
}
export async function mainSnapshot(pool) {
  const modules=(await ask(pool,'SELECT o.name,o.type,m.definition,m.uses_ansi_nulls,m.uses_quoted_identifier FROM sys.objects o LEFT JOIN sys.sql_modules m ON m.object_id=o.object_id WHERE o.is_ms_shipped=0 ORDER BY o.name')).recordset;
  const tables=(await ask(pool,'SELECT object_id,SCHEMA_NAME(schema_id) AS schemaName,name FROM sys.tables WHERE is_ms_shipped=0 ORDER BY SCHEMA_NAME(schema_id),name')).recordset;
  const data=[];
  for(const t of tables) {
    const keys=(await ask(pool,`SELECT c.name FROM sys.indexes i JOIN sys.index_columns k ON k.object_id=i.object_id AND k.index_id=i.index_id JOIN sys.columns c ON c.object_id=k.object_id AND c.column_id=k.column_id WHERE i.is_primary_key=1 AND i.object_id=${t.object_id} ORDER BY k.key_ordinal`)).recordset;
    assert.ok(keys.length);
    const rows=(await ask(pool,`SELECT COUNT_BIG(*) AS rows,(SELECT * FROM ${quote(t.schemaName)}.${quote(t.name)} ORDER BY ${keys.map(k=>quote(k.name)).join(',')} FOR JSON PATH,INCLUDE_NULL_VALUES) AS payload FROM ${quote(t.schemaName)}.${quote(t.name)}`)).recordset[0];
    data.push({table:t.name,rows:Number(rows.rows),sha256:sha(rows.payload??'[]')});
  }
  const schema=(await ask(pool,'SELECT t.name AS tableName,c.* FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id WHERE t.is_ms_shipped=0 ORDER BY t.name,c.column_id')).recordset;
  const permissions=(await ask(pool,'SELECT * FROM sys.database_permissions ORDER BY class,major_id,minor_id,grantee_principal_id,permission_name')).recordset;
  return {modulesSha256:sha(JSON.stringify(modules)),schemaSha256:sha(JSON.stringify(schema)),dbPermissionsSha256:sha(JSON.stringify(permissions)),data};
}
export async function rbacInventory(pool) {
  const sources={
    roles:'SELECT VaiTroID,MaVaiTro,TenVaiTro,MoTa FROM dbo.VAITRO ORDER BY VaiTroID',
    permissions:'SELECT QuyenID,MaQuyen,TenQuyen,MoTa FROM dbo.QUYEN ORDER BY QuyenID',
    grants:'SELECT v.MaVaiTro,q.MaQuyen,vq.NgayGan FROM dbo.VAITRO_QUYEN vq JOIN dbo.VAITRO v ON v.VaiTroID=vq.VaiTroID JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID ORDER BY v.MaVaiTro,q.MaQuyen',
    users:'SELECT nd.NguoiDungID,v.MaVaiTro,nd.TrangThai FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO v ON v.VaiTroID=nd.VaiTroID ORDER BY nd.NguoiDungID',
    assignments:'SELECT PhanCongID,NguoiDungID,RapID,NgayBatDau,NgayKetThuc,TrangThai FROM dbo.PHANCONG_RAP ORDER BY PhanCongID',
    dbPermissions:'SELECT USER_NAME(grantee_principal_id) AS principalName,state_desc,permission_name,class_desc,OBJECT_NAME(CASE WHEN class=1 THEN major_id END) AS objectName,SCHEMA_NAME(CASE WHEN class=3 THEN major_id END) AS schemaName FROM sys.database_permissions ORDER BY principalName,class_desc,permission_name',
    dbMemberships:'SELECT USER_NAME(role_principal_id) AS roleName,USER_NAME(member_principal_id) AS memberName FROM sys.database_role_members ORDER BY roleName,memberName',
  };
  const result={};for(const [name,source] of Object.entries(sources))result[name]=(await ask(pool,source)).recordset;
  return result;
}
