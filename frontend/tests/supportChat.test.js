import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let SupportChatBox;

before(async () => {
  vite = await createServer({
    configFile: 'vite.config.js',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  });
  ({ default: SupportChatBox } = await vite.ssrLoadModule('/src/features/support/SupportChatBox.jsx'));
});

after(async () => {
  await vite?.close();
});

test('support chat exposes its scrollable log to keyboard and assistive technology', () => {
  const html = renderToStaticMarkup(
    React.createElement(SupportChatBox, {
      complaintId: 75,
      assignedStaffId: 9,
      currentUserId: 9,
      canChat: false,
    }),
  );

  assert.match(html, /role="log"/);
  assert.match(html, /aria-label="Tin nhắn trong hội thoại"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /Đang tải tin nhắn/);
  assert.doesNotMatch(html, /style=/);
});
