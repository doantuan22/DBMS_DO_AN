# R4 – P1 Functional Blockers: PASS

1. **Phạm vi và audit hiện trạng.** Chỉ xử lý BUG-004/005/006/007/014. Đối chiếu source HEAD trước sửa, route, validator, controller/service, SP đang triển khai và state DB. [Before traces](evidence/before-traces.json) ghi nguyên nhân; [HTTP/SP evidence](evidence/functional-api.json) tái hiện payload cũ và hành vi grant-only. Không giả định findings audit cũ đã còn nguyên sau R3B.

2. **BUG-004: Manager tạo ghế.** Form trải toàn bộ state nên gửi cả roomId, trong khi route /manager/rooms/:roomId/seats đã sở hữu PhongID; strict seatCreate từ chối400. Sau sửa chỉ gửi {row, number: Number(...), type}, dùng ID của phòng đã tải. Chuỗi: ManagerPortal → managerApi → managerRoutes(QL_GHE) → managerController.seatCreate → managerService → sp_Manager_Seat_Create → GHE. Validator chặn số lẻ/không dương/vượt INT trước driver. SP và scope R3 giữ nguyên; batch không đổi.

3. **BUG-005: ảnh rạp.** State edit có cover dù checkbox ẩn; body spread gây400 ở metadata validator. Create gửi {url,description,displayOrder,status,cover}; update chỉ {url,description,displayOrder,status}; chọn cover dùng PATCH /cover riêng; DELETE giữ endpoint riêng. Chuỗi: CinemaImageManager → adminApi → QL_RAP → cinemaImageWrite → adminController/adminService → usp_Admin_CinemaImage_Create/Update/SetCover/Delete → HINHANH_RAPCHIEUPHIM. Không có upload binary trong UI/API hiện tại; chức năng hiện có nhận URL/đường dẫn. Metadata update bảo toàn cover và mọi ảnh khác. Chọn rạp/bỏ chọn/reset form và response cũ được xử lý theo request hiện hành.

4. **BUG-006: nguyên nhân form edit.** onSelect dùng editableFields đã tính khi selected còn null nên lần sửa đầu dùng createOnly, thiếu editOnly/status. Form tài khoản còn hiển thị các trường API chỉ cho tạo, nhưng update chỉ hỗ trợ status. Chuyển mô tả form và chuyển đổi kiểu vào utils/adminForms.js; dùng formFields(definition,true) trực tiếp khi hydrate. Form tài khoản edit chỉ cho status. ID, create-only/system fields không nằm trong body update. DATE là YYYY-MM-DD; số giữ0; datetime-local dùng converter R1; CSV là mảng số. Cancel không gửi mutation. Đổi bản ghi/phân hệ làm sạch selection; token request ngăn list/grants cũ ghi đè state mới.

5. **Inventory form Admin hiện tại: 14 form dùng chung.** Mỗi dòng dưới có payload update được validator/API/SP chấp nhận, thay đổi được reload từ DB và kiểm tra hydration/cancel/đổi bản ghi/exact body trên Chrome. Không dùng con số9 từ audit cũ. [Inventory đầy đủ gồm row, fields và payload trước/sau](evidence/edit-inventory.json).

| Form | Trường được sửa | Kết quả |
|---|---|---|
| Tài khoản | status | HTTP/SP + reload DB + browser PASS |
| Vai trò | name, description | HTTP/SP + reload DB + browser PASS |
| Quyền | name, description | HTTP/SP + reload DB + browser PASS |
| Phân công | userId, cinemaId, startsOn, endsOn, status | HTTP/SP + reload DB + browser PASS |
| Rạp | name, address, city, phone, description, status | HTTP/SP + reload DB + browser PASS |
| Phòng | name, type, status | HTTP/SP + reload DB + browser PASS |
| Ghế | type, status | HTTP/SP + reload DB + browser PASS |
| Phim | title, durationMinutes, releaseDate, endDate, language, subtitle, ageRating, director, description, posterUrl, trailerUrl, genreIds, status | HTTP/SP + reload DB + browser PASS |
| Thể loại | name | HTTP/SP + reload DB + browser PASS |
| Diễn viên | name, birthDate, nationality | HTTP/SP + reload DB + browser PASS |
| Sản phẩm | name, type, price, description, image, status | HTTP/SP + reload DB + browser PASS |
| Khuyến mãi | description, discountType, discountValue, minimumOrder, maximumDiscount, startsAt, endsAt, quantity, status | HTTP/SP + reload DB + browser PASS |
| Bảng giá | surcharge, status | HTTP/SP + reload DB + browser PASS |
| Suất chiếu | movieId, startsAt, endsAt, format, basePrice, status | HTTP/SP + reload DB + browser PASS |

