// R5.5 orchestration: canonical SQL sources and existing sqlcmd/mssql transport only.
import assert from 'node:assert/strict';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, dbRoot, read, write, query, sqlcmd, expandSql, credentials } from './lib.mjs';
import { queries } from './inventory.mjs';
import { verify } from './verify.mjs';
import { validateTestName, preflight, authorize, targetGuard, literal, identifier, hash } from './test-target.mjs';

export function prepare(entry, database, seedDate) {
  validateTestName(database);
  if (seedDate && !/^\d{4}-\d{2}-\d{2}$/.test(seedDate)) throw new Error('Invalid SQL-derived business date.');
  const text = expandSql(entry).replaceAll('CinemaBookingDB', database).replaceAll('$(SeedDate)', seedDate || '');
  const uses = [...text.matchAll(/^\s*USE\s+(\[?\w+\]?);/gmi)].map(match => match[1].replaceAll(/[\[\]]/g, ''));
  assert.ok(uses.every(name => name === database || name === 'master'), 'Unexpected cross-database USE');
  return text;
}

function fingerprints(database, integrated) {
  const manifest = JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json'))).expected;
  const tables = manifest.objects.filter(object => object.type.trim() === 'U').map(table => {
    const keys = manifest.indexes.filter(index => index.tableName === table.name && index.is_primary_key && index.key_ordinal > 0)
      .sort((a, b) => a.key_ordinal - b.key_ordinal).map(index => identifier(index.columnName)).join(',');
    assert.ok(keys, 'Fingerprint needs deterministic primary key: ' + table.name);
    return `SELECT ${literal(table.name)} AS TableName,(SELECT COUNT_BIG(*) FROM dbo.${identifier(table.name)}) AS Rows,
      CONVERT(varchar(64),HASHBYTES('SHA2_256',(SELECT * FROM dbo.${identifier(table.name)} ORDER BY ${keys} FOR JSON PATH,INCLUDE_NULL_VALUES)),2) AS Sha256`;
  });
  // query() appends FOR JSON; SQL Server requires an outer SELECT around set operators.
  const data = query(`SELECT * FROM (${tables.join('\nUNION ALL\n')}) tableHashes`, { database, integrated });
  const metadataParts = Object.entries(queries).filter(([name]) => !['environment', 'rowcounts'].includes(name)).map(([name, text]) =>
    `SELECT ${literal(name)} AS Category,CONVERT(varchar(64),HASHBYTES('SHA2_256',(${text} FOR JSON PATH,INCLUDE_NULL_VALUES)),2) AS Sha256`);
  const metadata = query(`SELECT * FROM (${metadataParts.join('\nUNION ALL\n')}) metadataHashes`, { database, integrated });
  return { database, data, metadata }; // No row contents/passwords are exported.
}

