// Read-only source mapping; creates inspection documentation, never database writes.
import assert from 'node:assert/strict';
import path from 'node:path';
import {root,read,write} from '../db/lib.mjs';
import {PROCEDURES} from '../../backend/src/db/procedures.js';
const routes=read(path.join(root,'backend/src/routes/adminRoutes.js')),controller=read(path.join(root,'backend/src/controllers/adminController.js'));
const services={admin:read(path.join(root,'backend/src/services/adminService.js')),support:read(path.join(root,'backend/src/services/supportService.js'))};
const uc={users:'ADM-02',roles:'ADM-03/05',permissions:'ADM-04',assignments:'ADM-06',cinemas:'ADM-07',rooms:'ADM-08',seats:'ADM-08',movies:'ADM-09',actors:'ADM-09',genres:'ADM-10',products:'ADM-11',promotions:'ADM-12',pricing:'ADM-13',showtimes:'ADM-14',complaints:'ADM-15',reports:'ADM-16',dashboard:'ADM-16'};
const rows=[];
for(const line of routes.split(/\r?\n/).filter(l=>l.startsWith('router.'))){
 const match=/router\.(\w+)\('([^']+)'/.exec(line);if(!match)continue;const [,method,route]=match;
 const admin=/admin\.(\w+)/.exec(line),support=/supportService\.(\w+)/.exec(line);
 let layer='admin',action,service;
 if(admin){action=admin[1];const start=controller.indexOf('export const '+action+' =');assert.ok(start>=0);service=/adminService\.(\w+)/.exec(controller.slice(start,controller.indexOf('\nexport const ',start+1)>0?controller.indexOf('\nexport const ',start+1):undefined))[1];}
 else{assert.ok(support);layer='support';action=service=support[1];}
 const text=services[layer],start=text.indexOf('async '+service+'(');assert.ok(start>=0,service);
 const end=text.indexOf('\n    async ',start+1),body=text.slice(start,end<0?undefined:end),keys=[...new Set([...body.matchAll(/'(ADMIN_[A-Z_]+|SUPPORT_[A-Z_]+)'/g)].map(m=>m[1]))];
 assert.ok(keys.length,service);const procedures=keys.map(key=>{assert.ok(PROCEDURES[key],key);return PROCEDURES[key];});
 rows.push({module:route.includes('/images')?'Image':route.endsWith('/actors')&&route.startsWith('/movies/')?'Cast':route.includes('/permissions')&&route.startsWith('/roles/')?'Role-Permission':route.split('/')[1],useCase:uc[route.split('/')[1]],method:method.toUpperCase(),api:'/api/admin'+route,permissions:[...line.matchAll(/requirePermission\(([^)]+)\)/g)].flatMap(m=>[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1])),controller:layer==='admin'?'adminController.'+action:'wrapSupport',service:layer+'Service.'+service,procedureKeys:keys,procedures,existingTest:route.includes('complaints')?'R3.3 SQL/API':route.includes('/actors')&&route.startsWith('/movies/')?'R3.1 SQL/API':route.includes('/reports')?'R4.2 SQL/API':route.startsWith('/pricing')?'R4.3 SQL/API':'Existing unit/older integration; fresh owned HTTP/SQL coverage required'});
}
write(path.join(root,'docs/evidence/r6-group-c/inspection/operation-matrix.json'),{status:'INSPECTED',rows});
const table=rows.map(r=>`| ${r.module} | ${r.method} | ${r.api} | ${r.procedures.join(', ')} | ${r.existingTest} | Fresh guarded replay or owned fixtures + auth/negative/persisted checks |`).join('\n');
write(path.join(root,'docs/R6_GROUP_C_INSPECTION.md'),`# R6 Group C — Checkpoint A

Inspection before test implementation, 2026-10-09. Scope R6.8–R6.10; no R7/R8/R9 or UC matrix changes. Source roadmap R6.8–R6.10, USE_CASE_BASELINE_45.md (14/9/6/16 =45; image ADM-07, actor/cast ADM-09; ADM-17 excluded), R5.5 pipeline and Group A/B reports/acceptance inspected. Baseline is 27 tables /159 modules. Local SQL sa is an accepted project constraint.

Group A acceptance DONE,26 mandatory scenarios; Group B acceptance DONE,498 heterogeneous verification units. Preserve and verify their evidence/source hashes; do not sum unlike counts or rerun their stress without affected production changes.

HTTP trace: route → authenticate current user → role + permissions AND → controller validation → service typed gateway key → whitelisted procedure.execute → actual SQL. Customer complaint reads require ownership; support/Admin global access follows current role/permissions. Processing/status require QL_KHIEUNAI + XULY_KHIEUNAI; order reference requires QL_KHIEUNAI + TRA_CUU_DON. Customer timeline currently exposes processingHistory (id/content/time/status) only, without employee identity; no new fields/API.

Complaint parent Mới, process statuses Đang xử lý/Đã giải quyết/Đã đóng/Từ chối. Trigger AFTER INSERT selects max persisted XuLyID per parent, rather than timestamp; writers serialize on KHIEUNAI and trigger reads committed history. UpdateStatus appends history. FK/CHECK/actor eligibility protect batch inserts. Existing R3.3 covers bulk input permutations, mixed/multiple parents, timestamp reversal, invalid batch and trigger fault after parent update with caller rollback. Supplement linked/unlinked HTTP flow and both order-reference permissions. Reuse R3.1 cast atomicity, R4.2 four-recordset report fixture oracle, R4.3 condition edits/snapshots/rollback.

No production defect presumed. Existing R4/R5 broad runners mutate shared seed and do not self-clean, so do not run them wholesale. New Admin tests own resource IDs and restore all state, including exact permission grant timestamps. Test every supported operation, positive/negative and live permission/wrong-role denial; reuse detailed suites for Cast/Pricing/Complaint/Report. Image is only the existing cinema-image commands.

Fresh target preflight: CinemaBookingDB_R0_R6C_20261009_01 was absent, instance DESKTOP-E67DPCV, separate files, evidence docs/evidence/r55/runs/2026-10-09T12-28-04-780Z-048cef78. Build through R5.5; preflight existing GUID/files again before fixtures. No reset of main or A/B targets. Compare 27-table/metadata fingerprints,159-module parity, constraints/trigger enabled and main/A/B preservation. No production change at A.

## Operation matrix (source-derived, ${rows.length} Admin endpoints)

| Module | Operation | API | Stored Procedure | Existing Test | Missing Evidence |
|---|---|---|---|---|---|
${table}

## Checkpoints

B: R3.3 SQL/API replay + linked complaint flow/order-reference conjunction. C: Admin owned commands/reads and authorization per supported operation + R3.1/R4.2/R4.3 replay. D: verify A/B/C evidence and create five integration reports with case IDs and relative evidence paths. E: relevant regression, no-SQL, cleanup, source/evidence preservation and report consistency. Failed attempts stay immutable; reproduce on independent fixtures and fix only proven root causes.
`);
console.log('INSPECTED '+rows.length+' actual Admin endpoint/procedure mappings.');
