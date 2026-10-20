import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, FormField, Input, Select, Button } from '../../components/ui';
import AccountNavigation from '../../features/customer/AccountNavigation';
import useFormWriteLock from '../../features/customer/useFormWriteLock';
import { businessDate, formatDate, formatDateTime } from '../../utils/dateTime';
import '../../features/customer/customer-account.css';
import './profile.css';
import { ROLES } from '../../constants/roles';

const permissionLabel = (permission) => permission.name || permission.code || 'Quyền chưa đặt tên';

function profileForm(user) {
  return {
    HoTen: user.name ?? '',
    SoDienThoai: user.phone ?? '',
    NgaySinh: user.birthday ?? '',
    GioiTinh: user.gender ?? '',
  };
}

function displayDate(value, formatter) {
  if (!value) return 'Chưa có dữ liệu';
  try {
    return formatter(value);
  } catch {
    return String(value);
  }
}

function statusTone(status) {
  const normalized = String(status ?? '').toLocaleLowerCase('vi');
  if (normalized.includes('hoạt động')) return 'success';
  if (normalized.includes('chưa kích hoạt')) return 'warning';
  if (normalized.includes('bị khóa')) return 'danger';
  return 'neutral';
}

function initialsFor(user) {
  const name = user.name || user.email || 'CinemaStar';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('vi');
}

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return <ProfileContent key={`${user.userId}:${user.role}`} user={user} />;
}

