# Backend test setup (R4.1)

Chạy từ một clone mới bằng Node.js 24.x và npm đi kèm (đã kiểm chứng với Node 24.21.0 / npm 11.19.0):

```powershell
cd backend
npm ci --no-audit --no-fund
npm test
npm test
```

`npm ci` dùng `package-lock.json` được version trong Git. Không cần `.env`, SQL Server, seed, backup hay `database/_audit`. Giữ nguyên cấu trúc repository khi chạy: test import `shared/` và đọc canonical SQL ở `database/03_constraints`, `05_functions`, `07_triggers`, `08_procedures`.

Suite dùng `node:test` hiện có. Dữ liệu kiểm thử nằm trong test/source được version; service tests inject executor tại chỗ, JWT tests truyền secret/clock của test, HTTP tests dùng cổng tạm, date/time tests đặt múi giờ cho subprocess. SQL contract guards đọc source thực và phải phát hiện mã lỗi chưa mapping. Không tạo `known-contract-gaps.json` để đáp ứng test.

Kiểm chứng cài đặt sạch và chạy lại, từ root repository:

```powershell
node scripts/r41/clean-check.mjs
```

Script kiểm chứng **HEAD đã commit**: tạo hai clone mới trong thư mục temp, xác nhận không có `node_modules`/`.env`, bỏ audit/evidence chỉ trong clone tạm, loại cấu hình DB/JWT/Node của môi trường cha, rồi chạy `npm ci`. Mỗi clone chạy `npm test` hai lần và toàn bộ file test theo thứ tự đảo ngược với `--test-concurrency=1`. Script so sánh tên/count/kết quả các test và SHA-256 của input trước/sau; chuẩn hóa CRLF thành LF khi so sánh giữa checkout, so sánh nguyên byte trước/sau trong từng checkout. Bất kỳ command/assertion thất bại đều trả exit code khác 0. Node 24 được dùng để thu kết quả bằng spec reporter; không thay đổi npm test runner.

Commit thay đổi test/input trước khi dùng script; script từ chối nếu input tracked khác HEAD. Kết quả và log thực nằm ở `docs/evidence/r41/clean-check.json` cùng các file `.txt`. Các clone tạm được giữ lại, đường dẫn nằm trong JSON để kiểm tra khi có lỗi; script không xóa artifact của checkout gốc. Chạy lại script sẽ cập nhật evidence R4.1.

Đây là Backend unit/contract suite. SQL/API integration suites và việc dựng Database có hướng dẫn riêng trong `database/README.md`.
