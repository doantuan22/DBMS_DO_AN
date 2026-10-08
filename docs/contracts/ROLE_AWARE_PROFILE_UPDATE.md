# R4.6 — Role-aware profile update

## Audit trước implementation

Baseline Task 13 được đóng băng trong `../evidence/r46/preserved-before.json`; không dùng HEAD cũ để quy diff Task 9–13 cho Task 14. `audit-before.json` ghi schema, signature, quyền, dependency, 27 bảng dữ liệu và 159 module main. `profile-before.json` chứng minh SP cũ tạo hồ sơ cho cả Manager/CSKH/Admin trên disposable DB, sau đó cleanup và đối chiếu fingerprint.

Nguyên nhân: `sp_User_UpdateProfile` chọn UPDATE/INSERT `HOSOKHACHHANG` dựa vào sự tồn tại hồ sơ, không đọc vai trò. Backend bind identity và năm tham số đúng; không cần sửa Controller, Validator, Service, JWT hoặc rate limiter. Main chưa có hồ sơ non-Customer. Chỉ sửa SP; Frontend chỉ sửa khi chứng minh form hiện tại gửi field Customer gây lỗi tương thích.

## API và dữ liệu

`PUT /api/auth/me` self-update, authenticated identity; năm tham số SP giữ nguyên. Request chỉ có `HoTen`, `SoDienThoai`, `NgaySinh`, `GioiTinh`. Tên bắt buộc. Optional omitted/blank/null được validator chuyển NULL (PUT replacement). Common fields chỉ tên/điện thoại; email, ID, role, permission, assignment, status, password và points không editable. Response vẫn DTO hiện hành, reload bằng SP hiện hành.

Mỗi user có một `NGUOIDUNG.VaiTroID NOT NULL` FK `VAITRO`; role code unique, không có trạng thái role. Customer là `KHACH_HANG`; Manager=`QUAN_LY_RAP`, CSKH=`CSKH`, Admin=`ADMIN`. Schema cho phép custom role: role hợp lệ khác Customer có hành vi common-only. Null/invalid FK không hợp lệ; user thiếu hoặc không active bị từ chối. Không có multi-role.

`HOSOKHACHHANG.NguoiDungID` là PK/FK; date nullable, gender nullable hoặc Nam/Nữ/Khác, points nonnegative mặc định 0. Customer missing profile tạo một hồ sơ hợp lệ với optional NULL và points 0. Existing points không đổi. Không suy role từ sự tồn tại hồ sơ.

## Role behavior matrix

| Scenario | NGUOIDUNG | HOSOKHACHHANG |
|---|---|---|
| Active Customer có profile | UPDATE tên/điện thoại | UPDATE date/gender; giữ points |
| Active Customer thiếu profile | UPDATE tên/điện thoại | INSERT đúng PK/constraint, points 0 |
| Active Manager/CSKH/Admin, optional Customer fields NULL | UPDATE common | Không ghi |
| Active non-Customer có profile bất thường, optional NULL | UPDATE common | Giữ nguyên toàn bộ, không cleanup |
| Active custom role hợp lệ, optional NULL | UPDATE common | Không ghi |
| Non-Customer gửi date/gender non-NULL | Từ chối trước ghi | Không ghi |
| User thiếu/locked/unactivated | Từ chối | Không ghi |

Staff Customer-specific non-NULL dùng mã quyền hiện hữu 50301 → 403 `FORBIDDEN`; không bỏ qua rồi báo thành công. NULL của Staff không xóa date/gender của hồ sơ bất thường. Date tương lai vẫn 50400 → 400 `INVALID_BIRTH_DATE`; phone conflict 50015 → 409 `PHONE_IN_USE`; account không khả dụng 50300 → 401 `ACCOUNT_UNAVAILABLE`; native constraints qua mapping hiện hành, không lộ SQL. Validator tiếp tục từ chối spoofing role/owner/status và field ngoài whitelist.

## Transaction và authority

SQL đọc role/status hiện tại trong cùng transaction, khóa user `UPDLOCK,HOLDLOCK` và role `HOLDLOCK`. Giữ khóa tới commit để serialize việc tạo profile và role/status change. Customer profile existence được khóa range; PK ngăn duplicate. Có transaction ngoài thì dùng savepoint, không commit caller. Lỗi rollback own transaction hoặc savepoint khi committable; doomed transaction rollback toàn bộ theo convention hiện có. Hai bảng không partial commit. Không chuyển transaction hay role decision sang JavaScript.

## Giới hạn và reproduction

Không cleanup dữ liệu bất thường; main audit trước sửa có 0 non-Customer profile. UI chỉ phản ánh role để chọn field, SQL vẫn authoritative khi role đổi giữa request. Không thay schema/RBAC/Auth/booking/payment, không triển khai R4.7.

Chạy offline trên disposable DB đã được xác nhận tồn tại (credentials môi trường hiện hành, không commit `.env`):

```powershell
node scripts/r46/deploy.mjs --database=CinemaBookingDB_R0_R33_20261008_01 --apply
node scripts/r46/profile-tests.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r46/checks.mjs --database=CinemaBookingDB_R0_R33_20261008_01
```

Audit/reproduction trước sửa là evidence đóng băng, không chạy lại sau implementation. Kết quả thật và lệnh còn lại tại `../evidence/R4_ROLE_AWARE_PROFILE_UPDATE.md`.
