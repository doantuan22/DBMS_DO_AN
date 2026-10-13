import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CurrentStaffShell from '../src/layouts/StaffShell.jsx';
import { AuthContext } from '../src/context/AuthContext.jsx';
import { ADMIN_SECTION_PERMISSIONS } from '../src/utils/authorization.js';
import '../src/index.css';

const PORTAL_PATHS = { admin: '/admin', manager: '/manager', support: '/support' };
let root;

window.mountStaffShell = async ({ portal, permissions = [], implementation = 'current' }) => {
  root?.unmount();
  root = createRoot(document.getElementById('root'));
  const StaffShell = implementation === 'baseline'
    ? (await import('../src/layouts/StaffShell.before-uxr1c.jsx')).default
    : CurrentStaffShell;
  const user = {
    role: { admin: 'ADMIN', manager: 'QUAN_LY_RAP', support: 'CSKH' }[portal],
    name: 'Test operator',
    permissions: permissions.map((code) => ({ code })),
  };
  const staffPortal = (
    <StaffShell portal={portal}>
      <h1 id="shell-fixture-title">{portal} workspace</h1>
      <section id="support-queue" tabIndex={-1} aria-label="Hàng chờ khiếu nại" />
    </StaffShell>
  );
  root.render(
    <AuthContext.Provider value={{ user, logout() {} }}>
      <MemoryRouter initialEntries={[PORTAL_PATHS[portal]]}>
        <Routes>
          {Object.values(PORTAL_PATHS).map((path) => (
            <Route key={path} path={`${path}/*`} element={staffPortal} />
          ))}
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
};

window.unmountStaffShell = () => {
  root?.unmount();
  root = undefined;
};

window.staffShellTestPermissions = {
  admin: [...new Set(Object.values(ADMIN_SECTION_PERMISSIONS))],
  manager: ['XEM_BAO_CAO_RAP', 'QL_PHONG', 'QL_GHE', 'QL_SUAT_CHIEU', 'QL_BANG_GIA', 'DAT_VE'],
  support: ['QL_KHIEUNAI'],
};
