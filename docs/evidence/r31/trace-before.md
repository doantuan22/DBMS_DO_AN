# Trace trước implementation R3.1

Đối chiếu ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md, R3.1 và source được lưu tại before-source.

1. Writer trực tiếp duy nhất: dbo.sp_Admin_MovieActor_Set DELETE/INSERT PHIM_DIENVIEN. Movie Delete và Actor Delete có FK cascade; không có trigger trên association trong production.
2. Procedure nhận ActorID (authenticated Admin identity), PhimID INT, DanhSachJson NVARCHAR(MAX). JSON SQL là [{DienVienID,VaiDien}], HTTP là {cast:[{actorId,role}]}.
3. OPENJSON WITH ép DienVienID INT, VaiDien NVARCHAR(150) trước validation; có thể convert/truncate.
4. Không validate toàn bộ references. INNER JOIN DIENVIEN bỏ qua IDs thiếu.
5. GROUP BY DienVienID/MAX(VaiDien) âm thầm gộp duplicates. PK association (PhimID,DienVienID) chỉ cho một diễn viên/một phim.
6. Toàn IDs sai: xóa cast rồi success với cast rỗng.
7. Một ID sai: success danh sách thiếu, cast cũ mất.
8. Phim thiếu: THROW 50102 trước transaction nhưng chưa lock parent.
9. [] = clear cast. SQL NULL/invalid JSON reject50103. HTTP null/omitted cast reject400. UI blank hiện bị ||'[]' chuyển thành clear cast, cần sửa đúng phạm vi.
10. XACT_ABORT ON + TRY/CATCH tồn tại; BEGIN/COMMIT không xét caller, CATCH rollback toàn caller. Các phase đã nghiệm thu dùng own/savepoint/XACT_STATE.
11. PUT /api/admin/movies/:movieId/actors -> adminController.setMovieActors -> adminService.setMovieActors -> fixed ADMIN_MOVIE_ACTOR_SET whitelist -> procedureClient typed .execute(). Không có writer thay cast khác. Movie Create/Update chỉ ghi PHIM/PHIM_THELOAI.
12. VaiDien NVARCHAR(150) nullable, không enum/CHECK/NOT NULL. SQL NULL/omitted role từng hợp lệ; HTTP yêu cầu role string <=150 UTF-16 units, cho phép string rỗng. Giữ cả hai layer contracts. Không thêm rule vai diễn.
13. Router authenticate loads current DB user, requireAdmin, requirePermission QL_DANHMUC_PHIM. Procedure kiểm tra active user, role ADMIN, permission50300/50301/50302 trước dữ liệu. Không tin identity trong payload.
14. Service đã map50100 ACTOR_NOT_FOUND404 nhưng cast writer chưa THROW nó; JOIN có thể trả200. 50102 MOVIE_NOT_FOUND404,50103 MOVIE_CAST_INVALID400; constraints547/2627 có mapping an toàn. Duplicate sẽ dùng50103 hiện hữu.
15. Controller trả {actors:[{PhimID,DienVienID,HoTen,VaiDien}]}; frontend chờ request hoàn tất rồi thông báo/reload movies. GET admin movies đọc DanhSachDienVienJson(actorId,role). sp_Movie_GetDetail recordset3 đọc actors; giữ các cấu trúc này. Capture result dưới lock trước commit để tránh response bị replacement kế tiếp thay đổi.

PHIM/DIENVIEN có identity INT PK; PHIM_DIENVIEN có composite clustered PK và hai FK ON DELETE CASCADE hiện hữu. Không đổi schema, FK hay table. Actor Delete hiện check association ngoài transaction; cần lock DIENVIEN X trước check trong own/savepoint transaction để chặn check-before-insert race. Replacement giữ actor S/HOLDLOCK và movie U/HOLDLOCK; Actor Delete X chờ validation/commit, sau đó thấy association và reject50101. Actor Delete thắng trước thì replacement reject50100 trước DELETE. Movie Delete hiện hữu được FK/parent lock serialize.

Tests hiện hữu: adminService/admin routes/auth/typed contract/error coverage, frontend AdminPortal SSR; no-SQL audit và full accepted R1/R2 runners. R3.1 bổ sung DB committed snapshots, strict JSON negatives, failure trigger sau DELETE, outer transaction cases, real HTTP GET và hai SQL sessions với DMV lock evidence. Accepted evidence được hash trước thay đổi, mọi replay output chuyển vào r31.
