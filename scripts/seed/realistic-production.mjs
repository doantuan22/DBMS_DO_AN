// One-time, atomic production seed for the approved CinemaBookingDB target.
// Run only after the approved cleanup on Main. All ordinary business writes use dbo procedures.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../../backend/src/utils/password.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAIN_DB = 'CinemaBookingDB';
const TZ = 'Asia/Ho_Chi_Minh';
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const envPath = path.join(ROOT, 'backend', '.env');
const credsPath = path.join(ROOT, '.audit-output', 'seed-credentials.json');
if (!fs.existsSync(envPath)) throw new Error('Missing backend/.env.');
const env = dotenv.parse(fs.readFileSync(envPath));
for (const key of ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']) {
  if (!env[key]) throw new Error(`backend/.env is missing ${key}.`);
}
if (env.DB_DATABASE !== MAIN_DB) throw new Error(`Refusing seed: backend/.env must target exactly ${MAIN_DB}.`);

const config = {
  server: env.DB_SERVER,
  port: Number(env.DB_PORT ?? 1433),
  database: MAIN_DB,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  options: {
    encrypt: String(env.DB_ENCRYPT).toLowerCase() === 'true',
    trustServerCertificate: String(env.DB_TRUST_SERVER_CERTIFICATE ?? 'true') === 'true',
    useUTC: true,
  },
  requestTimeout: 120000,
};

const roleCodes = ['ADMIN', 'QUAN_LY_RAP', 'CSKH', 'KHACH_HANG'];
const staff = [
  { key: 'admin-operations', name: 'Nguyễn Minh Quân', email: 'admin.operations@example.test', role: 'ADMIN' },
  { key: 'manager-saigon', name: 'Trần Thảo Vy', email: 'manager.saigon@example.test', role: 'QUAN_LY_RAP' },
  { key: 'manager-hanoi', name: 'Lê Đức Anh', email: 'manager.hanoi@example.test', role: 'QUAN_LY_RAP' },
  { key: 'manager-danang', name: 'Phạm Hải Yến', email: 'manager.danang@example.test', role: 'QUAN_LY_RAP' },
  { key: 'manager-cantho', name: 'Võ Quốc Bảo', email: 'manager.cantho@example.test', role: 'QUAN_LY_RAP' },
  { key: 'support-01', name: 'Đặng Thu Hà', email: 'support.01@example.test', role: 'CSKH' },
  { key: 'support-02', name: 'Bùi Hoàng Nam', email: 'support.02@example.test', role: 'CSKH' },
  { key: 'support-03', name: 'Ngô Khánh Linh', email: 'support.03@example.test', role: 'CSKH' },
  { key: 'support-04', name: 'Đỗ Gia Hân', email: 'support.04@example.test', role: 'CSKH' },
];
const customerNames = [
  'Nguyễn Ngọc Mai', 'Trần Anh Khoa', 'Lê Minh Châu', 'Phạm Gia Huy', 'Võ Thanh Tâm',
  'Đặng Bảo Ngọc', 'Bùi Nhật Minh', 'Ngô Phương Thảo', 'Đỗ Hoàng Long', 'Huỳnh Kim Anh',
  'Phan Quốc Khánh', 'Vũ Thanh Vy', 'Đinh Hải Đăng', 'Dương Thùy Linh', 'Lý Minh Đức',
  'Trương Gia Linh', 'Mai Hoàng Phúc', 'Cao Ngọc Diệp', 'Tạ Tuấn Kiệt', 'Châu Bảo Trân',
  'Lâm Khánh Duy', 'Tô Minh Anh', 'Hồ Gia Bảo', 'Đào Yến Nhi',
];
const customers = customerNames.map((name, i) => ({
  key: `customer-${String(i + 1).padStart(2, '0')}`,
  name,
  email: `khach.${String(i + 1).padStart(2, '0')}@example.test`,
  role: 'KHACH_HANG',
  birthDate: `19${80 + (i % 18)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 26) + 1).padStart(2, '0')}`,
  gender: ['Nữ', 'Nam', 'Khác'][i % 3],
}));
const bootstrapAccount = {
  key: 'admin-bootstrap', name: 'CinemaStar Bootstrap Admin',
  email: 'admin.bootstrap@example.test', role: 'ADMIN',
};
const accounts = [bootstrapAccount, ...staff, ...customers];

function randomPassword() {
  return `Cs!${crypto.randomBytes(24).toString('base64url')}`;
}

