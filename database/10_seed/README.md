# Quản lý seed — R5.1 đến R5.3

Entry point duy nhất cho bộ seed hiện tại là `10_seed/seed-all.sql`. Tất cả đường dẫn
SQLCMD `:r` được giải quyết từ thư mục **database/**, kể cả include nằm trong thư mục con.
Node runner `scripts/db/run.mjs` giữ convention này qua `expandSql()` và một SQL session.

```text
10_seed/
├── seed-all.sql
├── seed_base/             # 16 file nền/catalog/demo tài khoản hiện có
├── seed_demo_dynamic/     # 014_reference.sql: lịch theo đồng hồ SQL Server
└── test_fixture/          # danh mục fixture và convention cho R5.4
```

`seed_base` chứa dữ liệu cơ bản cần cho vận hành/demo, không phải bộ production data.
Tài khoản demo, điểm tích lũy và các khoảng ngày hiện có được giữ nguyên. R5.1 không
bổ sung base seed R5.2; audit R5.2 xác nhận dữ liệu hiện có hợp lệ. R5.3 mở rộng
`seed_demo_dynamic` thành 8 suất quá khứ và 24 suất mở bán theo DB clock; xem
[hướng dẫn dynamic seed](seed_demo_dynamic/README.md). `test_fixture` ghi nhận
các fixture đã có tại `11_tests/` và `scripts/`; không tự chạy hoặc copy chúng vào seed.

## Thứ tự thực thi

`run-all.sql` chạy `build-objects.sql` → `10_seed/seed-all.sql` →
`12_verify/verify_database.sql`. Lệnh seed riêng yêu cầu database objects đã được dựng.
Các file con cần `CinemaSeedDay`, `CinemaSeedSkip` và transaction do entry point thiết lập;
không chạy file con độc lập, không glob theo thư mục.

| Thứ tự/file | Nhóm | Dữ liệu | Dependency dữ liệu |
| --- | --- | --- | --- |
| 001_reference.sql | seed_base | 4 VAITRO | Không |
| 002_reference.sql | seed_base | 23 QUYEN | Không |
| 003_reference.sql | seed_base | VAITRO_QUYEN | 001, 002 |
| 004_reference.sql | seed_base | 8 NGUOIDUNG, 4 HOSOKHACHHANG | 001; user trước profile trong cùng file |
| 005_reference.sql | seed_base | 3 RAPCHIEUPHIM | Không |
| 006_reference.sql | seed_base | 2 PHANCONG_RAP | 004, 005 |
| 007_reference.sql | seed_base | 6 PHONGCHIEU | 005 |
| 008_reference.sql | seed_base | 240 GHE | 007 |
| 009_reference.sql | seed_base | 7 THELOAI | Không |
| 010_reference.sql | seed_base | 6 DIENVIEN | Không |
| 011_reference.sql | seed_base | 4 PHIM | Không |
| 012_reference.sql | seed_base | 7 PHIM_THELOAI, 4 PHIM_DIENVIEN | 009, 010, 011 |
| 013_reference.sql | seed_base | 7 BANGGIA | 005 |
| 014_reference.sql | seed_demo_dynamic | 8 suất quá khứ, 24 suất tương lai theo DB clock | 007, 008, 011; clock helpers và view IsBookable |
| 015_reference.sql | seed_base | 5 SANPHAM | Không |
| 016_reference.sql | seed_base | 3 KHUYENMAI, counter 0 | Không |
| 017_cinema_images.sql | seed_base | Ảnh đại diện cho từng rạp | 005 |

Thứ tự **001 → 017** vẫn giữ nguyên dù các nhóm xen kẽ trong `seed-all.sql`.
Không gom tất cả base trước demo vì R5.1 giữ nguyên chuỗi thực thi đã có.
`fn_UtcTuGioRap` và các object/default/trigger liên quan phải tồn tại trước seed;
build entry point hiện tại đã bảo đảm thứ tự này. `verify_seed.sql` chạy trong
transaction seed trước COMMIT; không sửa logic verification.

## Cách chạy và khả năng chạy lại

Các command và tham số cũ được giữ nguyên. Ví dụ seed riêng trên **database kiểm thử
đã có objects** và đã xác nhận an toàn:

```powershell
node scripts/db/run.mjs seed --database=CinemaBookingDB_R0_<ten_test_da_xac_nhan>
```

Thay phần `<...>` bằng tên thật; đây không phải command tạo database. SQLCMD trực tiếp:
working directory `database/`, cung cấp `SeedDate`, chọn đúng target. SQL nguồn vẫn có
`USE CinemaBookingDB`; đổi target phải dùng runner hiện tại để thay tên, không chỉ đổi `-d`.
R5.1 không chạy seed/reset trên database chính và không thêm cơ chế rebuild.
SeedDate mặc định của runner là ngày Việt Nam trên máy gọi; base vẫn dùng giá trị này.
Dynamic lấy ngày từ đồng hồ DB, không từ SeedDate. Nếu cung cấp SeedDate quá lệch
để phim không chứa cửa sổ lịch, dynamic báo 51004 trước insert và không sửa base.

Khả năng chạy lại là **skip toàn bộ theo sentinel**, không phải upsert:

- Nếu đã có `admin@cinemadb.vn`, entry point bỏ qua 17 file dữ liệu và vẫn chạy verify.
- Đổi SeedDate rồi chạy lại không refresh suất chiếu, ngày phim, phân công hay khuyến mãi.
- Nếu thiếu sentinel nhưng VAITRO đã có dữ liệu, entry point từ chối với 51004.
- Nếu dữ liệu chỉ tồn tại ở bảng khác, guard VAITRO không bảo đảm phát hiện trước INSERT;
  PK/UQ/FK có thể làm transaction lỗi. Verify cũng chỉ kiểm một phần bộ dữ liệu.
- File con không idempotent độc lập; chạy thủ công với session context sai có thể bỏ qua
  hoặc insert trùng. Không dùng chúng để sửa dataset thiếu/khác nguồn.

Các giới hạn này đã tồn tại; R5.1 chỉ ghi nhận, giữ nguyên SQL và transaction.

## Tooling and history

`scripts/db/generate-seed.mjs` is a one-time R0 extraction tool, not a routine seed
entry point. It depends on `_legacy_snapshot/seed/07_seed_data.sql`, which is absent
from this checkout, and its old template does not include current timezone and
verification updates. Do not run it to overwrite canonical seed source.

Phase-specific seed runners and checkers have been retired. The current seed entry
point remains `seed-all.sql`; current Test DB safety rules and commands are in the
[test pipeline](../../scripts/db/TEST_PIPELINE.md). Script names in older phase
reports describe the tools used at the time and are not replay instructions.
