# Vấn đề audit và ưu tiên xử lý

**Audit ngày 03/10/2026.** File này tóm gọn toàn bộ 20 BUG, 9 DATA, 7 GAP và 5 CONFLICT; hướng sửa là đề xuất, **chưa được thực hiện**. Các finding có thể trùng nguyên nhân.

**Cách đọc:** P0 khẩn cấp, P1 ưu tiên cao, P2 tiếp theo, P3 thấp. “Đã chứng minh” = PROVEN; “Tin cậy cao” = HIGH-CONFIDENCE; “Nghi vấn” = SUSPECTED. Mỗi mã liên kết đến mô tả và bằng chứng gốc.

## 1. Lỗi triển khai — 20 BUG

| Mã | Mức / bằng chứng | Vấn đề → hướng xử lý |
| --- | --- | --- |
| [BUG-001](./FINDINGS.md#bug-001) | P1 / Đã chứng minh | Lệch giờ DB/driver/DTO 7 tiếng → thống nhất quy ước thời gian; xác minh nguồn trước khi sửa lịch sử. |
| [BUG-002](./FINDINGS.md#bug-002) | P2 / Đã chứng minh | Manager không dùng được trạng thái “Đóng bán”; enum sai gây 500 → đồng bộ enum và map lỗi client. |
| [BUG-003](./FINDINGS.md#bug-003) | P2 / Đã chứng minh | Lỗi lifecycle từ DB mới chưa được map → chốt baseline rồi đồng bộ mã lỗi HTTP. |
| [BUG-004](./FINDINGS.md#bug-004) | P1 / Đã chứng minh | Form Manager tạo ghế gửi thừa `roomId`, nhận 400 → tạo payload đúng contract. |
| [BUG-005](./FINDINGS.md#bug-005) | P1 / Đã chứng minh | Form Admin sửa ảnh gửi thừa `cover`, nhận 400 → tách payload tạo/sửa/đặt cover. |
| [BUG-006](./FINDINGS.md#bug-006) | P1 / Đã chứng minh | 9 form sửa Admin không nạp trạng thái ban đầu → sửa khởi tạo trường theo resource và bản ghi. |
| [BUG-007](./FINDINGS.md#bug-007) | P1 / Đã chứng minh | Đổi tên vai trò báo thành công nhưng không lưu → tách lưu metadata và quyền. |
| [BUG-008](./FINDINGS.md#bug-008) | P2 / Đã chứng minh | Xóa hết quyền bị chuyển thành `[0]`, nhận 400 → parse trống thành `[]`. |
| [BUG-009](./FINDINGS.md#bug-009) | P2 / Đã chứng minh | ID vượt SQL INT được chấp nhận rồi gây 500 → giới hạn ID đến 2.147.483.647. |
| [BUG-010](./FINDINGS.md#bug-010) | P2 / Đã chứng minh | Số ghế 1,5 bị lưu thành 1 → bắt buộc số nguyên trước khi truyền SQL. |
| [BUG-011](./FINDINGS.md#bug-011) | P2 / Đã chứng minh | Giới hạn tên BE dài hơn SQL parameter, gây 500 → validation độ dài riêng từng resource. |
| [BUG-012](./FINDINGS.md#bug-012) | P2 / Đã chứng minh | Sửa rạp không tồn tại trả 200/null → trả 404 nhất quán. |
| [BUG-013](./FINDINGS.md#bug-013) | P2 / Đã chứng minh | API nhận ngày sinh năm 2999 → chặn ngày tương lai tại BE/SP. |
| [BUG-014](./FINDINGS.md#bug-014) | P1 / Đã chứng minh | Admin nhận mật khẩu 73 byte trong khi bcrypt chỉ dùng 72 → thống nhất validation mật khẩu trên mọi luồng tạo tài khoản. |
| [BUG-015](./FINDINGS.md#bug-015) | P2 / Đã chứng minh | Admin tạo Customer nhưng thiếu hồ sơ → giới hạn role hoặc tạo account/profile atomically. |
| [BUG-016](./FINDINGS.md#bug-016) | P2 / Đã chứng minh | Booking vẫn tạo đơn khi product không tồn tại, tự bỏ sản phẩm → kiểm đầy đủ sản phẩm trong transaction. |
| [BUG-017](./FINDINGS.md#bug-017) | P2 / Đã chứng minh | Hai request phân công giống nhau tạo hai dòng → chốt identity và bảo vệ bằng key/transaction. |
| [BUG-018](./FINDINGS.md#bug-018) | P2 / Đã chứng minh | View đếm review bị nhân theo số suất: phim có 2 review bị đếm 34 → aggregate trước join hoặc COUNT DISTINCT. |
| [BUG-019](./FINDINGS.md#bug-019) | P1 / Tin cậy cao | Customer API thiếu kiểm quyền chức năng → guard từng endpoint và kiểm thu hồi quyền với role riêng trên DB thật. |
| [BUG-020](./FINDINGS.md#bug-020) | P2 / Tin cậy cao | FE dùng một quyền để chặn cả portal → guard/navigation theo từng chức năng. |

## 2. Dữ liệu bất thường — 9 DATA

| Mã | Mức / bằng chứng | Dữ liệu và hướng xử lý |
| --- | --- | --- |
| [DATA-001](./FINDINGS.md#data-001) | P0 / Đã chứng minh | Đơn cũ 20: 80.000 − 120.000 = **−40.000**; đã hết hạn, chưa chứng minh thu tiền âm. Đối chiếu chứng từ trước khi remediation. |
| [DATA-002](./FINDINGS.md#data-002) | P1 / Đã chứng minh | Đơn cũ 26/27/28 đã thanh toán nhưng suất 34 bị hủy. Đối chiếu giao dịch và chốt lifecycle. |
| [DATA-003](./FINDINGS.md#data-003) | P2 / Đã chứng minh | 15 suất cũ ngắn hơn thời lượng phim. Phân loại lịch còn mở/lịch sử trước xử lý. |
| [DATA-004](./FINDINGS.md#data-004) | P2 / Đã chứng minh | 4 suất cũ ngoài thời gian phát hành phim. Xác minh từng lịch, giữ bằng chứng lịch sử. |
| [DATA-005](./FINDINGS.md#data-005) | P2 / Đã chứng minh | User cũ 17 và fixture 26 có ngày sinh năm 2999. Xác minh chủ hồ sơ trước sửa dữ liệu. |
| [DATA-006](./FINDINGS.md#data-006) | P2 / Đã chứng minh | Customer 21 ngoài manifest và fixture 34 thiếu profile. Đối chiếu nguồn tạo trước backfill. |
| [DATA-007](./FINDINGS.md#data-007) | P2 / Đã chứng minh | Phân công active fixture 13/14 trùng; có nhóm cũ đã hủy cũng trùng. Chốt quy tắc hợp nhất và lưu audit trail. |
| [DATA-008](./FINDINGS.md#data-008) | P3 / Nghi vấn | Counter 3 promo khác số đơn còn lưu; seed/history có thể giải thích. Chưa kết luận corruption; không reset theo COUNT hiện tại. |
| [DATA-009](./FINDINGS.md#data-009) | P3 / Đã chứng minh | 6 suất cũ hết giờ vẫn “Mở bán”; booking có time guard. Chốt cách cập nhật lifecycle; chưa chứng minh bán được vé quá giờ. |

## 3. Chức năng còn thiếu — 7 GAP

| Mã | Mức / bằng chứng | Phần cần bổ sung |
| --- | --- | --- |
| [GAP-001](./FINDINGS.md#gap-001) | P1 / Đã chứng minh | UI Manager sửa suất chiếu (QLR-05); BE có route nhưng còn lỗi enum. |
| [GAP-002](./FINDINGS.md#gap-002) | P2 / Đã chứng minh | Manager sửa tên/loại phòng và loại ghế; UI hiện chủ yếu đổi trạng thái. |
| [GAP-003](./FINDINGS.md#gap-003) | P2 / Tin cậy cao | Bảng giá Manager thiếu loại ngày, định dạng, ngày kết thúc và sửa phụ thu. |
| [GAP-004](./FINDINGS.md#gap-004) | P2 / Đã chứng minh | Bộ lọc khoảng ngày báo cáo doanh thu Manager; API đã hỗ trợ. |
| [GAP-005](./FINDINGS.md#gap-005) | P2 / Đã chứng minh | Đơn tham chiếu CSKH thiếu chi tiết tiền/suất/ghế/giao dịch trên UI; API chưa đủ tickets/payments. |
| [GAP-006](./FINDINGS.md#gap-006) | P2 / Tin cậy cao | Gallery ảnh rạp công khai; API có, FE mới hiển thị cover/fallback. |
| [GAP-007](./FINDINGS.md#gap-007) | P2 / Đã chứng minh | Regression DB thật/browser chưa đủ; SQL/stress suites hiện cần fixture hoặc môi trường phù hợp để chạy. |

## 4. Mâu thuẫn chính sách và phiên bản — 5 CONFLICT

| Mã | Mức / bằng chứng | Quyết định cần chốt |
| --- | --- | --- |
| [CONFLICT-001](./FINDINGS.md#conflict-001) | P1 / Đã chứng minh | Thiết kế KH-10 không hủy đơn đã trả/không refund, DB mới lại hủy và đổi lịch sử payment sang “Đã hoàn tiền”. Chốt policy và bảo toàn lịch sử. |
| [CONFLICT-002](./FINDINGS.md#conflict-002) | P1 / Đã chứng minh | Thiết kế cho phép late success nếu ghế còn trống/suất còn mở; DB mới từ chối mọi callback muộn. Chốt policy và regression. |
| [CONFLICT-003](./FINDINGS.md#conflict-003) | P1 / Đã chứng minh | Source migration 013 lệch DB 014/015; 35 module khác, 6 DB-only. Chọn baseline tương thích trước triển khai sửa. |
| [CONFLICT-004](./FINDINGS.md#conflict-004) | P3 / Đã chứng minh | Overview còn ADM-17 và README mô tả phase lỗi thời; scope hiện có 45 UC. Đồng bộ tài liệu. |
| [CONFLICT-005](./FINDINGS.md#conflict-005) | P2 / Tin cậy cao | DB có Admin bypass, BE kiểm quyền khác FE và Customer thiếu guard. Chốt semantics Admin và quyền chức năng. |

## 5. Thứ tự thực hiện đề xuất

1. **P0:** giữ evidence và đối chiếu đơn 20; lập phương án xử lý dữ liệu tài chính có review.
2. **P1:** chốt source/DB và policy; xử lý timezone, lifecycle/payment history, form chặn thao tác, mật khẩu, quyền Customer và UI sửa suất.
3. **P2:** validation/error mapping, profile, sản phẩm, phân công, review COUNT, permission UI và các GAP còn lại.
4. **P3:** tài liệu, lineage counter, trạng thái lịch cũ, scanner false positives; đo actual plan/IO/load trước thay đổi hiệu năng.

Mỗi nhóm sửa cần kiểm luồng FE → API → SP → trạng thái DB, trường hợp lỗi, ownership/scope và concurrency liên quan. Không dùng kết quả unit test xanh để thay thế kiểm tích hợp.

**Nguồn đầy đủ:** [REPORT](./REPORT.md), [FINDINGS](./FINDINGS.md), [EVIDENCE_INDEX](./EVIDENCE_INDEX.md). [File tổng quan](./TOM_TAT_AUDIT.md) ghi kết quả đã đạt và giới hạn audit. Fixtures hiện được giữ lại; các script tạo fixture không phải tất cả đều idempotent.