let secretDocument;
if (fs.existsSync(credsPath)) {
  secretDocument = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
  const storedEmails = new Set(secretDocument.accounts.map((item) => item.email));
  for (const account of accounts) {
    if (!storedEmails.has(account.email)) throw new Error(`Credential artifact is incomplete for ${account.email}.`);
  }
} else {
  const credentialRows = accounts.map((account) => ({
    name: account.name, email: account.email, role: account.role, password: randomPassword(),
  }));
  secretDocument = {
    database: MAIN_DB,
    timezone: TZ,
    generatedAt: new Date().toISOString(),
    note: 'Synthetic example.test accounts for the approved seed. Keep this ignored local artifact private.',
    accounts: credentialRows,
  };
  fs.mkdirSync(path.dirname(credsPath), { recursive: true });
  fs.writeFileSync(credsPath, `${JSON.stringify(secretDocument, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
}
const passwordByEmail = new Map(secretDocument.accounts.map((account) => [account.email, account.password]));

const venues = [
  { key: 'saigon', name: 'CinemaStar Sài Gòn (mô phỏng)', city: 'TP. Hồ Chí Minh', address: 'Khu vực Bến Thành; địa chỉ mô phỏng, không phải điểm kinh doanh có thật', image: '/seed-media/cinemas/saigon.svg' },
  { key: 'hanoi', name: 'CinemaStar Hà Nội (mô phỏng)', city: 'Hà Nội', address: 'Khu vực Cầu Giấy; địa chỉ mô phỏng, không phải điểm kinh doanh có thật', image: '/seed-media/cinemas/hanoi.svg' },
  { key: 'danang', name: 'CinemaStar Đà Nẵng (mô phỏng)', city: 'Đà Nẵng', address: 'Khu vực Hải Châu; địa chỉ mô phỏng, không phải điểm kinh doanh có thật', image: '/seed-media/cinemas/danang.svg' },
  { key: 'cantho', name: 'CinemaStar Cần Thơ (mô phỏng)', city: 'Cần Thơ', address: 'Khu vực Ninh Kiều; địa chỉ mô phỏng, không phải điểm kinh doanh có thật', image: '/seed-media/cinemas/cantho.svg' },
];
const genreNames = ['Hài', 'Gia đình', 'Hoạt hình', 'Hành động', 'Kinh dị', 'Bí ẩn', 'Phiêu lưu', 'Giật gân'];
const films = [
  {
    key: 'an-mang-xem-hoan-hao', title: 'Án Mạng Xém Hoàn Hảo', duration: 124, release: '2026-10-09', end: '2026-11-30', language: 'Tiếng Việt', subtitles: 'Không', rating: 'T18', director: 'Đức Nguyễn',
    synopsis: 'Nhà sáng tạo nội dung Trinh tỉnh dậy mất trí nhớ tại phim trường, nơi một diễn viên bị sát hại; cuộc điều tra cuốn cả thám tử Đại vào vòng nghi vấn.',
    poster: '/seed-media/posters/an-mang-xem-hoan-hao.svg', genres: ['Hài', 'Bí ẩn', 'Giật gân'], actors: ['Anh Tú Atus', 'DJ Mie', 'Vũ Ngọc Anh', 'Huy Khánh'],
    source: 'https://cinestar.com.vn/movie/628aef99-3632-4449-8968-e59ec91d43a5/',
  },
  {
    key: 'ca-voi-nuot-chung', title: 'Cá Voi Nuốt Chửng', duration: 106, release: '2026-10-16', end: '2026-11-30', language: 'Tiếng Anh', subtitles: 'Tiếng Việt', rating: 'T13', director: 'Brian Duffield',
    synopsis: 'Một thợ lặn trẻ tìm di hài người cha dưới biển sâu và phải sống sót sau khi bị cá nhà táng nuốt vào bụng.',
    poster: '/seed-media/posters/ca-voi-nuot-chung.svg', genres: ['Hành động', 'Phiêu lưu', 'Giật gân'], actors: ['Austin Abrams', 'Josh Brolin', 'Elisabeth Shue', 'Emily Rudd'],
    source: 'https://www.20thcenturystudios.com/movies/whalefall',
  },
  {
    key: 'quy-an-tang-4-ho-tinh', title: 'Quỷ Ăn Tạng 4: Hổ Tinh', duration: 111, release: '2026-10-16', end: '2026-11-30', language: 'Tiếng Thái', subtitles: 'Tiếng Việt', rating: 'T18', director: null,
    synopsis: 'Yak và trung sĩ Paphan chiến đấu để sống sót và tìm lời giải cho mối đe dọa bí ẩn trong rừng.',
    poster: '/seed-media/posters/quy-an-tang-4.svg', genres: ['Kinh dị', 'Hành động', 'Giật gân'], actors: ['Nadech Kugimiya', 'Bow Maylada', 'Ongart Cheamcharoenpornkul', 'Bible Wichapas'],
    source: 'https://touchcinema.com/phim/quy-an-tang-4-ho-tinh',
  },
  {
    key: 'shaun-the-sheep-quai-la', title: 'Shaun the Sheep: Quái Lạ Ghé Nhà', duration: 81, release: '2026-10-16', end: '2026-11-30', language: 'Không lời thoại', subtitles: 'Tiếng Việt', rating: 'P', director: 'Steve Cox, Matthew Walker',
    synopsis: 'Shaun tìm cách cứu mùa Halloween sau khi một thí nghiệm bất ngờ làm Ông chủ mất tích và đưa một sinh vật bí ẩn tới Mossy Bottom.',
    poster: '/seed-media/posters/shaun-the-sheep.svg', genres: ['Hoạt hình', 'Gia đình', 'Hài', 'Phiêu lưu'], actors: ['Justin Fletcher', 'John Sparkes', 'Nina Sosanya', 'Kate Harbour'],
    source: 'https://moveek.com/phim/shaun-the-sheep-quai-la-ghe-nha/',
  },
  {
    key: 'an-mang-karaoke', title: 'Án Mạng Karaoke', duration: 96, release: '2026-10-30', end: '2026-11-30', language: 'Tiếng Việt', subtitles: 'Không', rating: 'T16', director: 'Hoàng Lê',
    synopsis: 'Vụ án mạng tại một homestay thiền biệt lập biến chuyến hành hương của một xóm nhỏ thành cuộc đấu trí.',
    poster: '/seed-media/posters/an-mang-karaoke.svg', genres: ['Hài', 'Bí ẩn', 'Giật gân'], actors: ['Vân Dung', 'Đoàn Thiên Ân', 'Đại Nghĩa'],
    source: 'https://moveek.com/phim/an-mang-karaoke-1/', upcoming: true,
  },
];
const productRows = [
  { key: 'popcorn', name: 'Bắp rang bơ cỡ vừa', type: 'Bắp rang', price: 55000, image: '/seed-media/products/popcorn.svg', description: 'Bắp rang bơ cỡ vừa, minh họa sản phẩm tự tạo.' },
  { key: 'caramel', name: 'Bắp rang caramel cỡ vừa', type: 'Bắp rang', price: 65000, image: '/seed-media/products/caramel.svg', description: 'Bắp rang phủ caramel, minh họa sản phẩm tự tạo.' },
  { key: 'cola', name: 'Cola 500 ml', type: 'Nước ngọt', price: 35000, image: '/seed-media/products/cola.svg', description: 'Nước ngọt đóng chai 500 ml.' },
  { key: 'water', name: 'Nước tinh khiết 500 ml', type: 'Nước ngọt', price: 20000, image: '/seed-media/products/water.svg', description: 'Nước tinh khiết đóng chai 500 ml.' },
  { key: 'combo', name: 'Combo đôi bắp và nước', type: 'Combo', price: 149000, image: '/seed-media/products/combo.svg', description: 'Hai bắp rang và hai nước ngọt cỡ vừa.' },
  { key: 'hotdog', name: 'Hot dog phô mai', type: 'Snack', price: 59000, image: '/seed-media/products/hotdog.svg', description: 'Hot dog phô mai dùng tại rạp.' },
];
const promotionRows = [
  { code: 'STAR10', description: 'Giảm 10% hóa đơn đặt vé và đồ ăn, tối đa 30.000 đồng.', type: 'Phần trăm', value: 10, minimum: 0, maximum: 30000, quantity: 500 },
  { code: 'WEEKDAY20K', description: 'Giảm 20.000 đồng cho đơn từ 120.000 đồng.', type: 'Số tiền', value: 20000, minimum: 120000, maximum: 20000, quantity: 300 },
  { code: 'FAMILY15', description: 'Giảm 15% đơn gia đình, tối đa 45.000 đồng.', type: 'Phần trăm', value: 15, minimum: 150000, maximum: 45000, quantity: 250 },
];

function hanoiDateString(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}
function addDays(ymd, count) {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
// The schema stores DATETIME2 instants as UTC; convert Hanoi wall-clock slots before procedure calls.
// Asia/Ho_Chi_Minh is UTC+07:00 on the seed's 2026 schedule dates.
function hanoiWallClockToUtcSql(localDateTime) {
  const utc = new Date(`${localDateTime}Z`);
  utc.setUTCHours(utc.getUTCHours() - 7);
  return utc.toISOString().slice(0, 19);
}
function addMinutesToUtcSql(utcDateTime, minutes) {
  const date = new Date(`${utcDateTime}Z`);
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString().slice(0, 19);
}
function outputRows(result) { return result.recordset ?? []; }
function firstRow(result, context) {
  const row = outputRows(result)[0];
  if (!row) throw new Error(`${context} returned no record.`);
  return row;
}

const pool = await new sql.ConnectionPool(config).connect();
const tx = new sql.Transaction(pool);
let committed = false;
let finalSummary;

async function query(text) { return new sql.Request(tx).query(text); }
async function proc(name, params = {}, outputs = {}) {
  const request = new sql.Request(tx);
  for (const [key, value] of Object.entries(params)) request.input(key, value);
  for (const [key, type] of Object.entries(outputs)) request.output(key, type);
  return request.execute(`dbo.${name}`);
}

async function ensureCleanMain() {
  const identity = await query('SELECT DB_NAME() AS db_name, SUSER_SNAME() AS login_name;');
  if (identity.recordset[0].db_name !== MAIN_DB) throw new Error('Connected to the wrong database; no seed writes were made.');
  const snapshot = await query(`
    SELECT t.name AS table_name, SUM(p.rows) AS row_count
    FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1)
    WHERE t.is_ms_shipped=0 GROUP BY t.name;
  `);
  const unexpected = snapshot.recordset.filter((row) =>
    !['VAITRO', 'QUYEN', 'VAITRO_QUYEN'].includes(row.table_name) && Number(row.row_count) !== 0);
  if (unexpected.length) {
    throw new Error(`Refusing to seed a non-empty database; rollback before writes. ${unexpected.map((row) => `${row.table_name}=${row.row_count}`).join(', ')}`);
  }
  const rbac = await query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.VAITRO) AS roles,
      (SELECT COUNT(*) FROM dbo.QUYEN) AS permissions,
      (SELECT COUNT(*) FROM dbo.VAITRO_QUYEN) AS mappings,
      (SELECT COUNT(*) FROM dbo.VAITRO WHERE MaVaiTro IN ('ADMIN','QUAN_LY_RAP','CSKH','KHACH_HANG')) AS expected_roles;
  `);
  const counts = rbac.recordset[0];
  if (counts.roles !== 4 || counts.permissions !== 33 || counts.mappings !== 59 || counts.expected_roles !== 4) {
    throw new Error(`RBAC snapshot drift; expected 4 roles, 33 permissions, 59 mappings: ${JSON.stringify(counts)}.`);
  }
  return snapshot.recordset;
}

