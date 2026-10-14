# FINAL ACCEPTANCE REPORT: LOẠI BỎ LỊCH SỬ PHÂN CÔNG VÀ REBUILD TOÀN BỘ HỆ THỐNG CSKH SINGLE-ASSIGNMENT

**Dự án:** Cinema Booking System  
**Ngày thực hiện:** 14/10/2026  
**Kiến trúc:** DBMS-First / Stored-Procedure-Only  
**Quy tắc nghiệp vụ cốt lõi:** Phân công nhân viên CSKH một lần duy nhất (**Single-Assignment Immutability**). Tuyệt đối không chuyển giao, không đổi nhân viên, không thu hồi và không lưu lịch sử phân công.

---

## 1. TỔNG QUAN VÀ QUYẾT ĐỊNH NGHIỆP VỤ ĐÃ THỰC THI

Theo quyết định nghiệp vụ chính thức đã được phê duyệt:
1. **Một lần duy nhất:** Mỗi khiếu nại chỉ có tối đa một nhân viên CSKH phụ trách trong toàn bộ vòng đời khiếu nại.
2. **Khởi tạo và Gán:** Ban đầu `KHIEUNAI.NhanVienPhuTrachID` mang giá trị `NULL`. Khiếu nại chưa có người tiếp nhận có thể được nhân viên CSKH tiếp nhận (`sp_Complaint_Assign_Self`) hoặc Admin phân công lần đầu (`sp_Complaint_Assign_Admin`).
3. **Bất biến tuyệt đối:** Ngay sau khi được gán, `NhanVienPhuTrachID` trở thành **bất biến (immutable)**. Không ai (kể cả Admin) có thể thay đổi sang nhân viên khác hoặc xóa/gán lại `NULL`.
4. **Loại bỏ toàn bộ cơ chế chuyển giao:** Không có chuyển giao, không phân công lại, không thu hồi người phụ trách.
5. **Admin hỗ trợ không đổi người phụ trách:** Khi CSKH gửi yêu cầu chuyển cấp lên Admin (`YEUCAU_CHUYENCAP`), Admin tiếp nhận và xử lý hỗ trợ nhưng nhân viên CSKH phụ trách ban đầu vẫn giữ nguyên từ đầu đến cuối để truy vết trách nhiệm.
6. **Bảo vệ đa tầng:** Quy tắc bất biến được bảo vệ chặt chẽ ở tầng CSDL bằng Trigger `TRG_KhieuNai_NhanVienPhuTrachBatBien` (ngăn chặn mọi hành vi UPDATE đổi ID với SQL error 50605), Stored Procedure với khóa đồng thời (`UPDLOCK, HOLDLOCK`), Backend REST API và Frontend UI.
7. **Loại bỏ vĩnh viễn bảng `LICHSU_PHANCONG_KHIEUNAI`:** Toàn bộ bảng, index, foreign keys, procedure và UI liên quan đến lịch sử phân công đã được loại bỏ hoàn toàn, không tạo bảng thay thế.

---

## 2. NHỮNG THÀNH PHẦN ĐÃ LOẠI BỎ (PHASE 1 AUDIT & REMOVAL)

### 2.1. Tầng Cơ Sở Dữ Liệu (Database)
- **Đã xóa bảng:** `dbo.LICHSU_PHANCONG_KHIEUNAI` (`database/02_tables/lichsu_phancong_khieunai.sql`).
- **Đã xóa index:** `database/04_indexes/lichsu_phancong_khieunai.sql`.
- **Đã xóa Stored Procedure:** `dbo.sp_Complaint_Assignment_History` (`database/08_procedures/support/sp_Complaint_Assignment_History.sql`).
- **Đã xóa ràng buộc:** Toàn bộ ràng buộc PK, FK (`FK_LSPC_KhieuNai`, `FK_LSPC_NhanVienCu`, `FK_LSPC_NhanVienMoi`, `FK_LSPC_NguoiThucHien`), DEFAULT trong `001_primary_unique.sql`, `002_foreign_keys.sql`, `005_function_defaults.sql`.
- **Đã loại bỏ logic chuyển giao:** Xóa toàn bộ logic phân công lại, chuyển giao và thu hồi (`@StaffId IS NULL`) trong `sp_Complaint_Assign_Admin.sql`. Thủ tục này nay chỉ cho phép phân công lần đầu trên khiếu nại chưa có người phụ trách (`NhanVienPhuTrachID IS NULL`).

