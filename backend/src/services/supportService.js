import { DbTypes, executeProcedure } from '../db/procedureClient.js';
import { HttpError } from '../utils/httpError.js';
import { detailDto } from './orderService.js';

const SQL_ERROR = Object.freeze({
  SUPPORT_FORBIDDEN: 50060,
  COMPLAINT_NOT_FOUND: 50061,
});

const int = (value) => ({ type: DbTypes.Int, value });
const text = (length, value) => ({ type: DbTypes.NVarChar(length), value });
const bit = (value) => ({ type: DbTypes.Bit, value });

function getRows(result, index = 0) {
  if (result.recordsets?.[index]) return result.recordsets[index];
  return index === 0 ? (result.recordset ?? []) : [];
}

function getSqlErrorNumber(error) {
  return error.number ?? error.originalError?.info?.number ?? error.originalError?.number;
}

function rethrowMappedError(error) {
  if (error instanceof HttpError) throw error;

  const errNum = getSqlErrorNumber(error);
  switch (errNum) {
    case 50405:
      throw new HttpError(400, 'INVALID_PRIORITY', 'priority is not supported.');
    case 50030:
      throw new HttpError(404, 'ORDER_NOT_FOUND', 'Referenced order was not found.');
    case SQL_ERROR.SUPPORT_FORBIDDEN:
    case 50301:
    case 50302:
      throw new HttpError(403, 'SUPPORT_FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.');
    case 50300:
      throw new HttpError(401, 'ACCOUNT_LOCKED', 'Tài khoản không tồn tại hoặc đã bị khóa.');
    case SQL_ERROR.COMPLAINT_NOT_FOUND:
    case 50042:
      throw new HttpError(404, 'COMPLAINT_NOT_FOUND', 'Khiếu nại không tồn tại.');
    case 50400:
      throw new HttpError(400, 'INVALID_REQUEST', error.message || 'Yêu cầu không hợp lệ.');
    case 50401:
      throw new HttpError(400, 'INVALID_STATE_TRANSITION', error.message || 'Chuyển trạng thái không hợp lệ.');
    case 50402:
      throw new HttpError(409, 'ESCALATION_ALREADY_CLAIMED', 'Yêu cầu chuyển cấp đã được Admin khác tiếp nhận.');
    case 50403:
      throw new HttpError(403, 'ESCALATION_NOT_ASSIGNED', 'Yêu cầu chuyển cấp chưa được tiếp nhận hoặc bạn không phải người phụ trách.');
    case 50404:
    case 50304:
      throw new HttpError(403, 'NOT_ASSIGNED_STAFF', 'Bạn không phải nhân viên phụ trách khiếu nại này.');
    case 50305:
      throw new HttpError(400, 'COMPLAINT_CLOSED', 'Khiếu nại đã kết thúc, không thể gửi thêm tin nhắn.');
    case 50406:
      throw new HttpError(400, 'INVALID_STATUS', 'Trạng thái kết thúc không hợp lệ.');
    case 50407:
      throw new HttpError(400, 'CONCLUSION_REQUIRED', 'Kết luận xử lý bắt buộc không được để trống.');
    case 50409:
    case 50601:
      throw new HttpError(409, 'COMPLAINT_ALREADY_ASSIGNED', 'Khiếu nại đã có nhân viên khác tiếp nhận.');
    case 50602:
      throw new HttpError(403, 'STAFF_NOT_ELIGIBLE', 'Tài khoản không đủ điều kiện hoặc không thuộc vai trò CSKH.');
    case 50603:
      throw new HttpError(400, 'INVALID_STAFF_ACCOUNT', 'Tài khoản nhân viên được chỉ định không hợp lệ hoặc không hoạt động.');
    case 50700:
      throw new HttpError(404, 'ESCALATION_NOT_FOUND', 'Yêu cầu chuyển cấp không tồn tại.');
    case 50701:
      throw new HttpError(400, 'ESCALATION_INVALID_STATE', 'Yêu cầu chuyển cấp không ở trạng thái chờ tiếp nhận.');
    case 50702:
      throw new HttpError(409, 'ESCALATION_ALREADY_OPEN', 'Khiếu nại này đã có yêu cầu chuyển cấp đang chờ xử lý.');
    case 50703:
      throw new HttpError(403, 'ESCALATION_NOT_ASSIGNED', 'Bạn không phải là quản trị viên đang tiếp nhận yêu cầu này.');
    case 50704:
      throw new HttpError(400, 'ESCALATION_INVALID_STATE', 'Yêu cầu chuyển cấp không ở trạng thái đang xử lý.');
    default:
      throw error;
  }
}

