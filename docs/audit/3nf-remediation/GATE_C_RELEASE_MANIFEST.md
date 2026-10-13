# GATE C PRODUCTION RELEASE MANIFEST & CODE FREEZE DOSSIER
**Project:** CinemaBookingDB — Strict 3NF Normalization Remediation  
**Phase:** Gate C Pre-Approval & Release Freeze  
**Auditor / Roles:** Production Release Engineer & Configuration Auditor  
**Date:** October 13, 2026  
**Git Commit ID:** `db993a8d3aa6c70075bd0f702ff5e5a53706efac`  
**Official Release Tag:** `v1.0.0-strict3nf-gate-c`  
**Code Freeze Status:** **STRICTLY FROZEN — ZERO UNCOMMITTED DDL / DML DRIFT**

---

## 1. XÁC NHẬN ĐÓNG BĂNG MÃ NGUỒN (RELEASE CODE FREEZE)

Nhóm phát hành và kiểm toán chính thức kích hoạt trạng thái **RELEASE FREEZE** đối với toàn bộ dự án `CinemaBookingDB`:
- Không bổ sung tính năng mới.
- Không thay đổi nghiệp vụ (tuân thủ nghiêm ngặt D-01 đến D-07).
- Không sửa đổi mã nguồn Backend Express hoặc Frontend React.
- Mọi tệp DDL/DML Stored Procedure và View trong kho lưu trữ `database/` được chốt tại commit:
  $$\mathbf{Commit\ Hash:}\ \mathtt{db993a8d3aa6c70075bd0f702ff5e5a53706efac}$$

---

## 2. MANIFEST CHI TIẾT CÁC TẬP LỆNH DI TRÚ (MIGRATION SCRIPTS MANIFEST)

```
+----------------------------------------------------------------------------------------------------------------------------------+
|                                    MIGRATION DEPLOYMENT SCRIPTS SHA-256 MANIFEST                                                 |
+----+-----------------------------------------------------+------------------------------------------------------------------+---+
| Thứ| Tên tập lệnh                                        | Mã băm SHA-256 chính thức                                        |GĐ |
+----+-----------------------------------------------------+------------------------------------------------------------------+---+
| 01 | database/13_migrations/3nf_remediation/             | FCF0FF1A54E15062BE0DF051F6B8CE36215A4A2FD70A0CB522AFEEDFFDFD5641 |Pre|
|    | 01_preflight_checks.sql                             |                                                                  |   |
| 02 | database/13_migrations/3nf_remediation/             | E730DDC0D8558018D278BF7698D2762128C82CCC827A5A09CB2FCEF9A96228A5 |Exp|
|    | 02_expand_update_views_procedures.sql               |                                                                  |   |
| 03 | database/13_migrations/3nf_remediation/             | 24721B672ECD10F0338C2D7C5E2920252F3EA04AACEABD5498CAB692840ED14C |Con|
|    | 03_contract_alter_schema.sql                        |                                                                  |   |
| 04 | database/13_migrations/3nf_remediation/             | E4929435D2C8892EF4BBC257471D8CABE7971DB0416FB95155216321A833D27B |Rec|
|    | 04_post_migration_reconciliation.sql                |                                                                  |   |
| -- | database/13_migrations/3nf_remediation/             | 73216B0E8C2CD267456E76D6AFD9BC3651C29FDBF5D20AAA418970A868534F34 |Rol|
|    | 99_rollback_all.sql                                 |                                                                  |   |
+----+-----------------------------------------------------+------------------------------------------------------------------+---+
```

---

## 3. ĐỒNG BỘ NGUỒN CHUẨN CANONICAL SQL SOURCES (SOURCE OF TRUTH)

Toàn bộ các tệp DDL và Stored Procedure trong cây thư mục chính `database/` đã được đồng bộ với thiết kế Strict 3NF:

```
+---------------------------------------------------------------------------------------------------------+
|                                    CANONICAL SOURCE PARITY MATRIX                                       |
+------------------------------------+---------------------------------------+----------------------------+
| Đối tượng SQL Server               | Tệp mã nguồn Canonical                | Trạng thái Strict 3NF      |
+------------------------------------+---------------------------------------+----------------------------+
| Bảng dbo.THANHTOAN                 | database/02_tables/thanhtoan.sql      | 8 cột vật lý, không SoTien |
| Constraint CK_THANHTOAN_SoTien     | database/03_constraints/              | Đã loại bỏ hoàn toàn       |
| Index IX_THANHTOAN_DonDatVeID      | database/04_indexes/thanhtoan.sql     | Bao bọc DonDatVeID, TrangThai|
| View vw_DoanhThuTheoRap            | database/06_views/vw_DoanhThuTheoRap  | Tính động từ DONDATVE      |
| sp_Payment_CreateAttempt           | database/08_procedures/payment/       | INSERT 8 cột, SELECT động  |
| sp_Payment_UpdateResult            | database/08_procedures/payment/       | Cập nhật kết quả thanh toán|
| sp_Order_GetDetailByCustomer       | database/08_procedures/customer/      | SELECT động SoTien         |
| sp_StaffBooking_Detail             | database/08_procedures/staff_booking/ | SELECT động SoTien         |
| sp_Support_Complaint_GetOrderRef   | database/08_procedures/support/       | SELECT động SoTien         |
| sp_Admin_Dashboard                 | database/08_procedures/admin/         | Tổng hợp doanh thu động    |
| sp_Admin_Report_Revenue            | database/08_procedures/admin/         | Tổng hợp báo cáo doanh thu |
| sp_Manager_Revenue                 | database/08_procedures/manager/       | Tổng hợp doanh thu theo rạp|
+------------------------------------+---------------------------------------+----------------------------+
```

---

## 4. XÁC MINH TRẠNG THÁI HIỆN THỜI CỦA CÁC DATABASE (DATABASE STATE AT FREEZE)

```
+---------------------------------------------------------------------------------------------------------+
|                                  ENVIRONMENT STATE AT RELEASE FREEZE                                    |
+-----------------------------+-----------------------+---------------------+-----------------------------+
| Cơ sở dữ liệu mục tiêu      | Trạng thái Schema     | Số cột THANHTOAN    | Trạng thái di trú           |
+-----------------------------+-----------------------+---------------------+-----------------------------+
| **CinemaBookingDB_Test**    | **Strict 3NF Target** | **8 cột (Không SoTien)**| ĐÃ DI TRÚ & KIỂM THỬ 100% |
| **CinemaBookingDB** (Prod)  | **Pre-3NF Baseline**  | **9 cột (Có SoTien)**| **CHƯA DI TRÚ (NGUYÊN VẸN)**|
| **CinemaBookingDB_Fresh3NF**| **Strict 3NF Target** | **8 cột (Không SoTien)**| Khởi tạo sạch (Fresh Bootstrap)|
+-----------------------------+-----------------------+---------------------+-----------------------------+
```

### Khẳng định pháp lý kỹ thuật:
- Cơ sở dữ liệu Production `CinemaBookingDB` **hoàn toàn chưa bị tác động bởi bất kỳ lệnh DDL hoặc DML di trú nào**.
- Toàn bộ dữ liệu sản xuất đang ở trạng thái an toàn nguyên bản trước khi có chỉ thị chính thức từ Chủ dự án.

