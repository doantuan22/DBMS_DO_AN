import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_AREAS, ROLES } from '../../constants/roles';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ Email: '', MatKhau: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form);
      navigate(user.role === ROLES.CUSTOMER ? '/' : (ROLE_AREAS[user.role]?.path ?? '/'), { replace: true });
    } catch (err) {
      setError(err.status === 401 ? 'Email hoặc mật khẩu không đúng, hoặc tài khoản chưa hoạt động.' : err.status === 503 ? 'Dịch vụ đăng nhập hiện chưa sẵn sàng.' : err.status === 400 ? err.message : 'Không thể đăng nhập lúc này. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <h1>Đăng nhập</h1>
      {location.state?.message && <p className="form-success" role="status">{location.state.message}</p>}
      <form onSubmit={submit}>
        <label>Email<input required type="email" autoComplete="username" maxLength="150" value={form.Email} onChange={(event) => setForm({ ...form, Email: event.target.value })} /></label>
        <label>Mật khẩu<input required type="password" autoComplete="current-password" value={form.MatKhau} onChange={(event) => setForm({ ...form, MatKhau: event.target.value })} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
      <p>Chưa có tài khoản? <Link to="/register">Đăng ký khách hàng</Link></p>
    </section>
  );
}
