// Real browser event handlers on isolated HTTP fixtures; SP behavior is tested separately.
export async function testR7Pages() {
  await import('/src/index.css');
  const [{ default: React }, { createRoot }, { flushSync }, { MemoryRouter, Routes, Route }, { AuthContext },
    { default: Manager }, { default: Support }, { default: Cinema }] = await Promise.all([
    import('react'), import('react-dom/client'), import('react-dom'), import('react-router-dom'), import('/src/context/AuthContext.jsx'),
    import('/src/pages/ManagerPortal.jsx'), import('/src/pages/SupportPortal.jsx'), import('/src/pages/CinemaDetail.jsx'),
  ]);
  const box = document.createElement('div'); document.body.append(box);
  const root = createRoot(box), oldFetch = window.fetch, checks = [], calls = [];
  const check = (name, ok) => { if (!ok) throw Error(name); checks.push({ name, status: 'PASS' }); };
  const wait = async predicate => { const end = Date.now() + 10000; while (!predicate()) { if (Date.now() > end) throw Error('R7 browser timeout: ' + box.innerText); await new Promise(resolve => setTimeout(resolve, 20)); } };
  const settle = () => new Promise(resolve => setTimeout(resolve, 40));
  const button = text => [...box.querySelectorAll('button')].find(node => node.textContent === text);
  const set = async (label, value) => {
    const node = box.querySelector(`[aria-label="${label}"]`);
    check('Input exists: ' + label, !!node);
    Object.getOwnPropertyDescriptor(node instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, value);
    node.dispatchEvent(new Event(node instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true })); await settle();
  };
  const manager = permissions => ({ role: 'QUAN_LY_RAP', permissions: permissions.map(code => ({ code })), cinemaAssignments: [{ cinemaId: 1 }, { cinemaId: 2 }] });
  let renderId = 0;
  const render = (page, user, path = '/', route = '/') => flushSync(() => root.render(React.createElement(AuthContext.Provider, { key: ++renderId, value: { user } },
    React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Routes, null, React.createElement(Route, { path: route, element: React.createElement(page) }))))));
  const room = { id: 7, name: 'Original room', type: 'IMAX', status: 'Bảo trì', seatCount: 2 };
  const seat = { id: 8, roomId: 7, label: 'A1', type: 'VIP', status: 'Hỏng' };
  const show = { id: 9, movieId: 1, roomId: 7, roomName: 'Original room', movieTitle: 'R7 film', startsAt: '2027-01-01T18:30:00.123Z', endsAt: '2027-01-01T21:16:00.123Z', format: 'IMAX', basePrice: 123456.78, status: 'Đóng bán' };
  const pricing = { id: 10, seatType: 'VIP', dayType: 'Cuối tuần', format: 'IMAX', surcharge: 15000, startsOn: '2027-01-01', endsOn: '2027-02-01', status: 'Áp dụng' };
  const complaint = { id: 1, title: 'R7 complaint', status: 'Mới', content: 'Fixture', processings: [] };
  let referenceError = false, delayReference = false, releaseReference;
  let images = [], delayRooms = false, releaseRooms, roomUpdates = 0;
  window.fetch = async (url, options = {}) => {
    const parsed = new URL(url, location.href), route = parsed.pathname, method = options.method ?? 'GET';
    const body = options.body ? JSON.parse(options.body) : undefined;
    calls.push({ route, query: parsed.search, method, body });
    let data = {};
    if (route === '/api/manager/cinemas') data = { cinemas: [{ id: 1, name: 'Cinema1' }, { id: 2, name: 'Cinema2' }] };
    else if (route.endsWith('/rooms')) {
      if (delayRooms && method === 'GET' && route.includes('/1/')) await new Promise(resolve => { releaseRooms = resolve; });
      data = { rooms: [{ ...room, name: roomUpdates ? 'Saved room' : room.name }] };
    } else if (route === '/api/manager/rooms/7' && method === 'PUT') { roomUpdates++; data = { room: { ...room, ...body } }; }
    else if (route.endsWith('/seats')) data = { seats: [seat], seat: { id: 8 } };
    else if (route.endsWith('/showtimes')) data = { showtimes: [show] };
    else if (route.endsWith('/pricing')) data = { pricing: [pricing] };
    else if (route.endsWith('/revenue')) data = { revenue: parsed.searchParams.get('fromDate') === '2027-01-01' ? [{ date: '2027-01-01', totalRevenue: 123456, orderCount: 1 }] : [] };
    else if (route.endsWith('/dashboard')) data = { dashboard: {} };
    else if (route === '/api/support/complaints') data = { complaints: [complaint] };
    else if (route === '/api/support/complaints/1') data = { complaint };
    else if (route.endsWith('/order-reference')) {
      if (delayReference) await new Promise(resolve => { releaseReference = resolve; });
      if (referenceError) return new Response(JSON.stringify({ error: { code: 'REFERENCE_UNAVAILABLE', message: 'Reference unavailable' } }), { status: referenceError });
      data = { order: { id: 20, status: 'Đã hủy', movieTitle: 'Reference film', ticketTotal: 80000, productTotal: 20000, discountTotal: 10000, total: 90000,
        tickets: [{ id: 1, label: 'A1', price: 80000, status: 'Đã hủy' }], products: [{ id: 1, name: 'Popcorn', quantity: 2, total: 20000 }],
        payments: [{ id: 1, status: 'Thất bại', amount: 90000 }, { id: 2, status: 'Thành công', amount: 90000 }], compensation: { points: 72 } } };
    } else if (route === '/api/cinemas') data = { cinemas: [{ id: 1, name: 'Public cinema', city: 'City', address: 'Address' }] };
    else if (route === '/api/cinemas/1/images') data = { images };
    return new Response(JSON.stringify(data), { status: 200 });
  };
  try {
    for (const [permission, edit, kind] of [['QL_SUAT_CHIEU', 'Sửa suất', 'suất'], ['QL_PHONG', 'Sửa phòng', 'phòng'], ['QL_BANG_GIA', 'Sửa giá', 'giá']]) {
      calls.length = 0; render(Manager, manager([permission])); await wait(() => button(edit)); button(edit).click(); await settle();
      const form = box.querySelector(`form[aria-label="Sửa ${kind}"]`);
      check(kind + ' edit form exists', !!form);
      if (kind === 'suất') {
        check('Showtime millisecond UTC hydration into business datetime-local', form.querySelector('[aria-label="Bắt đầu"]').value === '2027-01-02T01:30:00.123');
        check('Immutable room not submitted or editable', !form.querySelector('[aria-label="Mã phòng suất chiếu"]'));
        check('Status includes Đóng bán and cancellation uses separate action', [...form.querySelector('[aria-label="Trạng thái"]').options].some(option => option.value === 'Đóng bán')
          && ![...form.querySelector('[aria-label="Trạng thái"]').options].some(option => option.value === 'Đã hủy'));
      } else if (kind === 'phòng') check('Room name/type/status hydrated', form.querySelector('[aria-label="Tên phòng"]').value === room.name && form.querySelector('[aria-label="Loại phòng"]').value === 'IMAX' && form.querySelector('[aria-label="Trạng thái"]').value === 'Bảo trì');
      else check('All pricing dimensions/end DATE_ONLY hydrated', form.querySelector('[aria-label="Loại ngày"]').value === 'Cuối tuần' && form.querySelector('[aria-label="Ngày kết thúc"]').value === '2027-02-01');
      button('Bỏ chọn').click(); await settle(); check(kind + ' cancel makes no mutation', !calls.some(call => call.method !== 'GET'));
      button(edit).click(); await settle();
      if (kind === 'phòng') await set('Tên phòng', 'Saved room');
      box.querySelector(`form[aria-label="Sửa ${kind}"]`).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await wait(() => calls.some(call => call.method === 'PUT')); const saved = calls.find(call => call.method === 'PUT');
      if (kind === 'suất') check('Showtime exact update contract and instant preserved', saved.route === '/api/manager/showtimes/9' && saved.body.startsAt === show.startsAt && saved.body.basePrice === show.basePrice && !('roomId' in saved.body));
      else if (kind === 'phòng') { check('Room exact update body', JSON.stringify(saved.body) === JSON.stringify({ name: 'Saved room', type: 'IMAX', status: 'Bảo trì' })); await wait(() => box.textContent.includes('Saved room')); }
      else check('Pricing full update body', saved.route === '/api/manager/pricing/10' && saved.body.dayType === 'Cuối tuần' && saved.body.format === 'IMAX' && saved.body.endsOn === '2027-02-01' && saved.body.surcharge === 15000);
      await wait(() => button(edit) && !box.querySelector(`form[aria-label="Sửa ${kind}"]`)); check(kind + ' success reload returns to create form', !box.querySelector(`form[aria-label="Sửa ${kind}"]`));
      const forbidden = { QL_SUAT_CHIEU: ['/rooms', '/pricing', '/revenue'], QL_PHONG: ['/pricing', '/showtimes', '/revenue'], QL_BANG_GIA: ['/rooms', '/showtimes', '/revenue'] }[permission];
      check('Partial grant skips unrelated reads ' + permission, !calls.some(call => forbidden.some(suffix => call.route.endsWith(suffix))));
    }
    calls.length = 0; render(Manager, manager(['QL_GHE'])); await wait(() => button('Tải ghế'));
    await set('Mã phòng xem ghế', '7'); button('Tải ghế').click(); await wait(() => button('Sửa ghế')); button('Sửa ghế').click(); await settle();
    await set('Loại ghế', 'Sweetbox'); await set('Trạng thái', 'Bảo trì'); button('Lưu').click(); await wait(() => calls.some(call => call.method === 'PUT'));
    const seatSave = calls.find(call => call.method === 'PUT'); check('Seat type/status only with QL_GHE alone', seatSave.route === '/api/manager/seats/8' && JSON.stringify(seatSave.body) === JSON.stringify({ type: 'Sweetbox', status: 'Bảo trì' }) && !calls.some(call => call.route.endsWith('/rooms')));
    calls.length = 0; render(Manager, manager(['XEM_BAO_CAO_RAP'])); await wait(() => button('Lọc doanh thu'));
    await set('Từ ngày doanh thu', '2027-01-01'); await set('Đến ngày doanh thu', '2027-01-01'); button('Lọc doanh thu').click(); await wait(() => box.textContent.includes('123456'));
    check('Revenue same-day DATE_ONLY query unchanged', calls.some(call => call.route.endsWith('/revenue') && call.query === '?fromDate=2027-01-01&toDate=2027-01-01'));
    const count = calls.filter(call => call.route.endsWith('/revenue')).length;
    await set('Từ ngày doanh thu', '2027-01-02'); button('Lọc doanh thu').click(); await settle();
    check('Invalid range rejected locally with no API call', box.textContent.includes('Từ ngày không được sau đến ngày') && calls.filter(call => call.route.endsWith('/revenue')).length === count);
    button('Đặt lại').click(); await wait(() => calls.filter(call => call.route.endsWith('/revenue')).length > count); check('Revenue reset clears both inputs', box.querySelector('[aria-label="Từ ngày doanh thu"]').value === '' && box.querySelector('[aria-label="Đến ngày doanh thu"]').value === '');
    calls.length = 0; delayRooms = true; render(Manager, manager(['QL_PHONG'])); await wait(() => releaseRooms); await set('Rạp hiện tại', '2'); await wait(() => button('Tạo phòng')); delayRooms = false; releaseRooms(); await settle();
    check('Cinema switch keeps current scope after late previous response', box.querySelector('[aria-label="Rạp hiện tại"]').value === '2' && calls.some(call => call.route === '/api/manager/cinemas/2/rooms'));
    const supportUser = { role: 'CSKH', permissions: [{ code: 'QL_KHIEUNAI' }, { code: 'TRA_CUU_DON' }] };
    calls.length = 0; delayReference = true; render(Support, supportUser); await wait(() => box.textContent.includes('#1 · R7 complaint'));
    [...box.querySelectorAll('button')].find(node => node.textContent.includes('#1 · R7 complaint')).click(); await wait(() => releaseReference);
    check('Complaint/timeline render independently while reference loads', box.textContent.includes('Timeline xử lý') && box.textContent.includes('Đang tải tham chiếu đơn'));
    delayReference = false; releaseReference(); await wait(() => box.textContent.includes('72 điểm'));
    check('Support reference complete visible sections', ['Tiền vé', 'Tiền đồ ăn', 'Giảm giá', 'Tổng thanh toán', 'Vé và ghế', 'Đồ ăn', 'Thất bại', 'Thành công', 'Bồi thường'].every(text => box.textContent.includes(text)));
    for (const status of [403, 404]) {
      referenceError = status; render(Support, supportUser); await wait(() => box.textContent.includes('#1 · R7 complaint')); [...box.querySelectorAll('button')].find(node => node.textContent.includes('#1 · R7 complaint')).click(); await wait(() => box.querySelector('section[aria-label="Đơn hàng liên kết"] [role="alert"]'));
      check('Reference' + status + ' leaves complaint and timeline available', box.textContent.includes('Timeline xử lý') && box.textContent.includes('Fixture'));
    }
    referenceError = false;
    calls.length = 0; render(Support, { role: 'CSKH', permissions: [{ code: 'QL_KHIEUNAI' }] }); await wait(() => box.textContent.includes('#1 · R7 complaint')); [...box.querySelectorAll('button')].find(node => node.textContent.includes('#1 · R7 complaint')).click(); await wait(() => box.textContent.includes('Bạn chưa được cấp quyền tra cứu đơn'));
    check('QL-only Support does not call reference API', !calls.some(call => call.route.endsWith('/order-reference')));
    for (const variant of [0, 1, 3]) {
      images = variant ? [{ id: 1, url: '/favicon.svg', status: 'Hoạt động', cover: true, displayOrder: 10, description: 'Cover' }] : [];
      if (variant === 3) images.push({ id: 2, url: '/favicon.svg', status: 'Hoạt động', cover: false, displayOrder: 1, description: 'First detail' }, { id: 3, url: '/hidden', status: 'Tạm ẩn', cover: false, displayOrder: 0 });
      render(Cinema, null, '/cinemas/1', '/cinemas/:cinemaId'); await wait(() => box.textContent.includes('Public cinema') && !box.textContent.includes('Đang tải ảnh rạp'));
      const gallery = box.querySelector('[aria-label="Ảnh rạp"]');
      check('Gallery ' + variant + ' image contract', !!gallery && gallery.querySelectorAll('figure').length === (variant === 3 ? 2 : variant));
      if (variant) check('Gallery cover first/description/active only', gallery.querySelector('figure').textContent === 'Cover' && !gallery.querySelector('img[src="/hidden"]'));
      else check('Gallery fallback', gallery.textContent.includes('Chưa có ảnh rạp'));
      for (const width of [360, 1280]) { box.style.width = `${width}px`; await settle(); check('Gallery responsive width ' + width + '/' + variant, gallery.scrollWidth <= width); }
    }
    return { status: 'PASS', checks };
  } finally { root.unmount(); box.remove(); window.fetch = oldFetch; }
}
