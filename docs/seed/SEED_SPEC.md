# S1 — Seed spec v2: real media

Dataset dành cho đồ án/demo, không tuyên bố lịch chiếu hoặc cơ sở CinemaStar tồn tại ngoài đời. Pipeline canonical: `database/10_seed/seed-all.sql`, CLI `scripts/db/seed-demo.mjs`.

## Quy mô và provenance

- 18 phim: 9 phim ngắn thực có poster giấy phép mở từ Blender/Commons; 9 phim thương mại được tra cứu riêng. Film metadata/runtime thật, không kéo dài phim ngắn thành phim 90 phút. Media thương mại chưa được cấp quyền: PosterURL NULL và manifest BLOCKED_LICENSE; không giả poster. Điều chỉnh lựa chọn sau S2 theo khả năng xác minh quyền. TMDB chỉ lấy ảnh qua API với env key hợp lệ và attribution, không scrape/bịa paths.
- 12 `Đang chiếu`, 6 `Sắp chiếu` là DEMO_SCENARIO. Release window tính theo SQL business day; năm phát hành thật ở manifest, không viết năm giả vào schema vốn không có year. Sintel có ngày mở màn demo -14 để rule featured hiện hữu chọn ảnh đã xác minh; các phim đang chiếu khác -30. Runtime phim ngắn làm tròn lên theo giây video gốc được studio liên kết, bao gồm credit của phiên bản đó.
- 4 rạp có tên `CinemaStar Demo …`, địa chỉ ghi rõ khu mô phỏng; Hà Nội/TP.HCM, phone NULL. Mỗi rạp 2 phòng 2D/3D, 40 ghế A–D x 1–10, đủ Thường/VIP/Sweetbox/Đôi; D10 bảo trì.
- 96 suất future: 8 phòng x 12 ngày (ngày +1…+12), xoay 12 phim deterministic, slot 18:00 local. Hôm nay có thêm 4 suất 23:00 nếu SQL clock còn trước slot; 12 suất history ngày -3/-4. Runtime + 30 phút buffer được kiểm tra overlap.
- 12 synthetic users: 2 admin, 2 manager, 2 CSKH, 6 customer (1 locked). Email `@example.test`, phone NULL; hash bcrypt cost10, password demo mạnh, không credential production. Customer profiles only.
- RBAC giữ nguyên 4/23/40 theo fixed-RBAC verifier; duy nhất lookup RBAC sử dụng IDs đã là contract của project. Mọi FK nghiệp vụ lấy natural keys / join parents, không đoán identity.
- 8 sản phẩm; ảnh chỉ theo mặt hàng được nhìn/xác minh. Combo chưa có ảnh đúng sẽ NULL với blocker. 20 rule pricing: Ngày thường/Cuối tuần/Tất cả, loại ghế/format hiện hữu; 5 coupons active percent/fixed, expired, exhausted, min-order.
- Lifecycle demo: pending, canceled, expired, paid retry, historical paid + eligible review, complaint mới/xử lý/giải quyết/có/không linked order. Booking/payment/complaint/review gọi SP; historical snapshot là transaction DBMS tính bằng helper vì SP từ chối past booking. Không disable constraints/triggers.

## Profiles / repeatability

`base` trên DB empty tạo catalog; lần hai validation toàn bộ dataset trước no-op. Dataset không khớp thì fail closed, không sửa dữ liệu lịch sử. `demo-dynamic` tạo lịch/lifecycle một lần; lần hai validate và no-op. Refresh ngày dùng explicit reset có backup/provenance guard trên exact allowlist. Không append vô hạn. `test-fixtures` chỉ target TEST, không dùng DB demo/Main.

## Gate và trạng thái

Tất cả SQL ở `database/`; offline CLI chỉ expand/chạy SQL và kiểm tra evidence. Giữ schema/SP/API/UI unchanged. Media source → HTTPS GET/MIME/dimensions → nhìn ảnh → license → seed. Quyền chưa rõ giữ NULL. `VALID` transport/match không đồng nghĩa có quyền commercial. Attribution lưu trong DB description và manifest, credit visible ở detail hiện hữu; kiểm chứng browser trước báo hoàn tất.

Các số lượng là spec, chưa phải evidence PASS. Report cuối ghi số thực và blocker.
