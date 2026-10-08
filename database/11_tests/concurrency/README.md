# Concurrency tests

R2.1 parent-status/booking: `node database/11_tests/concurrency/booking-parent-status.mjs --database=CinemaBookingDB_R0_<disposable>`.
14 actual races qua existing Manager/Admin parent writers: parent-first reject booking, booking-first giữ parent ổn định đến commit; DMV waits, atomic order/ticket/food/promotion state và cleanup.
SQL/API/full regression: `node scripts/r21/checks.mjs --database=<disposable>`; ghi evidence mới vào r21, giữ nguyên accepted r11/r12 artifacts. Xem [báo cáo R2.1](../../../docs/evidence/R2_BOOKING_BOOKABILITY.md). Chạy suites tuần tự; không chạy fixtures trên DB chính.

R1.2 showtime overlap: `node database/11_tests/concurrency/showtime-overlap.mjs --database=CinemaBookingDB_R0_<disposable>`.
26 scenario cases +125 real races (100 có SQL gate/DMV,25 phát request đồng thời), query overlap/state sau từng race; chạy tuần tự với các suite có fixture khác.
SQL tests: `node scripts/r12/sql-tests.mjs --database=<disposable>`; transaction/savepoint: `scripts/r12/nested-tests.mjs`.
Regression R1.1: `node scripts/r12/room-regression.mjs --database=<disposable>` dùng logic cũ và ghi evidence mới vào r12, giữ nguyên evidence R1.1.
Xem [báo cáo R1.2](../../../docs/evidence/R1_SHOWTIME_CONCURRENCY.md). Không chạy fixture/stress trên CinemaBookingDB.

R1.1 room delete: `node database/11_tests/concurrency/room-delete-vs-showtime.mjs --database=CinemaBookingDB_R0_<disposable>`.
Hai session nghiệp vụ độc lập, thêm connection chỉ đọc để xác nhận lock wait qua DMV; chạy cả delete thắng/create thắng qua Manager/Admin và alias.
Không dùng DB chính. Harness kiểm tra state thật và dọn fixture; bằng chứng ghi `docs/evidence/r11/concurrency.json`.
SQL fault-injection riêng: `node scripts/r11/sql-tests.mjs --database=CinemaBookingDB_R0_<disposable>`.
Không include test destructive này vào `db:test` mặc định có thể trỏ DB chính. Xem [báo cáo R1.1](../../../docs/evidence/R1_ROOM_DELETE.md).

Booking, pricing overlap và cinema image lock stress chuyển từ source cũ vào đây. Wrapper db:smoke --stress chỉ chạy trên disposable CinemaBookingDB_R0_*.

Chạy 24 competing booking một ghế, 32 booking tập ghế giao nhau, burst 4 order/khách, 4 pricing rounds ×2, 40 image update/cover request. Film 4 dài 110 phút phù hợp suất 120 phút của stress. Không thay business rule để test qua.

Test để lại customer/showtime/pricing fixture trong disposable DB; reset/drop DB đó sau khi đọc kết quả. db:test thông thường dùng rollback và không bao gồm stress.
