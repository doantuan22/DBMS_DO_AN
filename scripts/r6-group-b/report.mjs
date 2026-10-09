// Acceptance is derived from fresh, complete real runs, never from planned counts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {root,read,write} from '../db/lib.mjs';
import {hash} from '../db/test-target.mjs';
const option=key=>process.argv.find(a=>a.startsWith('--'+key+'='))?.slice(key.length+3);
const base=path.join(root,'docs/evidence/r6-group-b');
const phaseFor={B:'R6.4',C:'R6.5',D:'R6.6',E:'R6.7'};
const expectedNames=['r32-sql','r32-api','r32-transactions','r32-concurrency','scope','r11-sql','r11-api','r11-concurrency','r12-sql','r12-api','r12-nested','status-overlap','r12-concurrency','backend','no-sql'];
function loadRun(id,label){
 assert.match(id||'',/^\d{4}-\d{2}-\d{2}T[\d-]+Z-[a-f\d]{8}$/);
 const dir=path.join(base,'runs',id),e=JSON.parse(read(path.join(dir,'result.json')));
 assert.equal(e.status,'PASS');assert.equal(e.label,label);assert.deepEqual(e.checks.map(c=>c.name),expectedNames);assert.ok(e.checks.every(c=>c.status==='PASS'));
 for(const key of ['fixturePreservation','mainPreservation','productionSourcePreserved'])assert.equal(e[key],'PASS');assert.equal(e.oldEvidencePreservation.status,'PASS');
 assert.deepEqual(e.before,e.after);assert.deepEqual(e.mainBefore,e.mainAfter);assert.deepEqual(e.moduleBefore,e.moduleAfter);assert.equal(e.moduleAfter.modules,159);assert.equal(e.after.data.length,27);
 const units=[],results={},phases=Object.fromEntries(Object.values(phaseFor).map(p=>[p,{pass:0,fail:0,blocked:0,status:'DONE'}]));
 for(const check of e.checks.filter(c=>c.output)){
  assert.equal(check.originalSha256,hash(read(path.join(root,check.source))),'Source changed after run: '+check.source);
  const file=path.join(dir,check.output),result=JSON.parse(read(file));assert.equal(result.status,'PASS');results[check.name]=result;
  const phase=phaseFor[check.checkpoint];
  const groups=Object.entries(result).filter(([key,value])=>['cases','states','scenarios','stress','monetary','rollback'].includes(key)&&Array.isArray(value));
  for(const key of ['precision','outerTransaction'])if(result[key])groups.push([key,[result[key]]]);
  for(const [group,rows] of groups)for(const [index,row] of rows.entries()){
   assert.equal(row.status??row.Result??row.result,'PASS',check.name+'/'+group+'/'+index);
   const id=row.id||`${phase}-${check.name}-${group}-${String(index+1).padStart(3,'0')}`;
   units.push({id,phase,source:check.source,sourceSha256:check.originalSha256,name:row.name||row.TestCase||row.description||`${check.name}/${group}/${index+1}`,precondition:row.initial||row.BeforeState?{evidence:check.output,selector:`${group}/${index}/`+(row.BeforeState?'BeforeState':'initial')}:{fixtureSource:check.source},input:row.input??row.requested??row.operations??{replayedCase:row.TestCase||row.name||row.description,source:check.source},expected:row.expected??{acceptedAssertions:check.source,...(row.sqlError||row.ErrorNumber?{sqlError:row.sqlError??row.ErrorNumber}:{})},actual:{status:'PASS',...(row.response?{response:row.response}:{}),...(row.results?{results:row.results}:{}),...(row.procedureResult?{procedureResult:row.procedureResult}:{}),...(row.ErrorNumber!==undefined?{sqlError:row.ErrorNumber}:{}),...(row.overlapCount!==undefined?{committedOverlaps:row.overlapCount}:{})},sqlAssertion:{evidence:check.output,selector:`${group}/${index}`,persistedStateAndRollback:'Assertions in unchanged accepted source (or documented fixture adapter) passed on real SQL Server.'},cleanup:result.cleanup||result.fixtureCleanup||result.fixturePreservation||'PASS (suite and runner full fingerprints match)',status:'PASS',evidence:check.output,selector:`${group}/${index}`});phases[phase].pass++;
  }
 }
 assert.equal(new Set(units.map(u=>u.id)).size,units.length);
 const shows=results['r12-concurrency'],rooms=results['r11-concurrency'],history=results['r32-concurrency'];
 assert.ok(shows.stress.length>=100);assert.equal(shows.finalCommittedOverlapCount,0);assert.equal(shows.fixtureCleanup,'PASS');
 const sameRoom=shows.scenarios.filter(r=>r.name!=='different_rooms');
 for(const row of [...sameRoom,...shows.stress.filter(r=>r.mode==='gated')]){assert.notEqual(row.sessionA,row.sessionB);assert.ok(row.wait.some(w=>w.blocking_session_id===row.sessionA&&w.wait_type.startsWith('LCK_')));assert.ok(row.sessionsAfter.every(s=>s.transactions===0&&s.state===0));assert.equal(row.overlapCount,0);}
 assert.ok(shows.scenarios.filter(r=>r.name==='different_rooms').every(r=>r.independentCommit));
 for(const row of rooms.cases){assert.notEqual(row.sessionA,row.sessionB);assert.ok(row.timeline.some(t=>t.rows?.some(w=>w.blocking_session_id>0&&w.wait_type.startsWith('LCK_'))));assert.equal(row.invariant,'PASS');}
 for(const row of history.cases){assert.notEqual(row.spids.a,row.spids.b);assert.match(row.blocking.wait_type,/^LCK_/);assert.equal(row.blocking.blocking_session_id,row.spids.a);}
 const concurrency={historicalRaces:history.cases.length,roomRaces:rooms.cases.length,showtimeScenarios:shows.scenarios.length,stressRaces:shows.stress.length,gatedStress:shows.stress.filter(r=>r.mode==='gated').length,simultaneousStress:shows.stress.filter(r=>r.mode==='simultaneous').length,deterministicLockWaits:history.cases.length+rooms.cases.length+sameRoom.length+shows.stress.filter(r=>r.mode==='gated').length,independentRoomCommits:shows.scenarios.filter(r=>r.independentCommit).length,finalCommittedOverlaps:shows.finalCommittedOverlapCount};
 const total=units.length,http=e.checks.reduce((n,c)=>n+(c.httpRequests||0),0);return {id,dir,e,results,units,phases,total,http,concurrency};
}
const checkpoints=loadRun(option('checkpoints'),'checkpoints'),final=loadRun(option('final'),'final');
assert.equal(final.e.database,checkpoints.e.database);assert.deepEqual(final.phases,checkpoints.phases);assert.deepEqual(final.concurrency,checkpoints.concurrency);
assert.ok(Date.parse(final.e.startedAt)>Date.parse(checkpoints.e.completedAt),'Final verification must follow B–E checkpoints.');
assert.equal(final.e.integrity[1][0].rcsi,true);assert.deepEqual(final.e.integrity[2][0],{invalidForeignKeys:0,invalidChecks:0,disabledTriggers:0,committedOverlaps:0});assert.deepEqual(final.e.integrity[3][0],{name:'TRG_SuatChieu_KiemTraTrungLich',is_disabled:false});
const acceptance={status:'DONE',database:final.e.database,checkpointsRun:checkpoints.id,finalRun:final.id,phases:final.phases,finalVerification:{pass:final.total,fail:0,blocked:0,httpRequests:final.http,backendTests:final.e.checks.find(c=>c.name==='backend').pass},replayedPassingRuns:2,totalPassingUnitsAcrossTwoFullRuns:final.total+checkpoints.total,concurrency:final.concurrency,productionDefects:0,productionChanges:0,offlineFixtureFix:'Scope permission restore now preserves NgayGan; initial failed attempt and exact baseline recovery remain available.',mainPreservation:final.e.mainPreservation,fixturePreservation:final.e.fixturePreservation,oldEvidencePreservation:final.e.oldEvidencePreservation,moduleParity:final.e.moduleAfter,integrity:final.e.integrity,scopeIDs:final.results.scope.cases.map(c=>c.id),createdAt:new Date().toISOString()};
for(const [file,value] of [[path.join(final.dir,'verification-matrix.json'),{runID:final.id,database:final.e.database,phases:final.phases,total:final.total,cases:final.units}],[path.join(base,'acceptance.json'),acceptance]]){assert.ok(!fs.existsSync(file),'Do not overwrite acceptance/evidence; use a fresh final run.');write(file,value);}
const ref=file=>`evidence/r6-group-b/runs/${final.id}/${file}`;
const rows=Object.entries(final.phases).map(([phase,value])=>`| ${phase} | ${value.pass} | 0 | 0 | DONE |`).join('\n');
const regression=final.e.checks.filter(c=>c.source).map(c=>`| ${c.name} | ${c.cases}${c.monetary?` + ${c.monetary} monetary`:''}${c.rollback?` + ${c.rollback} rollback`:''}${c.stress?` + ${c.stress} stress`:''}${c.name==='r32-sql'?' + 1 precision + 1 outer transaction':''} | ${c.httpRequests||0} | [PASS](${ref(c.output)}) |`).join('\n');
const report=`# R6 Group B — Database & Backend Integration Verification

**Group B: DONE.** Chỉ R6.4–R6.7; không triển khai R6.8+. Final verification: **${final.total}/${final.total} PASS**, FAIL=0, BLOCKED=0, ${final.http} request HTTP thật; backend **191/191**, no-SQL audit PASS. Không phát hiện production defect, không sửa production code.

## A. Implementation Summary

Khảo sát roadmap, [ma trận Checkpoint A](R6_GROUP_B_INSPECTION.md), baseline/canonical build, Express routes/validators/middleware/services/procedure bindings, Manager scope function, Manager/Admin Show/Seat Update, Room Delete, cancel cascade, time/overlap validator và trigger set-based. Working tree ban đầu sạch, Group A acceptance giữ nguyên.

Tái sử dụng R3.2 SQL/API/transaction/historical concurrency và R1.1/R1.2 SQL/API/nested/concurrency; giữ nguyên source và assertion. Runner mới chỉ guard database thật, redirect evidence vào thư mục mới, resolve import và ghi trace HTTP đã redact. Nested Update dùng đúng fixture adaptation R3.2 đã chấp nhận: fault sau UPDATE thay vì public detail reader; cả 14 assertion giữ nguyên, bốn module khôi phục.

Bổ sung [8 Manager scope scenarios](${ref('scope/scope.json')}) cho expired/revoked assignment sau login, direct/indirect resource, spoof RapID, role và live permission; thêm [8 overlap cases với Đóng bán/Hoàn thành](${ref('status-overlap/status-overlap.json')}). Fixture/setup/verification dùng SQL trực tiếp offline; backend runtime tiếp tục stored-procedure-only.

File mới: scripts/r6-group-b/{common,run,scope,status-overlap,report}.mjs và README; inspection/report; database build inventory và evidence mới trong R5.5/R6B. Không đổi backend/frontend/shared, canonical SQL/schema/seed/manifest, test source hay evidence cũ.

Một **lỗi fixture**, đã giải quyết: attempt [2026-10-09T11-58-18-786Z-315d5993](evidence/r6-group-b/runs/2026-10-09T11-58-18-786Z-315d5993/result.json) có 8/8 business scope scenarios PASS nhưng cleanup FAIL vì INSERT restore quyền bỏ cột NgayGan và dùng default timestamp. Sửa offline restore để truyền đầy đủ NgayGan; [recovery](evidence/r6-group-b/recovery-permission-fixture.json) chứng minh toàn bộ DB khớp fingerprint trước attempt. Hai lần full replay sau đó dùng fixture độc lập và cleanup PASS. Không xóa/sửa failed evidence.

## B. Verification Matrix

Đếm **assertion group/scenario/race round thực thi** trong final run, không đếm số request thành scenario. R6.4 gồm 108 SQL cases + 2 monetary + 4 injected rollback + 1 native precision + 1 outer transaction; 82 API cases + 2 monetary; 8 caller cases; 20 historical races. R6.6 gồm 20 SQL cases, 7 REST state groups, 10 races. R6.7 gồm 49 SQL cases, 3 REST state groups, 14 nested cases, 8 status cases, 26 races và 125 stress rounds. R6.5 là đúng 8 ID, 47 HTTP requests. R6.7-07 tham chiếu cùng 10 room races của R6.6, không đếm lại.

| Phase | PASS | FAIL | BLOCKED | Status |
|---|---:|---:|---:|---|
${rows}
| **GROUP B** | **${final.total}** | **0** | **0** | **DONE** |

[Machine acceptance](evidence/r6-group-b/acceptance.json), [per-case IDs/input/expected/actual/SQL assertion/cleanup index](${ref('verification-matrix.json')}), [final run](${ref('result.json')}). Hai full passing runs: Checkpoints B–E **${checkpoints.id}**, Final F **${final.id}**; tổng ${acceptance.totalPassingUnitsAcrossTwoFullRuns} PASS units, ${checkpoints.http+final.http} HTTP requests. Các số bảng là final acceptance, không che attempt fixture thất bại đã ghi ở A.

## C. Database Integrity Results

- **Money PASS:** tạo booking, payment attempt/result thành công qua API/SP thật; pricing 15000→45000 và product 10000→40000 thay đổi persisted. Giá vé cũ 95000, đơn giá food 10000, payment/order total 199000 cùng discount/ticket/food/order snapshots không đổi khi đọc lại cùng order; giá vé catalog hiện tại 125000. Product name đọc label hiện tại đúng policy.
- **Show history PASS:** mọi trạng thái order (pending, paid, canceled, expired, completed, refunded, pending hết hold) đều khóa movie/start/end/format/base-price; 409 SHOWTIME_HAS_ORDERS / SQL50120, trạng thái và monetary data không bị side effect. Room binding không có trong SP; API roomId →400 UNKNOWN_REQUEST_FIELD, SQL unsupported parameter bị từ chối. Unused controls, noop, đóng bán và cancellation contract còn hoạt động.
- **Seat history PASS:** kể cả vé canceled/used vẫn khóa type; 409 SEAT_HAS_TICKET_HISTORY / SQL50207. Positive unused type, trạng thái hoạt động/bảo trì/hỏng với canceled history, used noop hoạt động; guard vé hiệu lực tương lai vẫn giữ.
- **Scope PASS:** resource thực quyết định cinema, kể cả query RapID hợp lệ/actor spoof. Expired assignment vẫn Hiệu lực nhưng ngày đã hết và revoked status Đã hủy đều mất scope ngay sau login; token cũ không bypass. Foreign →403 MANAGER_CINEMA_FORBIDDEN; customer →403 MANAGER_REQUIRED; thiếu permission mới →403 FORBIDDEN. Mỗi denied request so sánh toàn bộ table/metadata fingerprint trước/sau.
- **Room atomicity PASS:** missing404 ROOM_NOT_FOUND; empty/seats-only hard-delete; historical dependencies bất kỳ status được giữ. Create commit trước →delete **200 Deleted=false/Deactivated=true**, phòng Ngưng hoạt động, ghế/suất nguyên vẹn; đây là policy R1.1 hiện hành. Delete commit trước →creator không commit (SQL50056); không có room còn/show tồn tại nhưng mất ghế. Unexpected fault sau seat-delete rollback an toàn; FK fault →409 ROOM_DELETE_CONFLICT.
- **Overlap/transactions PASS:** mọi status trừ Đã hủy chiếm lịch; final active overlap=0. Boundary end==start hợp lệ. Multi-row trigger reject toàn statement khi overlap, accept adjacency/canceled rows. Caller success/committable fault giữ @@TRANCOUNT=1/XACT_STATE=1 và chỉ rollback phần procedure; doomed error rollback toàn transaction, trạng thái cuối 0/0.

Target riêng **${final.e.database}**, SQL Server **${final.e.preflight.server.ServerName}**, version ${final.e.preflight.server.Version}, RCSI=ON; actual GUID và MDF/LDF trong preflight/result. Build từ canonical source qua R5.5, không reset DB có sẵn. Cả 27 table data fingerprints và metadata khớp trước/sau từng suite và cả run; 159 module source parity PASS; transaction tables seed-only rỗng sau cleanup. Không FK/check untrusted/disabled, không trigger disabled; overlap trigger enabled. DB test giữ lại để review, identity counters tăng theo fixture inserts; dữ liệu seed và definitions không thay đổi.

DB chính CinemaBookingDB chỉ đọc: before/after fingerprints giống nhau ở build và cả ba attempts. **${final.e.oldEvidencePreservation.files} evidence files cũ** có SHA256 không đổi qua replay (bao gồm Group A). [Final integrity/preservation](${ref('result.json')}).

## D. Concurrency Evidence

| Concurrent scenario | Final runs | SQL overlap / outcome / persisted invariant | Evidence |
|---|---:|---|---|
| Booking vs historical show/seat/movie update | ${final.concurrency.historicalRaces} | SPID độc lập; DMV LCK waits + resource/index locks; COMMIT/ROLLBACK hai thứ tự, revalidate snapshot/history, không drift | [historical races](${ref('r32-concurrency/historical-concurrency.json')}) |
| Room Delete vs Create (R6.6 / R6.7-07) | ${final.concurrency.roomRaces} | Manager/Admin/alias, hai thứ tự thắng; LCK wait trên transaction mở thật; delete trước room/seats/show=[] hoặc create trước room deactivated/seats/show giữ nguyên | [room races](${ref('r11-concurrency/concurrency.json')}) |
| Showtime create/update/cancel matrix | ${final.concurrency.showtimeScenarios} | 22 same-room gated waits; ${final.concurrency.independentRoomCommits} different-room writers commit trong khi A vẫn mở; final overlap=0, session 0/0 | [showtime races](${ref('r12-concurrency/concurrency.json')}) |
| Overlap stress | ${final.concurrency.stressRaces} | ${final.concurrency.gatedStress} actual SQL gated lock waits + ${final.concurrency.simultaneousStress} simultaneous real SP races; mỗi round đúng 1 success/1 SQL50001, final 1 show/overlap=0 | [stress timeline](${ref('r12-concurrency/concurrency.json')}) |

Mỗi evidence có contender input/procedure/actor, distinct SQL session IDs, timestamp timeline, wait/blocker và commit/rollback outcome, persisted state, cleanup. Tổng ${final.concurrency.deterministicLockWaits} deterministic actual lock waits + ${final.concurrency.independentRoomCommits} independent commits mỗi full run. 25 simultaneous rounds có DMV sampling khi bắt được; không dùng Promise.all hoặc thời gian response làm bằng chứng lock bắt buộc. Parent barrier nằm ở SQL transaction, không có JS mutex. Hai full runs đều đạt ≥100 stress, không benchmark.

| R6.7 ID | Coverage |
|---|---|
| 01 | overlap create/create Manager/Admin/alias, 6 gated scenarios +125 stress |
| 02 | same room non_overlap, 4 role pairings, cả hai commit |
| 03 | different_rooms, 4 role pairings, independent commit |
| 04 | create_update và update_create, hai thứ tự Manager/Admin |
| 05 | update_update và same_show_updates, hai thứ tự Manager/Admin |
| 06 | cancel_create và create_cancel, cancellation/final states đúng contract |
| 07 | 10 room delete/create races của R6.6 |
| 08 | R1.2 multirow_overlap/multirow_clear/multirow_cancelled, enabled trigger |
| 09 | SQL/API boundary +4 non_overlap races, end==start |
| 10 | 14 R1.2 nested transaction/savepoint cases |

## E. Regression Results

| Suite | PASS groups/rounds | HTTP requests | Evidence |
|---|---:|---:|---|
${regression}

Backend 191/191, skipped=0: [log](${ref('backend.log')}); stored-procedure-only runtime [no-SQL audit](${ref('no-sql.log')}) PASS. All 159 modules match canonical source after every suite. Không production fix ảnh hưởng booking/payment, do đó không cần full Group A rerun theo yêu cầu; Group A evidence/source vẫn nguyên. Monetary booking/payment integration được chạy lại thực tế trong R3.2 replay.

## F. Outstanding Issues

Không có material defect, blocker, FAIL hoặc test chưa chạy trong R6.4–R6.7 sau fix fixture. Failed attempt giữ nguyên và đã có recovery/regression. Verification dùng Express in-process listen localhost với middleware/services/SQL Server thật và offline DMV sessions; SQL account là cấu hình local hiện có, không phải least-privilege deployment verification. Không chạy scheduler/background process hay UI/browser; không nằm trong matrix Nhóm B. Không triển khai R6.8+, không đổi business scope/lock mechanism.

## G. Final Conclusion

R6.4 **DONE** · R6.5 **DONE** · R6.6 **DONE** · R6.7 **DONE** · **Group B DONE**. Historical integrity, scope isolation, atomicity, concurrency/rollback và regressions đều được xác nhận bằng persisted SQL Server/Backend evidence mới. Dừng tại R6.7.
`;
write(path.join(root,'docs/R6_GROUP_B_INTEGRATION_REPORT.md'),report);
console.log(`DONE Group B: ${final.total} PASS units, ${final.http} HTTP, ${final.concurrency.stressRaces} stress; report generated.`);
