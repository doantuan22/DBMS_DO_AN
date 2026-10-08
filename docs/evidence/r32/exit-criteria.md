| # | Exit criterion | Result | Evidence |
|---|---|---|---|
| 1 | Đã trace mọi relevant writer | PASS | [raw](trace-before.md) |
| 2 | Historical data policy chính xác | PASS | [raw](../R3_HISTORICAL_METADATA.md) |
| 3 | Monetary snapshots giữ nguyên | PASS | [raw](sql-tests.json) |
| 4 | Show history xét mọi DONDATVE | PASS | [raw](sql-tests.json) |
| 5 | Historical PhimID bất biến | PASS | [raw](sql-tests.json) |
| 6 | PhongID bất biến; contract không hỗ trợ chuyển phòng | PASS | [raw](sql-tests.json) |
| 7 | Historical ThoiGianBatDau bất biến | PASS | [raw](sql-tests.json) |
| 8 | Historical ThoiGianKetThuc bất biến | PASS | [raw](sql-tests.json) |
| 9 | Historical DinhDang bất biến | PASS | [raw](sql-tests.json) |
| 10 | Historical GiaVeCoBan bất biến | PASS | [raw](sql-tests.json) |
| 11 | Unused showtime vẫn cập nhật hợp lệ | PASS | [raw](api-tests.json) |
| 12 | Giá trị giữ nguyên không false reject | PASS | [raw](sql-tests.json) |
| 13 | State transition/canonical Cancel giữ policy | PASS | [raw](sql-tests.json) |
| 14 | Seat history xét mọi CHITIETVE | PASS | [raw](sql-tests.json) |
| 15 | Historical LoaiGhe bất biến | PASS | [raw](sql-tests.json) |
| 16 | Unused seat đổi type hợp lệ | PASS | [raw](api-tests.json) |
| 17 | Operational seat status giữ existing policy | PASS | [raw](sql-tests.json) |
| 18 | Mixed invalid update rollback toàn bộ | PASS | [raw](api-tests.json) |
| 19 | Historical GiaVe không đổi khi sửa BANGGIA | PASS | [raw](sql-tests.json) |
| 20 | Historical food DonGia không đổi khi sửa catalog | PASS | [raw](api-tests.json) |
| 21 | Order/payment snapshots không đổi | PASS | [raw](api-tests.json) |
| 22 | Booking vs Showtime Update concurrency PASS | PASS | [raw](historical-concurrency.json) |
| 23 | Booking vs Seat Type Update concurrency PASS | PASS | [raw](historical-concurrency.json) |
| 24 | Manager/Admin cùng enforce SQL rules | PASS | [raw](sql-tests.json) |
| 25 | API errors đúng và không lộ SQL | PASS | [raw](api-tests.json) |
| 26 | SQL positive/negative PASS | PASS | [raw](sql-tests.json) |
| 27 | API integration PASS | PASS | [raw](api-tests.json) |
| 28 | R1 regression PASS | PASS | [raw](r1-regression.json) |
| 29 | R2 regression PASS | PASS | [raw](r22-regression.json) |
| 30 | R3.1 regression PASS | PASS | [raw](r31-regression.json) |
| 31 | Backend regression PASS | PASS | [raw](checks.json) |
| 32 | No-SQL Backend PASS | PASS | [raw](no-sql.txt) |
| 33 | Source/schema parity PASS | PASS | [raw](source-parity.json) |
| 34 | Không thêm bảng/columns/history snapshots | PASS | [raw](main-migration.json) |
| 35 | Không redesign Frontend | PASS | [raw](source-changes.patch) |
| 36 | Raw evidence và final DB states | PASS | [raw](historical-concurrency.json) |
| 37 | I-09 RESOLVED bằng evidence thật | PASS | [raw](current-audit-status.json) |
