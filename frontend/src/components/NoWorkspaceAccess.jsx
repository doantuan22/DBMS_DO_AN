import { Link } from 'react-router-dom';

export default function NoWorkspaceAccess() {
  return (
    <section className="system-state" aria-labelledby="workspace-access-heading">
      <h1 id="workspace-access-heading">Chưa có chức năng được cấp quyền</h1>
      <p>Liên hệ quản trị viên nếu bạn cần quyền truy cập không gian làm việc này.</p>
      <Link className="catalog-button" to="/profile">
        Xem quyền và phân công
      </Link>
    </section>
  );
}
