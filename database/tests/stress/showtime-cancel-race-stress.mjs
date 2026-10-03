import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const rounds = Number(process.env.STRESS_ROUNDS ?? '500');
const database = process.env.STRESS_DB_DATABASE ?? process.argv.find((arg) => arg.startsWith('--database='))?.slice('--database='.length);
const server = process.env.STRESS_SQL_SERVER ?? 'localhost';
const expectedSqlErrors = new Set([50022, 50111, 50113, 50121]);

if (process.env.STRESS_CONFIRM_DISPOSABLE !== 'yes') {
  console.error('Refusing to run without STRESS_CONFIRM_DISPOSABLE=yes.');
  process.exit(2);
}
if (!database || database === 'CinemaBookingDB') {
  console.error('Set STRESS_DB_DATABASE to a disposable database other than CinemaBookingDB.');
  process.exit(2);
}
if (!Number.isInteger(rounds) || rounds < 500 || rounds > 2000) {
  console.error('STRESS_ROUNDS must be an integer from 500 through 2000.');
  process.exit(2);
}

async function sql(query) {
  try {
    const result = await execFileAsync('sqlcmd', [
      '-S', server, '-E', '-C', '-d', database, '-I', '-f', '65001', '-b', '-h', '-1', '-W', '-s', '|', '-Q', `SET NOCOUNT ON; ${query}`,
    ], { windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
    return { ok: true, code: 0, output: result.stdout.trim() };
  } catch (error) {
    const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
    const match = /Msg\s+(\d+)/i.exec(output);
    return { ok: false, code: Number(match?.[1] ?? error.code ?? -1), output };
  }
}

function lastValue(output) {
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1);
}

async function expectSetup(query, label) {
  const result = await sql(query);
  if (!result.ok) throw new Error(`${label} failed (${result.code}): ${result.output}`);
  return lastValue(result.output);
}

async function parallelSql(tasks) {
  return Promise.all(tasks.map(async ([label, query]) => [label, await sql(query)]));
}

async function cleanup(showtimeId) {
  if (!showtimeId) return;
  const result = await sql(`
    DECLARE @Suat INT=${Number(showtimeId)};
    DELETE t FROM dbo.THANHTOAN t INNER JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=@Suat;
    DELETE cv FROM dbo.CHITIETVE cv INNER JOIN dbo.DONDATVE d ON d.DonDatVeID=cv.DonDatVeID WHERE d.SuatChieuID=@Suat;
    DELETE dbo.DONDATVE WHERE SuatChieuID=@Suat;
    DELETE dbo.SUATCHIEU WHERE SuatChieuID=@Suat;`);
  if (!result.ok) throw new Error(`Cleanup for showtime ${showtimeId} failed (${result.code}): ${result.output}`);
}

let activeShowtime;
let deadlocks = 0;
let allowedRaceConflicts = 0;
try {
  const fixture = await expectSetup(`
    SELECT TOP(1) p.PhimID,pc.PhongID,
      (SELECT TOP(1) g.GheID FROM dbo.GHE g WHERE g.PhongID=pc.PhongID AND g.TrangThai=N'Hoạt động' ORDER BY g.GheID),
      (SELECT TOP(1) g.GheID FROM dbo.GHE g WHERE g.PhongID=pc.PhongID AND g.TrangThai=N'Hoạt động' ORDER BY g.GheID DESC),
      (SELECT TOP(1) nd.NguoiDungID FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO v ON v.VaiTroID=nd.VaiTroID WHERE v.MaVaiTro='KHACH_HANG' AND nd.TrangThai=N'Hoạt động' AND nd.NguoiDungID=5),
      (SELECT TOP(1) nd.NguoiDungID FROM dbo.NGUOIDUNG nd JOIN dbo.VAITRO v ON v.VaiTroID=nd.VaiTroID WHERE v.MaVaiTro='KHACH_HANG' AND nd.TrangThai=N'Hoạt động' AND nd.NguoiDungID=6),pc.LoaiPhong
    FROM dbo.PHONGCHIEU pc CROSS JOIN (SELECT TOP(1) PhimID FROM dbo.PHIM ORDER BY PhimID) p
    WHERE pc.TrangThai=N'Hoạt động'
      AND (SELECT COUNT(*) FROM dbo.GHE g WHERE g.PhongID=pc.PhongID AND g.TrangThai=N'Hoạt động')>=2
      AND NOT EXISTS(SELECT 1 FROM dbo.SUATCHIEU s WHERE s.PhongID=pc.PhongID AND s.ThoiGianBatDau>='2099-01-01' AND s.ThoiGianBatDau<'2100-01-01')
    ORDER BY pc.PhongID;`, 'Fixture query');
  const [movieId, roomId, seatOne, seatTwo, customerOne, customerTwo, format] = fixture.split('|');
  if (![movieId, roomId, seatOne, seatTwo, customerOne, customerTwo, format].every(Boolean)) throw new Error('Need active customers 5/6, a movie, an active room with two seats, and a room with no 2099 showtime data.');

  for (let round = 0; round < rounds; round += 1) {
    const start = `DATEADD(MINUTE,${round * 5},CONVERT(DATETIME2,'2099-01-01T00:00:00',126))`;
    activeShowtime = await expectSetup(`
      INSERT dbo.SUATCHIEU(PhimID,PhongID,ThoiGianBatDau,ThoiGianKetThuc,DinhDang,GiaVeCoBan,TrangThai)
      VALUES(${movieId},${roomId},${start},DATEADD(MINUTE,3,${start}),N'${format}',80000,N'Mở bán');
      SELECT CAST(SCOPE_IDENTITY() AS INT);`, `Create showtime ${round + 1}`);
    activeShowtime = Number(activeShowtime);

    let orderId;
    try {
      orderId = Number(await expectSetup(`DECLARE @ID INT; EXEC dbo.sp_Booking_Create @NguoiDungID=${customerOne},@SuatChieuID=${activeShowtime},@DanhSachGheId='${seatOne}',@NewDonDatVeID=@ID OUTPUT; SELECT @ID;`, `Seed order ${round + 1}`));
      const paymentId = Number(await expectSetup(`DECLARE @ID INT,@Code VARCHAR(100); EXEC dbo.sp_Payment_CreateAttempt @DonDatVeID=${orderId},@PhuongThuc=N'MOMO',@ThanhToanID=@ID OUTPUT,@MaGiaoDich=@Code OUTPUT; SELECT @ID;`, `Seed payment ${round + 1}`));

      const calls = await parallelSql([
        ['booking', `DECLARE @ID INT; EXEC dbo.sp_Booking_Create @NguoiDungID=${customerTwo},@SuatChieuID=${activeShowtime},@DanhSachGheId='${seatTwo}',@NewDonDatVeID=@ID OUTPUT; SELECT @ID;`],
        ['payment', `EXEC dbo.sp_Payment_UpdateResult @ThanhToanID=${paymentId},@TrangThaiThanhToan=N'Thành công'; SELECT N'DONE';`],
        ['cancel', `EXEC dbo.sp_Showtime_CancelCascade @SuatChieuID=${activeShowtime},@NguoiDungID=NULL,@LyDo=N'AUDIT3 race stress'; SELECT N'DONE';`],
      ]);
      for (const [label, result] of calls) {
        if (!result.ok) {
          if (result.code === 1205) deadlocks += 1;
          if (expectedSqlErrors.has(result.code)) allowedRaceConflicts += 1;
          else throw new Error(`Round ${round + 1} ${label} failed (${result.code}): ${result.output}`);
        }
      }

      const invariants = await expectSetup(`
        SELECT CASE WHEN s.TrangThai=N'Đã hủy'
          AND NOT EXISTS(SELECT 1 FROM dbo.DONDATVE d JOIN dbo.THANHTOAN t ON t.DonDatVeID=d.DonDatVeID WHERE d.SuatChieuID=s.SuatChieuID AND d.TrangThai=N'Đã thanh toán' AND t.TrangThai=N'Thành công')
          AND NOT EXISTS(SELECT 1 FROM dbo.DONDATVE d JOIN dbo.CHITIETVE cv ON cv.DonDatVeID=d.DonDatVeID WHERE d.SuatChieuID=s.SuatChieuID AND cv.TrangThai<>N'Đã hủy')
          AND NOT EXISTS(SELECT 1 FROM dbo.DONDATVE d WHERE d.SuatChieuID=s.SuatChieuID AND d.TrangThai IN(N'Chờ thanh toán',N'Đã thanh toán'))
          THEN 1 ELSE 0 END FROM dbo.SUATCHIEU s WHERE s.SuatChieuID=${activeShowtime};`, `Invariant round ${round + 1}`);
      if (invariants !== '1') throw new Error(`Round ${round + 1} violated lifecycle invariants (I11/I12/orders/tickets).`);
      if (deadlocks) throw new Error(`SQL deadlock 1205 occurred by round ${round + 1}.`);
    } finally {
      await cleanup(activeShowtime);
      activeShowtime = undefined;
    }

    if ((round + 1) % 25 === 0) console.log(`Passed ${round + 1}/${rounds}; allowed race conflicts=${allowedRaceConflicts}; deadlocks=${deadlocks}`);
  }
  console.log(`PASS - ${rounds} cancel/book/payment races; I11/I12 clean after every round; allowed race conflicts=${allowedRaceConflicts}; deadlocks=${deadlocks}.`);
} catch (error) {
  if (activeShowtime) {
    try { await cleanup(activeShowtime); } catch (cleanupError) { console.error(cleanupError.message); }
  }
  console.error(error.message);
  process.exitCode = 1;
}