export function publicReadSql() {
  const projection = name => /\bSELECT\s+([\s\S]*?)\bFROM dbo\.vw_LichChieuChiTiet/i.exec(read(path.join(dbRoot, `08_procedures/public/${name}.sql`)))?.[1];
  const list = projection('sp_Showtime_ListByMovie'), detail = projection('sp_Showtime_GetDetail');
  assert.ok(list && list.replaceAll(/\s/g, '') === detail?.replaceAll(/\s/g, ''), 'Public show read projection changed; review capture shape.');
  return `SET NOCOUNT ON;
    SELECT TOP(0) ${list} INTO #R55Shows FROM dbo.vw_LichChieuChiTiet;
    DECLARE @Movie int,@Show int,@ReadShows int=0,@SeatRows int=0;
    DECLARE movies CURSOR LOCAL FAST_FORWARD FOR SELECT PhimID FROM dbo.PHIM ORDER BY PhimID;
    OPEN movies; FETCH NEXT FROM movies INTO @Movie;
    WHILE @@FETCH_STATUS=0 BEGIN
      INSERT #R55Shows EXEC dbo.sp_Showtime_ListByMovie @PhimID=@Movie;
      FETCH NEXT FROM movies INTO @Movie;
    END;
    CLOSE movies; DEALLOCATE movies;
    IF (SELECT COUNT(*) FROM #R55Shows)<>24
      OR EXISTS(SELECT SuatChieuID FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1 EXCEPT SELECT SuatChieuID FROM #R55Shows)
      OR EXISTS(SELECT SuatChieuID FROM #R55Shows EXCEPT SELECT SuatChieuID FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1)
      THROW 51055,'Public list differs from bookable view.',1;
    SELECT TOP(1) @Show=SuatChieuID FROM #R55Shows ORDER BY SuatChieuID;
    SELECT TOP(0) GheID,PhongID,HangGhe,SoGhe,TenGhe,LoaiGhe,GiaVe,TrangThaiGhe INTO #R55Seats FROM dbo.fn_DanhSachGheSuatChieu(@Show);
    DECLARE shows CURSOR LOCAL FAST_FORWARD FOR SELECT SuatChieuID FROM dbo.vw_LichChieuChiTiet WHERE IsBookable=1 ORDER BY SuatChieuID;
    OPEN shows; FETCH NEXT FROM shows INTO @Show;
    WHILE @@FETCH_STATUS=0 BEGIN
      DELETE FROM #R55Shows; DELETE FROM #R55Seats;
      INSERT #R55Shows EXEC dbo.sp_Showtime_GetDetail @SuatChieuID=@Show;
      INSERT #R55Seats EXEC dbo.sp_Seat_ListByShowtime @SuatChieuID=@Show;
      IF (SELECT COUNT(*) FROM #R55Shows WHERE SuatChieuID=@Show)<>1 OR (SELECT COUNT(*) FROM #R55Seats)<>40
         OR EXISTS(SELECT 1 FROM #R55Seats g JOIN dbo.SUATCHIEU s ON s.SuatChieuID=@Show WHERE g.PhongID<>s.PhongID OR g.GiaVe<>dbo.fn_TinhGiaVe(@Show,g.GheID) OR g.TrangThaiGhe<>N'Trống')
        THROW 51055,'Public detail/seat read mismatch.',1;
      SET @ReadShows+=1; SET @SeatRows+=(SELECT COUNT(*) FROM #R55Seats);
      FETCH NEXT FROM shows INTO @Show;
    END;
    CLOSE shows; DEALLOCATE shows;
    SELECT N'R55-PUBLIC-READS' AS TestID,@ReadShows AS Details,@SeatRows AS SeatRows,N'PASS' AS Result;
    DROP TABLE #R55Shows; DROP TABLE #R55Seats;
    IF @@TRANCOUNT<>0 THROW 51055,'Public reads leaked a transaction.',1;`;
}

function normalized(database, integrated, seedDate) {
  const options = { database, integrated };
  const select = text => query(text, options);
  return {
    shows: select(`SELECT SuatChieuID,PhimID,PhongID,DinhDang,GiaVeCoBan,TrangThai,
      DATEDIFF(DAY,${literal(seedDate)},dbo.fn_NgayKinhDoanh(ThoiGianBatDau)) AS RelativeDay,
      CONVERT(varchar(8),CONVERT(time,dbo.fn_GioRap(ThoiGianBatDau)),108) AS LocalTime,
      DATEDIFF(MINUTE,ThoiGianBatDau,ThoiGianKetThuc) AS Duration FROM dbo.SUATCHIEU ORDER BY SuatChieuID`),
    orders: select(`SELECT CASE WHEN EXISTS(SELECT 1 FROM dbo.BOITHUONG_HUYSUAT b WHERE b.DonDatVeID=d.DonDatVeID) THEN 'COMPENSATED'
      WHEN s.ThoiGianKetThuc<dbo.fn_BayGio() THEN 'HISTORY' WHEN d.TrangThai=N'Chờ thanh toán' THEN 'PENDING'
      WHEN d.TrangThai=N'Đã thanh toán' THEN 'PAID' WHEN d.TrangThai=N'Hết hạn' THEN 'EXPIRED' ELSE 'CANCELED' END AS Scenario,
      n.Email,d.SuatChieuID,d.TrangThai,d.TongTienVe,d.TongTienDoAn,d.TienGiamGia,
      (SELECT g.HangGhe,g.SoGhe,v.GiaVe,v.TrangThai FROM dbo.CHITIETVE v JOIN dbo.GHE g ON g.GheID=v.GheID WHERE v.DonDatVeID=d.DonDatVeID ORDER BY g.HangGhe,g.SoGhe FOR JSON PATH) AS Tickets,
      (SELECT f.SanPhamID,f.SoLuong,f.DonGia FROM dbo.CHITIETDOAN f WHERE f.DonDatVeID=d.DonDatVeID ORDER BY f.SanPhamID FOR JSON PATH) AS Food,
      (SELECT t.PhuongThuc,t.SoTien,t.TrangThai,t.GhiChu FROM dbo.THANHTOAN t WHERE t.DonDatVeID=d.DonDatVeID ORDER BY t.ThanhToanID FOR JSON PATH) AS Payments
      FROM dbo.DONDATVE d JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=d.NguoiDungID JOIN dbo.SUATCHIEU s ON s.SuatChieuID=d.SuatChieuID ORDER BY Scenario`),
    complaints: select(`SELECT n.Email,k.TieuDe,k.TrangThai,CASE WHEN k.DonDatVeID IS NULL THEN 0 ELSE 1 END AS LinkedOrder,
      (SELECT actor.Email,x.NoiDungXuLy,x.TrangThaiSauXuLy FROM dbo.XULY_KHIEUNAI x JOIN dbo.NGUOIDUNG actor ON actor.NguoiDungID=x.NguoiXuLyID WHERE x.KhieuNaiID=k.KhieuNaiID ORDER BY x.XuLyID FOR JSON PATH) AS History
      FROM dbo.KHIEUNAI k JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=k.NguoiDungID ORDER BY k.TieuDe`),
    reviews: select('SELECT n.Email,r.PhimID,r.SoSao,r.NoiDung FROM dbo.DANHGIAPHIM r JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=r.NguoiDungID ORDER BY n.Email,r.PhimID'),
    compensation: select('SELECT n.Email,d.SuatChieuID,b.DiemBoiThuong FROM dbo.BOITHUONG_HUYSUAT b JOIN dbo.DONDATVE d ON d.DonDatVeID=b.DonDatVeID JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=d.NguoiDungID ORDER BY n.Email,d.SuatChieuID'),
    points: select('SELECT n.Email,h.DiemTichLuy FROM dbo.HOSOKHACHHANG h JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=h.NguoiDungID ORDER BY n.Email'),
    promotions: select('SELECT MaCode,SoLuong,SoLuongDaDung FROM dbo.KHUYENMAI ORDER BY MaCode'),
  };
}

