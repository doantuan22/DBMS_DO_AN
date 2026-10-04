import { DbTypes, executeProcedure, executeProcedureWithOutputs } from '../db/procedureClient.js';
import { HttpError } from '../utils/httpError.js';
import { isNumericRangeError } from '../utils/sqlErrors.js';

const SEAT_AVAILABLE = 'Trống';

function seatDto(row) {
  return {
    id: row.GheID,
    roomId: row.PhongID,
    row: row.HangGhe,
    number: row.SoGhe,
    label: row.TenGhe,
    type: row.LoaiGhe,
    price: row.GiaVe,
    status: row.TrangThaiGhe,
  };
}

function productDto(row) {
  return {
    id: row.SanPhamID,
    name: row.TenSanPham,
    type: row.LoaiSanPham,
    price: row.Gia,
    description: row.MoTa,
    imageUrl: row.HinhAnh,
    status: row.TrangThai,
  };
}

function bookingDto(row) {
  if (!row) throw new HttpError(500, 'BOOKING_RESPONSE_INVALID', 'Booking procedure did not return an order.');
  return {
    id: row.DonDatVeID,
    userId: row.NguoiDungID,
    showtimeId: row.SuatChieuID,
    bookedAt: row.NgayDat,
    ticketTotal: row.TongTienVe,
    productTotal: row.TongTienDoAn,
    discountTotal: row.TienGiamGia,
    total: row.TongThanhToan,
    status: row.TrangThai,
    holdExpiresAt: row.HanGiuCho,
    ticketCount: row.SoLuongVe,
  };
}

function bookingRow(result) {
  const recordsets = result.recordsets ?? [result.recordset ?? []];
  return recordsets.flat().find((row) => row?.DonDatVeID !== undefined);
}

function sqlErrorNumber(error) {
  return error.number ?? error.originalError?.info?.number ?? error.originalError?.number;
}

function mapBookingError(error) {
  if (error instanceof HttpError) throw error;
  if (isNumericRangeError(error)) throw new HttpError(400, 'INVALID_REQUEST', 'A numeric value is out of range.');
  switch (sqlErrorNumber(error)) {
    case 50020: throw new HttpError(403, 'ACCOUNT_UNAVAILABLE', 'This account cannot place orders.');
    case 50021: throw new HttpError(404, 'SHOWTIME_NOT_FOUND', 'Showtime was not found.');
    case 50023: throw new HttpError(400, 'INVALID_REQUEST', 'Select at least one seat.');
    case 50022: throw new HttpError(409, 'SHOWTIME_UNAVAILABLE', 'This showtime is no longer available for booking.');
    case 50024: throw new HttpError(409, 'SEAT_UNAVAILABLE', 'One or more selected seats are unavailable.');
    case 50026: throw new HttpError(400, 'SEAT_LIMIT_EXCEEDED', 'An order can contain at most 10 seats.');
    case 50027: throw new HttpError(400, 'PRODUCT_QUANTITY_LIMIT_EXCEEDED', 'Each product quantity must be at most 10.');
    case 50028: throw new HttpError(409, 'ACTIVE_ORDER_LIMIT_REACHED', 'You already hold the maximum number of unpaid orders. Pay for one or wait for it to expire.');
    case 50025:
    case 50003: throw new HttpError(409, 'SEAT_CONFLICT', 'One or more selected seats were just booked by another customer.');
    default: throw error;
  }
}

function productJson(items) {
  return items.length === 0 ? null : JSON.stringify(items.map((item) => ({ SanPhamID: item.productId, SoLuong: item.quantity })));
}

export function createBookingService({ execute = executeProcedure, executeWithOutputs = executeProcedureWithOutputs } = {}) {
  async function listSeats(showtimeId) {
    const result = await execute('SEAT_LIST_BY_SHOWTIME', { SuatChieuID: { type: DbTypes.Int, value: showtimeId } });
    return (result.recordset ?? []).map(seatDto);
  }

  async function listProducts() {
    const result = await execute('PRODUCT_LIST_ACTIVE');
    return (result.recordset ?? []).map(productDto);
  }

  async function validatePromotion(userId, input) {
    // Values supplied to this procedure are derived only from current DB procedure
    // responses. They are a preview; sp_Booking_Create recalculates and revalidates.
    const [seats, availableProducts] = await Promise.all([listSeats(input.showtimeId), listProducts()]);
    const selectedSeats = input.seatIds.map((id) => seats.find((seat) => seat.id === id));
    if (selectedSeats.some((seat) => !seat || seat.status !== SEAT_AVAILABLE)) {
      throw new HttpError(409, 'SEAT_UNAVAILABLE', 'One or more selected seats are unavailable.');
    }
    const selectedProducts = input.products.map((item) => ({ ...item, product: availableProducts.find((product) => product.id === item.productId) }));
    if (selectedProducts.some((item) => !item.product)) {
      throw new HttpError(400, 'PRODUCT_NOT_AVAILABLE', 'One or more products are unavailable.');
    }
    const provisionalTotal = selectedSeats.reduce((total, seat) => total + Number(seat.price), 0)
      + selectedProducts.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0);
    const result = await executeWithOutputs('PROMOTION_VALIDATE', {
      NguoiDungID: { type: DbTypes.Int, value: userId },
      MaCode: { type: DbTypes.VarChar(50), value: input.promotionCode },
      TongTienDon: { type: DbTypes.Decimal(18, 2), value: provisionalTotal },
    }, {
      KhuyenMaiID: DbTypes.Int,
      LoaiGiamGia: DbTypes.NVarChar(20),
      GiaTriGiam: DbTypes.Decimal(18, 2),
      TienGiam: DbTypes.Decimal(18, 2),
      IsValid: DbTypes.Bit,
      Message: DbTypes.NVarChar(255),
    });
    const row = result.recordset?.[0] ?? {};
    return {
      isValid: Boolean(row.IsValid ?? result.output?.IsValid),
      code: row.MaCode ?? input.promotionCode,
      promotionId: row.KhuyenMaiID ?? result.output?.KhuyenMaiID ?? null,
      discountType: row.LoaiGiamGia ?? result.output?.LoaiGiamGia ?? null,
      discountValue: row.GiaTriGiam ?? result.output?.GiaTriGiam ?? null,
      discountAmount: row.TienGiam ?? result.output?.TienGiam ?? 0,
      message: row.Message ?? result.output?.Message ?? 'Promotion could not be applied.',
      provisionalSubtotal: provisionalTotal,
    };
  }

  async function createBooking(userId, input) {
    try {
      const result = await executeWithOutputs('BOOKING_CREATE', {
        NguoiDungID: { type: DbTypes.Int, value: userId },
        SuatChieuID: { type: DbTypes.Int, value: input.showtimeId },
        MaKhuyenMai: { type: DbTypes.VarChar(50), value: input.promotionCode },
        DanhSachGheId: { type: DbTypes.VarChar(DbTypes.MAX), value: input.seatIds.toString() },
        DanhSachDoAnJson: { type: DbTypes.NVarChar(DbTypes.MAX), value: productJson(input.products) },
      }, { NewDonDatVeID: DbTypes.Int });
      return bookingDto(bookingRow(result));
    } catch (error) {
      mapBookingError(error);
    }
  }

  return { listSeats, listProducts, validatePromotion, createBooking };
}

export const bookingService = createBookingService();
