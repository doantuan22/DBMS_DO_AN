// Exercises assignment, cinema image, room, seat, pricing and showtime writers
// on exact Main inside a caller-owned transaction; all writes are rolled back.
// SQL Server identity sequences are non-transactional and may advance.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const sql = require('mssql');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync(path.join(ROOT, 'backend', '.env')));
if (env.DB_DATABASE !== 'CinemaBookingDB') throw new Error('Refusing: backend config does not target exact Main.');
const OUT = path.join(ROOT, '.audit-output', 'main-facility-schedule-success-smoke.json');
const restore = JSON.parse(fs.readFileSync(path.join(ROOT, '.audit-output', 'main-migration-restore-clone-drill.json'), 'utf8'));
const BACKUP = path.join(ROOT, restore.backup);
if (!fs.existsSync(BACKUP)) throw new Error(`Verified Main backup missing: ${BACKUP}`);
const token = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
const pool = await new sql.ConnectionPool({
  server: env.DB_SERVER, port: Number(env.DB_PORT ?? 1433), database: env.DB_DATABASE,
  user: env.DB_USER, password: env.DB_PASSWORD,
  options: { encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true', trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true', useUTC: true },
  requestTimeout: 240000, pool: { max: 1, min: 1, idleTimeoutMillis: 30000 },
}).connect();
const ev = { startedUtc: new Date().toISOString(), target: null, backup: path.relative(ROOT, BACKUP), fixtureToken: token, tests: [], verdict: 'BLOCKED' };
async function identity() {
  const x = (await pool.request().query(`SELECT @@SERVERNAME serverName, DB_NAME() databaseName, CONVERT(nvarchar(30),DATABASEPROPERTYEX(DB_NAME(),'Status')) state`)).recordset[0];
  if (x.serverName !== 'DoanTuanIT' || x.databaseName !== 'CinemaBookingDB' || x.state !== 'ONLINE') throw new Error(`Wrong target: ${JSON.stringify(x)}`);
  return x;
}
async function fingerprint() {
  const id = await identity();
  const tables = (await pool.request().query(`
    SELECT t.object_id, QUOTENAME(s.name)+'.'+QUOTENAME(t.name) qualifiedName,
      COALESCE((SELECT STRING_AGG(QUOTENAME(c.name),',') WITHIN GROUP(ORDER BY ic.key_ordinal)
        FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
        JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id WHERE i.object_id=t.object_id AND i.is_primary_key=1),
        (SELECT STRING_AGG(QUOTENAME(c.name),',') WITHIN GROUP(ORDER BY c.column_id) FROM sys.columns c WHERE c.object_id=t.object_id)) sortColumns
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE t.is_ms_shipped=0 ORDER BY t.object_id;`)).recordset;
  const rows = [];
  for (const t of tables) {
    const data = (await pool.request().query(`SELECT * FROM ${t.qualifiedName} ORDER BY ${t.sortColumns};`)).recordset;
    const json = JSON.stringify(data, (k,v) => Buffer.isBuffer(v) ? v.toString('base64') : v);
    rows.push({ table: t.qualifiedName, count: data.length, sha256: createHash('sha256').update(json).digest('hex') });
  }
  const identities = (await pool.request().query(`SELECT OBJECT_SCHEMA_NAME(object_id) schemaName, OBJECT_NAME(object_id) tableName, name columnName,
    CONVERT(varchar(80),IDENT_CURRENT(QUOTENAME(OBJECT_SCHEMA_NAME(object_id))+'.'+QUOTENAME(OBJECT_NAME(object_id)))) identityValue
    FROM sys.identity_columns ORDER BY object_id,column_id;`)).recordset;
  return { id, rows, identities };
}
function add(name, input, expected, actual, pass) {
  ev.tests.push({ name, input, expected, actual, verdict: pass ? 'PASS' : 'FAIL' });
  if (!pass) throw new Error(`${name}: expected ${JSON.stringify(expected)} actual ${JSON.stringify(actual)}`);
}
async function exec(tx, name, params = []) {
  const r = tx.request(); for (const [k,t,v] of params) r.input(k,t,v);
  return r.execute(`dbo.${name}`);
}
function first(x) { return (x.recordsets ?? []).flat().find(v => v && typeof v === 'object') ?? null; }
function dateAt(dayOffset, hour, minute = 0) {
  const d = new Date(); d.setUTCDate(d.getUTCDate()+dayOffset); d.setUTCHours(hour,minute,0,0); return d;
}
function dateOnly(dayOffset) { const d = new Date(); d.setUTCDate(d.getUTCDate()+dayOffset); d.setUTCHours(0,0,0,0); return d; }

