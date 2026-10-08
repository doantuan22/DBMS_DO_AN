# Trace trước implementation — R3.2 / I-09

Đã đối chiếu roadmap R3.2 và source trước thay đổi; không triển khai trước khi hoàn thành trace này.

1. Hai Showtime Update nhận PhimID, start/end DATETIME2(7), DinhDang, GiaVeCoBan DECIMAL(18,2), TrangThai; ghi cả sáu parameter vào SUATCHIEU. Mọi field update đều required, không có default/patch semantics.
2. Không nhận PhongID/roomId khi update. Phòng được resolve từ persisted row và giữ nguyên. API whitelist từ chối roomId; SQL parameter PhongID không thuộc contract. Không thêm chuyển phòng.
3. Có check DONDATVE trước update sau room/show locks.
4. Check cũ chỉ paid hoặc pending còn HanGiuCho; bỏ canceled/expired/refunded/completed records.
5. GiaVeCoBan không có trong guard; có thể đổi sau order.
6. DinhDang được guard nhưng chỉ khi active order.
7. Manager/Admin cùng flawed guard. Manager kiểm tra active role/QL_SUAT_CHIEU và current cinema assignment; Admin active role/permission. Routes thêm JWT/current identity/role/permission. Typed whitelist .execute() authoritative tại SQL.
8. Seat Update nhận LoaiGhe/TrangThai, cả hai required; không đổi PhongID/HangGhe/SoGhe. Manager/Admin lock GHE trước guard/write.
9. Chỉ fn_GheCoVeHieuLucSuatTuongLai; chưa có unconditional CHITIETVE history guard cho type.
10. Function cũ chỉ ticket Đã đặt + future show + held/paid effective order. Canceled/used/expired tickets bị bỏ qua. Existing operational restriction này phải giữ nguyên, kể cả request type không đổi.
11. Booking ghi CHITIETVE.GiaVe bằng fn_TinhGiaVe lúc booking; DONDATVE tổng tiền/discount persisted. BANGGIA update chỉ sửa BANGGIA, không rewrite ticket/order.
12. sp_Order_GetDetailByCustomer đọc CHITIETDOAN.DonGia và quantity*DonGia; tên/loại sản phẩm JOIN current SANPHAM. Product Update sửa catalog price, không sửa historical food. Payment CreateAttempt ghi SoTien từ order totals; UpdateResult không tính lại amounts theo catalog.
13. Showtime Update đã XACT_ABORT ON, TRY/CATCH own/savepoint và discovery RCSI → PHONGCHIEU U/HOLD → SUATCHIEU U/HOLD. Seat Update own/savepoint, GHE U/HOLD; chưa SET XACT_ABORT ON. CATCH không nuốt lỗi.
14. Booking giữ customer → movie S → cinema S → room U → show U → seat U → ticket guards → product → promotion tới transaction end. Showtime guard sau cùng room/show locks sẽ nhìn thấy booking winner đã commit. Seat guard sau GHE lock nhìn thấy ticket winner đã commit. Không cần sửa booking/shared protocol; thêm khóa CHITIETVE/DONDATVE trước parent có thể đảo order, nên không làm. RCSI read history là statement sau lock acquisition. Race tests phải đo thực tế cả hai thứ tự.
15. Relevant structural writers chỉ hai Showtime Update và hai Seat Update. CancelCascade chỉ đổi show status + order/ticket lifecycle theo policy; aliases create/cancel delegate canonical flow. Seat BatchCreate kiểm tra bất kỳ ticket trong phòng trước DELETE, FK NO ACTION bảo vệ GHE đang referenced; không phải type update bypass. Seat Delete chặn history hoặc FK, Room Delete giữ accepted policy. Không có production trigger/history constraint bảo vệ structural fields; trigger hiện hữu bảo vệ overlap và seat đúng phòng/trùng vé. Administrative ad-hoc SQL của runtime sa thuộc accepted R0 constraint, không phải application writer.

## Schema, indexes và consumers

SUATCHIEU/GHE có clustered PK INT, structural columns NOT NULL. SUATCHIEU indexes movie/time và room/time; DONDATVE IX_DONDATVE_SuatChieu(SuatChieuID,TrangThai); CHITIETVE IX_CHITIETVE_GheID(GheID,TrangThai). Các indexes giữ nguyên, history predicates không filter status. FK DONDATVE→SUATCHIEU, CHITIETVE→GHE NO ACTION; children→order cascade hiện hữu. CHECK enums, times và nonnegative amounts giữ nguyên. Snapshot columns: CHITIETVE.GiaVe, CHITIETDOAN.DonGia, DONDATVE.TongTienVe/TongTienDoAn/TienGiamGia, THANHTOAN.SoTien.

Readers sp_Order_GetDetailByCustomer/ sp_Order_ListByCustomer và vw_ChiTietDonDatVe/vw_LichSuDatVe JOIN current movie/cinema/room descriptors và structural show/seat fields. Detail hiện có expiry side effect (I-22), giữ ngoài scope. Core references/type/time/format sẽ được bảo vệ qua canonical writers; TenPhim/TenRap/TenPhong/TenSanPham tiếp tục current descriptors, không snapshot tên hoặc thêm bảng/column.

API Manager PUT /manager/showtimes/:id, /manager/seats/:id và Admin equivalents → controllers → validators → services → typed fixed whitelist. Required values/unknown roomId bị validator chặn; direct SQL null không được trở thành patch. Existing 50120 SHOWTIME_HAS_ORDERS409 và50207 SEAT_HAS_TICKET_HISTORY409 có thể reuse; sửa message phản ánh policy. Missing/scope/RBAC/lifecycle mappings giữ nguyên.

ManagerPortal/ManagerResourceForm và AdminPortal/adminForms hydrate persisted fields, không gửi roomId khi edit show. Reject giữ form để chỉnh, không cập nhật row giả; success reload. Có thể thêm localized feedback cho hai conflict codes, không redesign. Accepted R1/R2/R3.1 full runners sẽ replay chỉ redirect import/output về r32; mọi evidence/source không thuộc allowlist được hash trước sửa.
