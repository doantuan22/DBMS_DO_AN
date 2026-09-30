**KẾ HOẠCH PHÁT TRIỂN DỰ ÁN**

**HỆ THỐNG ĐẶT VÉ XEM PHIM TRỰC TUYẾN CHO CHUỖI RẠP**

**ROADMAP V2 - KIẾN TRÚC DBMS-FIRST / STORED-PROCEDURE-ONLY**

Database • Frontend • Backend • Lộ trình tích hợp • Ràng buộc công việc

| **Công nghệ nền tảng** | **Microsoft SQL Server • React.js • Node.js/Express.js • mssql** |
| --- | --- |
| Kiến trúc bắt buộc | React → REST API → Node.js/Express.js → EXEC Stored Procedure → SQL Server |
| Phạm vi tài khoản | KHACH_HANG • QUAN_LY_RAP • CSKH • ADMIN |
| Mục tiêu cuối | 46/46 Use Case chạy end-to-end; không có SQL nghiệp vụ trong source Backend |

**Nguyên tắc trung tâm: mọi SELECT / INSERT / UPDATE / DELETE, View, Function, Trigger và Transaction nghiệp vụ được triển khai ở DBMS. Backend chỉ truyền tham số, EXEC Stored Procedure và nhận kết quả.**

# **MỤC ĐÍCH VÀ NGUYÊN TẮC SỬ DỤNG ROADMAP**

Roadmap này thay thế phiên bản trước và áp dụng ràng buộc kiến trúc mới: không viết câu lệnh SQL nghiệp vụ trong mã Node.js. Tất cả thao tác đọc/ghi, phép tính dữ liệu, truy vấn tổng hợp, kiểm tra toàn vẹn nhiều bảng và transaction phải được thiết kế tại Microsoft SQL Server. Backend là lớp HTTP/API, xác thực, điều phối lời gọi Stored Procedure và chuẩn hóa response; Frontend chỉ làm việc với REST API.

**Quy tắc xuyên suốt: Backend không được dùng .query() để gửi SELECT/INSERT/UPDATE/DELETE; không dùng ORM/query builder để sinh SQL; tài khoản kết nối ứng dụng ưu tiên chỉ có quyền EXECUTE trên Stored Procedure được cho phép.**

- Phạm vi dữ liệu: 25 bảng theo ERD đã chốt, gồm tài khoản/RBAC, rạp-phòng-ghế, phim, lịch chiếu-giá, đặt vé-thanh toán, đánh giá-khiếu nại.
- Phạm vi chức năng: 46 Use Case gồm 14 Khách hàng, 9 Quản lý rạp, 6 CSKH và 17 Admin.
- Nguyên tắc triển khai: phát triển theo vertical slice; trong mỗi slice phải làm DBMS entry point trước, sau đó Backend API gọi SP, cuối cùng Frontend tích hợp.
- Nguyên tắc nghiệm thu: một Use Case chỉ DONE khi DBMS object + Stored Procedure gateway + Backend API + Frontend UI + kiểm thử tích hợp đều hoàn tất.
- Nguyên tắc nguồn sự thật: dữ liệu và nghiệp vụ chốt giá, ghế, khuyến mãi, trạng thái đơn, quyền/phạm vi truy cập được kiểm chứng tại server/DBMS; Frontend không được là nguồn sự thật.

# **1\. DATABASE - MICROSOFT SQL SERVER / DBMS**

Database trở thành lớp trung tâm của kiến trúc. Không chỉ lưu dữ liệu, SQL Server còn chứa toàn bộ truy vấn đọc/ghi, View, Function, Trigger, Stored Procedure, Transaction và các quy tắc toàn vẹn trọng yếu. Backend không truy cập bảng trực tiếp.

## **1.1. Mục tiêu cần đạt**

- Xây dựng đầy đủ 25 bảng đúng ERD/lược đồ, datatype, PK, FK, NULL/NOT NULL và quan hệ đã chốt.
- Duy trì chuẩn hóa tối thiểu 3NF; chỉ giữ các trường snapshot giao dịch có chủ đích như GiaVe, DonGia, TongTienVe, TongTienDoAn, TienGiamGia.
- Đưa toàn bộ SELECT/INSERT/UPDATE/DELETE của hệ thống vào Stored Procedure; không để Backend cần biết cấu trúc query.
- Xây dựng View để đóng gói tập dữ liệu đọc phức tạp; Function để tái sử dụng phép tính/danh sách; Trigger để bảo vệ quy tắc tự động; các object này được gọi từ DBMS, không viết lại ở Node.js.
- Mọi nghiệp vụ nhiều bước như đặt vé, thanh toán, xử lý khiếu nại, phân công rạp phải có Transaction tại SQL Server và rollback đúng khi lỗi.
- Giải quyết race condition đặt ghế: nhiều request đồng thời cho cùng SuatChieuID + GheID chỉ tối đa một giao dịch được commit.
- Xây dựng Stored Procedure gateway đủ cho 46 Use Case và các endpoint hỗ trợ, với input/output/error contract rõ ràng.
- Tài khoản ứng dụng không có quyền đọc/ghi trực tiếp Table; ưu tiên chỉ GRANT EXECUTE cho schema/procedure cần dùng.
- Có seed, test SQL, test concurrency, backup/restore và script triển khai có thể chạy từ database trống.

## **1.2. Kiến trúc truy cập dữ liệu bắt buộc**

Frontend → REST API → Route/Middleware → Controller → Service → DB Client → EXEC dbo.sp_\* → View/Function/Table  
↘ Trigger/Constraint tự chạy

- Backend chỉ biết tên Stored Procedure và danh sách tham số đã quy định trong contract.
- Stored Procedure chịu trách nhiệm SELECT/INSERT/UPDATE/DELETE, JOIN, GROUP BY, SUM/COUNT, gọi View/Function, bắt đầu/commit/rollback transaction khi cần.
- View không được Backend SELECT trực tiếp. Nếu API cần dữ liệu từ View, tạo Stored Procedure đọc View và trả recordset.
- Function không được viết lại bằng JavaScript. Stored Procedure có thể gọi Function để tính giá/tổng hoặc lấy table-valued result.
- Trigger không được Backend gọi. Trigger chạy tự động khi câu lệnh ghi bên trong Stored Procedure tác động đến bảng.
- Mọi migration/script SQL nằm trong thư mục database riêng; việc “không có SQL trong code” áp dụng cho source application/backend, không cấm script DBMS.

## **1.3. Danh mục công việc Database**

### **A. Schema và toàn vẹn dữ liệu**

- Tạo database/schema; 25 bảng; PK/FK/IDENTITY; datatype; nullability; naming thống nhất.
- UNIQUE: MaVaiTro, MaQuyen, Email, SoDienThoai (khi có), vị trí ghế (PhongID, HangGhe, SoGhe), MaCode khuyến mãi, MaVe, đánh giá (PhimID, NguoiDungID), chi tiết đồ ăn (DonDatVeID, SanPhamID).
- CHECK/DEFAULT: tiền không âm, số sao 1..5, số lượng > 0, thời gian kết thúc >= bắt đầu, trạng thái khởi tạo, tập giá trị phương thức/định dạng nếu chốt bằng CHECK.
- Rà soát FK delete/update action; tránh cascade gây mất lịch sử giao dịch.

