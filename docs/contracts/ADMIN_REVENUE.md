# Admin Revenue contract — R4.2

Endpoint hiện hữu: **GET `/api/admin/reports/revenue`**. JWT identity được reload từ DB; cần role `ADMIN` và permission `XEM_BAO_CAO_TOANHE`. SQL kiểm tra lại active account/role/permission, giữ mã lỗi 50300/50301/50302 và HTTP mapping hiện có.

| Query | SQL parameter | Datatype | Quy tắc giữ nguyên |
| --- | --- | --- | --- |
| Identity từ JWT/DB | `@ActorID` | INT | Không nhận actor/role từ query/body |
| `fromDate` | `@TuNgay` | DATE, default NULL | Ngày hợp lệ `YYYY-MM-DD`, inclusive |
| `toDate` | `@DenNgay` | DATE, default NULL | Inclusive; API từ chối from > to |
| `cinemaId` | `@RapID` | INT, default NULL | Positive SQL INT; NULL xem toàn hệ |

Không đổi method, path, parameter signature, permission, validator hoặc Manager revenue API. Không có output parameter. Whitelist vẫn gọi `dbo.sp_Admin_Report_Revenue`.

## Quy tắc doanh thu hiện hành

- Tiền authoritative là `SUM(THANHTOAN.SoTien)` của các row `TrangThai = N'Thành công'`, aggregate **một row mỗi DonDatVeID**. Failed/processing/refunded attempts không được tính. Canonical payment flow khóa order và chỉ cho một attempt chuyển success khi order đang chờ thanh toán; retry kết quả cuối không tạo receipt mới. Không tự chọn một attempt tùy ý hay suy đoán tiền từ catalog.
- Quy tắc SUM successful snapshots đã có ở SP cũ và `vw_DoanhThuTheoRap`. Nếu dữ liệu nhập ngoài canonical flow có nhiều successful receipts, vẫn cộng các snapshot đó trong một row/order, giữ contract cũ; report không tự sửa/deduplicate dữ liệu lịch sử.
- Thời điểm ghi nhận mỗi order: `fn_NgayKinhDoanh(MAX(ISNULL(NgayThanhToan, NgayTao)))` trên successful rows. Hàm chuyển UTC instant sang ngày Việt Nam UTC+7. Hai DATE bounds inclusive; NULL mở một đầu hoặc cả hai đầu. Không dùng NgayDat hay giờ chiếu.
- Snapshot gross vé/đồ ăn/discount là `DONDATVE.TongTienVe`, `TongTienDoAn`, `TienGiamGia`; số vé đếm `CHITIETVE.TrangThai <> N'Đã hủy'`. Không JOIN vé/đồ ăn để cộng tiền. Không tự cộng gross metrics vào actual cash metric lần nữa.
- Giữ rule độc lập với order status: paid order đã bị hủy vẫn có successful payment thì vẫn ghi nhận cash receipt. Cancellation compensation là loyalty points; không trừ như cash refund. Payment `Đã hoàn tiền` bị loại theo status; R4.2 không bổ sung refund workflow hay chuyển trạng thái lịch sử.
- `DONDATVE.SuatChieuID` liên kết đúng một suất/phim. Toàn bộ receipt của order, gồm food/discount, thuộc phim đó; không phân bổ theo vé, genre, actor hay catalog price. Tên phim/rạp là tên catalog hiện tại theo policy R3.2, không phải name snapshot.

## Thứ tự recordset và SQL columns

| Index | Nội dung | Columns theo thứ tự |
| --- | --- | --- |
| 0 | Summary | `TongSoDonToanHeThong`, `TongSoVeBan`, `TongDoanhThuVe`, `TongDoanhThuDoAn`, `TongTienGiam`, `TongDoanhThuThucTe` |
| 1 | RevenueByCinema | `RapID`, `TenRap`, `ThanhPho`, `SoDon`, `SoVeBan`, `DoanhThuVe`, `DoanhThuDoAn`, `TongTienGiam`, `DoanhThuThucTe` |
| 2 | RevenueByMovie | `PhimID`, `TenPhim`, `SoDon`, `SoVeBan`, `DoanhThuVe`, `DoanhThuDoAn`, `TongTienGiam`, `DoanhThuThucTe` |
| 3 | RevenueByDate | `Ngay`, `SoDon`, `SoVeBan`, `DoanhThuVe`, `DoanhThuDoAn`, `TongTienGiam`, `DoanhThuThucTe` |

Counts/IDs là SQL INT, money aggregates DECIMAL(38,2), `Ngay` là DATE. Cả bốn output aggregate từ cùng `#DonDaThu` đã materialize; temp table hiện hữu được bổ sung PhimID/NgayThu, không thêm persistent table/view/function. Không tăng KPI summary.

Summary luôn một row, kỳ rỗng trả các metric 0. Cinema giữ behavior cũ: mọi rạp được chọn có row, không có receipt thì metrics 0; sort RapID ASC. Movie chỉ có phim của eligible orders, sort PhimID ASC. Date chỉ có ngày có eligible orders, sort Ngay ASC; không tự tạo zero-day series. Các breakdown cộng khớp Summary cho cả sáu metrics.

## Backend DTO và compatibility

```json
{
  "summary": {},
  "byCinema": [],
  "byMovie": [],
  "byDate": [],
  "cinemas": [],
  "totals": {}
}
```

`summary = recordsets[0][0]`, `byCinema = recordsets[1]`, `byMovie = recordsets[2]`, `byDate = recordsets[3]`. Service chỉ ánh xạ, không SUM/COUNT/GROUP BY hay chuyển công thức tài chính sang JS. DATE được typed procedure client serialize thành `YYYY-MM-DD`; kiểu JSON numeric của metrics giữ như trước.

Hai trường cuối là compatibility aliases: `cinemas` cùng dữ liệu `byCinema`, `totals` cùng dữ liệu `summary`; không phải hai metric khác để cộng thêm. Không xóa aliases trong R4.2. Service fallback giữ object/arrays khi unit input thiếu/rỗng; SQL thật luôn trả một Summary row zero khi không có receipt. Unexpected errors phải propagate tới error handler, không biến thành báo cáo rỗng thành công.

Frontend hiện hữu đọc `adminApi.revenue(range)` và dùng array đầu tiên của DTO để hiển thị bảng rạp. Array đầu tiên vẫn là byCinema; fields/cinemas/totals cũ giữ dữ liệu. R4.2 không thêm UI mới; client có thể đọc bốn canonical fields. Direct SQL consumers cần dùng thứ tự bốn recordset mới theo roadmap; không giữ ordinal hai recordset cũ.

## Kiểm chứng lại

Dùng database test hiện hữu `CinemaBookingDB_R0_R33_20261008_01` (transaction-free sau cleanup), không cần rebuild/seed framework mới:

```powershell
node scripts/r42/deploy.mjs --database=CinemaBookingDB_R0_R33_20261008_01 --apply
node scripts/r42/report-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r42/checks.mjs --database=CinemaBookingDB_R0_R33_20261008_01
```

Offline helpers dùng credentials có sẵn theo convention, không ghi secret/token vào evidence. Fixture tạo mới bằng canonical booking/payment, expected ledger độc lập; chỉ timestamp/status fixture cần test boundary/schema được đặt có chủ đích. Cleanup xóa đúng fixture, phục hồi loyalty points/permission và kiểm hash data/metadata. Identity counters tăng do insert trong disposable DB, không reseed. Chi tiết [report Task 10](../evidence/R4_ADMIN_REVENUE_REPORT.md).
