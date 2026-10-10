import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
let vite, AuthContext, Profile;
before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'));
  ({ default: Profile } = await vite.ssrLoadModule('/src/pages/auth/Profile.jsx'));
});
after(async () => {
  await vite?.close();
});
for (const role of ['KHACH_HANG', 'QUAN_LY_RAP', 'CSKH', 'ADMIN'])
  test(`profile ${role} exposes editable fields belonging to current role`, () => {
    const user = {
      name: 'Profile',
      email: 'profile@example.test',
      role,
      roleName: role,
      phone: null,
      birthday: '1990-02-01',
      gender: 'Nam',
      loyaltyPoints: 23,
    };
    const html = renderToStaticMarkup(
      React.createElement(
        AuthContext.Provider,
        { value: { user, updateProfile: async () => {} } },
        React.createElement(Profile),
      ),
    );
    assert.match(html, /Họ tên/);
    assert.match(html, /type="tel"/);
    assert.match(html, /readOnly=""/);
    if (role === 'KHACH_HANG') {
      assert.match(html, /type="date"/);
      assert.match(html, /Giới tính/);
      assert.match(html, /23 điểm/);
    } else {
      assert.doesNotMatch(html, /type="date"|Giới tính|23 điểm/);
    }
  });
