import { DbTypes, executeProcedure, executeProcedureWithOutputs } from '../db/procedureClient.js';
import { detailDto } from './orderService.js';
import { HttpError } from '../utils/httpError.js';
import { isNumericRangeError, sqlErrorNumber } from '../utils/sqlErrors.js';

const rows = (result, index = 0) =>
  result.recordsets?.[index] ?? (index === 0 ? result.recordset : []) ?? [];
const int = (value) => ({ type: DbTypes.Int, value });
const actor = (actorId, role) => ({
  ActorID: int(actorId),
  PortalRole: { type: DbTypes.VarChar(50), value: role },
});
const text = (value, length = 100) => ({ type: DbTypes.NVarChar(length), value });
const csv = (value) => ({ type: DbTypes.VarChar(DbTypes.MAX), value: value.join(',') });

export function mapStaffBookingError(error) {
  if (error instanceof HttpError) throw error;
  if (isNumericRangeError(error))
    throw new HttpError(400, 'INVALID_REQUEST', 'Dữ liệu số không hợp lệ.');
  const number = sqlErrorNumber(error);
  switch (number) {
    case 50300:
      throw new HttpError(401, 'ACCOUNT_UNAVAILABLE', 'Tài khoản nhân viên không còn hoạt động.');
    case 50301:
    case 50302:
      throw new HttpError(403, 'FORBIDDEN', 'Bạn không đủ quyền quản lý đặt vé.');
    case 50303:
      throw new HttpError(
        403,
        'CINEMA_SCOPE_DENIED',
        'Rạp không thuộc phân công còn hiệu lực của bạn.',
      );
    case 50510:
    case 50020:
      throw new HttpError(400, 'CUSTOMER_UNAVAILABLE', 'Chọn Customer có sẵn và đang hoạt động.');
    case 50511:
    case 50023:
      throw new HttpError(
        400,
        'INVALID_REQUEST',
        'Dữ liệu tìm kiếm, phân trang hoặc ghế không hợp lệ.',
      );
    case 50026:
      throw new HttpError(400, 'SEAT_LIMIT_EXCEEDED', 'Mỗi đơn cần từ 1 đến 10 ghế.');
    case 50021:
      throw new HttpError(404, 'SHOWTIME_NOT_FOUND', 'Suất chiếu không tồn tại.');
    case 50033:
      throw new HttpError(404, 'ORDER_NOT_FOUND', 'Đơn đặt vé không tồn tại.');
    case 50022:
      throw new HttpError(409, 'SHOWTIME_UNAVAILABLE', 'Suất chiếu không còn đủ điều kiện đặt vé.');
    case 50002:
    case 50024:
      throw new HttpError(
        409,
        'SEAT_UNAVAILABLE',
        'Ghế không thuộc phòng hoặc không còn hoạt động.',
      );
    case 50003:
    case 50025:
      throw new HttpError(
        409,
        'SEAT_CONFLICT',
        'Ghế vừa được giữ/bán. Tải lại sơ đồ và chọn ghế khác.',
      );
    case 50028:
      throw new HttpError(
        409,
        'ACTIVE_ORDER_LIMIT_REACHED',
        'Khách hàng đã giữ tối đa số đơn cho phép.',
      );
    case 50512:
      throw new HttpError(
        409,
        'ORDER_READ_ONLY',
        'Đơn không đủ điều kiện sửa/hủy; không có hoàn tiền tự nguyện.',
      );
    case 50513:
      throw new HttpError(409, 'HOLD_EXPIRED', 'Đơn đã hết thời gian giữ ghế.');
    case 50514:
      throw new HttpError(
        409,
        'PAYMENT_HISTORY_PROTECTED',
        'Đơn có lịch sử hoặc giao dịch thanh toán đang xử lý; không thể thực hiện thao tác này.',
      );
    case 50515:
      throw new HttpError(
        409,
        'ORDER_CHANGED',
        'Đơn đã được nhân viên khác sửa. Tải lại chi tiết.',
      );
    case 50516:
      throw new HttpError(
        409,
        'TRANSACTION_REQUIRED',
        'Không thể thực hiện thao tác ngoài transaction.',
      );
    default:
      throw error;
  }
}
export function createStaffBookingService({
  execute = executeProcedure,
  executeWithOutputs = executeProcedureWithOutputs,
} = {}) {
  async function call(key, params, outputs) {
    try {
      return await (outputs ? executeWithOutputs(key, params, outputs) : execute(key, params));
    } catch (error) {
      mapStaffBookingError(error);
    }
  }
  function detailResult(result) {
    const row = rows(result)[0];
    return {
      ...detailDto(result),
      canEdit: Boolean(row?.CanEdit),
      canCancel: Boolean(row?.CanCancel),
    };
  }
  return {
    async list(actorId, role, input) {
      const result = await call('STAFF_BOOKING_LIST', {
        ...actor(actorId, role),
        Search: text(input.search),
        Status: text(input.status, 50),
        RapID: int(input.cinemaId),
        Page: int(input.page),
        PageSize: int(input.pageSize),
      });
      const paging = rows(result, 1)[0] ?? {};
      return {
        orders: rows(result),
        total: paging.Total ?? 0,
        page: paging.Page ?? input.page,
        pageSize: paging.PageSize ?? input.pageSize,
      };
    },
    async customers(actorId, role, search) {
      const result = await call('STAFF_BOOKING_CUSTOMERS', {
        ...actor(actorId, role),
        Search: text(search),
      });
      return { customers: rows(result), total: rows(result)[0]?.TotalMatches ?? 0 };
    },
    async options(actorId, role, input) {
      const result = await call('STAFF_BOOKING_OPTIONS', {
        ...actor(actorId, role),
        RapID: int(input.cinemaId),
        SuatChieuID: int(input.showtimeId),
        DonDatVeID: int(input.orderId),
      });
      return {
        cinemas: rows(result),
        showtimes: rows(result, 1),
        showtimeTotal: rows(result, 1)[0]?.TotalMatches ?? 0,
        seats: rows(result, 2).map((r) => ({
          id: r.GheID,
          roomId: r.PhongID,
          row: r.HangGhe,
          number: r.SoGhe,
          label: r.TenGhe,
          type: r.LoaiGhe,
          price: r.GiaVe,
          status: r.TrangThaiGhe,
        })),
      };
    },
    async detail(actorId, role, id) {
      return detailResult(
        await call('STAFF_BOOKING_DETAIL', { ...actor(actorId, role), DonDatVeID: int(id) }),
      );
    },
    async create(actorId, role, input) {
      const result = await call(
        'STAFF_BOOKING_CREATE',
        {
          ...actor(actorId, role),
          CustomerID: int(input.customerId),
          SuatChieuID: int(input.showtimeId),
          DanhSachGheId: csv(input.seatIds),
        },
        { NewDonDatVeID: DbTypes.Int },
      );
      const orderId = result.output?.NewDonDatVeID ?? rows(result)[0]?.DonDatVeID;
      if (!orderId)
        throw new HttpError(
          500,
          'ORDER_RESPONSE_INVALID',
          'Không nhận được đơn đặt vé sau khi tạo.',
        );
      return { orderId };
    },
    async updateSeats(actorId, role, id, input) {
      return detailResult(
        await call('STAFF_BOOKING_UPDATE_SEATS', {
          ...actor(actorId, role),
          DonDatVeID: int(id),
          DanhSachGheId: csv(input.seatIds),
          ExpectedVeIdList: csv(input.expectedTicketIds),
        }),
      );
    },
    async cancel(actorId, role, id) {
      return detailResult(
        await call('STAFF_BOOKING_CANCEL', { ...actor(actorId, role), DonDatVeID: int(id) }),
      );
    },
  };
}
export const staffBookingService = createStaffBookingService();
