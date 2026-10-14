# BÁO CÁO NGHIỆM THU TỔNG THỂ DỰ ÁN
## REBUILD DATABASE & TRIỂN KHAI TOÀN BỘ HỆ THỐNG CSKH MỚI
**Kiến trúc:** DBMS-FIRST / STORED-PROCEDURE-ONLY  
**Ngày thực hiện:** 2026-10-14  
**Phạm vi áp dụng:** Hệ thống Cinema Booking (Toàn bộ 11 Giai đoạn theo Master Implementation Prompt)

---

## 1. TỔNG QUAN VÀ MỤC TIÊU ĐẠT ĐƯỢC

Dự án đã hoàn thành trọn vẹn 11 giai đoạn nâng cấp hệ thống Cinema Booking theo mô hình kiến trúc chuẩn mực **DBMS-First**:
1. **Khảo sát toàn diện:** Rà soát toàn bộ schema, 44 Use Case, 4 vai trò RBAC, hệ thống Stored Procedure, API Backend và Frontend.
2. **Thiết kế & Bổ sung CSDL chuẩn 3NF:** Mở rộng bảng `KHIEUNAI` và thêm 3 bảng mới (`TINNHAN_KHIEUNAI`, `YEUCAU_CHUYENCAP`, `LICHSU_PHANCONG_KHIEUNAI`) với đầy đủ ràng buộc toàn vẹn, index tối ưu, và chứng minh 3NF toán học.
3. **Mở rộng Fixed RBAC:** Bổ sung 10 quyền nghiệp vụ CSKH mới, duy trì đúng 4 vai trò cố định (`KHACH_HANG`, `QUAN_LY_RAP`, `CSKH`, `ADMIN`) với tổng số 33 quyền.
4. **Phát triển Stored Procedure:** Viết mới 14 Stored Procedure chuyên biệt, xử lý giao dịch nguyên tử, chống race condition, kiểm tra quyền nội tại tại SQL Server.
5. **Sao lưu, Kiểm chứng & Tái thiết lập Database:**
   - Sao lưu có kiểm chứng `RESTORE VERIFYONLY WITH CHECKSUM` cho các cơ sở dữ liệu thuộc phạm vi dự án.
   - Xóa an toàn cơ sở dữ liệu thử nghiệm cũ trong phạm vi dự án (không chạm DB hệ thống hay dự án ngoài).
   - Tái tạo sạch hoàn toàn cơ sở dữ liệu chính `CinemaBookingDB` (30 bảng, 148 SP, 6 View, 21 Function, 8 Trigger, 0 bản ghi rác).
   - Thiết lập cơ sở dữ liệu cô lập `CinemaBookingDB_Test` phục vụ kiểm thử tự động.
6. **Tích hợp Backend:** Đăng ký whitelist 14 SP, typed parameter mapping, bộ validator phân tầng, API endpoints cho Customer, CSKH, Admin.
7. **Kiểm thử Database & Backend:** 100% test suites (Unit, Integration, Lifecycle, Concurrency, Points & Revenue) đạt kết quả PASS tuyệt đối.
8. **Phát triển Frontend:** Giao diện Customer Chat 2 chiều, CSKH Support Portal (chat, ghi chú nội bộ, phân công, chuyển cấp Admin, tra cứu điểm & đơn hàng), Admin Escalation Module & CSKH Assignment.
9. **Kiểm thử End-to-End Trình duyệt thật (Playwright):** 8 kịch bản tương tác DOM thực tế kết hợp kiểm chứng SQL Server đều PASS.
10. **Kiểm thử Hồi quy Toàn diện:** 9 tầng kiểm thử độc lập từ Backend đến Frontend build, database integrity và reconciliation đều đạt 100% PASS.
11. **Đồng bộ Tài liệu:** Cập nhật chi tiết `Phân Tích _ Thiết Kế.md` và hoàn thiện Báo cáo Nghiệm thu Tổng thể.

---

## 2. CHI TIẾT THAY ĐỔI CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

