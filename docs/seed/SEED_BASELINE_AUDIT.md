# S0 — Kiểm kê trước rebuild seed

Ngày: 2026-10-12. Đọc trực tiếp source và inventory SQL Server; không kế thừa PASS lịch sử.

**Trạng thái hiện tại:** chủ dự án đã yêu cầu chuyển demo sang Main sau bản kiểm kê này. Xem [MAIN_SEED_PROMOTION_REPORT.md](MAIN_SEED_PROMOTION_REPORT.md) để biết dữ liệu Main mới, backup và SQL đã đồng bộ. Các số liệu bên dưới là baseline trước chuyển.

## Target và phạm vi

Server thực: `DoanTuanIT`, SQL Server local. Database chính `CinemaBookingDB` có 27 bảng; metadata runtime chính còn thiếu một số module so với source hiện hành. Không migration, reset hoặc ghi lên database này. Không có provenance đủ để khẳng định mọi dữ liệu đều disposable.

Target mới: `CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012`; preflight xác nhận chưa tồn tại, file MDF/LDF khác Main. Test riêng: `CinemaBookingDB_R0_REAL_MEDIA_TEST_20261012`. Hai tên này sẽ là allowlist chính xác của pipeline mới. Xây bằng `database/build-objects.sql` hiện hữu, không tạo schema thứ hai.

Evidence: `.audit-output/database/real-media-baseline-metadata.json`, `real-media-main-before-seed-fingerprint.json`; preflight trong `.audit-output/database-test/runs/2026-10-12T15-09-47-574Z-e199c4cb/`.

| Hạng mục | Bảng / gateway thực | Main hiện có | Lỗi / thiếu | Target mới | Reset Main |
|---|---|---:|---|---:|---|
| Movie | PHIM; sp_Movie_List/GetDetail | 4 | Poster stock, 2 trailer placeholder | 18, theo source đã xác minh | Cấm |
| Cinema | RAPCHIEUPHIM, HINHANH_RAPCHIEUPHIM; sp_Cinema_List/GetImages | 3 / 3 ảnh | Cùng ảnh Unsplash, chưa ghi rõ minh họa | 4 rạp demo / 8 phòng | Cấm |
| Geometry | PHONGCHIEU, GHE | 6 / 240 | Dataset nhỏ, FK fixtures đoán ID | 8 / 320 | Cấm |
| Shows | SUATCHIEU; public show/seat SP, vw_LichChieuChiTiet | 32 | 8 quá khứ, 24 tương lai; skip theo email admin | 12 quá khứ, 96 future + slot hôm nay nếu còn giờ | Cấm |
| Accounts / RBAC | NGUOIDUNG, HOSOKHACHHANG, VAITRO, QUYEN, VAITRO_QUYEN, PHANCONG_RAP | 8 / 4 profiles / 4 roles / 23 quyền / 40 mappings / 2 assignments | Email/SĐT seed trông như người thật, mật khẩu yếu | 12 synthetic users; RBAC giữ nguyên | Cấm |
| Commerce | SANPHAM, BANGGIA, KHUYENMAI | 5 / 7 / 3 | Media chưa đủ, thiếu ca coupon âm | 8 / 20 / 5 | Cấm |
| Lifecycle | DONDATVE, CHITIETVE, THANHTOAN, DANHGIAPHIM, KHIEUNAI, XULY_KHIEUNAI | 0 | Không có lịch sử demo | SP transactions, history atomic SQL | Cấm |

## Contract đã đọc

- 27 table definitions, PK/unique/FK/CHECK/defaults; source hiện hành 169 modules. Media: PHIM.PosterURL/TrailerURL; HINHANH_RAPCHIEUPHIM.URL/MoTa/cover/order; SANPHAM.HinhAnh. Không backdrop/actor image/year field; không thêm field.
- Showtime trigger kiểm tra overlap nhiều dòng; room/movie/cinema status và release window do view/SP quyết định. SQL lưu UTC, `fn_BayGio`, `fn_NgayKinhDoanh`, `fn_UtcTuGioRap` là nguồn clock.
- Booking locks/atomicity/hold/quota; price `fn_TinhGiaVe`; payment retry SP giữ history; review trigger cần paid historical ticket; complaint/processing SP giữ scope và timeline; role immutable.
- UC Matrix hiện hành: 44 active = KH14/QLR10/CSKH6/Admin14; 47 traceable IDs, ADM03/04/05 retired. Không seed role CRUD.

## Legacy entry points

`run-all.sql`, `scripts/db/run.mjs seed`, package `db:seed`, `test-pipeline.mjs` dùng `10_seed/seed-all.sql`. `generate-seed.mjs` đọc `_legacy_snapshot` và có thể ghi đè seed mới; cần retire sau pipeline PASS. `generate-baseline.mjs` chỉ dựng source schema/include; không xóa. Fixture R54/R55 và regression SQL có giả định ID/count/email cũ: giữ framework, cập nhật fixture selector/contracts hoặc báo incompatibility rõ; không dùng làm active demo source.

Frontend mediaPolicy chặn stock hosts cho record media. Không sửa frontend trong task seed; chọn ảnh minh họa Commons được cấp phép hoặc ghi blocker nếu không thể hiển thị đúng.

Git status trước task: clean. Không có AGENTS.md được tìm thấy trong workspace. Không sửa backend/src, frontend/src, shared, schema, SP, trigger hoặc migration.
