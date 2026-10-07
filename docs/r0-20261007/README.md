# Evidence TASK 1 / Phase R0

Các JSON/log trong thư mục này do tool/test thực tế sinh ra; không dùng dữ liệu snapshot trước R0 để tuyên bố test mới PASS.

- `database-contract.json`: migration trên database disposable, replay, CHECK positive/negative, function pricing và fingerprint 27 bảng.
- `migration-precondition.json`: fixture legacy chỉ trên disposable; migration THROW 51000, giữ nguyên dòng legacy, constraint và mọi fingerprint/module sau lần bị từ chối.
- `pricing-api.json`: HTTP thật → backend → SQL trên disposable, kiểm tra ba loại ngày, reject legacy và cleanup chính các rule do test tạo.
- `main-migration.json`: backup COPY_ONLY/CHECKSUM được RESTORE VERIFYONLY, precondition, migration tại chỗ, source parity và fingerprint trước/sau database local hiện hành.
- `checks.json`, `*.txt`: suite hiện có, no-SQL, lint/build, SQL tests/verify và kiểm tra baseline.
- `scope-scan.json`: tìm literal/LoaiNgay trong toàn source và phân biệt contract hiện hành với migration, negative tests, tài liệu hoặc snapshot lịch sử.
- `pricing-stress.txt`: pricing overlap stress hiện có với fixture đúng ba loại ngày; 4 rounds × 2 requests và boundary controls.
- `cleanup.json`: dọn đúng ba disposable của task, giữ nguyên fingerprint main 27 bảng. Rejection snapshot ghi nhận dòng legacy vẫn tồn tại sau migration bị từ chối, trước khi dọn toàn bộ database test.

Không lưu password, JWT hoặc dữ liệu tài khoản trong evidence. Snapshot metadata chứa definition SQL; fingerprints chỉ lưu số dòng và SHA-256 của dữ liệu. Database disposable của lần chạy được ghi rõ trong từng evidence; dữ liệu giả lập precondition được giữ đến lúc dọn cả database disposable, không được tự chuyển thành loại ngày khác.

Các lỗi gặp trong quá trình chuẩn bị test đã được sửa trong tooling R0: ODBC không khởi tạo được TLS (fallback mssql), stream UTF-8 cần decoder giữ ký tự qua chunk, CHECK của migration phải cùng biểu thức với baseline verification, và test HTTP phải theo status hiện hữu của Admin create (200) / Manager create (201). Những sửa này không thay business behavior ngoài R0. Kết quả cuối dựa trên lần chạy lại sau sửa.
