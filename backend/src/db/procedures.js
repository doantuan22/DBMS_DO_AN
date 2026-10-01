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
  MANAGER_ROOM_LIST: 'dbo.sp_Manager_Room_List',
  MANAGER_ROOM_CREATE: 'dbo.sp_Manager_Room_Create',
  MANAGER_ROOM_UPDATE: 'dbo.sp_Manager_Room_Update',
  MANAGER_ROOM_DELETE: 'dbo.sp_Manager_Room_Delete',
  MANAGER_SEAT_LIST_BY_ROOM: 'dbo.sp_Manager_Seat_ListByRoom',
  MANAGER_SEAT_CREATE: 'dbo.sp_Manager_Seat_Create',
  MANAGER_SEAT_UPDATE: 'dbo.sp_Manager_Seat_Update',
  MANAGER_SEAT_DELETE: 'dbo.sp_Manager_Seat_Delete',
  MANAGER_SHOWTIME_LIST: 'dbo.sp_Manager_Showtime_List',
  MANAGER_SHOWTIME_CREATE: 'dbo.sp_Manager_Showtime_Create',
  MANAGER_SHOWTIME_UPDATE: 'dbo.sp_Manager_Showtime_Update',
  MANAGER_SHOWTIME_CANCEL: 'dbo.sp_Manager_Showtime_Cancel',
  MANAGER_PRICING_LIST: 'dbo.sp_Manager_Pricing_List',
  MANAGER_PRICING_CREATE: 'dbo.sp_Manager_Pricing_Create',
  MANAGER_PRICING_UPDATE: 'dbo.sp_Manager_Pricing_Update',
  MANAGER_DASHBOARD: 'dbo.sp_Manager_Dashboard',
  MANAGER_REVENUE: 'dbo.sp_Manager_Revenue',
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

  // Payment and order history. These procedures remain the source of truth for
  // order ownership, amount, payment state and state transitions.
  PAYMENT_CREATE_ATTEMPT: 'dbo.sp_Payment_CreateAttempt',
  PAYMENT_UPDATE_RESULT: 'dbo.sp_Payment_UpdateResult',
  ORDER_LIST_BY_CUSTOMER: 'dbo.sp_Order_ListByCustomer',
  ORDER_GET_DETAIL_BY_CUSTOMER: 'dbo.sp_Order_GetDetailByCustomer',

  // Phase 6 customer feedback. Identity is always passed by the service from
  // the authenticated JWT; these names are never supplied by a client.
  REVIEW_CREATE: 'dbo.sp_Review_Create',
  REVIEW_LIST_BY_MOVIE: 'dbo.sp_Review_ListByMovie',
  COMPLAINT_CREATE: 'dbo.sp_Complaint_Create',
  COMPLAINT_LIST_BY_CUSTOMER: 'dbo.sp_Complaint_ListByCustomer',
  COMPLAINT_GET_BY_CUSTOMER: 'dbo.sp_Complaint_GetByCustomer',

  BOOK_TICKET: 'dbo.sp_DatVe',
  ADD_SHOWTIME: 'dbo.sp_ThemSuatChieu',
  PROCESS_PAYMENT: 'dbo.sp_XuLyThanhToan',
  PROCESS_COMPLAINT: 'dbo.sp_XuLyKhieuNai',
  ASSIGN_CINEMA_MANAGER: 'dbo.sp_PhanCongQuanLyRap',
});

export const isKnownProcedure = (key) =>
  Object.prototype.hasOwnProperty.call(PROCEDURES, key);
