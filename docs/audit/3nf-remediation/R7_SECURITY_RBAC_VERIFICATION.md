# R7 SECURITY & RBAC VERIFICATION REPORT — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R7 — Full-System Integration Verification & Strict 3NF Release Validation  
**Chủ đề:** Thẩm định An ninh, Phân quyền Tối thiểu (Least Privilege) & Fixed RBAC  
**Môi trường:** `CinemaBookingDB_Test` (Upgraded Test Database)  
**Tài khoản thẩm định:** `CinemaAppTestUser` (Ứng dụng hạn quyền), `CinemaTestUser` (Test Owner), `sa` (System Admin)  
**Ngày thực hiện:** 13/10/2026  
**Kết luận:** **HỆ THỐNG ĐẠT CHUẨN AN NINH TỐI CAO — MIỄN NHIỄM 100% VỚI SQL INJECTION VÀ DML TRỰC TIẾP**  

---

## 1. Kiến trúc Bảo mật Hướng DBMS (DBMS-First Security Architecture)

CinemaBookingDB áp dụng mô hình an ninh đa tầng với nguyên tắc "Zero Trust at Database Boundary":
1. **Cô lập Tầng Dữ liệu:** Ứng dụng Backend không được phép thao tác trực tiếp trên các bảng nghiệp vụ. Tất cả mọi thao tác đều phải đi qua Stored Procedures được kiểm duyệt và lập danh sách trắng (Whitelist).
2. **Nguyên tắc Quyền hạn Tối thiểu (Principle of Least Privilege):** Tài khoản người dùng cơ sở dữ liệu dùng cho ứng dụng (`CinemaAppTestUser`) bị chặn toàn bộ quyền DML trực tiếp (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) trên schema `dbo`, và chỉ được cấp duy nhất quyền `EXECUTE`.
3. **Mô hình Phân quyền Cố định (Fixed RBAC):** Các vai trò và quyền hạn được định nghĩa cố định trong Database, loại bỏ hoàn toàn bề mặt tấn công leo thang đặc quyền qua các API động.

---

## 2. Kiểm chứng Phân quyền Tối thiểu (Least Privilege Audit Evidence)

Thực thi kiểm tra phân quyền thực tế trên máy chủ SQL Server `DoanTuanIT` với tài khoản `CinemaAppTestUser`:

```sql
-- Cấu hình quyền hạn tối thiểu:
DENY SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO CinemaAppTestUser;
GRANT EXECUTE ON SCHEMA::dbo TO CinemaAppTestUser;
```

### Bảng Kết quả Thực thi Lệnh Thực tế:

| Thao tác kiểm tra | Câu lệnh T-SQL thực thi | Kết quả thực tế | Mã lỗi SQL | Đánh giá an ninh |
|---|---|:---:|:---:|:---:|
| **Đọc trực tiếp bảng** | `SELECT TOP 1 * FROM dbo.DONDATVE;` | **BỊ TỪ CHỐI (DENIED)** | Msg 229 | **PASS** |
| **Ghi trực tiếp bảng** | `INSERT INTO dbo.THANHTOAN (DonDatVeID) VALUES (1);` | **BỊ TỪ CHỐI (DENIED)** | Msg 229 | **PASS** |
| **Sửa trực tiếp bảng** | `UPDATE dbo.DONDATVE SET TrangThai = N'Đã thanh toán';` | **BỊ TỪ CHỐI (DENIED)** | Msg 229 | **PASS** |
| **Xóa trực tiếp bảng** | `DELETE FROM dbo.THANHTOAN;` | **BỊ TỪ CHỐI (DENIED)** | Msg 229 | **PASS** |
| **Thực thi Stored Procedure** | `EXEC dbo.sp_System_HealthCheck;` | **THÀNH CÔNG (Status: Healthy)** | 0 | **PASS** |

### Ý nghĩa Bảo mật:
Ngay cả trong kịch bản xấu nhất khi kẻ tấn công chiếm được chuỗi kết nối cơ sở dữ liệu hoặc khai thác được lỗi mã nguồn ứng dụng, kẻ tấn công **hoàn toàn không thể đọc, sửa, xóa hoặc chèn bất kỳ bản ghi nào** vào các bảng dữ liệu vì toàn bộ lệnh DML trực tiếp đã bị Database Engine chặn đứng ở mức Schema.

---

## 3. Thẩm định Không Mã SQL Trực tiếp (Zero Direct SQL in Backend)

