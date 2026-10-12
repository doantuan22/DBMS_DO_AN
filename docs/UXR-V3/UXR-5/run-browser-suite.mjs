import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createEnvironment } from './test-environment.mjs';
import crypto from 'node:crypto';
const directory = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const evidence = { timestamp: new Date().toISOString(), runs: [], status: 'RUNNING' };
const fingerprint = async () => {
  const env = await createEnvironment({ phase: 'preservation' });
  try {
    const records = (await env.pool.request().query('SELECT NguoiDungID,VaiTroID,TrangThai FROM dbo.NGUOIDUNG ORDER BY NguoiDungID; SELECT * FROM dbo.PHANCONG_RAP ORDER BY PhanCongID; SELECT * FROM dbo.PHIM ORDER BY PhimID; SELECT * FROM dbo.PHIM_DIENVIEN ORDER BY PhimID,DienVienID; SELECT * FROM dbo.PHIM_THELOAI ORDER BY PhimID,TheLoaiID; SELECT * FROM dbo.DIENVIEN ORDER BY DienVienID; SELECT * FROM dbo.THELOAI ORDER BY TheLoaiID; SELECT * FROM dbo.SANPHAM ORDER BY SanPhamID; SELECT * FROM dbo.KHUYENMAI ORDER BY KhuyenMaiID; SELECT * FROM dbo.KHIEUNAI ORDER BY KhieuNaiID; SELECT * FROM dbo.XULY_KHIEUNAI ORDER BY XuLyID; SELECT DonDatVeID,TongTienVe,TongTienDoAn,TienGiamGia,TrangThai FROM dbo.DONDATVE ORDER BY DonDatVeID; SELECT * FROM dbo.CHITIETVE ORDER BY VeID; SELECT * FROM dbo.CHITIETDOAN ORDER BY ChiTietDoAnID; SELECT ThanhToanID,DonDatVeID,SoTien,TrangThai FROM dbo.THANHTOAN ORDER BY ThanhToanID; SELECT VaiTroID,QuyenID FROM dbo.VAITRO_QUYEN ORDER BY VaiTroID,QuyenID;')).recordsets;
    return { counts: env.evidence.counts, hash: crypto.createHash('sha256').update(JSON.stringify(records)).digest('hex'), identity: env.evidence.identity };
  } finally { await env.close('preservation-read.json'); }
};
evidence.before = await fingerprint();
const runs = [
  ['run-screen-capture.mjs', ['--before'], 'before-screens.json'],
  ['run-5a-browser.mjs', [], '5A-browser.json'], ['run-5b-browser.mjs', [], '5B-browser.json'], ['run-5c-browser.mjs', [], '5C-browser.json'], ['run-5d-browser.mjs', [], '5D-browser.json'],
  ['run-commerce-edges.mjs', [], 'commerce-edges.json'], ['run-ui-edges.mjs', [], 'ui-edges.json'], ['run-screen-capture.mjs', [], 'final-after-screens.json'],
];
for (const [script, args, report] of runs) {
  const old = path.join(directory, report); if (fs.existsSync(old)) { const attempts = path.join(directory, 'attempts'); fs.mkdirSync(attempts, { recursive: true }); fs.copyFileSync(old, path.join(attempts, `${Date.now()}-${report}`)); }
  const exitCode = await new Promise((resolve) => { const child = spawn(process.execPath, [path.join(directory, script), ...args], { windowsHide: true, stdio: 'inherit' }); child.once('exit', resolve); child.once('error', () => resolve(-1)); });
  const data = JSON.parse(fs.readFileSync(old, 'utf8')); evidence.runs.push({ script, args, report, exitCode, status: data.status, checks: data.checks.length, networkRecords: data.requests.length, runtimeErrors: data.runtimeErrors.length, consoleErrors: data.consoleErrors.length, cleanup: data.cleanup });
  if (exitCode !== 0 || !['PASS', 'CAPTURED'].includes(data.status)) { evidence.status = 'FAIL'; break; }
}
evidence.after = await fingerprint(); evidence.preservation = evidence.before.hash === evidence.after.hash ? 'PASS' : 'FAIL';
evidence.status = evidence.status === 'FAIL' || evidence.preservation === 'FAIL' ? 'FAIL' : 'PASS';
evidence.browserChecks = evidence.runs.filter((r) => r.status === 'PASS' && !r.script.includes('commerce')).reduce((n, r) => n + r.checks, 0);
fs.writeFileSync(path.join(directory, 'browser-suite.json'), JSON.stringify(evidence, null, 2)); console.log(JSON.stringify({ status: evidence.status, runs: evidence.runs.length, browserChecks: evidence.browserChecks, preservation: evidence.preservation })); if (evidence.status === 'FAIL') process.exitCode = 1;
