// Direct SQL is test-only fixture ownership/assertion/cleanup on an exact guarded disposable target.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {sql} from '../../database/11_tests/r6-group-a/support.mjs';
import {identifier} from '../db/test-target.mjs';

export async function snapshot(pool,guard,directory) {
 const tables=(await pool.request().batch(guard+`SELECT t.name FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE s.name='dbo' AND t.is_ms_shipped=0 ORDER BY t.name;`)).recordset;
 assert.equal(tables.length,27);
 const edges=(await pool.request().batch(guard+`SELECT OBJECT_NAME(parent_object_id) child,OBJECT_NAME(referenced_object_id) parent FROM sys.foreign_keys;`)).recordset;
 const result={tables:[],edges};
 for(const {name} of tables){
  const columns=(await pool.request().input('Table',sql.NVarChar(128),name).query(`SELECT c.name,ty.name type,c.max_length length,c.precision,c.scale,c.is_identity identityColumn,c.is_computed computedColumn,
   CASE WHEN EXISTS(SELECT 1 FROM sys.indexes i JOIN sys.index_columns ic ON i.object_id=ic.object_id AND i.index_id=ic.index_id WHERE i.is_primary_key=1 AND i.object_id=c.object_id AND ic.column_id=c.column_id) THEN 1 ELSE 0 END pk
   FROM sys.columns c JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE c.object_id=OBJECT_ID('dbo.'+@Table) ORDER BY c.column_id;`)).recordset;
  assert.ok(columns.some(c=>c.pk));
  const rows=(await pool.request().batch(guard+`SELECT * FROM dbo.${identifier(name)};`)).recordset;
  result.tables.push({name,columns,rows});
 }
 fs.writeFileSync(path.join(directory,'seed-snapshot.private.json'),JSON.stringify(result));
 return result;
}

const rowKey=(row,cols)=>JSON.stringify(cols.filter(c=>c.pk).map(c=>row[c.name]));
const sqlType=c=>c.type+(c.type==='nvarchar'||c.type==='nchar'?'('+(c.length===-1?'max':c.length/2)+')':
 ['varchar','char','varbinary','binary'].includes(c.type)?'('+(c.length===-1?'max':c.length)+')':
 ['decimal','numeric'].includes(c.type)?`(${c.precision},${c.scale})`:['datetime2','datetimeoffset','time'].includes(c.type)?`(${c.scale})`:'');

export async function restore(pool,guard,baseline,save){
 const pending=new Set(baseline.tables.map(t=>t.name)),order=[];
 while(pending.size){
  const children=[...pending].filter(name=>!baseline.edges.some(e=>e.parent===name&&e.child!==name&&pending.has(e.child)));
  assert.ok(children.length,'Foreign-key cleanup cycle must be reviewed');
  for(const name of children){order.push(name);pending.delete(name);}
 }
 const removed={},changed={};
 // Isolated target began seed-only. Record actual new primary keys before deleting only those keys.
 for(const name of order){
  const table=baseline.tables.find(t=>t.name===name),cols=table.columns;
  const rows=(await pool.request().batch(guard+`SELECT * FROM dbo.${identifier(name)};`)).recordset;
  const seedKeys=new Set(table.rows.map(r=>rowKey(r,cols))),owned=rows.filter(r=>!seedKeys.has(rowKey(r,cols)));
  removed[name]=owned.length;
  if(owned.length){
   const keys=cols.filter(c=>c.pk),schema=keys.map(c=>identifier(c.name)+' '+sqlType(c)).join(',');
   await pool.request().input('Rows',sql.NVarChar(sql.MAX),JSON.stringify(owned.map(r=>Object.fromEntries(keys.map(c=>[c.name,r[c.name]])))))
    .batch(guard+`DELETE target FROM dbo.${identifier(name)} target JOIN OPENJSON(@Rows) WITH(${schema}) owned ON ${keys.map(c=>'target.'+identifier(c.name)+'=owned.'+identifier(c.name)).join(' AND ')};`);
  }
 }
 for(const table of [...baseline.tables].reverse()){
  const current=(await pool.request().batch(guard+`SELECT * FROM dbo.${identifier(table.name)};`)).recordset;
  const byKey=new Map(current.map(r=>[rowKey(r,table.columns),r]));
  const affected=table.rows.filter(row=>JSON.stringify(row)!==JSON.stringify(byKey.get(rowKey(row,table.columns))));
  changed[table.name]=affected.length;
  if(!affected.length)continue;
  assert.ok(affected.every(row=>byKey.has(rowKey(row,table.columns))),'Seeded row removed; do not silently reconstruct');
  const fields=table.columns.filter(c=>!c.computedColumn&&c.type!=='timestamp');
  const writes=fields.filter(c=>!c.pk&&!c.identityColumn),keys=fields.filter(c=>c.pk);
  await pool.request().input('Rows',sql.NVarChar(sql.MAX),JSON.stringify(affected)).batch(guard+
   `UPDATE target SET ${writes.map(c=>identifier(c.name)+'=seed.'+identifier(c.name)).join(',')} FROM dbo.${identifier(table.name)} target JOIN OPENJSON(@Rows) WITH(${fields.map(c=>identifier(c.name)+' '+sqlType(c)).join(',')}) seed ON ${keys.map(c=>'target.'+identifier(c.name)+'=seed.'+identifier(c.name)).join(' AND ')};`);
 }
 save('owned-row-cleanup.json',{status:'PASS',method:'Reviewed FK child-before-parent; only rows outside private seed PK snapshot; seeded values restored; no FK disable/reseed',removed,changed,order});
}