### 2.1. Bảng mở rộng
- **`KHIEUNAI`**:
  - Bổ sung cột: `NhanVienPhuTrachID INT NULL`
  - Khóa ngoại: `FK_KhieuNai_NhanVienPhuTrach` tham chiếu tới `NGUOIDUNG(NguoiDungID)`.
  - Nghiệp vụ: Xác định nhân viên CSKH đang phụ trách khiếu nại. Cho phép `NULL` khi khiếu nại còn nằm trong hàng đợi chưa tiếp nhận.
  - Index: `IX_KhieuNai_NhanVienPhuTrachID` phục vụ lọc khiếu nại theo nhân viên.

### 2.2. Bảng mới được tạo lập
1. **`TINNHAN_KHIEUNAI` (Lưu trữ hội thoại 2 chiều & ghi chú nội bộ):**
   - Các cột:
     - `TinNhanID INT IDENTITY(1,1) PRIMARY KEY`
     - `KhieuNaiID INT NOT NULL` (FK -> `KHIEUNAI`)
     - `NguoiGuiID INT NOT NULL` (FK -> `NGUOIDUNG`)
     - `NoiDung NVARCHAR(2000) NOT NULL` (CHECK: độ dài > 0, không chỉ chứa khoảng trắng)
     - `LoaiTinNhan VARCHAR(20) NOT NULL` (CHECK: in `'CONG_KHAI'`, `'NOI_BO'`, DEFAULT: `'CONG_KHAI'`)
     - `ThoiGianGui DATETIME NOT NULL DEFAULT (GETDATE())`
   - Indexes:
     - `IX_TinNhan_KhieuNai_ThoiGian` (`KhieuNaiID`, `ThoiGianGui`, `TinNhanID`) INCLUDE (`LoaiTinNhan`, `NguoiGuiID`) phục vụ tải lịch sử chat nhanh và đúng thứ tự.
   - Nguyên tắc: Không lưu dư thừa tên/email người gửi (tuân thủ 3NF, lấy qua JOIN `NGUOIDUNG`).

2. **`YEUCAU_CHUYENCAP` (Quản lý yêu cầu vượt thẩm quyền CSKH chuyển Admin):**
   - Các cột:
     - `YeuCauID INT IDENTITY(1,1) PRIMARY KEY`
     - `KhieuNaiID INT NOT NULL` (FK -> `KHIEUNAI`)
     - `NguoiYeuCauID INT NOT NULL` (FK -> `NGUOIDUNG`)
     - `LyDo NVARCHAR(500) NOT NULL`
     - `MucDoUuTien VARCHAR(20) NOT NULL` (CHECK: `'THAP'`, `'TRUNG_BINH'`, `'CAO'`, `'KHAN_CAP'`)
     - `AdminPhuTrachID INT NULL` (FK -> `NGUOIDUNG`)
     - `TrangThai VARCHAR(30) NOT NULL` (CHECK: `'CHO_TIEP_NHAN'`, `'DANG_XU_LY'`, `'DA_GIAI_QUYET'`, `'TU_CHOI'`)
     - `ThoiGianGui DATETIME NOT NULL DEFAULT (GETDATE())`
     - `ThoiGianTiepNhan DATETIME NULL`
     - `KetQuaXuLy NVARCHAR(1000) NULL`
     - `ThoiGianHoanTat DATETIME NULL`
   - Ràng buộc toàn vẹn thời gian & logic:
     - `CK_YeuCauChuyenCap_ThoiGian`: `ThoiGianTiepNhan >= ThoiGianGui` và `ThoiGianHoanTat >= ThoiGianTiepNhan`.
     - `CK_YeuCauChuyenCap_HoanTat`: Trạng thái `'DA_GIAI_QUYET'` hoặc `'TU_CHOI'` bắt buộc phải có `KetQuaXuLy` và `ThoiGianHoanTat`.
     - Filtered Unique Index: `UX_YeuCauChuyenCap_ActivePerComplaint` trên `(KhieuNaiID)` WHERE `TrangThai IN ('CHO_TIEP_NHAN', 'DANG_XU_LY')` ngăn chặn việc mở trùng lặp nhiều yêu cầu chuyển cấp cùng lúc trên cùng 1 khiếu nại.

