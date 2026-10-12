# UXR-4 — Báo cáo triển khai và nghiệm thu

Ngày 12/10/2026. **UXR-4A/B/C/D đã triển khai trong phạm vi frontend và API/SP hiện có. Core acceptance: PASS** trên source, automated tests, HTTP/SP/SQL Server và Chrome thật. Không sửa schema, procedure, backend, RBAC hay contract API. Không tuyên bố 44/44 UC hoặc mọi môi trường production đã được E2E kiểm chứng.

## Kết quả từng work package

| Phần | Thay đổi | Bằng chứng hiện tại |
|---|---|---|
| 4A Suất chiếu Admin/Manager | Workspace list-first dùng chung; tên rạp/phòng/phim; rạp → phòng; khoảng ngày inclusive UTC+7; phim/trạng thái; STT/phân trang; xem chi tiết; create/edit trong dialog; cancel riêng | PASS: controller/routing/timezone tests, actual frontend adapter → HTTP/SP create/edit/cancel, overlap/held-order/scope rejection; browser named create/edit/cancel, overlap 409, filter, focus/keyboard/reload |
| 4B Bảng giá Admin/Manager | Lọc rạp/loại ghế/ba loại ngày/định dạng/status/ngày hiệu lực; bảng curated; phụ thu VND; editor tên; rạp bất biến; ngày kết thúc mở; validation tiền/ngày | PASS: enum/contract/controller tests; HTTP/SP create/edit/scope/overlap; historical snapshot trước/sau sửa price master trong transaction rollback; browser create/edit/filter/reset/open end |
| 4C Danh sách/chi tiết đặt vé | Mã đơn nghiệp vụ, STT theo server page, tên khách/phim/rạp/phòng, số vé/ghế, tổng snapshot, latest-payment status; list/detail tách; ticket/product/promotion/payment/cancel/compensation history; hold countdown | PASS: server-filter/page/PII/403/404/race tests, actual scoped list/detail; browser search/empty/reset, paid/canceled read-only, deep-link/reload, Manager Back/Forward/draft |
| 4D Staff create/edit/cancel | Customer có sẵn → rạp/suất → ghế → review/confirm → đơn thực; immutable owner/showtime; versioned seat edit; server cancellation; single write lock; conflict recovery; persistent Manager draft/scope/epoch | PASS: actual guided browser create/edit/cancel cho cả hai vai trò, duplicate-click guard, cạnh tranh ghế thực/409/giữ draft/phục hồi; HTTP concurrent creates/edits, payment protection, role/customer/scope guards, retained tickets/deadline/history |

## Thay đổi source và routing

- `frontend/src/features/operations/OperationsScreen.jsx`: presentation chung; headers, named context/filter, curated table, detail/editor/confirmation, URL và Manager wrapper. `operationsAdapters.js` chỉ gọi clients hiện có; `operationsModel.js` xử lý presentation/filter; `operationsController.js` sở hữu read generations, draft và write lock.
- `frontend/src/features/staff-bookings/StaffBookings.jsx`: route/role/context, list và composition. `BookingDetail.jsx` đọc snapshot/history/capability; `BookingEditor.jsx` guided flow. `bookingController.js` giữ read/write ownership và draft; `bookingModel.js` quản lý safe query, selection, expiry.
- `ManagerResourceForm.jsx`: tái sử dụng cho cả Admin và Manager qua normalized data; guarded close, bỏ ID kỹ thuật trong heading, UTC+7/VND và hiển thị tiền phân nhóm. `NamedResourceSelect.jsx`: nhãn lựa chọn rỗng theo context. `managerForms.js`: validation tiền hữu hạn/không âm và thứ tự thời gian; payload edit không gửi roomId.
- `AdminSectionRoute.jsx` / `ManagerSectionRoute.jsx`: đưa showtimes/pricing vào workspace mới. **Giữ** `/admin/operations/showtimes`, `/admin/operations/pricing`, `/admin/bookings`, `/manager/showtimes`, `/manager/pricing`, `/manager/bookings`. Entry/deep-link/sidebar/RequireRole giữ ownership hiện có.
- CSS feature dùng design tokens trắng–xanh; list scroll có chủ đích, ẩn cột phụ ở mobile; editor focus theo bước; lỗi grid min-content/chiều cao filter 390 px đã được phát hiện và sửa bằng browser thật.

## Kiểm thử và regression

