import { useEffect, useRef, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { EmptyState, ErrorState, LoadingState } from './CatalogStates';
import { CINEMA_IMAGE_STATUSES } from '../constants/cinemaImageStatuses';
import { useAuth } from '../context/AuthContext';
import { userCanAct } from '../utils/authorization';

const blank = () => ({ url: '', description: '', displayOrder: 0, status: 'Hoạt động', cover: false });

export default function CinemaImageManager() {
  const { user } = useAuth();
  const canManage = userCanAct(user, 'ADMIN', 'QL_RAP');
  const [cinemas, setCinemas] = useState([]);
  const [cinemaId, setCinemaId] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(blank);
  const imageRequest = useRef(0);

  useEffect(() => {
    if (!canManage) return;
    adminApi.cinemas().then((result) => setCinemas(result.cinemas ?? [])).catch(setError).finally(() => setLoading(false));
  }, [canManage]);

  const loadImages = async (id = cinemaId) => {
    if (!canManage) return;
    const requestId = ++imageRequest.current;
    if (!id) { setImages([]); setLoading(false); setError(null); return; }
    setLoading(true); setError(null);
    try { const result = await adminApi.cinemaImages(id); if (requestId === imageRequest.current) setImages(result.images ?? []); }
    catch (requestError) { if (requestId === imageRequest.current) setError(requestError); }
    finally { if (requestId === imageRequest.current) setLoading(false); }
  };

  const chooseCinema = async (event) => {
    const id = event.target.value;
    setCinemaId(id); setSelected(null); setForm(blank()); setNotice(null); await loadImages(id);
  };

  const edit = (image) => {
    setSelected(image);
    setForm({ url: image.URL, description: image.MoTa ?? '', displayOrder: image.ThuTuHienThi, status: image.TrangThai, cover: Boolean(image.LaAnhDaiDien) });
  };

  const submit = async (event) => {
    event.preventDefault(); if (!canManage) return; setNotice(null);
    const requestId = imageRequest.current;
    try {
      const payload = { url: form.url, description: form.description, displayOrder: Number(form.displayOrder), status: form.status };
      if (selected) await adminApi.updateCinemaImage(cinemaId, selected.HinhAnhRapID, payload);
      else await adminApi.createCinemaImage(cinemaId, { ...payload, cover: form.cover });
      if (requestId !== imageRequest.current) return;
      setSelected(null); setForm(blank()); setNotice({ ok: true, text: 'Đã lưu ảnh rạp.' }); await loadImages();
    } catch (requestError) { if (requestId === imageRequest.current) setNotice({ ok: false, text: requestError.message }); }
  };

  const remove = async (image) => {
    if (!canManage) return;
    if (!window.confirm('Xác nhận xóa ảnh rạp?')) return;
    try { await adminApi.deleteCinemaImage(cinemaId, image.HinhAnhRapID); if (selected?.HinhAnhRapID === image.HinhAnhRapID) { setSelected(null); setForm(blank()); } setNotice({ ok: true, text: 'Đã xóa ảnh rạp.' }); await loadImages(); }
    catch (requestError) { setNotice({ ok: false, text: requestError.message }); }
  };

  const setCover = async (image) => {
    if (!canManage) return;
    try { await adminApi.setCinemaImageCover(cinemaId, image.HinhAnhRapID); setNotice({ ok: true, text: 'Đã chọn ảnh đại diện.' }); await loadImages(); }
    catch (requestError) { setNotice({ ok: false, text: requestError.message }); }
  };

  if (!canManage) return <EmptyState>Bạn chưa được cấp quyền quản lý ảnh rạp.</EmptyState>;
  return <section className="catalog-section">
    <label>Rạp<select aria-label="Chọn rạp" value={cinemaId} onChange={chooseCinema}><option value="">Chọn rạp</option>{cinemas.map((cinema) => <option key={cinema.RapID} value={cinema.RapID}>{cinema.TenRap}</option>)}</select></label>
    {notice && <p role={notice.ok ? 'status' : 'alert'}>{notice.text}</p>}
    {error && <ErrorState error={error} onRetry={() => loadImages()} />}
    {cinemaId && <form className="catalog-form" onSubmit={submit}>
      <h3>{selected ? 'Sửa ảnh rạp' : 'Thêm ảnh rạp'}</h3>
      <label>URL hoặc đường dẫn ảnh<input required value={form.url} onChange={(event) => setForm((value) => ({ ...value, url: event.target.value }))} /></label>
      <label>Mô tả<input value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></label>
      <label>Thứ tự hiển thị<input required min="0" type="number" value={form.displayOrder} onChange={(event) => setForm((value) => ({ ...value, displayOrder: event.target.value }))} /></label>
      <label>Trạng thái<select required value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value }))}>{CINEMA_IMAGE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
      {!selected && <label><input type="checkbox" checked={form.cover} onChange={(event) => setForm((value) => ({ ...value, cover: event.target.checked }))} /> Ảnh đại diện</label>}
      <div className="catalog-actions"><button className="catalog-button">Lưu</button>{selected && <button type="button" className="catalog-button catalog-button--secondary" onClick={() => { setSelected(null); setForm(blank()); }}>Bỏ chọn</button>}</div>
    </form>}
    {loading && <LoadingState>Đang tải ảnh rạp…</LoadingState>}
    {!loading && cinemaId && images.length === 0 && <EmptyState>Rạp này chưa có ảnh.</EmptyState>}
    {!loading && images.length > 0 && <div className="catalog-table-wrap"><table className="catalog-table"><thead><tr><th>Ảnh</th><th>Mô tả</th><th>Thứ tự</th><th>Trạng thái</th><th>Đại diện</th><th>Thao tác</th></tr></thead><tbody>{images.map((image) => <tr key={image.HinhAnhRapID}><td><a href={image.URL} target="_blank" rel="noreferrer">Mở ảnh</a></td><td>{image.MoTa ?? '—'}</td><td>{image.ThuTuHienThi}</td><td>{image.TrangThai}</td><td>{image.LaAnhDaiDien ? 'Có' : 'Không'}</td><td className="catalog-actions"><button type="button" className="catalog-button catalog-button--secondary" onClick={() => edit(image)}>Sửa</button>{!image.LaAnhDaiDien && <button type="button" className="catalog-button" onClick={() => setCover(image)}>Chọn đại diện</button>}<button type="button" className="catalog-button" onClick={() => remove(image)}>Xóa</button></td></tr>)}</tbody></table></div>}
  </section>;
}
