# R7.2 — Quyết định nghiệp vụ được phê duyệt

Nguồn phê duyệt: người dùng trả lời trực tiếp ba câu hỏi chính sách trong phiên triển khai R7.2 ngày 2026-10-09. Đây là quyết định sau baseline R7.1, áp dụng cho DB/BE trong R7.2. Đặc tả 45 UC và các accepted constraints khác được giữ nguyên.

| UC | Quyết định người dùng | Contract được áp dụng |
| --- | --- | --- |
| CSKH-02 | “Bắt buộc thêm bộ lọc ưu tiên” | Query `priority` nhận `Thấp`, `Trung bình`, `Cao`, `Khẩn cấp`; bỏ qua/rỗng nghĩa là không lọc. Các filter `status`, `type`, `search` được kết hợp bằng AND với priority. SQL thực hiện filtering. |
| ADM-02 | “Manager, CSKH và Admin” | Admin active có `QL_NGUOIDUNG` chỉ tạo tài khoản với `MaVaiTro` thuộc `QUAN_LY_RAP`, `CSKH`, `ADMIN`. Customer và mọi vai trò tùy chỉnh bị từ chối. IDs được tra theo dữ liệu, không suy từ số ID. |
| QLR-08 | “Bốn số liệu hiện tại đủ cho R7.2” | Kiểm chứng `activeRooms`, `activeSeats`, `showtimesToday`, `paidOrdersToday` theo procedure hiện hành. Bốn metric này là phạm vi được chấp thuận; không có yêu cầu bổ sung occupancy ở R7.2. |

CSKH-02 giải quyết chênh lệch giữa luồng thiết kế có lọc ưu tiên và API trước R7.2 chỉ hỗ trợ status/type/search. `sp_Support_Complaint_List` bổ sung tham số tùy chọn cuối `@MucDoUuTien NVARCHAR(50) = NULL`, giữ tương thích các caller cũ. Giá trị ngoài enum bị SQL từ chối bằng 50405 và HTTP 400 `INVALID_PRIORITY`. Enum khớp `CK_KHIEUNAI_MucDoUuTien`. Consumer Admin dùng chung service/validator cũng hỗ trợ query này.

ADM-02 giải quyết mâu thuẫn giữa phần mô tả có tạo Admin khác và luồng chi tiết chỉ chọn Manager/CSKH. `sp_Admin_User_Create` bảo vệ allowlist trong transaction; 50404 ánh xạ HTTP 403 `ROLE_CREATE_FORBIDDEN`. `roleId` vẫn là tham chiếu SQL INT được validator kiểm tra; việc phân loại role thuộc SQL và backend ánh xạ lỗi theo cùng policy, không hardcode IDs hay thêm quyền tra role cho actor. Role không tồn tại giữ HTTP 400 `INVALID_REFERENCE`; duplicate email giữ 409 `EMAIL_ALREADY_EXISTS`. Endpoint create giữ HTTP 200 theo controller hiện hành. Các role được phép là nhân sự nội bộ, không tạo `HOSOKHACHHANG`; role Customer bị chặn trước insert user. List/status vẫn áp dụng cho mọi tài khoản theo quyền hiện hành.

Metric dashboard được kiểm chứng đúng định nghĩa SQL hiện tại: activeSeats đếm ghế hoạt động trong rạp, gồm ghế hoạt động thuộc phòng ngưng hoạt động; showtimesToday loại suất đã hủy; paidOrdersToday dựa vào receipt thành công và ngày kinh doanh UTC+7. Doanh thu Manager vẫn dùng successful payment snapshots, ngày ghi nhận từ payment, bounds inclusive và default SQL; đơn đã hủy có receipt thành công lịch sử vẫn được ghi nhận, vé đã hủy không được đếm. Đây là hành vi procedure có sẵn được kiểm chứng, không thay đổi mô hình doanh thu.

Frontend wiring/options/browser theo các quyết định này chuyển R8. Việc phê duyệt policy không nâng FE PASS. Xem [báo cáo R7.2](../R7_2_REGRESSION_REPORT.md) để truy vết reproduction, fix và regression thực tế. R7.3 tiếp tục là bước Final Verification & Acceptance riêng.
