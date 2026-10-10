import path from 'node:path';
import { dbRoot, read, write } from './lib.mjs';
const put = (p, s) => write(path.join(dbRoot, p), s.trim() + '\n');
const legacy = read(path.join(dbRoot, '_legacy_snapshot/seed/07_seed_data.sql'));
const markers = [...legacy.matchAll(/^-- (\d+)\. SEED[^\r\n]*/gm)];
const files = [];
for (let i = 0; i < markers.length; i++) {
  const number = Number(markers[i][1]);
  if (number > 16) continue;
  let sql = legacy.slice(markers[i].index, markers[i + 1]?.index ?? legacy.length);
  sql = sql.replace(/^\s*GO\s*$/gim, '');
  // Controlled fixtures use explicit IDENTITY_INSERT IDs, never assume a generated identity value.
  // Seed-day is a fixture parameter; it does not alter the application's timezone policy.
  if (number === 6)
    sql = sql
      .replaceAll("'2026-01-01'", 'DATEADD(DAY,-30,@SeedDay)')
      .replaceAll("'2027-12-31'", 'DATEADD(YEAR,2,@SeedDay)');
  if (number === 11)
    sql = sql.replace(/'202[56]-\d\d-\d\d'/g, (date) =>
      date === "'2026-06-30'" || date === "'2026-12-31'"
        ? 'DATEADD(YEAR,1,@SeedDay)'
        : 'DATEADD(DAY,-30,@SeedDay)',
    );
  if (number === 13) sql = sql.replaceAll("'2026-01-01'", 'DATEADD(DAY,-30,@SeedDay)');
  if (number === 14) {
    sql = sql
      .replaceAll(
        "'2026-02-10 18:00:00'",
        'DATEADD(HOUR,18,CONVERT(datetime2,DATEADD(DAY,-2,@SeedDay)))',
      )
      .replaceAll(
        "'2026-02-10 20:46:00'",
        'DATEADD(MINUTE,1246,CONVERT(datetime2,DATEADD(DAY,-2,@SeedDay)))',
      );
    sql = sql.replaceAll('SYSDATETIME()', 'DATEADD(DAY,1,CONVERT(datetime2,@SeedDay))');
  }
  if (number === 16)
    sql = sql
      .replaceAll("'2026-01-01'", 'DATEADD(DAY,-30,@SeedDay)')
      .replaceAll("'2026-12-31'", 'DATEADD(YEAR,1,@SeedDay)')
      .replace(/1000, 15,/g, '1000, 0,')
      .replace(/500, 20,/g, '500, 0,')
      .replace(/200, 5,/g, '200, 0,');
  const group = number === 14 ? 'seed_demo_dynamic' : 'seed_base';
  const p = `10_seed/${group}/${String(number).padStart(3, '0')}_reference.sql`;
  files.push(p);
  put(
    p,
    `IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0\nBEGIN\nDECLARE @SeedDay date = CONVERT(date,SESSION_CONTEXT(N'CinemaSeedDay'));\n${sql}\nEND;\nGO`,
  );
}
put(
  '10_seed/seed_base/017_cinema_images.sql',
  `IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0\nBEGIN\n INSERT dbo.HINHANH_RAPCHIEUPHIM(RapID,URL,MoTa,LaAnhDaiDien,ThuTuHienThi)\n SELECT RapID,N'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',N'Development cinema image',1,0 FROM dbo.RAPCHIEUPHIM;\nEND;\nGO`,
);
files.push('10_seed/seed_base/017_cinema_images.sql');
put(
  '10_seed/seed-all.sql',
  `:on error exit\nUSE CinemaBookingDB;\nGO\nSET NOCOUNT ON;\nSET XACT_ABORT ON;\nDECLARE @day date = TRY_CONVERT(date,N'$(SeedDate)',126);\nIF @day IS NULL THROW 51004, 'SeedDate must be YYYY-MM-DD.', 1;\nEXEC sys.sp_set_session_context @key=N'CinemaSeedDay',@value=@day;\nDECLARE @skip int = CASE WHEN EXISTS(SELECT 1 FROM dbo.NGUOIDUNG WHERE Email='admin@cinemadb.vn') THEN 1 ELSE 0 END;\nIF @skip=0 AND EXISTS(SELECT 1 FROM dbo.VAITRO) THROW 51004, 'Partial/nonempty reference data: reset before seed.', 1;\nEXEC sys.sp_set_session_context @key=N'CinemaSeedSkip',@value=@skip;\nBEGIN TRANSACTION;\nGO\n${files.map((p) => `:r ./${p}`).join('\n')}\nCOMMIT TRANSACTION;\nEXEC sys.sp_set_session_context @key=N'CinemaSeedSkip',@value=NULL;\nEXEC sys.sp_set_session_context @key=N'CinemaSeedDay',@value=NULL;\nPRINT 'PASS reference/demo seed (idempotent, no historical audit fixtures)';\nGO`,
);
put(
  '12_verify/verify_seed.sql',
  `IF EXISTS(SELECT MaVaiTro FROM (VALUES('ADMIN'),('QUAN_LY_RAP'),('CSKH'),('KHACH_HANG')) e(MaVaiTro) EXCEPT SELECT MaVaiTro FROM dbo.VAITRO) THROW 51005, 'Missing seed role.', 1;\nIF EXISTS(SELECT MaQuyen FROM (VALUES('XEM_PHIM'),('DAT_VE'),('THANH_TOAN'),('DANH_GIA'),('GUI_KHIEU_NAI'),('QL_PHONG'),('QL_GHE')) e(MaQuyen) EXCEPT SELECT MaQuyen FROM dbo.QUYEN) THROW 51005, 'Missing seed permission.', 1;\nIF EXISTS(SELECT 1 FROM dbo.QUYEN q WHERE NOT EXISTS(SELECT 1 FROM dbo.VAITRO_QUYEN vq JOIN dbo.VAITRO v ON v.VaiTroID=vq.VaiTroID WHERE v.MaVaiTro='ADMIN' AND vq.QuyenID=q.QuyenID)) THROW 51005, 'Missing admin role-permission mapping.', 1;\nIF (SELECT COUNT(*) FROM dbo.NGUOIDUNG WHERE Email IN ('admin@cinemadb.vn','manager.q1@cinemadb.vn','cskh@cinemadb.vn','khachhang1@gmail.com'))<>4 THROW 51005, 'Missing demo accounts.', 1;\nIF NOT EXISTS(SELECT 1 FROM dbo.PHIM) OR NOT EXISTS(SELECT 1 FROM dbo.SUATCHIEU) OR NOT EXISTS(SELECT 1 FROM dbo.GHE) OR NOT EXISTS(SELECT 1 FROM dbo.BANGGIA) OR NOT EXISTS(SELECT 1 FROM dbo.SANPHAM) OR NOT EXISTS(SELECT 1 FROM dbo.KHUYENMAI) THROW 51005, 'Missing catalog fixture.', 1;\nPRINT 'PASS seed roles, permissions, mappings, accounts and catalog';\nGO`,
);
console.log(`Generated ${files.length} seed files.`);
