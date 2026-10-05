# Current API routes

[Exact permission/SQL matrix](PERMISSION_MATRIX.md), [structured route inventory](API_ROUTE_INVENTORY.json). 118 endpoints: 104 protected, 14 public. Source route and SQL guards revalidated in R8; no routes changed.

| Method | Path | Actor | Auth | Permissions AND |
| --- | --- | --- | --- | --- |
| GET | /api/health | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| GET | /api/health/db | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| POST | /api/auth/register | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| POST | /api/auth/login | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| GET | /api/auth/me | Mọi tài khoản hoạt động | JWT/current identity | Identity/role/ownership/scope where applicable |
| PUT | /api/auth/me | Mọi tài khoản hoạt động | JWT/current identity | Identity/role/ownership/scope where applicable |
| GET | /api/auth/permissions | Mọi tài khoản hoạt động | JWT/current identity | Identity/role/ownership/scope where applicable |
| GET | /api/movies | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| GET | /api/movies/:movieId/showtimes | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| GET | /api/movies/:movieId/reviews | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| POST | /api/movies/:movieId/reviews | KHACH_HANG | JWT/current identity | DANH_GIA |
| GET | /api/movies/:movieId | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| GET | /api/cinemas | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| GET | /api/cinemas/:cinemaId/images | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| GET | /api/genres | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| GET | /api/showtimes/:showtimeId/seats | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| GET | /api/showtimes/:showtimeId | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| GET | /api/products | PUBLIC | PUBLIC | Identity/role/ownership/scope where applicable |
| POST | /api/promotions/validate | KHACH_HANG | JWT/current identity | DAT_VE |
| POST | /api/bookings | KHACH_HANG | JWT/current identity | DAT_VE |
| GET | /api/orders | KHACH_HANG | JWT/current identity | Identity/role/ownership/scope where applicable |
| GET | /api/orders/:orderId | KHACH_HANG | JWT/current identity | Identity/role/ownership/scope where applicable |
| POST | /api/orders/:orderId/payments | KHACH_HANG | JWT/current identity | THANH_TOAN |
| POST | /api/orders/:orderId/payments/:paymentId/result | KHACH_HANG | JWT/current identity | THANH_TOAN |
| GET | /api/complaints | KHACH_HANG | JWT/current identity | Identity/role/ownership/scope where applicable |
| POST | /api/complaints | KHACH_HANG | JWT/current identity | GUI_KHIEU_NAI |
| GET | /api/complaints/:complaintId | KHACH_HANG | JWT/current identity | Identity/role/ownership/scope where applicable |
| GET | /api/manager/cinemas | QUAN_LY_RAP | JWT/current identity | Identity/role/ownership/scope where applicable |
| GET | /api/manager/cinemas/:cinemaId/rooms | QUAN_LY_RAP | JWT/current identity | QL_PHONG |
| POST | /api/manager/cinemas/:cinemaId/rooms | QUAN_LY_RAP | JWT/current identity | QL_PHONG |
| PUT | /api/manager/rooms/:roomId | QUAN_LY_RAP | JWT/current identity | QL_PHONG |
| DELETE | /api/manager/rooms/:roomId | QUAN_LY_RAP | JWT/current identity | QL_PHONG |
| GET | /api/manager/rooms/:roomId/seats | QUAN_LY_RAP | JWT/current identity | QL_GHE |
| POST | /api/manager/rooms/:roomId/seats | QUAN_LY_RAP | JWT/current identity | QL_GHE |
| PUT | /api/manager/seats/:seatId | QUAN_LY_RAP | JWT/current identity | QL_GHE |
| DELETE | /api/manager/seats/:seatId | QUAN_LY_RAP | JWT/current identity | QL_GHE |
| GET | /api/manager/cinemas/:cinemaId/showtimes | QUAN_LY_RAP | JWT/current identity | QL_SUAT_CHIEU |
| POST | /api/manager/showtimes | QUAN_LY_RAP | JWT/current identity | QL_SUAT_CHIEU |
| PUT | /api/manager/showtimes/:showtimeId | QUAN_LY_RAP | JWT/current identity | QL_SUAT_CHIEU |
| POST | /api/manager/showtimes/:showtimeId/cancel | QUAN_LY_RAP | JWT/current identity | QL_SUAT_CHIEU |
| GET | /api/manager/cinemas/:cinemaId/pricing | QUAN_LY_RAP | JWT/current identity | QL_BANG_GIA |
| POST | /api/manager/cinemas/:cinemaId/pricing | QUAN_LY_RAP | JWT/current identity | QL_BANG_GIA |
| PUT | /api/manager/pricing/:pricingId | QUAN_LY_RAP | JWT/current identity | QL_BANG_GIA |
| GET | /api/manager/cinemas/:cinemaId/dashboard | QUAN_LY_RAP | JWT/current identity | XEM_BAO_CAO_RAP |
| GET | /api/manager/cinemas/:cinemaId/revenue | QUAN_LY_RAP | JWT/current identity | XEM_BAO_CAO_RAP |
| GET | /api/support/complaints | CSKH | JWT/current identity | QL_KHIEUNAI |
| GET | /api/support/complaints/:complaintId | CSKH | JWT/current identity | QL_KHIEUNAI |
| GET | /api/support/complaints/:complaintId/order-reference | CSKH | JWT/current identity | QL_KHIEUNAI + TRA_CUU_DON |
| POST | /api/support/complaints/:complaintId/processings | CSKH | JWT/current identity | QL_KHIEUNAI + XULY_KHIEUNAI |
| PUT | /api/support/complaints/:complaintId/status | CSKH | JWT/current identity | QL_KHIEUNAI + XULY_KHIEUNAI |
| GET | /api/admin/dashboard | ADMIN | JWT/current identity | XEM_BAO_CAO_TOANHE |
| GET | /api/admin/users | ADMIN | JWT/current identity | QL_NGUOIDUNG |
| POST | /api/admin/users | ADMIN | JWT/current identity | QL_NGUOIDUNG |
| PUT | /api/admin/users/:userId/status | ADMIN | JWT/current identity | QL_NGUOIDUNG |
| GET | /api/admin/roles | ADMIN | JWT/current identity | QL_VAITRO |
| GET | /api/admin/roles/:roleId/permissions | ADMIN | JWT/current identity | QL_QUYEN |
| POST | /api/admin/roles | ADMIN | JWT/current identity | QL_VAITRO |
| PUT | /api/admin/roles/:roleId | ADMIN | JWT/current identity | QL_VAITRO |
| DELETE | /api/admin/roles/:roleId | ADMIN | JWT/current identity | QL_VAITRO |
| GET | /api/admin/permissions | ADMIN | JWT/current identity | QL_QUYEN |
| POST | /api/admin/permissions | ADMIN | JWT/current identity | QL_QUYEN |
| PUT | /api/admin/permissions/:permissionId | ADMIN | JWT/current identity | QL_QUYEN |
| DELETE | /api/admin/permissions/:permissionId | ADMIN | JWT/current identity | QL_QUYEN |
| PUT | /api/admin/roles/:roleId/permissions | ADMIN | JWT/current identity | QL_QUYEN |
| GET | /api/admin/assignments | ADMIN | JWT/current identity | PHANCONG_RAP |
| POST | /api/admin/assignments | ADMIN | JWT/current identity | PHANCONG_RAP |
| PUT | /api/admin/assignments/:assignmentId | ADMIN | JWT/current identity | PHANCONG_RAP |
| GET | /api/admin/cinemas | ADMIN | JWT/current identity | QL_RAP |
| POST | /api/admin/cinemas | ADMIN | JWT/current identity | QL_RAP |
| PUT | /api/admin/cinemas/:cinemaId | ADMIN | JWT/current identity | QL_RAP |
| DELETE | /api/admin/cinemas/:cinemaId | ADMIN | JWT/current identity | QL_RAP |
| GET | /api/admin/cinemas/:cinemaId/images | ADMIN | JWT/current identity | QL_RAP |
| POST | /api/admin/cinemas/:cinemaId/images | ADMIN | JWT/current identity | QL_RAP |
| PUT | /api/admin/cinemas/:cinemaId/images/:imageId | ADMIN | JWT/current identity | QL_RAP |
| DELETE | /api/admin/cinemas/:cinemaId/images/:imageId | ADMIN | JWT/current identity | QL_RAP |
| PATCH | /api/admin/cinemas/:cinemaId/images/:imageId/cover | ADMIN | JWT/current identity | QL_RAP |
| GET | /api/admin/rooms | ADMIN | JWT/current identity | QL_PHONG |
| POST | /api/admin/rooms | ADMIN | JWT/current identity | QL_PHONG |
| PUT | /api/admin/rooms/:roomId | ADMIN | JWT/current identity | QL_PHONG |
| DELETE | /api/admin/rooms/:roomId | ADMIN | JWT/current identity | QL_PHONG |
| GET | /api/admin/seats | ADMIN | JWT/current identity | QL_GHE |
| POST | /api/admin/seats | ADMIN | JWT/current identity | QL_GHE |
| PUT | /api/admin/seats/:seatId | ADMIN | JWT/current identity | QL_GHE |
| DELETE | /api/admin/seats/:seatId | ADMIN | JWT/current identity | QL_GHE |
| GET | /api/admin/pricing | ADMIN | JWT/current identity | QL_BANG_GIA |
| POST | /api/admin/pricing | ADMIN | JWT/current identity | QL_BANG_GIA |
| PUT | /api/admin/pricing/:pricingId | ADMIN | JWT/current identity | QL_BANG_GIA |
| GET | /api/admin/showtimes | ADMIN | JWT/current identity | QL_SUAT_CHIEU |
| POST | /api/admin/showtimes | ADMIN | JWT/current identity | QL_SUAT_CHIEU |
| PUT | /api/admin/showtimes/:showtimeId | ADMIN | JWT/current identity | QL_SUAT_CHIEU |
| POST | /api/admin/showtimes/:showtimeId/cancel | ADMIN | JWT/current identity | QL_SUAT_CHIEU |
| GET | /api/admin/movies | ADMIN | JWT/current identity | QL_DANHMUC_PHIM |
| POST | /api/admin/movies | ADMIN | JWT/current identity | QL_DANHMUC_PHIM |
| PUT | /api/admin/movies/:movieId | ADMIN | JWT/current identity | QL_DANHMUC_PHIM |
| DELETE | /api/admin/movies/:movieId | ADMIN | JWT/current identity | QL_DANHMUC_PHIM |
| PUT | /api/admin/movies/:movieId/actors | ADMIN | JWT/current identity | QL_DANHMUC_PHIM |
| GET | /api/admin/genres | ADMIN | JWT/current identity | QL_THELOAI |
| POST | /api/admin/genres | ADMIN | JWT/current identity | QL_THELOAI |
| PUT | /api/admin/genres/:genreId | ADMIN | JWT/current identity | QL_THELOAI |
| DELETE | /api/admin/genres/:genreId | ADMIN | JWT/current identity | QL_THELOAI |
| GET | /api/admin/actors | ADMIN | JWT/current identity | QL_DANHMUC_PHIM |
| POST | /api/admin/actors | ADMIN | JWT/current identity | QL_DANHMUC_PHIM |
| PUT | /api/admin/actors/:actorId | ADMIN | JWT/current identity | QL_DANHMUC_PHIM |
| DELETE | /api/admin/actors/:actorId | ADMIN | JWT/current identity | QL_DANHMUC_PHIM |
| GET | /api/admin/products | ADMIN | JWT/current identity | QL_SANPHAM |
| POST | /api/admin/products | ADMIN | JWT/current identity | QL_SANPHAM |
| PUT | /api/admin/products/:productId | ADMIN | JWT/current identity | QL_SANPHAM |
| DELETE | /api/admin/products/:productId | ADMIN | JWT/current identity | QL_SANPHAM |
| GET | /api/admin/promotions | ADMIN | JWT/current identity | QL_KHUYENMAI |
| POST | /api/admin/promotions | ADMIN | JWT/current identity | QL_KHUYENMAI |
| PUT | /api/admin/promotions/:promotionId | ADMIN | JWT/current identity | QL_KHUYENMAI |
| DELETE | /api/admin/promotions/:promotionId | ADMIN | JWT/current identity | QL_KHUYENMAI |
| GET | /api/admin/reports/revenue | ADMIN | JWT/current identity | XEM_BAO_CAO_TOANHE |
| GET | /api/admin/complaints | ADMIN | JWT/current identity | QL_KHIEUNAI |
| GET | /api/admin/complaints/:complaintId | ADMIN | JWT/current identity | QL_KHIEUNAI |
| GET | /api/admin/complaints/:complaintId/order-reference | ADMIN | JWT/current identity | QL_KHIEUNAI + TRA_CUU_DON |
| POST | /api/admin/complaints/:complaintId/processings | ADMIN | JWT/current identity | QL_KHIEUNAI + XULY_KHIEUNAI |
| PUT | /api/admin/complaints/:complaintId/status | ADMIN | JWT/current identity | QL_KHIEUNAI + XULY_KHIEUNAI |
