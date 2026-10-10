import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  HoTen: '',
  Email: '',
  MatKhau: '',
  SoDienThoai: '',
  NgaySinh: '',
  GioiTinh: '',
};

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
    const body = {
      ...form,
      SoDienThoai: form.SoDienThoai || null,
      NgaySinh: form.NgaySinh || null,
      GioiTinh: form.GioiTinh || null,
    };
    try {
      await register(body);
      navigate('/login', {
        replace: true,
        state: { message: 'Đăng ký tài khoản thành công! Hãy đăng nhập để bắt đầu đặt vé.' },
      });
    } catch (err) {
      const messages = {
        EMAIL_IN_USE: 'Email đã được sử dụng.',
        PHONE_IN_USE: 'Số điện thoại đã được sử dụng.',
        INVALID_REQUEST: err.message,
      };
      setError(
        messages[err.code] ??
          (err.status === 503
            ? 'Dịch vụ đăng ký hiện chưa sẵn sàng.'
            : 'Không thể đăng ký lúc này. Vui lòng thử lại.'),
      );
    } finally {
      setBusy(false);
    }
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="auth-card">
      <h1>Đăng ký khách hàng</h1>
      <p className="subtitle">
        Tạo tài khoản thành viên để tích lũy điểm thưởng và nhận ưu đãi khi đặt vé.
      </p>
      <form onSubmit={submit}>
        <label>
          Họ tên *
          <input
            required
            maxLength="100"
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            value={form.HoTen}
            onChange={(event) => update('HoTen', event.target.value)}
          />
        </label>
        <label>
          Email *
          <input
            required
            type="email"
            maxLength="150"
            autoComplete="email"
            placeholder="example@email.com"
            value={form.Email}
            onChange={(event) => update('Email', event.target.value)}
          />
        </label>
        <label>
          Mật khẩu *
          <input
            required
            type="password"
            aria-describedby="password-byte-limit"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.MatKhau}
            onChange={(event) => update('MatKhau', event.target.value)}
          />
        </label>
        <small id="password-byte-limit" className="form-helper">
          Mật khẩu từ 8 đến 72 byte UTF-8.
        </small>
        <label>
          Số điện thoại
          <input
            type="tel"
            maxLength="20"
            autoComplete="tel"
            placeholder="0912345678"
            value={form.SoDienThoai}
            onChange={(event) => update('SoDienThoai', event.target.value)}
          />
        </label>
        <label>
          Ngày sinh
          <input
            type="date"
            value={form.NgaySinh}
            onChange={(event) => update('NgaySinh', event.target.value)}
          />
        </label>
        <label>
          Giới tính
          <select
            value={form.GioiTinh}
            onChange={(event) => update('GioiTinh', event.target.value)}
          >
            <option value="">Không cung cấp</option>
            <option>Nam</option>
            <option>Nữ</option>
            <option>Khác</option>
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
        </button>
      </form>
      <div className="auth-footer">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </div>
    </section>
  );
}
