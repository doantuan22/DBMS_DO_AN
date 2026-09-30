// Whitelist of stored procedures the application may execute.
// Callers pass a key from PROCEDURES; a procedure name is never accepted from a request.
// Add an entry here only after the procedure exists under database/procedures/.
export const PROCEDURES = Object.freeze({
  SYSTEM_HEALTH_CHECK: 'dbo.sp_System_HealthCheck',
  EXPIRE_PENDING_ORDERS: 'dbo.sp_Order_ExpirePending',

  // Authentication: the database returns the bcrypt hash, the backend compares it.
  AUTH_LOGIN: 'dbo.sp_Auth_Login',
  AUTH_REGISTER_CUSTOMER: 'dbo.sp_Auth_RegisterCustomer',
  USER_GET_CURRENT: 'dbo.sp_User_GetCurrent',
  USER_UPDATE_PROFILE: 'dbo.sp_User_UpdateProfile',
  RBAC_GET_PERMISSIONS_BY_USER: 'dbo.sp_RBAC_GetPermissionsByUser',
  MANAGER_LIST_ASSIGNED_CINEMAS: 'dbo.sp_Manager_ListAssignedCinemas',
  USER_GET_PASSWORD_HASH: 'dbo.sp_User_GetPasswordHash',
  USER_CHANGE_PASSWORD: 'dbo.sp_User_ChangePassword',

  // Public catalog: read procedures only.
  GENRE_LIST: 'dbo.sp_Genre_List',
  CINEMA_LIST: 'dbo.sp_Cinema_List',
  MOVIE_LIST: 'dbo.sp_Movie_List',
  MOVIE_GET_DETAIL: 'dbo.sp_Movie_GetDetail',
  SHOWTIME_LIST_BY_MOVIE: 'dbo.sp_Showtime_ListByMovie',
  SHOWTIME_GET_DETAIL: 'dbo.sp_Showtime_GetDetail',

  // Booking core. The database owns availability, pricing, promotion revalidation
  // and the booking transaction.
  SEAT_LIST_BY_SHOWTIME: 'dbo.sp_Seat_ListByShowtime',
  PRODUCT_LIST_ACTIVE: 'dbo.sp_Product_ListActive',
  PROMOTION_VALIDATE: 'dbo.sp_Promotion_Validate',
  BOOKING_CREATE: 'dbo.sp_Booking_Create',

  BOOK_TICKET: 'dbo.sp_DatVe',
  ADD_SHOWTIME: 'dbo.sp_ThemSuatChieu',
  PROCESS_PAYMENT: 'dbo.sp_XuLyThanhToan',
  PROCESS_COMPLAINT: 'dbo.sp_XuLyKhieuNai',
  ASSIGN_CINEMA_MANAGER: 'dbo.sp_PhanCongQuanLyRap',
});

export const isKnownProcedure = (key) =>
  Object.prototype.hasOwnProperty.call(PROCEDURES, key);
