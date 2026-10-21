// Reproducible synthetic demo seed for the local development CinemaBookingDB.
// The runner backs up and verifies the exact local target before replacing synthetic rows.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../../backend/src/utils/password.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAIN_DB = 'CinemaBookingDB';
const TZ = 'Asia/Ho_Chi_Minh';
const FIXED_DATA_SEED = 20261021;
const require = createRequire(path.join(ROOT, 'backend', 'package.json'));
const dotenv = require('dotenv');
const sql = require('mssql');
const envPath = path.join(ROOT, 'backend', '.env');
const credsPath = path.join(ROOT, '.audit-output', 'seed-credentials.json');
const manifestPath = path.join(ROOT, '.audit-output', 'seed-demo-manifest.json');
const backupProofPath = path.join(ROOT, '.audit-output', 'seed-pre-reseed-backup.json');
const historySqlPath = path.join(ROOT, 'database', '10_seed', 'seed_demo_history.sql');
const manualShowtimeSqlPath = path.join(ROOT, 'database', '10_seed', 'seed_demo_manual_showtime.sql');
const protectedTables = new Set(['VAITRO', 'QUYEN', 'VAITRO_QUYEN']);
const initialSyntheticCounts = {
  BANGGIA: 24, BOITHUONG_HUYSUAT: 0, CHITIETDOAN: 35, CHITIETVE: 44, DANHGIAPHIM: 0, DONDATVE: 22,
  DIENVIEN: 19, GHE: 640, HINHANH_RAPCHIEUPHIM: 4, HOSOKHACHHANG: 24, KHIEUNAI: 6,
  KHUYENMAI: 3, NGUOIDUNG: 34, PHANCONG_RAP: 4, PHIM: 5, PHIM_DIENVIEN: 19,
  PHIM_THELOAI: 16, PHONGCHIEU: 8, QUYEN: 33, RAPCHIEUPHIM: 4, SANPHAM: 6,
  SUATCHIEU: 168, TINNHAN_KHIEUNAI: 1, THANHTOAN: 22, THELOAI: 8, VAITRO: 4,
  VAITRO_QUYEN: 59, XULY_KHIEUNAI: 13, YEUCAU_CHUYENCAP: 1,
};
if (!fs.existsSync(envPath)) throw new Error('Missing backend/.env.');
const env = dotenv.parse(fs.readFileSync(envPath));
for (const key of ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']) {
  if (!env[key]) throw new Error(`backend/.env is missing ${key}.`);
}
if (env.DB_DATABASE !== MAIN_DB || env.NODE_ENV !== 'development') throw new Error(`Refusing seed: backend/.env must target ${MAIN_DB} with NODE_ENV=development.`);
if (!['localhost', '127.0.0.1', '(local)', '.'].includes(String(env.DB_SERVER).toLowerCase())) {
  throw new Error(`Refusing seed: DB_SERVER must be local, found ${env.DB_SERVER}.`);
}

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
  { key: 'admin-operations', name: 'Nguyễn Minh Quân', email: 'admin.operations@example.test', phone: null, role: 'ADMIN' },
  { key: 'manager-saigon', name: 'Trần Thảo Vy', email: 'manager.saigon@example.test', phone: null, role: 'QUAN_LY_RAP' },
  { key: 'manager-hanoi', name: 'Lê Đức Anh', email: 'manager.hanoi@example.test', phone: null, role: 'QUAN_LY_RAP' },
  { key: 'manager-danang', name: 'Phạm Hải Yến', email: 'manager.danang@example.test', phone: null, role: 'QUAN_LY_RAP' },
  { key: 'manager-cantho', name: 'Võ Quốc Bảo', email: 'manager.cantho@example.test', phone: null, role: 'QUAN_LY_RAP' },
  { key: 'support-01', name: 'Đặng Thu Hà', email: 'support.01@example.test', phone: null, role: 'CSKH' },
  { key: 'support-02', name: 'Bùi Hoàng Nam', email: 'support.02@example.test', phone: null, role: 'CSKH' },
  { key: 'support-03', name: 'Ngô Khánh Linh', email: 'support.03@example.test', phone: null, role: 'CSKH' },
  { key: 'support-04', name: 'Đỗ Gia Hân', email: 'support.04@example.test', phone: null, role: 'CSKH' },
];
const firstNames = ['An', 'Bảo', 'Chi', 'Duy', 'Hà', 'Hân', 'Hiếu', 'Khanh', 'Khôi', 'Linh', 'Mai', 'Minh', 'Nam', 'Ngân', 'Nhi', 'Phong', 'Phúc', 'Quân', 'Thảo', 'Trang'];
const middleNames = ['Ngọc', 'Minh', 'Hoàng', 'Thanh', 'Gia', 'Thu', 'Quốc', 'Hải', 'Phương', 'Anh', 'Tuấn', 'Khánh'];
const familyNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Võ', 'Đặng', 'Bùi', 'Ngô', 'Đỗ', 'Huỳnh', 'Phan', 'Vũ'];
const customerNames = Array.from({ length: 120 }, (_, i) =>
  `${familyNames[Math.floor(i / 40)]} ${middleNames[Math.floor(i / 10) % middleNames.length]} ${firstNames[i % firstNames.length]}`);
