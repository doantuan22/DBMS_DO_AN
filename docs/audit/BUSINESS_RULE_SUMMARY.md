# Báo cáo ngắn — Làm rõ nghiệp vụ và đánh giá 3NF

**Ngày:** 13/10/2026. **Phạm vi:** THANHTOAN, KHIEUNAI, BANGGIA, PHANCONG_RAP, RAPCHIEUPHIM.

## Kết quả

Đã đối chiếu source, các đường ghi dữ liệu, API, test và metadata SQL Server. Không phát hiện lệch schema/module so với audit trước. Chỉ đọc database; không chạy migration, SP ghi hoặc test thay đổi dữ liệu.

| Bảng | Nghiệp vụ hiện tại trong source | Kết luận 3NF |
|---|---|---|
| THANHTOAN | Nhiều attempt cho một đơn; cùng tổng tiền đã chốt. Có attempt, kể cả thất bại, thì không sửa tổng đơn. | **FAIL theo writer hiện hành**; chờ xác nhận đây là bất biến nghiệp vụ chính thức. |
| KHIEUNAI | Người gửi là Customer; đơn liên quan tùy chọn và phải thuộc người gửi. | **UNKNOWN** toàn bảng; FD người gửi–đơn chỉ có điều kiện trên tập có đơn. |
| BANGGIA | Rule được sửa theo GiaID; cộng mọi phụ thu khớp. Chỉ cấm chồng khoảng của các rule đang áp dụng cùng bộ điều kiện. | **UNKNOWN**; chưa chốt mô hình rule hay phiên bản và khóa nghiệp vụ. |
| PHANCONG_RAP | Nhiều–nhiều; không cấm chồng kỳ. Scope phụ thuộc role, tài khoản, trạng thái và khoảng ngày. | **UNKNOWN**; chưa chốt định danh kỳ phân công. |
| RAPCHIEUPHIM | Địa chỉ và thành phố nhập độc lập; tên/địa chỉ không có UNIQUE. | **UNKNOWN**; chưa xác nhận FD DiaChi → ThanhPho. |

**Finding chính:** `THANHTOAN.DonDatVeID → SoTien` vi phạm 3NF trong mô hình writer hiện hành: DonDatVeID không phải superkey, SoTien không thuộc khóa ứng viên. Bằng chứng: [tạo attempt](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L96), [chặn sửa đơn sau attempt](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L98).

Giá vé/đồ ăn lịch sử và tổng tiền đơn không tự động là lỗi chuẩn hóa. Không đề xuất xóa snapshot chỉ vì có thể tính lại từ bảng khác.

## Những quyết định cần chốt

Các khuyến nghị dưới đây **chưa được phê duyệt**.

| ID | Quyết định | Khuyến nghị cho đồ án hiện tại |
|---|---|---|
| D-01 | Số tiền có bất biến giữa các attempt của cùng đơn không? | Giữ bất biến và không sửa tổng đơn sau attempt đầu tiên. |
| D-02 | Giữ snapshot thanh toán hay lấy số tiền từ đơn? | Giữ SoTien, ghi nhận ngoại lệ 3NF có chủ đích. Chỉ bỏ cột nếu chứng minh bảo toàn lịch sử và được duyệt. |
| D-03 | Chính sách người gửi và đơn của khiếu nại? | Giữ Customer tự gửi, cho phép khiếu nại chung, chỉ liên kết đơn của mình; giữ thông tin người gửi. |
| D-04 | Bảng giá là rule có thể sửa hay phiên bản bất biến? | Giữ rule có thể sửa theo GiaID; giá mua được lưu trên vé. |
| D-05 | Cộng phụ thu hay chọn rule ưu tiên? | Cộng các phụ thu khớp như hiện tại. |
| D-06 | Phân công có cho phép nhiều–nhiều và chồng kỳ không? | Giữ mô hình hiện tại; không tự thêm ràng buộc một Manager một rạp. |
| D-07 | Địa chỉ là thành phần hay địa chỉ chuẩn xác định thành phố? | Địa chỉ là văn bản/thành phần, thành phố độc lập. |

## Kết luận

**INCONCLUSIVE đối với mô hình nghiệp vụ được phê duyệt chính thức:** 7 quyết định còn chờ chủ dự án xác nhận. Kết luận **NOT_3NF theo writer hiện hành** của audit gốc vẫn giữ nguyên; chưa có thay đổi làm mất vi phạm N-001.

Không sửa database, SQL logic, backend/frontend hoặc báo cáo audit gốc. Mọi thay đổi schema cần được xem xét và phê duyệt riêng.
