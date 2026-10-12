# UXR-2A Browser Evidence

## Kết luận

**Browser acceptance: BLOCKED.** Chrome và Edge đều dừng ở lỗi khởi tạo GPU renderer. Lần Chrome cuối dùng Node `spawn` giống runner UXR-1D: CDP version endpoint xuất hiện thoáng qua nhưng biến mất trước khi host preflight kết nối được. Không có browser preflight nào được xác nhận PASS; do đó không chạy acceptance component hoặc chụp screenshot theo kích thước viewport. Không dùng screenshot giả.

## Các lần thử trên host

| Browser | Cấu hình | Kết quả | Evidence |
|---|---|---|---|
| Chrome `155.0.8059.40` | Cấu hình host UXR-1D: `--headless=new`, profile riêng dưới `.audit-output`, cổng CDP riêng; không thêm cờ tắt GPU | **BLOCKED** — log ghi `DevTools listening`, nhiều lần GPU process exit `-1073741790`, sau đó `GPU process isn't usable. Goodbye.` Runner không trả về kết quả renderer preflight. | [chrome-host-155.stderr.log](chrome-host-155.stderr.log), [chrome-host-155.stdout.log](chrome-host-155.stdout.log) |
| Edge `155.0.4283.45` | Headless, profile riêng dưới `.audit-output`, cổng CDP riêng; không thêm cờ tắt GPU | **BLOCKED** — cùng lỗi GPU fatal; không có kết quả JavaScript interaction hoặc screenshot được ghi nhận. | [edge-host-155.stderr.log](edge-host-155.stderr.log), [edge-host-155.stdout.log](edge-host-155.stdout.log) |
| Chrome `155.0.8059.40`, direct reproduction | `node:child_process.spawn`, cùng executable, flags, profile riêng và CDP flow như UXR-1D; giới hạn chờ hữu hạn | **BLOCKED** — CDP `/json/version` có phản hồi, nhưng runner UXR-1D `host-preflight.mjs` sau đó báo `DevTools endpoint unavailable`; Chrome log lại GPU fatal. | [browser-preflight-node-spawn.json](browser-preflight-node-spawn.json), [run-host-preflight.mjs](run-host-preflight.mjs), [chrome-node-spawn-preflight.stderr.log](chrome-node-spawn-preflight.stderr.log) |

Lần thử UXR-2A ban đầu với cờ GPU khác vẫn được giữ riêng tại [browser-preflight.json](browser-preflight.json) và [chrome-browser-startup.log](chrome-browser-startup.log). Không lặp lại cấu hình đó. Log UXR-1D lưu cấu hình Chrome đã PASS ở lần chạy trước; kết quả cũ không chứng minh renderer của môi trường hiện tại hoạt động.

## Chẩn đoán môi trường (2026-10-12)

- `-1073741790` dưới dạng unsigned là `0xC0000022` (`STATUS_ACCESS_DENIED`), theo [Microsoft status definition](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-samr/7440cfac-6052-4925-84e4-c32e417de300). Đây là status thoát của GPU process; riêng mã này không xác định tiến trình/tài nguyên cụ thể nào đã từ chối quyền.
- ACL read-only cho thấy Users có quyền đọc/thực thi Chrome và Edge; các profile riêng của task có quyền Modify cho tài khoản chạy. Điều này không chứng minh quyền truy cập của GPU sandbox/AppContainer tới thiết bị đồ họa.
- Chrome 155/Edge 155 log đều có lỗi GPU fatal. Log còn có `GPUPersistentCache` sharing violation `0x20` (“file is being used by another process”), khác với status `0xC0000022`; đây có thể là yếu tố môi trường liên quan nhưng chưa được xác minh là nguyên nhân.
- UXR-1D lưu preflight PASS với cùng Chrome `155.0.8059.40`. Khi phát hiện lần đó dùng Node `spawn` còn lần trước UXR-2A dùng `Start-Process`, đã chạy thêm đúng Node launcher với thời hạn chờ. Kết quả vẫn BLOCKED, nên khác biệt launcher không giải thích đầy đủ lỗi hiện tại.
- Defender status và Device Guard queries trả `Access denied` dưới security context hiện tại. Không có Defender block event ID 1121–1123 trong khoảng thời gian đã truy vấn; Code Integrity/AppLocker không trả được bản ghi phù hợp. Vì vậy **không xác minh được** antivirus, WDAC/AppLocker hoặc policy hệ thống có chặn GPU child process hay không. Không thay đổi các policy này.
- Checkout không có `.github/workflows`; Docker, WSL, Firefox, Playwright browser/package không sẵn có. Working tree chứa thay đổi chưa commit nên không thể gửi source hiện tại lên CI mà không xuất bản các thay đổi đó. Không có môi trường độc lập sẵn dùng trong session này.

Các bằng chứng xác nhận lỗi quyền/khởi tạo ở GPU child path, nhưng chưa đủ để kết luận antivirus hoặc chính sách nào là nguyên nhân gốc.

## Scenario status

| Kiểm tra | Trạng thái |
|---|---|
| Mở trang preflight đơn giản trong renderer | **BLOCKED** — Chrome direct-spawn preflight không giữ được CDP endpoint; GPU child kết thúc fatal |
| Chạy JavaScript, nhập liệu và click button | **NOT VERIFIED** |
| Screenshot preflight | **NOT CAPTURED** |
| Sáu shared components trong browser | **BLOCKED / NOT RUN** |
| Responsive screenshots 390/768/1280/1440/1920 | **NOT CAPTURED** |
| Browser keyboard/focus, overflow, console/network và axe | **NOT VERIFIED** |
| Frontend regression suite | **PASS** — 84/84 tests; rerun after harness timeout update, see [TEST_EVIDENCE.md](TEST_EVIDENCE.md); đây không phải bằng chứng browser |

Không gọi application API, Backend hoặc Database trong các lần thử browser này. Chỉ dùng profile riêng của task; không đóng browser/profile của người dùng và không xóa profile test.

## Tiếp tục trên runner khác

Chạy trên máy Windows/CI độc lập có renderer hoạt động và cùng working tree hiện tại. [run-host-preflight.mjs](run-host-preflight.mjs) dùng Chrome 155, Node `spawn`, profile riêng và cổng 9369; helper đóng browser sau preflight. Nếu PASS:

1. Chạy fixture server: `cd frontend; npm.cmd run dev -- --host 127.0.0.1 --port 5193 --strictPort`.
2. Mở Chrome bằng Node `spawn` với flags `--headless=new`, `--remote-debugging-port=9369`, `--user-data-dir=<profile-task-mới>`, `--no-first-run`, `--no-default-browser-check`, `about:blank`. Không thêm cờ GPU khác; không dùng profile người dùng.
3. Từ repository root đặt `UXR2A_CDP_PORT=9369`, rồi chạy `node docs/UXR-V3/UXR-2A/run-browser-acceptance.mjs --preflight`. Chỉ khi runner tạo preflight PASS và `browser-preflight.png` mới chạy `--acceptance`.
4. Giữ stdout/stderr browser, JSON acceptance và screenshot cùng lần chạy. Nếu preflight fail hoặc timeout, dừng và để Exit Gate BLOCKED.

Không tái sử dụng kết quả UXR-1D thay cho preflight hiện tại.
