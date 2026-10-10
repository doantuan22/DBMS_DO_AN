import { DbTypes, executeProcedure } from '../db/procedureClient.js';
import { HttpError } from '../utils/httpError.js';
import { detailDto } from './orderService.js';

const SQL_ERROR = Object.freeze({
  SUPPORT_FORBIDDEN: 50060,
  COMPLAINT_NOT_FOUND: 50061,
});

const int = (value) => ({ type: DbTypes.Int, value });
const text = (length, value) => ({ type: DbTypes.NVarChar(length), value });

function getRows(result, index = 0) {
  if (result.recordsets?.[index]) return result.recordsets[index];
  return index === 0 ? (result.recordset ?? []) : [];
}

function getSqlErrorNumber(error) {
  return error.number ?? error.originalError?.info?.number;
}

function rethrowMappedError(error) {
  if (error instanceof HttpError) throw error;

  switch (getSqlErrorNumber(error)) {
    case 50405:
      throw new HttpError(400, 'INVALID_PRIORITY', 'priority is not supported.');
    case 50030:
      throw new HttpError(404, 'ORDER_NOT_FOUND', 'Referenced order was not found.');
    case SQL_ERROR.SUPPORT_FORBIDDEN:
      throw new HttpError(403, 'SUPPORT_FORBIDDEN', 'Support permission is required.');
    case SQL_ERROR.COMPLAINT_NOT_FOUND:
      throw new HttpError(404, 'COMPLAINT_NOT_FOUND', 'Complaint was not found.');
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
    status: row.TrangThaiKhieuNai,
    createdAt: row.NgayTao,
    processingCount: row.SoLanXuLy,
    lastProcessedAt: row.NgayXuLyCuoi,
    lastProcessorName: row.NguoiXuLyCuoi,
    lastProcessingContent: row.NoiDungXuLyCuoi,
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
        throw new HttpError(404, 'COMPLAINT_NOT_FOUND', 'Complaint was not found.');
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
  };
}

export const supportService = createSupportService();
