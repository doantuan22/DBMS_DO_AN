// Compare actual completed rebuild runs. SQL remains monetary authority.
import assert from 'node:assert/strict';
import path from 'node:path';
import { root, read, write } from '../db/lib.mjs';
const ids = process.argv.slice(2);
assert.equal(ids.length, 3, 'Usage: compare.mjs <first-full-run> <second-seed-run> <second-fixture-run>');
assert.ok(ids.every(id => /^[A-Za-z0-9_-]+$/.test(id)), 'Use run folder names only');
const get = (id, file) => JSON.parse(read(path.join(root, 'docs/evidence/r55/runs', id, file)));
const runs = ids.map(id => get(id, 'result.json'));
const result = { testID: 'R55-REBUILD-CONSISTENCY', scenario: 'Two clean rebuilds, full pipeline vs separate build/fixture modes',
  expected: 'Distinct target GUID, same relationships/relative schedule/states/invariants; same-day money identical',
  runIDs: ids, status: 'RUNNING', comparedAt: new Date().toISOString() };
try {
  for (const run of runs) assert.equal(run.status, 'PASS', 'Run incomplete: ' + run.runID);
  assert.ok(runs[0].steps.some(step => step.testID === 'R55-RESET' && step.status === 'PASS'));
  assert.ok(runs[1].steps.some(step => step.testID === 'R55-RESET' && step.status === 'PASS'));
  assert.equal(runs[1].seedOnly, true);
  assert.equal(runs[2].mode, 'fixture-test');
  assert.equal(runs[1].targetIdentity.target.database_guid, runs[2].targetIdentity.target.database_guid);
  assert.notEqual(runs[0].targetIdentity.target.database_guid, runs[2].targetIdentity.target.database_guid, 'Rebuild must recreate database identity');
  assert.equal(runs[0].targetIdentity.server, runs[2].targetIdentity.server);
  assert.equal(runs[0].database, runs[2].database);
  for (const run of [runs[0], runs[2]]) {
    for (const id of ['R55-SEED-INVARIANTS', 'R55-PUBLIC-READS', 'R55-ROLLBACK', 'R55-COMMIT', 'R55-NEGATIVE', 'R55-MAIN-AFTER'])
      assert.ok(run.steps.some(step => step.testID === id && step.status === 'PASS'), 'Missing runtime acceptance: ' + id);
  }
  const first = get(ids[0], 'normalized.json'), second = get(ids[2], 'normalized.json');
  result.businessDates = [runs[0].clock.SeedDate, runs[2].clock.SeedDate];
  if (result.businessDates[0] === result.businessDates[1]) {
    assert.deepEqual(second, first, 'Same business day normalized snapshot differs');
    result.actual = { snapshotEquality: 'Exact', normalizedHash: runs[0].normalizedHash, categories: Object.keys(first), monetaryAuthority: 'Both live SQL fixture and public pricing assertions passed' };
  } else {
    // Relative schedule relationships should hold across days, but weekday pricing can change.
    const nested = value => (typeof value === 'string' ? JSON.parse(value) : value) || [];
    const structure = snapshot => {
      const clone = structuredClone(snapshot);
      delete clone.points;
      clone.compensation = clone.compensation.map(({ DiemBoiThuong, ...relation }) => relation);
      clone.orders = clone.orders.map(({ TongTienVe, TongTienDoAn, TienGiamGia, ...order }) => ({ ...order,
        Tickets: nested(order.Tickets).map(({ GiaVe, ...ticket }) => ticket),
        Food: nested(order.Food), Payments: nested(order.Payments).map(({ SoTien, ...payment }) => payment),
      }));
      return clone;
    };
    assert.deepEqual(structure(second), structure(first), 'Across-day relative structure differs');
    result.actual = { snapshotEquality: 'Relative structure equal; monetary values verified independently by SQL on each anchor date', monetaryReview: 'Different weekday pricing may change amounts, points and compensation; no JS recalculation' };
  }
  const protections = ids.map(id => get(id, 'main-preservation.json'));
  for (const protection of protections) assert.equal(protection.status, 'PASS');
  assert.deepEqual(protections[0].before, protections[2].after, 'Main differs across full rebuild verification');
  result.mainPreservation = 'Exact equality across both rebuilds and fixture runs';
  result.status = 'PASS';
} catch (error) { result.status = 'FAIL'; result.actual = error.message; process.exitCode = 1; }
write(path.join(root, 'docs/evidence/r55/consistency.json'), result);
console.log(JSON.stringify(result));