async function bootstrapAdmin() {
  const bootstrap = bootstrapAccount;
  const passwordHash = await hashPassword(passwordByEmail.get(bootstrap.email));
  const result = await new sql.Request(tx)
    .input('Email', sql.VarChar(150), bootstrap.email)
    .input('HoTen', sql.NVarChar(100), 'CinemaStar Bootstrap Admin')
    .input('MatKhau', sql.VarChar(255), passwordHash)
    .query(`
      SET XACT_ABORT ON;
      SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
      BEGIN TRANSACTION;
      DECLARE @AdminRoleID INT, @PermissionID INT, @NewUserID INT, @ExistingAdminID INT;
      SELECT @AdminRoleID = VaiTroID FROM dbo.VAITRO WITH (HOLDLOCK) WHERE MaVaiTro='ADMIN';
      SELECT @PermissionID = QuyenID FROM dbo.QUYEN WITH (HOLDLOCK) WHERE MaQuyen='QL_NGUOIDUNG';
      IF @AdminRoleID IS NULL OR @PermissionID IS NULL
        THROW 50901, N'RBAC thiếu vai trò ADMIN hoặc quyền QL_NGUOIDUNG.', 1;
      IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO_QUYEN WITH (HOLDLOCK) WHERE VaiTroID=@AdminRoleID AND QuyenID=@PermissionID)
        THROW 50902, N'Vai trò ADMIN chưa được gán quyền QL_NGUOIDUNG.', 1;
      IF NOT EXISTS (SELECT 1 FROM dbo.VAITRO_QUYEN WITH (HOLDLOCK) WHERE VaiTroID=@AdminRoleID)
        THROW 50903, N'Vai trò ADMIN chưa có permission mapping.', 1;
      SELECT @ExistingAdminID = nd.NguoiDungID
      FROM dbo.NGUOIDUNG nd WITH (TABLOCKX, HOLDLOCK)
      JOIN dbo.VAITRO vt ON vt.VaiTroID=nd.VaiTroID
      JOIN dbo.VAITRO_QUYEN vq ON vq.VaiTroID=vt.VaiTroID
      JOIN dbo.QUYEN q ON q.QuyenID=vq.QuyenID AND q.MaQuyen='QL_NGUOIDUNG'
      WHERE vt.MaVaiTro='ADMIN' AND nd.TrangThai=N'Hoạt động';
      IF @ExistingAdminID IS NULL
      BEGIN
        IF EXISTS (SELECT 1 FROM dbo.NGUOIDUNG WITH (UPDLOCK, HOLDLOCK) WHERE Email=@Email)
          THROW 50904, N'Email bootstrap đã tồn tại nhưng không thuộc Admin hợp lệ.', 1;
        INSERT INTO dbo.NGUOIDUNG(VaiTroID, HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai)
        VALUES (@AdminRoleID, @HoTen, @Email, @MatKhau, NULL, dbo.fn_BayGio(), N'Hoạt động');
        SET @NewUserID = CONVERT(INT, SCOPE_IDENTITY());
        IF dbo.fn_KiemTraQuyenNguoiDung(@NewUserID, 'QL_NGUOIDUNG') <> 1
          THROW 50905, N'Bootstrap Admin chưa nhận quyền từ mapping RBAC.', 1;
      END
      ELSE SET @NewUserID = @ExistingAdminID;
      COMMIT TRANSACTION;
      SELECT @NewUserID AS NguoiDungID, CASE WHEN @ExistingAdminID IS NULL THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS BootstrapInserted;
    `);
  return {
    id: result.recordset[0].NguoiDungID,
    inserted: Boolean(result.recordset[0].BootstrapInserted),
    email: bootstrap.email,
  };
}

