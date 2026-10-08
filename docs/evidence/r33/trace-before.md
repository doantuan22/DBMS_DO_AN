# Trace trước implementation — R3.3 / I-16

Đã đọc R3.3 trong roadmap và toàn bộ request Task8 trước implementation. Không triển khai R4.

1. Trigger status: dbo.TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.
2. Chỉ AFTER INSERT trên XULY_KHIEUNAI; không thêm UPDATE/DELETE event trong Task8.
3. XuLyID INT IDENTITY(1,1) NOT NULL.
4. PK_XULY_KHIEUNAI clustered unique XuLyID bảo đảm không tie.
5. XULY_KHIEUNAI.KhieuNaiID FK→KHIEUNAI.KhieuNaiID; ON DELETE CASCADE; update NO ACTION.
6. UPDATE parent SET TrangThai=i.TrangThaiSauXuLy JOIN INSERTED trực tiếp theo complaint ID.
7. Không scalar variable hiện tại; JOIN có nhiều source rows/target parent nên chọn status không xác định khi multi-row same parent.
8. Status trigger không TOP1.
9. Queue view có TOP1 ORDER BY XuLyID DESC rõ ràng cho latest timestamp/processor/content; không cần sửa.
10. JOIN cập nhật nhiều parent nhưng không kiểm soát nguồn duy nhất cho mỗi parent.
11. Multiple processing same complaint gây ambiguous update, không bảo đảm max persisted XuLyID.
12. KHIEUNAI CHECK: Mới/Đang xử lý/Đã giải quyết/Đã đóng/Từ chối. Processing CHECK: Đang xử lý/Đã giải quyết/Đã đóng/Từ chối; không Mới, không Chờ phản hồi.
13. Không có terminal-state override độc lập; UpdateStatus tạo processing event, trigger quyết định parent. Auth/role/permission và CHECK/FK phải giữ nguyên. Không cấm transition mới ngoài schema.
14. Không SP nào UPDATE parent status trực tiếp: Create tạo Mới; AddProcessing và UpdateStatus INSERT history. sp_XuLyKhieuNai delegate AddProcessing.
15. TRG_XuLyKhieuNai_KiemTraVaiTro AFTER INSERT,UPDATE dùng EXISTS set-based và THROW50005 nếu actor không active CSKH/Admin. Không trigger khác trên KHIEUNAI, không disable/order lại role trigger.
16. Customer/support detail histories ORDER BY NgayXuLy ASC hiện hữu; giữ contract hiển thị, không chuyển status authority sang timestamp. Queue latest descriptors theo XuLyID DESC.
17. Status trigger chỉ quản lý KHIEUNAI.TrangThai; không history write/delete, không sửa customer/order/content/time/actor.
18. AddProcessing/UpdateStatus BEGIN TRAN, INSERT, COMMIT; CATCH rollback toàn bộ nếu có transaction. Success caller transaction vẫn còn do nested BEGIN/COMMIT. Không thêm transaction logic trong Node hoặc đổi convention SP trong task này.
19. SQL active account→role CSKH/Admin→QL_KHIEUNAI và XULY_KHIEUNAI. Express authenticate/load live permissions→CSKH role riêng hoặc Admin role trên Admin routes→permission conjunction. Customer detail/list enforce own complaints; CSKH/Admin xử lý toàn hệ, không cinema/owner assignment scope.
20. Runtime chỉ fixed whitelist typed .execute(): supportService.AddProcessing/UpdateStatus; Admin routes dùng cùng support service. Không batch HTTP endpoint, không direct table SQL/processing UPDATE/DELETE route. Ad-hoc privileged SQL thuộc accepted R0 constraint.

Schema/index: KHIEUNAI clustered PK ID, indexes owner/status, status/priority/date, filtered orderID; XULY clustered PK ID và IX_XULY_KHIEUNAI_KhieuNai(KhieuNaiID,NgayXuLy DESC). Không thay FK/CHECK/index/schema. Actual parent latest policy theo identity, không lấy MAX/MIN status hoặc physical VALUES order.

Concurrency: canonical SPs kiểm tra complaint tồn tại rồi INSERT, không lock parent trước identity allocation. INSERTED-only ranking chưa đủ nếu smaller identity chậm trong trigger và larger identity commit trước. Phương án cần resource barrier parent U/HOLD trước latest-history statement read với existing READ COMMITTED/RCSI, rank toàn lịch sử của distinct affected parents; test bằng sessions/DMV, không NOLOCK. Không tuyên bố deadlock-free; batch FK/parent locks có thể tranh chấp và SQL victim phải rollback.

Backend trace: supportRoutes/controller/supportValidator/supportService/procedureClient; complaintRoutes/feedbackController/feedbackValidator/feedbackService; Admin complaint routes reuse supportService. Required content/status và unknown fields giữ nguyên; missing resource404, role/permissions403; unexpected errors sanitized. No API contract change needed.

Frontend: SupportPortal thêm diễn biến/đổi status rồi load queue/detail; ComplaintDetail hiển thị parent và processingHistory; Complaints hiển thị own status; AdminPortal dùng same CSKH SPs. Không sửa frontend hoặc stale-response handling R8.

Pre-task source/evidence freeze lưu riêng r33; accepted R0/R1/R2/R3.1/R3.2 artifacts không overwrite. Main fingerprint read-only trước mọi test; disposable before/current rebuild dùng convention repository.