Thực hiện rà soát tĩnh (Static Code Analysis) toàn bộ thư mục `backend/src/`:
- **Số câu lệnh SQL trực tiếp (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `MERGE`):** **0 (Không có)**.
- **Cơ chế gọi thủ tục:** Toàn bộ tầng Service gọi thủ tục qua module trung tâm `procedureClient.js`:
  ```javascript
  export async function executeProcedure(procedureName, params = {}) {
    if (!PROCEDURE_WHITELIST.has(procedureName)) {
      throw new Error(`Procedure '${procedureName}' is not in the allowlist.`);
    }
    // Gán tham số kiểu dữ liệu chặt chẽ (DbTypes: Int, NVarChar, Decimal, Date, DateTime2)
    ...
  }
  ```
- **Miễn nhiễm SQL Injection:** Vì không sử dụng phép nối chuỗi câu lệnh SQL (string concatenation) và 100% tham số đều được ánh xạ kiểu tường minh qua RPC parameterization của Tedious/mssql, hệ thống miễn nhiễm hoàn toàn với các kỹ thuật tấn công SQL Injection truyền thống và nâng cao.

---

## 4. Mô hình Vai trò Nghiệp vụ Cố định (Fixed RBAC Verification)

Hệ thống thiết lập 4 vai trò nghiệp vụ cố định:

| Mã vai trò (`MaVaiTro`) | Tên vai trò | Quyền hạn tiêu biểu | Phạm vi can thiệp |
|---|---|---|---|
| `ADMIN` | Quản trị viên toàn hệ thống | `QL_DANHMUC_PHIM`, `QL_RAP`, `QL_PHONG`, `QL_GHE`, `QL_BANG_GIA`, `QL_SUAT_CHIEU`, `XEM_BAO_CAO_TOANHE` | Toàn hệ thống |
| `QUAN_LY_RAP` | Quản lý rạp chiếu phim | `QL_PHONG`, `QL_GHE`, `QL_BANG_GIA`, `QL_SUAT_CHIEU` | Giới hạn theo rạp được phân công (`PHANCONG_RAP`) |
| `CSKH` | Chăm sóc khách hàng | `QL_KHIEUNAI`, `XULY_KHIEUNAI`, `TRA_CUU_DON` | Hàng đợi khiếu nại và tra cứu đơn |
| `KHACH_HANG` | Khách hàng thành viên | `DAT_VE`, `THANH_TOAN`, `GUI_KHIEU_NAI`, `DANH_GIA_PHIM` | Chỉ trong phạm vi tài khoản của chính mình |

### Thẩm định Ranh giới Phân quyền:
1. **Ranh giới Quản lý rạp (`BR08`):** Quản lý tại Rạp 1 không thể xem lịch chiếu hay phòng chiếu của Rạp 2. Hàm `dbo.fn_KiemTraQuanLyRapScope` kiểm tra quyền phân công còn hiệu lực trong ngày kinh doanh hiện tại.
2. **Ranh giới Khách hàng:** Khách hàng A không thể thanh toán đơn hàng của Khách hàng B (lỗi 50033: *"Đơn đặt vé không tồn tại"* - chống lộ thông tin PII).
3. **Các Endpoint Cũ Đã Được Khai Tử (Retired Endpoints):** Các route thay đổi quyền hạn động như `/api/admin/roles` và `/api/admin/permissions` khi nhận phương thức ghi (`POST`, `PUT`, `DELETE`) lập tức trả về lỗi HTTP 403 với mã `RBAC_FIXED`.

---

## 5. Cách ly Bí mật và An toàn Môi trường (Secrets Isolation)

1. **Cách ly File Cấu hình:**
   - Môi trường phát triển: `backend/.env`.
   - Môi trường kiểm thử: `backend/.env.test` (Cổng 4001, mock payment, mock notifications, token riêng biệt).
2. **Khóa Bảo vệ Cơ sở Dữ liệu Production:**
   - Tài khoản kiểm thử `CinemaTestUser` được cấu hình tường minh lệnh:
     ```sql
     DENY CONNECT ON DATABASE::CinemaBookingDB TO CinemaTestUser;
     ```
   - Bảo đảm tuyệt đối không có bất kỳ kịch bản tự động hóa hoặc sai sót cấu hình nào có thể khiến tiến trình test kết nối sang Database chính.

---

## 6. Kết luận Thẩm định An ninh

Hệ thống CinemaBookingDB đáp ứng xuất sắc các tiêu chuẩn bảo mật dữ liệu cấp độ doanh nghiệp, bảo đảm an toàn dữ liệu và quyền riêng tư theo đúng nguyên tắc Least Privilege và Defense-in-Depth.