### **B. View và Function**

- View baseline: vw_LichChieuChiTiet, vw_LichSuDatVe, vw_ChiTietDonDatVe, vw_DoanhThuTheoRap, vw_DanhSachKhieuNai.
- Function baseline: fn_TinhGiaVe, fn_TinhTongTienVe, fn_TinhTongTienDoAn, fn_TinhTongTienDon, fn_DanhSachGheSuatChieu.
- View/Function là implementation detail của DBMS. API không được phụ thuộc bằng câu SELECT/function-call viết trong source Backend.
- Khi thay đổi output View/Function, phải kiểm tra Stored Procedure phụ thuộc trước khi merge.

### **C. Trigger**

- TRG_SuatChieu_KiemTraTrungLich: chống khoảng thời gian giao nhau trong cùng phòng.
- TRG_ChiTietVe_KiemTraGheDungPhong: ghế của vé phải thuộc đúng phòng của suất chiếu thông qua DONDATVE.
- TRG_ChiTietVe_KiemTraTrungGhe: không tồn tại hai vé còn hiệu lực cho cùng suất + ghế.
- TRG_DanhGia_KiemTraDaXemPhim: chỉ đánh giá khi có lịch sử xem hợp lệ.
- TRG_XuLyKhieuNai_KiemTraVaiTro: chỉ CSKH/Admin được ghi lịch sử xử lý.
- Trigger phải set-based và xử lý INSERTED/DELETED nhiều dòng, không viết theo giả định single-row.

### **D. Stored Procedure - cổng duy nhất cho Backend**

Danh sách dưới đây là baseline đề xuất để không phát sinh raw SQL ở Backend. Nhóm có thể gộp/tách procedure nếu vẫn bao phủ đúng Use Case và giữ contract rõ ràng.

| **Nhóm** | **Stored Procedure baseline** |
| --- | --- |
| Auth / tài khoản | sp_Auth_RegisterCustomer; sp_Auth_Login; sp_User_GetCurrent; sp_User_UpdateProfile; sp_RBAC_GetPermissionsByUser; sp_RBAC_CheckPermission; sp_Manager_CheckRapScope |
| Phim / danh mục công khai | sp_Movie_List; sp_Movie_GetDetail; sp_Genre_List; sp_Actor_ListByMovie; sp_Cinema_List; sp_Showtime_ListByMovie; sp_Showtime_GetDetail |
| Ghế / sản phẩm / khuyến mãi | sp_Seat_ListByShowtime; sp_Product_ListActive; sp_Promotion_Validate |
| Đặt vé / đơn | sp_Booking_Create (sp_DatVe); sp_Order_ListByCustomer; sp_Order_GetDetailByCustomer; sp_Order_GetReferenceForStaff |
| Thanh toán | sp_Payment_CreateAttempt; sp_Payment_UpdateResult (hoặc sp_XuLyThanhToan); sp_Order_GetPaymentStatus |
| Đánh giá / khiếu nại khách hàng | sp_Review_Create; sp_Review_ListByMovie; sp_Complaint_Create; sp_Complaint_ListByCustomer; sp_Complaint_GetByCustomer |
| Manager - phạm vi rạp | sp_Manager_ListAssignedCinemas; sp_Manager_Room_List/Create/Update/Delete; sp_Manager_Seat_List/Create/Update/Delete; sp_Manager_Showtime_List/Create/Update/Cancel; sp_Manager_Pricing_List/Create/Update; sp_Manager_Dashboard; sp_Manager_Revenue |
| CSKH | sp_Support_Complaint_List; sp_Support_Complaint_GetDetail; sp_Support_Complaint_GetOrderReference; sp_Support_Complaint_AddProcessing; sp_Support_Complaint_UpdateStatus |
| Admin - RBAC | sp_Admin_User_List/CreateInternal/UpdateStatus; sp_Admin_Role_List/Create/Update/Delete; sp_Admin_Permission_List/Create/Update/Delete; sp_Admin_RolePermission_Set; sp_Admin_Assignment_List/Create/Update |
| Admin - danh mục | sp_Admin_Cinema_\*; sp_Admin_Room_\*; sp_Admin_Seat_\*; sp_Admin_Movie_\*; sp_Admin_Genre_\*; sp_Admin_Actor_\*; sp_Admin_Product_\*; sp_Admin_Promotion_\*; sp_Admin_Pricing_\*; sp_Admin_Showtime_\* |
| Admin - hỗ trợ/báo cáo/cấu hình | sp_Admin_Complaint_List/Get/Process; sp_Admin_Report_Revenue; sp_Admin_Dashboard; sp_Admin_Config_Get/Update |
| Hệ thống | sp_System_HealthCheck; sp_System_GetReferenceData nếu cần danh mục dùng chung |

### **E. Transaction, concurrency và snapshot**

- sp_Booking_Create phải khóa/đồng bộ việc kiểm tra ghế và tạo DONDATVE + CHITIETVE + CHITIETDOAN + cập nhật sử dụng khuyến mãi trong cùng transaction.
- Giá vé và đơn giá đồ ăn phải chốt snapshot tại DBMS; Backend/Frontend không được gửi tổng tiền như nguồn sự thật.
- Thanh toán phải giữ được nhiều lần thử, không ghi đè lịch sử; cập nhật trạng thái đơn và giao dịch trong cùng logic transaction phù hợp.
- Xử lý khiếu nại phải ghi XULY_KHIEUNAI và cập nhật KHIEUNAI nhất quán.
- Phân công rạp phải kiểm tra role QUAN_LY_RAP và khoảng hiệu lực tại DBMS.

### **F. Security, Index, Seed, Test và Deployment**

- Tạo SQL Login/User cho ứng dụng với quyền tối thiểu; không cấp SELECT/INSERT/UPDATE/DELETE trực tiếp lên bảng.
- GRANT EXECUTE trên schema/procedure cần dùng; DENY hoặc không cấp quyền trực tiếp lên bảng/view nếu không cần.
- Thiết kế index cho FK, Email, trạng thái, thời gian, khóa tìm kiếm; kiểm tra execution plan trước/sau.
- Seed 4 role, permission, account test, rạp/phòng/ghế/phim/suất/sản phẩm/khuyến mãi đủ demo.
- Tạo test script cho từng SP: happy path, invalid input, permission/scope, rollback, multi-row trigger và concurrent booking.
- Có backup, restore test, version/migration order và release script.

## **1.4. Các phase lớn của Database**

