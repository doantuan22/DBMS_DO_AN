# Permission Matrix R8

118 endpoints, 104 protected, 14 public. Role is actor eligibility; every listed permission is required (AND). Current account/permission/scope is read on each request. Customer own reads require ownership, with no write permission. XEM_PHIM stays in the catalog and is NOT ENFORCED on public catalog. The JSON includes BE/DB parity checks and source traces.

| Actor | Operation | Permissions (AND) | SP | FE guard |
| --- | --- | --- | --- | --- |
| PUBLIC | GET /api/health | PUBLIC |  | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | GET /api/health/db | PUBLIC | dbo.sp_System_HealthCheck | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | POST /api/auth/register | PUBLIC | dbo.sp_Auth_RegisterCustomer | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | POST /api/auth/login | PUBLIC | dbo.sp_Auth_Login | PUBLIC; XEM_PHIM NOT ENFORCED |
| Mọi tài khoản hoạt động | GET /api/auth/me | Role/identity + owner/scope where applicable | dbo.sp_User_GetCurrent, dbo.sp_RBAC_GetPermissionsByUser | Active authenticated user |
| Mọi tài khoản hoạt động | PUT /api/auth/me | Role/identity + owner/scope where applicable | dbo.sp_User_UpdateProfile, dbo.sp_User_GetCurrent, dbo.sp_RBAC_GetPermissionsByUser | Active authenticated user |
| Mọi tài khoản hoạt động | GET /api/auth/permissions | Role/identity + owner/scope where applicable | dbo.sp_User_GetCurrent, dbo.sp_RBAC_GetPermissionsByUser | Active authenticated user |
| PUBLIC | GET /api/movies | PUBLIC | dbo.sp_Movie_List | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | GET /api/movies/:movieId/showtimes | PUBLIC | dbo.sp_Showtime_ListByMovie | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | GET /api/movies/:movieId/reviews | PUBLIC | dbo.sp_Review_ListByMovie | PUBLIC; XEM_PHIM NOT ENFORCED |
| KHACH_HANG | POST /api/movies/:movieId/reviews | DANH_GIA | dbo.sp_Review_Create | KHACH_HANG area; exact action guards; own history has no write permission |
| PUBLIC | GET /api/movies/:movieId | PUBLIC | dbo.sp_Movie_GetDetail | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | GET /api/cinemas | PUBLIC | dbo.sp_Cinema_List | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | GET /api/cinemas/:cinemaId/images | PUBLIC | dbo.sp_Cinema_GetImages | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | GET /api/genres | PUBLIC | dbo.sp_Genre_List | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | GET /api/showtimes/:showtimeId/seats | PUBLIC | dbo.sp_Seat_ListByShowtime | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | GET /api/showtimes/:showtimeId | PUBLIC | dbo.sp_Showtime_GetDetail | PUBLIC; XEM_PHIM NOT ENFORCED |
| PUBLIC | GET /api/products | PUBLIC | dbo.sp_Product_ListActive | PUBLIC; XEM_PHIM NOT ENFORCED |
| KHACH_HANG | POST /api/promotions/validate | DAT_VE | dbo.sp_Seat_ListByShowtime, dbo.sp_Product_ListActive, dbo.sp_Promotion_Validate | KHACH_HANG area; exact action guards; own history has no write permission |
| KHACH_HANG | POST /api/bookings | DAT_VE | dbo.sp_Booking_Create | KHACH_HANG area; exact action guards; own history has no write permission |
| KHACH_HANG | GET /api/orders | Role/identity + owner/scope where applicable | dbo.sp_Order_ListByCustomer | KHACH_HANG area; exact action guards; own history has no write permission |
| KHACH_HANG | GET /api/orders/:orderId | Role/identity + owner/scope where applicable | dbo.sp_Order_GetDetailByCustomer | KHACH_HANG area; exact action guards; own history has no write permission |
| KHACH_HANG | POST /api/orders/:orderId/payments | THANH_TOAN | dbo.sp_Order_GetDetailByCustomer, dbo.sp_Payment_CreateAttempt | KHACH_HANG area; exact action guards; own history has no write permission |
| KHACH_HANG | POST /api/orders/:orderId/payments/:paymentId/result | THANH_TOAN | dbo.sp_Order_GetDetailByCustomer, dbo.sp_Payment_UpdateResult | KHACH_HANG area; exact action guards; own history has no write permission |
| KHACH_HANG | GET /api/complaints | Role/identity + owner/scope where applicable | dbo.sp_Complaint_ListByCustomer | KHACH_HANG area; exact action guards; own history has no write permission |
| KHACH_HANG | POST /api/complaints | GUI_KHIEU_NAI | dbo.sp_Complaint_Create | KHACH_HANG area; exact action guards; own history has no write permission |
| KHACH_HANG | GET /api/complaints/:complaintId | Role/identity + owner/scope where applicable | dbo.sp_Complaint_GetByCustomer | KHACH_HANG area; exact action guards; own history has no write permission |
| QUAN_LY_RAP | GET /api/manager/cinemas | Role/identity + owner/scope where applicable | dbo.sp_Manager_ListAssignedCinemas | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | GET /api/manager/cinemas/:cinemaId/rooms | QL_PHONG | dbo.sp_Manager_Room_List | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | POST /api/manager/cinemas/:cinemaId/rooms | QL_PHONG | dbo.sp_Manager_Room_Create | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | PUT /api/manager/rooms/:roomId | QL_PHONG | dbo.sp_Manager_Room_Update | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | DELETE /api/manager/rooms/:roomId | QL_PHONG | dbo.sp_Manager_Room_Delete | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | GET /api/manager/rooms/:roomId/seats | QL_GHE | dbo.sp_Manager_Seat_ListByRoom | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | POST /api/manager/rooms/:roomId/seats | QL_GHE | dbo.sp_Manager_Seat_Create | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | PUT /api/manager/seats/:seatId | QL_GHE | dbo.sp_Manager_Seat_Update | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | DELETE /api/manager/seats/:seatId | QL_GHE | dbo.sp_Manager_Seat_Delete | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | GET /api/manager/cinemas/:cinemaId/showtimes | QL_SUAT_CHIEU | dbo.sp_Manager_Showtime_List | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | POST /api/manager/showtimes | QL_SUAT_CHIEU | dbo.sp_Manager_Showtime_Create | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | PUT /api/manager/showtimes/:showtimeId | QL_SUAT_CHIEU | dbo.sp_Manager_Showtime_Update | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | POST /api/manager/showtimes/:showtimeId/cancel | QL_SUAT_CHIEU | dbo.sp_Manager_Showtime_Cancel | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | GET /api/manager/cinemas/:cinemaId/pricing | QL_BANG_GIA | dbo.sp_Manager_Pricing_List | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | POST /api/manager/cinemas/:cinemaId/pricing | QL_BANG_GIA | dbo.sp_Manager_Pricing_Create | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | PUT /api/manager/pricing/:pricingId | QL_BANG_GIA | dbo.sp_Manager_Pricing_Update | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | GET /api/manager/cinemas/:cinemaId/dashboard | XEM_BAO_CAO_RAP | dbo.sp_Manager_Dashboard | QUAN_LY_RAP area; per-section load/action, current assignment |
| QUAN_LY_RAP | GET /api/manager/cinemas/:cinemaId/revenue | XEM_BAO_CAO_RAP | dbo.sp_Manager_Revenue | QUAN_LY_RAP area; per-section load/action, current assignment |
| CSKH | GET /api/support/complaints | QL_KHIEUNAI | dbo.sp_Support_Complaint_List | CSKH + QL read; process QL+XULY; reference QL+TRA |
| CSKH | GET /api/support/complaints/:complaintId | QL_KHIEUNAI | dbo.sp_Support_Complaint_GetDetail | CSKH + QL read; process QL+XULY; reference QL+TRA |
| CSKH | GET /api/support/complaints/:complaintId/order-reference | QL_KHIEUNAI + TRA_CUU_DON | dbo.sp_Support_Complaint_GetOrderReference | CSKH + QL read; process QL+XULY; reference QL+TRA |
| CSKH | POST /api/support/complaints/:complaintId/processings | QL_KHIEUNAI + XULY_KHIEUNAI | dbo.sp_Support_Complaint_AddProcessing | CSKH + QL read; process QL+XULY; reference QL+TRA |
| CSKH | PUT /api/support/complaints/:complaintId/status | QL_KHIEUNAI + XULY_KHIEUNAI | dbo.sp_Support_Complaint_UpdateStatus | CSKH + QL read; process QL+XULY; reference QL+TRA |
| ADMIN | GET /api/admin/dashboard | XEM_BAO_CAO_TOANHE | dbo.sp_Admin_Dashboard | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/users | QL_NGUOIDUNG | dbo.sp_Admin_User_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/users | QL_NGUOIDUNG | dbo.sp_Admin_User_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/users/:userId/status | QL_NGUOIDUNG | dbo.sp_Admin_User_UpdateStatus | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/roles | QL_VAITRO | dbo.sp_Admin_Role_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/roles/:roleId/permissions | QL_QUYEN | dbo.usp_Admin_RolePermission_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/roles | QL_VAITRO | dbo.sp_Admin_Role_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/roles/:roleId | QL_VAITRO | dbo.sp_Admin_Role_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/roles/:roleId | QL_VAITRO | dbo.sp_Admin_Role_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/permissions | QL_QUYEN | dbo.sp_Admin_Permission_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/permissions | QL_QUYEN | dbo.sp_Admin_Permission_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/permissions/:permissionId | QL_QUYEN | dbo.sp_Admin_Permission_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/permissions/:permissionId | QL_QUYEN | dbo.sp_Admin_Permission_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/roles/:roleId/permissions | QL_QUYEN | dbo.sp_Admin_RolePermission_Set | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/assignments | PHANCONG_RAP | dbo.sp_Admin_Assignment_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/assignments | PHANCONG_RAP | dbo.sp_Admin_Assignment_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/assignments/:assignmentId | PHANCONG_RAP | dbo.usp_Admin_Assignment_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/cinemas | QL_RAP | dbo.usp_Admin_Cinema_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/cinemas | QL_RAP | dbo.sp_Admin_Cinema_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/cinemas/:cinemaId | QL_RAP | dbo.sp_Admin_Cinema_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/cinemas/:cinemaId | QL_RAP | dbo.sp_Admin_Cinema_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/cinemas/:cinemaId/images | QL_RAP | dbo.usp_Admin_CinemaImage_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/cinemas/:cinemaId/images | QL_RAP | dbo.usp_Admin_CinemaImage_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/cinemas/:cinemaId/images/:imageId | QL_RAP | dbo.usp_Admin_CinemaImage_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/cinemas/:cinemaId/images/:imageId | QL_RAP | dbo.usp_Admin_CinemaImage_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PATCH /api/admin/cinemas/:cinemaId/images/:imageId/cover | QL_RAP | dbo.usp_Admin_CinemaImage_SetCover | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/rooms | QL_PHONG | dbo.usp_Admin_Room_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/rooms | QL_PHONG | dbo.usp_Admin_Room_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/rooms/:roomId | QL_PHONG | dbo.usp_Admin_Room_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/rooms/:roomId | QL_PHONG | dbo.usp_Admin_Room_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/seats | QL_GHE | dbo.usp_Admin_Seat_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/seats | QL_GHE | dbo.usp_Admin_Seat_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/seats/:seatId | QL_GHE | dbo.usp_Admin_Seat_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/seats/:seatId | QL_GHE | dbo.usp_Admin_Seat_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/pricing | QL_BANG_GIA | dbo.usp_Admin_Pricing_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/pricing | QL_BANG_GIA | dbo.usp_Admin_Pricing_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/pricing/:pricingId | QL_BANG_GIA | dbo.usp_Admin_Pricing_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/showtimes | QL_SUAT_CHIEU | dbo.usp_Admin_Showtime_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/showtimes | QL_SUAT_CHIEU | dbo.usp_Admin_Showtime_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/showtimes/:showtimeId | QL_SUAT_CHIEU | dbo.usp_Admin_Showtime_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/showtimes/:showtimeId/cancel | QL_SUAT_CHIEU | dbo.usp_Admin_Showtime_Cancel | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/movies | QL_DANHMUC_PHIM | dbo.usp_Admin_Movie_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/movies | QL_DANHMUC_PHIM | dbo.sp_Admin_Movie_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/movies/:movieId | QL_DANHMUC_PHIM | dbo.sp_Admin_Movie_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/movies/:movieId | QL_DANHMUC_PHIM | dbo.sp_Admin_Movie_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/movies/:movieId/actors | QL_DANHMUC_PHIM | dbo.sp_Admin_MovieActor_Set | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/genres | QL_THELOAI | dbo.sp_Admin_Genre_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/genres | QL_THELOAI | dbo.sp_Admin_Genre_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/genres/:genreId | QL_THELOAI | dbo.sp_Admin_Genre_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/genres/:genreId | QL_THELOAI | dbo.sp_Admin_Genre_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/actors | QL_DANHMUC_PHIM | dbo.sp_Admin_Actor_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/actors | QL_DANHMUC_PHIM | dbo.sp_Admin_Actor_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/actors/:actorId | QL_DANHMUC_PHIM | dbo.sp_Admin_Actor_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/actors/:actorId | QL_DANHMUC_PHIM | dbo.sp_Admin_Actor_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/products | QL_SANPHAM | dbo.usp_Admin_Product_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/products | QL_SANPHAM | dbo.sp_Admin_Product_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/products/:productId | QL_SANPHAM | dbo.sp_Admin_Product_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/products/:productId | QL_SANPHAM | dbo.sp_Admin_Product_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/promotions | QL_KHUYENMAI | dbo.sp_Admin_Promotion_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/promotions | QL_KHUYENMAI | dbo.sp_Admin_Promotion_Create | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/promotions/:promotionId | QL_KHUYENMAI | dbo.sp_Admin_Promotion_Update | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | DELETE /api/admin/promotions/:promotionId | QL_KHUYENMAI | dbo.sp_Admin_Promotion_Delete | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/reports/revenue | XEM_BAO_CAO_TOANHE | dbo.sp_Admin_Report_Revenue | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/complaints | QL_KHIEUNAI | dbo.sp_Support_Complaint_List | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/complaints/:complaintId | QL_KHIEUNAI | dbo.sp_Support_Complaint_GetDetail | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | GET /api/admin/complaints/:complaintId/order-reference | QL_KHIEUNAI + TRA_CUU_DON | dbo.sp_Support_Complaint_GetOrderReference | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | POST /api/admin/complaints/:complaintId/processings | QL_KHIEUNAI + XULY_KHIEUNAI | dbo.sp_Support_Complaint_AddProcessing | ADMIN area; per-section/action exact permission; first permitted tab |
| ADMIN | PUT /api/admin/complaints/:complaintId/status | QL_KHIEUNAI + XULY_KHIEUNAI | dbo.sp_Support_Complaint_UpdateStatus | ADMIN area; per-section/action exact permission; first permitted tab |
