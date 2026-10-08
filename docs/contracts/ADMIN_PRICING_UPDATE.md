# Admin Pricing Update — R4.3 / I-14

`PUT /api/admin/pricing/:pricingId` giữ nguyên endpoint, phương thức, authentication, role Admin và permission `QL_BANG_GIA`. Actor lấy từ tài khoản đã xác thực; ID lấy từ route. Không cho đổi `RapID`/cinema hoặc truyền actor/flag SQL qua body.

| API field | SQL parameter / column | Type | Update contract |
| --- | --- | --- | --- |
| `seatType` | `@LoaiGhe` / `LoaiGhe` | NVARCHAR(50) | Thường, VIP, Sweetbox, Đôi, Tất cả |
| `dayType` | `@LoaiNgay` / `LoaiNgay` | NVARCHAR(50) | Ngày thường, Cuối tuần, Tất cả |
| `format` | `@DinhDang` / `DinhDang` | NVARCHAR(50) | 2D, 3D, IMAX, 4DX, ScreenX, Tất cả |
| `surcharge` | `@PhuThu` / `PhuThu` | DECIMAL(18,2) | Required; ≥ 0; Backend rejects overflow/rounding |
| `startsOn` | `@NgayBatDau` / `NgayBatDau` | DATE | YYYY-MM-DD; required in a condition edit |
| `endsOn` | `@NgayKetThuc` / `NgayKetThuc` | DATE, nullable | NULL = open end; end ≥ start |
| `status` | `@TrangThai` / `TrangThai` | NVARCHAR(50) | Required; Áp dụng, Tạm dừng, Hết hạn |

Hai chế độ tương thích với Manager:

1. Body cũ chỉ có `surcharge`, `status`: giữ nguyên cả ba dimensions và hai ngày. Service chỉ bind bốn parameters cũ; SQL flag mặc định 0.
2. Body có bất kỳ condition field nào: yêu cầu đủ `seatType`, `dayType`, `format`, `startsOn`, cùng surcharge/status. `endsOn` NULL hoặc omitted mở khoảng ngày. Service bind nhóm đầy đủ và `@CapNhatDieuKien = 1`. Incomplete group hoặc NULL cho field bắt buộc trả 400. Admin giữ convention date hiện có: chuỗi rỗng không phải DATE hợp lệ; form chuyển end-date trống thành NULL.

Không chuyển thành arbitrary per-field PATCH. Muốn sửa riêng một dimension, gửi đầy đủ nhóm condition với những giá trị còn lại đang lưu.

Payload đầy đủ:

```json
{
  "seatType": "VIP",
  "dayType": "Ngày thường",
  "format": "2D",
  "surcharge": 25000,
  "startsOn": "2031-01-01",
  "endsOn": null,
  "status": "Áp dụng"
}
```

SP vẫn là `dbo.usp_Admin_Pricing_Update`. Bốn arguments đầu giữ tên/type/order: `@ActorID INT`, `@GiaID INT`, `@PhuThu DECIMAL(18,2)`, `@TrangThai NVARCHAR(50)`. Append `@LoaiGhe NVARCHAR(50)=NULL`, `@LoaiNgay NVARCHAR(50)=NULL`, `@DinhDang NVARCHAR(50)=NULL`, `@NgayBatDau DATE=NULL`, `@NgayKetThuc DATE=NULL`, `@CapNhatDieuKien BIT=0`. Caller SQL cũ, kể cả positional, tiếp tục dùng được. Nếu gọi SQL trực tiếp, phải bật flag khi sửa nhóm condition; flag 0 giữ nhóm cũ.

Response giữ `{ pricing: { GiaID, RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai } }`; DATE serialize YYYY-MM-DD hoặc NULL. List response thêm `TenRap` như trước. Form hydrate từ row hiện tại, gửi bảy fields, rồi reload list sau thành công; lỗi giữ form để sửa/retry.

SQL là lớp enforce cuối cùng: CHECK enums, NOT NULL, surcharge/date và `TRG_BangGia_KiemTraChongLan` vẫn hoạt động. Overlap = hai rule **Áp dụng**, cùng cinema và exact tuple seat/day/format, khoảng DATE giao nhau với boundary inclusive; NULL end = vô hạn. `Tất cả` vẫn là một layer riêng trong overlap, còn `fn_TinhGiaVe` áp dụng matching wildcard/layer như baseline R0. Không có Ngày lễ.

Một UPDATE trong transaction sở hữu hoặc savepoint theo convention Manager; `UPDLOCK,HOLDLOCK` giữ row khi kiểm tra tồn tại. Catch rollback rồi rethrow. Không update ticket/order/food/payment snapshot. Pricing rule mới ảnh hưởng phép tính mới; đơn đã đặt và báo cáo từ payment/snapshot giữ nguyên.

| SQL / boundary | HTTP | Existing error |
| --- | --- | --- |
| 50209 invalid condition/range/surcharge | 400 | PRICING_INVALID |
| 50210 missing pricing row | 404 | PRICING_NOT_FOUND |
| 50215 overlap | 409 | PRICING_OVERLAP |
| Native CHECK/NOT NULL violation | 400 | INVALID_REFERENCE |
| Unauthenticated / unavailable account | 401 | Existing auth mapping |
| Foreign role / revoked permission | 403 | Existing role/permission mapping |
| Unexpected failure | 500 | Sanitized Internal server error |

Unit, real SQL/API/browser, clean-source regression và deployment evidence: [Task 11 report](../evidence/R4_ADMIN_PRICING_UPDATE.md).