function mapComplaint(row) {
  return {
    id: row.KhieuNaiID,
    senderId: row.NguoiGuiID,
    senderName: row.HoTenNguoiGui,
    orderId: row.DonDatVeID,
    type: row.LoaiKhieuNai,
    title: row.TieuDe,
    content: row.NoiDung,
    priority: row.MucDoUuTien,
    status: row.TrangThaiKhieuNai ?? row.TrangThai,
    createdAt: row.NgayTao,
    processingCount: row.SoLanXuLy,
    lastProcessedAt: row.NgayXuLyCuoi,
    lastProcessorName: row.NguoiXuLyCuoi,
    lastProcessingContent: row.NoiDungXuLyCuoi,
    assignedStaffId: row.NhanVienPhuTrachID ?? null,
    assignedStaffName: row.TenNhanVienPhuTrach ?? null,
    assignedStaffEmail: row.EmailNhanVienPhuTrach ?? null,
  };
}

function mapProcessing(row) {
  return {
    id: row.XuLyID,
    processorId: row.NguoiXuLyID,
    processorName: row.NguoiXuLy,
    content: row.NoiDungXuLy,
    processedAt: row.NgayXuLy,
    status: row.TrangThaiSauXuLy,
  };
}

function mapMessage(row) {
  return {
    id: row.TinNhanID,
    complaintId: row.KhieuNaiID,
    senderId: row.NguoiGuiID,
    senderName: row.TenNguoiGui,
    senderRole: row.VaiTroNguoiGui,
    content: row.NoiDung,
    type: row.LoaiTinNhan,
    createdAt: row.ThoiGianGui,
    isInternal: row.LoaiTinNhan === 'Nội bộ',
  };
}

function mapAssignmentHistory(row) {
  return {
    id: row.LichSuID,
    complaintId: row.KhieuNaiID,
    previousStaffId: row.NhanVienCuID,
    previousStaffName: row.TenNhanVienCu,
    newStaffId: row.NhanVienMoiID,
    newStaffName: row.TenNhanVienMoi,
    actionByName: row.NguoiThucHien,
    actionAt: row.ThoiGian,
    reason: row.LyDo,
  };
}

function mapEscalation(row) {
  return {
    id: row.YeuCauID,
    complaintId: row.KhieuNaiID,
    complaintTitle: row.TieuDeKhieuNai,
    complaintType: row.LoaiKhieuNai,
    requesterId: row.NguoiYeuCauID,
    requesterName: row.NguoiYeuCau,
    requesterEmail: row.EmailNguoiYeuCau,
    reason: row.LyDo,
    priority: row.MucDoUuTien,
    adminId: row.AdminPhuTrachID,
    adminName: row.AdminPhuTrach,
    adminEmail: row.EmailAdminPhuTrach,
    status: row.TrangThai,
    submittedAt: row.ThoiGianGui,
    claimedAt: row.ThoiGianTiepNhan,
    result: row.KetQuaXuLy,
    completedAt: row.ThoiGianHoanTat,
  };
}

function complaintParameters(userId, complaintId) {
  return { NguoiDungID: int(userId), KhieuNaiID: int(complaintId) };
}

