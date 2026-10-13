import assert from 'node:assert/strict';
import test from 'node:test';
import { ROLES, ROLE_AREAS } from '../src/constants/roles.js';
import { userCanEnterArea, visibleAreasFor } from '../src/utils/authorization.js';

test('area routing and navigation require both the expected role and DB-loaded permission', () => {
  const customer = {
    role: ROLES.CUSTOMER,
    permissions: [{ code: 'DAT_VE' }, { code: 'DANH_GIA' }],
  };
  assert.equal(
    userCanEnterArea(customer, ROLES.CUSTOMER, ROLE_AREAS[ROLES.CUSTOMER].permission),
    true,
  );
  assert.equal(
    userCanEnterArea(
      { ...customer, permissions: [{ code: 'QL_NGUOIDUNG' }] },
      ROLES.ADMIN,
      'QL_NGUOIDUNG',
    ),
    false,
  );
  assert.deepEqual(
    visibleAreasFor(customer).map(([role]) => role),
    [ROLES.CUSTOMER],
  );
  assert.deepEqual(visibleAreasFor(null), []);
});
