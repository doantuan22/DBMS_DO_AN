// Booking limits chosen by the product owner. The backend and the database enforce the same values
// (backend/src/validators/bookingValidator.js, dbo.fn_GioiHanGheMoiDon / fn_GioiHanSoLuongSanPham / fn_GioiHanDonDangGiu);
// the screens only use them to stop the user before an avoidable error.
export const MAX_SEATS_PER_ORDER = 10;
export const MAX_PRODUCT_QUANTITY = 10;
export const MAX_HOLDING_ORDERS = 3;
export const HOLD_MINUTES = 5;
