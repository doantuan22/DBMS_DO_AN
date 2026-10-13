# EXTERNAL BASELINE ARTIFACT ARCHIVE
## CinemaBookingDB — Strict 3NF Remediation Baseline Persistence

Thư mục này lưu trữ các External Baseline Artifacts (JSON / SHA-256 Checksums) được sinh ra từ lệnh thực thi của `01_preflight_checks.sql` trước khi di trú cấu trúc bảng `dbo.THANHTOAN`.

### Cấu trúc Schema của Baseline Artifact (`pre_migration_baseline_<DatabaseName>.json`)

```json
{
  "DatabaseName": "CinemaBookingDB_Test",
  "CapturedAt": "2026-10-13T14:45:00.0000000",
  "TotalAttempts": 4,
  "DistinctOrders": 3,
  "SuccessAttempts": 3,
  "FailedAttempts": 1,
  "TotalHistoricalRevenue": 446500.00,
  "TableChecksum": "A1B2C3D4...",
  "PaymentDetails": [
    {
      "ThanhToanID": 1,
      "DonDatVeID": 1,
      "PhuongThuc": "VNPAY",
      "SoTien": 150000.00,
      "TrangThai": "Thành công",
      "NgayThanhToan": "2026-10-01T10:00:00",
      "MaGiaoDich": "VNPAY_1001",
      "ReconstructedAmount": 150000.00
    }
  ]
}
```

### Nguyên tắc Vận hành
1. **Zero Intrusion on Main Database:** Database chính (`CinemaBookingDB_Test` / `CinemaBookingDB`) không bị thêm bất kỳ bảng kỹ thuật nào.
2. **Cross-Session Persistence:** Được lưu trữ đồng thời trong `tempdb.dbo.Migration3NF_Baseline_<DatabaseName>` và file JSON trong thư mục này.
3. **Audit Verification:** Sử dụng cho kiểm toán viên đối soát độc lập và xác minh tính toàn vẹn lịch sử giao dịch.