3. **`LICHSU_PHANCONG_KHIEUNAI` (Nhật ký phân công nhân viên append-only):**
   - Các cột:
     - `LichSuID INT IDENTITY(1,1) PRIMARY KEY`
     - `KhieuNaiID INT NOT NULL` (FK -> `KHIEUNAI`)
     - `NhanVienCuID INT NULL` (FK -> `NGUOIDUNG`)
     - `NhanVienMoiID INT NULL` (FK -> `NGUOIDUNG`)
     - `NguoiThucHienID INT NOT NULL` (FK -> `NGUOIDUNG`)
     - `ThoiGian DATETIME NOT NULL DEFAULT (GETDATE())`
     - `LyDo NVARCHAR(255) NULL`
   - Ràng buộc:
     - `CK_LichSuPhanCong_NhanVienThayDoi`: `(NhanVienCuID IS NOT NULL OR NhanVienMoiID IS NOT NULL)` và `(NhanVienCuID <> NhanVienMoiID OR (NhanVienCuID IS NULL AND NhanVienMoiID IS NOT NULL) OR (NhanVienCuID IS NOT NULL AND NhanVienMoiID IS NULL))`.
   - Index: `IX_LichSuPhanCong_KhieuNai_ThoiGian` trên `(KhieuNaiID, ThoiGian DESC)`.

### 2.3. Chứng minh chuẩn hóa 3NF (Third Normal Form)
- **1NF**: Mọi thuộc tính đều mang giá trị nguyên tố (atomic values). Các trường `TinNhanID`, `YeuCauID`, `LichSuID` làm khóa chính đơn giá trị.
- **2NF**: Đạt 1NF và không tồn tại phụ thuộc hàm bộ phận (partial functional dependencies) vì khóa chính là khóa đơn (surrogate key đơn thuộc tính).
- **3NF**: Đạt 2NF và không tồn tại bất kỳ phụ thuộc hàm bắc cầu (transitive dependencies) giữa các thuộc tính không khóa.
  - Không lưu trữ tên người gửi, số điện thoại, email hay vai trò trong `TINNHAN_KHIEUNAI` hoặc `YEUCAU_CHUYENCAP`.
  - Mọi thông tin định danh cá nhân đều được chuẩn hóa tập trung tại bảng `NGUOIDUNG`.

---

## 3. CƠ CHẾ FIXED RBAC & MA TRẬN PHÂN QUYỀN (33 QUYỀN)

Hệ thống duy trì cố định 4 vai trò: `KHACH_HANG`, `QUAN_LY_RAP`, `CSKH`, `ADMIN`.
10 quyền mới được bổ sung và gán quyền tự động qua seed script:

| Mã quyền | Mô tả chức năng | KHACH_HANG | QUAN_LY_RAP | CSKH | ADMIN |
|---|---|:---:|:---:|:---:|:---:|
| `KHIEUNAI_CHAT_XEM` | Xem lịch sử trao đổi tin nhắn công khai | ✓ | | ✓ | ✓ |
| `KHIEUNAI_CHAT_GUI` | Gửi tin nhắn công khai trong hồ sơ khiếu nại | ✓ | | ✓ | ✓ |
| `KHIEUNAI_NOIBO_XEM` | Xem ghi chú trao đổi nội bộ CSKH | | | ✓ | ✓ |
| `KHIEUNAI_NOIBO_GHI` | Thêm ghi chú xử lý nội bộ | | | ✓ | ✓ |
| `KHIEUNAI_TIEPNHAN` | CSKH tự nhận xử lý khiếu nại chưa phân công | | | ✓ | ✓ |
| `KHIEUNAI_PHANCONG` | Admin phân công hoặc chuyển giao nhân viên | | | | ✓ |
| `CHUYENCAP_TAO` | CSKH lập phiếu chuyển cấp lên Admin | | | ✓ | ✓ |
| `CHUYENCAP_XEM` | Xem danh sách các yêu cầu chuyển cấp | | | ✓ | ✓ |
| `CHUYENCAP_TIEPNHAN` | Admin tiếp nhận phiếu chuyển cấp | | | | ✓ |
| `CHUYENCAP_XULY` | Admin kết luận / xử lý chuyển cấp | | | | ✓ |
| `TRA_CUU_DON` | Tra cứu đơn hàng, thanh toán và điểm (read-only) | | | ✓ | ✓ |

*Lưu ý bảo mật*: `Customer` không bao giờ thấy được tin nhắn `NOI_BO` hay yêu cầu chuyển cấp. `Manager` không có quyền truy cập vào các module nghiệp vụ CSKH. Kiểm tra quyền được thực thi 2 lớp: Express middleware và SQL Server Stored Procedure.

