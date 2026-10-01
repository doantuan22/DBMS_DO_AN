import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { EmptyState, ErrorState, LoadingState } from '../components/CatalogStates';

const sections = [
  ['dashboard', 'Tổng quan'], ['users', 'Tài khoản'], ['roles', 'Vai trò'], ['permissions', 'Quyền'],
  ['assignments', 'Phân công'], ['cinemas', 'Rạp'], ['rooms', 'Phòng'], ['seats', 'Ghế'],
  ['movies', 'Phim'], ['genres', 'Thể loại'], ['actors', 'Diễn viên'], ['products', 'Sản phẩm'],
  ['promotions', 'Khuyến mãi'], ['pricing', 'Bảng giá'], ['showtimes', 'Suất chiếu'],
  ['complaints', 'Khiếu nại'], ['revenue', 'Doanh thu'],
];
const loaders = {
  dashboard: (api) => api.dashboard(), users: (api) => api.users(), roles: (api) => api.roles(),
  permissions: (api) => api.permissions(), assignments: (api) => api.assignments(), cinemas: (api) => api.cinemas(),
  rooms: (api) => api.rooms(), seats: (api) => api.seats(), movies: (api) => api.movies(), genres: (api) => api.genres(),
  actors: (api) => api.actors(), products: (api) => api.products(), promotions: (api) => api.promotions(),
  pricing: (api) => api.pricing(), showtimes: (api) => api.showtimes(), complaints: (api) => api.complaints(),
  revenue: (api, range) => api.revenue(range),
};

