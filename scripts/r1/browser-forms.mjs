// Runs actual React portals with an isolated HTTP fixture; no database writes.
export async function testPortalForms() {
  const [{ default: React }, clientModule, { default: Manager }, { default: Admin }] = await Promise.all([
    import('/node_modules/.vite/deps/react.js'), import('/node_modules/.vite/deps/react-dom_client.js'),
    import('/src/pages/ManagerPortal.jsx'), import('/src/pages/AdminPortal.jsx'),
  ]);
  const { createRoot } = clientModule.default ?? clientModule;
  const writes = [];
  const showtime = { SuatChieuID: 1, PhimID: 1, PhongID: 1, ThoiGianBatDau: '2026-10-03T12:30:00.123Z', ThoiGianKetThuc: '2026-10-03T14:30:00.123Z', DinhDang: '2D', GiaVeCoBan: 80000, TrangThai: 'Chưa chiếu' };
  const promotion = { KhuyenMaiID: 1, MoTa: 'R1 fixture', LoaiGiamGia: 'Phần trăm', GiaTriGiam: 10, DonHangToiThieu: 0, GiamToiDa: 10000, NgayBatDau: '2026-10-03T12:30:00.123Z', NgayKetThuc: '2026-10-03T14:30:00.123Z', SoLuong: 100, TrangThai: 'Hoạt động' };
  const originalFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    const route = new URL(url, location.href).pathname;
    if (options.method && options.method !== 'GET') writes.push({ route, method: options.method, body: JSON.parse(options.body) });
    const payload = route === '/api/manager/cinemas' ? { cinemas: [{ id: 1, name: 'R1 cinema', city: 'Fixture' }] }
      : route.endsWith('/rooms') ? { rooms: [{ id: 1, name: 'R1 room', type: '2D' }] }
      : route === '/api/admin/showtimes' ? { showtimes: [showtime] }
      : route === '/api/admin/promotions' ? { promotions: [promotion] }
      : route.endsWith('/showtimes') ? { showtimes: [] }
      : route.endsWith('/pricing') ? { pricing: [] }
      : route.endsWith('/revenue') ? { revenue: [] } : { dashboard: {} };
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  const tick = () => new Promise(resolve => setTimeout(resolve, 20));
  const wait = async predicate => {
    const deadline = Date.now() + 2500;
    while (!predicate()) { if (Date.now() > deadline) throw Error('React portal fixture timed out: '+JSON.stringify({dom:container.innerHTML.slice(-2500),writes})); await tick(); }
  };
  const set = async (input, value) => {
    Object.getOwnPropertyDescriptor(input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
    await tick();
  };
  const button = text => [...container.querySelectorAll('button')].find(b => b.textContent === text);
  try {
    root.render(React.createElement(Manager));
    await wait(() => container.querySelector('input[placeholder="Movie ID"]'));
    const defaultLocal = container.querySelector('input[type="datetime-local"]').value;
    await set(container.querySelector('input[placeholder="Movie ID"]'), '1');
    const afterMovieChange = container.querySelector('input[type="datetime-local"]').value;
    if (defaultLocal !== afterMovieChange) throw Error('Changing movie ID changed local datetime state');
    await set(container.querySelector('input[placeholder="Movie ID"]').closest('form').querySelector('select'), '1');
    await set(container.querySelectorAll('input[type="datetime-local"]')[0], '2026-10-03T19:30');
    await set(container.querySelectorAll('input[type="datetime-local"]')[1], '2026-10-03T21:30');
    container.querySelector('input[placeholder="Movie ID"]').closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await wait(() => writes.some(w => w.route === '/api/manager/showtimes'));
    const manager = writes.find(w => w.route === '/api/manager/showtimes').body;
    root.render(React.createElement(Admin));
    await wait(() => button('Suất chiếu')); button('Suất chiếu').click();
    await wait(() => button('Sửa')); button('Sửa').click();
    await wait(() => container.querySelector('input[type="datetime-local"]')?.value.endsWith('30:00.123'));
    const adminEdit = container.querySelector('input[type="datetime-local"]').value;
    button('Lưu').closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await wait(() => writes.some(w => w.route === '/api/admin/showtimes/1'));
    const admin = writes.find(w => w.route === '/api/admin/showtimes/1').body;
    await tick(); await tick();
    button('Khuyến mãi').click(); await wait(() => container.querySelector('tbody')?.textContent.includes('R1 fixture')); button('Sửa').click();
    await wait(() => container.querySelector('input[type="datetime-local"]')?.value.endsWith('30:00.123'));
    button('Lưu').closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await wait(() => writes.some(w => w.route === '/api/admin/promotions/1'));
    const promo = writes.find(w => w.route === '/api/admin/promotions/1').body;
    await tick(); await tick();
    return { movieChangePreservesLocalState: true, manager, adminEdit, admin, promotion: promo };
  } finally { root.unmount(); container.remove(); window.fetch = originalFetch; }
}
