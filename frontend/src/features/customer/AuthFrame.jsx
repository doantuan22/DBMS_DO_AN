import './customer-account.css';
export default function AuthFrame({ title, children }) {
  return <div className="customer-auth"><section className="auth-card">{children}</section><aside className="customer-auth__intro"><p className="catalog-eyebrow">CINEMA STAR · HẸN NHAU TẠI RẠP</p><h2>{title}</h2><p>Khám phá phim, chọn suất chiếu và theo dõi vé của bạn trong một hành trình.</p><ul><li>Đơn đặt vé và lịch sử thanh toán</li><li>Hồ sơ cá nhân và điểm tích lũy</li><li>Gửi phản hồi, theo dõi hỗ trợ</li></ul></aside></div>;
}
