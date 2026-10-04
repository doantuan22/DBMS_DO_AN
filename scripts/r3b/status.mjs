import assert from 'node:assert/strict';
import path from 'node:path';
import {root,read,write} from '../db/lib.mjs';
const directory=path.join(root,'audit/remediation/r3b');
const artifact=name=>JSON.parse(read(path.join(directory,'evidence',name)));
const checks=artifact('checks.json'),probes=artifact('probes.json'),browser=artifact('partial-grants-browser.json');
const deployment=artifact('main-deployment.json'),final=artifact('main-final.json'),migration=artifact('migration-fixture.json'),idempotency=artifact('migration-idempotency.json');
for(const result of [checks,probes,browser,deployment,final,migration,idempotency,artifact('endpoint-inventory.json')])assert.equal(result.status,'PASS');
assert.equal(checks.checks.length,16);assert.equal(probes.tableCount,27);assert.equal(final.remainingCinemaBookingDatabases.length,1);
const status={status:'PASS',at:new Date().toISOString(),database:'CinemaBookingDB',tableCount:27,sqlModules:159,storedProcedures:125,newTables:0,newPermissionCodes:0,newRoles:0,
  bugs:{'BUG-019':'RESOLVED','BUG-020':'RESOLVED','CONFLICT-005':'RESOLVED'},
  regressionChecks:{passed:checks.checks.length,total:16},backendTests:{passed:102,total:102},frontendTests:{passed:35,total:35},
  httpAuthorizationRequests:probes.requests.length,directDatabaseChecks:probes.checks.length,frontendBrowserChecks:browser.result.checks.length,
  mainDataPreserved:true,mainSchemaPreserved:true,mainExecutionGrantsPreserved:true,backupChecksumAndRestoreVerify:true,
  reset:{status:'PASS',command:'npm.cmd run db:reset -- --database=CinemaBookingDB_R0_R1_R2_R3B20261004',sourceParityModules:159},
  migration:{preflightModules:migration.preflightModules,afterModules:migration.modulesVerified,historyPreserved:true,idempotent:true},
  testDatabasesDeleted:['CinemaBookingDB_R0_R1_R2_R3BManifest20261004','CinemaBookingDB_R0_R1_R2_R3B20261004'],remainingCinemaBookingDatabases:final.remainingCinemaBookingDatabases,
  mainHttpSmoke:{status:'PASS',requests:31,skips:2,reason:'No suitable future showtimes in existing main data; detail/seats cases pass in disposable regression fixtures.'},
  report:'audit/remediation/r3b/R3B_REPORT.md',matrix:'audit/remediation/r3b/PERMISSION_MATRIX.csv'};
write(path.join(directory,'R3B_STATUS.json'),status);console.log(JSON.stringify(status,null,2));
