# Permission contract đề xuất cho R3B — DRAFT, chưa được chốt

R3A không áp dụng contract này. Chỉ bắt đầu R3B sau khi review Permission Matrix
và các quyết định bên dưới. Không rename hoặc tự thêm permission trong R3A.

## Thứ tự kiểm tra

Authentication → trạng thái tài khoản hiện tại → permission hiện tại →
ownership/scope hiện tại → business operation.

- Deny by default với protected operation và permission code không tồn tại.
- Role là nhóm cấp permission. Các ràng buộc account type/global scope cần được
  mô hình hóa rõ; không được xóa role guard một cách cơ học để mở quyền rộng hơn.
- Admin thiếu permission bị từ chối, như HTTP hiện tại. Hàm DB kiểm permission
  không tự trả true chỉ vì MaVaiTro=ADMIN.
- Manager operation cần permission chức năng và phân công PHANCONG_RAP hiệu lực.
  Lấy RapID authoritative từ resource trong DB, không tin cinemaId do client gửi
  nếu thao tác đang nhắm room/seat/showtime/pricing khác.
- Customer operation dùng identity từ authentication; dữ liệu đơn/khiếu nại riêng
  có ownership. PaymentId phải thuộc đúng order đã xác minh ownership.
- Backend/DB thực thi security boundary. Frontend chỉ quyết định UX.
- Permission/scope/account/role bị thu hồi có hiệu lực ở request tiếp theo, kể cả
  JWT đã phát hành. Không lấy authorization từ permission snapshot trong JWT.
- SP ghi dữ liệu cần kiểm actor và authorization sát business write theo contract
  đã chốt; giữ nguyên locking/transaction, tính tiền/điểm và clock của R1/R2.
  Probe R3A xác minh request sau revocation, chưa chứng minh thu hồi hủy một request
  đang chạy. Semantics in-flight cần quyết định riêng nếu yêu cầu nghiêm ngặt hơn.

## Mapping có bằng chứng từ catalog hiện tại

| Chức năng | Permission đề xuất | Identity/scope |
| --- | --- | --- |
| Tạo booking, preview áp dụng khuyến mãi | DAT_VE | Chủ đơn từ actor; preview không có ownership resource riêng |
| Tạo payment attempt, cập nhật result | THANH_TOAN | Own order + payment thuộc order |
| Gửi review | DANH_GIA | Author từ actor + eligibility hiện tại |
| Tạo complaint | GUI_KHIEU_NAI | Sender từ actor; order tham chiếu thuộc actor |
| Rooms | QL_PHONG | Manager assignment hoặc global operation eligibility đã chốt |
| Seats | QL_GHE | RapID của room/seat authoritative |
| Showtimes | QL_SUAT_CHIEU | RapID của room/showtime authoritative |
| Pricing | QL_BANG_GIA | RapID của bảng giá authoritative |
| Dashboard/revenue của rạp | XEM_BAO_CAO_RAP | Assignment của rạp |
| Complaint queue/detail | QL_KHIEUNAI | Queue scope, không Customer ownership |
| Complaint processing/status | XULY_KHIEUNAI | Complaint existence/transition rules |
| Complaint order reference | TRA_CUU_DON | Chỉ order liên kết complaint; quyền nhìn complaint phải được chốt rõ |
| Admin user/role/permission/assignment/cinema/catalog/report | Permission đúng từng row hiện có trong matrix | Global eligibility, không tự bỏ permission |

Các permission trên đều đã có trong QUYEN. Admin dùng cùng functional permission,
không dùng ADMIN như một permission thay thế.

## Quyết định cần review trước R3B

