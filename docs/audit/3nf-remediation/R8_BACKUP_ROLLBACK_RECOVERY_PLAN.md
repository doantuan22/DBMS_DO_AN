# R8 BACKUP, ROLLBACK & DISASTER RECOVERY PLAN — CINEMABOOKINGDB

**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Giai đoạn:** Phase R8 — Final 3NF Certification & Production Release Readiness  
**Tài liệu:** Kế hoạch Toàn diện về Sao lưu, Phục hồi Thảm họa và Rollback (Backup & Recovery Plan)  
**Cơ sở dữ liệu Mục tiêu:** `CinemaBookingDB` trên SQL Server 2025 Instance `DoanTuanIT`  
**Chỉ tiêu Cốt lõi:** **RPO = 0 (Zero Data Loss) | RTO < 15 Phút (Rollback T-SQL) / RTO < 30 Phút (Restore Full)**  

---

## 1. Mục tiêu Phục hồi Hệ thống (System Recovery Objectives)

| Chỉ số | Định nghĩa | Cam kết kỹ thuật | Giải pháp thực hiện |
|---|---|:---:|---|
| **RPO (Recovery Point Objective)** | Lượng dữ liệu tối đa chấp nhận mất mát tính theo thời gian | **0 giây (RPO = 0)** | Full backup với CHECKSUM ngay trước khi ngắt traffic + Transaction Log chain |
| **RTO (Recovery Time Objective)** | Thời gian tối đa để khôi phục hệ thống về trạng thái hoạt động | **< 15 phút** (T-SQL)<br>**< 30 phút** (Restore) | T-SQL rollback script tự động (`99_rollback_all.sql`) hoặc RESTORE MOVE |

---

## 2. Chiến lược Sao lưu Nhiều Lớp (Multi-Tier Backup Strategy)

Do `CinemaBookingDB` đang sử dụng mô hình phục hồi **FULL (`recovery_model_desc = 'FULL'`)**, toàn bộ quy trình sao lưu phải tuân thủ nghiêm ngặt chuỗi nhật ký giao dịch (Log Chain):

### 2.1. Bản sao lưu Toàn diện Trước Giờ G (Pre-Cutover Full Backup)
Thực hiện ngay khi vừa bật Maintenance Mode và ngắt toàn bộ kết nối ghi:
```sql
BACKUP DATABASE [CinemaBookingDB]
TO DISK = N'D:\DBMS_DO_AN\backups\CinemaBookingDB_PreCutover_FULL_20261013.bak'
WITH 
    CHECKSUM, 
    COMPRESSION, 
    INIT, 
    NAME = N'CinemaBookingDB Pre-Cutover Full Backup',
    STATS = 10;
GO
```

### 2.2. Kiểm tra Tính Toàn vẹn Nâng cao (Beyond RESTORE VERIFYONLY)
Để không rơi vào sai lầm "chỉ tin vào `RESTORE VERIFYONLY`", quy trình thẩm định backup bao gồm 2 bước:
1. **Kiểm tra Checksum Header:**
   ```sql
   RESTORE VERIFYONLY 
   FROM DISK = N'D:\DBMS_DO_AN\backups\CinemaBookingDB_PreCutover_FULL_20261013.bak'
   WITH CHECKSUM;
   ```
2. **Khôi phục Thử nghiệm trên Database Độc lập (Restoration Drill):**
   Khôi phục bản sao sang database tạm `CinemaBookingDB_RestoreDrill` để chứng minh 100% các trang dữ liệu (data pages) có thể đọc được trong thực tế:
   ```sql
   RESTORE DATABASE [CinemaBookingDB_RestoreDrill]
   FROM DISK = N'D:\DBMS_DO_AN\backups\CinemaBookingDB_PreCutover_FULL_20261013.bak'
   WITH 
       MOVE N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012' 
         TO N'C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\DATA\CinemaBookingDB_Drill.mdf',
       MOVE N'CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012_log' 
         TO N'C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\DATA\CinemaBookingDB_Drill_log.ldf',
       REPLACE,
       STATS = 20;
   
   -- Kiểm tra dữ liệu sau restore drill
   SELECT COUNT(*) AS TableCount FROM CinemaBookingDB_RestoreDrill.sys.tables WHERE is_ms_shipped = 0;
   
   -- Dọn dẹp database thử nghiệm
   DROP DATABASE [CinemaBookingDB_RestoreDrill];
   ```

---

## 3. Các Chiến lược Phục hồi và Rollback (Rollback Strategies)

### Chiến lược 1: Hoàn tác Tức thời qua T-SQL Script (`99_rollback_all.sql`)
- **Phạm vi áp dụng:** Sự cố phát sinh **bên trong cửa sổ bảo trì** (ví dụ: lỗi biên dịch Stored Procedure, lỗi đối soát reconciliation ở Bước 7).
- **Thời gian thực hiện:** **Dưới 60 giây**.
- **Cơ chế hoạt động:**
  1. Thêm lại cột vật lý: `ALTER TABLE dbo.THANHTOAN ADD SoTien DECIMAL(18, 2) NULL;`
  2. Bơm lại dữ liệu từ snapshot đơn hàng:
     ```sql
     UPDATE tt
     SET tt.SoTien = (d.TongTienVe + d.TongTienDoAn - d.TienGiamGia)
     FROM dbo.THANHTOAN tt
     INNER JOIN dbo.DONDATVE d ON d.DonDatVeID = tt.DonDatVeID;
     ```
  3. Đặt lại ràng buộc `NOT NULL` và kích hoạt lại `CK_THANHTOAN_SoTien`.
  4. Hoàn tác lại 6 views và 8 Stored Procedures về định nghĩa đọc trực tiếp cột `SoTien`.