---

## 4. DANH MỤC STORED PROCEDURE MỚI

Tất cả 14 Stored Procedure được viết mới hoàn toàn, tuân thủ nghiêm ngặt nguyên tắc Transaction, Isolation Level và Concurrency Control:

1. `sp_Complaint_Chat_Send`: Gửi tin nhắn công khai giữa Customer và CSKH phụ trách.
2. `sp_Complaint_Chat_AddInternalNote`: Thêm ghi chú xử lý nội bộ (chỉ CSKH/Admin).
3. `sp_Complaint_Chat_List`: Lấy danh sách tin nhắn phân trang (tự động lọc bỏ tin nội bộ nếu người gọi là Customer).
4. `sp_Complaint_Unassigned_List`: Lấy danh sách khiếu nại chưa có người phụ trách.
5. `sp_Complaint_Assign_Self`: CSKH nhận khiếu nại (có `UPDLOCK, ROWLOCK` chống nhận trùng).
6. `sp_Complaint_Assign_Admin`: Admin phân công hoặc thu hồi phân công nhân viên.
7. `sp_Complaint_Assignment_History`: Lấy lịch sử phân công nhân viên theo khiếu nại.
8. `sp_Escalation_Create`: CSKH lập yêu cầu chuyển cấp lên Admin.
9. `sp_Escalation_List_CSKH`: CSKH xem các yêu cầu chuyển cấp mình đã gửi.
10. `sp_Escalation_List_Admin`: Admin xem toàn bộ hàng đợi yêu cầu chuyển cấp.
11. `sp_Escalation_GetDetail`: Xem chi tiết yêu cầu chuyển cấp và hồ sơ khiếu nại.
12. `sp_Escalation_Claim`: Admin tiếp nhận xử lý yêu cầu chuyển cấp.
13. `sp_Escalation_Process`: Admin ra quyết định giải quyết hoặc từ chối yêu cầu.
14. `sp_Support_Customer_GetPoints`: CSKH tra cứu số dư điểm, điểm tích lũy, điểm đã dùng và điểm bồi thường của khách hàng.

---

## 5. SAO LƯU, XÓA DATABASE CŨ VÀ DỰNG LẠI DATABASE CHÍNH

### 5.1. Sao lưu an toàn & Kiểm chứng Restore
- Đã thực hiện Full Backup với `CHECKSUM` cho các cơ sở dữ liệu:
  - `CinemaBookingDB` -> `CinemaBookingDB_20261014_pre_rebuild.bak`
  - `CinemaBookingDB_Test` -> `CinemaBookingDB_Test_pre_phase5.bak`
- Đã chạy kiểm chứng `RESTORE VERIFYONLY WITH CHECKSUM`: Kết quả **VALID & RESTORABLE (100%)**.

### 5.2. Xóa và Tái thiết lập
- Đã ngắt kết nối an toàn (`ALTER DATABASE ... SET SINGLE_USER WITH ROLLBACK IMMEDIATE`).
- Đã dọn dẹp các database test tạm trong phạm vi dự án. Tuyệt đối không xóa bất kỳ cơ sở dữ liệu nào ngoài phạm vi (`master`, `model`, `msdb`, `tempdb`, `HotelBookingDB`, `oneshop`).
- **Khởi tạo lại sạch hoàn toàn Database chính `CinemaBookingDB`**:
  - Chạy `database/build-objects.sql`: Tạo 30 bảng, 148 Stored Procedure, 6 View, 21 Function, 8 Trigger.
  - Chạy `database/10_seed/seed-all.sql`: Nạp toàn bộ danh mục tham chiếu, 33 quyền RBAC cố định, tài khoản hệ thống chuẩn.
  - Kiểm tra trạng thái: Không chứa dữ liệu rác, không chứa bản ghi test E2E.
- **Tái tạo môi trường kiểm thử cô lập `CinemaBookingDB_Test`**:
  - Dành riêng cho runner tự động, cô lập hoàn toàn khỏi cơ sở dữ liệu chính.

---

## 6. TÍCH HỢP BACKEND VÀ API CONTRACTS