1. **Đọc dữ liệu Customer riêng:** catalog không định nghĩa permission riêng cho
   GET orders, order detail, complaint history/detail. DAT_VE mô tả tạo đơn;
   GUI_KHIEU_NAI mô tả tạo khiếu nại; TRA_CUU_DON mô tả đơn tham chiếu CSKH.
   Không tự gán TRA_CUU_DON cho Customer hoặc coi DAT_VE là quyền xem mọi dữ liệu
   riêng. Nếu giữ nguyên yêu cầu Permission + Ownership cho các GET này, cần chốt
   mapping với catalog hoặc phê duyệt thay đổi catalog trong giai đoạn sau.
2. **Bootstrap/session:** đề xuất GET auth/me, auth/permissions, profile self và
   GET manager/cinemas là self/session operations được liệt kê rõ; bootstrap
   assignments chỉ trả rạp của actor. Nếu cần permission riêng, phải chốt trước.
3. **Global Admin so với scoped Manager:** các mã QL_PHONG/GHE/SUAT_CHIEU/BANG_GIA
   đang cấp cho cả hai role. Chỉ bỏ requireAdmin/requireManager sẽ cho Manager gọi
   route toàn hệ thống bằng cùng permission. Cần chốt global-operation eligibility
   độc lập với permission chức năng; có thể giữ một ràng buộc role làm global scope
   exception được ghi rõ, hoặc phê duyệt model khác. Chưa tự tạo global permission.
4. **CSKH read semantics:** đề xuất queue/detail yêu cầu QL_KHIEUNAI; XULY_KHIEUNAI
   không ngầm cấp mọi read permission qua OR trong DB. Nếu xử lý cần đọc chi tiết,
   role configuration phải cấp cả quyền đọc và quyền xử lý rõ ràng.
5. **Order reference:** đề xuất TRA_CUU_DON cho action riêng. Cần chốt nó có đi cùng
   QL_KHIEUNAI để nhìn complaint hay là đủ một mình. Hai probe hiện tại chỉ chứng
   minh mismatch với catalog, không phê duyệt một tổ hợp mới.
6. **Role dependency:** TRG_XuLyKhieuNai_KiemTraVaiTro chỉ cho CSKH/ADMIN;
   assignment create/update chỉ chấp nhận target QUAN_LY_RAP; registration provision
   KHACH_HANG; booking UI/API chỉ cho Customer dù Manager đang được cấp DAT_VE và
   THANH_TOAN. Phân biệt business eligibility với functional permission; không
   sửa các dependency này trong R3A hoặc xóa chúng trước khi chốt policy.
7. **Public catalog:** 14 endpoint công khai có catalog/session/health endpoints;
   XEM_PHIM không được enforce. Chốt catalog vẫn public hay dùng permission, cùng
   các ngoại lệ public login/register/health, trước khi áp dụng deny-by-default.
8. **Revocation/FE state:** FE lấy user profile lúc login/mount/refresh/profile
   update, không subscribe thay đổi quyền. Đề xuất xử lý 403 và refresh UX state
   có kiểm soát; không coi FE stale permission là một security bypass.

## Acceptance tests cho R3B sau khi chốt

- Mỗi functional endpoint: grant → hợp lệ; revoke → token cũ bị từ chối; foreign
  ownership/scope → bị chặn dù có permission.
- Admin thiếu permission bị từ chối cả HTTP và SP nhận actor; permission không
  tồn tại trả false. Không còn đường nullable actor bỏ authorization trái contract.
- CSKH đọc/xử lý/order-reference dùng đúng permission đã chốt ở cả BE và DB.
- Partial grants mở đúng page/menu/action; không dùng một permission đại diện cho
  cả portal và không tải API chưa được cấp trong một Promise.all làm hỏng page.
- Menu không hiện area mà route role/scope đã chốt từ chối; action state nghiệp vụ
  và authorization state được kiểm độc lập.
- Giữ nguyên timezone R1, payment history, hold expiry, compensation 3NF và
  retry/concurrent cancellation của R2. Backend tiếp tục SP-only.

Danh sách file/SP dự kiến: mục 11 trong [R3A_REPORT.md](R3A_REPORT.md).
