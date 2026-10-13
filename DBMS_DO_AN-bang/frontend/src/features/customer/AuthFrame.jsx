import { useEffect, useRef } from 'react';
import './customer-account.css';
export default function AuthFrame({ title, children }) {
  const formRef = useRef(null);
  useEffect(() => {
    const element = formRef.current;
    const observer = new MutationObserver(() => {
      const alert = element.querySelector('[role="alert"]');
      if (!alert) return;
      const target = element.querySelector('[aria-invalid="true"]') ?? alert;
      if (target === alert) alert.tabIndex = -1;
      target.focus();
    });
    observer.observe(element, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return (
    <div className="customer-auth">
      <section ref={formRef} className="auth-card customer-auth__form">
        {children}
      </section>
      <aside className="customer-auth__intro">
        <img
          src="/assets/cinema/auth-seats.jpg"
          alt="Ảnh minh họa một khán giả xem phim trong rạp"
          width="1280"
          height="853"
          decoding="async"
          loading="lazy"
        />
        <div className="cp-auth-copy">
          <p className="catalog-eyebrow">CINEMASTAR / HẸN NHAU TẠI RẠP</p>
          <h2>{title}</h2>
          <p>Chọn phim, dành chỗ và lưu lại những buổi hẹn trên màn ảnh lớn.</p>
          <small>Ảnh minh họa trải nghiệm xem phim</small>
        </div>
      </aside>
    </div>
  );
}
