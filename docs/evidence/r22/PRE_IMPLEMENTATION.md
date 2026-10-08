# R2.2 trace trước implementation

1. Promotion nằm trong `dbo.KHUYENMAI`.
2. PK `KhuyenMaiID INT IDENTITY`; code `MaCode VARCHAR(50)` có UNIQUE, collation Vietnamese_CI_AS.
3. Quota `SoLuong`; counter `SoLuongDaDung`; CHECK 0 <= counter <= quota.
4. Usage là counter tăng khi booking; FK `DONDATVE.KhuyenMaiID` và snapshot `TienGiamGia` ghi đơn đã áp dụng.
5. Không có bảng promotion-usage riêng, không có per-user/cinema/movie scope.
6. Booking bước 8: EXEC validate, sau đó UPDATE counter, rồi INSERT order/tickets/foods trong transaction hiện có.
7. Preview check tồn tại, active, start/end inclusive, quota, minimum; tính giảm trong SQL. Type/value/max được CHECK bảo vệ.
8. Booking gọi lại cùng SP trên tổng vé + đồ ăn trước giảm, nhưng chỉ khóa lúc tăng counter.
9. Invalid: SET promotion ID NULL và discount 0 rồi tiếp tục.
10. Có silent fallback full price.
11. Discount do SQL SP tính; JS chỉ cộng subtotal preview từ typed SP reads. Booking tính lại mọi snapshot.
12. Minimum so với `TongTienVe + TongTienDoAn` trước giảm.
13. Phần trăm/PERCENT và Số tiền/FIXED.
14. GiamToiDa nullable giới hạn percentage; fixed giữ công thức cũ, cả hai bị cap 99% subtotal (ROUND truncate).
15. fn_BayGio = SYSUTCDATETIME(), DATETIME2(7). Promotion SP trước sửa dùng local variables DATETIME2 mặc định precision7; boundary inclusive.
16. Admin Update: một UPDATE autocommit lấy U/X row lock; không viết order/customer hay counter. SQL locks serialize với booking giữ promotion U lock.
17. Admin Create/Update/Delete; expiry, customer cancel (dead API path), showtime cancel trả quota. Tooling được phép SQL; backend chỉ execute whitelist. Không có promotion trigger/function discount riêng.
18. Race validate-before-lock có thể vượt quota và gặp CHECK thay vì domain error; không có idempotency key. Retry cùng ghế bị seat conflict trước consume.
19. Counter và inserts cùng booking transaction/savepoint nên rollback được; cần injection sau consume chứng minh.
20. Sau R2.1: customer -> movie S -> cinema S -> room U -> show U -> expiry/order -> seat/conflict -> product -> promotion -> order/ticket/food. Giữ hierarchy; promotion đứng sau tài nguyên booking. Admin Update chỉ promotion. Admin Delete đọc order rồi DELETE promotion trước sửa: cần khóa promotion trước khi đọc relationship, cùng transaction/savepoint, đọc relationship qua RCSI để tránh order -> promo inversion.

HTTP trace: POST /promotions/validate -> authenticate/customer/DAT_VE -> bookingController -> validatePromotion -> bookingService -> typed procedureClient -> sp_Promotion_Validate. POST /bookings theo cùng guards -> validateBooking -> BOOKING_CREATE; sp_DatVe delegate.

Frontend: BookingPreparation input/apply -> catalogApi preview, hiện hiển thị giảm tạm tính; submit luôn gửi code, không gửi discount. Preview response đang thiếu invalidation nếu selection/code đổi trong lúc request chờ. Sửa riêng stale promotion preview và domain rejection; không sửa async tổng thể R8.

Thiết kế: lock code WITH(UPDLOCK,HOLDLOCK) trong transaction, gọi shared validation sau lock, lấy DB now sau lock wait, invalid THROW50029 -> HTTP409 PROMOTION_NOT_AVAILABLE. Giữ formula/schema/signatures. Preview không lock/reserve/write; giải thích rõ không guarantee. Tests/evidence mới độc lập r22, bảo toàn evidence r21 và R0/R1.
