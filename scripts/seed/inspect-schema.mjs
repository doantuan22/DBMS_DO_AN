import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(root, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const env = dotenv.parse(fs.readFileSync(path.join(root, 'backend', '.env')));
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 120000,
}).connect();
try {
  const procedures = await pool.request().query(`
    SELECT s.name AS [schema], p.name AS procedure_name, prm.parameter_id,
      prm.name AS parameter_name, TYPE_NAME(prm.user_type_id) AS type_name,
      prm.max_length, prm.precision, prm.scale, prm.is_output, prm.has_default_value
    FROM sys.procedures p JOIN sys.schemas s ON s.schema_id=p.schema_id
    JOIN sys.parameters prm ON prm.object_id=p.object_id
    WHERE p.name IN (
      'sp_Admin_User_Create','sp_Auth_RegisterCustomer','sp_Admin_Cinema_Create',
      'sp_Admin_Genre_Create','sp_Admin_Actor_Create','sp_Admin_Movie_Create','sp_Admin_Movie_Update',
      'sp_Admin_MovieActor_Set','sp_Admin_Product_Create','sp_Admin_Promotion_Create',
      'sp_Admin_Assignment_Create','usp_Admin_CinemaImage_Create','usp_Admin_Room_Create',
      'usp_Admin_Seat_Create','usp_Admin_Showtime_Create','usp_Admin_Pricing_Create',
      'sp_Booking_Create','sp_Payment_CreateAttempt','sp_Payment_UpdateResult','sp_Order_Cancel',
      'sp_Complaint_Create','sp_Complaint_Assign_Self','sp_Support_Complaint_AddProcessing','sp_Escalation_Create'
    ) ORDER BY p.name, prm.parameter_id;
  `);
  const columns = await pool.request().query(`
    SELECT t.name AS table_name, c.column_id, c.name AS column_name,
      TYPE_NAME(c.user_type_id) AS type_name, c.max_length, c.is_nullable
    FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id
    WHERE t.name IN ('NGUOIDUNG','VAITRO','QUYEN','VAITRO_QUYEN','RAPCHIEUPHIM','PHONGCHIEU','GHE','LOAIGHE','THELOAI','DIENVIEN','PHIM','PHIM_THELOAI','PHIM_DIENVIEN','SANPHAM','KHUYENMAI','BANGGIA','SUATCHIEU','DONDATVE','CHITIETVE','THANHTOAN','KHIEUNAI','XULY_KHIEUNAI','HOSOKHACHHANG','PHANCONG_RAP')
    ORDER BY t.name,c.column_id;
  `);
  const identity = await pool.request().query('SELECT DB_NAME() AS db_name;');
  const result = { db: identity.recordset[0].db_name, procedures: procedures.recordset, columns: columns.recordset };
  fs.mkdirSync(path.join(root, '.audit-output'), { recursive: true });
  fs.writeFileSync(path.join(root, '.audit-output', 'seed-schema-introspection.json'), JSON.stringify(result, null, 2));
  console.log(`Saved read-only metadata for ${procedures.recordset.length} proc parameters and ${columns.recordset.length} columns (${result.db}).`);
} finally { await pool.close(); }