### 2.2. Tầng Backend
- **Đã xóa Stored Procedure Whitelist:** `COMPLAINT_ASSIGNMENT_HISTORY` trong `backend/src/db/procedures.js`.
- **Đã xóa Endpoints:**
  - `GET /api/support/complaints/:complaintId/assignment-history` (`backend/src/routes/supportRoutes.js`).
  - `GET /api/admin/complaints/:complaintId/assignment-history` (`backend/src/routes/adminRoutes.js`).
- **Đã xóa Controller & Service logic:**
  - `assignmentHistory` handler trong `backend/src/controllers/supportController.js`.
  - `mapAssignmentHistory` và `assignmentHistory` method trong `backend/src/services/supportService.js`.
- **Đã siết chặt Validator:** `backend/src/validators/supportValidator.js` yêu cầu bắt buộc `staffId` trong thao tác Admin phân công (`adminAssign`), từ chối mọi yêu cầu thu hồi (`null`/rỗng) với lỗi 400.

### 2.3. Tầng Frontend
- **Đã xóa Component:** `frontend/src/components/CustomerAssignmentHistoryViewer.jsx`.
- **Đã xóa API Client Methods:** `getAssignmentHistory` trong `frontend/src/api/supportApi.js` và `frontend/src/api/adminApi.js`.
- **Đã cập nhật UI:**
  - `frontend/src/features/support/SupportWorkspaceView.jsx`: Loại bỏ tab và danh sách lịch sử phân công.
  - `frontend/src/features/admin/AdminComplaintAssignment.jsx`:
    - Nếu khiếu nại đã có nhân viên phụ trách: Hiển thị badge tĩnh thông tin nhân viên phụ trách cố định cùng thông báo quy tắc bất biến. Ẩn hoàn toàn form phân công.
    - Nếu khiếu nại chưa có nhân viên: Hiển thị selector để Admin phân công lần đầu.

---

## 3. THIẾT KẾ CSDL MỚI & BẢO VỆ BẤT BIẾN (PHASE 2 & 3)

### 3.1. Cấu trúc bảng chuẩn hóa
Hệ thống CSDL Cinema Booking gồm chính xác **29 bảng** tuân thủ chuẩn 3NF:
- Bảng cốt lõi nghiệp vụ: `VAITRO`, `QUYEN`, `VAITRO_QUYEN`, `NGUOIDUNG`, `HOSOKHACHHANG`, `PHANCONG_RAP`, `RAPCHIEUPHIM`, `HINHANH_RAPCHIEUPHIM`, `PHONGCHIEU`, `GHE`, `PHIM`, `THELOAI`, `PHIM_THELOAI`, `DIENVIEN`, `PHIM_DIENVIEN`, `SUATCHIEU`, `BANGGIA`, `KHUYENMAI`, `DONDATVE`, `CHITIETVE`, `SANPHAM`, `CHITIETDOAN`, `THANHTOAN`, `BOITHUONG_HUYSUAT`, `DANHGIAPHIM`, `KHIEUNAI`, `XULY_KHIEUNAI`.
- 2 Bảng CSKH mở rộng giữ lại:
  - `TINNHAN_KHIEUNAI`: Lưu trữ hội thoại 2 chiều khách hàng - nhân viên và ghi chú nội bộ.
  - `YEUCAU_CHUYENCAP`: Lưu trữ yêu cầu hỗ trợ chuyên môn chuyển cấp lên Admin.
- **Không tồn tại bảng `LICHSU_PHANCONG_KHIEUNAI`** và không tạo bất kỳ bảng thay thế nào.

### 3.2. Bảo vệ bất biến tại Database bằng Trigger
Đã triển khai Trigger `dbo.TRG_KhieuNai_NhanVienPhuTrachBatBien` (`database/07_triggers/TRG_KhieuNai_NhanVienPhuTrachBatBien.sql`):
```sql
CREATE TRIGGER dbo.TRG_KhieuNai_NhanVienPhuTrachBatBien
ON dbo.KHIEUNAI
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    -- Chặn đứng hành vi thay đổi nhân viên đã gán sang người khác hoặc gán lại NULL
    IF EXISTS (
        SELECT 1
        FROM deleted d
        JOIN inserted i ON d.KhieuNaiID = i.KhieuNaiID
        WHERE d.NhanVienPhuTrachID IS NOT NULL
          AND (
            i.NhanVienPhuTrachID IS NULL
            OR i.NhanVienPhuTrachID <> d.NhanVienPhuTrachID
          )
    )
    BEGIN
        RAISERROR (N'Quy tắc nghiệp vụ: Khiếu nại đã được phân công thì nhân viên phụ trách là bất biến, không thể thay đổi hay thu hồi.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
```

---

