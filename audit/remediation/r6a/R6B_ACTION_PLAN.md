# R6B action plan — từ R6A

**0 FIXABLE candidate. Không có data migration hoặc executable DML được tạo/chạy.**

DB hiện tại không có đơn20/26/27/28, user17/21/26/34 hay assignment13/14. Không tái tạo các record này. Không reset counter1/2/3. Giữ nguyên SUATCHIEU2/3/4/5 với trạng thái Mở bán và timestamp hiện tại: availability do giờ bắt đầu + status quyết định.

| Record hiện tại được phép sửa | Table/field | Expected before → after | Evidence | Rollback / transaction | Post-fix invariant | Risk |
|---|---|---|---|---|---|---|
| Không có | Không áp dụng | Không áp dụng | [Classification](CLASSIFICATION.json) | Không có transaction ghi; không cần rollback | Fingerprint main nguyên vẹn | Không có candidate remediation |

**Hồ sơ chưa đủ chứng cứ:** financial snapshot/receipt/discount gốc của20; snapshot + success/cancel/compensation/loyalty event của26/27/28; revision history phim/lịch; nguồn account17/21 và assignment đã hủy; counter initialization + mutation history. Đã vắng record không đồng nghĩa biết giá trị sửa đúng. Không backfill hoặc restore main chỉ để kiểm thử giả thuyết.

Nếu một audit sau tìm được record hiện tại đủ chứng cứ, R6B phải có ID, table/field, before/after chính xác, supporting evidence, precondition kiểm tra lại dưới lock, rollback không mất payment/ledger history, dependency checks, transaction boundary và post-fix invariants. Danh sách chi tiết nằm trong [plan JSON](R6B_ACTION_PLAN.json); đây là điều kiện mở lại đánh giá, không phải danh sách sửa đã được phép.

Rủi ro nếu bỏ qua chứng cứ: HIGH cho tài chính/loyalty/counter; HIGH cho xóa assignment và sai scope; MEDIUM/HIGH cho kéo dài hoặc đổi lịch sử suất; MEDIUM cho bịa DOB/backfill nhầm account. Quyết định hiện tại cho cả9 finding: NO CHANGE.
