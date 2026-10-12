# UXR-3A — Browser evidence

Verdict browser: **BLOCKED**. UI acceptance/screenshots: **NOT VERIFIED**. Không có `BROWSER VERIFIED` hoặc `E2E PASS` cho 3A.

Đã launch Chromium thật với profile mới trong workspace, `--headless=new`, không GPU override, hidden window. Preflight thử CDP page target → JavaScript/input/button → screenshot; cả hai browser không qua bước fetch targets. Không dùng SSR/HTML screenshot thay evidence browser. Không mở application route, login hoặc thực hiện CRUD giả.

| Thời điểm Bangkok | Browser / port | Kết quả | Bằng chứng |
|---|---|---|---|
| 12/10/2026 01:25:24, trước source changes | Edge / 9381 | BLOCKED, fetch failed, steps=[] | [JSON](browser-before/edge-preflight.json), [startup](browser-before/edge-startup.log) |
| 12/10/2026 01:25:24, trước source changes | Chrome / 9382 | BLOCKED, fetch failed, steps=[] | [JSON](browser-before/chrome-preflight.json), [startup](browser-before/chrome-startup.log) |
| 12/10/2026 01:40:09, sau implementation workspace | Edge / 9383 | BLOCKED, fetch failed, steps=[] | [JSON](browser-after/edge-preflight.json), [startup](browser-after/edge-startup.log) |
| 12/10/2026 01:40:09, sau implementation workspace | Chrome / 9384 | BLOCKED, fetch failed, steps=[] | [JSON](browser-after/chrome-preflight.json), [startup](browser-after/chrome-startup.log) |

Startup logs ghi GPU process exited `-1073741790` (`0xC0000022`) và `FATAL: GPU process isn't usable. Goodbye.` Profiles/PIDs/flags tại [before launch](browser-before/browser-launch.json), [after launch](browser-after/browser-launch.json). Chưa xác định root cause chỉ từ exit code; không coi đây là lỗi UI Rooms hoặc sửa browser policies/system settings.

Reproduce local:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/UXR-V3/UXR-3A/run-renderer-preflight.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/UXR-V3/UXR-3A/run-renderer-after.ps1
```

ExecutionPolicy Bypass chỉ áp dụng process chạy script local, không đổi system policy. Script đầu ghi root artifacts trước; bản evidence trước đã được lưu riêng `browser-before/`. Script sau ghi `browser-after/`; exit 0 của runner có nghĩa **đã ghi evidence**, verdict phải đọc JSON. Không diễn giải runner exit 0 là browser PASS.

| Acceptance | 390 | 768 | 1280 | 1440 | 1920 |
|---|---|---|---|---|---|
| List/filter/table/actions overflow | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Rooms drawer/focus/escape/restore | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| StaffShell mobile navigation / keyboard | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| Before/after screenshot | Không có | Không có | Không có | Không có | Không có |

Live API/DB/RBAC/history acceptance cũng **NOT VERIFIED**; mocked service/controller tests không thay thế. [Checklist](MANUAL_ACCEPTANCE_CHECKLIST.md) chỉ rõ các bước còn lại.

## Blockers lịch sử giữ riêng

- [UXR-2A report](../UXR-2A/IMPLEMENTATION_REPORT.md): không sửa verdict/browser evidence.
- [UXR-2B report](../UXR-2B/IMPLEMENTATION_REPORT.md): không sửa verdict/browser evidence.
- [UXR-2C report](../UXR-2C/IMPLEMENTATION_REPORT.md): không sửa verdict/browser evidence.

3A có attempts/logs riêng. Automated PASS ở 3A không đóng bất kỳ browser blocker nào của 2A/B/C.
