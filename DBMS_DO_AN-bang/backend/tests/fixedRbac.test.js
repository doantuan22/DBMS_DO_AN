import test from 'node:test';
import assert from 'node:assert/strict';
import { createProcedureClient } from '../src/db/procedureClient.js';
import { createAdminService } from '../src/services/adminService.js';
import { userStatus, userCreate } from '../src/validators/adminValidator.js';
import { validateRegister } from '../src/validators/authValidator.js';

test('retired RBAC write keys are refused before a database connection is acquired', async () => {
  let connections = 0;
  const client = createProcedureClient(() => { connections++; throw new Error('Unexpected DB access'); });
  for (const key of ['ADMIN_ROLE_CREATE', 'ADMIN_ROLE_UPDATE', 'ADMIN_ROLE_DELETE', 'ADMIN_PERMISSION_CREATE', 'ADMIN_PERMISSION_UPDATE', 'ADMIN_PERMISSION_DELETE', 'ADMIN_ROLE_PERMISSION_SET'])
    await assert.rejects(client.executeProcedure(key), /not in the whitelist/);
  assert.equal(connections, 0);
  const service = createAdminService();
  for (const name of ['createRole','updateRole','deleteRole','createPermission','updatePermission','deletePermission','setRolePermissions'])
    assert.equal(service[name], undefined);
});

test('account contracts reject role changes and client-supplied grants', () => {
  for (const field of ['roleId','role','permissionIds','permissions']) {
    assert.throws(() => userStatus({ status: 'Hoạt động', [field]: 1 }), { status: 400 });
    assert.throws(() => validateRegister({ HoTen: 'Customer', Email: 'fixed@example.test', MatKhau: 'password8', [field]: 1 }), { status: 400 });
  }
  assert.throws(() => userCreate({ name: 'Manager', email: 'fixed@example.test', password: 'password8', roleId: 2, permissionIds: [14] }), { status: 400 });
});