| **Phase** | **Tên phase** | **Công việc chính** | **Điều kiện hoàn tất** |
| --- | --- | --- | --- |
| DB-01 | Baseline & DB Contract | Khóa ERD 25 bảng, naming, datatype, trạng thái, danh sách View/Function/Trigger/SP; lập mapping 46 Use Case → SP entry point. | Không còn Use Case nào chưa có kế hoạch DBMS entry point. |
| DB-02 | Schema | Tạo database, 25 bảng, PK/FK/IDENTITY, nullability, quan hệ và script create/drop theo thứ tự dependency. | schema.sql chạy sạch trên DB trống; 25/25 bảng đúng lược đồ. |
| DB-03 | Constraint & Integrity | CHECK/UNIQUE/DEFAULT, business key, FK rules, snapshot fields và test dữ liệu sai. | Dữ liệu sai bị DB từ chối; test dương/âm đầy đủ. |
| DB-04 | View & Function | Xây 5 View, 5 Function baseline và helper DBMS cần cho các module; chuẩn output để SP tái sử dụng. | View/Function test độc lập; không cần Backend query trực tiếp. |
| DB-05 | Trigger | Cài 5 Trigger baseline, set-based, multi-row-safe; chuẩn THROW/error message. | Trigger pass multi-row test và không gây side effect ngoài thiết kế. |
| DB-06 | Stored Procedure - Read Gateway | Tạo toàn bộ SP đọc: auth lookup, movie/showtime/seat/product, order/history, complaint, manager/admin/report list/detail. | Mọi GET/read API dự kiến đều có SP; Backend không cần SELECT trực tiếp. |
| DB-07 | Stored Procedure - Write Gateway | Tạo SP ghi CRUD/command cho tài khoản, booking, payment, review, complaint, manager/admin; input/output contract và TRY...CATCH. | Mọi POST/PUT/PATCH/DELETE API đều có SP tương ứng; không cần DML trong Backend. |
| DB-08 | Transaction & Concurrency | Hoàn thiện sp_DatVe, thanh toán, khiếu nại, phân công; locking/isolation phù hợp; rollback; idempotency nếu cần. | 2+ phiên đặt cùng ghế: tối đa một commit; không có đơn nửa chừng. |
| DB-09 | RBAC & DB Security | SP kiểm tra quyền/phạm vi; application SQL user chỉ EXECUTE; GRANT/REVOKE/DENY; audit quyền. | Ứng dụng không SELECT bảng trực tiếp; quyền tối thiểu được kiểm chứng. |
| DB-10 | Seed & Test Data | Seed role/quyền/account, catalog, showtime, sản phẩm, promotion, booking cases. | Môi trường dev/demo có dữ liệu tái lập và account 4 role. |
| DB-11 | Performance & Database QA | Index/query plan; test toàn bộ SP/View/Function/Trigger/rollback/concurrency; kiểm tra dependency. | Không còn blocker DB; procedure quan trọng đạt hiệu năng demo chấp nhận được. |
| DB-12 | Deployment & Freeze | Release scripts, backup/restore, migration/version, checksum/manifest nếu dùng; đóng baseline DB. | Có thể dựng DB production từ môi trường sạch và rollback/restore khi cần. |

## **1.5. Checklist nghiệm thu Database**

- 25/25 bảng và toàn bộ PK/FK/constraint tồn tại đúng thiết kế.
- 100% API/use case có Stored Procedure entry point; không còn yêu cầu Backend tự SELECT/INSERT/UPDATE/DELETE.
- 5/5 View, 5/5 Function, 5/5 Trigger baseline hoạt động; các object bổ sung có test và dependency rõ.
- Procedure ghi quan trọng dùng TRY...CATCH/Transaction khi cần; error có mã/thông điệp đủ để Backend ánh xạ.
- Tài khoản ứng dụng chỉ có quyền DB cần thiết, ưu tiên EXECUTE; không sysadmin/db_owner.
- Concurrent booking, rollback, multi-row trigger, permission/scope và backup/restore đều PASS.
- Có script create/reset/seed/security/test/release được version-control.

# **2\. FRONTEND - REACT.JS**

Frontend không thay đổi về công nghệ nhưng thay đổi rõ về trách nhiệm: chỉ hiển thị dữ liệu và gửi request tới REST API. Mọi giá trị nghiệp vụ cuối cùng, quyền, trạng thái ghế, tổng tiền, doanh thu và dữ liệu tổng hợp phải lấy từ Backend/DBMS; client chỉ có thể tính preview để hỗ trợ trải nghiệm.

## **2.1. Mục tiêu cần đạt**

- Tạo giao diện đầy đủ cho Public/Customer, Manager, CSKH và Admin theo 46 Use Case.
- Booking flow liền mạch: phim → lịch chiếu → ghế → đồ ăn → khuyến mãi → xác nhận → thanh toán → lịch sử.
- Tất cả screen dùng API thật; mock chỉ dùng tạm trong phase đầu và phải được loại bỏ trước nghiệm thu.
- Có loading, empty, error, success, confirm, retry, pagination/filter khi cần; xử lý rõ 401/403/404/409/422/500.
- Không hardcode role/permission như cơ chế bảo mật; UI có thể ẩn/disable theo permission nhưng server vẫn quyết định.
- Không gửi tổng tiền/giá/role/userId như dữ liệu đáng tin cậy; chỉ gửi lựa chọn/ID cần thiết và nhận kết quả chốt từ server.
- Có responsive, accessibility cơ bản và test các flow trọng tâm.

## **2.2. Phạm vi màn hình/chức năng**

| **Khu vực** | **Màn hình/chức năng phải có** |
| --- | --- |
| Public/Customer | Home; danh sách/chi tiết phim; lịch chiếu; chọn ghế; sản phẩm; promotion; checkout; thanh toán; lịch sử/chi tiết đơn; hồ sơ; đánh giá; khiếu nại. |
| Manager | Dashboard rạp; rạp được phân công; phòng; ghế; suất chiếu; bảng giá; vận hành; doanh thu. |
| CSKH | Danh sách khiếu nại; filter; chi tiết; đơn tham chiếu; timeline xử lý; form xử lý; cập nhật trạng thái. |
| Admin | Dashboard; tài khoản; role; permission; role-permission; phân công rạp; rạp/phòng/ghế; phim/thể loại/diễn viên; sản phẩm; khuyến mãi; bảng giá; suất chiếu; khiếu nại; báo cáo; cấu hình. |

## **2.3. Các phase lớn của Frontend**

| **Phase** | **Tên phase** | **Công việc chính** | **Điều kiện hoàn tất** |
| --- | --- | --- | --- |
| FE-01 | Foundation | React project, Router, layouts, theme/tokens, API client, env, error boundary, component nền. | App chạy ổn định; route map và cấu trúc thống nhất. |
| FE-02 | Auth & Access UI | Login/register/logout/profile; auth state; protected route; role/permission-aware navigation. | 4 role vào đúng khu vực; UI trái quyền không hiển thị hợp lý. |
| FE-03 | Movie & Showtime | Home, movie list/detail, genre/actor display, cinema/showtime filters. | Public flow dùng API thật tới dữ liệu DBMS. |
| FE-04 | Seat & Booking | SeatMap, multi-select, product, promotion, summary, confirm, submit; xử lý conflict. | Tạo booking qua API; 409 refresh ghế đúng. |
| FE-05 | Payment & Orders | Payment simulation/result, history, order detail, ticket code, profile. | Khách xem đúng dữ liệu đơn của mình. |
| FE-06 | Review & Complaint | Review form, eligibility feedback, complaint form, optional order reference, status tracking. | KH-13..KH-14 hoàn chỉnh. |
| FE-07 | Manager Portal | CRUD phòng/ghế/suất/bảng giá; dashboard/revenue; scope awareness. | QLR-01..QLR-09 có UI đầy đủ. |
| FE-08 | CSKH Portal | Queue/filter/detail/reference order/timeline/process/update status. | CSKH-01..CSKH-06 chạy end-to-end. |
| FE-09 | Admin Portal | Users/RBAC/assignment/catalog/pricing/showtime/complaint/report/config. | ADM-01..ADM-17 có UI tương ứng. |
| FE-10 | UX Hardening | Loading/error/empty/toast/confirm/pagination/responsive/a11y; chống double-submit. | Không còn màn hình thiếu state hoặc hành vi không nhất quán. |
| FE-11 | Frontend & E2E Test | Component/form/route/API tests; E2E customer/manager/CSKH/admin flows. | Flow chính PASS trên môi trường tích hợp. |
| FE-12 | Production Build | Env production, build, asset optimization/lazy load nếu cần, deploy. | Frontend production truy cập được và không còn mock trong flow chính. |

