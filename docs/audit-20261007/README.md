# Evidence của audit trước Phase R0

Các snapshot SQL, fingerprints, source hashes, API probes, test logs và `frontend-build/` trong thư mục này ghi nhận lần audit chỉ đọc trước R0. Đây là artifact lịch sử, không phải frontend để chạy hoặc database baseline để deploy. Source ứng dụng hiện hành nằm trong `backend/`, `frontend/`, `shared/`, `database/`; build mới nằm trong `frontend/dist`.

Raw evidence được giữ nguyên, bao gồm CHECK/enum cũ và hai lỗi test backend tại thời điểm audit. Không thay lịch sử bằng kết quả chạy mới. `preservation-check.json` xác nhận việc bảo toàn trong **lần audit gốc**, không tuyên bố source sau triển khai R0 vẫn byte-identical.

Các sản phẩm diễn giải hiện hành (`use-cases.json`, `issues.json`, `terminal-summary.txt`, `schema-inventory.md`, `report-validation.json` và `../FULL_SYSTEM_AUDIT.md`) được chuẩn hóa theo roadmap: baseline 45 UC, I-01 accepted, trạng thái xử lý R0 có link evidence riêng. Scoring giữ các grade của UC thuộc audit gốc và chỉ sửa mẫu số; không chứng nhận lại toàn bộ hệ thống.

Evidence R0 mới: [../r0-20261007/](../r0-20261007/README.md). Chạy `node scripts/r0/normalize-baseline.mjs` từ repo root để cập nhật sản phẩm diễn giải; script không chạy API hay sửa database. Các helper probe/collect gốc chỉ dành cho audit và có thể ghi đè snapshot; không dùng chúng để xác minh R0.
