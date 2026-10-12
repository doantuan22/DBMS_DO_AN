import { createEnvironment } from './test-environment.mjs';
const e = await createEnvironment({ phase: 'preflight' });
try { e.evidence.actors = (await e.pool.request().query('SELECT n.NguoiDungID AS id,v.MaVaiTro AS role FROM dbo.NGUOIDUNG n JOIN dbo.VAITRO v ON v.VaiTroID=n.VaiTroID ORDER BY n.NguoiDungID')).recordset; console.log(JSON.stringify(e.evidence.actors)); }
finally { await e.close('actors-preflight.json'); }
