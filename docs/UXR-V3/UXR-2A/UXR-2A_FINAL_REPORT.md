# UXR-V3 — UXR-2A Final Acceptance Report

## Kết luận

**Exit Gate: BLOCKED.** Source implementation, existing component/regression tests, lint, and production build pass. Runtime browser acceptance could not start because available host browsers logged fatal GPU renderer initialization failures. Browser behavior and responsive screenshots therefore remain unverified.

Không bắt đầu UXR-2B hoặc UXR-2C.

## Browser preflight

| Browser | Kết quả |
|---|---|
| Chrome 155.0.8059.40 | **BLOCKED** — dùng cấu hình UXR-1D với profile riêng. Lần tái hiện bằng Node `spawn` giống UXR-1D: `/json/version` có phản hồi thoáng qua, nhưng `host-preflight.mjs` báo `DevTools endpoint unavailable`; GPU process kết thúc với `-1073741790`. Không có screenshot. |
| Edge 155.0.4283.45 | **BLOCKED** — profile task riêng; cùng GPU fatal. Không có kết quả preflight renderer hoặc screenshot. |

## Nguyên nhân đã xác minh và giới hạn chẩn đoán

- `-1073741790` unsigned-convert là `0xC0000022` / `STATUS_ACCESS_DENIED`, khớp [Microsoft's status definition](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-samr/7440cfac-6052-4925-84e4-c32e417de300). Log xác nhận GPU child process thất bại; nó không chỉ ra cụ thể phần cứng, driver, sandbox ACL hay Windows policy gây deny.
- Read-only ACL check: Users có Read/Execute cho hai executable; profile của task có Modify. Đây loại trừ thiếu quyền file cơ bản trên executable/profile, nhưng không xác minh quyền GPU sandbox/AppContainer tới device.
- Chrome/Edge logs ghi sharing violation `0x20` trên GPU persistent cache. Đây là mã khác với `0xC0000022`; tương quan chưa chứng minh quan hệ nhân quả.
- UXR-1D đã PASS với cùng Chrome `155.0.8059.40`/headless flags. Reproduction bằng đúng Node `spawn` UXR-1D vẫn mất CDP endpoint trước preflight. Khác biệt launcher được loại trừ như lời giải duy nhất.
- `Get-MpComputerStatus` và Device Guard trả **Access denied** dưới token hiện tại (medium integrity); không có Defender block events 1121–1123 khớp khoảng truy vấn. Code Integrity/AppLocker không cung cấp record phù hợp. Không đủ quyền đọc để khẳng định Windows Security đang cho phép hay chặn GPU child process. Không đổi/tắt bảo vệ.
- Môi trường độc lập không có sẵn trong checkout: không có `.github/workflows`, Docker, WSL distro, Firefox hay Playwright browser/package. Vì worktree có các thay đổi chưa commit, không upload/publish source lên remote CI trong task này.

Đã thêm [run-host-preflight.mjs](run-host-preflight.mjs) để tái sử dụng exact Node launcher và có timeout; CDP timeout trong [run-browser-acceptance.mjs](run-browser-acceptance.mjs) cũng được giới hạn để runner fail fast khi endpoint biến mất. Root cause cụ thể vẫn **chưa xác định**.

### Trạng thái browser scenarios

| Scenario | Trạng thái |
|---|---|
| Preflight: trang đơn giản, JavaScript, input/button | **BLOCKED** — không có renderer result |
| `PageHeader`: action, breadcrumb, responsive | **BLOCKED / NOT RUN** |
| `FilterBar`: draft/apply/reset, pending/error | **BLOCKED / NOT RUN** |
| `ResourceTable`: STT, pagination, row action, loading/empty/error | **BLOCKED / NOT RUN** |
| `ResourceSelect`: keyboard, ID value, scope switching/stale state | **BLOCKED / NOT RUN** |
| `ConfirmDialog`: focus, Escape, Cancel, busy/double-submit | **BLOCKED / NOT RUN** |
| `AsyncState`: loading/empty/error/forbidden/notFound/conflict/retry | **BLOCKED / NOT RUN** |
| Responsive screenshots 390/768/1280/1440/1920 | **NOT CAPTURED** |
| Accessibility axe, keyboard/focus, overflow, console/network | **NOT VERIFIED** |
| UXR-1A/B/C/D browser regression trên source hiện tại | **NOT VERIFIED** |

Không dùng ảnh mẫu hoặc kết quả unit test thay cho browser evidence. Thư mục [screenshots](screenshots/README.md) giải thích vì sao chưa có ảnh.

## Kiểm thử không phụ thuộc browser

| Kiểm tra | Kết quả |
|---|---|
| Frontend tests | **PASS — 84/84**, rerun sau thay đổi timeout harness |
| Lint | **PASS — oxlint, không có findings** |
| Production build | **PASS** — output cô lập được tạo |
| Bundle warning | **WARNING** — JS chunk 591.35 kB vượt ngưỡng thông báo 500 kB; không làm build fail |

Chi tiết và log mới nhất: [TEST_EVIDENCE.md](TEST_EVIDENCE.md). Test suite có regression cho CSKH draft store/portal, staff bookings và Manager selector; các test đó không thay thế browser checks của UXR-1A/B/C/D.

## Thay đổi trong lần nghiệm thu này

- Không thay đổi shared component hoặc source nghiệp vụ.
- Thử Chrome 155 bằng đúng kiểu launch/config đã dùng ở host UXR-1D, với profile task riêng.
- Thử Edge 155 bằng profile riêng làm browser tương đương có sẵn.
- Tái hiện một lần bằng Node `spawn` khớp launcher UXR-1D; thêm [run-host-preflight.mjs](run-host-preflight.mjs) với timeout hữu hạn và cải thiện timeout CDP trong acceptance runner để tránh treo khi endpoint mất.
- Cập nhật browser evidence, test logs và báo cáo cuối. Không sử dụng, dừng hoặc xóa profile/browser của người dùng; profile test được giữ lại.

## Điều kiện đóng gate

Chạy [run-host-preflight.mjs](run-host-preflight.mjs) trên một Windows host/CI có quyền GPU renderer. Nếu PASS, khởi chạy fixture server theo hướng dẫn trong [run-browser-acceptance.mjs](run-browser-acceptance.mjs), chạy preflight trước, rồi mới chạy component acceptance. Sau đó mới có thể đánh giá lại UXR-2A Exit Gate.
