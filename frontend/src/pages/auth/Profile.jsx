import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

function profileForm(user) {
  return {
    HoTen: user.name ?? '',
    SoDienThoai: user.phone ?? '',
    NgaySinh: user.birthday ?? '',
    GioiTinh: user.gender ?? '',
  };
}

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const isCustomer = user.role === ROLES.CUSTOMER;
  const [form, setForm] = useState(() => profileForm(user));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await updateProfile({
        ...form,
        SoDienThoai: form.SoDienThoai || null,
        NgaySinh: isCustomer ? form.NgaySinh || null : null,
        GioiTinh: isCustomer ? form.GioiTinh || null : null,
      });
      setNotice('Đã cập nhật hồ sơ cá nhân thành công.');
    } catch (err) {
      setError(
        err.code === 'PHONE_IN_USE'
          ? 'Số điện thoại đã được sử dụng.'
          : err.status === 400
            ? err.message
            : 'Không thể cập nhật hồ sơ lúc này.',
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
      <h1>Hồ sơ cá nhân</h1>
      <p className="subtitle">Xem và cập nhật thông tin tài khoản cá nhân của bạn.</p>
      <form onSubmit={submit}>
        <label>
          Email
          <input type="email" value={user.email} readOnly />
        </label>
        <label>
          Vai trò
          <input value={user.roleName} readOnly />
        </label>
        {isCustomer && user.loyaltyPoints != null && (
          <label>
            Điểm tích lũy
            <input value={`${user.loyaltyPoints} điểm`} readOnly />
          </label>
        )}
        <label>
          Họ tên
          <input
            required
            maxLength="100"
            value={form.HoTen}
            onChange={(event) => update('HoTen', event.target.value)}
          />
        </label>
        <label>
          Số điện thoại
          <input
            type="tel"
            maxLength="20"
            value={form.SoDienThoai}
            onChange={(event) => update('SoDienThoai', event.target.value)}
          />
        </label>
        {isCustomer && (
          <>
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
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="form-success" role="status">
            {notice}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? 'Đang lưu…' : 'Lưu hồ sơ'}
        </button>
      </form>
    </section>
  );
}
