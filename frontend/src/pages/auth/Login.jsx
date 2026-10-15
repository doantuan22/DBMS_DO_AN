import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, FormField, Input, Button } from '../../components/ui';
import AuthFrame from '../../features/customer/AuthFrame';
import PasswordInput from '../../features/customer/PasswordInput';
import useFormWriteLock from '../../features/customer/useFormWriteLock';
import { ROLE_AREAS, ROLES } from '../../constants/roles';

// RequireAuth/RequireRole pass the page the visitor was refused as a plain path string.
const isInternalPath = (path) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [form, setForm] = useState({ Email: '', MatKhau: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { begin, finish, active } = useFormWriteLock();

  async function submit(event) {
    event.preventDefault();
    if (!begin()) return;
    setError('');
    setBusy(true);
    try {
      const user = await login(form);
      if (!active() || !user) return;
      const defaultPath = user.role === ROLES.CUSTOMER ? '/' : (ROLE_AREAS[user.role]?.path ?? '/');
      navigate(isInternalPath(from) ? from : defaultPath, { replace: true });
    } catch (err) {
      if (active())
        setError(
          err.status === 401
            ? 'Email hoặc mật khẩu không đúng, hoặc tài khoản chưa hoạt động.'
            : err.status === 503
              ? 'Dịch vụ đăng nhập hiện chưa sẵn sàng.'
              : err.status === 400
                ? err.message
                : 'Không thể đăng nhập lúc này. Vui lòng thử lại.',
        );
    } finally {
      finish();
      if (active()) setBusy(false);
    }
  }

  return (
    <AuthFrame title="Buổi xem phim tiếp theo bắt đầu tại đây">
      <PageHeader
        title="Đăng nhập"
        description="Chào mừng bạn quay lại CinemaStar. Đăng nhập để tiếp tục."
      />
      {location.state?.message && (
        <p className="form-success" role="status">
          {location.state.message}
        </p>
      )}
      {location.state?.sessionExpired && (
        <p className="form-error" role="status">
          Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
        </p>
      )}
      <form onSubmit={submit}>
        <FormField label="Email" required>
          <Input
            type="email"
            autoComplete="username"
            maxLength={150}
            value={form.Email}
            disabled={busy}
            onChange={(e) => setForm({ ...form, Email: e.target.value })}
          />
        </FormField>
        <FormField label="Mật khẩu" required>
          <PasswordInput
            autoComplete="current-password"
            value={form.MatKhau}
            disabled={busy}
            onChange={(e) => setForm({ ...form, MatKhau: e.target.value })}
          />
        </FormField>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" loading={busy}>
          {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>
      </form>
      <div className="auth-footer">
        Chưa có tài khoản?{' '}
        <Link to="/register" state={{ from }}>
          Đăng ký khách hàng
        </Link>
      </div>
    </AuthFrame>
  );
}
