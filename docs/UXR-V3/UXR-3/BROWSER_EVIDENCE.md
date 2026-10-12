# UXR-3 — Browser evidence

**BLOCKED:** browser renderer không khởi động được; application acceptance **NOT VERIFIED**. Không có screenshot, console hoặc network trace của ứng dụng. Automated SSR/API/SP PASS được báo riêng trong [TEST_EVIDENCE.md](./TEST_EVIDENCE.md).

## Lần thử hiện tại

12/10/2026 khoảng 02:09 Asia/Bangkok, tương ứng `2026-10-11T19:09:11Z`. Windows host GUI launch Edge và Chrome, fresh profile riêng, CDP ports 9391/9392, mở about:blank, không có headless/GPU-disable/security-bypass flags. Start-Process WindowStyle Hidden tuân thủ môi trường; đây không phải buổi thao tác trực tiếp bằng desktop.

| Browser | Launch / preflight | Kết quả |
|---|---|---|
| Edge | [launch](./browser-gui/browser-launch.json), [preflight](./browser-gui/edge-preflight.json), [startup](./browser-gui/edge-startup.log) | BLOCKED: fetch failed, steps=[]; GPU exit -1073741790, fatal GPU process isn't usable. Goodbye. |
| Chrome | [launch](./browser-gui/browser-launch.json), [preflight](./browser-gui/chrome-preflight.json), [startup](./browser-gui/chrome-startup.log) | BLOCKED: fetch failed, steps=[]; GPU exit -1073741790, fatal GPU process isn't usable. Goodbye. |

Không suy diễn nguyên nhân là app lỗi hay asset hỏng. Không sửa Windows security, không tắt sandbox hoặc lặp renderer attempts vô hạn. Không có application route được mở thành công. Trước triển khai không thu được before screenshot; lần GUI preflight lưu ở đây diễn ra sau phần triển khai đầu, không thể retroactively tạo before evidence.

## Route / viewport matrix

| Route | 390px | 768px | 1280px | 1440px | 1920px |
|---|---|---|---|---|---|
| `/admin/cinemas` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `/admin/cinemas/images` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `/admin/facilities/rooms` (3A) | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `/admin/facilities/seats` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `/manager/rooms` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| `/manager/seats` | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |

Direct URL/reload/back/forward, active sidebar, drawer, Tab/Shift+Tab/Enter/Space/Escape, trap/restore focus, Arrow/Home/End, seat scroll/zoom/touch targets, 130+ seats, axe, computed contrast, console/network, valid CRUD qua UI, image preview/fallback, occupancy held/sold và Manager multi-assignment UI đều NOT VERIFIED. CSS/handlers đã triển khai, chưa có visual acceptance.

Screenshots: [screenshots/README.md](./screenshots/README.md). Checklist chạy tiếp: [MANUAL_ACCEPTANCE_CHECKLIST.md](./MANUAL_ACCEPTANCE_CHECKLIST.md). Không lấy component render hoặc build output làm screenshot browser.

## Historical blockers giữ riêng

Không sửa/đóng các báo cáo hoặc log UXR-2A/B/C/3A:

- [UXR-2A final report](../UXR-2A/UXR-2A_FINAL_REPORT.md)
- [UXR-2B implementation report](../UXR-2B/IMPLEMENTATION_REPORT.md)
- [UXR-2C implementation report](../UXR-2C/IMPLEMENTATION_REPORT.md)
- [UXR-3A implementation report](../UXR-3A/IMPLEMENTATION_REPORT.md)

Browser blocker UXR-3 là bằng chứng mới ở thư mục này. Những gate cũ còn nguyên trạng thái, không tự đánh dấu PASS vì regression tự động mới.
