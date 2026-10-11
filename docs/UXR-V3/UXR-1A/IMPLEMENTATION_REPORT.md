# UXR-V3 — UXR-1A: CSKH Draft Safety

**Kết quả:** PASS trong phạm vi UXR-1A. Đã bảo vệ bản nháp, tách filter nháp/applied và xác minh các luồng chính trên Edge với API thật và DB test cô lập. Không bắt đầu UXR-1B, 1C, 1D hoặc giai đoạn sau.

## Thay đổi

- `frontend/src/pages/SupportPortal.jsx`
  - Tách bộ lọc đang nhập và bộ lọc đã áp dụng. Gõ filter không gọi lại queue; `Áp dụng bộ lọc`, `Đặt lại` và `Làm mới` chạy theo hành động rõ ràng.
  - Giữ complaint đang xem khi lọc hoặc tải lại queue, kể cả khi case không còn trong tập kết quả.
  - Lưu filter, case đang chọn và draft theo user scope + complaint ID trong `sessionStorage`; đổi case không làm lẫn nội dung và quay lại case cũ sẽ khôi phục draft.
  - Cảnh báo trình duyệt trước khi refresh/rời trang khi có thay đổi chưa lưu. Có xác nhận riêng trước khi bỏ bản nháp, với lựa chọn tiếp tục chỉnh sửa hoặc xác nhận bỏ.
  - Giữ `Ghi diễn biến` và `Cập nhật trạng thái` thành hai thao tác/API riêng. Chỉ xóa phần draft tương ứng sau khi API lưu thành công.
  - Giữ permission checks, API contract, append-only timeline, write lock, mounted guard và request generation guard; bổ sung kiểm tra selection ownership cho detail response.
- `frontend/src/features/support/supportDraftStore.js`
  - Thêm store phiên làm việc có scope theo tài khoản và khiếu nại; chuẩn hóa dữ liệu khi đọc, hỗ trợ storage fallback trong cùng tab, xóa riêng processing/status draft.
- `frontend/tests/supportDraftStore.test.js`
  - Thêm test cho cách ly tài khoản/case, khôi phục workspace, lưu status riêng, xóa draft và giữ nguyên queue state.

Không sửa Backend, Database schema/SP, REST contract, RBAC hoặc nghiệp vụ. Không thêm dependency.

## Kiểm thử

| Hạng mục | Kết quả |
|---|---|
| Frontend tests | **PASS — 74/74** |
| Oxlint | **PASS — không còn warning** |
| Production build | **PASS**; Vite vẫn cảnh báo bundle chính 582.61 kB vượt ngưỡng 500 kB. Đây không làm build thất bại và không được xử lý trong slice này. |
| DB test preflight/build | **PASS — 11 bước kiểm tra**; target riêng được xác nhận chưa tồn tại trước khi tạo bằng pipeline chuẩn. |
| Browser E2E | **PASS — 21 kiểm tra** trên Microsoft Edge headless/CDP, frontend + backend thật, đăng nhập CSKH thật và API thật trên DB test cô lập. |
| Runtime / HTTP | 0 runtime exception; 0 HTTP error response ngoài dự kiến. Trạng thái lỗi queue được kiểm tra bằng một network rejection có chủ đích trong browser, sau đó retry gọi API thật thành công. |
| Loading | PASS; response queue thật được trì hoãn trong browser để xác minh trạng thái loading. |
| Keyboard/focus | PASS; Tab chuyển từ filter trạng thái sang filter ưu tiên và focus-visible được xác nhận. Đây không phải kiểm toán WCAG/AT đầy đủ. |
| Responsive | PASS; không tràn ngang tại 390, 768, 1280, 1440, 1920 px. |

Browser E2E xác minh: nhập filter không reload queue; áp dụng filter vẫn giữ detail/draft; Cancel giữ draft; Discard xóa đúng draft; refresh queue; trạng thái loading/error/retry; chuyển A↔B không lẫn draft; response A đến muộn không ghi đè B; điều hướng SPA và quay lại; cảnh báo `beforeunload`; khôi phục sau refresh; đổi trạng thái không xóa processing draft; lưu processing tạo đúng một timeline entry và xóa draft sau khi server xác nhận.

Đã tạo DB test mới bằng pipeline test chuẩn vì DB baseline trước đó có tài khoản nhân viên inactive. Thử nghiệm browser tạo hai complaint test và ghi một thay đổi trạng thái cùng một processing entry trên DB test này. Không dùng production và không thay đổi dữ liệu/tài khoản trong DB cũ. DB test UXR-1A được giữ lại để có thể kiểm tra evidence.

## Ảnh trước / sau

Ảnh trước được chụp từ source tại HEAD trước khi triển khai; ảnh đã che tên người gửi và thông tin tài khoản. Ảnh sau dùng cùng complaint test, sau khi xác minh xử lý thành công.

| Viewport | Trước | Sau |
|---:|---|---|
| 390 px | [support-before-390.png](screenshots/before/support-before-390.png) | [support-after-390.png](screenshots/after/support-after-390.png) |
| 768 px | [support-before-768.png](screenshots/before/support-before-768.png) | [support-after-768.png](screenshots/after/support-after-768.png) |
| 1280 px | [support-before-1280.png](screenshots/before/support-before-1280.png) | [support-after-1280.png](screenshots/after/support-after-1280.png) |
| 1440 px | [support-before-1440.png](screenshots/before/support-before-1440.png) | [support-after-1440.png](screenshots/after/support-after-1440.png) |
| 1920 px | [support-before-1920.png](screenshots/before/support-before-1920.png) | [support-after-1920.png](screenshots/after/support-after-1920.png) |

## Giới hạn và rủi ro còn lại

- Draft được lưu trong `sessionStorage`, chỉ trong tab/session hiện tại; lưu thành công hoặc người dùng xác nhận bỏ sẽ xóa draft tương ứng. Nếu browser chặn session storage, fallback trong bộ nhớ giữ được SPA navigation nhưng không thể khôi phục sau khi đóng/reload tab; browser sẽ hỏi xác nhận trước khi rời trang.
- Browser E2E bao phủ workflow của tài khoản CSKH hợp lệ. Không chạy full screen-reader/axe/WCAG audit hoặc kiểm tra toàn bộ 44 Use Case vì ngoài phạm vi slice.
- Không thay đổi lỗi bundle-size warning vì đây là công việc ngoài UXR-1A.

## Điểm dừng

UXR-1A hoàn tất để nghiệm thu. Chưa triển khai redesign hoặc các slice UXR-1B/1C/1D.
