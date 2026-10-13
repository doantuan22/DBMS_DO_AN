import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageHeader, FormField, Input, Select, Button } from '../../components/ui';
import AuthFrame from '../../features/customer/AuthFrame';
import PasswordInput from '../../features/customer/PasswordInput';
import useFormWriteLock from '../../features/customer/useFormWriteLock';
import { passwordMessage } from '../../features/customer/accountValidation';
import { businessDate } from '../../utils/dateTime';
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
  const navigate = useNavigate(), location = useLocation();
  const { begin, finish, active } = useFormWriteLock();
  const [passwordError, setPasswordError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const validation = passwordMessage(form.MatKhau);
    setPasswordError(validation);
    if (validation || !begin()) return;
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
      if (!active()) return;
      navigate('/login', {
        replace: true,
        state: { from: location.state?.from, message: 'Đăng ký tài khoản thành công! Hãy đăng nhập để bắt đầu đặt vé.' },
      });
    } catch (err) {
      const messages = {
        EMAIL_IN_USE: 'Email đã được sử dụng.',
        PHONE_IN_USE: 'Số điện thoại đã được sử dụng.',
        INVALID_REQUEST: err.message,
      };
      if (active()) setError(
        messages[err.code] ??
          (err.status === 503
            ? 'Dịch vụ đăng ký hiện chưa sẵn sàng.'
            : 'Không thể đăng ký lúc này. Vui lòng thử lại.'),
      );
    } finally {
      finish();
      if (active()) setBusy(false);
    }
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return <AuthFrame title="Lưu lại những trải nghiệm điện ảnh của bạn"><PageHeader title="Đăng ký khách hàng" description="Tạo tài khoản để đặt vé và theo dõi các giao dịch của bạn." /><form onSubmit={submit}><FormField label="Họ tên" required><Input maxLength={100} autoComplete="name" value={form.HoTen} disabled={busy} onChange={e=>update('HoTen',e.target.value)} /></FormField><FormField label="Email" required><Input type="email" maxLength={150} autoComplete="email" value={form.Email} disabled={busy} onChange={e=>update('Email',e.target.value)} /></FormField><FormField label="Mật khẩu" required hint="Mật khẩu từ 8 đến 72 byte UTF-8." error={passwordError}><PasswordInput autoComplete="new-password" value={form.MatKhau} disabled={busy} onChange={e=>{update('MatKhau',e.target.value);setPasswordError('');}} /></FormField><FormField label="Số điện thoại" hint="Không bắt buộc."><Input type="tel" maxLength={20} autoComplete="tel" value={form.SoDienThoai} disabled={busy} onChange={e=>update('SoDienThoai',e.target.value)} /></FormField><FormField label="Ngày sinh"><Input type="date" max={businessDate()} value={form.NgaySinh} disabled={busy} onChange={e=>update('NgaySinh',e.target.value)} /></FormField><FormField label="Giới tính"><Select value={form.GioiTinh} disabled={busy} onChange={e=>update('GioiTinh',e.target.value)}><option value="">Không cung cấp</option><option>Nam</option><option>Nữ</option><option>Khác</option></Select></FormField>{error&&<p className="form-error" role="alert">{error}</p>}<Button type="submit" loading={busy}>{busy?'Đang tạo tài khoản…':'Tạo tài khoản'}</Button></form><div className="auth-footer">Đã có tài khoản? <Link to="/login" state={{from:location.state?.from}}>Đăng nhập</Link></div></AuthFrame>;
}