## **2.4. Ràng buộc frontend liên quan DBMS-first**

- Frontend không biết và không phụ thuộc tên bảng/View/Function/Trigger/Stored Procedure; chỉ biết REST API contract.
- Không tái hiện logic tính giá, khuyến mãi, doanh thu, quyền truy cập hoặc trạng thái ghế như logic authoritative ở client.
- Preview tổng tiền nếu có phải gắn nhãn preview; sau khi booking, hiển thị số tiền server/DBMS trả về.
- Khi server trả xung đột ghế, UI phải loại bỏ state cũ và tải lại availability thay vì cố giữ lựa chọn.
- Không cache dữ liệu quyền/phạm vi quá lâu theo cách cho phép UI hiển thị thao tác đã hết quyền; nếu có cache phải có cơ chế refresh.

# **3\. BACKEND - NODE.JS / EXPRESS.JS**

Backend là lớp API và điều phối; không phải nơi viết SQL. Mọi truy cập dữ liệu đều thông qua Stored Procedure. Kiến trúc bắt buộc: Route → Middleware → Controller → Service → DB Procedure Client → SQL Server.

## **3.1. Mục tiêu cần đạt**

- Cung cấp REST API đầy đủ cho 46 Use Case, với method/path/auth/permission/input/output/error contract rõ.
- Xác thực, session/JWT, account status, RBAC và manager scope; dữ liệu kiểm tra quyền/phạm vi lấy qua Stored Procedure hoặc claim đã được phát hành từ nguồn DBMS theo thiết kế.
- Tạo một lớp DB client/repository chỉ làm connection pool, typed input/output parameter và execute Stored Procedure.
- Tuyệt đối không chứa SELECT/INSERT/UPDATE/DELETE/JOIN/GROUP BY hoặc transaction SQL trong source Backend.
- Không dùng ORM/query builder để sinh SQL trực tiếp tới bảng; không dùng .query() cho nghiệp vụ.
- Chuẩn hóa error mapping từ SQL Server sang HTTP status; không làm mất mã lỗi nghiệp vụ như conflict ghế/vi phạm scope.
- Có OpenAPI/Swagger, logging, validation request, tests và deployment readiness.

## **3.2. Kiến trúc bắt buộc và trách nhiệm từng tầng**

| **Tầng** | **Trách nhiệm** | **Ràng buộc** |
| --- | --- | --- |
| Route | Khai báo endpoint/method và gắn middleware. | Không SQL; không business logic; không gọi DB trực tiếp. |
| Middleware | Authenticate, validate request cơ bản, RBAC/permission, ownership/scope orchestration. | Nếu cần dữ liệu DB, gọi service/SP; không SELECT bảng. |
| Controller | Nhận request, lấy params/body/user context, gọi service, map response. | Mỏng; không transaction; không execute procedure hàng loạt tùy tiện. |
| Service | Điều phối use case ở mức ứng dụng, gọi đúng procedure, phối hợp auth/context, map domain error. | Không viết SQL; không tái hiện transaction DBMS; không tự tính giá chốt. |
| DB Procedure Client | Quản lý mssql pool; .input/.output/.execute; timeout; map recordset/output. | Cấm .query() cho nghiệp vụ; cấm raw SQL; cấm ORM/query builder. |
| SQL Server | SELECT/DML, View, Function, Trigger, Transaction, Constraint, Index. | Là nơi thực thi nghiệp vụ dữ liệu và bảo vệ toàn vẹn cuối cùng. |

## **3.3. Chuẩn lớp DB Procedure Client**

pool.request()  
.input('Param', sql.Int, value)  
.output('OutCode', sql.Int)  
.execute('dbo.sp_TenNghiepVu')

- Chỉ whitelist/cấu hình procedure name cố định trong code; không cho client truyền tên procedure tùy ý.
- Typed parameter bắt buộc; không nối chuỗi input vào SQL.
- Có timeout, connection pool, retry chỉ khi an toàn; không retry command không idempotent một cách mù quáng.
- Recordset/output/return value được map sang DTO/response; SQL error được chuyển thành domain/API error có mã rõ.
- Health check cũng gọi sp_System_HealthCheck hoặc cơ chế kết nối không chứa query nghiệp vụ.

## **3.4. Nhóm API cần phát triển**

| **Module API** | **Phạm vi và DBMS entry point** |
| --- | --- |
| Auth/Profile | register, login, me, update profile, logout/refresh nếu triển khai → gọi nhóm sp_Auth_\*/sp_User_\*. |
| Movies/Public | movies, detail, genres, actors, cinemas, showtimes → sp_Movie_\*/sp_Genre_\*/sp_Cinema_\*/sp_Showtime_\*. |
| Seats/Booking | availability, products, promotion validate, create booking → sp_Seat_\*, sp_Product_\*, sp_Promotion_Validate, sp_Booking_Create. |
| Payment/Orders | payment attempt/result, order history/detail/status → sp_Payment_\*, sp_Order_\*. |
| Customer after-sales | review, complaint → sp_Review_\*, sp_Complaint_\*. |
| Manager | room/seat/showtime/pricing/dashboard/revenue → sp_Manager_\*; scope phải được kiểm chứng. |
| CSKH | complaint queue/detail/reference/process/status → sp_Support_\*. |
| Admin/RBAC | users, roles, permissions, role-permission, assignment → sp_Admin_\*. |
| Admin/Catalog | cinema/room/seat/movie/genre/actor/product/promotion/pricing/showtime → sp_Admin_\*. |
| Reports/Config | global reports, dashboard, config → sp_Admin_Report_\*/sp_Admin_Dashboard/sp_Admin_Config_\* |

## **3.5. Các phase lớn của Backend**

