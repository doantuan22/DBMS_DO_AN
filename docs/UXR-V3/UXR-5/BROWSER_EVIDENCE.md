# UXR-5 — Before / after / browser evidence

**50 before**, **50 final after**: 10 screens × 390/768/1280/1440/1920 px. Before từ bản sao working tree trước UXR-5 (`source-baseline.json`), bao gồm UXR-4 đã hoàn thành nhưng chưa commit; không dùng HEAD cũ để giả làm baseline. Cả before và after sử dụng API/SP thật trên DB test ID 9, chỉ đọc trong bước capture. Chụp viewport 1000 px cao; nội dung dưới viewport vẫn có thể cuộn.

Convention: `screenshots/before/<module>-<width>.png` và `screenshots/after/<module>-<width>.png`. Ví dụ liên kết 390/1440 bên dưới; cả 5 widths được liệt kê trong before-screens.json / final-after-screens.json.

| Screen | Before 390 | After 390 | After 1440 |
|---|---|---|---|
| Tài khoản | [before](./screenshots/before/5A-users-390.png) | [after](./screenshots/after/5A-users-390.png) | [desktop](./screenshots/after/5A-users-1440.png) |
| Phân công | [before](./screenshots/before/5A-assignments-390.png) | [after](./screenshots/after/5A-assignments-390.png) | [desktop](./screenshots/after/5A-assignments-1440.png) |
| Phim | [before](./screenshots/before/5B-movies-390.png) | [after](./screenshots/after/5B-movies-390.png) | [desktop](./screenshots/after/5B-movies-1440.png) |
| Diễn viên | [before](./screenshots/before/5B-actors-390.png) | [after](./screenshots/after/5B-actors-390.png) | [desktop](./screenshots/after/5B-actors-1440.png) |
| Thể loại | [before](./screenshots/before/5B-genres-390.png) | [after](./screenshots/after/5B-genres-390.png) | [desktop](./screenshots/after/5B-genres-1440.png) |
| Sản phẩm | [before](./screenshots/before/5C-products-390.png) | [after](./screenshots/after/5C-products-390.png) | [desktop](./screenshots/after/5C-products-1440.png) |
| Khuyến mãi | [before](./screenshots/before/5C-promotions-390.png) | [after](./screenshots/after/5C-promotions-390.png) | [desktop](./screenshots/after/5C-promotions-1440.png) |
| Khiếu nại Admin | [before](./screenshots/before/5D-complaints-390.png) | [after](./screenshots/after/5D-complaints-390.png) | [desktop](./screenshots/after/5D-complaints-1440.png) |
| Dashboard | [before](./screenshots/before/5D-overview-390.png) | [after](./screenshots/after/5D-overview-390.png) | [desktop](./screenshots/after/5D-overview-1440.png) |
| Doanh thu | [before](./screenshots/before/5D-revenue-390.png) | [after](./screenshots/after/5D-revenue-390.png) | [desktop](./screenshots/after/5D-revenue-1440.png) |

Thêm **20 scenario captures đã kiểm tra**: 7 mobile editors (`edge-*-editor-390.png`), 1 [network error thực](./screenshots/after/edge-products-network-error-390.png), và 12 regression captures của sáu route UXR-4 tại 390/1440. Tổng after/scenario được chấp nhận **70 ảnh**; 5 ảnh `*-failure.png` còn lưu là diagnostic, không phải acceptance PASS.

[browser-suite.json](./browser-suite.json): **146 browser checks PASS**, 5 API-only edge assertions riêng; dữ liệu trước/sau có cùng fingerprint. [ui-edges.json](./ui-edges.json) chứng minh keyboard/native dialog/dirty Cancel+Confirm và lỗi mạng/Retry. Actual mutations và negative cases theo từng phase nằm trong 5A/5B/5C/5D-browser.json; ảnh không được dùng thay cho chứng minh API/SP mutation.

Viewport emulation không tương đương thiết bị vật lý hoặc screen reader acceptance. Bộ evidence hiện tại không tuyên bố all 44 UC đã E2E replay.
