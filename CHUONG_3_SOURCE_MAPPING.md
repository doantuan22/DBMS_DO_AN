# Đối chiếu nguồn cho Chương 3

Tài liệu này ánh xạ nội dung báo cáo với bộ script SQL và mã Backend hiện có. Đối tượng database được đối chiếu theo thứ tự chạy trong database/run-all.sql và database/build-objects.sql; danh sách thủ tục đối chiếu với tên định nghĩa trong các tệp cùng nhóm. Không có script nào được chạy trong quá trình lập tài liệu.

## 1. Cơ sở xác định phạm vi

| Nội dung | Nguồn |
|---|---|
| Thứ tự cài đặt mới | database/run-all.sql; database/build-objects.sql |
| Tạo database, collation, phiên bản tối thiểu và tùy chọn | database/00_database/002_create_database.sql; database/00_database/003_database_options.sql |
| Schema | database/01_schema/001_create_schemas.sql |
| Lớp gọi procedure, whitelist và bind tham số | backend/src/db/procedureClient.js; backend/src/db/procedures.js; backend/src/db/pool.js |
| Quyền thực thi ở Database | database/09_security/001_execute_role.sql |
| Dated migration liên quan điểm/discount | database/13_migrations/20261014_points_payment.sql |
| Kiểm tra định nghĩa và catalog bằng script (không chạy trong lượt này) | database/12_verify/verify_database.sql; các tệp database/12_verify/verify_*.sql; database/11_tests/ |
| Tài liệu định hướng, chỉ dùng để hiểu nghiệp vụ | README.md; database/README.md; Phân Tích _ Thiết Kế.md |

## 2. Số lượng và trạng thái đối chiếu

| Loại | Số lượng từ build-objects.sql | Nguồn định nghĩa |
|---|---:|---|
| Bảng | 29 | database/02_tables/*.sql |
| PRIMARY KEY | 29 | database/03_constraints/001_primary_unique.sql và ràng buộc inline của BOITHUONG_HUYSUAT |
| UNIQUE constraint | 11 | database/03_constraints/001_primary_unique.sql và ràng buộc inline của BOITHUONG_HUYSUAT |
| FOREIGN KEY | 37 | database/03_constraints/002_foreign_keys.sql và ràng buộc inline của BOITHUONG_HUYSUAT |
| CHECK | 65 | database/03_constraints/003_check_constraints.sql và ràng buộc inline của BOITHUONG_HUYSUAT |
| DEFAULT | 42 | database/03_constraints/004_defaults.sql; database/03_constraints/005_function_defaults.sql |
| Index tạo độc lập | 31 | 15 tệp trong database/04_indexes/ |
| Function | 21 | database/05_functions/*.sql |
| View | 6 | database/06_views/*.sql |
| Trigger | 9 | database/07_triggers/*.sql |
| Stored procedure | 147 | database/08_procedures/**/*.sql |

Tổng các loại ràng buộc ở trên là 184. Đếm bảng/module dựa trên các đường dẫn được include, không đếm số lần tên xuất hiện trong tài liệu cũ. Các index sinh ra để thực thi PK/UNIQUE không nằm trong 31 index tạo độc lập.

## 3. Bảng dữ liệu

Mỗi tên bảng dưới đây là tên đối tượng SQL thực tế; đường dẫn tệp dùng chữ thường theo repository.

