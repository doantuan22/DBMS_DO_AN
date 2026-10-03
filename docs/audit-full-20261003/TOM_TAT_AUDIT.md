# Tóm tắt audit hệ thống đặt vé

**Ngày audit:** 03/10/2026 · **Database:** CinemaBookingDB · **Commit:** `7c35624274a9dce7b5a97ee7f9c7f34013daf77b`.

## 1. Kết luận

**AUDIT FOUND ISSUES – FIX REQUIRED.** Hệ thống có lỗi đã tái hiện trên DB, API và trình duyệt; chưa đủ điều kiện xác nhận hoàn tất 45 use case (UC).

| Chỉ số | Kết quả |
| --- | --- |
| Phạm vi | 45 UC: Khách hàng 14, Quản lý rạp 9, CSKH 6, Admin 16 |
| Trạng thái UC | **7 PASS · 13 PARTIAL · 25 FAIL** |
| Findings | **20 BUG · 9 DATA · 7 GAP · 5 CONFLICT** |
| Test có sẵn | Backend 90/90, frontend 26/26; lint/build PASS |
| Kiểm tra riêng của audit | 161 assertions: 123 PASS, 36 FAIL, 2 BLOCKED |
| Kiểm kê | 26 bảng, 124 SP, 6 views, 17 functions, 7 triggers; 118 endpoint |

Các nhóm finding có thể chung nguyên nhân; **không cộng thành số lỗi độc lập**. Trong 20 BUG, 18 đã chứng minh, 2 có độ tin cậy cao nhưng chưa kiểm đầy đủ việc thu hồi quyền trên DB thật. DATA-008 mới là nghi vấn.

Hai assertions BLOCKED ban đầu dùng suất đã bị hủy; chạy lại concurrency trên suất mới đã PASS. Không có bằng chứng double booking từ hai assertions này. Test có sẵn chủ yếu dùng stub/SSR nên kết quả xanh chưa chứng minh toàn hệ thống đúng.

## 2. Các vấn đề quan trọng nhất

| Ưu tiên | Vấn đề | Tham chiếu |
| --- | --- | --- |
| P0 | Đơn cũ số 20 có tổng **−40.000 đồng**. Đơn đã hết hạn; chưa chứng minh có giao dịch thu tiền âm. | DATA-001 |
| P1 | Source dừng migration 013 nhưng DB có thay đổi 014/015: **35 module khác, 6 module chỉ có trên DB**. Git rollback không rollback DB. | CONFLICT-003 |
| P1 | Thời gian DB/driver/DTO lệch **7 giờ**, ảnh hưởng giờ chiếu và hạn giữ vé. | BUG-001 |
| P1 | Hủy suất đã có đơn thanh toán làm đổi lịch sử payment sang hoàn tiền; callback thành công đến muộn bị từ chối, trái chính sách hiện hành. | CONFLICT-001/002, DATA-002 |
| P1 | Manager không tạo được ghế; Admin lỗi sửa ảnh, 9 form không nạp trạng thái, đổi tên vai trò báo thành công nhưng không lưu. | BUG-004..007 |
| P1 | Admin tạo mật khẩu quá 72 byte: mật khẩu gốc không đăng nhập được, tiền tố 72 byte lại đăng nhập được. | BUG-014 |
| P1/P2 | Quyền chức năng không thống nhất giữa DB, backend và frontend; chưa chứng minh khai thác vượt quyền. | BUG-019/020, CONFLICT-005 |
| P2 | Sai validation, bỏ qua sản phẩm không tồn tại, trùng phân công và đếm review bị nhân theo số suất. | BUG-009..018 |

Danh sách đầy đủ và hướng xử lý nằm trong [file vấn đề và ưu tiên](./VAN_DE_VA_UU_TIEN.md).

## 3. Những kiểm tra đã đạt

- Hai khách tranh cùng ghế hoặc nhóm ghế giao nhau: một đơn thắng, một yêu cầu nhận 409; không thấy vé hoạt động trùng trong scan.
- Customer bị chặn truy cập đơn người khác; Manager bị chặn rạp ngoài phân công. Khóa tài khoản/thu hồi phân công có hiệu lực với token cũ trong các probes đã thử.
- Callback thanh toán trùng có tính idempotent; giữ lịch sử các lần thất bại. Hai yêu cầu xử lý khiếu nại đồng thời giữ đủ history.
- Khuyến mãi lượt cuối chỉ giảm cho một đơn; đơn còn lại được tạo giá đầy đủ theo thiết kế. Tạo suất trùng lịch bị chặn.
- 12 yêu cầu đặt ảnh bìa đồng thời kết thúc với một cover; số ảnh không làm nhân doanh thu trong thử nghiệm 92.000 đồng.
- Giá vé/đồ ăn/giảm giá của đơn cũ giữ nguyên sau thay đổi cấu hình. FK không có orphan; DBCC không phát hiện corruption hoặc vi phạm constraint đã khai báo.

Các kết quả này chỉ áp dụng phạm vi đã thử, chưa chứng nhận toàn bộ nhánh nghiệp vụ hoặc tải lớn.

## 4. Chức năng còn thiếu và giới hạn audit

**Thiếu chức năng:** sửa suất chiếu của Manager; sửa đầy đủ phòng/ghế; đầy đủ trường và sửa phụ thu bảng giá; lọc ngày báo cáo Manager; chi tiết đơn tham chiếu cho CSKH; gallery ảnh rạp công khai.

**Chưa kiểm đầy đủ:** fresh deploy/upgrade/re-run trên clone, toàn bộ ma trận thu hồi quyền, mọi lỗi trigger nhiều dòng, lỗi giữa transaction, mọi biên CRUD, các race thanh toán khác và hiệu năng tải lớn. Chín SQL suites cùng một số stress/deploy suites được SKIP vì không phù hợp điều kiện audit trên DB thật; SKIP không tính PASS.

## 5. Thứ tự xử lý đề xuất

1. Đối chiếu chứng từ và nguồn dữ liệu đơn âm; quyết định remediation có lưu lịch sử.
2. Chốt phiên bản source/DB, quy tắc thời gian, hủy/hoàn tiền/callback và phân quyền.
3. Sửa lỗi P1 đang chặn thao tác, sau đó validation, integrity và các chức năng còn thiếu.
4. Bổ sung regression qua FE → API → SP → DB, rồi cập nhật tài liệu và đo hiệu năng.

Audit **không sửa source nghiệp vụ hoặc object DB**: 203 file baseline và 337 object DB được đối chiếu bảo toàn. Audit có tạo/thay đổi fixtures qua API/SP và giữ lại để review; không đồng nghĩa dữ liệu DB hoàn toàn bất biến.

**Nguồn:** [báo cáo đầy đủ](./REPORT.md), [findings và bằng chứng](./FINDINGS.md), [ma trận 45 UC](./TRACEABILITY_45_UC.md), [manifest fixtures](./FIXTURE_MANIFEST.md).