export function createSupportService({ execute = executeProcedure } = {}) {
  async function callProcedure(key, parameters) {
    try {
      return await execute(key, parameters);
    } catch (error) {
      rethrowMappedError(error);
    }
  }

  return {
    async list(userId, filters) {
      const result = await callProcedure('SUPPORT_COMPLAINT_LIST', {
        NguoiDungID: int(userId),
        TrangThai: text(50, filters.status),
        LoaiKhieuNai: text(100, filters.type),
        SearchTerm: text(100, filters.search),
        MucDoUuTien: text(50, filters.priority ?? null),
        PhuTrach: text(50, filters.phuTrach ?? 'ALL'),
      });
      return getRows(result).map(mapComplaint);
    },

    async detail(userId, complaintId) {
      const result = await callProcedure(
        'SUPPORT_COMPLAINT_GET_DETAIL',
        complaintParameters(userId, complaintId),
      );
      const complaint = getRows(result)[0];
      if (!complaint) {
        throw new HttpError(404, 'COMPLAINT_NOT_FOUND', 'Khiếu nại không tồn tại.');
      }
      return { ...mapComplaint(complaint), processings: getRows(result, 1).map(mapProcessing) };
    },

    async orderReference(userId, complaintId) {
      const result = await callProcedure(
        'SUPPORT_COMPLAINT_GET_ORDER_REFERENCE',
        complaintParameters(userId, complaintId),
      );
      const reference = getRows(result)[0];
      return reference?.Message
        ? { order: null, message: reference.Message }
        : { order: reference ? detailDto(result) : null };
    },

    async addProcessing(userId, complaintId, input) {
      const result = await callProcedure('SUPPORT_COMPLAINT_ADD_PROCESSING', {
        ...complaintParameters(userId, complaintId),
        NoiDungXuLy: text(DbTypes.MAX, input.content),
        TrangThaiSauXuLy: text(50, input.nextStatus),
      });
      return getRows(result)[0];
    },

    async updateStatus(userId, complaintId, input) {
      const result = await callProcedure('SUPPORT_COMPLAINT_UPDATE_STATUS', {
        ...complaintParameters(userId, complaintId),
        TrangThaiMoi: text(50, input.status),
      });
      const row = getRows(result)[0];
      return { id: row?.KhieuNaiID, status: row?.TrangThai };
    },

    async listUnassigned(userId) {
      const result = await callProcedure('COMPLAINT_UNASSIGNED_LIST', {
        NguoiDungID: int(userId),
      });
      return getRows(result).map(mapComplaint);
    },

    async claimComplaint(userId, complaintId) {
      const result = await callProcedure('COMPLAINT_ASSIGN_SELF', {
        NguoiDungID: int(userId),
        KhieuNaiID: int(complaintId),
      });
      const row = getRows(result)[0];
      return {
        id: row.KhieuNaiID,
        assignedStaffId: row.NhanVienPhuTrachID,
        status: row.TrangThai,
        message: row.Message,
      };
    },

    async adminAssign(userId, complaintId, input) {
      const result = await callProcedure('COMPLAINT_ASSIGN_ADMIN', {
        AdminID: int(userId),
        KhieuNaiID: int(complaintId),
        NhanVienMoiID: int(input.staffId ?? null),
        LyDo: text(255, input.reason ?? null),
      });
      const row = getRows(result)[0];
      return {
        id: row.KhieuNaiID,
        assignedStaffId: row.NhanVienPhuTrachID,
        message: row.Message,
      };
    },

    async assignmentHistory(userId, complaintId) {
      const result = await callProcedure('COMPLAINT_ASSIGNMENT_HISTORY', {
        NguoiDungID: int(userId),
        KhieuNaiID: int(complaintId),
      });
      return getRows(result).map(mapAssignmentHistory);
    },

    async listMessages(userId, complaintId, isInternal = true) {
      const result = await callProcedure('COMPLAINT_CHAT_LIST', {
        NguoiDungID: int(userId),
        KhieuNaiID: int(complaintId),
        LaNoiBo: bit(isInternal ? 1 : 0),
      });
      return getRows(result).map(mapMessage);
    },

    async sendMessage(userId, complaintId, content) {
      const result = await callProcedure('COMPLAINT_CHAT_SEND', {
        NguoiDungID: int(userId),
        KhieuNaiID: int(complaintId),
        NoiDung: text(DbTypes.MAX, content),
        LoaiTinNhan: text(50, 'Công khai'),
      });
      const row = getRows(result)[0];
      if (!row) throw new HttpError(500, 'MESSAGE_SEND_FAILED', 'Gửi tin nhắn thất bại.');
      return mapMessage(row);
    },

    async addInternalNote(userId, complaintId, content) {
      const result = await callProcedure('COMPLAINT_CHAT_ADD_INTERNAL_NOTE', {
        NguoiDungID: int(userId),
        KhieuNaiID: int(complaintId),
        NoiDung: text(DbTypes.MAX, content),
      });
      const row = getRows(result)[0];
      if (!row) throw new HttpError(500, 'NOTE_FAILED', 'Thêm ghi chú nội bộ thất bại.');
      return mapMessage(row);
    },

    async createEscalation(userId, complaintId, input) {
      const result = await callProcedure('ESCALATION_CREATE', {
        NguoiDungID: int(userId),
        KhieuNaiID: int(complaintId),
        LyDo: text(500, input.reason),
        MucDoUuTien: text(50, input.priority ?? 'Trung bình'),
      });
      const row = getRows(result)[0];
      if (!row) throw new HttpError(500, 'ESCALATION_FAILED', 'Tạo yêu cầu chuyển cấp thất bại.');
      return mapEscalation(row);
    },

    async listEscalationsCSKH(userId, filters = {}) {
      const result = await callProcedure('ESCALATION_LIST_CSKH', {
        NguoiDungID: int(userId),
        KhieuNaiID: int(filters.complaintId ?? null),
        TrangThai: text(50, filters.status ?? null),
      });
      return getRows(result).map(mapEscalation);
    },

    async listEscalationsAdmin(userId, filters = {}) {
      const result = await callProcedure('ESCALATION_LIST_ADMIN', {
        AdminID: int(userId),
        TrangThai: text(50, filters.status ?? null),
        MucDoUuTien: text(50, filters.priority ?? null),
      });
      return getRows(result).map(mapEscalation);
    },

    async getEscalationDetail(userId, escalationId) {
      const result = await callProcedure('ESCALATION_GET_DETAIL', {
        NguoiDungID: int(userId),
        YeuCauID: int(escalationId),
      });
      const escalationRow = getRows(result, 0)[0];
      if (!escalationRow) {
        throw new HttpError(404, 'ESCALATION_NOT_FOUND', 'Yêu cầu chuyển cấp không tồn tại.');
      }
      const complaintRow = getRows(result, 1)[0] ?? null;
      const messages = getRows(result, 2).map(mapMessage);
      return {
        escalation: mapEscalation(escalationRow),
        complaint: complaintRow ? mapComplaint(complaintRow) : null,
        messages,
      };
    },

    async claimEscalation(userId, escalationId) {
      const result = await callProcedure('ESCALATION_CLAIM', {
        AdminID: int(userId),
        YeuCauID: int(escalationId),
      });
      const row = getRows(result)[0];
      if (!row) throw new HttpError(500, 'CLAIM_FAILED', 'Tiếp nhận yêu cầu thất bại.');
      return mapEscalation(row);
    },

    async processEscalation(userId, escalationId, input) {
      const result = await callProcedure('ESCALATION_PROCESS', {
        AdminID: int(userId),
        YeuCauID: int(escalationId),
        KetQuaXuLy: text(1000, input.conclusion),
        TrangThaiMoi: text(50, input.status),
      });
      const row = getRows(result)[0];
      if (!row) throw new HttpError(500, 'PROCESS_FAILED', 'Xử lý yêu cầu thất bại.');
      return mapEscalation(row);
    },

    async getCustomerPoints(userId, targetCustomerId) {
      const result = await callProcedure('SUPPORT_CUSTOMER_GET_POINTS', {
        NguoiDungID: int(userId),
        KhachHangID: int(targetCustomerId),
      });
      const profile = getRows(result, 0)[0];
      if (!profile) {
        throw new HttpError(404, 'CUSTOMER_NOT_FOUND', 'Khách hàng không tồn tại.');
      }
      const history = getRows(result, 1).map((r) => ({
        orderId: r.DonDatVeID,
        showtimeId: r.SuatChieuID,
        movieTitle: r.TenPhim,
        pointsUsed: r.DiemSuDung ?? 0,
        pointsEarned: r.DiemTichLuy ?? 0,
        compensationPoints: r.DiemBoiThuong ?? 0,
        orderStatus: r.TrangThaiDon,
        orderDate: r.NgayDat,
        paymentMethod: r.PhuongThucThanhToan,
        paymentStatus: r.TrangThaiThanhToan,
        paidAmount: r.SoTienThanhToan,
        compensationDate: r.NgayBoiThuong,
        compensationReason: r.LyDoBoiThuong,
      }));
      return {
        customer: {
          id: profile.KhachHangID ?? profile.NguoiDungID,
          name: profile.HoTen,
          email: profile.Email,
          phone: profile.SoDienThoai,
          currentPoints: profile.DiemHienTai ?? 0,
        },
        history,
      };
    },
  };
}

export const supportService = createSupportService();
