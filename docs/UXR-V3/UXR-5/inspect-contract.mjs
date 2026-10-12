import { createEnvironment } from './test-environment.mjs';
const e = await createEnvironment();
try { const m = (await e.api(1, 'GET', '/movies')).movies; e.evidence.movieRelations = m.map(({ PhimID, TheLoaiIdList, DanhSachDienVienJson }) => ({ PhimID, TheLoaiIdList, DanhSachDienVienJson })); e.evidence.sqlRelations = (await e.pool.request().query('SELECT p.PhimID,(SELECT COUNT(*) FROM dbo.PHIM_DIENVIEN c WHERE c.PhimID=p.PhimID) AS CastCount FROM dbo.PHIM p')).recordset; console.log(JSON.stringify({ api: e.evidence.movieRelations, sql: e.evidence.sqlRelations }, null, 2)); }
finally { await e.close('contract-read.json'); }
