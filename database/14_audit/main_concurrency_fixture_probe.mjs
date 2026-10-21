// Read-only preflight for approved Main concurrency drills.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(root, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(root, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: configured database is not Main.');
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 60000,
}).connect();
try {
  const target = (await pool.request().query(`SELECT @@SERVERNAME serverName,DB_NAME() databaseName,CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state,@@SPID spid`)).recordset[0];
  if (target.serverName !== 'DoanTuanIT' || target.databaseName !== 'CinemaBookingDB' || target.state !== 'ONLINE') throw new Error(`Wrong target: ${JSON.stringify(target)}`);
  const candidates = (await pool.request().query(`
    SELECT TOP(30) v.SuatChieuID,v.PhimID,v.PhongID,v.RapID,v.ThoiLuong,v.GiaVeCoBan,
           seat.FreeSeatCount,ord.OrderCount,ord.ExpiredPendingCount,
           seat.Seat1,seat.Seat2,seat.Seat3
    FROM dbo.vw_LichChieuChiTiet v
    CROSS APPLY (
      SELECT COUNT(*) AS FreeSeatCount,
             MIN(CASE WHEN rn=1 THEN GheID END) AS Seat1,
             MIN(CASE WHEN rn=2 THEN GheID END) AS Seat2,
             MIN(CASE WHEN rn=3 THEN GheID END) AS Seat3
      FROM (
        SELECT f.GheID,ROW_NUMBER() OVER(ORDER BY f.GheID) rn
        FROM dbo.fn_DanhSachGheSuatChieu(v.SuatChieuID) f
        WHERE f.TrangThaiGhe=N'Trống'
      ) s
    ) seat
    CROSS APPLY (
      SELECT COUNT(*) AS OrderCount,
             SUM(CASE WHEN d.TrangThai=N'Chờ thanh toán' AND (d.HanGiuCho IS NULL OR d.HanGiuCho<=dbo.fn_BayGio()) THEN 1 ELSE 0 END) AS ExpiredPendingCount
      FROM dbo.DONDATVE d WHERE d.SuatChieuID=v.SuatChieuID
    ) ord
    WHERE v.IsBookable=1 AND v.ThoiGianBatDau>=DATEADD(minute,30,dbo.fn_BayGio()) AND seat.FreeSeatCount>=3 AND ord.OrderCount=0
    ORDER BY v.ThoiGianBatDau,v.SuatChieuID
  `)).recordset;
  const activeCustomers = (await pool.request().query(`
    SELECT COUNT(*) AS activeCustomerCount
    FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID
    WHERE r.MaVaiTro='KHACH_HANG' AND u.TrangThai=N'Hoạt động'
  `)).recordset[0].activeCustomerCount;
  let selectedSeatStatus=[];
  if(candidates[0]) selectedSeatStatus=(await pool.request().input('showId',sql.Int,candidates[0].SuatChieuID)
    .input('seat1',sql.Int,candidates[0].Seat1).input('seat2',sql.Int,candidates[0].Seat2).input('seat3',sql.Int,candidates[0].Seat3)
    .query(`SELECT GheID,TrangThaiGhe FROM dbo.fn_DanhSachGheSuatChieu(@showId) WHERE GheID IN(@seat1,@seat2,@seat3) ORDER BY GheID`)).recordset;
  const nonSystemTransactions = (await pool.request().query(`
    SELECT s.session_id,s.program_name,s.login_name,s.host_name,s.login_time,s.last_request_start_time,s.last_request_end_time,
           s.status AS sessionStatus,s.open_transaction_count,at.transaction_begin_time,
           r.status AS requestStatus,r.command,r.wait_type,r.blocking_session_id,st.is_user_transaction
    FROM sys.dm_tran_session_transactions st
    JOIN sys.dm_tran_database_transactions dt ON dt.transaction_id=st.transaction_id
    JOIN sys.dm_tran_active_transactions at ON at.transaction_id=st.transaction_id
    JOIN sys.dm_exec_sessions s ON s.session_id=st.session_id
    LEFT JOIN sys.dm_exec_requests r ON r.session_id=s.session_id
    WHERE dt.database_id=DB_ID() AND s.session_id<>@@SPID AND s.is_user_process=1
  `)).recordset;
  const result = { target, activeCustomerCount: activeCustomers, candidateCount: candidates.length, candidates, selectedSeatStatus, otherOpenTransactions: nonSystemTransactions, safeToProceed: candidates.length>0 && activeCustomers>0 && nonSystemTransactions.length===0 };
  const out = path.join(root,'.audit-output','main-concurrency-fixture-probe.json');
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2));
  console.log(JSON.stringify({ target,activeCustomerCount:activeCustomers,candidateCount:candidates.length,first:candidates[0]??null,selectedSeatStatus,otherOpenTransactions:nonSystemTransactions.length,safeToProceed:result.safeToProceed,evidence:path.relative(root,out) },null,2));
  if (!result.safeToProceed) process.exitCode=2;
} finally { await pool.close(); }