function ProfileContent({ user }) {
  const { updateProfile } = useAuth();
  const isCustomer = user.role === ROLES.CUSTOMER;
  const isManager = user.role === ROLES.MANAGER;
  const permissions = user.permissions ?? [];
  const cinemaAssignments = user.cinemaAssignments ?? [];
  const roleName = user.roleName || user.role || 'Chưa xác định';
  const accountStatus = user.status || 'Chưa có dữ liệu';
  const accountStatusTone = statusTone(user.status);
  const [form, setForm] = useState(() => profileForm(user));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const { begin, finish, active } = useFormWriteLock();
  const initialForm = profileForm(user);
  const isDirty = Object.keys(initialForm).some((field) => form[field] !== initialForm[field]);

  async function submit(event) {
    event.preventDefault();
    if (!isDirty || !begin()) return;
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
      if (active())
        setError(
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

  return (
    <section className={`catalog-page profile-page${isCustomer ? ' profile-page--customer' : ''}`}>
      {isCustomer && <AccountNavigation />}
      <PageHeader
        title="Hồ sơ cá nhân"
        description="Quản lý thông tin tài khoản và xem các quyền truy cập đang được áp dụng."
      />

      <section className="profile-hero" aria-label="Tổng quan hồ sơ">
        <span className="profile-hero__avatar" aria-hidden="true">
          {initialsFor(user)}
        </span>
        <div className="profile-hero__identity">
          <p className="profile-eyebrow">Tài khoản CinemaStar</p>
          <h2>{user.name || 'Chưa cập nhật họ tên'}</h2>
          <div className="profile-hero__badges">
            <span className="profile-badge profile-badge--role">{roleName}</span>
            <span className={`profile-badge profile-badge--${accountStatusTone}`}>
              <span className="profile-badge__dot" aria-hidden="true" />
              {accountStatus}
            </span>
          </div>
        </div>
        <div className="profile-hero__identifier">
          <span>Mã người dùng</span>
          <strong>{user.userId == null ? '—' : `#${user.userId}`}</strong>
        </div>
      </section>

      <div className="profile-layout">
        <div className="profile-layout__main">
          <form className="profile-card profile-form" onSubmit={submit}>
            <header className="profile-card__header">
              <div>
                <p className="profile-eyebrow">Thông tin cơ bản</p>
                <h2>Thông tin cá nhân</h2>
                <p>Cập nhật thông tin liên hệ của bạn tại đây.</p>
              </div>
              <span className="profile-card__marker" aria-hidden="true">01</span>
            </header>

            <div className="profile-form__fields customer-form-fields">
              <FormField label="Họ tên" required>
                <Input
                  maxLength={100}
                  autoComplete="name"
                  value={form.HoTen}
                  disabled={busy}
                  onChange={(event) => update('HoTen', event.target.value)}
                />
              </FormField>
              <FormField label="Số điện thoại">
                <Input
                  type="tel"
                  maxLength={20}
                  autoComplete="tel"
                  value={form.SoDienThoai}
                  disabled={busy}
                  onChange={(event) => update('SoDienThoai', event.target.value)}
                />
              </FormField>
              {isCustomer && (
                <>
                  <FormField label="Ngày sinh">
                    <Input
                      type="date"
                      max={businessDate()}
                      value={form.NgaySinh}
                      disabled={busy}
                      onChange={(event) => update('NgaySinh', event.target.value)}
                    />
                  </FormField>
                  <FormField label="Giới tính">
                    <Select
                      value={form.GioiTinh}
                      disabled={busy}
                      onChange={(event) => update('GioiTinh', event.target.value)}
                    >
                      <option value="">Không cung cấp</option>
                      <option>Nam</option>
                      <option>Nữ</option>
                      <option>Khác</option>
                    </Select>
                  </FormField>
                </>
              )}
            </div>

            <div className="profile-form__footer">
              <p>Email và vai trò được quản lý trong phần tài khoản.</p>
              <Button type="submit" loading={busy} disabled={!isDirty}>
                {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </div>
            {error && <p className="profile-feedback profile-feedback--error" role="alert">{error}</p>}
            {notice && <p className="profile-feedback profile-feedback--success" role="status">{notice}</p>}
          </form>

          {!isCustomer && (
            <details className="profile-card profile-details-accordion" aria-labelledby="profile-permissions-heading">
              <summary className="profile-card__header" style={{ cursor: 'pointer', listStyle: 'none' }}>
                <div>
                  <p className="profile-eyebrow">Phân quyền tài khoản</p>
                  <h2 id="profile-permissions-heading" style={{ fontSize: 'var(--font-size-lg)' }}>
                    Quyền chức năng được cấp ({permissions.length})
                  </h2>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    Bấm để xem chi tiết các quyền kỹ thuật trong workspace.
                  </p>
                </div>
                <span className="profile-count">{permissions.length} quyền</span>
              </summary>
              {permissions.length ? (
                <ul className="profile-permission-list" style={{ marginTop: 'var(--space-4)' }}>
                  {permissions.map((permission, index) => (
                    <li key={permission.code ?? `${permission.name}-${index}`}>
                      <span className="profile-permission-list__check" aria-hidden="true">✓</span>
                      <span className="profile-permission-list__copy">
                        <strong>{permissionLabel(permission)}</strong>
                        {permission.code && <code>{permission.code}</code>}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="profile-empty-state">Chưa có quyền chức năng nào được ghi nhận cho tài khoản này.</p>
              )}
            </details>
          )}

          {isManager && (
            <section className="profile-card" aria-labelledby="profile-cinemas-heading">
              <header className="profile-card__header">
                <div>
                  <p className="profile-eyebrow">Phạm vi vận hành</p>
                  <h2 id="profile-cinemas-heading">Rạp được phân công</h2>
                  <p>Danh sách rạp và trạng thái phân công hiện tại.</p>
                </div>
                <span className="profile-count">{cinemaAssignments.length} rạp</span>
              </header>
              {cinemaAssignments.length ? (
                <ul className="profile-cinema-list">
                  {cinemaAssignments.map((assignment, index) => (
                    <li key={assignment.cinemaId ?? `${assignment.name}-${index}`}>
                      <span className="profile-cinema-list__icon" aria-hidden="true">R</span>
                      <span className="profile-cinema-list__copy">
                        <strong>{assignment.name || `Rạp #${assignment.cinemaId ?? '—'}`}</strong>
                        <span>
                          {[
                            assignment.cinemaId != null ? `Mã rạp ${assignment.cinemaId}` : null,
                            assignment.city,
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Chưa có thông tin địa điểm'}
                        </span>
                      </span>
                      {assignment.assignmentStatus && (
                        <span className="profile-cinema-list__status">{assignment.assignmentStatus}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="profile-empty-state">Tài khoản chưa được phân công rạp.</p>
              )}
            </section>
          )}
        </div>

        <aside className="profile-layout__aside" aria-label="Thông tin tài khoản">
          <section className="profile-card profile-account-card">
            <header className="profile-card__header">
              <div>
                <p className="profile-eyebrow">Định danh</p>
                <h2>Tài khoản</h2>
              </div>
            </header>
            <div className="profile-account-card__fields">
              <FormField label="Email">
                <Input type="email" value={user.email ?? 'Chưa có dữ liệu'} readOnly />
              </FormField>
              <FormField label="Vai trò">
                <Input value={roleName} readOnly />
              </FormField>
              <FormField label="Trạng thái">
                <Input value={accountStatus} readOnly />
              </FormField>
              <FormField label="Mã người dùng">
                <Input value={user.userId == null ? 'Chưa có dữ liệu' : `#${user.userId}`} readOnly />
              </FormField>
              <FormField label="Ngày tạo tài khoản">
                <Input value={displayDate(user.createdAt, formatDateTime)} readOnly />
              </FormField>
            </div>
          </section>

          {isCustomer ? (
            <section className="profile-membership-card" aria-label="Thông tin thành viên">
              <span className="profile-membership-card__label">Thành viên CinemaStar</span>
              <strong
                aria-label={`${Number(user.loyaltyPoints ?? 0).toLocaleString('vi-VN')} điểm`}
              >
                {Number(user.loyaltyPoints ?? 0).toLocaleString('vi-VN')}
              </strong>
              <span>điểm tích lũy</span>
              <p>Điểm hiện có trong tài khoản của bạn.</p>
            </section>
          ) : (
            <section className="profile-card profile-summary-card" aria-label="Tóm tắt quyền truy cập">
              <p className="profile-eyebrow">Tóm tắt workspace</p>
              <h2>Quyền truy cập</h2>
              <div className="profile-summary-card__stats">
                <div>
                  <strong>{permissions.length}</strong>
                  <span>Quyền chức năng</span>
                </div>
                {isManager && (
                  <div>
                    <strong>{cinemaAssignments.length}</strong>
                    <span>Rạp được phân công</span>
                  </div>
                )}
              </div>
              <p>Thông tin này được đồng bộ theo phân quyền tài khoản.</p>
            </section>
          )}
        </aside>
      </div>
    </section>
  );
}
