// Actual React pages with isolated HTTP responses; no live database or account writes.
export async function testR2Pages() {
  const [{ default: React }, client, router, { default: Payment }, { default: Manager }, { default: Admin }] = await Promise.all([
    import('react'), import('react-dom/client'),
    import('react-router-dom'), import('/src/pages/PaymentPage.jsx'),
    import('/src/pages/ManagerPortal.jsx'), import('/src/pages/AdminPortal.jsx'),
  ]);
  const { createRoot } = client.default ?? client;
  const { MemoryRouter, Routes, Route } = router;
  const originalFetch = window.fetch, originalConfirm = window.confirm;
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container), calls = [];
  const button = text => [...container.querySelectorAll('button')].find(b => b.textContent === text);
  const wait = async predicate => {
    const end = Date.now() + 10000;
    while (!predicate()) { if (Date.now() > end) throw Error('R2 browser timeout: ' + container.innerText + JSON.stringify(calls)); await new Promise(r => setTimeout(r, 30)); }
  };
  const order = { id: 1, showtimeId: 1, movieTitle: 'R2 film', cinemaName: 'R2 cinema', total: 150000, status: 'Chờ thanh toán', holdExpiresAt: new Date(Date.now() + 1500).toISOString(), payments: [] };
  let serverExpired = false;
  window.fetch = async (url, options = {}) => {
    const route = new URL(url, location.href).pathname;
    calls.push({ route, method: options.method ?? 'GET', body: options.body ? JSON.parse(options.body) : null });
    let payload = {};
    if (route.endsWith('/cancel')) return new Response(JSON.stringify({ error: { code: 'SHOWTIME_HAS_HELD_ORDERS', message: 'A showtime with held seats cannot be cancelled.' } }), { status: 409 });
    if (route === '/api/orders/1') payload = { order: { ...order, status: serverExpired ? 'Hết hạn' : order.status } };
    else if (route === '/api/orders/1/payments') payload = { payment: { id: 10, status: 'Đang xử lý' } };
    else if (route === '/api/orders/1/payments/10/result') { order.status = 'Đã thanh toán'; order.payments = [{ id: 10, method: 'MOMO', amount: 150000, status: 'Thành công' }]; payload = { order, payment: order.payments[0] }; }
    else if (route.endsWith('/seats')) payload = { seats: [{ id: 1, status: serverExpired ? 'Trống' : 'Đang giữ' }] };
    else if (route === '/api/manager/cinemas') payload = { cinemas: [{ id: 1, name: 'R2 cinema', city: 'Fixture' }] };
    else if (route.endsWith('/rooms')) payload = { rooms: [] };
    else if (route === '/api/admin/showtimes') payload = { showtimes: [{ SuatChieuID: 1, TenPhim: 'R2 film', TrangThai: 'Mở bán' }] };
    else if (route.endsWith('/showtimes')) payload = { showtimes: [{ id: 1, movieTitle: 'R2 film', startsAt: '2027-01-01T12:00:00Z', status: 'Mở bán' }] };
    else if (route.endsWith('/pricing')) payload = { pricing: [] };
    else if (route.endsWith('/revenue')) payload = { revenue: [] };
    else payload = { dashboard: {} };
    return new Response(JSON.stringify(payload), { status: 200 });
  };
  const paymentPage = key => React.createElement(MemoryRouter, { key, initialEntries: ['/orders/1/payment'] },
    React.createElement(Routes, null, React.createElement(Route, { path: '/orders/:orderId/payment', element: React.createElement(Payment) })));
  try {
    root.render(paymentPage('expiry'));
    await wait(() => button('Xác nhận thanh toán'));
    if (button('Xác nhận thanh toán').disabled) throw Error('Live hold cannot be confirmed');
    await wait(() => button('Xác nhận thanh toán')?.disabled && container.innerText.includes('kiểm tra hạn giữ ghế'));
    if (container.innerText.includes('Ghế đã được giải phóng')) throw Error('Frontend decided expiry before server');
    if (calls.some(c => c.route.endsWith('/payments'))) throw Error('Payment sent after countdown elapsed');
    serverExpired = true;
    await wait(() => container.innerText.includes('Ghế đã được giải phóng'));
    if (button('Xác nhận thanh toán') && !button('Xác nhận thanh toán').disabled) throw Error('Expired order still payable');
    if (!calls.some(c => c.route === '/api/showtimes/1/seats')) throw Error('Seats were not refreshed');
    const expiry = { disabledAtCountdown: true, serverAuthoritative: true, orderRefreshed: true, seatsRefreshed: true };

    serverExpired = false; order.holdExpiresAt = new Date(Date.now() + 60000).toISOString();
    root.render(paymentPage('confirm'));
    await wait(() => button('Xác nhận thanh toán') && !button('Xác nhận thanh toán').disabled);
    button('Xác nhận thanh toán').click();
    await wait(() => container.innerText.includes('Đã xác nhận thanh toán thành công'));
    const writes = calls.filter(c => c.method === 'POST');
    if (writes.length !== 2 || writes[1].body.status !== 'Thành công') throw Error('Single confirmation did not complete simulation');
    if (container.innerText.includes('Mô phỏng thất bại') || container.innerText.includes('hoàn tiền')) throw Error('Unexpected payment/refund controls');

    root.render(React.createElement(Manager));
    await wait(() => button('Hủy')); button('Hủy').click();
    await wait(() => container.innerText.includes('còn đơn giữ ghế/chờ thanh toán còn hiệu lực'));
    window.confirm = () => true;
    root.render(React.createElement(Admin));
    await wait(() => button('Suất chiếu')); button('Suất chiếu').click();
    await wait(() => button('Hủy')); button('Hủy').click();
    await wait(() => container.innerText.includes('còn đơn giữ ghế/chờ thanh toán còn hiệu lực'));
    return { expiry, singleConfirmation: true, paymentHistoryVisible: true, noRefundControls: true, manager409Reason: true, admin409Reason: true, calls };
  } finally { root.unmount(); container.remove(); window.fetch = originalFetch; window.confirm = originalConfirm; }
}