function emailSlug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
}
const customers = customerNames.map((name, i) => ({
  key: `customer-${String(i + 1).padStart(3, '0')}`,
  name,
  email: `${emailSlug(name)}.${String(i + 1).padStart(3, '0')}@example.test`,
  role: 'KHACH_HANG',
  phone: null,
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

const priorCredentials = fs.existsSync(credsPath) ? JSON.parse(fs.readFileSync(credsPath, 'utf8')) : { accounts: [] };
const priorPassword = new Map((priorCredentials.accounts ?? []).map((account) => [account.email, account.password]));
const credentialRows = accounts.map((account) => ({
  name: account.name, email: account.email, role: account.role,
  password: priorPassword.get(account.email) ?? randomPassword(),
}));
const secretDocument = {
  database: MAIN_DB, timezone: TZ, generatedAt: new Date().toISOString(),
  note: 'Synthetic example.test accounts for the local demo seed. Keep this ignored local artifact private.',
  accounts: credentialRows,
};
fs.mkdirSync(path.dirname(credsPath), { recursive: true });
fs.writeFileSync(credsPath, `${JSON.stringify(secretDocument, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
const passwordByEmail = new Map(secretDocument.accounts.map((account) => [account.email, account.password]));

const venues = [
  { key: 'saigon', name: 'CinemaStar Sài Gòn (mô phỏng)', city: 'TP. Hồ Chí Minh', address: 'Khu vực Bến Thành; địa chỉ mô phỏng, không phải điểm kinh doanh có thật', image: '/seed-media/cinemas/saigon.svg' },
  { key: 'hanoi', name: 'CinemaStar Hà Nội (mô phỏng)', city: 'Hà Nội', address: 'Khu vực Cầu Giấy; địa chỉ mô phỏng, không phải điểm kinh doanh có thật', image: '/seed-media/cinemas/hanoi.svg' },
  { key: 'danang', name: 'CinemaStar Đà Nẵng (mô phỏng)', city: 'Đà Nẵng', address: 'Khu vực Hải Châu; địa chỉ mô phỏng, không phải điểm kinh doanh có thật', image: '/seed-media/cinemas/danang.svg' },
  { key: 'cantho', name: 'CinemaStar Cần Thơ (mô phỏng)', city: 'Cần Thơ', address: 'Khu vực Ninh Kiều; địa chỉ mô phỏng, không phải điểm kinh doanh có thật', image: '/seed-media/cinemas/cantho.svg' },
];
const genreNames = ['Hài', 'Gia đình', 'Hoạt hình', 'Hành động', 'Kinh dị', 'Bí ẩn', 'Phiêu lưu', 'Giật gân', 'Lãng mạn', 'Tâm lý', 'Khoa học viễn tưởng', 'Âm nhạc'];
const castPool = [
  'An Trần', 'Bảo Nguyễn', 'Chi Lê', 'Duy Phạm', 'Hà Võ', 'Hân Đặng', 'Hiếu Bùi', 'Khanh Ngô',
  'Khôi Đỗ', 'Linh Huỳnh', 'Mai Phan', 'Minh Vũ', 'Nam Trương', 'Ngân Đinh', 'Nhi Dương', 'Phong Lý',
  'Phúc Cao', 'Quân Hồ', 'Thảo Tạ', 'Trang Lâm', 'Tú Châu', 'Vy Mai', 'Khoa Nguyễn', 'Châu Trần',
  'Huy Lê', 'Tâm Phạm', 'Ngọc Võ', 'Long Đặng', 'Minh Bùi', 'Linh Ngô', 'Anh Đỗ', 'Vy Huỳnh',
  'Khánh Phan', 'Đăng Vũ', 'Thùy Trương', 'Đức Đinh', 'Gia Dương', 'Diệp Lý', 'Kiệt Cao', 'Trân Hồ',
  'Duy Tạ', 'Anh Lâm', 'Bảo Tô', 'Nhi Đào', 'Quốc Mai', 'Yến Nguyễn', 'Hải Trần', 'Phương Lê',
];
const filmTemplates = [
  ['pho-dem-khong-ngu', 'Phố Đêm Không Ngủ', 116, -145, -2, 'T16', ['Bí ẩn', 'Giật gân']],
  ['mua-sao-tren-song', 'Mưa Sao Trên Sông', 108, -130, -42, 'T13', ['Gia đình', 'Lãng mạn']],
  ['bep-nha-co-chuyen', 'Bếp Nhà Có Chuyện', 102, -115, 60, 'P', ['Hài', 'Gia đình']],
  ['hanh-tinh-mau-xanh', 'Hành Tinh Màu Xanh', 121, -100, 60, 'T13', ['Phiêu lưu', 'Khoa học viễn tưởng']],
  ['chuyen-tau-cuoi-cung', 'Chuyến Tàu Cuối Cùng', 129, -90, 60, 'T16', ['Hành động', 'Giật gân']],
  ['vuon-ky-uc', 'Khu Vườn Ký Ức', 97, -80, 60, 'P', ['Gia đình', 'Tâm lý']],
  ['can-phong-so-13', 'Căn Phòng Số 13', 105, -70, 60, 'T18', ['Kinh dị', 'Bí ẩn']],
  ['doi-gio-mua-ha', 'Đợi Gió Mùa Hạ', 112, -62, 60, 'T13', ['Lãng mạn', 'Tâm lý']],
  ['doi-thoai-voi-mat-trang', 'Đối Thoại Với Mặt Trăng', 118, -55, 60, 'T13', ['Khoa học viễn tưởng', 'Tâm lý']],
  ['nhom-ban-ban-ke-hoach', 'Nhóm Bạn Bản Kế Hoạch', 94, -48, 60, 'P', ['Hài', 'Phiêu lưu']],
  ['vu-dieu-tren-mai-nha', 'Vũ Điệu Trên Mái Nhà', 109, -42, 60, 'T13', ['Âm nhạc', 'Lãng mạn']],
  ['bien-goi-ten-ai', 'Biển Gọi Tên Ai', 123, -36, 60, 'T16', ['Phiêu lưu', 'Tâm lý']],
  ['nhat-ky-mau-tim', 'Nhật Ký Màu Tím', 101, -30, 60, 'T13', ['Tâm lý', 'Lãng mạn']],
  ['meo-may-di-lac', 'Mèo Máy Đi Lạc', 88, -24, 60, 'P', ['Hoạt hình', 'Gia đình']],
  ['cuoc-dua-tren-may', 'Cuộc Đua Trên Mây', 114, -18, 60, 'T13', ['Hành động', 'Phiêu lưu']],
  ['nguoi-giu-den', 'Người Giữ Đèn', 107, -12, 60, 'T16', ['Bí ẩn', 'Tâm lý']],
  ['la-thu-tu-tuong-lai', 'Lá Thư Từ Tương Lai', 100, 3, 60, 'T13', ['Khoa học viễn tưởng', 'Lãng mạn']],
  ['rung-thong-thi-tham', 'Rừng Thông Thì Thầm', 111, 8, 60, 'T18', ['Kinh dị', 'Bí ẩn']],
  ['doi-dieu-uoc-nho', 'Đội Điều Ước Nhỏ', 92, 14, 60, 'P', ['Hoạt hình', 'Gia đình']],
  ['ban-do-mua-he', 'Bản Đồ Mùa Hè', 119, 20, 60, 'T13', ['Phiêu lưu', 'Gia đình']],
];
const films = filmTemplates.map(([key, title, duration, releaseOffset, endOffset, rating, genres], index) => ({
  key, title, duration, releaseOffset, endOffset, release: null, end: null,
  language: index % 3 === 0 ? 'Tiếng Việt' : index % 3 === 1 ? 'Tiếng Anh' : 'Tiếng Hàn',
  subtitles: 'Tiếng Việt', rating, director: `Đạo diễn ${castPool[(index * 3) % castPool.length]}`,
  synopsis: `${title} là câu chuyện hư cấu về những lựa chọn, tình thân và bất ngờ trong một mùa chiếu tại Việt Nam.`,
  poster: `/seed-media/posters/${key}.svg`, genres,
  actors: Array.from({ length: 4 }, (_, slot) => castPool[(index * 7 + slot * 11) % castPool.length]),
}));
const productRows = [
  { key: 'popcorn', name: 'Bắp rang bơ cỡ vừa', type: 'Bắp rang', price: 55000, image: '/seed-media/products/popcorn.svg', description: 'Bắp rang bơ cỡ vừa, minh họa sản phẩm tự tạo.' },
  { key: 'caramel', name: 'Bắp rang caramel cỡ vừa', type: 'Bắp rang', price: 65000, image: '/seed-media/products/caramel.svg', description: 'Bắp rang phủ caramel, minh họa sản phẩm tự tạo.' },
  { key: 'cola', name: 'Cola 500 ml', type: 'Nước ngọt', price: 35000, image: '/seed-media/products/cola.svg', description: 'Nước ngọt đóng chai 500 ml.' },
  { key: 'water', name: 'Nước tinh khiết 500 ml', type: 'Nước ngọt', price: 20000, image: '/seed-media/products/water.svg', description: 'Nước tinh khiết đóng chai 500 ml.' },
  { key: 'combo', name: 'Combo đôi bắp và nước', type: 'Combo', price: 149000, image: '/seed-media/products/combo.svg', description: 'Hai bắp rang và hai nước ngọt cỡ vừa.' },
  { key: 'hotdog', name: 'Hot dog phô mai', type: 'Snack', price: 59000, image: '/seed-media/products/hotdog.svg', description: 'Hot dog phô mai dùng tại rạp.' },
  { key: 'nachos', name: 'Nachos phô mai', type: 'Snack', price: 69000, image: '/seed-media/products/nachos.svg', description: 'Bánh ngô giòn ăn kèm sốt phô mai.' },
  { key: 'lemon-tea', name: 'Trà chanh 450 ml', type: 'Nước ngọt', price: 39000, image: '/seed-media/products/lemon-tea.svg', description: 'Trà chanh đóng chai 450 ml.' },
  { key: 'orange-juice', name: 'Nước cam 350 ml', type: 'Nước ngọt', price: 42000, image: '/seed-media/products/orange-juice.svg', description: 'Nước cam đóng chai 350 ml.' },
  { key: 'mini-combo', name: 'Combo bắp nhỏ và nước', type: 'Combo', price: 89000, image: '/seed-media/products/mini-combo.svg', description: 'Một bắp nhỏ và một nước cỡ vừa.' },
  { key: 'family-combo', name: 'Combo gia đình', type: 'Combo', price: 219000, image: '/seed-media/products/family-combo.svg', description: 'Hai bắp lớn, ba nước và một phần snack.' },
  { key: 'chocolate', name: 'Socola hạnh nhân', type: 'Snack', price: 49000, image: '/seed-media/products/chocolate.svg', description: 'Thanh socola hạnh nhân gói nhỏ.' },
  { key: 'coffee', name: 'Cà phê sữa đá', type: 'Nước ngọt', price: 45000, image: '/seed-media/products/coffee.svg', description: 'Cà phê sữa đóng chai dùng tại rạp.' },
];
const promotionRows = [
  { code: 'STAR10', description: 'Giảm 10% hóa đơn đặt vé và đồ ăn, tối đa 30.000 đồng.', type: 'Phần trăm', value: 10, minimum: 0, maximum: 30000, quantity: 500 },
  { code: 'WEEKDAY20K', description: 'Giảm 20.000 đồng cho đơn từ 120.000 đồng.', type: 'Số tiền', value: 20000, minimum: 120000, maximum: 20000, quantity: 300 },
  { code: 'FAMILY15', description: 'Giảm 15% đơn gia đình, tối đa 45.000 đồng.', type: 'Phần trăm', value: 15, minimum: 150000, maximum: 45000, quantity: 250 },
  { code: 'MATINEE12', description: 'Giảm 12% đơn vé suất ban ngày, tối đa 35.000 đồng.', type: 'Phần trăm', value: 12, minimum: 80000, maximum: 35000, quantity: 180 },
  { code: 'SNACK15K', description: 'Giảm 15.000 đồng cho đơn có đồ ăn từ 100.000 đồng.', type: 'Số tiền', value: 15000, minimum: 100000, maximum: 15000, quantity: 120 },
  { code: 'NEWVIEWER', description: 'Ưu đãi 8% cho lần đặt đầu tiên, tối đa 25.000 đồng.', type: 'Phần trăm', value: 8, minimum: 0, maximum: 25000, quantity: 100 },
  { code: 'WEEKEND5', description: 'Giảm 5% đơn cuối tuần, tối đa 20.000 đồng.', type: 'Phần trăm', value: 5, minimum: 0, maximum: 20000, quantity: 150 },
  { code: 'CINECLUB25K', description: 'Giảm 25.000 đồng cho đơn từ 200.000 đồng.', type: 'Số tiền', value: 25000, minimum: 200000, maximum: 25000, quantity: 90 },
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

async function currentTableCounts(connection) {
  const result = await new sql.Request(connection).query(`
    SELECT t.name AS table_name, SUM(p.rows) AS row_count
    FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id AND p.index_id IN (0,1)
    WHERE t.is_ms_shipped=0 AND t.name <> 'sysdiagrams' GROUP BY t.name;
  `);
  return Object.fromEntries(result.recordset.map((row) => [row.table_name, Number(row.row_count)]));
}

function topoDeleteOrder(edges, names) {
  const parents = new Map([...names].map((name) => [name, new Set()]));
  const children = new Map([...names].map((name) => [name, new Set()]));
  for (const edge of edges) {
    if (!names.has(edge.child_table) || !names.has(edge.parent_table)) continue;
    parents.get(edge.child_table).add(edge.parent_table);
    children.get(edge.parent_table).add(edge.child_table);
  }
  const ready = [...names].filter((name) => children.get(name).size === 0).sort();
  const result = [];
  while (ready.length) {
    const child = ready.shift();
    result.push(child);
    for (const parent of parents.get(child)) {
      children.get(parent).delete(child);
      if (children.get(parent).size === 0) { ready.push(parent); ready.sort(); }
    }
  }
  if (result.length !== names.size) throw new Error('Foreign-key cycle found; no rows were changed.');
  return result;
}

async function preflightAndBackup() {
  const identity = await pool.request().query(`
    SELECT DB_NAME() AS db_name, CONVERT(sysname, SERVERPROPERTY('MachineName')) AS machine_name,
      SUSER_SNAME() AS login_name;
  `);
  const server = identity.recordset[0];
  if (server.db_name !== MAIN_DB || !server.machine_name || !['localhost', '127.0.0.1', '(local)', '.'].includes(String(env.DB_SERVER).toLowerCase())) {
    throw new Error(`Refusing reset: expected local ${MAIN_DB}; connected to ${JSON.stringify(server)}.`);
  }
  const tableNames = await pool.request().query(`SELECT name FROM sys.tables WHERE is_ms_shipped=0 AND name <> 'sysdiagrams';`);
  const actualNames = tableNames.recordset.map((row) => row.name).sort();
  const expectedNames = Object.keys(initialSyntheticCounts).sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error(`Application table inventory changed; refusing reset: ${actualNames.join(', ')}.`);
  }
  const rbac = await pool.request().query(`
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
  const objectState = await pool.request().query(`
    SELECT (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) AS bad_fks,
      (SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) AS bad_checks,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_disabled=1) AS disabled_triggers;
  `);
  const state = objectState.recordset[0];
  if (state.bad_fks || state.bad_checks || state.disabled_triggers) throw new Error(`Constraint/trigger state is not pristine: ${JSON.stringify(state)}.`);

  const countsByTable = await currentTableCounts(pool);
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
  const expected = manifest?.database === MAIN_DB ? manifest.tableRowCounts : initialSyntheticCounts;
  const drift = Object.entries(expected).filter(([name, count]) => countsByTable[name] !== Number(count));
  if (drift.length || Object.keys(countsByTable).length !== Object.keys(expected).length) {
    throw new Error(`Refusing to clear data outside the known synthetic seed snapshot: ${drift.map(([name, count]) => `${name} expected ${count}, found ${countsByTable[name]}`).join('; ') || 'table inventory mismatch'}.`);
  }
  const identities = await pool.request().query(`
    SELECT COUNT(*) AS users,
      SUM(CASE WHEN Email LIKE '%@example.test' THEN 1 ELSE 0 END) AS reserved_emails
    FROM dbo.NGUOIDUNG;
  `);
  const userCounts = identities.recordset[0];
  if (userCounts.users > 0 && userCounts.users !== userCounts.reserved_emails) {
    throw new Error(`Refusing to reset: found non-synthetic accounts (${userCounts.reserved_emails}/${userCounts.users} reserved example.test emails).`);
  }
  if (userCounts.users > 0) {
    const mockCinemas = await pool.request().query(`SELECT COUNT(*) AS rows, SUM(CASE WHEN TenRap LIKE N'%(mô phỏng)' THEN 1 ELSE 0 END) AS mocked FROM dbo.RAPCHIEUPHIM;`);
    if (mockCinemas.recordset[0].rows !== mockCinemas.recordset[0].mocked) throw new Error('Refusing to reset: a cinema is not marked as a synthetic simulation.');
  }

  fs.mkdirSync(path.join(ROOT, '.audit-output', 'database-backups'), { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const fullBackupPath = path.join(ROOT, '.audit-output', 'database-backups', `CinemaBookingDB_demo_before_reset_${stamp}.bak`);
  await pool.request().input('backupPath', sql.NVarChar(4000), fullBackupPath).query(`
    BACKUP DATABASE [CinemaBookingDB] TO DISK=@backupPath WITH COPY_ONLY, INIT, CHECKSUM, COMPRESSION;
    RESTORE VERIFYONLY FROM DISK=@backupPath WITH CHECKSUM;
  `);
  const stat = fs.statSync(fullBackupPath);
  if (!stat.isFile() || stat.size < 1024) throw new Error('Verified backup file is missing or unexpectedly small.');
  const backup = { database: MAIN_DB, machineName: server.machine_name, backupPath: path.relative(ROOT, fullBackupPath), bytes: stat.size, restoreVerifyOnly: 'PASS', createdAt: new Date().toISOString() };
  fs.writeFileSync(backupProofPath, `${JSON.stringify(backup, null, 2)}\n`, 'utf8');
  console.log(`Verified local rollback backup: ${backup.backupPath} (${backup.bytes} bytes).`);
  return { countsByTable, expectedNames };
}

async function resetSyntheticRows(preflight) {
  const identity = await query('SELECT DB_NAME() AS db_name;');
  if (identity.recordset[0].db_name !== MAIN_DB) throw new Error('Transaction target changed; aborting.');
  const lockedCounts = await currentTableCounts(tx);
  const drift = Object.entries(preflight.countsByTable).filter(([name, count]) => lockedCounts[name] !== count);
  if (drift.length) throw new Error(`Database changed after backup and preflight; aborting reset: ${drift.map(([name, count]) => `${name} was ${count}, now ${lockedCounts[name]}`).join('; ')}.`);
  const edgeRows = (await query(`
    SELECT child.name AS child_table, parent.name AS parent_table
    FROM sys.foreign_keys fk JOIN sys.tables child ON child.object_id=fk.parent_object_id
    JOIN sys.tables parent ON parent.object_id=fk.referenced_object_id
    WHERE child.is_ms_shipped=0 AND parent.is_ms_shipped=0;
  `)).recordset;
  const dataNames = new Set(preflight.expectedNames.filter((name) => !protectedTables.has(name)));
  const protectedChildren = edgeRows.filter((edge) => protectedTables.has(edge.child_table) && dataNames.has(edge.parent_table));
  if (protectedChildren.length) throw new Error(`Protected RBAC table references demo data: ${JSON.stringify(protectedChildren)}.`);
  const order = topoDeleteOrder(edgeRows, dataNames);
  for (const name of order) {
    await query(`DELETE FROM dbo.[${name.replaceAll(']', ']]')}];`);
  }
  const leftovers = await currentTableCounts(tx);
  const notEmpty = Object.entries(leftovers).filter(([name, count]) => !protectedTables.has(name) && count !== 0);
  if (notEmpty.length) throw new Error(`Reset left operational rows behind: ${JSON.stringify(notEmpty)}.`);
  const identitiesToReseed = await query(`SELECT t.name FROM sys.tables t JOIN sys.identity_columns i ON i.object_id=t.object_id WHERE t.is_ms_shipped=0;`);
  for (const row of identitiesToReseed.recordset) {
    if (protectedTables.has(row.name) || row.name === 'sysdiagrams') continue;
    await query(`DBCC CHECKIDENT (N'dbo.[${row.name.replaceAll(']', ']]')}]', RESEED, 0) WITH NO_INFOMSGS;`);
  }
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
  const preflight = await preflightAndBackup();
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  await resetSyntheticRows(preflight);
  const localNow = await query("SELECT CONVERT(varchar(19), dbo.fn_BayGio(), 120) AS utc_now, CONVERT(varchar(10), dbo.fn_NgayKinhDoanh(dbo.fn_BayGio()), 23) AS business_today;");
  const today = localNow.recordset[0].business_today;
  for (const film of films) {
    film.release = addDays(today, film.releaseOffset);
    film.end = addDays(today, film.endOffset);
  }
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
      MatKhauHash: passwordHashes.get(account.email), SoDienThoai: account.phone, VaiTroID: roleIds.get(account.role),
    });
    const row = firstRow(result, `sp_Admin_User_Create (${account.email})`);
    accountIds.set(account.key, row.NguoiDungID);
  }
  for (const account of customers) {
    const result = await proc('sp_Auth_RegisterCustomer', {
      HoTen: account.name, Email: account.email, MatKhauHash: await hashPassword(passwordByEmail.get(account.email)),
      SoDienThoai: account.phone, NgaySinh: account.birthDate, GioiTinh: account.gender,
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
    const managerId = accountIds.get(`manager-${venue.key}`);
    for (const roomNo of [1, 2, 3]) {
      const roomResult = await proc('usp_Admin_Room_Create', {
        ActorID: bootstrap.id, RapID: cinema.RapID, TenPhong: `Phòng ${String(roomNo).padStart(2, '0')}`, LoaiPhong: '2D',
      });
      const room = firstRow(roomResult, `create room ${venue.key}-${roomNo}`);
      const roomKey = `${venue.key}-${roomNo}`;
      roomIds.set(roomKey, room.PhongID);
      await proc('sp_Manager_Seat_BatchCreate', { NguoiDungID: managerId, PhongID: room.PhongID, NumRows: 8, SeatsPerRow: 10, VipRows: 3 });
      const roomSeatRows = await new sql.Request(tx).input('RoomID', sql.Int, room.PhongID)
        .query('SELECT GheID FROM dbo.GHE WHERE PhongID=@RoomID ORDER BY HangGhe, SoGhe;');
      const seatIds = roomSeatRows.recordset.map((seat) => seat.GheID);
      seatsByRoom.set(roomKey, seatIds);
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
      const nationality = ['Việt Nam', 'Hàn Quốc', 'Thái Lan', 'Hoa Kỳ'][actorIds.size % 4];
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
    const movieStatus = film.release > today ? 'Sắp chiếu' : film.end < today ? 'Ngừng chiếu' : 'Đang chiếu';
    if (movieStatus !== 'Đang chiếu') {
      await proc('sp_Admin_Movie_Update', {
        ActorID: bootstrap.id, PhimID: movieId, TenPhim: film.title, ThoiLuong: film.duration,
        NgayKhoiChieu: film.release, NgayKetThuc: film.end, NgonNgu: film.language,
        PhuDe: film.subtitles, DoTuoi: film.rating, DaoDien: film.director,
        MoTa: film.synopsis, PosterURL: film.poster, TrailerURL: null, TrangThai: movieStatus, TheLoaiIdList: genreList,
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
    const availableFilms = films.filter((film) => film.release <= date && film.end >= date);
    for (let venueIndex = 0; venueIndex < venues.length; venueIndex += 1) {
      const venue = venues[venueIndex];
      const slots = [
        { room: `${venue.key}-1`, time: '10:30:00' },
        { room: `${venue.key}-2`, time: '14:30:00' },
        { room: `${venue.key}-3`, time: '19:00:00' },
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
  const pastShowtimes = [];
  const historicalOffsets = [-54, -48, -42, -36, -30, -24, -18, -12, -6, -3];
  for (let dayIndex = 0; dayIndex < historicalOffsets.length; dayIndex += 1) {
    const date = addDays(today, historicalOffsets[dayIndex]);
    for (let venueIndex = 0; venueIndex < venues.length; venueIndex += 1) {
      const venue = venues[venueIndex];
      for (let roomNo = 1; roomNo <= 3; roomNo += 1) {
        const availableFilms = films.filter((film) => film.release <= date && film.end >= date);
        if (!availableFilms.length) throw new Error(`No released film available for historical showtime on ${date}.`);
        const film = availableFilms[(dayIndex * 7 + venueIndex * 3 + roomNo) % availableFilms.length];
        const time = ['10:00:00', '14:15:00', '19:20:00'][(dayIndex + roomNo + venueIndex) % 3];
        const startUtc = hanoiWallClockToUtcSql(`${date}T${time}`);
        const endUtc = addMinutesToUtcSql(startUtc, film.duration + 30);
        const request = new sql.Request(tx)
          .input('MovieID', sql.Int, movieIds.get(film.key))
          .input('RoomID', sql.Int, roomIds.get(`${venue.key}-${roomNo}`))
          .input('StartUtc', sql.DateTime2, new Date(`${startUtc}Z`))
          .input('EndUtc', sql.DateTime2, new Date(`${endUtc}Z`))
          .input('DurationMinutes', sql.Int, film.duration + 30)
          .input('BasePrice', sql.Decimal(18, 2), 85000)
          .input('ShowtimeStatus', sql.NVarChar(50), 'Hoàn thành');
        const inserted = await request.query(fs.readFileSync(manualShowtimeSqlPath, 'utf8'));
        const roomKey = `${venue.key}-${roomNo}`;
        pastShowtimes.push({ id: inserted.recordset[0].SuatChieuID, venue: venue.key, room: roomKey, date, time, movie: film.key, roomSeats: seatsByRoom.get(roomKey) });
      }
    }
  }
  const currentlyPlaying = films.filter((film) => film.release <= today && film.end >= today);
  const ongoingShowtimes = [];
  for (let venueIndex = 0; venueIndex < venues.length; venueIndex += 1) {
    const venue = venues[venueIndex];
    const film = currentlyPlaying[(venueIndex * 3) % currentlyPlaying.length];
    const roomKey = `${venue.key}-3`;
    const inserted = await new sql.Request(tx)
      .input('MovieID', sql.Int, movieIds.get(film.key))
      .input('RoomID', sql.Int, roomIds.get(roomKey))
      .input('StartUtc', sql.DateTime2, null)
      .input('EndUtc', sql.DateTime2, null)
      .input('DurationMinutes', sql.Int, film.duration + 30)
      .input('BasePrice', sql.Decimal(18, 2), 85000)
      .input('ShowtimeStatus', sql.NVarChar(50), 'Đóng bán')
      .query(fs.readFileSync(manualShowtimeSqlPath, 'utf8'));
    ongoingShowtimes.push({ id: inserted.recordset[0].SuatChieuID, venue: venue.key, room: roomKey, date: today, time: 'ongoing', movie: film.key, roomSeats: seatsByRoom.get(roomKey) });
  }
  showtimes.push(...pastShowtimes, ...ongoingShowtimes);
  const futureShowtimes = showtimes.filter((show) => show.date >= dateStart);
  if (futureShowtimes.length < 60) throw new Error('Not enough future showtimes to create the demo order lifecycle sample.');

  const historicalSeatUse = new Map();
  const historicalSpecs = Array.from({ length: 250 }, (_, index) => {
    const show = pastShowtimes[(index * 17 + Math.floor(index / 7)) % pastShowtimes.length];
    const customer = customers[(index * 37 + Math.floor(index / 11)) % customers.length];
    const ticketCount = index % 10 === 0 ? 3 : index % 4 === 0 ? 1 : 2;
    const seatStart = historicalSeatUse.get(show.id) ?? 0;
    const ticketSeats = show.roomSeats.slice(seatStart, seatStart + ticketCount);
    if (ticketSeats.length !== ticketCount) throw new Error(`Historical seat allocation exceeded capacity for showtime ${show.id}.`);
    historicalSeatUse.set(show.id, seatStart + ticketCount);
    const foodIds = index % 10 < 4
      ? [{ ProductID: productIds.get(index % 2 ? 'popcorn' : 'mini-combo'), Quantity: 1 + (index % 2) }]
      : index % 10 === 5 ? [{ ProductID: productIds.get('cola'), Quantity: 1 }, { ProductID: productIds.get('nachos'), Quantity: 1 }] : [];
    return {
      ordinal: index + 1,
      customerId: accountIds.get(customer.key),
      showtimeId: show.id,
      status: index < 240 ? 'Hoàn thành' : index < 245 ? 'Hết hạn' : 'Đã hủy',
      ticketSeats,
      foodItems: foodIds,
    };
  });
  await new sql.Request(tx)
    .input('HistoryJson', sql.NVarChar(sql.MAX), JSON.stringify(historicalSpecs))
    .query(fs.readFileSync(historySqlPath, 'utf8'));
  console.log('Loaded 250 valid historical booking chains (240 completed, 5 expired, 5 canceled).');

  const reviewPairs = await query(`
    SELECT TOP (80) d.NguoiDungID,s.PhimID
    FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
    WHERE d.TrangThai IN (N'Đã thanh toán',N'Hoàn thành') AND s.ThoiGianKetThuc<=dbo.fn_BayGio()
      AND EXISTS (SELECT 1 FROM dbo.THANHTOAN p WHERE p.DonDatVeID=d.DonDatVeID AND p.TrangThai=N'Thành công')
      AND NOT EXISTS (SELECT 1 FROM dbo.DANHGIAPHIM r WHERE r.NguoiDungID=d.NguoiDungID AND r.PhimID=s.PhimID)
    GROUP BY d.NguoiDungID,s.PhimID
    ORDER BY CHECKSUM(d.NguoiDungID,s.PhimID,20261021);
  `);
  if (reviewPairs.recordset.length < 60) throw new Error(`Only ${reviewPairs.recordset.length} eligible customer/movie pairs are available for reviews.`);
  const reviewTexts = [
    'Nhịp phim cuốn hút, phần dựng âm thanh làm các cảnh quan trọng nổi bật hơn.',
    'Diễn xuất tự nhiên và câu chuyện để lại điều đáng nghĩ sau khi xem.',
    'Hình ảnh đẹp, tiết tấu ở giữa phim hơi chậm nhưng đoạn kết thuyết phục.',
    'Một buổi xem vui cùng bạn bè; nhân vật phụ có nhiều khoảnh khắc duyên dáng.',
    'Phần âm nhạc hợp không khí, nội dung có vài bất ngờ thú vị.',
    'Kịch bản dễ theo dõi và diễn viên phối hợp tốt; muốn xem thêm tác phẩm cùng thể loại.',
  ];
  for (let index = 0; index < reviewPairs.recordset.length; index += 1) {
    const pair = reviewPairs.recordset[index];
    await proc('sp_Review_Create', {
      NguoiDungID: pair.NguoiDungID, PhimID: pair.PhimID,
      SoSao: index % 10 < 2 ? 3 : index % 10 < 7 ? 4 : 5,
      NoiDung: reviewTexts[index % reviewTexts.length],
    });
  }

  const orders = [];
  for (let index = 0; index < 60; index += 1) {
    const customer = customers[index];
    const show = index < 6 ? futureShowtimes[0] : futureShowtimes[(index * 5 + 1) % futureShowtimes.length];
    const seatBase = index < 6 ? index * 3 : ((index % 7) * 10) + ((index % 4) * 2);
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
    const retried = index >= 45 && index < 53;
    const failedOnly = index >= 53 && index < 56;
    const pending = index >= 56;
    const succeeded = index < 45 || retried;
    if (index < 45) {
      await proc('sp_Payment_UpdateResult', {
        NguoiDungID: accountIds.get(customer.key), ThanhToanID: payment.output.ThanhToanID,
        TrangThaiThanhToan: 'Thành công', MaGiaoDichNgoai: `DEMO-S-${String(index + 1).padStart(4, '0')}`,
        GhiChu: 'Thanh toán mô phỏng thành công; không phát sinh giao dịch tiền thật.',
      });
    }
    if (retried || failedOnly) {
      await proc('sp_Payment_UpdateResult', {
        NguoiDungID: accountIds.get(customer.key), ThanhToanID: payment.output.ThanhToanID,
        TrangThaiThanhToan: 'Thất bại', MaGiaoDichNgoai: `DEMO-F-${String(index + 1).padStart(4, '0')}`,
        GhiChu: 'Lần thử thanh toán mô phỏng thất bại; đơn vẫn còn trong thời gian giữ ghế.',
      });
    }
    if (retried) {
      const retry = await proc('sp_Payment_CreateAttempt', {
        NguoiDungID: accountIds.get(customer.key), DonDatVeID: orderId, PhuongThuc: 'MOMO',
      }, { ThanhToanID: sql.Int, MaGiaoDich: sql.VarChar(100) });
      await proc('sp_Payment_UpdateResult', {
        NguoiDungID: accountIds.get(customer.key), ThanhToanID: retry.output.ThanhToanID,
        TrangThaiThanhToan: 'Thành công', MaGiaoDichNgoai: `DEMO-R-${String(index + 1).padStart(4, '0')}`,
        GhiChu: 'Lần thanh toán thử lại mô phỏng thành công; không phát sinh giao dịch tiền thật.',
      });
    }
    if (failedOnly) {
      await proc('sp_Order_Cancel', { NguoiDungID: accountIds.get(customer.key), DonDatVeID: orderId });
    }
    orders.push({ id: orderId, customer: customer.key, customerId: accountIds.get(customer.key), paid: succeeded, pending, showtimeId: show.id });
  }
  await proc('sp_Showtime_CancelCascade', { SuatChieuID: futureShowtimes[0].id, NguoiDungID: bootstrap.id, LyDo: 'Lịch suất chiếu mô phỏng được điều chỉnh; áp dụng quy tắc bồi thường hiện hành.' });

  const linkedOrders = await query(`
    SELECT TOP (20) d.DonDatVeID,d.NguoiDungID
    FROM dbo.DONDATVE d
    WHERE d.TrangThai=N'Hoàn thành'
    ORDER BY CHECKSUM(d.DonDatVeID,d.NguoiDungID,20261021);
  `);
  if (linkedOrders.recordset.length < 20) throw new Error('Not enough completed customer orders to attach complaint history.');
  const complaintSamples = [
    { type: 'Dịch vụ tại rạp', title: 'Hỗ trợ tra cứu vé điện tử', body: 'Ứng dụng tải mã vé chậm; khách cần được hướng dẫn đối chiếu mã đặt vé tại quầy.' },
    { type: 'Đồ ăn và thức uống', title: 'Thiếu phần nước trong combo', body: 'Khách phản ánh khay combo giao thiếu một chai nước và đề nghị kiểm tra đơn tại quầy.' },
    { type: 'Phòng chiếu', title: 'Âm lượng đầu phim chưa đều', body: 'Âm lượng trong vài phút đầu thấp hơn mong đợi; khách đề nghị kiểm tra thiết lập phòng.' },
    { type: 'Đặt vé', title: 'Không thấy thư xác nhận', body: 'Khách cần trợ giúp tìm thư xác nhận và mã đặt vé trong tài khoản.' },
    { type: 'Thanh toán', title: 'Đối soát giao dịch ví điện tử', body: 'Lịch sử có một lần thử thất bại trước giao dịch thành công; khách xin xác nhận trạng thái cuối.' },
    { type: 'Ghế ngồi', title: 'Kiểm tra ghế trước suất tiếp theo', body: 'Khách báo tay vịn ghế hơi lỏng và muốn nhân viên kiểm tra trước lần sử dụng tiếp theo.' },
    { type: 'Chất lượng phim', title: 'Hình ảnh gián đoạn trong vài giây', body: 'Khách ghi nhận hình ảnh bị khựng ngắn giữa phim và gửi thời điểm để kỹ thuật đối chiếu.' },
    { type: 'Dịch vụ tại rạp', title: 'Hỏi về quy trình nhận đồ ăn', body: 'Khách muốn biết thời gian và vị trí nhận phần đồ ăn đã đặt cùng vé.' },
  ];
  const complaints = [];
  for (let index = 0; index < 30; index += 1) {
    const sample = complaintSamples[index % complaintSamples.length];
    const linked = index < 20 ? linkedOrders.recordset[index] : null;
    const customerId = linked?.NguoiDungID ?? accountIds.get(customers[90 + (index - 20)].key);
    const request = new sql.Request(tx).input('NguoiDungID', sql.Int, customerId)
      .input('DonDatVeID', sql.Int, linked?.DonDatVeID ?? null)
      .input('LoaiKhieuNai', sql.NVarChar(100), sample.type)
      .input('TieuDe', sql.NVarChar(200), `${sample.title}${index >= 8 ? ` (${index + 1})` : ''}`)
      .input('NoiDung', sql.NVarChar(sql.MAX), sample.body)
      .input('MucDoUuTien', sql.NVarChar(50), index % 17 === 0 ? 'Cao' : index % 7 === 0 ? 'Thấp' : 'Trung bình');
    const complaintResult = await request.execute('dbo.sp_Complaint_Create');
    complaints.push({ id: firstRow(complaintResult, `create complaint ${index + 1}`).KhieuNaiID, customerId, index });
  }
  for (let index = 0; index < 20; index += 1) {
    const complaint = complaints[index];
    const supportId = accountIds.get(`support-0${(index % 4) + 1}`);
    await proc('sp_Complaint_Assign_Self', { NguoiDungID: supportId, KhieuNaiID: complaint.id });
    if (index < 8) {
      await proc('sp_Support_Complaint_AddProcessing', {
        NguoiDungID: supportId, KhieuNaiID: complaint.id,
        NoiDungXuLy: index < 5
          ? 'Đã đối chiếu thông tin đơn, trao đổi với bộ phận liên quan và thông báo kết quả cho khách.'
          : index === 5 ? 'Đã kiểm tra với quầy; nội dung phản ánh không khớp dữ liệu giao nhận nên từ chối yêu cầu.'
            : 'Đã chuyển thông tin cho bộ phận phụ trách và đang chờ kết quả xác minh.',
        TrangThaiSauXuLy: index < 5 ? 'Đã giải quyết' : index === 5 ? 'Từ chối' : 'Đang xử lý',
      });
    }
  }
  const chatCase = complaints[6];
  const chatSupportId = accountIds.get('support-03');
  await proc('sp_Complaint_Chat_Send', { NguoiDungID: chatSupportId, KhieuNaiID: chatCase.id, NoiDung: 'Bên mình đã chuyển thời điểm phản ánh cho kỹ thuật kiểm tra; sẽ cập nhật ngay khi có kết quả.', LoaiTinNhan: 'Công khai' });
  await proc('sp_Complaint_Chat_Send', { NguoiDungID: chatCase.customerId, KhieuNaiID: chatCase.id, NoiDung: 'Cảm ơn, mình đã gửi lại thời điểm xảy ra để rạp tiện đối chiếu.', LoaiTinNhan: 'Công khai' });
  const escalationComplaint = complaints[16];
  const escalationSupportId = accountIds.get('support-01');
  const escalationResult = await proc('sp_Escalation_Create', {
    NguoiDungID: escalationSupportId, KhieuNaiID: escalationComplaint.id,
    LyDo: 'Cần Admin kiểm tra đối soát lần thử thanh toán và giao dịch thành công của đơn tham chiếu.', MucDoUuTien: 'Trung bình',
  });
  if (!firstRow(escalationResult, 'create escalation').YeuCauID) throw new Error('Escalation procedure returned no request ID.');
  const secondEscalationSupport = accountIds.get('support-02');
  const secondEscalation = await proc('sp_Escalation_Create', {
    NguoiDungID: secondEscalationSupport, KhieuNaiID: complaints[17].id,
    LyDo: 'Nhờ Admin xác nhận cách ghi nhận phản ánh chất lượng hình ảnh trong biên bản kỹ thuật.', MucDoUuTien: 'Thấp',
  });
  const secondEscalationId = firstRow(secondEscalation, 'create second escalation').YeuCauID;
  await proc('sp_Escalation_Claim', { AdminID: bootstrap.id, YeuCauID: secondEscalationId });
  await proc('sp_Escalation_Process', {
    AdminID: bootstrap.id, YeuCauID: secondEscalationId,
    KetQuaXuLy: 'Đã đối chiếu với quy trình tiếp nhận phản ánh kỹ thuật và hướng dẫn CSKH cập nhật hồ sơ tham chiếu.',
    TrangThaiMoi: 'Đã giải quyết',
  });

  for (const account of customers.slice(-3)) {
    await proc('sp_Admin_User_UpdateStatus', { ActorID: bootstrap.id, NguoiDungID: accountIds.get(account.key), TrangThai: 'Bị khóa' });
  }

  const verify = await query(`
    DECLARE @Now datetime2(7)=dbo.fn_BayGio();
    SELECT
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG) AS users,
      (SELECT COUNT(*) FROM dbo.HOSOKHACHHANG) AS customer_profiles,
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO vt ON vt.VaiTroID=nd.VaiTroID WHERE vt.MaVaiTro='KHACH_HANG') AS customers,
      (SELECT COUNT(*) FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO vt ON vt.VaiTroID=nd.VaiTroID WHERE vt.MaVaiTro='KHACH_HANG' AND nd.TrangThai=N'Bị khóa') AS locked_customers,
      (SELECT COUNT(*) FROM dbo.RAPCHIEUPHIM) AS cinemas,
      (SELECT COUNT(*) FROM dbo.PHONGCHIEU) AS rooms,
      (SELECT COUNT(*) FROM dbo.GHE) AS seats,
      (SELECT COUNT(*) FROM dbo.PHIM) AS movies,
      (SELECT COUNT(*) FROM dbo.THELOAI) AS genres,
      (SELECT COUNT(*) FROM dbo.DIENVIEN) AS actors,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU) AS showtimes,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE ThoiGianKetThuc<@Now) AS past_showtimes,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE ThoiGianBatDau<=@Now AND ThoiGianKetThuc>@Now) AS ongoing_showtimes,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE ThoiGianBatDau>@Now) AS future_showtimes,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU WHERE TrangThai=N'Mở bán' AND ThoiGianBatDau>@Now) AS future_open_showtimes,
      (SELECT COUNT(*) FROM dbo.DONDATVE) AS orders,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Hoàn thành') AS completed_orders,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Chờ thanh toán') AS pending_orders,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Hết hạn') AS expired_orders,
      (SELECT COUNT(*) FROM dbo.DONDATVE WHERE TrangThai=N'Đã hủy') AS cancelled_orders,
      (SELECT COUNT(*) FROM dbo.THANHTOAN) AS payments,
      (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai=N'Thành công') AS successful_payments,
      (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai=N'Thất bại') AS failed_payments,
      (SELECT COUNT(*) FROM dbo.THANHTOAN WHERE TrangThai=N'Đang xử lý') AS processing_payments,
      (SELECT COUNT(*) FROM dbo.DANHGIAPHIM) AS reviews,
      (SELECT COUNT(*) FROM dbo.KHIEUNAI) AS complaints,
      (SELECT COUNT(*) FROM dbo.KHIEUNAI WHERE DonDatVeID IS NOT NULL) AS linked_complaints,
      (SELECT COUNT(*) FROM dbo.KHIEUNAI WHERE DonDatVeID IS NULL) AS unlinked_complaints,
      (SELECT COUNT(*) FROM dbo.XULY_KHIEUNAI) AS complaint_history,
      (SELECT COUNT(*) FROM dbo.TINNHAN_KHIEUNAI) AS complaint_messages,
      (SELECT COUNT(*) FROM dbo.YEUCAU_CHUYENCAP) AS escalations,
      (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT) AS compensations,
      (SELECT COUNT(*) FROM dbo.KHUYENMAI) AS promotions,
      (SELECT COUNT(*) FROM dbo.SANPHAM) AS products,
      (SELECT COUNT(*) FROM dbo.BANGGIA) AS pricing_rows,
      (SELECT COUNT(*) FROM dbo.SUATCHIEU a JOIN dbo.SUATCHIEU b ON b.PhongID=a.PhongID AND b.SuatChieuID>a.SuatChieuID
        AND a.ThoiGianBatDau<b.ThoiGianKetThuc AND b.ThoiGianBatDau<a.ThoiGianKetThuc
        AND a.TrangThai<>N'Đã hủy' AND b.TrangThai<>N'Đã hủy') AS overlapping_showtimes,
      (SELECT COUNT(*) FROM dbo.DONDATVE d WHERE ABS(d.TongTienVe-ISNULL((SELECT SUM(v.GiaVe) FROM dbo.CHITIETVE v WHERE v.DonDatVeID=d.DonDatVeID),0))>0.01
        OR ABS(d.TongTienDoAn-ISNULL((SELECT SUM(a.SoLuong*a.DonGia) FROM dbo.CHITIETDOAN a WHERE a.DonDatVeID=d.DonDatVeID),0))>0.01) AS snapshot_mismatches,
      (SELECT COUNT(*) FROM dbo.DANHGIAPHIM r WHERE NOT EXISTS (
        SELECT 1 FROM dbo.DONDATVE d JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
        JOIN dbo.CHITIETVE v ON v.DonDatVeID=d.DonDatVeID
        WHERE d.NguoiDungID=r.NguoiDungID AND s.PhimID=r.PhimID AND d.TrangThai IN (N'Đã thanh toán',N'Hoàn thành')
          AND s.ThoiGianKetThuc<=@Now AND v.TrangThai=N'Đã sử dụng'
      )) AS invalid_reviews,
      (SELECT COUNT(*) FROM dbo.KHIEUNAI k JOIN dbo.DONDATVE d ON d.DonDatVeID=k.DonDatVeID WHERE k.NguoiDungID<>d.NguoiDungID) AS invalid_complaint_owners,
      (SELECT COUNT(*) FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID
        JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID
        WHERE d.TrangThai<>N'Đã hủy' OR s.TrangThai<>N'Đã hủy'
          OR NOT EXISTS (SELECT 1 FROM dbo.THANHTOAN p WHERE p.DonDatVeID=d.DonDatVeID AND p.TrangThai=N'Thành công')) AS invalid_compensations,
      (SELECT COUNT(*) FROM dbo.KHUYENMAI WHERE SoLuongDaDung<0 OR SoLuongDaDung>SoLuong) AS invalid_promotion_usage;
  `);
  const counts = verify.recordset[0];
  if (counts.cinemas !== 4 || counts.rooms !== 12 || counts.seats !== 960 || counts.movies !== 20
    || counts.customers !== 120 || counts.locked_customers !== 3 || counts.showtimes !== showtimes.length || counts.past_showtimes < 100
    || counts.ongoing_showtimes < 4 || counts.future_open_showtimes < 100 || counts.orders !== 310
    || counts.completed_orders !== 240 || counts.pending_orders < 4 || counts.expired_orders !== 5
    || counts.cancelled_orders < 10 || counts.payments < 350 || counts.failed_payments < 50
    || counts.reviews < 60 || counts.complaints !== 30 || counts.linked_complaints !== 20
    || counts.unlinked_complaints !== 10 || counts.complaint_history < 25 || counts.compensations !== 6
    || counts.escalations !== 2 || counts.promotions !== 8 || counts.products !== 13
    || counts.overlapping_showtimes !== 0 || counts.snapshot_mismatches !== 0 || counts.invalid_reviews !== 0
    || counts.invalid_complaint_owners !== 0 || counts.invalid_compensations !== 0 || counts.invalid_promotion_usage !== 0) {
    throw new Error(`Seed count assertions failed; transaction will roll back. ${JSON.stringify(counts)}.`);
  }
  const violations = await query('DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS, NO_INFOMSGS;');
  if (violations.recordset?.length) throw new Error(`DBCC CHECKCONSTRAINTS returned ${violations.recordset.length} violation(s).`);

  const tableRowCounts = await currentTableCounts(tx);
  const objectState = await query(`
    SELECT (SELECT COUNT(*) FROM sys.foreign_keys WHERE is_disabled=1 OR is_not_trusted=1) AS bad_fks,
      (SELECT COUNT(*) FROM sys.check_constraints WHERE is_disabled=1 OR is_not_trusted=1) AS bad_checks,
      (SELECT COUNT(*) FROM sys.triggers WHERE is_disabled=1) AS disabled_triggers;
  `);
  if (objectState.recordset[0].bad_fks || objectState.recordset[0].bad_checks || objectState.recordset[0].disabled_triggers) {
    throw new Error(`Constraint/trigger verification failed: ${JSON.stringify(objectState.recordset[0])}.`);
  }

  finalSummary = {
    database: MAIN_DB,
    timeZone: TZ,
    fixedDataSeed: FIXED_DATA_SEED,
    startedFromLocalDate: today,
    seededAccounts: accounts.length,
    bootstrapInserted: bootstrap.inserted,
    business: counts,
    showtimes: showtimes.length,
    firstShowDate: addDays(today, -54),
    lastShowDate: addDays(today, 14),
    tableRowCounts,
    schemaState: objectState.recordset[0],
    artwork: { posters: 20, cinemaScenes: 4, productIcons: 13 },
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

const summaryPath = path.join(ROOT, '.audit-output', 'seed-demo-summary.json');
fs.writeFileSync(summaryPath, `${JSON.stringify(finalSummary, null, 2)}\n`, 'utf8');
fs.writeFileSync(manifestPath, `${JSON.stringify({ database: MAIN_DB, fixedDataSeed: FIXED_DATA_SEED, generatedAt: new Date().toISOString(), tableRowCounts: finalSummary.tableRowCounts }, null, 2)}\n`, 'utf8');
console.log(`Committed synthetic demo seed to local ${MAIN_DB}.`);
console.log(JSON.stringify(finalSummary, null, 2));
console.log(`Synthetic account credentials saved in ignored local file: ${path.relative(ROOT, credsPath)}.`);