| Đối tượng | Source |
|---|---|
| dbo.BANGGIA | database/02_tables/banggia.sql |
| dbo.BOITHUONG_HUYSUAT | database/02_tables/boithuong_huysuat.sql |
| dbo.CHITIETDOAN | database/02_tables/chitietdoan.sql |
| dbo.CHITIETVE | database/02_tables/chitietve.sql |
| dbo.DANHGIAPHIM | database/02_tables/danhgiaphim.sql |
| dbo.DIENVIEN | database/02_tables/dienvien.sql |
| dbo.DONDATVE | database/02_tables/dondatve.sql |
| dbo.GHE | database/02_tables/ghe.sql |
| dbo.HINHANH_RAPCHIEUPHIM | database/02_tables/hinhanh_rapchieuphim.sql |
| dbo.HOSOKHACHHANG | database/02_tables/hosokhachhang.sql |
| dbo.KHIEUNAI | database/02_tables/khieunai.sql |
| dbo.KHUYENMAI | database/02_tables/khuyenmai.sql |
| dbo.NGUOIDUNG | database/02_tables/nguoidung.sql |
| dbo.PHANCONG_RAP | database/02_tables/phancong_rap.sql |
| dbo.PHIM | database/02_tables/phim.sql |
| dbo.PHIM_DIENVIEN | database/02_tables/phim_dienvien.sql |
| dbo.PHIM_THELOAI | database/02_tables/phim_theloai.sql |
| dbo.PHONGCHIEU | database/02_tables/phongchieu.sql |
| dbo.QUYEN | database/02_tables/quyen.sql |
| dbo.RAPCHIEUPHIM | database/02_tables/rapchieuphim.sql |
| dbo.SANPHAM | database/02_tables/sanpham.sql |
| dbo.SUATCHIEU | database/02_tables/suatchieu.sql |
| dbo.THANHTOAN | database/02_tables/thanhtoan.sql |
| dbo.THELOAI | database/02_tables/theloai.sql |
| dbo.TINNHAN_KHIEUNAI | database/02_tables/tinnhan_khieunai.sql |
| dbo.VAITRO | database/02_tables/vaitro.sql |
| dbo.VAITRO_QUYEN | database/02_tables/vaitro_quyen.sql |
| dbo.XULY_KHIEUNAI | database/02_tables/xuly_khieunai.sql |
| dbo.YEUCAU_CHUYENCAP | database/02_tables/yeucau_chuyencap.sql |

Các tệp constraint dùng chung được đưa vào báo cáo: database/03_constraints/001_primary_unique.sql, database/03_constraints/002_foreign_keys.sql, database/03_constraints/003_check_constraints.sql, database/03_constraints/004_defaults.sql, database/03_constraints/005_function_defaults.sql. BOITHUONG_HUYSUAT bổ sung PK_BOITHUONG_HUYSUAT, UQ_BOITHUONG_HUYSUAT_Don, FK_BOITHUONG_HUYSUAT_Don và CK_BOITHUONG_HUYSUAT_Diem ngay trong tệp tạo bảng.

## 4. Index

Các object trong báo cáo thuộc 31 lệnh CREATE INDEX tại các source sau. Mỗi tệp có tên bảng ở tên tệp và định nghĩa index tương ứng:

- database/04_indexes/banggia.sql
- database/04_indexes/chitietve.sql
- database/04_indexes/dondatve.sql
- database/04_indexes/ghe.sql
- database/04_indexes/hinhanh_rapchieuphim.sql
- database/04_indexes/khieunai.sql
- database/04_indexes/nguoidung.sql
- database/04_indexes/phancong_rap.sql
- database/04_indexes/phim.sql
- database/04_indexes/phongchieu.sql
- database/04_indexes/suatchieu.sql
- database/04_indexes/thanhtoan.sql
- database/04_indexes/tinnhan_khieunai.sql
- database/04_indexes/xuly_khieunai.sql
- database/04_indexes/yeucau_chuyencap.sql

## 5. Function, view và trigger