| **Phase** | **Tên phase** | **Công việc chính** | **Điều kiện hoàn tất** |
| --- | --- | --- | --- |
| BE-01 | Foundation & SP Client | Express, config/env, mssql pool, procedure client, route loader, error handler, logger, health endpoint. | Server chạy; chỉ có cơ chế execute SP, không có raw query utility. |
| BE-02 | Authentication | Register/login/me/update profile thông qua SP; password hash/verify theo contract; JWT/session. | Đăng nhập/đăng ký hoạt động mà không SELECT/INSERT trực tiếp. |
| BE-03 | RBAC & Scope | Permission middleware, ownership, manager scope; gọi SP kiểm tra quyền/phạm vi khi cần. | Test vượt quyền/vượt rạp bị từ chối. |
| BE-04 | Public/Customer Core | Movie/detail/showtime/seat/product/promotion/booking endpoints; mỗi endpoint map tới SP cụ thể. | KH-01..KH-09 API hoạt động; no-SQL audit PASS. |
| BE-05 | Payment & Orders | Payment attempt/result, order status/history/detail thông qua SP. | KH-10..KH-12 PASS; ownership đúng. |
| BE-06 | Review & Complaint | Review/create/list complaint/detail thông qua SP. | KH-13..KH-14 PASS. |
| BE-07 | Manager | Room/seat/showtime/pricing/dashboard/revenue API; scope enforced. | QLR-01..QLR-09 PASS. |
| BE-08 | CSKH | Complaint queue/detail/reference/process/status API. | CSKH-01..CSKH-06 PASS. |
| BE-09 | Admin | Users/RBAC/assignment/catalog/pricing/showtime/complaint/report/config API. | ADM-01..ADM-17 PASS. |
| BE-10 | Validation, Security & No-SQL Audit | Request schema, CORS, rate limit, headers, payload limit; scan source cấm .query/raw SQL/ORM. | Không lộ secret; không có raw SQL trong src; audit PASS. |
| BE-11 | API Docs & Test | Swagger/OpenAPI; unit/service/API/integration/concurrency tests; mock SP client cho unit nếu cần. | Frontend dùng contract; test suite PASS. |
| BE-12 | Production Readiness | Env prod, health/readiness, logging, graceful shutdown, deployment. | Backend deploy được và chỉ cần EXECUTE quyền DBMS. |

## **3.6. Điều cấm tuyệt đối trong Backend**

- Không viết chuỗi SQL chứa SELECT, INSERT, UPDATE, DELETE, MERGE, JOIN, GROUP BY, EXEC động hoặc BEGIN TRAN/COMMIT/ROLLBACK.
- Không dùng request.query(), pool.query() hoặc tagged template/query builder để truy cập bảng.
- Không dùng Sequelize/Prisma/TypeORM/Knex hay ORM/query builder cho CRUD vào database trong baseline này.
- Không đọc trực tiếp View/Function bằng câu query từ Node.js; tạo Stored Procedure wrapper.
- Không cho phép tên bảng/cột/procedure đến từ request của client.
- Không chuyển logic tính giá, khuyến mãi, booking conflict, doanh thu hoặc transaction từ DBMS sang JavaScript chỉ để “làm nhanh”.

# **LỘ TRÌNH CÔNG VIỆC THEO PHASE - TÍCH HỢP DATABASE / BACKEND / FRONTEND**

Thứ tự trong từng phase là DBMS contract/object → Backend API gọi Stored Procedure → Frontend tích hợp. Không chuyển sang phase kế tiếp khi DBMS entry point chưa ổn định hoặc Backend còn raw SQL.

## **PHASE 0 - Khóa baseline & kiến trúc**

- DB: khóa ERD 25 bảng, danh sách View/Function/Trigger, naming, trạng thái; lập ma trận 46 UC → Stored Procedure entry point.
- BE: chốt cấu trúc Route/Middleware/Controller/Service/DB Procedure Client; cấm raw SQL/ORM; chốt API/error convention.
- FE: chốt route map, role layouts, screen/component inventory, UX states và API contract cần dùng.

**Điều kiện kết thúc: không còn Use Case nào không biết DBMS entry point/API/UI; quy tắc SP-only được ghi vào README/CONTRIBUTING.**

## **PHASE 1 - Foundation 3 lớp**

- DB: DB-02 schema cơ bản, constraint nền; sp_System_HealthCheck và seed tối thiểu.
- BE: BE-01 Express + mssql pool + Procedure Client + health endpoint gọi SP; không tạo query helper.
- FE: FE-01 React foundation + Router/layout/API client.

**Điều kiện kết thúc: Frontend gọi health API; Backend execute SP; application DB user không cần SELECT trực tiếp.**

## **PHASE 2 - Authentication + RBAC**

- DB: VAITRO, QUYEN, VAITRO_QUYEN, NGUOIDUNG, HOSOKHACHHANG; sp_Auth_RegisterCustomer, sp_Auth_Login, sp_User_GetCurrent/UpdateProfile, sp_RBAC_\*; seed 4 role.
- BE: register/login/me/profile; hash/verify; JWT/session; permission middleware gọi SP khi cần.
- FE: login/register/profile shell; auth state; protected route; menu theo role/permission.

**Điều kiện kết thúc: đăng ký khách hàng và đăng nhập 4 role end-to-end; không có SELECT user/role trong Backend.**

## **PHASE 3 - Catalog phim + rạp + lịch chiếu**

- DB: RAPCHIEUPHIM, PHONGCHIEU, GHE, PHIM, THELOAI, PHIM_THELOAI, DIENVIEN, PHIM_DIENVIEN, SUATCHIEU; trigger trùng lịch; vw_LichChieuChiTiet; SP list/detail/filter.
- BE: movie/detail/cinema/showtime APIs chỉ execute SP.
- FE: Home, danh sách/chi tiết phim, lịch chiếu theo rạp/ngày.

**Điều kiện kết thúc: public user chọn được một suất chiếu hợp lệ từ dữ liệu thật; no-SQL audit Backend PASS.**

## **PHASE 4 - Seat map + Booking core**

- DB: BANGGIA, KHUYENMAI, DONDATVE, CHITIETVE, SANPHAM, CHITIETDOAN; fn_TinhGiaVe/fn_DanhSachGheSuatChieu; trigger ghế đúng phòng/trùng ghế; sp_Seat_ListByShowtime, sp_Product_ListActive, sp_Promotion_Validate, sp_Booking_Create + Transaction.
- BE: seat/products/promotion/booking endpoints; chỉ truyền IDs/số lượng; map SQL conflict sang 409.
- FE: SeatMap, sản phẩm, promotion, summary, submit; xử lý 409 và refresh.

**Điều kiện kết thúc: booking end-to-end; hai client đặt cùng ghế chỉ một client thành công; giá chốt từ DBMS.**

## **PHASE 5 - Thanh toán + lịch sử đơn**

- DB: THANHTOAN; sp_Payment_CreateAttempt/UpdateResult; vw_LichSuDatVe/vw_ChiTietDonDatVe; fn tổng tiền; sp_Order_ListByCustomer/GetDetailByCustomer.
- BE: payment/order endpoints chỉ execute SP; ownership/permission đúng.
- FE: trang thanh toán mô phỏng, kết quả, lịch sử, chi tiết đơn/vé.

**Điều kiện kết thúc: khách tạo đơn → thanh toán → xem lịch sử/chi tiết đúng; nhiều lần thử thanh toán được lưu lịch sử.**

## **PHASE 6 - Đánh giá + khiếu nại**

- DB: DANHGIAPHIM, KHIEUNAI, XULY_KHIEUNAI; trigger đã xem phim/role xử lý; vw_DanhSachKhieuNai; sp_Review_\*, sp_Complaint_\*.
- BE: review và complaint endpoints chỉ execute SP; optional DonDatVeID.
- FE: review/rating, complaint form, chọn đơn tùy chọn, theo dõi trạng thái.

