# seed_demo_dynamic

[014_reference.sql](014_reference.sql) tạo **8 suất quá khứ Hoàn thành** và
**24 suất tương lai Mở bán** trên database mới. Lịch phủ 4 phim, 6 phòng và 3 rạp
từ Base Seed hiện hành. Xem [database guide](../../README.md) và [quy trình Test DB](../../../scripts/db/TEST_PIPELINE.md).

Script lấy một lần `dbo.fn_BayGio()` (SQL Server UTC), tính ngày địa phương bằng
`fn_NgayKinhDoanh`, rồi đổi các giờ địa phương về UTC qua `fn_UtcTuGioRap`.
Thời gian kết thúc = thời gian bắt đầu + `PHIM.ThoiLuong` phút; không thêm buffer
hoặc quy tắc giờ hoạt động. `SUATCHIEU` lưu UTC theo contract hiện có.

| Ngày so với ngày DB tại giờ Việt Nam | Số suất | Trạng thái |
|---|---:|---|
| −7 | 3 | Hoàn thành |
| −3 | 2 | Hoàn thành |
| −2 | 1 | Hoàn thành |
| −1 | 2 | Hoàn thành |
| +1 / +2 / +3 / +7 | 6 mỗi ngày | Mở bán |

ID 1–5 giữ phim/phòng/định dạng/giá/trạng thái, ngày tương đối và giờ địa phương cũ;
mốc ngày chuyển từ SeedDate sang đồng hồ DB. ID 6–32 bổ sung lịch. Mỗi phòng tối đa
một suất mỗi ngày trong plan; trigger overlap vẫn bật. Theo trigger hiện hành,
`end == start` không overlap, các phòng khác nhau có thể cùng giờ.

Chỉ ghi `SUATCHIEU`; hai table variable chỉ dựng plan trong session, không thêm bảng
schema. Suất quá khứ không tạo order/ticket/payment/review hoặc quyền review.
Trạng thái Hoàn thành là dữ liệu lịch chiếu quá khứ, không giả lập chuyển trạng thái
hay lịch sử giao dịch.

Trước insert, script kiểm parent, duration, ghế active cho phòng tương lai, cửa sổ
phát hành và thời gian quá khứ/tương lai. Sau insert, kiểm suất tương lai bằng view
`vw_LichChieuChiTiet.IsBookable` trước COMMIT của entry point. Giá trị format cũ của
ID 4 (2D ở phòng ScreenX) được giữ: contract hiện hành whitelist định dạng, không
có invariant buộc format suất bằng loại phòng.

`SeedDate` vẫn chi phối ngày của base phim/phân công/giá/khuyến mãi. Nó không cố định
lịch dynamic. Nếu release window của base không chứa lịch quanh ngày DB, script
báo 51004 trước insert; không sửa base để ép lịch hợp lệ. Nên dùng SeedDate phù hợp
với ngày DB khi seed một target mới đã được xác nhận an toàn.

Chạy qua [seed-all.sql](../seed-all.sql), sau seed phòng/ghế/phim; không chạy file riêng.
[Sentinel và runner](../README.md) giữ nguyên: có Admin thì cả nhóm bị skip, không
refresh theo DB clock. Khi nhánh insert chạy, dynamic yêu cầu bảng suất chiếu trống;
không upsert, repair hoặc sửa lịch có sẵn. Không tự reset database đang dùng.

Phase-specific offline checker has been retired; this is not a SQL integration test.
Use the [current Test DB pipeline](../../../scripts/db/TEST_PIPELINE.md) for maintained
commands and target safety rules.
