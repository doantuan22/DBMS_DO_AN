// Applies migration 20261014 (unified points/discount snapshot) to CinemaBookingDB_Test and re-creates the changed
// database objects from the canonical sources (CREATE OR ALTER). Idempotent.
//   node scripts/audit/apply-migration.mjs
// Target safety: lib.mjs refuses anything but CinemaBookingDB_Test (DB_NAME() is checked) and `sa`.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, assertTestDatabase, connectTestDb } from './lib.mjs';

const DB = path.join(ROOT, 'database');
const MIGRATION = '13_migrations/20261014_points_payment.sql';
// dependency order: table-level migration first, then function → views → procedures
const OBJECTS = [
  '05_functions/fn_TinhTongTienDon.sql',
  '06_views/vw_ChiTietDonDatVe.sql',
  '06_views/vw_LichSuDatVe.sql',
  '06_views/vw_DoanhThuTheoRap.sql',
  '08_procedures/booking/sp_Booking_Create.sql',
  '08_procedures/customer/sp_Order_ExpirePending.sql',
  '08_procedures/customer/sp_Order_Cancel.sql',
  '08_procedures/customer/sp_Order_GetDetailByCustomer.sql',
  '08_procedures/customer/sp_Order_ListByCustomer.sql',
  '08_procedures/system/sp_Showtime_CancelCascade.sql',
  '08_procedures/payment/sp_Payment_CreateAttempt.sql',
  '08_procedures/payment/sp_Payment_UpdateResult.sql',
  '08_procedures/staff_booking/sp_StaffBooking_Cancel.sql',
  '08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql',
  '08_procedures/staff_booking/sp_StaffBooking_Detail.sql',
  '08_procedures/support/sp_Support_Complaint_GetOrderReference.sql',
  '08_procedures/admin/sp_Admin_Dashboard.sql',
  '08_procedures/admin/sp_Admin_Report_Revenue.sql',
  '08_procedures/manager/sp_Manager_Revenue.sql',
];

const { pool, identity } = await connectTestDb();
console.log(`Applying to ${identity.db} as ${identity.login}`);
let batches = 0;
for (const relative of [MIGRATION, ...OBJECTS]) {
  await assertTestDatabase(pool);
  const text = fs.readFileSync(path.join(DB, relative), 'utf8').replace(/^﻿/, '');
  for (const batch of text.split(/^\s*GO\s*$/gim)) {
    if (!batch.trim()) continue;
    try {
      await pool.request().batch(batch);
      batches += 1;
    } catch (error) {
      console.error(`FAILED in ${relative}: ${error.message}`);
      await pool.close();
      process.exit(1);
    }
  }
  console.log(`  applied ${relative}`);
}
await pool.close();
console.log(`OK: ${batches} batches`);