**Điều kiện kết thúc: KH-01..KH-14 hoàn tất end-to-end.**

## **PHASE 7 - Manager Portal**

- DB: PHANCONG_RAP; sp_Manager_CheckRapScope, sp_Manager_ListAssignedCinemas; SP CRUD phòng/ghế/suất/bảng giá; dashboard/revenue; sp_PhanCongQuanLyRap nếu dùng cho Admin.
- BE: manager APIs; middleware/service kiểm tra scope qua SP; không tin RapID từ client để cấp quyền.
- FE: Manager dashboard, CRUD phòng/ghế/suất/bảng giá, vận hành/doanh thu.

**Điều kiện kết thúc: QLR-01..QLR-09 PASS; Manager không truy cập được rạp ngoài phân công.**

## **PHASE 8 - CSKH Portal**

- DB: hoàn thiện sp_Support_Complaint_List/GetDetail/GetOrderReference/AddProcessing/UpdateStatus và transaction đồng bộ lịch sử-trạng thái.
- BE: queue/filter/detail/reference/process/status endpoints chỉ execute SP.
- FE: CSKH dashboard, queue, detail, timeline, xử lý, trạng thái.

**Điều kiện kết thúc: CSKH-01..CSKH-06 PASS; lịch sử xử lý đầy đủ.**

## **PHASE 9 - Admin Portal**

- DB: SP Admin cho users/RBAC/assignment/cinema/room/seat/movie/genre/actor/product/promotion/pricing/showtime/complaint/report/config; seed permission/security script.
- BE: Admin APIs map 1:1 hoặc có contract rõ với SP; không raw CRUD SQL.
- FE: toàn bộ màn hình ADM-01..ADM-17.

**Điều kiện kết thúc: Admin quản trị toàn hệ thống; không còn Use Case bắt buộc thiếu SP/API/UI.**

## **PHASE 10 - Dashboard + báo cáo + tối ưu**

- DB: vw_DoanhThuTheoRap, Function/View báo cáo, sp_Manager_Revenue, sp_Admin_Report_Revenue, index/query plan.
- BE: report endpoints chỉ execute SP và truyền filter.
- FE: dashboard/chart/table/filter; export nếu nhóm triển khai.

**Điều kiện kết thúc: số liệu Manager đúng phạm vi, Admin toàn hệ thống; số liệu đối chiếu DBMS khớp.**

## **PHASE 11 - Hardening + kiểm thử tổng**

- DB: test constraints/View/Function/Trigger/SP/rollback/concurrency/performance; backup/restore; permission audit.
- BE: security, rate limit, logging, Swagger, test suite; quét source cấm .query/raw SQL/ORM; kiểm tra chỉ .execute SP.
- FE: loading/error/empty/responsive/a11y; E2E 4 role; bỏ toàn bộ mock production.

**Điều kiện kết thúc: 46/46 UC PASS; no-SQL audit PASS; concurrent booking PASS; không Critical/High blocker.**

## **PHASE 12 - Deployment + nghiệm thu 100%**

- DB: deploy schema/object/SP/security/seed cần thiết; application user chỉ quyền EXECUTE; backup trước release.
- BE: deploy env production; secret/CORS/health/readiness đúng; kiểm tra không có SQL inline trong bundle/source.
- FE: production build/deploy; base URL và auth flow đúng.

**Điều kiện kết thúc: demo full 4 role từ môi trường sạch; checklist bàn giao đủ; database restore được; 46/46 UC PASS.**

# **4\. RÀNG BUỘC CÔNG VIỆC**

Các ràng buộc dưới đây là điều kiện bắt buộc của roadmap mới. Nếu một task vi phạm, task đó chưa được nghiệm thu dù chức năng có vẻ chạy được.

## **4.1. Ràng buộc phạm vi và traceability**

- Mọi task phải truy ngược được về Use Case/yêu cầu DBMS/tài liệu thiết kế; không tự mở rộng nghiệp vụ trước baseline.
- Mỗi Use Case phải mapping: FE screen/route → BE endpoint → Stored Procedure entry point → View/Function/Trigger/Table phụ thuộc → test case.
- Không tự đổi tên bảng/cột/cardinality/trạng thái/role/quyền mà không cập nhật tài liệu và dependency.
- Nếu tài liệu thiếu hoặc mâu thuẫn, tạo design clarification; không âm thầm tự suy diễn.

## **4.2. Ràng buộc “Không SQL trong application code”**

- Trong source Backend không được có SELECT, INSERT, UPDATE, DELETE, MERGE, JOIN, GROUP BY, HAVING, BEGIN TRAN, COMMIT, ROLLBACK hoặc query SQL nghiệp vụ khác.
- Cấm pool.query(), request.query() hoặc helper rawQuery cho nghiệp vụ.
- Cấm ORM/query builder sinh CRUD SQL tới bảng trong baseline: Prisma, Sequelize, TypeORM, Knex hoặc tương đương.
- SQL script chỉ được nằm trong khu vực Database/DBMS của repository, ví dụ database/schema, database/procedures, database/views, database/functions, database/triggers, database/tests.
- Backend chỉ được dùng connection pool + typed input/output + execute Stored Procedure.
- Nếu phát hiện raw SQL trong code review/no-SQL scan, merge phải bị chặn cho đến khi chuyển logic xuống DBMS.

## **4.3. Ràng buộc Stored Procedure là cổng dữ liệu duy nhất**

- Mọi endpoint đọc và ghi dữ liệu phải có Stored Procedure entry point.
- Backend không SELECT View trực tiếp; tạo procedure wrapper đọc View.
- Backend không gọi Function bằng câu SQL; Function được gọi bên trong Procedure/View phù hợp.
- Backend không thao tác Table trực tiếp. Procedure chịu trách nhiệm DML và trả recordset/output.
- Tên procedure trong code phải là hằng số/whitelist nội bộ, không nhận từ request client.
- Mỗi SP có contract: tên tham số, kiểu SQL, required/null, output/recordset, mã lỗi, quyền cần thiết, side effect và transaction behavior.

## **4.4. Ràng buộc View / Function / Trigger**

- View dùng đóng gói truy vấn đọc/tổng hợp phức tạp và tái sử dụng; API lấy dữ liệu qua SP đọc View.
- Function dùng cho phép tính/danh sách cần tái sử dụng tại DBMS; không copy thuật toán tương đương sang JavaScript để làm nguồn sự thật.
- Trigger chỉ dùng cho quy tắc tự động/toàn vẹn phù hợp, phải set-based và multi-row-safe.
- Trigger không thay thế mọi nghiệp vụ; logic điều phối nhiều bước vẫn ưu tiên Stored Procedure + Transaction.
- Mọi thay đổi View/Function/Trigger phải có dependency test đối với SP liên quan.

## **4.5. Ràng buộc Database transaction và concurrency**