6. **Năm luồng sửa riêng.** Ảnh rạp: metadata/select/checkbox create/cancel và cover riêng. Vai trò–quyền: roleId + permissionIds. Diễn viên phim: cast JSON với actorId/role. Khiếu nại: status; processing: content/nextStatus. Cả năm kiểm bằng component thật trên Chrome. Revenue chỉ là form lọc; không tính là form update. Tổng19 form/luồng sửa, không thêm UI nghiệp vụ mới.

7. **BUG-007: tên vai trò.** Với QL_QUYEN, submit cũ rẽ sang /roles/:id/permissions, báo thành công nhưng không gọi metadata SP; DB TenVaiTro giữ tên cũ. Sau sửa form Vai trò chỉ PUT /roles/:id {name,description} → roleWrite → adminService.updateRole → sp_Admin_Role_Update. Gán quyền ở form riêng trong phân hệ Quyền → sp_Admin_RolePermission_Set. Không hỗ trợ gộp hai thao tác, nên không có hai request giả làm một transaction. Metadata save không đổi VAITRO_QUYEN; grant-only không đổi tên. DB reload, auth/me với JWT đã có và login lại đều thấy tên mới. Mã MaVaiTro UNIQUE trả409 khi trùng; tên rỗng/blank/>100 ký tự trả400. TenVaiTro là tên hiển thị, không UNIQUE trong baseline; không tự thêm quy tắc uniqueness cho tên.

8. **BUG-014: contract mật khẩu.** Installed bcryptjs3.0.3; README/source cục bộ xác nhận72 byte UTF-8 và khả năng truncate. Register/login đã chặn upper byte limit, Admin create dùng8–128 ký tự và trim, utility hash/compare chưa bảo vệ giới hạn. validatePassword chung dùng Buffer.byteLength(...,'utf8'); register và Admin create yêu cầu8–72 byte, login/hash/compare1–72 để giữ demo/legacy6-byte đang có. Mật khẩu không bị trim/truncate. Hash/compare từ chối đầu vào quá72 ngay cả khi gọi trực tiếp. Register bỏ minLength/maxLength theo ký tự và hiển thị giới hạn byte; Backend quyết định authoritative. Không có route change/reset password trong hệ thống hiện tại. Seed lưu hash demo cố định, helper/test dùng utility đã bảo vệ; không đổi mật khẩu cũ và không log password/hash.

9. **File và SQL thay đổi.** Backend: utils/password.js, validators/authValidator.js, adminValidator.js, managerValidator.js. Frontend: pages/ManagerPortal.jsx, AdminPortal.jsx, auth/Register.jsx, components/CinemaImageManager.jsx và utils/adminForms.js. Thêm backend/tests/r4Password.test.js, frontend/tests/r4-browser-fixtures.jsx, scripts/r4 và evidence. Harness R3B nhận output directory/fixture R4 để giữ lịch sử R3B. **Không sửa SP, function, trigger, schema hoặc seed; không cần migration/refresh manifest.** SP hiện tại đã đúng contract và đã được chứng minh bằng HTTP/SP thật. Backend tiếp tục SP-only.