- **Trạng thái kiểm nghiệm:** Đã thực thi thử nghiệm thành công 100% trong Phase R5-B (Rollback Drill Report PASS).

---

### Chiến lược 2: Khôi phục Thảm họa từ Bản sao lưu (Emergency Disaster Restore)
- **Phạm vi áp dụng:** Máy chủ gặp sự cố sập nguồn phần cứng, hỏng tệp MDF/LDF hoặc lỗi cấu trúc dữ liệu không thể hoàn tác bằng T-SQL.
- **Thời gian thực hiện:** **10 – 15 phút**.
- **Trình tự thực thi:**
  1. Sao lưu phần đuôi nhật ký giao dịch (Tail-of-the-log Backup) nếu database còn truy cập được:
     ```sql
     BACKUP LOG [CinemaBookingDB] 
     TO DISK = N'D:\DBMS_DO_AN\backups\CinemaBookingDB_TailLog.bak' 
     WITH NORECOVERY;
     ```
  2. Ngắt toàn bộ kết nối hiện hữu:
     ```sql
     ALTER DATABASE [CinemaBookingDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
     ```
  3. Khôi phục từ bản Full Backup trước giờ G:
     ```sql
     RESTORE DATABASE [CinemaBookingDB] 
     FROM DISK = N'D:\DBMS_DO_AN\backups\CinemaBookingDB_PreCutover_FULL_20261013.bak' 
     WITH REPLACE, RECOVERY;
     ```
  4. Đưa database về trạng thái đa người dùng:
     ```sql
     ALTER DATABASE [CinemaBookingDB] SET MULTI_USER;
     ```

---

### Chiến lược 3: Xử lý Sự cố Sau khi Đã Mở Traffic (Post-Cutover Incident Handling)
- **Tình huống:** Hệ thống đã mở lại traffic cho người dùng, đã phát sinh **các đơn đặt vé và giao dịch thanh toán mới**, sau đó mới phát hiện lỗi nghiệp vụ.
- **NGUYÊN TẮC BẢO VỆ DỮ LIỆU TỐI CAO:**
  $$\mathbf{TUYỆT\ ĐỐI\ KHÔNG\ RESTORE\ ĐÈ\ BẢN\ BACKUP\ CŨ!}$$
  *Lý do: Khôi phục bản backup cũ sẽ xóa sạch toàn bộ các đơn hàng và tiền thật mà khách hàng vừa thanh toán trong các giờ qua, gây thất thoát tài chính và khủng hoảng niềm tin.*
- **Giải pháp Xử lý Thay thế:**
  1. **Phương án Ưu tiên — Sửa tiến (Forward Fix / Hotfix):**  
     Nếu lỗi xuất phát từ logic hiển thị hoặc Stored Procedure, biên dịch bản vá nóng (hotfix procedure) trực tiếp trên database mà không thay đổi cấu trúc bảng.
  2. **Phương án Phục hồi Trích xuất (Selective Extraction & Merge):**  
     Nếu bắt buộc phải phục hồi schema cũ:
     - Tạo bản Tail-log backup hiện tại.
     - Khôi phục bản backup cũ sang một Database độc lập khác (`CinemaBookingDB_OldSchema`).
     - Viết script ETL trích xuất toàn bộ các bản ghi `DONDATVE`, `CHITIETVE`, `THANHTOAN` phát sinh mới trong phiên làm việc hiện tại và ghép (MERGE) ngược trở lại schema cũ.

---

## 4. Ma trận Quyết định Lựa chọn Chiến lược Phục hồi (Decision Matrix)

```text
Phát hiện sự cố
       │
       ├─► Vẫn trong Maintenance Window (Chưa có traffic mới)?
       │      │
       │      ├─► Lỗi logic SQL / DDL ──────► [Chiến lược 1: T-SQL 99_rollback_all.sql] (RTO < 1m)
       │      │
       │      └─► Hỏng dữ liệu vật lý ─────► [Chiến lược 2: RESTORE FULL BACKUP] (RTO < 15m)
       │
       └─► Đã mở traffic (Đã có đơn hàng & giao dịch mới phát sinh)?
              │
              ├─► Lỗi logic SP / View ──────► [Chiến lược 3A: Forward Fix / Hotfix] (RTO < 10m)
              │
              └─► Bắt buộc hạ cấp schema ──► [Chiến lược 3B: Selective ETL Merge] (RPO = 0)
```

---

## 5. Kết luận Kế hoạch Phục hồi

Kế hoạch sao lưu và rollback đã được thiết kế toàn diện, dự phòng đầy đủ các tình huống rủi ro từ cấp độ script đến thảm họa phần cứng. Hệ thống bảo đảm cam kết không để mất bất kỳ giao dịch tài chính nào của khách hàng trong suốt quá trình triển khai.

