import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, FormField, Input, Select, Button } from '../../components/ui';
import AccountNavigation from '../../features/customer/AccountNavigation';
import useFormWriteLock from '../../features/customer/useFormWriteLock';
import { businessDate } from '../../utils/dateTime';
import '../../features/customer/customer-account.css';
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
  const { user } = useAuth();
  return <ProfileForm key={`${user.userId}:${user.role}`} />;
}
function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const isCustomer = user.role === ROLES.CUSTOMER;
  const [form, setForm] = useState(() => profileForm(user));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const { begin, finish, active } = useFormWriteLock();

  async function submit(event) {
    event.preventDefault();
    if (!begin()) return;
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const updated = await updateProfile({
        ...form,
        SoDienThoai: form.SoDienThoai || null,
        NgaySinh: isCustomer ? form.NgaySinh || null : null,
        GioiTinh: isCustomer ? form.GioiTinh || null : null,
      });
      if (!active()) return;
      if (updated) setForm(profileForm(updated));
      setNotice('Đã cập nhật hồ sơ cá nhân thành công.');
    } catch (err) {
      if (active()) setError(
        err.code === 'PHONE_IN_USE'
          ? 'Số điện thoại đã được sử dụng.'
          : err.status === 400
            ? err.message
            : 'Không thể cập nhật hồ sơ lúc này.',
      );
    } finally {
      finish();
      if (active()) setBusy(false);
    }
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return <section className="catalog-page customer-journey">{isCustomer&&<AccountNavigation />}<PageHeader title="Hồ sơ cá nhân" description="Xem và cập nhật thông tin tài khoản cá nhân của bạn." /><div className="customer-journey__layout"><form className="customer-panel customer-profile-form" onSubmit={submit}><h2>Thông tin cá nhân</h2><div className="customer-form-fields"><FormField label="Họ tên" required><Input maxLength={100} autoComplete="name" value={form.HoTen} disabled={busy} onChange={e=>update('HoTen',e.target.value)} /></FormField><FormField label="Số điện thoại"><Input type="tel" maxLength={20} autoComplete="tel" value={form.SoDienThoai} disabled={busy} onChange={e=>update('SoDienThoai',e.target.value)} /></FormField>{isCustomer&&<><FormField label="Ngày sinh"><Input type="date" max={businessDate()} value={form.NgaySinh} disabled={busy} onChange={e=>update('NgaySinh',e.target.value)} /></FormField><FormField label="Giới tính"><Select value={form.GioiTinh} disabled={busy} onChange={e=>update('GioiTinh',e.target.value)}><option value="">Không cung cấp</option><option>Nam</option><option>Nữ</option><option>Khác</option></Select></FormField></>}</div>{error&&<p className="form-error" role="alert">{error}</p>}{notice&&<p className="form-success" role="status">{notice}</p>}<Button type="submit" loading={busy}>{busy?'Đang lưu…':'Lưu hồ sơ'}</Button></form><section className="customer-panel" aria-label="Thông tin tài khoản"><h2>Tài khoản</h2><FormField label="Email" hint="Email tài khoản hiện tại."><Input type="email" value={user.email} readOnly /></FormField><FormField label="Vai trò"><Input value={user.roleName} readOnly /></FormField>{isCustomer&&user.loyaltyPoints!=null&&<FormField label="Điểm tích lũy"><Input value={`${user.loyaltyPoints} điểm`} readOnly /></FormField>}</section></div></section>;
}