| Đối tượng | Tệp định nghĩa |
|---|---|
| dbo.fn_BayGio | database/05_functions/fn_BayGio.sql |
| dbo.fn_DanhSachGheSuatChieu | database/05_functions/fn_DanhSachGheSuatChieu.sql |
| dbo.fn_DonDangGiuGhe | database/05_functions/fn_DonDangGiuGhe.sql |
| dbo.fn_GheCoVeHieuLucSuatTuongLai | database/05_functions/fn_GheCoVeHieuLucSuatTuongLai.sql |
| dbo.fn_GioiHanDonDangGiu | database/05_functions/fn_GioiHanDonDangGiu.sql |
| dbo.fn_GioiHanGheMoiDon | database/05_functions/fn_GioiHanGheMoiDon.sql |
| dbo.fn_GioiHanGiamGiaPhanTram | database/05_functions/fn_GioiHanGiamGiaPhanTram.sql |
| dbo.fn_GioiHanSoLuongSanPham | database/05_functions/fn_GioiHanSoLuongSanPham.sql |
| dbo.fn_GioRap | database/05_functions/fn_GioRap.sql |
| dbo.fn_HomNay | database/05_functions/fn_HomNay.sql |
| dbo.fn_KiemTraQuanLyRapScope | database/05_functions/fn_KiemTraQuanLyRapScope.sql |
| dbo.fn_KiemTraQuyenNguoiDung | database/05_functions/fn_KiemTraQuyenNguoiDung.sql |
| dbo.fn_NgayKinhDoanh | database/05_functions/fn_NgayKinhDoanh.sql |
| dbo.fn_ThoiGianGiaHanThanhToanPhut | database/05_functions/fn_ThoiGianGiaHanThanhToanPhut.sql |
| dbo.fn_ThoiGianGiuChoPhut | database/05_functions/fn_ThoiGianGiuChoPhut.sql |
| dbo.fn_TinhBoiThuongVe | database/05_functions/fn_TinhBoiThuongVe.sql |
| dbo.fn_TinhGiaVe | database/05_functions/fn_TinhGiaVe.sql |
| dbo.fn_TinhTongTienDoAn | database/05_functions/fn_TinhTongTienDoAn.sql |
| dbo.fn_TinhTongTienDon | database/05_functions/fn_TinhTongTienDon.sql |
| dbo.fn_TinhTongTienVe | database/05_functions/fn_TinhTongTienVe.sql |
| dbo.fn_UtcTuGioRap | database/05_functions/fn_UtcTuGioRap.sql |
| dbo.vw_ChiTietDonDatVe | database/06_views/vw_ChiTietDonDatVe.sql |
| dbo.vw_DanhSachKhieuNai | database/06_views/vw_DanhSachKhieuNai.sql |
| dbo.vw_DoanhThuTheoRap | database/06_views/vw_DoanhThuTheoRap.sql |
| dbo.vw_LichChieuChiTiet | database/06_views/vw_LichChieuChiTiet.sql |
| dbo.vw_LichSuDatVe | database/06_views/vw_LichSuDatVe.sql |
| dbo.vw_ThongKePhim | database/06_views/vw_ThongKePhim.sql |
| dbo.TRG_BangGia_KiemTraChongLan | database/07_triggers/TRG_BangGia_KiemTraChongLan.sql |
| dbo.TRG_ChiTietVe_KiemTraGheDungPhong | database/07_triggers/TRG_ChiTietVe_KiemTraGheDungPhong.sql |
| dbo.TRG_ChiTietVe_KiemTraTrungGhe | database/07_triggers/TRG_ChiTietVe_KiemTraTrungGhe.sql |
| dbo.TRG_DanhGia_KiemTraDaXemPhim | database/07_triggers/TRG_DanhGia_KiemTraDaXemPhim.sql |
| dbo.TRG_KhieuNai_NhanVienPhuTrachBatBien | database/07_triggers/TRG_KhieuNai_NhanVienPhuTrachBatBien.sql |
| dbo.TRG_NguoiDung_VaiTroBatBien | database/07_triggers/TRG_NguoiDung_VaiTroBatBien.sql |
| dbo.TRG_SuatChieu_KiemTraTrungLich | database/07_triggers/TRG_SuatChieu_KiemTraTrungLich.sql |
| dbo.TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai | database/07_triggers/TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai.sql |
| dbo.TRG_XuLyKhieuNai_KiemTraVaiTro | database/07_triggers/TRG_XuLyKhieuNai_KiemTraVaiTro.sql |

## 6. Stored procedure

Mỗi procedure dưới đây được định nghĩa trong tệp cùng tên tại thư mục được ghi ở cột Source. Danh sách phản ánh các tệp được include trong build-objects.sql; các alias và thủ tục từ chối thao tác được giữ lại trong số liệu.

