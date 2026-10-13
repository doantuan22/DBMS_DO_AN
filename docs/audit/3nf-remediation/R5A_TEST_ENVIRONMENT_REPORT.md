# BÁO CÁO THỰC THI KHỞI TẠO MÔI TRƯỜNG TEST (PHASE R5-A EXECUTION REPORT)
## DỰ ÁN: CinemaBookingDB — STRICT 3NF NORMALIZATION

- **Cơ quan thẩm định:** Senior SQL Server DBA, Database Reliability Engineer & Migration Specialist
- **Thời gian thực hiện:** 13/10/2026
- **Trạng thái:**
  - Gate A / Gate B: **APPROVED**
  - R5-A Provisioning Execution: **COMPLETED & VERIFIED PASS**
  - Production Gate C: **STRICTLY NOT APPROVED**
  - R5-B Migration Execution: **WAITING FOR SEPARATE APPROVAL**

---

## 1. THÔNG SỐ KHẢO SÁT HẠ TẦNG VÀ TIỀN KIỂM (PREFLIGHT AUDIT)

| Thành phần | Thông số Khảo sát Thực tế | Trạng thái Kiểm định |
| :--- | :--- | :---: |
| **SQL Server Instance** | `DoanTuanIT` (MSSQLSERVER, Port `1433`) | **VERIFIED ONLINE** |
| **Version & Edition** | Microsoft SQL Server 2025 (`17.0.1000.7`, 64-bit), Developer Edition | **VERIFIED** |
| **Source Database** | `CinemaBookingDB` (ONLINE, FULL, 27 tables) | **100% UNTOUCHED** |
| **Target Database** | `CinemaBookingDB_Test` | **SUCCESSFULLY CREATED** |
| **Logical File Names (Data)** | `CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012` | **VERIFIED FROM BACKUP** |
| **Logical File Names (Log)** | `CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012_log` | **VERIFIED FROM BACKUP** |
| **Dung lượng Ổ đĩa** | Ổ `C:`: Trống 271,57 GB / Ổ `D:`: Trống 95,44 GB | **AMPLE CAPACITY** |

---

## 2. QUY TRÌNH THỰC THI BACKUP VÀ RESTORE CÔ LẬP

### 2.1 Bản sao lưu An toàn (COPY_ONLY Backup)
- Lệnh thực thi:
  ```sql
  BACKUP DATABASE [CinemaBookingDB]
  TO DISK = N'C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CinemaBookingDB_COPYONLY_20261013.bak'
  WITH COPY_ONLY, CHECKSUM, INIT, STATS = 10;
  ```
- **Kết quả:** Xử lý 1.578 pages trong 0,080 giây (154,052 MB/s). Chuỗi LSN của Production được bảo toàn tuyệt đối.

### 2.2 Kiểm tra Tính toàn vẹn (RESTORE VERIFYONLY)
- Lệnh thực thi:
  ```sql
  RESTORE VERIFYONLY
  FROM DISK = N'C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CinemaBookingDB_COPYONLY_20261013.bak'
  WITH CHECKSUM;
  ```
- **Kết quả:** `The backup set on file 1 is valid.`

### 2.3 Khôi phục sang `CinemaBookingDB_Test` với RESTORE MOVE
- Lệnh thực thi:
  ```sql
  RESTORE DATABASE [CinemaBookingDB_Test]
  FROM DISK = N'C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CinemaBookingDB_COPYONLY_20261013.bak'
  WITH 
      MOVE N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012' 
        TO N'C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\DATA\CinemaBookingDB_Test.mdf',
      MOVE N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012_log' 
        TO N'C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\DATA\CinemaBookingDB_Test_log.ldf',
      STATS = 10;
  ```
- **Kết quả:** Xử lý 1.578 pages trong 0,090 giây. Database `CinemaBookingDB_Test` chuyển trạng thái `ONLINE`. Không sử dụng `WITH REPLACE`.

---

## 3. NGHIỆM THU ĐỐI SOÁT DỮ LIỆU SAU KHỞI TẠO

So sánh trực tiếp giữa `CinemaBookingDB` và `CinemaBookingDB_Test`:

| Tiêu chí Đối soát | Production (`CinemaBookingDB`) | Test (`CinemaBookingDB_Test`) | Kết quả So sánh |
| :--- | :---: | :---: | :---: |
| **Database State** | ONLINE | ONLINE | **MATCH** |
| **Recovery Model** | FULL | FULL | **MATCH** |
| **Tổng số Bảng nghiệp vụ** | 27 | 27 | **100% IDENTICAL** |
| **Tổng số Payment Attempts** | 4 | 4 | **100% IDENTICAL** |
| **Số đơn hàng tham chiếu** | 3 | 3 | **100% IDENTICAL** |
| **Tổng số tiền thanh toán (Tất cả)** | 545.500,00 VNĐ | 545.500,00 VNĐ | **100% IDENTICAL** |
| **Doanh thu thành công** | 446.500,00 VNĐ | 446.500,00 VNĐ | **100% IDENTICAL** |
| **Giao dịch thất bại** | 99.000,00 VNĐ (1 attempt) | 99.000,00 VNĐ (1 attempt) | **100% IDENTICAL** |
| **Trạng thái Cột SoTien** | DECIMAL(18,2) NOT NULL | DECIMAL(18,2) NOT NULL | **MATCH PRE-MIGRATION** |
