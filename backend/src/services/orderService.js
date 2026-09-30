import { DbTypes, executeProcedure, executeProcedureWithOutputs } from '../db/procedureClient.js';
import { HttpError } from '../utils/httpError.js';

const rowOf = (result, index) => (result.recordsets?.[index] ?? (index === 0 ? result.recordset : []) ?? []);
const number = (value) => value === null || value === undefined ? null : Number(value);

function orderSummaryDto(row) {
  return {
    id: row.DonDatVeID, showtimeId: row.SuatChieuID, movieId: row.PhimID,
    movieTitle: row.TenPhim, posterUrl: row.PosterURL, cinemaId: row.RapID,
    cinemaName: row.TenRap, roomName: row.TenPhong, startsAt: row.ThoiGianBatDau,
    endsAt: row.ThoiGianKetThuc, format: row.DinhDang, bookedAt: row.NgayDat,
    ticketTotal: number(row.TongTienVe), productTotal: number(row.TongTienDoAn),
    discountTotal: number(row.TienGiamGia), total: number(row.TongTienThanhToan),
    status: row.TrangThaiDon, promotionCode: row.MaKhuyenMai, ticketCount: row.SoLuongVe,
    latestPaymentStatus: row.TrangThaiThanhToanMoiNhat,
  };
}

function ticketDto(row) {
  return { id: row.VeID, code: row.MaVe, seatId: row.GheID, row: row.HangGhe, number: row.SoGhe, label: row.TenGhe, type: row.LoaiGhe, price: number(row.GiaVe), status: row.TrangThaiVe };
}

function productDto(row) {
  return { id: row.ChiTietDoAnID, productId: row.SanPhamID, name: row.TenSanPham, type: row.LoaiSanPham, quantity: row.SoLuong, unitPrice: number(row.DonGia), total: number(row.ThanhTien) };
}

function paymentDto(row) {
  return { id: row.ThanhToanID, method: row.PhuongThuc, amount: number(row.SoTien), createdAt: row.NgayTao, paidAt: row.NgayThanhToan, transactionCode: row.MaGiaoDich, status: row.TrangThai, note: row.GhiChu };
}

function detailDto(result) {
  const row = rowOf(result, 0)[0];
  if (!row) throw new HttpError(500, 'ORDER_RESPONSE_INVALID', 'Order procedure did not return the order.');
  return {
    ...orderSummaryDto(row), user: { id: row.NguoiDungID, name: row.HoTenKhachHang, email: row.Email, phone: row.SoDienThoai },
    roomId: row.PhongID, roomType: row.LoaiPhong, cinemaAddress: row.DiaChiRap,
    ageRating: row.DoTuoi, durationMinutes: row.ThoiLuong, promotionDescription: row.MoTaKhuyenMai,
    seatLabels: row.DanhSachGhe, ticketCodes: row.DanhSachMaVe,
    tickets: rowOf(result, 1).map(ticketDto), products: rowOf(result, 2).map(productDto), payments: rowOf(result, 3).map(paymentDto),
  };
}

function paymentAttemptDto(result) {
  const row = rowOf(result, 0)[0];
  if (!row || row.ThanhToanID === undefined) throw new HttpError(500, 'PAYMENT_RESPONSE_INVALID', 'Payment procedure did not return the attempt.');
  return { id: row.ThanhToanID, orderId: row.DonDatVeID, method: row.PhuongThuc, amount: number(row.SoTien), createdAt: row.NgayTao, transactionCode: row.MaGiaoDich, status: row.TrangThai, holdExpiresAt: row.HanGiuCho };
}

function sqlErrorNumber(error) { return error.number ?? error.originalError?.info?.number ?? error.originalError?.number; }

function mapOrderError(error) {
  if (error instanceof HttpError) throw error;
  switch (sqlErrorNumber(error)) {
    case 50030:
    case 50033: throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order was not found.');
    case 50032: throw new HttpError(404, 'PAYMENT_NOT_FOUND', 'Payment attempt was not found.');
    case 50031:
    case 50113: throw new HttpError(409, 'ORDER_NOT_PAYABLE', 'This order can no longer be paid.');
    case 50111: throw new HttpError(409, 'ORDER_HOLD_EXPIRED', 'The payment hold has expired.');
    case 50114: throw new HttpError(400, 'INVALID_PAYMENT_RESULT', 'Payment result is invalid.');
    case 50115: throw new HttpError(409, 'PAYMENT_FINALIZED', 'Payment attempt already has a final result.');
    default: throw error;
  }
}

export function createOrderService({ execute = executeProcedure, executeWithOutputs = executeProcedureWithOutputs } = {}) {
  async function getOrderDetail(userId, id) {
    try {
      const result = await execute('ORDER_GET_DETAIL_BY_CUSTOMER', {
        NguoiDungID: { type: DbTypes.Int, value: userId }, DonDatVeID: { type: DbTypes.Int, value: id },
      });
      return detailDto(result);
    } catch (error) { mapOrderError(error); }
  }

  async function listOrders(userId) {
    try {
      const result = await execute('ORDER_LIST_BY_CUSTOMER', { NguoiDungID: { type: DbTypes.Int, value: userId } });
      return rowOf(result, 0).map(orderSummaryDto);
    } catch (error) { mapOrderError(error); }
  }

  async function createPaymentAttempt(userId, id, input) {
    try {
      // The payment SP has no user parameter. Its preceding detail call performs
      // the database-owned ownership check; the SP then locks and revalidates state.
      await getOrderDetail(userId, id);
      const result = await executeWithOutputs('PAYMENT_CREATE_ATTEMPT', {
        DonDatVeID: { type: DbTypes.Int, value: id }, PhuongThuc: { type: DbTypes.NVarChar(50), value: input.paymentMethod },
      }, { ThanhToanID: DbTypes.Int, MaGiaoDich: DbTypes.VarChar(100) });
      return paymentAttemptDto(result);
    } catch (error) { mapOrderError(error); }
  }

  async function updatePaymentResult(userId, id, attemptId, input) {
    try {
      const detail = await getOrderDetail(userId, id);
      if (!detail.payments.some((payment) => payment.id === attemptId)) {
        throw new HttpError(404, 'PAYMENT_NOT_FOUND', 'Payment attempt was not found.');
      }
      await execute('PAYMENT_UPDATE_RESULT', {
        ThanhToanID: { type: DbTypes.Int, value: attemptId },
        TrangThaiThanhToan: { type: DbTypes.NVarChar(50), value: input.status },
      });
      const order = await getOrderDetail(userId, id);
      return { order, payment: order.payments.find((payment) => payment.id === attemptId) };
    } catch (error) { mapOrderError(error); }
  }

  return { listOrders, getOrderDetail, createPaymentAttempt, updatePaymentResult };
}

export const orderService = createOrderService();