| Nhóm | Object được đưa vào đối chiếu | Source |
|---|---|---|
| Admin (63) | sp_Admin_Actor_Create, sp_Admin_Actor_Delete, sp_Admin_Actor_List, sp_Admin_Actor_Update, sp_Admin_Assignment_Create, sp_Admin_Assignment_List, sp_Admin_Cinema_Create, sp_Admin_Cinema_Delete, sp_Admin_Cinema_Update, sp_Admin_Dashboard, sp_Admin_Genre_Create, sp_Admin_Genre_Delete, sp_Admin_Genre_List, sp_Admin_Genre_Update, sp_Admin_Movie_Create, sp_Admin_Movie_Delete, sp_Admin_Movie_Update, sp_Admin_MovieActor_Set, sp_Admin_Permission_Create, sp_Admin_Permission_Delete, sp_Admin_Permission_List, sp_Admin_Permission_Update, sp_Admin_Product_Create, sp_Admin_Product_Delete, sp_Admin_Product_Update, sp_Admin_Promotion_Create, sp_Admin_Promotion_Delete, sp_Admin_Promotion_List, sp_Admin_Promotion_Update, sp_Admin_Report_Revenue, sp_Admin_Role_Create, sp_Admin_Role_Delete, sp_Admin_Role_List, sp_Admin_Role_Update, sp_Admin_RolePermission_Set, sp_Admin_User_Create, sp_Admin_User_List, sp_Admin_User_UpdateStatus, usp_Admin_Assignment_Update, usp_Admin_Cinema_List, usp_Admin_CinemaImage_Create, usp_Admin_CinemaImage_Delete, usp_Admin_CinemaImage_List, usp_Admin_CinemaImage_SetCover, usp_Admin_CinemaImage_Update, usp_Admin_Movie_List, usp_Admin_Pricing_Create, usp_Admin_Pricing_List, usp_Admin_Pricing_Update, usp_Admin_Product_List, usp_Admin_RolePermission_List, usp_Admin_Room_Create, usp_Admin_Room_Delete, usp_Admin_Room_List, usp_Admin_Room_Update, usp_Admin_Seat_Create, usp_Admin_Seat_Delete, usp_Admin_Seat_List, usp_Admin_Seat_Update, usp_Admin_Showtime_Cancel, usp_Admin_Showtime_Create, usp_Admin_Showtime_List, usp_Admin_Showtime_Update | database/08_procedures/admin/<tên object>.sql |
| Auth (7) | sp_Auth_Login, sp_Auth_RegisterCustomer, sp_RBAC_GetPermissionsByUser, sp_User_ChangePassword, sp_User_GetCurrent, sp_User_GetPasswordHash, sp_User_UpdateProfile | database/08_procedures/auth/<tên object>.sql |
| Booking (2) | sp_Booking_Create, sp_DatVe | database/08_procedures/booking/<tên object>.sql |
| Customer (9) | sp_Complaint_Create, sp_Complaint_GetByCustomer, sp_Complaint_ListByCustomer, sp_Order_Cancel, sp_Order_ExpirePending, sp_Order_GetDetailByCustomer, sp_Order_ListByCustomer, sp_Review_Create, sp_Review_ListByMovie | database/08_procedures/customer/<tên object>.sql |
| Manager (19) | sp_Manager_Dashboard, sp_Manager_ListAssignedCinemas, sp_Manager_Pricing_Create, sp_Manager_Pricing_List, sp_Manager_Pricing_Update, sp_Manager_Revenue, sp_Manager_Room_Create, sp_Manager_Room_Delete, sp_Manager_Room_List, sp_Manager_Room_Update, sp_Manager_Seat_BatchCreate, sp_Manager_Seat_Create, sp_Manager_Seat_Delete, sp_Manager_Seat_ListByRoom, sp_Manager_Seat_Update, sp_Manager_Showtime_Cancel, sp_Manager_Showtime_Create, sp_Manager_Showtime_List, sp_Manager_Showtime_Update | database/08_procedures/manager/<tên object>.sql |
| Payment (3) | sp_Payment_CreateAttempt, sp_Payment_UpdateResult, sp_XuLyThanhToan | database/08_procedures/payment/<tên object>.sql |
| Public (10) | sp_Cinema_GetImages, sp_Cinema_List, sp_Genre_List, sp_Movie_GetDetail, sp_Movie_List, sp_Product_ListActive, sp_Promotion_Validate, sp_Seat_ListByShowtime, sp_Showtime_GetDetail, sp_Showtime_ListByMovie | database/08_procedures/public/<tên object>.sql |
| Staff booking (9) | sp_StaffBooking_Authorize, sp_StaffBooking_Cancel, sp_StaffBooking_Create, sp_StaffBooking_Customers, sp_StaffBooking_Detail, sp_StaffBooking_List, sp_StaffBooking_LockShow, sp_StaffBooking_Options, sp_StaffBooking_UpdateSeats | database/08_procedures/staff_booking/<tên object>.sql |
| Support (19) | sp_Complaint_Assign_Admin, sp_Complaint_Assign_Self, sp_Complaint_Chat_AddInternalNote, sp_Complaint_Chat_List, sp_Complaint_Chat_Send, sp_Complaint_Unassigned_List, sp_Escalation_Claim, sp_Escalation_Create, sp_Escalation_GetDetail, sp_Escalation_List_Admin, sp_Escalation_List_CSKH, sp_Escalation_Process, sp_Support_Complaint_AddProcessing, sp_Support_Complaint_GetDetail, sp_Support_Complaint_GetOrderReference, sp_Support_Complaint_List, sp_Support_Complaint_UpdateStatus, sp_Support_Customer_GetPoints, sp_XuLyKhieuNai | database/08_procedures/support/<tên object>.sql |
| System (6) | sp_Clock_GetNow, sp_PhanCongQuanLyRap, sp_Showtime_CancelCascade, sp_Showtime_ValidateTimes, sp_System_HealthCheck, sp_ThemSuatChieu | database/08_procedures/system/<tên object>.sql |