try {
  ev.before = await fingerprint(); ev.target = ev.before.id;
  await pool.request().query(`RESTORE VERIFYONLY FROM DISK=N'${BACKUP.replaceAll("'", "''")}' WITH CHECKSUM;`);
  const admin = (await pool.request().query(`SELECT TOP(1) u.NguoiDungID id FROM dbo.NGUOIDUNG u JOIN dbo.VAITRO r ON r.VaiTroID=u.VaiTroID WHERE r.MaVaiTro='ADMIN' AND u.TrangThai=N'Hoạt động' ORDER BY u.NguoiDungID;`)).recordset[0]?.id;
  const managerRole = (await pool.request().query(`SELECT VaiTroID id FROM dbo.VAITRO WHERE MaVaiTro='QUAN_LY_RAP';`)).recordset[0]?.id;
  if (!admin || !managerRole) throw new Error('Active Admin or QUAN_LY_RAP role fixture not found.');
  ev.fixture = { adminID: admin, managerRoleID: managerRole };
  const tx = new sql.Transaction(pool); await tx.begin(sql.ISOLATION_LEVEL.READ_COMMITTED);
  try {
    const cr = await exec(tx, 'sp_Admin_Cinema_Create', [
      ['ActorID',sql.Int,admin],['TenRap',sql.NVarChar(150),`Audit Facility ${token}`],['DiaChi',sql.NVarChar(255),'9 Audit Way'],['ThanhPho',sql.NVarChar(100),'Hanoi'],['SoDienThoai',sql.VarChar(20),null],['MoTa',sql.NVarChar(500),'rollback facility fixture'],['NgayHoatDong',sql.Date,dateOnly(1)]]);
    const cinema=first(cr), cinemaID=Number(cinema?.RapID);
    add('sp_Admin_Cinema_Create','new test cinema is returned active',{RapID:cinemaID,TrangThai:'Hoạt động'},cinema,cinemaID>0&&cinema?.TenRap===`Audit Facility ${token}`&&cinema?.TrangThai==='Hoạt động');
    const ur=await exec(tx,'sp_Admin_User_Create',[
      ['ActorID',sql.Int,admin],['HoTen',sql.NVarChar(100),`Audit Manager ${token}`],['Email',sql.VarChar(150),`facility-${token.toLowerCase()}@invalid.example`],['MatKhauHash',sql.VarChar(255),'AUDIT-ROLLBACK-HASH'],['SoDienThoai',sql.VarChar(20),null],['VaiTroID',sql.Int,managerRole]]);
    const manager=first(ur), managerID=Number(manager?.NguoiDungID);
    add('sp_Admin_User_Create_manager_fixture','unique active manager fixture created',{MaVaiTro:'QUAN_LY_RAP',TrangThai:'Hoạt động'},manager,managerID>0&&manager?.MaVaiTro==='QUAN_LY_RAP'&&manager?.TrangThai==='Hoạt động');
    const assign=await exec(tx,'sp_PhanCongQuanLyRap',[
      ['ActorID',sql.Int,admin],['NguoiDungID',sql.Int,managerID],['RapID',sql.Int,cinemaID],['NgayBatDau',sql.Date,dateOnly(0)],['NgayKetThuc',sql.Date,null]]);
    const assignment=first(assign), assignmentID=Number(assignment?.PhanCongID);
    add('sp_PhanCongQuanLyRap','manager assigned to fixture cinema via system alias',{NguoiDungID:managerID,RapID:cinemaID,TrangThai:'Hiệu lực'},assignment,assignmentID>0&&Number(assignment?.NguoiDungID)===managerID&&Number(assignment?.RapID)===cinemaID&&assignment?.TrangThai==='Hiệu lực');
    const assUpdate=await exec(tx,'usp_Admin_Assignment_Update',[
      ['ActorID',sql.Int,admin],['PhanCongID',sql.Int,assignmentID],['NguoiDungID',sql.Int,managerID],['RapID',sql.Int,cinemaID],['NgayBatDau',sql.Date,dateOnly(0)],['NgayKetThuc',sql.Date,dateOnly(30)],['TrangThai',sql.NVarChar(50),'Hiệu lực']]);
    const au=first(assUpdate);
    add('usp_Admin_Assignment_Update','assignment end date changed and row still effective',{PhanCongID:assignmentID,TrangThai:'Hiệu lực'},au,Number(au?.PhanCongID)===assignmentID&&au?.TrangThai==='Hiệu lực');

    const adminRoomR=await exec(tx,'usp_Admin_Room_Create',[['ActorID',sql.Int,admin],['RapID',sql.Int,cinemaID],['TenPhong',sql.NVarChar(100),`AdminRoom${token}`],['LoaiPhong',sql.NVarChar(50),'2D']]);
    const adminRoom=first(adminRoomR), adminRoomID=Number(adminRoom?.PhongID);
    add('usp_Admin_Room_Create','admin room created under fixture cinema',{RapID:cinemaID,LoaiPhong:'2D'},adminRoom,adminRoomID>0&&Number(adminRoom?.RapID)===cinemaID&&adminRoom?.LoaiPhong==='2D');
    const aru=await exec(tx,'usp_Admin_Room_Update',[['ActorID',sql.Int,admin],['PhongID',sql.Int,adminRoomID],['TenPhong',sql.NVarChar(100),`AdminRoomU${token}`],['LoaiPhong',sql.NVarChar(50),'3D'],['TrangThai',sql.NVarChar(50),'Hoạt động']]);
    const adminRoomU=first(aru);
    add('usp_Admin_Room_Update','room attributes updated',{PhongID:adminRoomID,LoaiPhong:'3D'},adminRoomU,Number(adminRoomU?.PhongID)===adminRoomID&&adminRoomU?.LoaiPhong==='3D'&&adminRoomU?.TenPhong===`AdminRoomU${token}`);
    const managerRoomR=await exec(tx,'sp_Manager_Room_Create',[['NguoiDungID',sql.Int,managerID],['RapID',sql.Int,cinemaID],['TenPhong',sql.NVarChar(100),`MgrRoom${token}`],['LoaiPhong',sql.NVarChar(50),'2D']]);
    const managerRoom=first(managerRoomR), managerRoomID=Number(managerRoom?.PhongID);
    add('sp_Manager_Room_Create','assigned manager creates room inside assigned cinema',{RapID:cinemaID,TrangThai:'Hoạt động'},managerRoom,managerRoomID>0&&Number(managerRoom?.RapID)===cinemaID&&managerRoom?.TrangThai==='Hoạt động');
    const mru=await exec(tx,'sp_Manager_Room_Update',[['NguoiDungID',sql.Int,managerID],['PhongID',sql.Int,managerRoomID],['TenPhong',sql.NVarChar(100),`MgrRoomU${token}`],['LoaiPhong',sql.NVarChar(50),'IMAX'],['TrangThai',sql.NVarChar(50),'Hoạt động']]);
    const managerRoomU=first(mru);
    add('sp_Manager_Room_Update','assigned manager updates room type/name',{PhongID:managerRoomID,LoaiPhong:'IMAX'},managerRoomU,Number(managerRoomU?.PhongID)===managerRoomID&&managerRoomU?.LoaiPhong==='IMAX'&&managerRoomU?.TenPhong===`MgrRoomU${token}`);
    const batch=await exec(tx,'sp_Manager_Seat_BatchCreate',[['NguoiDungID',sql.Int,managerID],['PhongID',sql.Int,managerRoomID],['NumRows',sql.Int,2],['SeatsPerRow',sql.Int,3],['VipRows',sql.Int,0]]);
    const batchRow=first(batch);
    add('sp_Manager_Seat_BatchCreate','2 rows x 3 seats are created with a total count of six',{PhongID:managerRoomID,TongSoGheTao:6},batchRow,Number(batchRow?.PhongID)===managerRoomID&&Number(batchRow?.TongSoGheTao)===6);
    const managerSeatR=await exec(tx,'sp_Manager_Seat_Create',[['NguoiDungID',sql.Int,managerID],['PhongID',sql.Int,managerRoomID],['HangGhe',sql.VarChar(10),'C'],['SoGhe',sql.Int,9],['LoaiGhe',sql.NVarChar(50),'Thường']]);
    const managerSeat=first(managerSeatR), managerSeatID=Number(managerSeat?.GheID);
    add('sp_Manager_Seat_Create','seat created in assigned room',{HangGhe:'C',SoGhe:9,TrangThai:'Hoạt động'},managerSeat,managerSeatID>0&&managerSeat?.HangGhe==='C'&&Number(managerSeat?.SoGhe)===9&&managerSeat?.TrangThai==='Hoạt động');
    const msu=await exec(tx,'sp_Manager_Seat_Update',[['NguoiDungID',sql.Int,managerID],['GheID',sql.Int,managerSeatID],['LoaiGhe',sql.NVarChar(50),'VIP'],['TrangThai',sql.NVarChar(50),'Hoạt động']]);
    const managerSeatU=first(msu);
    add('sp_Manager_Seat_Update','unbooked seat type changes to VIP',{GheID:managerSeatID,LoaiGhe:'VIP'},managerSeatU,Number(managerSeatU?.GheID)===managerSeatID&&managerSeatU?.LoaiGhe==='VIP');
    await exec(tx,'sp_Manager_Seat_Delete',[['NguoiDungID',sql.Int,managerID],['GheID',sql.Int,managerSeatID]]);
    const managerSeatGone=(await tx.request().input('id',sql.Int,managerSeatID).query('SELECT COUNT(*) c FROM dbo.GHE WHERE GheID=@id')).recordset[0].c;
    add('sp_Manager_Seat_Delete','unused manager seat is deleted',0,managerSeatGone,Number(managerSeatGone)===0);
    const adminSeatR=await exec(tx,'usp_Admin_Seat_Create',[['ActorID',sql.Int,admin],['PhongID',sql.Int,adminRoomID],['HangGhe',sql.VarChar(10),'Z'],['SoGhe',sql.Int,1],['LoaiGhe',sql.NVarChar(50),'Thường']]);
    const adminSeat=first(adminSeatR), adminSeatID=Number(adminSeat?.GheID);
    add('usp_Admin_Seat_Create','admin creates seat in admin room',{HangGhe:'Z',SoGhe:1},adminSeat,adminSeatID>0&&adminSeat?.HangGhe==='Z'&&Number(adminSeat?.SoGhe)===1);
    const asu=await exec(tx,'usp_Admin_Seat_Update',[['ActorID',sql.Int,admin],['GheID',sql.Int,adminSeatID],['LoaiGhe',sql.NVarChar(50),'VIP'],['TrangThai',sql.NVarChar(50),'Bảo trì']]);
    const adminSeatU=first(asu);
    add('usp_Admin_Seat_Update','admin changes seat type and operational status',{GheID:adminSeatID,LoaiGhe:'VIP',TrangThai:'Bảo trì'},adminSeatU,Number(adminSeatU?.GheID)===adminSeatID&&adminSeatU?.LoaiGhe==='VIP'&&adminSeatU?.TrangThai==='Bảo trì');
    await exec(tx,'usp_Admin_Seat_Delete',[['ActorID',sql.Int,admin],['GheID',sql.Int,adminSeatID]]);
    const adminSeatGone=(await tx.request().input('id',sql.Int,adminSeatID).query('SELECT COUNT(*) c FROM dbo.GHE WHERE GheID=@id')).recordset[0].c;
    add('usp_Admin_Seat_Delete','unbooked admin seat is deleted',0,adminSeatGone,Number(adminSeatGone)===0);

    // Only the two images created by this fixture are modified; first assert cover uniqueness after each path.
    async function makeImage(label,isCover,order) {
      const r=await exec(tx,'usp_Admin_CinemaImage_Create',[['ActorID',sql.Int,admin],['RapID',sql.Int,cinemaID],['URL',sql.NVarChar(500),`https://audit.invalid/${token}/${label}.jpg`],['MoTa',sql.NVarChar(255),label],['LaAnhDaiDien',sql.Bit,isCover],['ThuTuHienThi',sql.Int,order],['TrangThai',sql.NVarChar(50),'Hoạt động']]); return first(r);
    }
    const img1=await makeImage('cover-a',true,1), img1ID=Number(img1?.HinhAnhRapID);
    add('usp_Admin_CinemaImage_Create_first_cover','first image is active cover',{RapID:cinemaID,LaAnhDaiDien:true},img1,img1ID>0&&Number(img1?.RapID)===cinemaID&&img1?.LaAnhDaiDien===true);
    const img2=await makeImage('cover-b',true,2), img2ID=Number(img2?.HinhAnhRapID);
    const coverCount1=(await tx.request().input('rap',sql.Int,cinemaID).query('SELECT COUNT(*) c FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@rap AND LaAnhDaiDien=1')).recordset[0].c;
    add('usp_Admin_CinemaImage_Create_replace_cover','new cover atomically replaces previous cover',{coverCount:1,coverID:img2ID}, {row:img2,coverCount:Number(coverCount1)},img2ID>0&&img2?.LaAnhDaiDien===true&&Number(coverCount1)===1);
    const setCover=await exec(tx,'usp_Admin_CinemaImage_SetCover',[['ActorID',sql.Int,admin],['RapID',sql.Int,cinemaID],['HinhAnhRapID',sql.Int,img1ID]]);
    const setCoverRow=first(setCover), coverCheck=(await tx.request().input('rap',sql.Int,cinemaID).query('SELECT HinhAnhRapID FROM dbo.HINHANH_RAPCHIEUPHIM WHERE RapID=@rap AND LaAnhDaiDien=1')).recordset[0]?.HinhAnhRapID;
    add('usp_Admin_CinemaImage_SetCover','cover changes to first image and returns its DTO',{coverID:img1ID}, {row:setCoverRow,actualCoverID:coverCheck},Number(coverCheck)===img1ID&&Number(setCoverRow?.HinhAnhRapID)===img1ID&&setCoverRow?.LaAnhDaiDien===true);
    const imgUpdate=await exec(tx,'usp_Admin_CinemaImage_Update',[['ActorID',sql.Int,admin],['RapID',sql.Int,cinemaID],['HinhAnhRapID',sql.Int,img1ID],['URL',sql.NVarChar(500),`https://audit.invalid/${token}/cover-a-updated.jpg`],['MoTa',sql.NVarChar(255),'updated cover'],['ThuTuHienThi',sql.Int,3],['TrangThai',sql.NVarChar(50),'Tạm ẩn']]);
    const imageUpdated=first(imgUpdate);
    add('usp_Admin_CinemaImage_Update_disable_cover','updated image disables and clears the cover flag',{HinhAnhRapID:img1ID,TrangThai:'Tạm ẩn',LaAnhDaiDien:false},imageUpdated,Number(imageUpdated?.HinhAnhRapID)===img1ID&&imageUpdated?.TrangThai==='Tạm ẩn'&&imageUpdated?.LaAnhDaiDien===false);
    const imgBack=await exec(tx,'usp_Admin_CinemaImage_Update',[['ActorID',sql.Int,admin],['RapID',sql.Int,cinemaID],['HinhAnhRapID',sql.Int,img1ID],['URL',sql.NVarChar(500),`https://audit.invalid/${token}/cover-a-updated.jpg`],['MoTa',sql.NVarChar(255),'updated cover'],['ThuTuHienThi',sql.Int,3],['TrangThai',sql.NVarChar(50),'Hoạt động']]);
    add('usp_Admin_CinemaImage_Update_reactivate','reactivation does not silently restore cover',{HinhAnhRapID:img1ID,LaAnhDaiDien:false},first(imgBack),Number(first(imgBack)?.HinhAnhRapID)===img1ID&&first(imgBack)?.LaAnhDaiDien===false);
    for (const [label,id] of [['first',img1ID],['second',img2ID]]) {
      await exec(tx,'usp_Admin_CinemaImage_Delete',[['ActorID',sql.Int,admin],['RapID',sql.Int,cinemaID],['HinhAnhRapID',sql.Int,id]]);
      const gone=(await tx.request().input('id',sql.Int,id).query('SELECT COUNT(*) c FROM dbo.HINHANH_RAPCHIEUPHIM WHERE HinhAnhRapID=@id')).recordset[0].c;
      add(`usp_Admin_CinemaImage_Delete_${label}`,'fixture image is deleted',0,gone,Number(gone)===0);
    }

    const priceStart=dateOnly(10), priceEnd=dateOnly(40);
    const adminPriceR=await exec(tx,'usp_Admin_Pricing_Create',[['ActorID',sql.Int,admin],['RapID',sql.Int,cinemaID],['LoaiGhe',sql.NVarChar(50),'Thường'],['LoaiNgay',sql.NVarChar(50),'Ngày thường'],['DinhDang',sql.NVarChar(50),'2D'],['PhuThu',sql.Decimal(18,2),1250],['NgayBatDau',sql.Date,priceStart],['NgayKetThuc',sql.Date,priceEnd]]);
    const adminPrice=first(adminPriceR), adminPriceID=Number(adminPrice?.GiaID);
    add('usp_Admin_Pricing_Create','admin pricing rule created with requested conditions',{RapID:cinemaID,PhuThu:1250,TrangThai:'Áp dụng'},adminPrice,adminPriceID>0&&Number(adminPrice?.RapID)===cinemaID&&Number(adminPrice?.PhuThu)===1250&&adminPrice?.TrangThai==='Áp dụng');
    const adminPriceU=await exec(tx,'usp_Admin_Pricing_Update',[['ActorID',sql.Int,admin],['GiaID',sql.Int,adminPriceID],['PhuThu',sql.Decimal(18,2),2000],['TrangThai',sql.NVarChar(50),'Áp dụng'],['LoaiGhe',sql.NVarChar(50),'VIP'],['LoaiNgay',sql.NVarChar(50),'Cuối tuần'],['DinhDang',sql.NVarChar(50),'3D'],['NgayBatDau',sql.Date,priceStart],['NgayKetThuc',sql.Date,priceEnd],['CapNhatDieuKien',sql.Bit,true]]);
    const apu=first(adminPriceU);
    add('usp_Admin_Pricing_Update','admin updates conditions and surcharge',{GiaID:adminPriceID,LoaiGhe:'VIP',DinhDang:'3D',PhuThu:2000},apu,Number(apu?.GiaID)===adminPriceID&&apu?.LoaiGhe==='VIP'&&apu?.DinhDang==='3D'&&Number(apu?.PhuThu)===2000);
    const mgrPriceR=await exec(tx,'sp_Manager_Pricing_Create',[['NguoiDungID',sql.Int,managerID],['RapID',sql.Int,cinemaID],['LoaiGhe',sql.NVarChar(50),'Đôi'],['LoaiNgay',sql.NVarChar(50),'Cuối tuần'],['DinhDang',sql.NVarChar(50),'2D'],['PhuThu',sql.Decimal(18,2),3000],['NgayBatDau',sql.Date,priceStart],['NgayKetThuc',sql.Date,priceEnd]]);
    const mgrPrice=first(mgrPriceR), mgrPriceID=Number(mgrPrice?.GiaID);
    add('sp_Manager_Pricing_Create','assigned manager creates pricing inside its cinema scope',{RapID:cinemaID,LoaiGhe:'Đôi',PhuThu:3000},mgrPrice,mgrPriceID>0&&Number(mgrPrice?.RapID)===cinemaID&&mgrPrice?.LoaiGhe==='Đôi'&&Number(mgrPrice?.PhuThu)===3000);
    const mgrPriceU=await exec(tx,'sp_Manager_Pricing_Update',[['NguoiDungID',sql.Int,managerID],['GiaID',sql.Int,mgrPriceID],['PhuThu',sql.Decimal(18,2),3500],['TrangThai',sql.NVarChar(50),'Áp dụng'],['LoaiGhe',sql.NVarChar(50),'Sweetbox'],['LoaiNgay',sql.NVarChar(50),'Cuối tuần'],['DinhDang',sql.NVarChar(50),'2D'],['NgayBatDau',sql.Date,priceStart],['NgayKetThuc',sql.Date,priceEnd],['CapNhatDieuKien',sql.Bit,true]]);
    const mpu=first(mgrPriceU);
    add('sp_Manager_Pricing_Update','manager changes scoped pricing rule',{GiaID:mgrPriceID,LoaiGhe:'Sweetbox',PhuThu:3500},mpu,Number(mpu?.GiaID)===mgrPriceID&&mpu?.LoaiGhe==='Sweetbox'&&Number(mpu?.PhuThu)===3500);

    // Create one movie and exercise admin, manager and legacy alias showtime paths.
    const filmStart=dateOnly(6), filmEnd=dateOnly(45);
    const filmReq=tx.request();
    filmReq.input('ActorID',sql.Int,admin).input('TenPhim',sql.NVarChar(255),`Audit Schedule Film ${token}`).input('ThoiLuong',sql.Int,90)
      .input('NgayKhoiChieu',sql.Date,filmStart).input('NgayKetThuc',sql.Date,filmEnd).input('NgonNgu',sql.NVarChar(100),'Vietnamese')
      .input('PhuDe',sql.NVarChar(100),'English').input('DoTuoi',sql.NVarChar(20),'P').input('DaoDien',sql.NVarChar(150),'Audit Director')
      .input('MoTa',sql.NVarChar(sql.MAX),'rollback schedule fixture').input('PosterURL',sql.NVarChar(500),null).input('TrailerURL',sql.NVarChar(500),null)
      .input('TheLoaiIdList',sql.VarChar(sql.MAX),null).output('NewPhimID',sql.Int);
    const filmResult=await filmReq.execute('dbo.sp_Admin_Movie_Create'), filmID=Number(filmResult.output?.NewPhimID);
    add('sp_Admin_Movie_Create_schedule_fixture','movie creation returns ID for future showtime fixture',{positiveID:true}, {PhimID:filmID,detailRows:(filmResult.recordsets??[]).map(s=>s.length)},filmID>0);
    const rooms=[adminRoomID,managerRoomID];
    const times=[dateAt(7,17),dateAt(7,20),dateAt(7,23),dateAt(8,17)];
    const endAt=(d)=>new Date(d.getTime()+90*60000);
    const adminShow=await exec(tx,'usp_Admin_Showtime_Create',[['ActorID',sql.Int,admin],['PhimID',sql.Int,filmID],['PhongID',sql.Int,rooms[0]],['ThoiGianBatDau',sql.DateTime2(0),times[0]],['ThoiGianKetThuc',sql.DateTime2(0),endAt(times[0])],['DinhDang',sql.NVarChar(50),'2D'],['GiaVeCoBan',sql.Decimal(18,2),120000]]);
    const adminShowRow=first(adminShow), adminShowID=Number(adminShowRow?.SuatChieuID);
    add('usp_Admin_Showtime_Create','admin creates bookable showtime and receives detail row',{PhongID:rooms[0],TrangThaiSuatChieu:'Mở bán'},adminShowRow,adminShowID>0&&Number(adminShowRow?.PhongID)===rooms[0]&&adminShowRow?.TrangThaiSuatChieu==='Mở bán');
    const adminShowU=await exec(tx,'usp_Admin_Showtime_Update',[['ActorID',sql.Int,admin],['SuatChieuID',sql.Int,adminShowID],['PhimID',sql.Int,filmID],['ThoiGianBatDau',sql.DateTime2(0),new Date(times[0].getTime()+30*60000)],['ThoiGianKetThuc',sql.DateTime2(0),new Date(endAt(times[0]).getTime()+30*60000)],['DinhDang',sql.NVarChar(50),'2D'],['GiaVeCoBan',sql.Decimal(18,2),125000],['TrangThai',sql.NVarChar(50),'Mở bán']]);
    const ashowU=first(adminShowU);
    add('usp_Admin_Showtime_Update','admin changes time and price without overlap',{SuatChieuID:adminShowID,GiaVeCoBan:125000},ashowU,Number(ashowU?.SuatChieuID)===adminShowID&&Number(ashowU?.GiaVeCoBan)===125000);
    const managerShow=await exec(tx,'sp_Manager_Showtime_Create',[['NguoiDungID',sql.Int,managerID],['PhimID',sql.Int,filmID],['PhongID',sql.Int,rooms[1]],['ThoiGianBatDau',sql.DateTime2(0),times[1]],['ThoiGianKetThuc',sql.DateTime2(0),endAt(times[1])],['DinhDang',sql.NVarChar(50),'2D'],['GiaVeCoBan',sql.Decimal(18,2),130000]]);
    const managerShowRow=first(managerShow), managerShowID=Number(managerShowRow?.SuatChieuID);
    add('sp_Manager_Showtime_Create','assigned manager creates showtime in its room scope',{PhongID:rooms[1],TrangThaiSuatChieu:'Mở bán'},managerShowRow,managerShowID>0&&Number(managerShowRow?.PhongID)===rooms[1]&&managerShowRow?.TrangThaiSuatChieu==='Mở bán');
    const managerShowU=await exec(tx,'sp_Manager_Showtime_Update',[['NguoiDungID',sql.Int,managerID],['SuatChieuID',sql.Int,managerShowID],['PhimID',sql.Int,filmID],['ThoiGianBatDau',sql.DateTime2(0),new Date(times[1].getTime()+30*60000)],['ThoiGianKetThuc',sql.DateTime2(0),new Date(endAt(times[1]).getTime()+30*60000)],['DinhDang',sql.NVarChar(50),'2D'],['GiaVeCoBan',sql.Decimal(18,2),135000],['TrangThai',sql.NVarChar(50),'Mở bán']]);
    const mshowU=first(managerShowU);
    add('sp_Manager_Showtime_Update','manager changes showtime within room scope',{SuatChieuID:managerShowID,GiaVeCoBan:135000},mshowU,Number(mshowU?.SuatChieuID)===managerShowID&&Number(mshowU?.GiaVeCoBan)===135000);
    const aliasShow=await exec(tx,'sp_ThemSuatChieu',[['NguoiDungID',sql.Int,managerID],['PhimID',sql.Int,filmID],['PhongID',sql.Int,rooms[0]],['ThoiGianBatDau',sql.DateTime2(0),times[2]],['ThoiGianKetThuc',sql.DateTime2(0),endAt(times[2])],['DinhDang',sql.NVarChar(50),'2D'],['GiaVeCoBan',sql.Decimal(18,2),140000]]);
    const aliasShowRow=first(aliasShow), aliasShowID=Number(aliasShowRow?.SuatChieuID);
    add('sp_ThemSuatChieu','legacy alias delegates to manager create and returns detail',{PhongID:rooms[0],GiaVeCoBan:140000},aliasShowRow,aliasShowID>0&&Number(aliasShowRow?.PhongID)===rooms[0]&&Number(aliasShowRow?.GiaVeCoBan)===140000);
    await exec(tx,'sp_Manager_Showtime_Cancel',[['NguoiDungID',sql.Int,managerID],['SuatChieuID',sql.Int,managerShowID],['LyDo',sql.NVarChar(255),'audit rollback cancel']]);
    const managerCancelled=(await tx.request().input('id',sql.Int,managerShowID).query('SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID=@id')).recordset[0]?.TrangThai;
    add('sp_Manager_Showtime_Cancel','manager cancellation persists cancelled status and cascades with zero orders','Đã hủy',managerCancelled,managerCancelled==='Đã hủy');
    const adminCancel=await exec(tx,'usp_Admin_Showtime_Cancel',[['ActorID',sql.Int,admin],['SuatChieuID',sql.Int,adminShowID]]);
    const adminCancelled=(await tx.request().input('id',sql.Int,adminShowID).query('SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID=@id')).recordset[0]?.TrangThai;
    add('usp_Admin_Showtime_Cancel','admin cancellation delegates to cascade and updates showtime','Đã hủy',{message:first(adminCancel),status:adminCancelled},adminCancelled==='Đã hủy');
    const directCancel=await exec(tx,'sp_Showtime_CancelCascade',[['SuatChieuID',sql.Int,aliasShowID],['NguoiDungID',sql.Int,managerID],['LyDo',sql.NVarChar(255),'direct cascade audit']]);
    const directStatus=(await tx.request().input('id',sql.Int,aliasShowID).query('SELECT TrangThai FROM dbo.SUATCHIEU WHERE SuatChieuID=@id')).recordset[0]?.TrangThai;
    add('sp_Showtime_CancelCascade_direct','direct cascade records cancellation and returns zero canceled orders',{status:'Đã hủy'}, {result:first(directCancel),status:directStatus},directStatus==='Đã hủy');

    await exec(tx,'sp_Manager_Room_Delete',[['NguoiDungID',sql.Int,managerID],['PhongID',sql.Int,managerRoomID]]);
    const managerRoomAfter=(await tx.request().input('id',sql.Int,managerRoomID).query('SELECT TrangThai FROM dbo.PHONGCHIEU WHERE PhongID=@id')).recordset[0]?.TrangThai;
    add('sp_Manager_Room_Delete_with_showtime_history','manager room with showtime history is deactivated, not deleted','Ngưng hoạt động',managerRoomAfter,managerRoomAfter==='Ngưng hoạt động');
    await exec(tx,'usp_Admin_Room_Delete',[['ActorID',sql.Int,admin],['PhongID',sql.Int,adminRoomID]]);
    const adminRoomAfter=(await tx.request().input('id',sql.Int,adminRoomID).query('SELECT COUNT(*) c FROM dbo.PHONGCHIEU WHERE PhongID=@id')).recordset[0].c;
    add('usp_Admin_Room_Delete_with_showtime_history','admin room with showtime history is deactivated rather than physically deleted','Ngưng hoạt động',adminRoomAfter,Number(adminRoomAfter)===1&&(await tx.request().input('id',sql.Int,adminRoomID).query('SELECT TrangThai FROM dbo.PHONGCHIEU WHERE PhongID=@id')).recordset[0]?.TrangThai==='Ngưng hoạt động');
    await tx.rollback(); ev.transaction={rolledBack:true,outerTransactionCountReturnedToZero:true};
  } catch(e) { try{await tx.rollback();}catch{} throw e; }
  ev.after=await fingerprint();
  const rowsSame=JSON.stringify(ev.before.rows)===JSON.stringify(ev.after.rows);
  const violations=(await pool.request().query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;')).recordsets.flat();
  const dbccRows=(await pool.request().query(`DBCC CHECKDB (N'CinemaBookingDB') WITH NO_INFOMSGS,ALL_ERRORMSGS;`)).recordsets.flat();
  const identityGaps=ev.after.identities.filter(x=>ev.before.identities.find(p=>p.schemaName===x.schemaName&&p.tableName===x.tableName&&p.columnName===x.columnName)?.identityValue!==x.identityValue).map(x=>({table:`${x.schemaName}.${x.tableName}`,column:x.columnName,before:ev.before.identities.find(p=>p.schemaName===x.schemaName&&p.tableName===x.tableName&&p.columnName===x.columnName)?.identityValue,after:x.identityValue}));
  const pass=rowsSame&&violations.length===0&&dbccRows.length===0;
  ev.tests.push({name:'post_rollback_full_row_fingerprint_and_integrity',input:'all persistent tables; DBCC CHECKCONSTRAINTS and CHECKDB',expected:'all persistent row content unchanged; no integrity findings; identity gaps recorded',actual:{rowsSame,identityGaps,constraintViolations:violations.length,dbccFindings:dbccRows.length},verdict:pass?'PASS':'FAIL'});
  ev.verdict=pass&&ev.tests.every(x=>x.verdict==='PASS')?'PASS':'FAIL';
} catch(e) { ev.error=e.message;ev.stack=e.stack;ev.verdict='FAIL';try{ev.after=await fingerprint();}catch(post){ev.postCheckError=post.message;} }
finally { ev.finishedUtc=new Date().toISOString();fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(ev,null,2));await pool.close();console.log(JSON.stringify({verdict:ev.verdict,target:ev.target,tests:ev.tests.map(x=>({name:x.name,verdict:x.verdict})),identityGaps:ev.tests.at(-1)?.actual?.identityGaps,error:ev.error,evidence:path.relative(ROOT,OUT)},null,2));if(ev.verdict!=='PASS')process.exitCode=1; }