- sp_Booking_Create/sp_DatVe là critical transaction: kiểm tra ghế, xác nhận phòng/suất, tính giá, khuyến mãi, tạo đơn/vé/đồ ăn và cập nhật usage phải nhất quán.
- Nếu bất kỳ ghế nào không hợp lệ/đã mất, toàn bộ booking rollback theo policy đã chốt; không tạo đơn nửa thành công.
- Thanh toán phải giữ lịch sử nhiều lần thử; không UPDATE đè mất giao dịch cũ.
- Xử lý khiếu nại phải ghi lịch sử và trạng thái hiện tại trong cùng transaction phù hợp.
- Test concurrency bắt buộc dùng ít nhất hai session/request đồng thời; kiểm tra “trống rồi insert” ngoài transaction là không đạt.

## **4.6. Ràng buộc Database security**

- Application SQL user không dùng sysadmin/db_owner.
- Không cấp SELECT/INSERT/UPDATE/DELETE trực tiếp trên bảng cho application user trừ trường hợp đặc biệt được phê duyệt và ghi rõ; baseline là EXECUTE-only.
- GRANT EXECUTE trên stored procedure/schema cần thiết; REVOKE/DENY quyền không cần.
- Không hardcode connection string/password trong repository; dùng environment/secret management.
- Có test chứng minh account ứng dụng không thể SELECT trực tiếp bảng nhưng vẫn gọi được SP được cấp quyền.

## **4.7. Ràng buộc Backend**

- Mọi private route qua authentication middleware; route có quyền riêng qua permission check; Manager phải kiểm tra scope.
- Controller mỏng; Service điều phối API-level; Database logic không được quay lại Service dưới dạng SQL hoặc phép tính authoritative.
- Identity lấy từ token/session; không tin UserID/Role/Permission do client tự gửi.
- Input phải validate format/range trước khi gọi SP; DBMS vẫn là lớp bảo vệ cuối cho dữ liệu và nghiệp vụ.
- Error từ SQL Server phải được map thành HTTP status/domain code; không trả stack trace/query/connection detail cho client.
- API contract thay đổi phải cập nhật Swagger/OpenAPI và thông báo Frontend.

## **4.8. Ràng buộc Frontend**

- Frontend chỉ gọi REST API; không biết database object.
- Ẩn nút không phải bảo mật; server vẫn phải từ chối khi thiếu quyền.
- Mọi request có loading/error/empty; command có chống double-submit.
- Không chốt giá/tổng/discount ở client. Preview chỉ tham khảo; kết quả cuối dùng response server.
- 409 booking conflict phải refresh seat state; không giữ UI cũ.
- Không còn mock data trong production flow khi nghiệm thu.

## **4.9. Ràng buộc naming, version và contract**

- Dùng convention nhất quán cho SP, ví dụ sp_&lt;Module&gt;\_&lt;Action&gt;; không trộn nhiều kiểu tên.
- Không đổi signature SP đang được Backend dùng mà không cập nhật version/contract và test tích hợp.
- Không dùng SELECT \* trong SP production nếu output contract cần ổn định; liệt kê cột cần trả.
- Procedure nên trả mã lỗi/THROW nhất quán để Backend ánh xạ; tránh message tự do không thể test.
- Migration/schema/object change phải được commit cùng version source sử dụng nó.

## **4.10. Ràng buộc kiểm thử**

- Mỗi SP có happy path, invalid input, permission/scope (nếu thuộc DBMS), boundary và rollback test.
- Mỗi Trigger có single-row và multi-row test.
- Mỗi Function/View có test dữ liệu biên và đối chiếu kết quả.
- Mỗi Backend endpoint có test chứng minh nó gọi đúng SP và không bypass DB client.
- Mỗi Manager API có case đúng rạp và sai rạp; order/complaint có ownership case.
- Booking: concurrent seat, wrong room, invalid promotion, rollback giữa chừng; Payment: success/fail/retry; Review: chưa xem/đã xem/duplicate.
- Trước release chạy regression 46 Use Case và no-SQL source audit.

## **4.11. Ràng buộc Git và quy trình làm việc**

- Tách thư mục Database và application rõ ràng; SQL object phải được version-control như code.
- Mỗi task/phase có branch hoặc commit scope rõ; không commit “fix/update” mơ hồ.
- Không chỉnh DB thủ công trên SSMS rồi quên đưa script vào repo.
- Không merge khi lint/test/build/no-SQL audit chưa pass hoặc API-SP contract lệch.
- Mỗi phase có checkpoint tích hợp DB → BE → FE trước khi chuyển phase.

## **4.12. Definition of Done**

- Một Use Case chỉ DONE khi DBMS object + SP gateway + BE endpoint + FE screen/state + auth/scope + integration test đều PASS.
- Không DONE nếu UI còn mock; không DONE nếu API Postman chạy nhưng chưa test quyền; không DONE nếu SP chạy nhưng flow thật chưa tích hợp.
- Không DONE nếu Backend còn raw SQL/ORM query cho Use Case đó.
- Critical/High bug về mất dữ liệu, vượt quyền, đặt trùng ghế, sai tiền, transaction nửa chừng phải đóng trước nghiệm thu.

## **4.13. Ràng buộc triển khai và bàn giao**

- Production có env riêng; không hardcode localhost/secret.
- Deploy DB object theo dependency: schema/tables → constraints/index → functions/views → triggers → procedures → seed/security.
- Backend production phải dùng DB account quyền tối thiểu và kết nối được chỉ qua SP.
- Có README cách dựng DB, chạy scripts, backend, frontend; 4 account demo; Swagger; backup DB.
- Test clean clone + clean database trước bàn giao.

## **4.14. Các shortcut bị cấm**

- Viết SELECT/INSERT/UPDATE/DELETE trực tiếp trong Node.js vì “nhanh hơn”.
- Cho ORM tự sinh SQL rồi coi như đáp ứng yêu cầu không viết SQL.
- Cho Backend SELECT trực tiếp View hoặc gọi Function bằng inline query.
- Cho Manager dùng RapID client gửi mà không kiểm tra scope.
- Đặt ghế bằng check-then-insert ngoài transaction/locking.
- Tính/chốt giá, doanh thu, promotion ở client hoặc backend JavaScript thay cho DBMS.
- Bỏ Trigger/SP/Function/View baseline mà không cập nhật thiết kế và được nhóm thống nhất.
- Hardcode IDs hoặc mock state để demo thay cho dữ liệu thật.

## **4.15. Checklist No-SQL Audit trước mỗi release**