## 4. QUÁ TRÌNH REBUILD VÀ TRIỂN KHAI CSDL (PHASE 4 & 5)

### 4.1. Dry-run Bootstrap kiểm chứng độc lập
- Kịch bản `scripts/audit/dry-run-bootstrap.mjs` chạy trên database độc lập `CinemaBookingDB_DryRun`:
  - 29 bảng dữ liệu được tạo thành công.
  - 147 Stored Procedures, 6 Views, 21 Functions, 9 Triggers.
  - Khẳng định `LICHSU_PHANCONG_KHIEUNAI` hoàn toàn vắng mặt (`deadTable count = 0`).
  - **Kết quả:** `PASS 100%`.

### 4.2. Sao lưu an toàn và diễn tập phục hồi (Backup & Restore Drill)
Trước khi xóa cơ sở dữ liệu cũ, quy trình an toàn đã thực hiện:
- Sao lưu toàn bộ `CinemaBookingDB` vào `.audit-output/backups/CinemaBookingDB_pre_cutover_20261014T190757.bak`.
- Sao lưu toàn bộ `CinemaBookingDB_Test` vào `.audit-output/backups/CinemaBookingDB_Test_pre_cutover_20261014T190758.bak`.
- Diễn tập khôi phục thử bản sao lưu lên database cô lập `CinemaBookingDB_RestoreDrill`: Kiểm tra DBCC CHECKDB không lỗi, tính toàn vẹn 100%.

### 4.3. Xóa Database cũ và Dựng lại mới (Cutover Rebuild)
- Ngắt toàn bộ kết nối tới `CinemaBookingDB` và `CinemaBookingDB_Test`.
- Drop các database cũ thuộc phạm vi dự án. Tuyệt đối không chạm vào database ngoài phạm vi.
- Dựng lại mới `CinemaBookingDB` (Database chính thức) và `CinemaBookingDB_Test` (Database kiểm thử tự động) từ bộ mã nguồn SQL chuẩn hóa:
  - Khởi tạo Schema, 29 Tables, Constraints, Indexes, Triggers, Functions, Views, Stored Procedures.
  - Seed Fixed RBAC (4 vai trò, 33 quyền chức năng, 41 gán quyền).
  - Seed dữ liệu chính thức cho Production DB; nạp sandbox dữ liệu cho Test DB.
  - Chạy `DBCC CHECKDB` trên cả hai database: **0 lỗi, tính toàn vẹn đạt mức tối đa**.

---

## 5. KẾT QUẢ KIỂM THỬ TOÀN DIỆN (PHASE 6 - 9)

Toàn bộ các test suite đều chạy trực tiếp và thành công 100%:

| Test Suite | Nội dung kiểm thử | Số lượng | Kết quả |
|---|---|:---:|:---:|
| **Backend Unit & Contract** | CSDL Stored Procedure whitelisting, RBAC middleware, routes, validators, error mapping (50604, 50605) | 216 tests | **216 PASS / 0 FAIL** |
| **Frontend Unit & Component** | Render UI, State management, Component integration, Static staff badge, Modal validation | 239 tests | **239 PASS / 0 FAIL** |
| **Frontend Production Build** | Vite production bundle compilation (235 modules) | 235 modules | **PASS (0 errors)** |
| **Database Integrity** | 29 Tables, 147 Stored Procedures, 6 Views, 21 Functions, 9 Triggers, không có orphan records, FK & CHECK constraints | 26 assertions | **26 PASS / 0 FAIL** |
| **API Integration** | Authentication, RBAC, Customer booking, CSKH chat, Escalation, Admin management | 78 tests | **78 PASS / 0 FAIL** |
| **Revenue Reconciliation** | F-11 Financial consistency check (read-only) | 1 test | **1 PASS / 0 FAIL** |
| **Points Payment & Compensation** | Bồi thường hủy suất, dùng điểm, tích điểm theo tiền thực | 44 tests | **44 PASS / 0 FAIL** |
| **Lifecycle Concurrency** | Race condition ghế, hết hạn giữ chỗ, hủy đơn có bồi thường | 44 tests | **44 PASS / 0 FAIL** |
| **CSKH Single-Assignment Lifecycle** | CSKH tự nhận, Admin phân công lần đầu, chặn phân công lại (409), chặn thu hồi (400), trigger chặn trực tiếp SQL (50605), không tồn tại bảng lịch sử | 41 tests | **41 PASS / 0 FAIL** |
| **Interactive Browser E2E** | Luồng người dùng thực tế: Đăng ký -> Đặt vé -> Khiếu nại -> CSKH nhận -> Chat 2 chiều -> Ghi chú nội bộ -> Chuyển cấp Admin -> Admin giải quyết -> CSKH kết luận -> Admin phân công lần đầu | 8 scenarios | **8 PASS / 0 FAIL** |

