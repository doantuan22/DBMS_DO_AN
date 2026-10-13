# Test fixtures v2

Canonical [lifecycle-v2.sql](lifecycle-v2.sql) có rollback default và commit context; demo wrapper dùng commit, không chép SQL hai nơi. Booking/payment/review/complaint/cancel gọi SP; historical paid order tính bằng DB helper trong outer transaction vì SP từ chối booking quá khứ. Không disable trigger/constraint. IDs lấy từ rows thật qua email/title/seat natural keys.

`negative-v2.sql` và `domain-v2.sql` chỉ chạy trên exact TEST target qua `db:seed:test`: reject review ineligible 50004, duplicate 50040, foreign-order complaint 50041; configuration changes không sửa historical snapshots; retry/maintenance/quota/compensation assertions. Không tạo invalid order để demo.

R54/R55 legacy dataset count/identity contracts đã retired. SQL regression framework trong `database/11_tests` giữ nguyên assertions; 5 file được cập nhật selector natural keys/ghế trống của v2. `test-fixtures` chạy cả 10 includes `test-all.sql`, đối chiếu fingerprints sau rollback; thêm v2 SQL probes, guard tests và real API/browser suite. Standalone stress suites ngoài test-all được giữ, không kế thừa PASS lịch sử. Xem [verification report](../../../docs/seed/SEED_VERIFICATION_REPORT.md).