try {
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  await ensureCleanMain();
  const localNow = await query("SELECT CONVERT(varchar(19), dbo.fn_BayGio(), 120) AS utc_now, CONVERT(varchar(10), dbo.fn_NgayKinhDoanh(dbo.fn_BayGio()), 23) AS business_today;");
  const today = localNow.recordset[0].business_today;
  const bootstrap = await bootstrapAdmin();
  const roleResult = await query(`SELECT VaiTroID, MaVaiTro FROM dbo.VAITRO WHERE MaVaiTro IN ('${roleCodes.join("','")}');`);
  const roleIds = new Map(roleResult.recordset.map((row) => [row.MaVaiTro, row.VaiTroID]));
  for (const code of roleCodes) if (!roleIds.has(code)) throw new Error(`Missing role ${code}.`);

  const accountIds = new Map([['admin-bootstrap', bootstrap.id]]);
  const passwordHashes = new Map();
  for (const account of staff) passwordHashes.set(account.email, await hashPassword(passwordByEmail.get(account.email)));
  for (const account of staff) {
    const result = await proc('sp_Admin_User_Create', {
      ActorID: bootstrap.id, HoTen: account.name, Email: account.email,
      MatKhauHash: passwordHashes.get(account.email), SoDienThoai: null, VaiTroID: roleIds.get(account.role),
    });
    const row = firstRow(result, `sp_Admin_User_Create (${account.email})`);
    accountIds.set(account.key, row.NguoiDungID);
  }
  for (const account of customers) {
    const result = await proc('sp_Auth_RegisterCustomer', {
      HoTen: account.name, Email: account.email, MatKhauHash: await hashPassword(passwordByEmail.get(account.email)),
      SoDienThoai: null, NgaySinh: account.birthDate, GioiTinh: account.gender,
    }, { NewUserId: sql.Int });
    accountIds.set(account.key, result.output.NewUserId);
  }

  const cinemaIds = new Map();
  const roomIds = new Map();
  const seatsByRoom = new Map();
  for (const venue of venues) {
    const cinemaResult = await proc('sp_Admin_Cinema_Create', {
      ActorID: bootstrap.id, TenRap: venue.name, DiaChi: venue.address, ThanhPho: venue.city,
      SoDienThoai: null, MoTa: 'Điểm chiếu giả lập phục vụ kiểm thử; tên, địa chỉ, ảnh không đại diện cơ sở kinh doanh thật.',
      NgayHoatDong: addDays(today, -365),
    });
    const cinema = firstRow(cinemaResult, `create cinema ${venue.key}`);
    cinemaIds.set(venue.key, cinema.RapID);
    await proc('usp_Admin_CinemaImage_Create', {
      ActorID: bootstrap.id, RapID: cinema.RapID, URL: venue.image,
      MoTa: 'Ảnh minh họa vector tự tạo cho rạp mô phỏng; không phải ảnh cơ sở thật.',
      LaAnhDaiDien: true, ThuTuHienThi: 1, TrangThai: 'Hoạt động',
    });
    const managerKey = `manager-${venue.key}`;
    await proc('sp_Admin_Assignment_Create', {
      ActorID: bootstrap.id, NguoiDungID: accountIds.get(managerKey), RapID: cinema.RapID,
      NgayBatDau: today, NgayKetThuc: null,
    });
    for (const roomNo of [1, 2]) {
      const roomResult = await proc('usp_Admin_Room_Create', {
        ActorID: bootstrap.id, RapID: cinema.RapID, TenPhong: `Phòng ${String(roomNo).padStart(2, '0')}`, LoaiPhong: '2D',
      });
      const room = firstRow(roomResult, `create room ${venue.key}-${roomNo}`);
      const roomKey = `${venue.key}-${roomNo}`;
      roomIds.set(roomKey, room.PhongID);
      const roomSeats = [];
      for (const row of 'ABCDEFGH') {
        for (let number = 1; number <= 10; number += 1) {
          const type = row === 'H' ? 'Sweetbox' : row === 'G' ? 'VIP' : 'Thường';
          const seatResult = await proc('usp_Admin_Seat_Create', {
            ActorID: bootstrap.id, PhongID: room.PhongID, HangGhe: row, SoGhe: number, LoaiGhe: type,
          });
          roomSeats.push(firstRow(seatResult, `create seat ${roomKey}-${row}${number}`).GheID);
        }
      }
      seatsByRoom.set(roomKey, roomSeats);
    }
    for (const [seatType, weekday, surcharge] of [
      ['Thường', 'Ngày thường', 0], ['Thường', 'Cuối tuần', 10000],
      ['VIP', 'Ngày thường', 15000], ['VIP', 'Cuối tuần', 25000],
      ['Sweetbox', 'Ngày thường', 25000], ['Sweetbox', 'Cuối tuần', 35000],
    ]) {
      await proc('usp_Admin_Pricing_Create', {
        ActorID: bootstrap.id, RapID: cinema.RapID, LoaiGhe: seatType, LoaiNgay: weekday,
        DinhDang: '2D', PhuThu: surcharge, NgayBatDau: today, NgayKetThuc: null,
      });
    }
  }

  const genreIds = new Map();
  for (const name of genreNames) {
    const result = await proc('sp_Admin_Genre_Create', { ActorID: bootstrap.id, TenTheLoai: name });
    genreIds.set(name, firstRow(result, `create genre ${name}`).TheLoaiID);
  }
  const actorIds = new Map();
  for (const film of films) {
    for (const name of film.actors) {
      if (actorIds.has(name)) continue;
      const nationality = ['Anh Tú Atus', 'DJ Mie', 'Vũ Ngọc Anh', 'Huy Khánh', 'Vân Dung', 'Đoàn Thiên Ân', 'Đại Nghĩa'].includes(name)
        ? 'Việt Nam'
        : film.key === 'quy-an-tang-4-ho-tinh' ? 'Thái Lan' : film.key === 'shaun-the-sheep-quai-la' ? 'Vương quốc Anh' : 'Hoa Kỳ';
      const result = await proc('sp_Admin_Actor_Create', { ActorID: bootstrap.id, HoTen: name, NgaySinh: null, QuocTich: nationality });
      actorIds.set(name, firstRow(result, `create actor ${name}`).DienVienID);
    }
  }

  const movieIds = new Map();
  for (const film of films) {
    const genreList = film.genres.map((name) => genreIds.get(name)).join(',');
    const result = await proc('sp_Admin_Movie_Create', {
      ActorID: bootstrap.id, TenPhim: film.title, ThoiLuong: film.duration,
      NgayKhoiChieu: film.release, NgayKetThuc: film.end, NgonNgu: film.language,
      PhuDe: film.subtitles, DoTuoi: film.rating, DaoDien: film.director,
      MoTa: film.synopsis, PosterURL: film.poster, TrailerURL: null, TheLoaiIdList: genreList,
    }, { NewPhimID: sql.Int });
    const movieId = result.output.NewPhimID;
    if (!movieId) throw new Error(`sp_Admin_Movie_Create did not return an ID for ${film.title}.`);
    movieIds.set(film.key, movieId);
    if (film.upcoming) {
      await proc('sp_Admin_Movie_Update', {
        ActorID: bootstrap.id, PhimID: movieId, TenPhim: film.title, ThoiLuong: film.duration,
        NgayKhoiChieu: film.release, NgayKetThuc: film.end, NgonNgu: film.language,
        PhuDe: film.subtitles, DoTuoi: film.rating, DaoDien: film.director,
        MoTa: film.synopsis, PosterURL: film.poster, TrailerURL: null, TrangThai: 'Sắp chiếu', TheLoaiIdList: genreList,
      });
    }
    await proc('sp_Admin_MovieActor_Set', {
      ActorID: bootstrap.id, PhimID: movieId,
      DanhSachJson: JSON.stringify(film.actors.map((name) => ({ DienVienID: actorIds.get(name), VaiDien: null }))),
    });
  }

  const productIds = new Map();
  for (const product of productRows) {
    const result = await proc('sp_Admin_Product_Create', {
      ActorID: bootstrap.id, TenSanPham: product.name, LoaiSanPham: product.type,
      Gia: product.price, MoTa: product.description, HinhAnh: product.image,
    });
    productIds.set(product.key, firstRow(result, `create product ${product.key}`).SanPhamID);
  }
  const promotionStartUtc = hanoiWallClockToUtcSql(`${today}T00:00:00`);
  const promotionEndDate = addDays(today, 72);
  const promotionEndUtc = hanoiWallClockToUtcSql(`${promotionEndDate}T23:59:59`);
  for (const promo of promotionRows) {
    await proc('sp_Admin_Promotion_Create', {
      ActorID: bootstrap.id, MaCode: promo.code, MoTa: promo.description,
      LoaiGiamGia: promo.type, GiaTriGiam: promo.value, DonHangToiThieu: promo.minimum,
      GiamToiDa: promo.maximum, NgayBatDau: promotionStartUtc, NgayKetThuc: promotionEndUtc, SoLuong: promo.quantity,
    });
  }

  const showtimes = [];
  const dateStart = addDays(today, 1);
  for (let offset = 0; offset < 14; offset += 1) {
    const date = addDays(dateStart, offset);
    const availableFilms = films.filter((film) => film.release <= date);
    for (let venueIndex = 0; venueIndex < venues.length; venueIndex += 1) {
      const venue = venues[venueIndex];
      const slots = [
        { room: `${venue.key}-1`, time: '10:30:00' },
        { room: `${venue.key}-2`, time: '14:30:00' },
        { room: `${venue.key}-1`, time: '18:30:00' },
      ];
      for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
        const slot = slots[slotIndex];
        const film = availableFilms[(offset + venueIndex + slotIndex) % availableFilms.length];
        const startUtc = hanoiWallClockToUtcSql(`${date}T${slot.time}`);
        const endUtc = addMinutesToUtcSql(startUtc, film.duration + 30);
        const result = await proc('usp_Admin_Showtime_Create', {
          ActorID: bootstrap.id, PhimID: movieIds.get(film.key), PhongID: roomIds.get(slot.room),
          ThoiGianBatDau: startUtc, ThoiGianKetThuc: endUtc, DinhDang: '2D', GiaVeCoBan: 85000,
        });
        const row = firstRow(result, `create showtime ${venue.key} ${date} ${slot.time}`);
        showtimes.push({
          id: row.SuatChieuID, venue: venue.key, room: slot.room, date, time: slot.time,
          movie: film.key, roomSeats: seatsByRoom.get(slot.room),
        });
      }
    }
  }
  const futureShowtimes = showtimes.filter((show) => show.date >= dateStart);
  if (futureShowtimes.length < 22) throw new Error('Not enough future showtimes to create the approved order lifecycle sample.');

  const orders = [];
  for (let index = 0; index < 22; index += 1) {
    const customer = customers[index];
    const show = futureShowtimes[(index * 5 + 1) % futureShowtimes.length];
    const seatBase = ((index % 7) * 10) + ((index % 4) * 2);
    const firstSeat = show.roomSeats[seatBase];
    const secondSeat = show.roomSeats[seatBase + 1];
    const foodItems = [{ SanPhamID: productIds.get(index % 2 ? 'cola' : 'popcorn'), SoLuong: 1 }];
    if (index % 3 === 0) foodItems.push({ SanPhamID: productIds.get('water'), SoLuong: 1 });
    if (index % 5 === 0) foodItems.push({ SanPhamID: productIds.get('hotdog'), SoLuong: 1 });
    const bookingResult = await proc('sp_Booking_Create', {
      NguoiDungID: accountIds.get(customer.key), SuatChieuID: show.id,
      MaKhuyenMai: index === 0 ? 'STAR10' : null,
      DanhSachGheId: `${firstSeat},${secondSeat}`,
      DanhSachDoAnJson: JSON.stringify(foodItems), DiemSuDung: 0, ChiXemTruoc: false,
    }, { NewDonDatVeID: sql.Int });
    const orderId = bookingResult.output.NewDonDatVeID;
    const payment = await proc('sp_Payment_CreateAttempt', {
      NguoiDungID: accountIds.get(customer.key), DonDatVeID: orderId,
      PhuongThuc: index % 2 ? 'MOMO' : 'VNPAY',
    }, { ThanhToanID: sql.Int, MaGiaoDich: sql.VarChar(100) });
    const succeeded = index < 18;
    await proc('sp_Payment_UpdateResult', {
      NguoiDungID: accountIds.get(customer.key), ThanhToanID: payment.output.ThanhToanID,
      TrangThaiThanhToan: succeeded ? 'Thành công' : 'Thất bại',
      MaGiaoDichNgoai: `SEED-${String(index + 1).padStart(4, '0')}`,
      GhiChu: succeeded ? 'Thanh toán mô phỏng thành công; không phát sinh giao dịch tiền thật.' : 'Thanh toán mô phỏng thất bại; không phát sinh giao dịch tiền thật.',
    });
    if (!succeeded) {
      await proc('sp_Order_Cancel', { NguoiDungID: accountIds.get(customer.key), DonDatVeID: orderId });
    }
    orders.push({ id: orderId, customer: customer.key, customerId: accountIds.get(customer.key), paid: succeeded, showtimeId: show.id });
  }

  const complaints = [];
  const complaintSamples = [
    { type: 'Dịch vụ tại rạp', title: 'Hỗ trợ kiểm tra mã vé điện tử', body: 'Khách báo ứng dụng tải mã vé chậm; đề nghị nhân viên hướng dẫn đối chiếu mã đặt vé tại quầy.' },
    { type: 'Đồ ăn và thức uống', title: 'Thiếu một phần nước trong combo', body: 'Khách phản ánh khay combo giao thiếu một chai nước; nhờ rạp xác minh và bổ sung.' },
    { type: 'Phòng chiếu', title: 'Kiểm tra âm lượng phòng chiếu', body: 'Khách cho biết âm lượng đầu phim hơi nhỏ; đề nghị kiểm tra thiết lập âm thanh.' },
    { type: 'Đặt vé', title: 'Cần hỗ trợ tìm email xác nhận', body: 'Khách cần được hướng dẫn tra lại thư xác nhận và mã đặt vé trong tài khoản.' },
    { type: 'Thanh toán', title: 'Xác nhận trạng thái thanh toán', body: 'Khách muốn được xác nhận trạng thái giao dịch mô phỏng trong lịch sử đặt vé.' },
    { type: 'Phòng chiếu', title: 'Kiểm tra thiết bị ghế', body: 'Khách phản ánh một ghế có tay vịn lỏng và đề nghị kiểm tra trước suất tiếp theo.' },
  ];
  for (let index = 0; index < complaintSamples.length; index += 1) {
    const order = orders[index + 1];
    const sample = complaintSamples[index];
    const complaintResult = await proc('sp_Complaint_Create', {
      NguoiDungID: order.customerId, DonDatVeID: order.id, LoaiKhieuNai: sample.type,
      TieuDe: sample.title, NoiDung: sample.body, MucDoUuTien: index === 5 ? 'Cao' : 'Trung bình',
    });
    complaints.push({ id: firstRow(complaintResult, `create complaint ${index + 1}`).KhieuNaiID, index });
  }
  for (let index = 0; index < 4; index += 1) {
    const complaint = complaints[index];
    const support = staff.find((account) => account.key === `support-0${(index % 4) + 1}`);
    const supportId = accountIds.get(support.key);
    await proc('sp_Complaint_Assign_Self', { NguoiDungID: supportId, KhieuNaiID: complaint.id });
    await proc('sp_Support_Complaint_AddProcessing', {
      NguoiDungID: supportId, KhieuNaiID: complaint.id,
      NoiDungXuLy: index === 0
        ? 'Đã hướng dẫn khách tra mã vé trong mục Vé của tôi; khách xác nhận nhận được mã.'
        : index === 1
          ? 'Đã chuyển thông tin cho quầy đồ ăn để kiểm tra và bổ sung phần còn thiếu.'
          : index === 2
            ? 'Đã ghi nhận phản ánh và chuyển quản lý rạp kiểm tra thiết lập âm thanh.'
            : 'Đã gửi hướng dẫn tra cứu thư xác nhận và trạng thái đơn trong tài khoản.',
      TrangThaiSauXuLy: index === 0 || index === 1 ? 'Đã giải quyết' : 'Đang xử lý',
    });
  }
  const escalationComplaint = complaints[4];
  const escalationSupportId = accountIds.get('support-01');
  await proc('sp_Complaint_Assign_Self', { NguoiDungID: escalationSupportId, KhieuNaiID: escalationComplaint.id });
  await proc('sp_Support_Complaint_AddProcessing', {
    NguoiDungID: escalationSupportId, KhieuNaiID: escalationComplaint.id,
    NoiDungXuLy: 'Đã kiểm tra lịch sử và đang chờ xác nhận đối soát từ bộ phận thanh toán.',
    TrangThaiSauXuLy: 'Đang xử lý',
  });
  await proc('sp_Escalation_Create', {
    NguoiDungID: escalationSupportId, KhieuNaiID: escalationComplaint.id,
    LyDo: 'Cần quản trị viên kiểm tra luồng đối soát giao dịch mô phỏng với lịch sử đơn.', MucDoUuTien: 'Trung bình',
  });
  const lastComplaint = complaints[5];
  const lastSupportId = accountIds.get('support-04');
  await proc('sp_Complaint_Assign_Self', { NguoiDungID: lastSupportId, KhieuNaiID: lastComplaint.id });
  await proc('sp_Support_Complaint_AddProcessing', {
    NguoiDungID: lastSupportId, KhieuNaiID: lastComplaint.id,
    NoiDungXuLy: 'Đã gửi phiếu kiểm tra thiết bị đến quản lý rạp; khách được thông báo thời gian phản hồi.',
    TrangThaiSauXuLy: 'Đang xử lý',
  });

  const verify = await query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG) AS users,
      (SELECT COUNT(*) FROM dbo.HOSOKHACHHANG) AS customer_profiles,
      (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM) AS cinemas,
      (SELECT COUNT(*) FROM dbo.PHONGCHIEU) AS rooms,
      (SELECT COUNT(*) FROM dbo.GHE) AS seats,
      (SELECT COUNT(*) FROM dbo.PHIM) AS movies,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU) AS showtimes,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Đã thanh toán') AS paid_orders,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Đã hủy') AS cancelled_orders,
      (SELECT COUNT(*) FROM dbo.KHIEUNAI) AS complaints,
      (SELECT COUNT(*) FROM dbo.YEUCAU_CHUYENCAP) AS escalations,
      (SELECT COUNT(*) FROM dbo.KHUYENMAI) AS promotions,
      (SELECT COUNT(*) FROM dbo.SANPHAM) AS products;
  `);
  const counts = verify.recordset[0];
  if (counts.cinemas !== 4 || counts.rooms !== 8 || counts.seats !== 640 || counts.movies !== 5
    || counts.showtimes !== showtimes.length || counts.paid_orders !== 18 || counts.cancelled_orders !== 4
    || counts.complaints !== 6 || counts.escalations !== 1 || counts.promotions !== 3 || counts.products !== 6) {
    throw new Error(`Seed count assertions failed; transaction will roll back. ${JSON.stringify(counts)}.`);
  }
  const violations = await query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;');
  if (violations.recordset?.length) throw new Error(`DBCC CHECKCONSTRAINTS returned ${violations.recordset.length} violation(s).`);

  finalSummary = {
    database: MAIN_DB,
    timeZone: TZ,
    startedFromLocalDate: today,
    seededAccounts: accounts.length,
    bootstrapInserted: bootstrap.inserted,
    business: counts,
    showtimes: showtimes.length,
    firstShowDate: showtimes[0]?.date,
    lastShowDate: showtimes.at(-1)?.date,
    artwork: { posters: 5, cinemaScenes: 4, productIcons: 6 },
  };
  await tx.commit();
  committed = true;
} catch (error) {
  if (!committed) {
    try { await tx.rollback(); } catch { /* the server may already have rolled back the transaction */ }
  }
  throw error;
} finally {
  await pool.close();
}

const summaryPath = path.join(ROOT, '.audit-output', 'realistic-production-seed-summary.json');
fs.writeFileSync(summaryPath, `${JSON.stringify(finalSummary, null, 2)}\n`, 'utf8');
console.log(`Committed atomic production seed to ${MAIN_DB}.`);
console.log(JSON.stringify(finalSummary, null, 2));
console.log(`Synthetic account credentials saved in ignored local file: ${path.relative(ROOT, credsPath)}.`);
