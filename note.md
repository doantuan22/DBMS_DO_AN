# Tài khoản test của seed hiện tại

Database: `CinemaBookingDB` (local/dev). Bộ seed có 130 tài khoản giả lập: 2 Admin, 4 Quản lý rạp, 4 CSKH và 120 khách hàng.

Các tài khoản đại diện dưới đây đã được xác minh trực tiếp trên database; 5 tài khoản đầu cũng đăng nhập thành công trong API smoke test.

| Vai trò | Email | Mật khẩu | Trạng thái |
|---|---|---|---|
| Admin | `admin.bootstrap@example.test` | `Cs!jNzoVbl3tX-t6WxL0fRJL-7cEEWBLrJD` | Hoạt động |
| Admin | `admin.operations@example.test` | `Cs!xyZh4XNf_Vg2vFDaJccUDlLGIMbrH7Jh` | Hoạt động |
| Quản lý rạp | `manager.saigon@example.test` | `Cs!wTn6A2B5w4ePbk7AAZ0r-snlO6TMzgfM` | Hoạt động |
| CSKH | `support.01@example.test` | `Cs!0uJ-JYRk6_r6Md5ZfOMGNMvv7j9UmlKR` | Hoạt động |
| Khách hàng | `nguyen.ngoc.an.001@example.test` | `Cs!tHSyS9GFJ4ZBQsHZCJiRyk4jJfLCgTXA` | Hoạt động |
| Khách hàng (mẫu tài khoản khóa) | `le.khanh.trang.120@example.test` | `Cs!MlkBf_IXmsokVPsSBoEK0uK-lDd3FS93` | Bị khóa |

Mỗi tài khoản có mật khẩu ngẫu nhiên riêng; không còn mật khẩu dùng chung. Danh sách đầy đủ 130 email và mật khẩu nằm trong `.audit-output/seed-credentials.json` trên máy local. File đó được Git ignore và nên giữ riêng tư. Các mật khẩu trong bảng chỉ dành cho môi trường local/dev; không dùng cho môi trường thật.

API smoke test đã xác nhận phân quyền: Admin 33 quyền, Quản lý rạp 8, CSKH 11, khách hàng 7. Ba tài khoản khách hàng cuối bộ seed bị khóa; email trên là một ví dụ.
