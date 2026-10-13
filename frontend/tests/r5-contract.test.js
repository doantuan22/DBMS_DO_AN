import assert from 'node:assert/strict';
import test from 'node:test';
import { toBody, adminForms, formFields } from '../src/utils/adminForms.js';
import { RESOURCE_STATUSES } from '../../shared/resourceContract.mjs';
import { CINEMA_IMAGE_STATUSES } from '../src/constants/cinemaImageStatuses.js';
test('R5 BUG008: empty CSV permissions/genres stay empty; invalid IDs are not silently dropped', () => {
  const fields = [['permissionIds', 'Permission IDs', 'csv']];
  for (const value of ['', null, undefined, ' , '])
    assert.deepEqual(toBody({ permissionIds: value }, fields), { permissionIds: [] });
  assert.deepEqual(toBody({ permissionIds: '1,2147483648,1.5' }, fields), {
    permissionIds: [1, 2147483648, 1.5],
  });
  assert.deepEqual(JSON.parse(JSON.stringify(toBody({ permissionIds: 'bad' }, fields))), {
    permissionIds: [null],
  });
});
test('R5 BUG002: all status-bearing Admin forms have shared DB enum options', () => {
  for (const [key, definition] of Object.entries(adminForms))
    if (formFields(definition, true).some(([field]) => field === 'status'))
      assert.ok(RESOURCE_STATUSES[key]?.length, key);
  assert.ok(RESOURCE_STATUSES.showtimes.includes('Đóng bán'));
  assert.ok(!RESOURCE_STATUSES.showtimes.includes('Tạm ngừng'));
  assert.deepEqual(CINEMA_IMAGE_STATUSES, RESOURCE_STATUSES.cinemaImages);
});
