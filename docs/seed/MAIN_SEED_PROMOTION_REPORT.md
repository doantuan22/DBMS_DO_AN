# Chuyển seed demo sang CinemaBookingDB

**STATUS: DONE cho việc chuyển DB và đồng bộ SQL.** Media coverage vẫn PARTIAL: 9/18 phim có poster được xác minh; 9 phim thương mại giữ NULL/fallback như demo.

## Authorization / target

Chủ dự án yêu cầu: “đẩy từ db demo sang db chính đi, đồng thời cập nhật các sql trong foder database luôn”. Thực thi trên SQL Server local **DoanTuanIT**; không đổi backend/.env. Nguồn `CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012`, đích `CinemaBookingDB`.

Main trước chuyển: toàn bộ 27 bảng khớp SHA256 của bản kiểm kê seed cũ ngày 12/10; không có đơn, vé, payment, review, complaint hoặc compensation. Không phát hiện dữ liệu ngoài baseline. Demo khớp receipt server/GUID/full-row hashes. Hai DB riêng GUID/files, ONLINE; không có app session tại preflight. Test DB có các giao dịch kiểm thử không được dùng làm nguồn.

Main cũ được thay toàn bộ bằng backup demo đã nghiệm thu, giữ nguyên ID, các URL ảnh, tài khoản synthetic, password hash, FK, lịch sử thanh toán, vé và tiền snapshot. Demo nguồn giữ nguyên toàn bộ dữ liệu. Không merge hai bộ seed hoặc gán ảnh khác phim vào các phim cũ.

## Backup / restore thực tế

Evidence run: `.audit-output/seed-v2/2026-10-12T16-32-51-721Z-promote-main/`.

- Preflight/dry-run Main và demo PASS; token ràng buộc server, GUID, files và toàn bộ hashes.
- SINGLE_USER **NO_WAIT**; kiểm tra hashes lại ngay trong session trước backup. Không kill app transaction.
- Backup Main và demo: COPY_ONLY/CHECKSUM, hai bản RESTORE VERIFYONLY PASS.
- RESTORE backup demo vào **đường dẫn MDF/LDF Main đã kiểm tra**: PASS. Không ghi đè files của demo.
- Cả hai DB trở lại MULTI_USER. Main GUID mới: `ADA26E08-31AC-4F12-89EB-4460E635B6BE`.

Backup Main trước chuyển:

```text
C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CinemaBookingDB-2026-10-12T16-32-51-721Z-promote-main-before.bak
```

Backup nguồn:

```text
C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CinemaBookingDB_R0_REAL_MEDIA_DEMO_20261012-2026-10-12T16-32-51-721Z-promote-main-source.bak
```

`promotion.log` ghi backup/VERIFYONLY/RESTORE thành công; `recovery.json` ghi server, GUID và logical/physical paths. Template phục hồi: [rollback.sql](../../database/deployments/seed-v2-main/rollback.sql), dùng backup **Main trước chuyển**. Chưa chạy rollback vì deployment thành công.

## Main sau chuyển

| Nhóm | Số lượng |
|---|---:|
| Phim / poster có URL verified | 18 / 9 |
| Rạp / cover minh họa có URL | 4 / 4 |
| Phòng / ghế | 8 / 320 |
| Suất chiếu | 108 |
| Tài khoản / customer profiles | 12 / 6 |
| Đơn / vé / payment attempts | 6 / 7 / 4 |
| Review / complaint / processing events | 1 / 5 / 7 |
| Sản phẩm / sản phẩm có ảnh | 8 / 5 |
| Pricing rules / coupons | 20 / 5 |
| Role / permission / role-permission | 4 / 23 / 40 |
| Bảng / SQL modules | 27 / 169 |

## SQL trong database

- Seed active đã dùng `10_seed/seed_base/020_users.sql`, `030_cinemas.sql`, `040_movies.sql`, `050_commerce.sql` và dynamic/lifecycle v2; URL nằm trong SQL và ba media manifests. Không còn active includes của các module seed cũ đã thay.
- [compile-real-seed.mjs](../../database/10_seed/compile-real-seed.mjs) biên dịch manifest reviewed thành SQL deterministic; không xuất dữ liệu Main thành một nguồn seed thứ hai.
- Thêm [promote.sql](../../database/deployments/seed-v2-main/promote.sql), identity guard, rollback và hướng dẫn deployment; snapshot verifier hỗ trợ đối chiếu lại dữ liệu dưới quyền truy cập độc quyền.
- Main trước chuyển có 159 modules; sau chuyển có **169 modules canonical** hiện có trong repo/demo, gồm fixed RBAC và staff booking. Không thêm bảng/cột hoặc sửa source nghiệp vụ SP để chuyển seed.
- Tool offline `scripts/db/promote-seed-main.mjs`, alias `db:seed:promote-main`; các seed/reset/test aliases thông thường vẫn từ chối Main. Main có app writes hoặc khác baseline cũ sẽ chặn việc chạy lại deployment.
- README root/database/seed và tài liệu baseline/reset/verification đã cập nhật trạng thái Main, accounts và recovery.

## Kiểm chứng đợt chuyển Main

| Gate | Kết quả thực |
|---|---|
| Hash dữ liệu Main = demo | 27/27 bảng exact equality; result.json, snapshot.json |
| Demo nguồn không đổi | Full snapshot equality PASS |
| Schema/constraints/indexes/triggers/security/dependencies | Full verify_database PASS; schema-invariants.log |
| Catalog/media/FK/orphans/overlap/money/double booking/RBAC | Seed v2 integrity PASS; seed-integrity.log |
| Definition parity với SQL source | 169/169 PASS; metadata.json, verify-CinemaBookingDB.json |
| API thật trên cấu hình Main hiện hữu | Health DB, 18 movies, 9 poster URLs và trailer URLs khớp manifest, 4 cinemas, 8 products, featured Sintel/detail PASS; api-read.json |
| API không thay đổi dữ liệu Main | 27 full-row hashes trước/sau bằng nhau; api-data-preservation.json |

Không chạy booking/payment/regression mutation trên Main. Các SQL regression, unit tests và browser screenshots của bộ demo được ghi ở [báo cáo seed ban đầu](SEED_VERIFICATION_REPORT.md); không tính lại những kết quả đó thành test mới của đợt chuyển.

## Chạy ứng dụng / đăng nhập

Backend đã cấu hình `CinemaBookingDB`; khởi chạy backend/frontend như thường. Nếu trình duyệt lưu phiên tài khoản seed cũ, đăng xuất rồi dùng accounts mới:

- Admin: `admin1@example.test`.
- Manager: `manager1@example.test` hoặc `manager2@example.test`.
- CSKH: `support1@example.test`.
- Customer: `customer1@example.test` (customer6 bị khóa theo fixture).

Mật khẩu demo chung: `CinemaStarDemo!2026`. Accounts này chỉ là dữ liệu synthetic demo. 9 poster thương mại, ảnh nước lọc và hai combo còn blocker đã công bố; việc chuyển Main không tự bổ sung media thiếu.
