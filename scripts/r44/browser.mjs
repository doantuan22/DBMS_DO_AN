import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js';
import { sql,root,write,env,database,disposable,connect,snapshot,summarize } from './common.mjs';
import { createFixture,cleanupFixture } from '../r21/fixtures.mjs';
disposable();Object.assign(process.env,env,{DB_DATABASE:database});
const {createApp}=await import('../../backend/src/app.js'),{closePool}=await import('../../backend/src/db/pool.js');
const pool=await connect(),before=await snapshot(pool);let f,backend,vite,child,profiles;
const pending = new Map(); let ws, nextId = 0;
try {
f=await createFixture(pool);
profiles=(await pool.request().query('SELECT * FROM dbo.HOSOKHACHHANG ORDER BY NguoiDungID')).recordset;
const promo=(await pool.request().input('ID',sql.Int,f.promotion).query('SELECT * FROM dbo.KHUYENMAI WHERE KhuyenMaiID=@ID')).recordset[0];
const fixture={show:f.show,product:f.product,promotion:f.promotion,code:f.code,promotionBody:{description:promo.MoTa,discountType:promo.LoaiGiamGia,discountValue:promo.GiaTriGiam,minimumOrder:promo.DonHangToiThieu,maximumDiscount:promo.GiamToiDa,startsAt:promo.NgayBatDau.toISOString(),endsAt:promo.NgayKetThuc.toISOString(),quantity:promo.SoLuong,status:promo.TrangThai}};
backend=createApp().listen(0,'127.0.0.1');await new Promise(r=>backend.once('listening',r));

const chrome = process.env.R44_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
if (!fs.existsSync(chrome)) throw Error('Chrome required (or set R44_CHROME_PATH).');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cinema-r44-browser-'));
const evidence = path.join(root, 'docs/evidence/r44');
vite = await createServer({ root: path.join(root, 'frontend'), configFile: path.join(root, 'frontend/vite.config.js'), appType: 'custom', server: { host: '127.0.0.1', port: 0, hmr: false, proxy:{'/api':`http://127.0.0.1:${backend.address().port}`}  } });
vite.middlewares.use((req, res, next) => {
  if (req.url !== '/__r44') return next();
  res.setHeader('Content-Type', 'text/html'); res.end('<html><body><script type="module">import "/@vite/client";</script></body></html>');
});
await vite.listen();
const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
child = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  const timer = setTimeout(() => { pending.delete(id); reject(Error(`CDP timeout: ${method}`)); }, 30000);
  pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw Error(result.result?.description || result.exceptionDetails.text);
  return result.result.value;
};
  const portFile = path.join(profile, 'DevToolsActivePort'), end = Date.now() + 15000;
  while (!fs.existsSync(portFile)) { if (Date.now() > end) throw Error('Chrome startup timeout'); await new Promise(r => setTimeout(r, 100)); }
  const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?${base}/__r44`, { method: 'PUT' })).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => {
    const result = JSON.parse(event.data);
    if (!result.id) return;
    const handler = pending.get(result.id); pending.delete(result.id);
    if (!handler) return;
    result.error ? handler.reject(Error(result.error.message)) : handler.resolve(result.result);
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/__r44' });
  const ready = Date.now() + 10000;
  while (!(await evaluate("document.readyState==='complete'"))) { if (Date.now() > ready) throw Error('Page timeout'); await new Promise(r => setTimeout(r, 50)); }
  const result = await evaluate(`(async()=>{const {testR44Ownership}=await import('/tests/r44-browser-fixture.jsx');return testR44Ownership(${JSON.stringify(fixture)});})()`);
  assert.equal(result.status,'PASS');assert.ok(result.checks.every(row=>row.status==='PASS'));
  await pool.request().input('Show',sql.Int,f.show).query('DELETE t FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=@Show');
  await cleanupFixture(pool,f);f=null;
  for(const p of profiles)await pool.request().input('User',sql.Int,p.NguoiDungID).input('Points',sql.Int,p.DiemTichLuy).query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@User');
  const after=await snapshot(pool);assert.deepEqual(summarize(after),summarize(before));
  write(path.join(evidence,'browser.json'),{status:'PASS',engine:'Dedicated headless Chrome; actual BookingPreparation/PaymentPage -> Vite proxy -> Backend -> real SQL Server; no HTTP mocking',database,result,cleanup:'PASS',before:summarize(before),after:summarize(after)});
  console.log(`PASS real ownership UI: ${result.checks.length} checks; provisional preview, rejection, authoritative booking and payment.`);
} catch (error) {
  write(path.join(root,'docs/evidence/r44/browser.json'), { status: 'FAIL', error: error.message }); throw error;
} finally {
  ws?.close();child?.kill();if(vite)await vite.close();if(backend)await new Promise(r=>backend.close(r));await closePool();if(f){await pool.request().input('Show',sql.Int,f.show).query('DELETE t FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID WHERE d.SuatChieuID=@Show');await cleanupFixture(pool,f);}
  for(const p of profiles??[])await pool.request().input('User',sql.Int,p.NguoiDungID).input('Points',sql.Int,p.DiemTichLuy).query('UPDATE dbo.HOSOKHACHHANG SET DiemTichLuy=@Points WHERE NguoiDungID=@User');await pool.close();
  // Dedicated profile is left in the OS temp directory; never touches the user browser profile.
}