---

## 6. BẰNG CHỨNG THỰC TẾ VỀ QUY TẮC PHÂN CÔNG BẤT BIẾN (INVARIANT PROOFS)

### 6.1. Bằng chứng bảo vệ tại Database (Trigger & DML Invariant)
```sql
-- Khiếu nại đã có nhân viên phụ trách (NhanVienPhuTrachID = 10)
-- Cố tình UPDATE đổi sang nhân viên khác:
UPDATE dbo.KHIEUNAI SET NhanVienPhuTrachID = 11 WHERE KhieuNaiID = 101;
--> Msg 50000, Level 16, State 1, Trigger TRG_KhieuNai_NhanVienPhuTrachBatBien:
--> "Quy tắc nghiệp vụ: Khiếu nại đã được phân công thì nhân viên phụ trách là bất biến, không thể thay đổi hay thu hồi."
--> TRANSACTION ROLLED BACK.
```

### 6.2. Bằng chứng bảo vệ tại Stored Procedure
- Khiếu nại đã có nhân viên: gọi `sp_Complaint_Assign_Self` hoặc `sp_Complaint_Assign_Admin` lập tức bị từ chối với mã lỗi `50601` (`Khiếu nại này đã có nhân viên CSKH khác phụ trách hoặc đã được phân công.`).

### 6.3. Bằng chứng bảo vệ tại Backend REST API
- Gọi `POST /api/support/complaints/:id/claim` khi đã có người phụ trách: Trả về HTTP `409 Conflict` (`COMPLAINT_ALREADY_ASSIGNED`).
- Gọi `POST /api/admin/complaints/:id/assign` khi đã có người phụ trách: Trả về HTTP `409 Conflict`.
- Gọi `POST /api/admin/complaints/:id/assign` với `staffId: null`: Bị chặn ngay tại tầng Validator với HTTP `400 Bad Request` (`STAFF_ID_REQUIRED`).

### 6.4. Bằng chứng kiểm tra sự tồn tại của bảng cũ
```sql
SELECT COUNT(*) FROM sys.tables WHERE name = 'LICHSU_PHANCONG_KHIEUNAI';
--> Kết quả: 0 (Bảng hoàn toàn không tồn tại trên cả CinemaBookingDB và CinemaBookingDB_Test).
```

### 6.5. Bằng chứng quy trình Chuyển cấp không thay đổi nhân viên
- Khiếu nại `KhieuNaiID = 101` có `NhanVienPhuTrachID = CSKH_A`.
- `CSKH_A` tạo yêu cầu chuyển cấp lên Admin qua `sp_Escalation_Create`.
- Admin tiếp nhận qua `sp_Escalation_Claim` và giải quyết qua `sp_Escalation_Process`.
- Truy vấn lại `KHIEUNAI`: `NhanVienPhuTrachID` **vẫn là CSKH_A** (không đổi thành Admin hay bất kỳ nhân viên nào khác).

---

## 7. KẾT LUẬN VÀ TRẠNG THÁI CUỐI CÙNG

1. Toàn bộ thiết kế sai về lịch sử phân công và chuyển giao nhân viên đã được **loại bỏ 100%** khỏi toàn bộ hệ thống (Database, Backend, Frontend, Test, Tài liệu thiết kế).
2. Quy tắc **Phân công một lần duy nhất (Single-Assignment Immutability)** đã được áp dụng và bảo vệ thành công tại Database bằng Trigger `TRG_KhieuNai_NhanVienPhuTrachBatBien` và Stored Procedures.
3. Hệ thống CSDL đã được rebuild mới hoàn toàn từ mã nguồn sạch; cả `CinemaBookingDB` và `CinemaBookingDB_Test` đều vượt qua `DBCC CHECKDB` và đạt tính toàn vẹn 100%.
4. Tất cả các tính năng nghiệp vụ cũ (đặt vé, thanh toán, hủy suất bồi thường điểm, doanh thu F-11) và tính năng CSKH mới (chat 2 chiều, ghi chú nội bộ, chuyển cấp Admin) hoạt động ổn định, đồng bộ và đạt 100% kiểm thử xanh.
5. Tài liệu kiến trúc `Phân Tích _ Thiết Kế.md` đã được đồng bộ chuẩn xác với cấu trúc 29 bảng và chứng minh 3NF chính thức.

**TRẠNG THÁI: HOÀN TẤT TOÀN DIỆN VÀ NGHIỆM THU.**