## 7. Kiểm tra và thông tin chưa xác minh

- Không có kết nối nào mở tới SQL Server và không đọc catalog của cơ sở dữ liệu đang chạy. Do đó trạng thái của từng môi trường triển khai chưa được xác minh; kết luận trong Chương 3 mô tả build sạch từ source hiện hành.
- database/run-all.sql gọi database/build-objects.sql, seed và verify. Không có dòng include database/13_migrations/20261014_points_payment.sql. Tệp migration được giữ như bản nâng cấp cho schema cũ; các định nghĩa canonical hiện có đã chứa DONDATVE.DiemSuDung, CK_DONDATVE_DiemSuDung, quy tắc tổng giảm cập nhật và giá trị DIEM trong CK_THANHTOAN_PhuongThuc. Không thể suy ra database đang chạy đã nhận migration chỉ từ source.
- database/README.md ghi 27 bảng, 134 procedure và 8 trigger; build-objects.sql hiện include 29 bảng, 147 procedure và 9 trigger. database/baseline-manifest.json ghi provenance ngày 2026-10-13 và mô tả thứ tự build cũ, trước các include hiện có của TINNHAN_KHIEUNAI, YEUCAU_CHUYENCAP và các procedure bổ sung. Số liệu Chương 3 được đếm từ include hiện tại thay vì các con số tài liệu cũ.
- Phân Tích _ Thiết Kế.md còn các số lượng schema lịch sử và mô tả chung về tầng dữ liệu. Tài liệu này chỉ được dùng để hiểu mục tiêu nghiệp vụ; không dùng để xác định object hoặc số lượng hiện hành.
- Các tệp test/verify là bằng chứng về hợp đồng kiểm tra được viết trong repository, không phải kết quả chạy trong lượt này. Không có kết quả kiểm thử, benchmark hay execution plan mới được khẳng định.
- Các báo cáo và tệp ERD cũ dưới docs/report xuất hiện là file bị xóa trong trạng thái làm việc hiện tại nên không dùng làm căn cứ và không được khôi phục.