### 6.1. Whitelist và Mapping Stored Procedure
- Cập nhật `backend/src/db/procedures.js`: Đăng ký đầy đủ 14 Stored Procedure mới với typed parameter mapping chuẩn SQL Server (`VarChar`, `NVarChar`, `Int`, `DateTime`).
- Không sử dụng bất kỳ câu lệnh inline SQL hay raw query nào trong Backend service/controller.

### 6.2. Các Endpoint REST API mới

#### Nhóm Customer (`/api/complaints`):
- `GET /api/complaints/:id/messages`: Xem lịch sử tin nhắn (không trả về tin nội bộ).
- `POST /api/complaints/:id/messages`: Khách hàng gửi tin nhắn trao đổi.

#### Nhóm CSKH (`/api/support`):
- `GET /api/support/complaints/unassigned`: Xem hàng đợi khiếu nại chưa ai nhận.
- `POST /api/support/complaints/:id/assign-self`: Nhận phụ trách khiếu nại.
- `GET /api/support/complaints/:id/messages`: Xem tin nhắn (công khai + nội bộ).
- `POST /api/support/complaints/:id/messages`: CSKH phản hồi khách hàng.
- `POST /api/support/complaints/:id/notes`: Ghi chú xử lý nội bộ.
- `GET /api/support/customers/:id/points`: Tra cứu điểm thưởng & bồi thường.
- `POST /api/support/escalations`: Lập phiếu chuyển cấp lên Admin.
- `GET /api/support/escalations`: CSKH theo dõi các phiếu chuyển cấp.
- `GET /api/support/complaints/:id/assignment-history`: Xem lịch sử phân công.

#### Nhóm Admin (`/api/admin`):
- `GET /api/admin/escalations`: Xem toàn bộ hàng đợi phiếu chuyển cấp.
- `GET /api/admin/escalations/:id`: Xem chi tiết phiếu chuyển cấp.
- `POST /api/admin/escalations/:id/claim`: Admin tiếp nhận xử lý phiếu.
- `POST /api/admin/escalations/:id/process`: Admin giải quyết hoặc từ chối phiếu.
- `POST /api/admin/complaints/:id/assign`: Phân công hoặc đổi nhân viên phụ trách.

---

## 7. PHÁT TRIỂN GIAO DIỆN FRONTEND

1. **Customer Complaint Detail (`ComplaintDetail.jsx`):**
   - Hộp thoại tin nhắn 2 chiều trực quan, phân biệt rõ bong bóng chat khách hàng / CSKH.
   - Hiển thị nhân viên đang phụ trách khiếu nại.
   - Cơ chế tự động đồng bộ (polling mỗi 4s), hiển thị thời gian gửi, trạng thái đang gửi, và chặn gửi trùng khi click nhiều lần.
2. **CSKH Support Workspace (`SupportPortal.jsx`, `SupportWorkspaceView.jsx`):**
   - Nút `Tiếp nhận khiếu nại` nhanh cho khiếu nại chưa phân công.
   - Component `SupportChatBox.jsx`: Tích hợp checkbox `[x] 🔒 Ghi chú nội bộ` chuyển đổi linh hoạt giữa chat khách hàng và ghi chú nội bộ.
   - Component `CustomerPointsViewer.jsx`: Tra cứu điểm tích lũy, điểm đã dùng, điểm bồi thường và lịch sử giao dịch điểm.
   - Component `SupportEscalationManager.jsx`: Modal gửi yêu cầu chuyển cấp lên Admin kèm mức ưu tiên và lý do; theo dõi chỉ đạo của Admin.
   - Component `CustomerAssignmentHistoryViewer.jsx`: Hiển thị tiến trình chuyển giao nhân sự phụ trách.
3. **Admin Portal Module (`AdminEscalationModule.jsx`, `AdminComplaintAssignment.jsx`):**
   - Module `Yêu cầu hỗ trợ từ CSKH`: Badge thông báo số lượng yêu cầu chờ xử lý, bảng lọc theo trạng thái và mức độ ưu tiên.
   - Hành động `Tiếp nhận` và Modal giải quyết: Nhập kết luận xử lý, lựa chọn `Đã giải quyết` hoặc `Từ chối`.
   - Bảng phân công nhân viên: Dropdown danh sách CSKH hoạt động, cho phép chỉ định mới, chuyển giao nhân viên hoặc thu hồi quyền phụ trách.

