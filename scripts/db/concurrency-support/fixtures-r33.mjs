import assert from 'node:assert/strict';
import { sql } from './common-r33.mjs';
export { cleanSession } from './fixtures-r21.mjs';
export const statuses = ['Đang xử lý', 'Đã giải quyết', 'Đã đóng', 'Từ chối'];
export async function createFixture(pool) {
  const users = (
    await pool
      .request()
      .query(
        "SELECT n.NguoiDungID,n.Email,v.MaVaiTro FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID WHERE n.Email IN('admin@cinemadb.vn','khachhang1@gmail.com','khachhang2@gmail.com','manager.q1@cinemadb.vn') OR v.MaVaiTro='CSKH' ORDER BY n.NguoiDungID",
      )
  ).recordset;
  const f = {
    users,
    admin: users.find((u) => u.MaVaiTro === 'ADMIN').NguoiDungID,
    support: users.find((u) => u.MaVaiTro === 'CSKH').NguoiDungID,
    customer: users.find((u) => u.Email === 'khachhang1@gmail.com').NguoiDungID,
    otherCustomer: users.find((u) => u.Email === 'khachhang2@gmail.com').NguoiDungID,
    manager: users.find((u) => u.MaVaiTro === 'QUAN_LY_RAP').NguoiDungID,
    ids: [],
  };
  for (let i = 0; i < 6; i++) {
    const r = await createComplaint(
      pool,
      i === 4 ? f.otherCustomer : f.customer,
      `R33 complaint ${i}`,
    );
    f.ids.push(r.recordset[0].KhieuNaiID);
  }
  return f;
}
export function createComplaint(pool, user, title) {
  return pool
    .request()
    .input('NguoiDungID', sql.Int, user)
    .input('DonDatVeID', sql.Int, null)
    .input('LoaiKhieuNai', sql.NVarChar(100), 'R33 support')
    .input('TieuDe', sql.NVarChar(200), title)
    .input('NoiDung', sql.NVarChar(sql.MAX), 'R33 deterministic history fixture')
    .execute('dbo.sp_Complaint_Create');
}
export async function cleanupFixture(pool, f) {
  if (f) await pool.request().query(`DELETE dbo.KHIEUNAI WHERE KhieuNaiID IN(${f.ids.join(',')});`);
}
export async function state(pool, f) {
  const rs = (
    await pool
      .request()
      .query(
        `SELECT * FROM dbo.KHIEUNAI WHERE KhieuNaiID IN(${f.ids.join(',')}) ORDER BY KhieuNaiID;SELECT * FROM dbo.XULY_KHIEUNAI WHERE KhieuNaiID IN(${f.ids.join(',')}) ORDER BY XuLyID;SELECT * FROM dbo.vw_DanhSachKhieuNai WHERE KhieuNaiID IN(${f.ids.join(',')}) ORDER BY KhieuNaiID;`,
      )
  ).recordsets;
  return { parents: rs[0], history: rs[1], queue: rs[2] };
}
export function processing(
  pool,
  f,
  role,
  id,
  status,
  content = 'R33 canonical processing',
  identity,
) {
  return pool
    .request()
    .input('NguoiDungID', sql.Int, identity ?? f[role])
    .input('KhieuNaiID', sql.Int, id)
    .input('NoiDungXuLy', sql.NVarChar(sql.MAX), content)
    .input('TrangThaiSauXuLy', sql.NVarChar(50), status)
    .execute('dbo.sp_Support_Complaint_AddProcessing');
}
export function updateStatus(pool, f, role, id, status, identity) {
  return pool
    .request()
    .input('NguoiDungID', sql.Int, identity ?? f[role])
    .input('KhieuNaiID', sql.Int, id)
    .input('TrangThaiMoi', sql.NVarChar(50), status)
    .execute('dbo.sp_Support_Complaint_UpdateStatus');
}
export function bulk(pool, rows) {
  return pool
    .request()
    .input('Rows', sql.NVarChar(sql.MAX), JSON.stringify(rows))
    .query(
      `INSERT dbo.XULY_KHIEUNAI(KhieuNaiID,NguoiXuLyID,NoiDungXuLy,NgayXuLy,TrangThaiSauXuLy) SELECT complaint,actor,content,processedAt,status FROM OPENJSON(@Rows) WITH(complaint INT,actor INT,content NVARCHAR(MAX),processedAt DATETIME2(7),status NVARCHAR(50));`,
    );
}
export const event = (
  f,
  complaint,
  status,
  content,
  actor = f.support,
  processedAt = '2030-01-01T00:00:00.000Z',
) => ({ complaint, actor, status, content, processedAt });
export function latest(s, ids) {
  return ids.map((id) => {
    const rows = s.history.filter((x) => x.KhieuNaiID === id),
      last = rows.reduce((a, b) => (!a || b.XuLyID > a.XuLyID ? b : a), null);
    return {
      complaintId: id,
      latestId: last?.XuLyID ?? null,
      expectedStatus: last?.TrangThaiSauXuLy ?? 'Mới',
      actualStatus: s.parents.find((x) => x.KhieuNaiID === id)?.TrangThai,
    };
  });
}
export function assertLatest(s, ids) {
  const rows = latest(s, ids);
  for (const x of rows) assert.equal(x.actualStatus, x.expectedStatus, JSON.stringify(x));
  return rows;
}
export function preserved(initial, final, affected) {
  for (const p of initial.parents) {
    const row = final.parents.find((x) => x.KhieuNaiID === p.KhieuNaiID);
    assert.deepEqual({ ...row, TrangThai: p.TrangThai }, p);
    if (!affected.includes(p.KhieuNaiID)) assert.deepEqual(row, p);
  }
  for (const h of initial.history)
    assert.deepEqual(
      final.history.find((x) => x.XuLyID === h.XuLyID),
      h,
    );
  for (const id of initial.parents.map((p) => p.KhieuNaiID).filter((id) => !affected.includes(id)))
    assert.deepEqual(
      final.history.filter((h) => h.KhieuNaiID === id),
      initial.history.filter((h) => h.KhieuNaiID === id),
    );
}
