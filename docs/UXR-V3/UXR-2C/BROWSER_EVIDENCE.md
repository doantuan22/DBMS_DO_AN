# UXR-2C — Browser evidence

Ngày nghiệm thu: 12/10/2026, Asia/Bangkok. **Kết quả: BLOCKED trước renderer preflight.**

## Attempt riêng của UXR-2C

Đã chạy Edge và Chrome thật với `--headless=new`, fresh profile trong `.audit-output`, CDP ports 9375/9376, không thêm GPU flags và không dùng profile của người dùng. Các process được khởi động hidden theo quy định môi trường. Không dừng process browser khác.

| Browser | Kết quả | Evidence |
|---|---|---|
| Edge | CDP fetch failed; startup log có GPU child exit -1073741790 (0xC0000022), fatal `GPU process isn't usable` | [edge-preflight.json](edge-preflight.json), [edge-startup.log](edge-startup.log) |
| Chrome | CDP fetch failed; startup log có cùng GPU child exit và fatal | [chrome-preflight.json](chrome-preflight.json), [chrome-startup.log](chrome-startup.log) |

[browser-launch.json](browser-launch.json) ghi process/port/profile/mode. Runner: [PowerShell launcher](run-renderer-preflight.ps1), [CDP preflight](run-renderer-preflight.mjs). Timestamp JSON theo UTC; 2026-10-11T18:07Z tương ứng 12/10/2026 khoảng 01:07 Asia/Bangkok.

Preflight yêu cầu JavaScript, input/button và screenshot, nhưng chưa chạy được bước nào; `steps: []`. Application không được mở, backend/database không khởi chạy cho browser acceptance. Không có screenshot, application console capture hoặc application API/network capture. Screenshot giả/SSR không được dùng thay evidence.

## Route acceptance thực tế

| Route | Browser verdict |
|---|---|
| `/manager/overview` | BLOCKED / NOT VERIFIED |
| `/manager/rooms` | BLOCKED / NOT VERIFIED |
| `/manager/seats` | BLOCKED / NOT VERIFIED |
| `/manager/showtimes` | BLOCKED / NOT VERIFIED |
| `/manager/pricing` | BLOCKED / NOT VERIFIED |
| `/manager/revenue` | BLOCKED / NOT VERIFIED |
| `/manager/bookings` | BLOCKED / NOT VERIFIED |
| `/manager` và legacy hash | BLOCKED / NOT VERIFIED |

Deep-link, real reload, browser back/forward, active navigation/breadcrumb DOM, API 403/404/out-of-scope, dirty Cancel/Confirm, late responses, booking mounted state, drawer keyboard/focus và 390/768/1280/1440/1920px đều **NOT VERIFIED trên browser**. MemoryRouter/SSR/state tests được ghi riêng trong implementation report; không thay cho browser acceptance.

## Blockers kế thừa — giữ riêng

- **UXR-2A:** [BROWSER_EVIDENCE.md](../UXR-2A/BROWSER_EVIDENCE.md), [UXR-2A_FINAL_REPORT.md](../UXR-2A/UXR-2A_FINAL_REPORT.md). Status cũ không được đổi thành PASS.
- **UXR-2B:** [BROWSER_EVIDENCE.md](../UXR-2B/BROWSER_EVIDENCE.md), gồm GUI và plain GUI retry trước đó. Status cũ không được đổi thành PASS.
- **UXR-2C:** headless renderer attempt trên source hiện tại như bảng trên; đây là evidence mới, không gộp hoặc ghi đè lịch sử UXR-2A/2B.

Retest trên host có renderer hoạt động theo [MANUAL_ACCEPTANCE_CHECKLIST.md](MANUAL_ACCEPTANCE_CHECKLIST.md); chỉ đóng Exit Gate sau browser smoke thật.