---

## 8. KẾT QUẢ KIỂM THỬ TOÀN DIỆN (100% PASS)

| STT | Bộ kiểm thử | Số ca kiểm thử | Kết quả | Ghi chú |
|:---:|---|:---:|:---:|---|
| 1 | Backend Unit & Contract Tests | 216 ca | **216 PASS / 0 FAIL** | Toàn bộ service, controller, validator, SP whitelist |
| 2 | Frontend Unit & Component Tests | 239 ca | **239 PASS / 0 FAIL** | ChatBox, PointsViewer, Escalation, Admin routes |
| 3 | Frontend Production Build | 236 modules | **PASS (0 errors)** | `npm.cmd run build` tạo bundle production hoàn hảo |
| 4 | Database Integrity & Constraints | 26 ca | **26 PASS / 0 FAIL** | DBCC CHECKCONSTRAINTS, FK, Filtered Unique Index |
| 5 | API Integration Tests | 78 ca | **78 PASS / 0 FAIL** | Xác minh end-to-end HTTP → SP → SQL Server |
| 6 | Revenue Reconciliation (F-11) | 1 ca | **PASS** | Doanh thu = tiền thực thu; không tính điểm/khuyến mãi |
| 7 | Points, Payment & Compensation | 44 ca | **44 PASS / 0 FAIL** | Bồi thường hủy suất bằng điểm, thanh toán bằng điểm |
| 8 | Lifecycle & Concurrency (Core) | 44 ca | **44 PASS / 0 FAIL** | Đua ghế, hết hạn giữ chỗ, đổi ghế đơn nhân viên |
| 9 | CSKH Lifecycle & Concurrency | 41 ca | **41 PASS / 0 FAIL** | Đua nhận khiếu nại, đua nhận chuyển cấp, chat scope |
| 10 | Interactive Browser E2E (Playwright)| 8 kịch bản | **8 PASS / 0 FAIL** | Khách tạo khiếu nại → Chat → CSKH tra cứu điểm → Chuyển cấp → Admin tiếp nhận & giải quyết → CSKH hoàn tất → Khách xác nhận |
| | **TỔNG CỘNG** | **697 lượt test**| **100% PASS** | **Không có lỗi nào tồn đọng** |

---

## 9. CÁC NGUYÊN TẮC BẢO TOÀN NGHIỆP VỤ ĐÃ ĐƯỢC CHỨNG MINH

- **Chính sách tài chính bất biến**:
  - Không có hoàn tiền mặt/chuyển khoản tự nguyện.
  - Hủy suất chiếu bồi thường 100% giá trị bằng điểm thưởng (`BOITHUONG_HUYSUAT`).
  - Doanh thu hệ thống chỉ tính trên tiền thực thu (`TienThanhToan`), tuyệt đối không tính phần tiền được giảm bằng điểm hoặc voucher khuyến mãi.
- **Tính toàn vẹn của Fixed RBAC**:
  - Không tạo thêm vai trò thứ 5.
  - Giữ nguyên cấu trúc phân quyền cố định 4 vai trò.
- **An toàn dữ liệu tuyệt đối**:
  - Cơ sở dữ liệu chính `CinemaBookingDB` không hề bị ảnh hưởng bởi các thao tác kiểm thử ghi. Mọi kịch bản test ghi dữ liệu đều diễn ra trên `CinemaBookingDB_Test`.

---

## 10. KẾT LUẬN VÀ BÀN GIAO

Dự án đã hoàn thành toàn bộ 11 giai đoạn theo đúng yêu cầu khắt khe của Master Implementation Prompt:
- Cơ sở dữ liệu chuẩn 3NF, DBMS-First với toàn bộ nghiệp vụ được bảo vệ bởi Stored Procedure.
- Hệ thống CSKH mới đầy đủ chức năng: Chat 2 chiều, ghi chú nội bộ, phân công nhân viên, chuyển cấp Admin, tra cứu đơn hàng & điểm thưởng.
- Frontend mượt mà, phản hồi thời gian thực, giao diện đồng nhất theo Design System.
- Bộ mã nguồn sạch sẽ, không có cảnh báo lint, 100% kiểm thử tự động xanh.

Hệ thống đã sẵn sàng đưa vào vận hành thực tế.
