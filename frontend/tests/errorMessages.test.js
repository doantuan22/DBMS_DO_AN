import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { ERROR_MESSAGES, localizeApiError } from '../src/api/errorMessages.js';

// F-09: every error code the Backend can raise must have Vietnamese text in the browser client.
function* sources(dir) {
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) yield* sources(file);
    else if (name.endsWith('.js')) yield file;
  }
}

test('every HttpError code in the Backend has a Vietnamese message', () => {
  const root = fileURLToPath(new URL('../../backend/src/', import.meta.url));
  const codes = new Set();
  for (const file of sources(root)) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/HttpError\(\s*\d+,\s*'([A-Z][A-Z0-9_]+)'/g))
      codes.add(match[1]);
  }
  assert.ok(codes.size > 80, `expected to discover the backend error codes, found ${codes.size}`);
  const missing = [...codes].filter((code) => !(code in ERROR_MESSAGES));
  assert.deepEqual(missing, [], `codes without Vietnamese text: ${missing.join(', ')}`);
});

test('localization keeps specific Vietnamese server text and replaces English text', () => {
  assert.equal(
    localizeApiError({ code: 'SEAT_CONFLICT', message: 'Ghế X vừa được giữ.', status: 409 }),
    'Ghế X vừa được giữ.',
  );
  assert.equal(
    localizeApiError({
      code: 'PROMOTION_IN_USE',
      message: 'A promotion used in orders cannot be deleted.',
      status: 409,
    }),
    ERROR_MESSAGES.PROMOTION_IN_USE,
  );
  assert.equal(
    localizeApiError({
      code: 'INVALID_PAYMENT_RESULT',
      message: 'status must be Thành công or Thất bại.',
      status: 400,
    }),
    ERROR_MESSAGES.INVALID_PAYMENT_RESULT,
  );
  assert.match(
    localizeApiError({ code: 'SOMETHING_NEW', message: 'English only', status: 409 }),
    /xung đột/,
  );
  assert.equal(
    localizeApiError({ code: 'SOMETHING_NEW', message: 'English only' }),
    'English only',
  );
});

test('every table entry is Vietnamese text', () => {
  const vietnamese = /[àáảãạăâèéẻẽẹêìíỉĩịòóỏõọôơùúủũụưỳýỷỹỵđ]/i;
  const weak = Object.entries(ERROR_MESSAGES).filter(([, text]) => !vietnamese.test(text));
  assert.deepEqual(weak, []);
});
