import fs from 'node:fs';
import { query } from '../../../scripts/db/lib.mjs';
const database = 'CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2';
const evidence = { timestamp: new Date().toISOString(), status: 'RUNNING', schemaChanges: false, writes: false };
try {
  evidence.identity = query('SELECT DB_NAME() AS DatabaseName,DB_ID() AS DatabaseID', { database })[0];
  if (evidence.identity?.DatabaseName !== database || evidence.identity.DatabaseID !== 9) throw new Error('Isolated DB identity differs');
  evidence.counts = query('SELECT (SELECT COUNT(*) FROM dbo.BANGGIA) AS PricingRules,(SELECT COUNT(*) FROM dbo.PHIM) AS Movies,(SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM) AS Cinemas,(SELECT COUNT(*) FROM dbo.PHONGCHIEU) AS Rooms,(SELECT COUNT(*) FROM dbo.SUATCHIEU) AS Showtimes', { database })[0];
  evidence.procedures = query("SELECT name FROM sys.procedures WHERE name LIKE 'sp_StaffBooking_%' ORDER BY name", { database });
  evidence.status = 'PASS';
} catch (error) { evidence.status = 'BLOCKED'; evidence.error = error.message; process.exitCode = 1; }
fs.writeFileSync(new URL('./data-preflight.json', import.meta.url), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify(evidence));