- Tìm trong src/backend các chuỗi/token: SELECT, INSERT, UPDATE, DELETE, MERGE, JOIN, GROUP BY, BEGIN TRAN, COMMIT, ROLLBACK.
- Tìm các API nguy cơ: .query(, pool.query(, request.query(, raw(, $queryRaw, createQueryBuilder, prisma.\*, sequelize.\*, knex(...).
- Xác nhận DB client chỉ expose executeProcedure/execute; không expose generic query.
- Xác nhận application DB user không có quyền SELECT/DML trực tiếp trên tables.
- Lấy ngẫu nhiên ít nhất 5 endpoint ở các module khác nhau và trace: endpoint → service → procedure name → SQL object implementation.
- No-SQL audit phải được lưu kết quả PASS cùng release checklist.

# **PHỤ LỤC A - CHECKLIST 46 USE CASE (SP-ONLY)**

| **Mã** | **Actor** | **Chức năng** | **Stored Procedure entry point** | **Nghiệm thu** |
| --- | --- | --- | --- | --- |
| KH-01 | Khách hàng | Đăng ký tài khoản | sp_Auth_RegisterCustomer | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-02 | Khách hàng | Đăng nhập hệ thống | sp_Auth_Login / sp_RBAC_GetPermissionsByUser | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-03 | Khách hàng | Xem và cập nhật thông tin cá nhân | sp_User_GetCurrent / sp_User_UpdateProfile | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-04 | Khách hàng | Xem danh sách phim và chi tiết phim | sp_Movie_List / sp_Movie_GetDetail | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-05 | Khách hàng | Xem lịch chiếu theo rạp/suất chiếu | sp_Showtime_ListByMovie / sp_Showtime_GetDetail | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-06 | Khách hàng | Chọn ghế theo suất chiếu | sp_Seat_ListByShowtime | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-07 | Khách hàng | Đặt vé | sp_Booking_Create (sp_DatVe) | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-08 | Khách hàng | Mua đồ ăn/thức uống kèm vé | sp_Product_ListActive + sp_Booking_Create | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-09 | Khách hàng | Áp dụng mã khuyến mãi | sp_Promotion_Validate + sp_Booking_Create | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-10 | Khách hàng | Thanh toán đơn đặt vé | sp_Payment_CreateAttempt / sp_Payment_UpdateResult | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-11 | Khách hàng | Xem lịch sử đặt vé | sp_Order_ListByCustomer | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-12 | Khách hàng | Xem chi tiết đơn đặt vé | sp_Order_GetDetailByCustomer | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-13 | Khách hàng | Đánh giá phim đã xem | sp_Review_Create | DB ☐ BE ☐ FE ☐ INT ☐ |
| KH-14 | Khách hàng | Gửi khiếu nại | sp_Complaint_Create / sp_Complaint_ListByCustomer | DB ☐ BE ☐ FE ☐ INT ☐ |
| QLR-01 | Quản lý rạp | Đăng nhập | sp_Auth_Login + sp_Manager_ListAssignedCinemas | DB ☐ BE ☐ FE ☐ INT ☐ |
| QLR-02 | Quản lý rạp | Quản lý phòng chiếu | sp_Manager_Room_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| QLR-03 | Quản lý rạp | Quản lý sơ đồ ghế | sp_Manager_Seat_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| QLR-04 | Quản lý rạp | Tạo suất chiếu | sp_Manager_Showtime_Create | DB ☐ BE ☐ FE ☐ INT ☐ |
| QLR-05 | Quản lý rạp | Sửa suất chiếu | sp_Manager_Showtime_Update | DB ☐ BE ☐ FE ☐ INT ☐ |
| QLR-06 | Quản lý rạp | Hủy suất chiếu | sp_Manager_Showtime_Cancel | DB ☐ BE ☐ FE ☐ INT ☐ |
| QLR-07 | Quản lý rạp | Cấu hình bảng giá | sp_Manager_Pricing_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| QLR-08 | Quản lý rạp | Theo dõi hoạt động rạp | sp_Manager_Dashboard | DB ☐ BE ☐ FE ☐ INT ☐ |
| QLR-09 | Quản lý rạp | Xem báo cáo doanh thu rạp | sp_Manager_Revenue | DB ☐ BE ☐ FE ☐ INT ☐ |
| CSKH-01 | CSKH | Đăng nhập | sp_Auth_Login | DB ☐ BE ☐ FE ☐ INT ☐ |
| CSKH-02 | CSKH | Xem danh sách khiếu nại | sp_Support_Complaint_List | DB ☐ BE ☐ FE ☐ INT ☐ |
| CSKH-03 | CSKH | Tra cứu chi tiết khiếu nại | sp_Support_Complaint_GetDetail | DB ☐ BE ☐ FE ☐ INT ☐ |
| CSKH-04 | CSKH | Xem đơn đặt vé tham chiếu | sp_Support_Complaint_GetOrderReference | DB ☐ BE ☐ FE ☐ INT ☐ |
| CSKH-05 | CSKH | Ghi nhận lần xử lý khiếu nại | sp_Support_Complaint_AddProcessing | DB ☐ BE ☐ FE ☐ INT ☐ |
| CSKH-06 | CSKH | Cập nhật trạng thái khiếu nại | sp_Support_Complaint_UpdateStatus | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-01 | Admin | Đăng nhập | sp_Auth_Login | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-02 | Admin | Quản lý tài khoản người dùng | sp_Admin_User_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-03 | Admin | Quản lý vai trò | sp_Admin_Role_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-04 | Admin | Quản lý danh mục quyền | sp_Admin_Permission_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-05 | Admin | Gán quyền cho vai trò | sp_Admin_RolePermission_Set | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-06 | Admin | Phân công quản lý rạp | sp_Admin_Assignment_\* / sp_PhanCongQuanLyRap | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-07 | Admin | Quản lý rạp chiếu phim | sp_Admin_Cinema_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-08 | Admin | Quản lý phòng chiếu và ghế | sp_Admin_Room_\* / sp_Admin_Seat_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-09 | Admin | Quản lý danh mục phim | sp_Admin_Movie_\* / sp_Admin_Actor_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-10 | Admin | Quản lý thể loại phim | sp_Admin_Genre_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-11 | Admin | Quản lý sản phẩm ăn uống | sp_Admin_Product_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-12 | Admin | Quản lý chương trình khuyến mãi | sp_Admin_Promotion_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-13 | Admin | Quản lý bảng giá | sp_Admin_Pricing_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-14 | Admin | Quản lý suất chiếu | sp_Admin_Showtime_\* | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-15 | Admin | Xử lý khiếu nại | sp_Admin_Complaint_\* hoặc dùng sp_Support_\* với permission | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-16 | Admin | Xem báo cáo doanh thu toàn hệ thống | sp_Admin_Report_Revenue / sp_Admin_Dashboard | DB ☐ BE ☐ FE ☐ INT ☐ |
| ADM-17 | Admin | Cấu hình hệ thống | sp_Admin_Config_Get / sp_Admin_Config_Update | DB ☐ BE ☐ FE ☐ INT ☐ |

# **PHỤ LỤC B - CHECKLIST BÀN GIAO CUỐI**

| **Hạng mục** | **Tài sản/điều kiện phải bàn giao** |
| --- | --- |
| Database | schema/constraint/index; views; functions; triggers; stored procedures; seed; security; tests; backup; deployment scripts. |
| Backend | source; .env.example; SP-only DB client; Swagger/OpenAPI; tests; no-SQL audit report; deployment config; health/logging. |
| Frontend | source; .env.example; production build; route map; API integration; responsive/loading/error states; tests. |
| Tài liệu | README; sơ đồ kiến trúc DBMS-first; ma trận 46 UC → SP/API/UI; tài khoản demo; kết quả test. |
| Nghiệm thu | 46/46 UC; booking concurrency; manager scope; CSKH; Admin; application DB user EXECUTE-only; backup/restore; clean build. |

**TIÊU CHÍ “100% HOÀN THIỆN”: 46/46 Use Case PASS; Database có đầy đủ object và Stored Procedure gateway; Backend không có SQL nghiệp vụ/ORM query; Frontend không còn mock flow chính; RBAC/scope/concurrency/rollback PASS; deploy từ môi trường sạch thành công.**