10. **Kết quả riêng từng bug.** BUG004: valid create/persist PASS, extra roomId400, number0/-1/fraction/INT overflow400, duplicate position409, wrong scope403, browser exact payload PASS. BUG005: create/edit/cover PASS, old cover-in-update400, missing image404, các ảnh khác/cover được giữ đúng, browser PASS. BUG006:14 update+reload DB PASS,19 form/luồng browser PASS, cancel không mutation, resource/request/grant race PASS. BUG007: rename persisted, grants preserved, grant-only name preserved, refresh/relogin PASS; invalid400/unique-code409. BUG014:<72/=72/>72 và Unicode bytes, whitespace preservation, rejected create không có NGUOIDUNG, original-password login PASS, trimmed-prefix login401, oversized login400; hash/verify helper unit PASS. [API: 100 requests/31 DB assertions](evidence/functional-api.json); [browser: 146 checks](evidence/functional-browser.json).

11. **Backend/Frontend/build/lint.** Backend104/104; Frontend35/35; frontend production build và oxlint PASS. Build giữ warning bundle >500kB có sẵn; không mở rộng sang P2/chia bundle. No raw SQL audit PASS; procedure contracts PASS. [16-check regression suite](evidence/checks.json).

12. **Regression R1/R2.** R1 fixed-clock SQL, integration dưới UTC/Asia_Ho_Chi_Minh/America_Los_Angeles và browser timezone PASS. R2 SQL,14 integration checks/103HTTP, payment UI, hold expiry, chặn hủy khi giữ còn hạn, proportional promotion, floor1000VNĐ/điểm,12 concurrent cancels+retry, caller rollback/atomic failure và payment history/no refund PASS. Không đổi policy R1/R2 hay bảng bồi thường3NF.

13. **Regression R3 và concurrency.**270HTTP +134 direct SQL authorization probes PASS,26 browser guard/revocation checks PASS. Permission/ownership/current Manager scope và JWT cũ sau revoke/lock/role change giữ contract R3. Booking stress24 cùng ghế chỉ1 success,32 overlapping bookings không double-sell và hold-limit PASS; pricing-overlap PASS; image concurrency40 requests,0 invariant violations/500 PASS. Fixture HTTP smoke33 requests PASS.

14. **Database/reset/verify/main.** npm run db:reset trên DB tạm R4 PASS từ zero với27 bảng; fixture/main schema verify + source parity159 modules PASS. Inventory giữ27 tables,6 views,21 functions,7 triggers,125 SP; không thêm bảng/object. Main HTTP smoke31 requests PASS;2 endpoint future-show detail/seats được skip vì dữ liệu main không có suất tương lai phù hợp (đã PASS trên reset fixture). Hash cả27 bảng, schema, modules và DB grants trước/sau giống nhau; không reset main, không ghi fixture vào main. Xóa DB R4 tạm theo quyền đã cấp; inventory cuối chỉ CinemaBookingDB. [Main before](evidence/main-before.json), [after](evidence/main-after.json), [cleanup](evidence/cleanup.json), [reset log](evidence/db-reset.txt), [verify](evidence/main-db-verify.json).

15. **Kết luận: R4 PASS,5/5 bugs đã xử lý.** Không còn blocker được yêu cầu. Thay đổi application code đã nằm trong workspace dùng cấu hình DB chính; DB chính sẵn sàng và source đồng bộ, không có ALTER cần áp thêm. [Machine-readable status](R4_STATUS.json). Không xử lý findings P2/đổi nghiệp vụ ngoài scope.

Tái chạy: dựng một CinemaBookingDB_R0_R1_R2_R4... bằng npm run db:reset -- --database=...; chạy scripts/r4/integration.mjs, scripts/r2/checks.mjs với R2_EVIDENCE_DIR=audit/remediation/r4/evidence; chạy scripts/r3b/probes.mjs/browser.mjs với R3B_EVIDENCE_DIR cùng thư mục (browser R4 thêm R4_BROWSER=1); cuối cùng chạy scripts/r4/cleanup.mjs với chính xác tên DB tạm. Không dùng db:reset mặc định để kiểm thử main.
