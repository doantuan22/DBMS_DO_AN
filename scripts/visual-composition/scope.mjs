// Compare the original source snapshot without modifying protected source or databases.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { root, read, write } from '../db/lib.mjs';

const allowed = [
  'components/CinemaList.jsx',
  'components/MovieCard.jsx',
  'components/MovieGrid.jsx',
  'components/ProductPicker.jsx',
  'components/ShowtimeBrowser.jsx',
  'features/customer/AuthFrame.jsx',
  'features/customer/BookingExperience.jsx',
  'features/customer/CinemaSchedule.jsx',
  'features/customer/MediaFrame.jsx',
  'features/public/FeaturedBillboard.jsx',
  'features/public/FilmRail.jsx',
  'features/public/HomeSchedule.jsx',
  'features/public/SeatMapPanel.jsx',
  'pages/CinemaDetail.jsx',
  'pages/Cinemas.jsx',
  'pages/Home.jsx',
  'pages/MovieDetail.jsx',
  'pages/Movies.jsx',
  'pages/Orders.jsx',
  'styles/public/public-booking.css',
  'styles/public/public-components.css',
  'styles/public/public-forms.css',
  'styles/public/public-home.css',
  'styles/public/public-shell.css',
  'styles/public/public-tokens.css',
].map((file) => 'frontend/src/' + file);
const baseline = JSON.parse(read(path.join(root, '.audit-output/vcr-source-before.json')));
const compared = Object.entries(baseline).map(([file, before]) => {
  const normalized = file.replaceAll('\\', '/');
  const after = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(root, file)))
    .digest('hex');
  return {
    file: normalized,
    before,
    after,
    changed: before !== after,
    allowed: allowed.includes(normalized),
  };
});
const unexpected = compared.filter((file) => file.changed && !file.allowed);
assert.deepEqual(unexpected, [], 'Protected source changed');
const protectedFiles = compared.filter((file) => !file.allowed);
write(path.join(root, 'docs/uiux/evidence/visual-composition/source-isolation.json'), {
  status: 'PASS',
  baselineFiles: compared.length,
  protectedFileCount: protectedFiles.length,
  protectedUnchanged: true,
  changedPublicFiles: compared.filter((file) => file.changed),
  boundaries: [
    'backend/src',
    'shared',
    'database',
    'auth/context',
    'API/services',
    'router/guards',
    'booking hooks',
    'staff source',
    'global CSS/shared UI defaults',
  ],
  protectedFiles,
});
console.log(
  JSON.stringify({
    status: 'PASS',
    compared: compared.length,
    protected: protectedFiles.length,
    changedPublic: compared.filter((file) => file.changed).length,
  }),
);
