import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { EmptyState, ErrorState, LoadingState } from './CatalogStates';
import { CINEMA_IMAGE_STATUSES } from '../constants/cinemaImageStatuses';
import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';

const blank = () => ({ url: '', description: '', displayOrder: 0, status: 'Hoạt động', cover: false });

export default function CinemaImageManager() {
  const { user } = useAuth();
  const canManage = userCanAct(user, 'ADMIN', 'QL_RAP');
  const [cinemaList, setCinemaList] = useState({ status: 'loading', rows: [] });
  const [cinemaId, setCinemaId] = useState('');
  const [imageList, setImageList] = useState({ status: 'idle', cinemaId: '', rows: [] });
  const [notice, setNotice] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blank);
  const imageRequest = useRef(0);
  const cinemaRequest = useRef(0);
  const currentCinema = useRef('');
  const contextGeneration = useRef(0);
  const writePending = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    mounted.current = true;
    const requests = [imageRequest, cinemaRequest, contextGeneration];
    return () => { mounted.current = false; requests.forEach(request => { request.current++; }); };
  }, []);

  const loadCinemas = useCallback(async () => {
    if (!canManage) return;
    const requestId = ++cinemaRequest.current;
    setCinemaList(current => ({ ...current, status: 'loading' }));
    try {
      const result = await adminApi.cinemas();
      if (mounted.current && requestId === cinemaRequest.current) setCinemaList({ status: 'success', rows: result.cinemas ?? [] });
    } catch (error) {
      if (mounted.current && requestId === cinemaRequest.current) setCinemaList({ status: 'error', rows: [], error });
    }
  }, [canManage]);
  useEffect(() => { void Promise.resolve().then(loadCinemas); }, [loadCinemas]);

  const loadImages = async (id = currentCinema.current) => {
    if (!canManage || id !== currentCinema.current) return;
    const requestId = ++imageRequest.current;
    if (!id) { setImageList({ status: 'idle', cinemaId: '', rows: [] }); return; }
    setImageList(current => ({ ...current, status: 'loading', cinemaId: id, rows: [] }));
    try {
      const result = await adminApi.cinemaImages(id);
      if (mounted.current && requestId === imageRequest.current && id === currentCinema.current) {
        setImageList({ status: 'success', cinemaId: id, rows: result.images ?? [] });
      }
    } catch (error) {
      if (mounted.current && requestId === imageRequest.current && id === currentCinema.current) setImageList({ status: 'error', cinemaId: id, rows: [], error });
    }
  };

  const chooseCinema = async (event) => {
    const id = event.target.value;
    if (!canManage || cinemaList.status !== 'success' || (id && !cinemaList.rows.some(row => String(row.RapID) === id))) return;
    currentCinema.current = id; contextGeneration.current++; imageRequest.current++;
    setImageList({ status: 'idle', cinemaId: id, rows: [] });
    setCinemaId(id); setSelected(null); setForm(blank()); setNotice(null); await loadImages(id);
  };

  const imagesReady = canManage && cinemaList.status === 'success' && imageList.status === 'success'
    && Boolean(cinemaId) && imageList.cinemaId === cinemaId && currentCinema.current === cinemaId;
  const images = imagesReady ? imageList.rows : [];
  const ownsImage = image => imagesReady && String(image.RapID) === cinemaId
    && images.some(row => row.HinhAnhRapID === image.HinhAnhRapID && String(row.RapID) === cinemaId);
  const isCurrent = (id, generation) => mounted.current && id === currentCinema.current && generation === contextGeneration.current;

  const edit = (image) => {
    if (writePending.current || !ownsImage(image)) return;
    setSelected(image);
    setForm({ url: image.URL, description: image.MoTa ?? '', displayOrder: image.ThuTuHienThi, status: image.TrangThai, cover: Boolean(image.LaAnhDaiDien) });
  };

  const submit = async (event) => {
    event.preventDefault(); if (!imagesReady || writePending.current || (selected && !ownsImage(selected))) return;
    writePending.current = true; setBusy(true); setNotice(null);
    const target = cinemaId, generation = contextGeneration.current;
    try {
      const payload = { url: form.url, description: form.description, displayOrder: Number(form.displayOrder), status: form.status };
      if (selected) await adminApi.updateCinemaImage(target, selected.HinhAnhRapID, payload);
      else await adminApi.createCinemaImage(target, { ...payload, cover: form.cover });
      if (!isCurrent(target, generation)) return;
      setSelected(null); setForm(blank()); setNotice({ ok: true, text: 'Đã lưu ảnh rạp.' }); await loadImages(target);
    } catch (requestError) { if (isCurrent(target, generation)) setNotice({ ok: false, text: requestError.message }); }
    finally { writePending.current = false; if (mounted.current) setBusy(false); }
  };

  const remove = async (image) => {
    if (writePending.current || !ownsImage(image)) return;
    if (!window.confirm('Xác nhận xóa ảnh rạp?')) return;
    writePending.current = true; setBusy(true); const target = cinemaId, generation = contextGeneration.current;
    try { await adminApi.deleteCinemaImage(target, image.HinhAnhRapID); if (!isCurrent(target, generation)) return; if (selected?.HinhAnhRapID === image.HinhAnhRapID) { setSelected(null); setForm(blank()); } setNotice({ ok: true, text: 'Đã xóa ảnh rạp.' }); await loadImages(target); }
    catch (requestError) { if (isCurrent(target, generation)) setNotice({ ok: false, text: requestError.message }); }
    finally { writePending.current = false; if (mounted.current) setBusy(false); }
  };

  const setCover = async (image) => {
    if (writePending.current || !ownsImage(image)) return;
    writePending.current = true; setBusy(true); const target = cinemaId, generation = contextGeneration.current;
    try { await adminApi.setCinemaImageCover(target, image.HinhAnhRapID); if (!isCurrent(target, generation)) return; setNotice({ ok: true, text: 'Đã chọn ảnh đại diện.' }); await loadImages(target); }
    catch (requestError) { if (isCurrent(target, generation)) setNotice({ ok: false, text: requestError.message }); }
    finally { writePending.current = false; if (mounted.current) setBusy(false); }
  };

  if (!canManage) return <EmptyState>Bạn chưa được cấp quyền quản lý ảnh rạp.</EmptyState>;
  return <section className="catalog-section">
    <label>Rạp<select aria-label="Chọn rạp" value={cinemaId} onChange={chooseCinema} disabled={cinemaList.status !== 'success'}><option value="">Chọn rạp</option>{cinemaList.rows.map((cinema) => <option key={cinema.RapID} value={cinema.RapID}>{cinema.TenRap}</option>)}</select></label>
    {notice && <p role={notice.ok ? 'status' : 'alert'}>{notice.text}</p>}
    {cinemaList.status === 'loading' && <LoadingState>Đang tải danh sách rạp…</LoadingState>}
    {cinemaList.error && <ErrorState error={cinemaList.error} onRetry={loadCinemas} />}
    {imageList.cinemaId === cinemaId && imageList.error && <ErrorState error={imageList.error} onRetry={() => loadImages()} />}
    {cinemaId && <form className="catalog-form" onSubmit={submit}>
      <h3>{selected ? 'Sửa ảnh rạp' : 'Thêm ảnh rạp'}</h3>
      <label>URL hoặc đường dẫn ảnh<input required value={form.url} onChange={(event) => setForm((value) => ({ ...value, url: event.target.value }))} /></label>
      <label>Mô tả<input value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
      <label>Thứ tự hiển thị<input required min="0" type="number" value={form.displayOrder} onChange={(event) => setForm((value) => ({ ...value, displayOrder: event.target.value }))} /></label>
      <label>Trạng thái<select required value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value }))}>{CINEMA_IMAGE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      {!selected && <label><input type="checkbox" checked={form.cover} onChange={(event) => setForm((value) => ({ ...value, cover: event.target.checked }))} /> Ảnh đại diện</label>}
      <div className="catalog-actions"><button className="catalog-button" disabled={busy || !imagesReady}>Lưu</button>{selected && <button type="button" disabled={busy} className="catalog-button catalog-button--secondary" onClick={() => { setSelected(null); setForm(blank()); }}>Bỏ chọn</button>}</div>
    </form>}
    {imageList.status === 'loading' && <LoadingState>Đang tải ảnh rạp…</LoadingState>}
    {imagesReady && images.length === 0 && <EmptyState>Rạp này chưa có ảnh.</EmptyState>}
    {images.length > 0 && <div className="catalog-table-wrap"><table className="catalog-table"><thead><tr><th>Ảnh</th><th>Mô tả</th><th>Thứ tự</th><th>Trạng thái</th><th>Đại diện</th><th>Thao tác</th></tr></thead><tbody>{images.map((image) => <tr key={image.HinhAnhRapID}><td><a href={image.URL} target="_blank" rel="noreferrer">Mở ảnh</a></td><td>{image.MoTa ?? '—'}</td><td>{image.ThuTuHienThi}</td><td>{image.TrangThai}</td><td>{image.LaAnhDaiDien ? 'Có' : 'Không'}</td><td className="catalog-actions"><button type="button" disabled={busy || !ownsImage(image)} className="catalog-button catalog-button--secondary" onClick={() => edit(image)}>Sửa</button>{!image.LaAnhDaiDien && <button type="button" disabled={busy || !ownsImage(image)} className="catalog-button" onClick={() => setCover(image)}>Chọn đại diện</button>}<button type="button" disabled={busy || !ownsImage(image)} className="catalog-button" onClick={() => remove(image)}>Xóa</button></td></tr>)}</tbody></table></div>}
  </section>;
}
