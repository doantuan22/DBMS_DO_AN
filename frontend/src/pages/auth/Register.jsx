import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { HoTen: '', Email: '', MatKhau: '', SoDienThoai: '', NgaySinh: '', GioiTinh: '' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const body = { ...form, SoDienThoai: form.SoDienThoai || null, NgaySinh: form.NgaySinh || null, GioiTinh: form.GioiTinh || null };
    try {
      await register(body);
      navigate('/login', { replace: true, state: { message: 'Đăng ký thành công. Hãy đăng nhập bằng tài khoản mới.' } });
    } catch (err) {
      const messages = {
        EMAIL_IN_USE: 'Email đã được sử dụng.',
        PHONE_IN_USE: 'Số điện thoại đã được sử dụng.',
        INVALID_REQUEST: err.message,
      };
      setError(messages[err.code] ?? (err.status === 503 ? 'Dịch vụ đăng ký hiện chưa sẵn sàng.' : 'Không thể đăng ký lúc này. Vui lòng thử lại.'));
    } finally {
      setBusy(false);
    }
  }

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }

  return (
    <section className="auth-card">
      <h1>Đăng ký khách hàng</h1>
      <form onSubmit={submit}>
        <label>Họ tên<input required maxLength="100" autoComplete="name" value={form.HoTen} onChange={(event) => update('HoTen', event.target.value)} /></label>
        <label>Email<input required type="email" maxLength="150" autoComplete="email" value={form.Email} onChange={(event) => update('Email', event.target.value)} /></label>
        <label>Mật khẩu<input required type="password" minLength="8" maxLength="72" autoComplete="new-password" value={form.MatKhau} onChange={(event) => update('MatKhau', event.target.value)} /></label>
        <label>Số điện thoại<input type="tel" maxLength="20" autoComplete="tel" value={form.SoDienThoai} onChange={(event) => update('SoDienThoai', event.target.value)} /></label>
        <label>Ngày sinh<input type="date" value={form.NgaySinh} onChange={(event) => update('NgaySinh', event.target.value)} /></label>
        <label>Giới tính<select value={form.GioiTinh} onChange={(event) => update('GioiTinh', event.target.value)}><option value="">Không cung cấp</option><option>Nam</option><option>Nữ</option><option>Khác</option></select></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}</button>
      </form>
      <p>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
    </section>
  );
}
