import { DbTypes, executeProcedure } from '../db/procedureClient.js';
import { HttpError } from '../utils/httpError.js';

const rowsAt = (result, index = 0) => result.recordsets?.[index] ?? (index === 0 ? result.recordset ?? [] : []);
const sqlErrorNumber = (error) => error.number ?? error.originalError?.info?.number ?? error.originalError?.number;

function reviewDto(row) {
  return { id: row.DanhGiaID, movieId: row.PhimID, reviewerName: row.NguoiDanhGia, rating: row.SoSao, content: row.NoiDung, createdAt: row.NgayDanhGia };
}

function createdReviewDto(row) {
  return { id: row.DanhGiaID, movieId: row.PhimID, rating: row.SoSao, content: row.NoiDung, createdAt: row.NgayDanhGia };
}

function complaintDto(row) {
  return { id: row.KhieuNaiID, orderId: row.DonDatVeID, type: row.LoaiKhieuNai, title: row.TieuDe, content: row.NoiDung, priority: row.MucDoUuTien, createdAt: row.NgayTao, status: row.TrangThai };
}

function processingDto(row) {
  return { id: row.XuLyID, content: row.NoiDungXuLy, processedAt: row.NgayXuLy, status: row.TrangThaiSauXuLy };
}

function mapFeedbackError(error) {
  if (error instanceof HttpError) throw error;
  switch (sqlErrorNumber(error)) {
    case 50004: throw new HttpError(403, 'REVIEW_NOT_ELIGIBLE', 'Only customers who watched this movie may review it.');
    case 50040: throw new HttpError(409, 'REVIEW_ALREADY_EXISTS', 'You have already reviewed this movie.');
    case 50041: throw new HttpError(404, 'ORDER_REFERENCE_INVALID', 'Referenced order was not found.');
    case 50042: throw new HttpError(404, 'COMPLAINT_NOT_FOUND', 'Complaint was not found.');
    // A foreign-key violation on Review_Create can only be the requested movie
    // for an authenticated caller; other domain rules remain owned by SQL.
    case 547: throw new HttpError(404, 'MOVIE_NOT_FOUND', 'Movie was not found.');
    default: throw error;
  }
}

export function createFeedbackService({ execute = executeProcedure } = {}) {
  async function listReviews(movieId) {
    try {
      const result = await execute('REVIEW_LIST_BY_MOVIE', { PhimID: { type: DbTypes.Int, value: movieId } });
      return rowsAt(result).map(reviewDto);
    } catch (error) { mapFeedbackError(error); }
  }

  async function createReview(userId, movieId, input) {
    try {
      const result = await execute('REVIEW_CREATE', {
        NguoiDungID: { type: DbTypes.Int, value: userId }, PhimID: { type: DbTypes.Int, value: movieId },
        SoSao: { type: DbTypes.Int, value: input.rating }, NoiDung: { type: DbTypes.NVarChar(1000), value: input.content },
      });
      const row = rowsAt(result)[0];
      if (!row) throw new HttpError(500, 'REVIEW_RESPONSE_INVALID', 'Review procedure did not return the review.');
      return createdReviewDto(row);
    } catch (error) { mapFeedbackError(error); }
  }

  async function listComplaints(userId) {
    try {
      const result = await execute('COMPLAINT_LIST_BY_CUSTOMER', { NguoiDungID: { type: DbTypes.Int, value: userId } });
      return rowsAt(result).map(complaintDto);
    } catch (error) { mapFeedbackError(error); }
  }

  async function createComplaint(userId, input) {
    try {
      const result = await execute('COMPLAINT_CREATE', {
        NguoiDungID: { type: DbTypes.Int, value: userId }, DonDatVeID: { type: DbTypes.Int, value: input.orderId },
        LoaiKhieuNai: { type: DbTypes.NVarChar(100), value: input.type }, TieuDe: { type: DbTypes.NVarChar(200), value: input.title },
        NoiDung: { type: DbTypes.NVarChar(DbTypes.MAX), value: input.content },
      });
      const row = rowsAt(result)[0];
      if (!row) throw new HttpError(500, 'COMPLAINT_RESPONSE_INVALID', 'Complaint procedure did not return the complaint.');
      return complaintDto(row);
    } catch (error) { mapFeedbackError(error); }
  }

  async function getComplaint(userId, complaintId) {
    try {
      const result = await execute('COMPLAINT_GET_BY_CUSTOMER', {
        NguoiDungID: { type: DbTypes.Int, value: userId }, KhieuNaiID: { type: DbTypes.Int, value: complaintId },
      });
      const row = rowsAt(result)[0];
      if (!row) throw new HttpError(404, 'COMPLAINT_NOT_FOUND', 'Complaint was not found.');
      return { ...complaintDto(row), processingHistory: rowsAt(result, 1).map(processingDto) };
    } catch (error) { mapFeedbackError(error); }
  }

  return { listReviews, createReview, listComplaints, createComplaint, getComplaint };
}

export const feedbackService = createFeedbackService();
