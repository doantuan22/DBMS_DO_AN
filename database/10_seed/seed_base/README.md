# seed_base

16 file hiện có: `001_reference.sql`–`013_reference.sql`, `015_reference.sql`,
`016_reference.sql`, `017_cinema_images.sql`. Tên và nội dung SQL giữ nguyên.

Vai trò: RBAC, tài khoản/profile demo, rạp/phân công/phòng/ghế, catalog phim/thể loại/
diễn viên, bảng giá, sản phẩm, khuyến mãi và ảnh rạp. Các ngày tương đối SeedDate
trong dữ liệu nền vẫn giữ nguyên; phân nhóm theo mục đích dữ liệu.

Chạy qua [seed-all.sql](../seed-all.sql); không chạy từng file hoặc chạy thư mục theo glob.
Dependency, thứ tự và giới hạn chạy lại nằm ở [hướng dẫn seed](../README.md).
Không bổ sung dữ liệu R5.2 trong R5.1.

## Kết quả audit R5.2

R5.2 đã đối chiếu toàn bộ 16 script với schema, constraint, business contract,
Stored Procedure và caller/test hiện có. Không phát hiện thiếu/sai dữ liệu nền cần sửa;
giữ nguyên nội dung SQL, ID, business key và số lượng. Xem
[quy trình Test DB](../../../scripts/db/TEST_PIPELINE.md) và [database guide](../../README.md).

| Nhóm | Dữ liệu hiện có |
|---|---|
| RBAC | 4 role, 23 permission, 40 mapping |
| Account/profile | 8 account hoạt động; 4 profile chỉ cho Customer |
| Manager assignment | Manager 2 → rạp 1, Manager 3 → rạp 2; 2 phân công hiệu lực |
| Cinema/room/seat/image | 3 rạp, 6 phòng, 240 ghế, 3 ảnh đại diện |
| Movie/catalog | 4 phim, 7 thể loại, 6 diễn viên, 7 liên kết thể loại, 4 liên kết diễn viên |
| Product/pricing/promotion | 5 sản phẩm, 7 quy tắc giá, 3 khuyến mãi chưa dùng quota |

Ma trận quyền giữ nguyên: Customer có 5 quyền; Manager có 8 quyền; CSKH có 4 quyền;
Admin có đủ 23 quyền. Các guard exact role AND permission vẫn quyết định quyền thao tác.
Không suy quyền booking của Manager chỉ từ việc có mã `DAT_VE` trong mapping.
Mật khẩu demo `123456` đã kiểm tra bằng helper bcrypt hiện có cho cả 8 hash;
đây là kiểm tra local, chưa phải đăng nhập qua API/SQL Server.

Điểm mẫu `150, 80, 45, 0` hợp lệ theo constraint và contract profile hiện tại;
không tạo lịch sử giao dịch để giải thích điểm. Mỗi phòng có 40 ghế A–E × 1–8,
loại Thường/VIP/Sweetbox; mỗi rạp có một ảnh đại diện hoạt động.
Liên kết diễn viên hiện có hợp lệ; không có yêu cầu mọi phim phải có cast seed.

Phân công có thời hạn `SeedDate − 30 ngày` đến `SeedDate + 2 năm`; phim có thời hạn
`SeedDate − 30 ngày` đến `SeedDate + 1 năm`. Parent records đáp ứng việc chuẩn bị
lịch chiếu quanh SeedDate (đã kiểm tra ±7 ngày), nhưng audit này không tạo suất chiếu.
Giá có ba loại ngày hợp lệ: Ngày thường, Cuối tuần, Tất cả. Quy tắc giá chỉ bị coi
là chồng lấn khi cùng tuple `(RapID, LoaiGhe, LoaiNgay, DinhDang)` và giao khoảng
hiệu lực; các lớp phụ thu khác tuple có thể cùng áp dụng theo trigger hiện có.

Sentinel Admin của `seed-all.sql` vẫn skip cả base và dynamic nếu Admin tồn tại.
Rerun không repair dataset thiếu và không làm mới ngày hiệu lực khi đổi SeedDate;
verification hiện có cũng không kiểm tra đầy đủ mọi bản ghi base. Đây là giới hạn
orchestration cần xử lý ở R5.5, không phải cam kết upsert của thư mục này.
Không chạy từng script riêng để repair: các script không có tính idempotent riêng.

The phase-specific offline checker has been retired. Historical static results
do not replace SQL verification. Current Test DB commands and target safety rules are
in the [test pipeline](../../../scripts/db/TEST_PIPELINE.md).