- **179 frontend tests PASS**, gồm 27 tests mới cho operations/booking workflow và toàn bộ regression hiện hữu. **44 focused tests PASS** ở lượt xác minh cuối cho controller/screens/routing sau điều chỉnh URL.
- **205 backend tests PASS** trên source backend hiện hành; covers authorization, fixed RBAC, price/room/showtime/booking concurrency contracts, history, image ownership, support và payment.
- **127 request thực + 15 nhóm assertions PASS**: frontend clients/controllers thật → HTTP loopback → middleware/services hiện có → SP trên DB cô lập `CinemaBookingDB_R0_STAFF_BOOKING_20261011_V2` (DB ID 9).
- **62 browser checks PASS**, Chrome thật/CDP → Vite → Express → SQL Server. Sáu route × năm widths 390/768/1280/1440/1920; actual create/edit/cancel theo từng module, server conflict, keyboard seat toggle, dialog focus/Tab/Shift+Tab/Escape, history, duplicate submit, Manager navigation. Không có runtime exception hoặc application HTTP 5xx trong tập chạy. Các 409 có chủ đích được xác nhận riêng.
- **30 before captures** từ bản sao source HEAD `306290f454a807bd81f16feb6a9bad7ad6fd827e`, chỉ đọc DB; **45 after/scenario captures** và 2 ảnh diagnostic. Không checkout/reset working tree; before là baseline đã commit, after là source UXR-4 hiện tại, không phải mockup.
- **Lint PASS, production build PASS, no-business-SQL audit PASS, git diff --check PASS**. Build giữ warning bundle khoảng 699 kB, gzip khoảng 203 kB; chưa mở thêm workstream code splitting.
- **Preservation PASS:** 18 file nền so với HEAD không đổi; không có diff trong backend/database/shared/API/auth. Ma trận hiện hành vẫn **44 UC hoạt động / 3 RETIRED / 47 ID**; không triển khai ADM-17 hoặc RBAC động.
- Test fixtures được tạo riêng trong DB cô lập và dọn đúng room/price IDs/owner prefix. Price-master snapshot check rollback. Sau các lượt kiểm tra, danh mục trở lại 7 price rules, 4 movies, 3 cinemas, 6 rooms, 32 showtimes. Main DB không deploy/migrate/reset.

Chi tiết machine-readable, lệnh, lỗi harness và scope của từng verdict: [TEST_EVIDENCE.md](./TEST_EVIDENCE.md). Before/after và kịch bản browser: [BROWSER_EVIDENCE.md](./BROWSER_EVIDENCE.md).

## Capability gaps / NOT VERIFIED

- Booking filters theo ngày/suất/payment-status, staff product/promotion mutation, voluntary refund, hard delete và manual paid **không có contract đã duyệt** trong staff API. Không dựng control giả hoặc thêm endpoint. Đây là capability gaps cho workstream backend/DB riêng, không chặn create/seat-edit/cancel đã có.
- Options hiện cap 50 Customer / 200 showtimes và trả total; UI nói rõ phạm vi và yêu cầu thu hẹp Customer. Tra cứu suất vượt cap cần workstream API riêng; không lọc một server page rồi giả là toàn bộ dataset.
- Multi-assignment A→B→A, revocation trong pending write và late response: **PASS automated controller/store**. **NOT VERIFIED live browser với một actor thực có nhiều rạp**, vì DB test có Manager tách rạp, không tự thay assignments/RBAC để tạo bằng chứng.
- **NOT VERIFIED**: toàn bộ edge matrix browser 401/403/404/network failure/hold expiration/inactive Customer và mọi biến thể product/promotion/used ticket; các contract/read-only/expiry guards tương ứng đã được kiểm tra bằng automated tests/source/API ở phạm vi ghi trong evidence. Không dùng PASS backend thay cho browser verdict của kịch bản chưa chạy.
- Chưa chạy full Edge journey (Edge renderer preflight PASS), axe/screen reader/touch device hoặc volume/load test production. Kích thước catalogue/price/range hiện được xác minh trên DB cô lập; khả năng mở rộng dataset lớn cần server pagination/filter workstream.
- Các tệp standards cũ/đích mà Blueprint tham chiếu không có trong checkout; áp dụng trực tiếp Blueprint §§2/4 và tokens/shared components hiện hành. Historical browser gates của UXR-2/3 vẫn giữ báo cáo cũ, không tự đánh dấu đã đóng bởi các kiểm tra UXR-4.

## Khả năng chuyển UXR-5

Source, core nghiệp vụ và browser acceptance UXR-4 đủ để tiếp tục **UXR-5 trong frontend**. Những capability gaps trên cần phê duyệt workstream riêng nếu muốn mở rộng nghiệp vụ. Không mở UXR-5 hoặc thay backend/DB trong phiên này. Integration acceptance toàn dự án vẫn cần UXR-7 theo Blueprint.
