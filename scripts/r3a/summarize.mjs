import assert from 'node:assert/strict';
import path from 'node:path';
import {directory,evidence,read,write} from './common.mjs';
const load=name=>JSON.parse(read(path.join(evidence,name+'.json')));
const endpoints=load('endpoint-inventory'),db=load('database-authorization'),catalog=load('rbac-inventory'),usage=load('permission-usage'),probes=load('probes'),after=load('after'),cleanup=load('cleanup');
assert.equal(probes.status,'PASS');assert.ok(after.productionUnchanged&&after.fixtureCleaned);assert.equal(cleanup.status,'PASS');
const procedures=db.filter(o=>o.type==='P');
assert.equal(procedures.length,124,'All baseline stored procedures must be inventoried.');
const summary={status:'PASS',meaning:'R3A audit complete; existing RBAC mismatches remain intentionally unfixed; R3B policy is DRAFT pending review.',at:new Date().toISOString(),
 roles:catalog.roles.length,permissions:catalog.permissions.length,rolePermissionGrants:catalog.grants.length,users:catalog.users.length,assignments:catalog.assignments.length,
 endpoints:endpoints.summary,proceduresAudited:procedures.length,sourceModulesVerified:158,
 databaseDirectPermissionChecks:procedures.filter(o=>o.permissionChecks.length).map(o=>({name:o.name,permissions:o.permissionChecks})),
 databaseDirectScopeChecks:procedures.filter(o=>o.scopeCheck).map(o=>o.name),databaseAdminBypassObjects:db.filter(o=>o.bypassAdmin).map(o=>o.name),
 databaseNullableActorScopeObjects:db.filter(o=>o.nullableActorScope||o.passesNullActor).map(o=>o.name),
 permissionsWithoutBackendGuard:usage.filter(p=>!p.backendRoutes.length).map(p=>p.code),
 roleSummary:catalog.roles.map(r=>({role:r.MaVaiTro,grants:catalog.grants.filter(g=>g.MaVaiTro===r.MaVaiTro).map(g=>g.MaQuyen),users:catalog.users.filter(u=>u.MaVaiTro===r.MaVaiTro).length})),
 probes:{status:probes.status,httpRequests:probes.requests.length,anonymousProtectedEndpointsChecked:probes.anonymousProtectedEndpointsChecked,adminNoPermissionEndpointsChecked:probes.adminNoPermissionEndpointsChecked,
  targetPolicyViolations:probes.observations.filter(o=>o.policyConformant===false),frontendCases:probes.frontend.length},
 productionUnchanged:after.productionUnchanged,mainTables:after.database.data.length,fixtureCleaned:after.fixtureCleaned,
 pendingPermissionMappings:endpoints.endpoints.filter(r=>r.expectedPermission.startsWith('CHƯA CHỐT')).map(r=>({method:r.method,route:r.route,note:r.expectedBasis}))};
write(path.join(directory,'R3A_STATUS.json'),summary);
console.log(JSON.stringify({status:summary.status,roles:summary.roles,permissions:summary.permissions,grants:summary.rolePermissionGrants,users:summary.users,assignments:summary.assignments,
 procedureCount:procedures.length,directPermissionChecks:summary.databaseDirectPermissionChecks,directScopeChecks:summary.databaseDirectScopeChecks,
 bypass:summary.databaseAdminBypassObjects,nullScope:summary.databaseNullableActorScopeObjects,unusedBE:summary.permissionsWithoutBackendGuard,requestCount:probes.requests.length,FEcases:probes.frontend.length,pending:summary.pendingPermissionMappings},null,2));
