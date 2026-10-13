import assert from 'node:assert/strict';
import test from 'node:test';
import { createProcedureClient, DbTypes } from '../src/db/procedureClient.js';

function fakePool() {
  const calls = { inputs: [], outputs: [], executed: null };
  const request = {
    input(name, type, value) {
      calls.inputs.push([name, value]);
      return request;
    },
    output(name) {
      calls.outputs.push(name);
      return request;
    },
    async execute(name) {
      calls.executed = name;
      return { recordset: [] };
    },
  };
  return { calls, pool: { request: () => request } };
}

test('rejects procedure names that are not whitelisted', async () => {
  const { pool } = fakePool();
  const client = createProcedureClient(async () => pool);
  await assert.rejects(client.executeProcedure('dbo.sp_Anything'), /not in the whitelist/);
});

test('executes whitelisted procedure with typed input and output', async () => {
  const { pool, calls } = fakePool();
  const client = createProcedureClient(async () => pool);
  await client.executeProcedureWithOutputs(
    'BOOK_TICKET',
    { SuatChieuID: { type: DbTypes.Int, value: 1 } },
    { DonDatVeID: DbTypes.Int },
  );
  assert.equal(calls.executed, 'dbo.sp_DatVe');
  assert.deepEqual(calls.inputs, [['SuatChieuID', 1]]);
  assert.deepEqual(calls.outputs, ['DonDatVeID']);
});

test('rejects parameters without a declared type', async () => {
  const { pool } = fakePool();
  const client = createProcedureClient(async () => pool);
  await assert.rejects(
    client.executeProcedure('BOOK_TICKET', { X: { value: 1 } }),
    /must declare a type/,
  );
  await assert.rejects(
    client.executeProcedureWithOutputs('BOOK_TICKET', {}, { NewOrder: undefined }),
    /Output parameter "NewOrder" must declare a type/,
  );
});