// API fields, database row identifiers, and read-only status are explicit per resource.
const forms = {
  users: { path: 'users', id: 'NguoiDungID', fields: [['name', 'Họ tên', 'text', 'HoTen'], ['email', 'Email', 'email', 'Email'], ['phone', 'Điện thoại', 'text', 'SoDienThoai'], ['roleId', 'Mã vai trò', 'number', 'VaiTroID']], createOnly: [['password', 'Mật khẩu ban đầu', 'password', '']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  roles: { path: 'roles', id: 'VaiTroID', fields: [['name', 'Tên vai trò', 'text', 'TenVaiTro'], ['description', 'Mô tả', 'text', 'MoTa']], createOnly: [['code', 'Mã vai trò', 'text', 'MaVaiTro']] },
  permissions: { path: 'permissions', id: 'QuyenID', fields: [['name', 'Tên quyền', 'text', 'TenQuyen'], ['description', 'Mô tả', 'text', 'MoTa']], createOnly: [['code', 'Mã quyền', 'text', 'MaQuyen']] },
  assignments: { path: 'assignments', id: 'PhanCongID', fields: [['userId', 'Mã quản lý', 'number', 'NguoiDungID'], ['cinemaId', 'Mã rạp', 'number', 'RapID'], ['startsOn', 'Ngày bắt đầu', 'date', 'NgayBatDau'], ['endsOn', 'Ngày kết thúc', 'date', 'NgayKetThuc'], ['status', 'Trạng thái', 'text', 'TrangThai']] },
  cinemas: { path: 'cinemas', id: 'RapID', fields: [['name', 'Tên rạp', 'text', 'TenRap'], ['address', 'Địa chỉ', 'text', 'DiaChi'], ['city', 'Thành phố', 'text', 'ThanhPho'], ['phone', 'Điện thoại', 'text', 'SoDienThoai'], ['description', 'Mô tả', 'text', 'MoTa']], createOnly: [['operatingSince', 'Ngày hoạt động', 'date', 'NgayHoatDong']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  rooms: { path: 'rooms', id: 'PhongID', fields: [['name', 'Tên phòng', 'text', 'TenPhong'], ['type', 'Loại phòng', 'text', 'LoaiPhong']], createOnly: [['cinemaId', 'Mã rạp', 'number', 'RapID']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  seats: { path: 'seats', id: 'GheID', fields: [['type', 'Loại ghế', 'text', 'LoaiGhe']], createOnly: [['roomId', 'Mã phòng', 'number', 'PhongID'], ['row', 'Hàng', 'text', 'HangGhe'], ['number', 'Số ghế', 'number', 'SoGhe']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  movies: { path: 'movies', id: 'PhimID', fields: [['title', 'Tên phim', 'text', 'TenPhim'], ['durationMinutes', 'Thời lượng (phút)', 'number', 'ThoiLuong'], ['releaseDate', 'Ngày khởi chiếu', 'date', 'NgayKhoiChieu'], ['endDate', 'Ngày kết thúc', 'date', 'NgayKetThuc'], ['language', 'Ngôn ngữ', 'text', 'NgonNgu'], ['subtitle', 'Phụ đề', 'text', 'PhuDe'], ['ageRating', 'Độ tuổi', 'text', 'DoTuoi'], ['director', 'Đạo diễn', 'text', 'DaoDien'], ['description', 'Mô tả', 'text', 'MoTa'], ['posterUrl', 'Poster URL', 'text', 'PosterURL'], ['trailerUrl', 'Trailer URL', 'text', 'TrailerURL'], ['genreIds', 'Mã thể loại (phân cách dấu phẩy)', 'csv', '']], createOnly: [], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  genres: { path: 'genres', id: 'TheLoaiID', fields: [['name', 'Tên thể loại', 'text', 'TenTheLoai']] },
  actors: { path: 'actors', id: 'DienVienID', fields: [['name', 'Họ tên', 'text', 'HoTen'], ['birthDate', 'Ngày sinh', 'date', 'NgaySinh'], ['nationality', 'Quốc tịch', 'text', 'QuocTich']] },
  products: { path: 'products', id: 'SanPhamID', fields: [['name', 'Tên sản phẩm', 'text', 'TenSanPham'], ['type', 'Loại sản phẩm', 'text', 'LoaiSanPham'], ['price', 'Giá', 'number', 'Gia'], ['description', 'Mô tả', 'text', 'MoTa'], ['image', 'Hình ảnh URL', 'text', 'HinhAnh']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  promotions: { path: 'promotions', id: 'KhuyenMaiID', fields: [['description', 'Mô tả', 'text', 'MoTa'], ['discountType', 'Loại giảm giá', 'text', 'LoaiGiamGia'], ['discountValue', 'Giá trị giảm', 'number', 'GiaTriGiam'], ['minimumOrder', 'Đơn tối thiểu', 'number', 'DonHangToiThieu'], ['maximumDiscount', 'Giảm tối đa', 'number', 'GiamToiDa'], ['startsAt', 'Bắt đầu (ISO)', 'text', 'NgayBatDau'], ['endsAt', 'Kết thúc (ISO)', 'text', 'NgayKetThuc'], ['quantity', 'Số lượng', 'number', 'SoLuong']], createOnly: [['code', 'Mã khuyến mãi', 'text', 'MaCode']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  pricing: { path: 'pricing', id: 'GiaID', fields: [['surcharge', 'Phụ thu', 'number', 'PhuThu']], createOnly: [['cinemaId', 'Mã rạp', 'number', 'RapID'], ['seatType', 'Loại ghế', 'text', 'LoaiGhe'], ['dayType', 'Loại ngày', 'text', 'LoaiNgay'], ['format', 'Định dạng', 'text', 'DinhDang'], ['startsOn', 'Ngày bắt đầu', 'date', 'NgayBatDau'], ['endsOn', 'Ngày kết thúc', 'date', 'NgayKetThuc']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
  showtimes: { path: 'showtimes', id: 'SuatChieuID', fields: [['movieId', 'Mã phim', 'number', 'PhimID'], ['startsAt', 'Bắt đầu (ISO)', 'text', 'ThoiGianBatDau'], ['endsAt', 'Kết thúc (ISO)', 'text', 'ThoiGianKetThuc'], ['format', 'Định dạng', 'text', 'DinhDang'], ['basePrice', 'Giá vé cơ bản', 'number', 'GiaVeCoBan']], createOnly: [['roomId', 'Mã phòng', 'number', 'PhongID']], editOnly: [['status', 'Trạng thái', 'text', 'TrangThai']] },
};

const idColumns = { users: 'NguoiDungID', dashboard: '', revenue: '', complaints: 'KhieuNaiID' };
const dataRows = (value, key) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value[key])) return value[key];
  const collection = Object.values(value).find(Array.isArray);
  if (collection) return collection;
  return Object.entries(value).map(([label, count]) => ({ label, value: count }));
};
const inputValue = (value, kind) => {
  if (value == null) return '';
  if (kind === 'csv' && Array.isArray(value)) return value.join(',');
  if (kind === 'csv') return String(value);
  if (kind === 'date' && typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date) return kind === 'date' ? value.toISOString().slice(0, 10) : value.toISOString();
  return String(value);
};
const toBody = (values, fields) => Object.fromEntries(fields.map(([name, , kind]) => {
  const value = values[name];
  if (kind === 'csv' && (value === '' || value === undefined || value === null)) return [name, []];
  if (value === '' || value === undefined) return [name, null];
  if (kind === 'number') return [name, Number(value)];
  if (kind === 'csv') return [name, value.split(',').map((part) => Number(part.trim())).filter(Number.isInteger)];
  return [name, value];
}));

export default function AdminPortal() {
  const [active, setActive] = useState('dashboard');
  const [state, setState] = useState({ status: 'loading' });
  const [selected, setSelected] = useState(null);
  const [values, setValues] = useState({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const permissionRequest = useRef(0);
  const [notice, setNotice] = useState(null);
  const [complaint, setComplaint] = useState(null);
  const [orderReference, setOrderReference] = useState(null);
  const [processingForm, setProcessingForm] = useState({ content: '', nextStatus: 'Đang xử lý' });
  const [reportInput, setReportInput] = useState({ fromDate: '', toDate: '' });
  const [reportRange, setReportRange] = useState({});
  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try { setState({ status: 'success', data: await loaders[active](adminApi, reportRange) }); }
    catch (error) { setState({ status: 'error', error }); }
  }, [active, reportRange]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const rows = state.status === 'success' ? dataRows(state.data?.[active] ?? state.data?.dashboard ?? state.data, active) : [];
  const definition = forms[active];
  const editableFields = definition ? [...definition.fields, ...(selected ? definition.editOnly ?? [] : definition.createOnly ?? [])] : [];
  const onSelect = async (row) => {
    setSelected(row);
    const rowValues = Object.fromEntries(editableFields.map(([name, , kind, column]) => [name, inputValue(row[column], kind)]));
    if (active === 'movies') {
      rowValues.genreIds = inputValue(row.TheLoaiIdList, 'csv');
      rowValues.castJson = row.DanhSachDienVienJson || '[]';
    }
    setValues(rowValues);
    if (active === 'roles') {
      const requestId = ++permissionRequest.current;
      setPermissionsLoading(true);
      try {
        const result = await adminApi.rolePermissions(row.VaiTroID);
        if (requestId === permissionRequest.current) {
          setValues((current) => ({ ...current, permissionIds: (result.permissions ?? []).map((permission) => permission.QuyenID).join(',') }));
        }
      } catch (error) {
        if (requestId === permissionRequest.current) setNotice({ ok: false, text: error.message });
      } finally {
        if (requestId === permissionRequest.current) setPermissionsLoading(false);
      }
    }
  };
  const clearForm = () => { permissionRequest.current += 1; setSelected(null); setValues({}); setPermissionsLoading(false); };
  const submit = async (event) => {
    event.preventDefault(); setNotice(null);
    try {
      if (active === 'roles' && values.permissionIds !== undefined) {
        const permissionIds = (values.permissionIds ?? '').split(',').map((item) => Number(item.trim())).filter(Number.isSafeInteger);
        await adminApi.update(`roles/${selected.VaiTroID}/permissions`, { permissionIds });
      } else {
        const payload = active === 'users' && selected ? { status: values.status } : toBody(values, editableFields);
        const idColumn = definition.id;
        await (selected
          ? adminApi.update(`${definition.path}/${selected[idColumn]}${active === 'users' ? '/status' : ''}`, payload)
          : adminApi.create(definition.path, payload));
      }
      setNotice({ ok: true, text: 'Đã lưu thay đổi.' }); clearForm(); await load();
    } catch (error) { setNotice({ ok: false, text: error.message }); }
  };
  const remove = async (row) => {
    if (!definition || !window.confirm('Xác nhận xóa mục này? Ràng buộc nghiệp vụ sẽ từ chối xóa dữ liệu đang được sử dụng.')) return;
    try { await adminApi.remove(`${definition.path}/${row[definition.id]}`); setNotice({ ok: true, text: 'Đã xóa.' }); await load(); }
    catch (error) { setNotice({ ok: false, text: error.message }); }
  };
  const changeUserStatus = async (row) => {
    const activeStatus = 'Hoạt động';
    const lockedStatus = 'Bị khóa';
    if (![activeStatus, lockedStatus].includes(row.TrangThai)) return;
    const next = row.TrangThai === activeStatus ? lockedStatus : activeStatus;
    if (!window.confirm(`Xác nhận ${next === lockedStatus ? 'khóa' : 'mở khóa'} tài khoản này?`)) return;
    try { await adminApi.update(`users/${row.NguoiDungID}/status`, { status: next }); setNotice({ ok: true, text: 'Đã cập nhật tài khoản.' }); await load(); }
    catch (error) { setNotice({ ok: false, text: error.message }); }
  };
  const cancelShowtime = async (row) => {
    if (!window.confirm('Xác nhận hủy suất chiếu? Đơn đang giữ ghế sẽ khiến thao tác bị từ chối.')) return;
    try { await adminApi.create(`showtimes/${row.SuatChieuID}/cancel`, {}); setNotice({ ok: true, text: 'Đã hủy suất chiếu.' }); await load(); }
    catch (error) { setNotice({ ok: false, text: error.message }); }
  };
  const openComplaint = async (row) => {
    setSelected(row); setComplaint({ status: 'loading' }); setOrderReference(null);
    try {
      const [detail, reference] = await Promise.all([adminApi.complaint(row.id), adminApi.complaintOrderReference(row.id)]);
      setComplaint({ status: 'success', data: detail.complaint }); setOrderReference(reference);
      const status = detail.complaint.status === 'Mới' ? 'Đang xử lý' : detail.complaint.status;
      setProcessingForm((current) => ({ ...current, nextStatus: status || current.nextStatus }));
    } catch (error) { setComplaint({ status: 'error', error }); }
  };
  const writeComplaint = async (event, action) => {
    event.preventDefault();
    try {
      if (action === 'processing') await adminApi.addComplaintProcessing(selected.id, processingForm);
      else await adminApi.updateComplaintStatus(selected.id, { status: processingForm.nextStatus });
      setNotice({ ok: true, text: 'Đã cập nhật khiếu nại và ghi lịch sử.' });
      if (action === 'processing') setProcessingForm((current) => ({ ...current, content: '' }));
      await load(); await openComplaint(selected);
    } catch (error) { setNotice({ ok: false, text: error.message }); }
  };
  const writeCast = async (event) => {
    event.preventDefault();
    try {
      await adminApi.update(`movies/${selected.PhimID}/actors`, { cast: JSON.parse(values.castJson || '[]') });
      setNotice({ ok: true, text: 'Đã cập nhật danh sách diễn viên.' }); await load();
    } catch { setNotice({ ok: false, text: 'Không thể lưu danh sách diễn viên. Kiểm tra JSON và mã diễn viên.' }); }
  };

  return <section className="catalog-section" aria-label="Cổng quản trị hệ thống">
    <h1>Quản trị hệ thống</h1>
    <nav className="catalog-actions" aria-label="Phân hệ quản trị">
      {sections.map(([key, label]) => <button key={key} type="button" aria-pressed={active === key} className="catalog-button" onClick={() => { permissionRequest.current += 1; setActive(key); setSelected(null); setValues({}); setPermissionsLoading(false); setNotice(null); setComplaint(null); setOrderReference(null); }}>{label}</button>)}
    </nav>
    <h2>{sections.find(([key]) => key === active)?.[1]}</h2>
    {active === 'revenue' && <form className="catalog-actions" onSubmit={(event) => { event.preventDefault(); setReportRange(reportInput); }}><label>Từ ngày<input type="date" value={reportInput.fromDate} onChange={(event) => setReportInput((v) => ({ ...v, fromDate: event.target.value }))} /></label><label>Đến ngày<input type="date" value={reportInput.toDate} onChange={(event) => setReportInput((v) => ({ ...v, toDate: event.target.value }))} /></label><button className="catalog-button">Lọc doanh thu</button></form>}
    {active === 'movies' && selected && <form className="catalog-form" onSubmit={writeCast}><h3>Diễn viên phim #{selected.PhimID}</h3><label>Danh sách JSON (actorId, role)<textarea aria-label="Danh sách diễn viên phim" value={values.castJson ?? '[]'} onChange={(event) => setValues((current) => ({ ...current, castJson: event.target.value }))} /></label><button className="catalog-button">Lưu diễn viên</button></form>}
    {active === 'complaints' && <ul className="catalog-list">{rows.map((row) => <li key={row.id}><button type="button" className="catalog-button catalog-button--secondary" onClick={() => void openComplaint(row)}>Mở khiếu nại #{row.id} · {row.title}</button></li>)}</ul>}
    {active === 'complaints' && complaint?.status === 'loading' && <LoadingState>Đang tải hồ sơ khiếu nại…</LoadingState>}
    {active === 'complaints' && complaint?.status === 'error' && <ErrorState error={complaint.error} onRetry={() => selected && void openComplaint(selected)} />}
    {active === 'complaints' && complaint?.status === 'success' && <section className="catalog-section"><h3>#{complaint.data.id} · {complaint.data.title}</h3><p>{complaint.data.senderName} · {complaint.data.type} · {complaint.data.status}</p><p>{complaint.data.content}</p><h4>Đơn hàng liên quan</h4><p>{orderReference?.message ?? (orderReference?.order ? JSON.stringify(orderReference.order) : 'Không có đơn hàng liên quan.')}</p><h4>Lịch sử xử lý</h4><ol>{complaint.data.processings.map((item) => <li key={item.id}>{item.processorName} · {item.status} · {item.content}</li>)}</ol><form className="catalog-form" onSubmit={(event) => void writeComplaint(event, 'processing')}><label>Nội dung xử lý<textarea required value={processingForm.content} onChange={(event) => setProcessingForm((v) => ({ ...v, content: event.target.value }))} /></label><label>Trạng thái sau xử lý<input required value={processingForm.nextStatus} onChange={(event) => setProcessingForm((v) => ({ ...v, nextStatus: event.target.value }))} /></label><button className="catalog-button">Ghi diễn biến</button></form><form className="catalog-form" onSubmit={(event) => void writeComplaint(event, 'status')}><label>Trạng thái khiếu nại<input required value={processingForm.nextStatus} onChange={(event) => setProcessingForm((v) => ({ ...v, nextStatus: event.target.value }))} /></label><button className="catalog-button">Cập nhật trạng thái</button></form></section>}
    {notice && <p role={notice.ok ? 'status' : 'alert'}>{notice.text}</p>}
    {definition && <form className="catalog-form" onSubmit={submit}>
      <h3>{selected ? 'Cập nhật' : 'Tạo mới'}</h3>
      {selected && <p>#{selected[definition.id]}</p>}
      {editableFields.map(([name, label, kind]) => <label key={name}>{label}<input aria-label={label} type={kind === 'csv' ? 'text' : kind} value={values[name] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))} required={!['description', 'phone', 'image', 'endsOn', 'endDate', 'maximumDiscount', 'minimumOrder', 'operatingSince', 'birthDate', 'language', 'subtitle', 'ageRating', 'director', 'posterUrl', 'trailerUrl', 'status'].includes(name)} /></label>)}
      {active === 'roles' && selected && <label>QuyenID cần gán (phân cách dấu phẩy, để trống để gỡ tất cả)<input aria-label="QuyenID cần gán" value={values.permissionIds ?? ''} onChange={(event) => setValues((current) => ({ ...current, permissionIds: event.target.value }))} /></label>}
      <div className="catalog-actions"><button className="catalog-button" disabled={permissionsLoading}>{permissionsLoading ? 'Đang tải quyền…' : 'Lưu'}</button>{selected && <button className="catalog-button catalog-button--secondary" type="button" onClick={clearForm}>Bỏ chọn</button>}</div>
    </form>}
    {active === 'showtimes' && <p>Chọn suất chiếu trong bảng để sửa hoặc dùng nút Hủy; thời gian chồng lấp được kiểm tra trong SQL.</p>}
    {state.status === 'loading' && <LoadingState>Đang tải dữ liệu…</LoadingState>}
    {state.status === 'error' && <ErrorState error={state.error} onRetry={load} />}
    {state.status === 'success' && (rows.length === 0 ? <EmptyState>Không có dữ liệu để hiển thị.</EmptyState> :
      <div className="catalog-table-wrap"><table className="catalog-table"><thead><tr>{Object.keys(rows[0]).map((key) => <th key={key}>{key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ')}</th>)}{(definition || active === 'users' || active === 'showtimes') && <th>Thao tác</th>}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row[definition?.id ?? idColumns[active]] ?? row.id ?? index}>{Object.entries(row).map(([key, value]) => <td key={key}>{value == null ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>)}
          {(definition || active === 'users' || active === 'showtimes') && <td className="catalog-actions"><button type="button" className="catalog-button catalog-button--secondary" onClick={() => onSelect(row)}>{active === 'users' ? 'Trạng thái' : 'Sửa'}</button>{definition && !['assignments', 'pricing', 'showtimes', 'users'].includes(active) && <button type="button" className="catalog-button" onClick={() => void remove(row)}>Xóa</button>}{active === 'users' && <button type="button" className="catalog-button" onClick={() => void changeUserStatus(row)}>{row.TrangThai === 'Hoạt động' ? 'Khóa' : 'Mở khóa'}</button>}{active === 'showtimes' && <button type="button" className="catalog-button" onClick={() => void cancelShowtime(row)}>Hủy</button>}</td>}
        </tr>)}</tbody>
      </table></div>)}
  </section>;
}