export async function main(args = process.argv.slice(2)) {
  const mode = args[0] || 'preflight-test';
  if (!['preflight-test', 'build-test', 'fixture-test', 'rebuild-test'].includes(mode)) throw new Error('Unknown test pipeline mode.');
  const option = key => args.find(arg => arg.startsWith('--' + key + '='))?.slice(key.length + 3);
  const database = validateTestName(option('database') || 'CinemaBookingDB_Test');
  const integrated = args.includes('--integrated');
  const seedOnly = mode === 'build-test' || args.includes('--seed-only');
  if (mode === 'fixture-test' && seedOnly) throw new Error('Fixture-test cannot use --seed-only.');
  if (credentials().NODE_ENV === 'production') throw new Error('Test pipeline is local/development-only.');
  if (option('seed-date')) throw new Error('Test seed date comes from SQL Server helpers; caller clock overrides are refused.');
  const runID = new Date().toISOString().replaceAll(/[:.]/g, '-') + '-' + crypto.randomUUID().slice(0, 8);
  const dir = path.join(root, 'docs/evidence/r55/runs', runID);
  const result = { runID, mode, seedOnly, database, status: 'RUNNING', startedAt: new Date().toISOString(), steps: [] };
  const save = () => write(path.join(dir, 'result.json'), result);
  const step = (id, scenario, expected, work) => {
    console.log(`RUN ${id}: ${scenario}`);
    const record = { testID: id, scenario, expected, status: 'RUNNING', startedAt: new Date().toISOString() };
    result.steps.push(record); save();
    try {
      const actual = work(); record.actual = actual ?? 'Completed without error'; record.status = 'PASS'; record.exitCode = 0;
      console.log(`PASS ${id}`); return actual;
    } catch (error) {
      const secret = credentials().DB_PASSWORD;
      record.actual = secret ? String(error.message).replaceAll(secret, '[REDACTED]') : error.message;
      record.status = 'FAIL'; record.exitCode = 1; throw error;
    } finally { record.finishedAt = new Date().toISOString(); save(); }
  };
  let mainBefore, current;
  const execute = (name, text, connection = database) => {
    const output = sqlcmd(text, { database: connection, integrated, file: true });
    write(path.join(dir, name + '.log'), output); return { evidence: name + '.log', result: 'SQL completed; all THROW assertions accepted' };
  };
  try {
    const gate = step('R55-TARGET', 'Read-only instance, database and physical file preflight', 'Exact allowed disposable target', () => preflight(database, integrated));
    write(path.join(dir, 'preflight.json'), gate);
    if (mode === 'preflight-test') {
      result.status = 'PREFLIGHT PASS'; console.log(JSON.stringify({ database, server: gate.server.ServerName, existing: !!gate.target, files: gate.target?.files || gate.expectedNewFiles, confirmation: gate.confirmation, evidence: dir }));
      return result;
    }
    step('R55-AUTHORIZE', 'Confirm reviewed target and separate existing-target reset opt-in', 'Confirmation tokens match live identity', () => {
      if (mode === 'fixture-test') {
        if (!gate.target || option('confirm-target') !== gate.confirmation) throw new Error('Fixture-test requires an existing target and exact reviewed --confirm-target token.');
      } else authorize(gate, option('confirm-target'), option('confirm-reset'), mode === 'rebuild-test');
    });
    if (gate.main) mainBefore = step('R55-MAIN-BEFORE', 'Fingerprint main read-only before test writes', '27 table hashes and metadata hashes, no exported rows', () => fingerprints('CinemaBookingDB', integrated));
    if (mode !== 'fixture-test') {
      const latest = preflight(database, integrated);
      assert.equal(latest.confirmation, gate.confirmation, 'Target changed after confirmation');
      if (gate.target) step('R55-RESET', 'Reset only explicitly confirmed existing disposable database', 'Same server/GUID/files in destructive SQL session', () => execute('reset',
        `USE master;\n${gate.sqlGuard}\n` + prepare('00_database/001_drop_database.sql', database), 'master'));
      const empty = preflight(database, integrated);
      assert.equal(empty.target, null, 'Create step requires absent target');
      step('R55-BUILD', 'Build canonical objects in existing dependency order', 'Fresh database, no second schema source', () => execute('build',
        `USE master;\n${empty.sqlGuard}\n` + prepare('build-objects.sql', database), 'master'));
    }
    current = preflight(database, integrated);
    assert.ok(current.target, 'Created/existing target must be reverified');
    result.targetIdentity = { server: current.server.ServerName, target: current.target };
    const context = current.sqlGuard + `\nIF DB_NAME()<>${literal(database)} THROW 51055,'Wrong current test database.',1;\nEXEC sys.sp_set_session_context @key=N'R55Target',@value=${literal(database)};\n`;
    if (mode !== 'fixture-test') {
      const [clock] = query('SELECT dbo.fn_BayGio() AS UtcNow,CONVERT(char(10),dbo.fn_NgayKinhDoanh(dbo.fn_BayGio()),126) AS SeedDate', { database, integrated });
      result.clock = clock;
      const seedPrelude = context + `IF dbo.fn_NgayKinhDoanh(dbo.fn_BayGio())<>CONVERT(date,${literal(clock.SeedDate)},126) THROW 51055,'SQL business date changed before seed.',1;\nIF EXISTS(SELECT 1 FROM dbo.NGUOIDUNG) OR EXISTS(SELECT 1 FROM dbo.VAITRO) THROW 51055,'Fresh seed must not skip via sentinel.',1;\n`;
      step('R55-SEED', 'Canonical Base/Dynamic seed using SQL business date', 'Full seed executed on fresh target in one session', () => execute('seed', seedPrelude + prepare('10_seed/seed-all.sql', database, clock.SeedDate)));
    } else {
      const [clock] = query('SELECT dbo.fn_BayGio() AS UtcNow,CONVERT(char(10),dbo.fn_NgayKinhDoanh(dbo.fn_BayGio()),126) AS SeedDate', { database, integrated });
      result.clock = clock;
    }
    step('R55-OBJECTS', 'Existing comprehensive schema/object/dependency verification', 'Canonical baseline matches runtime', () => execute('objects', context + prepare('12_verify/verify_database.sql', database)));
    step('R55-MODULE-PARITY', 'Existing source module verification and actual inventory', '159 module definitions and full metadata', () => {
      const actual = verify(database, integrated); write(path.join(dir, 'objects.json'), actual);
      return { modules: Object.keys(JSON.parse(read(path.join(dbRoot, 'baseline-manifest.json'))).modules).length, tables: actual.objects.filter(object => object.type.trim() === 'U').length, evidence: 'objects.json' };
    });
    step('R55-SEED-INVARIANTS', 'Counts, trusted constraints, UTC/release/overlap and ID contracts', '376 base rows / 8 past / 24 bookable / 32 shows', () => execute('seed-verification', context +
      `EXEC sys.sp_set_session_context @key=N'R55SeedDate',@value=${literal(result.clock.SeedDate)};\n` + expandSql('12_verify/r55_seed.sql')));
    step('R55-PUBLIC-READS', 'Actual public list/detail/seat SPs for every future show', '24 details / 960 seat rows, price/room/availability correct', () => execute('public-reads', context + publicReadSql()));
    if (seedOnly) {
      result.status = 'PASS';
      result.completedScope = 'Build/seed and public read verification; transaction tables remain empty for fixture-test';
      return result;
    }
    const beforeRollback = fingerprints(database, integrated);
    const fixtureContext = context + `EXEC sys.sp_set_session_context @key=N'R54DisposableTarget',@value=${literal(database)};\n`;
    step('R55-ROLLBACK', 'R5.4 default rollback and immediate no-open-transaction assertion', 'All embedded fixture invariants PASS; baseline data/metadata unchanged', () => {
      execute('fixture-rollback', fixtureContext + expandSql('10_seed/test_fixture/transaction-fixture.sql') + "IF @@TRANCOUNT<>0 OR XACT_STATE()<>0 THROW 51055,'Rollback leaked a transaction.',1;\n");
      const after = fingerprints(database, integrated); assert.deepEqual(after, beforeRollback, 'Default rollback changed baseline');
      write(path.join(dir, 'rollback-fingerprints.json'), { before: beforeRollback, after, status: 'PASS', identityCountersExcluded: true });
      return { evidence: ['fixture-rollback.log', 'rollback-fingerprints.json'] };
    });
    step('R55-COMMIT', 'R5.4 positive commit then immediate lifecycle/payment/seat assertions', '6/7/5/4/1/5/7/1 rows, live pending, monetary/points/quota/history valid', () => execute('fixture-commit', fixtureContext +
      "EXEC sys.sp_set_session_context @key=N'R54PersistFixtures',@value=1;\n" + expandSql('10_seed/test_fixture/transaction-fixture.sql') + expandSql('12_verify/r55_fixture.sql')));
    const beforeNegative = fingerprints(database, integrated);
    step('R55-NEGATIVE', 'R5.4 review eligibility/duplicate/foreign order probes', '50004 / 50040 / 50041; all tables/metadata unchanged', () => {
      execute('negative-probes', fixtureContext + expandSql('10_seed/test_fixture/negative-probes.sql'));
      const after = fingerprints(database, integrated); assert.deepEqual(after, beforeNegative, 'Negative probes changed committed fixture');
      write(path.join(dir, 'negative-fingerprints.json'), { before: beforeNegative, after, status: 'PASS', identityCountersExcluded: true });
      return { evidence: ['negative-probes.log', 'negative-fingerprints.json'] };
    });
    const snapshot = step('R55-SNAPSHOT', 'Normalize seeded schedule and fixture business relationships', 'Exclude random refs/identities/absolute instants, retain authoritative SQL monetary values', () => normalized(database, integrated, result.clock.SeedDate));
    write(path.join(dir, 'normalized.json'), snapshot);
    result.normalizedHash = hash(snapshot);
    result.status = 'PASS';
  } catch (error) {
    result.status = 'FAIL'; const secret = credentials().DB_PASSWORD;
    result.error = secret ? String(error.message).replaceAll(secret, '[REDACTED]') : error.message;
    console.error(result.error); process.exitCode = 1;
  } finally {
    if (mainBefore) {
      try { step('R55-MAIN-AFTER', 'Prove main unchanged after test success/failure', 'Same 27 table and metadata hashes', () => {
        const after = fingerprints('CinemaBookingDB', integrated); assert.deepEqual(after, mainBefore, 'Main fingerprint changed');
        write(path.join(dir, 'main-preservation.json'), { before: mainBefore, after, status: 'PASS' }); return { evidence: 'main-preservation.json', result: 'Exact equality' };
      }); } catch (error) { result.status = 'FAIL'; result.mainPreservationError = error.message; process.exitCode = 1; }
    }
    result.finishedAt = new Date().toISOString(); save(); console.log(`R55 ${result.status}: ${dir}`);
  }
  return result;
}

if (process.argv[1] === import.meta.filename) await main();
