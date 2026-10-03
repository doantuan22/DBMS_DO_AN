import { executeProcedure, executeProcedureWithOutputs, DbTypes } from '../db/procedureClient.js';
import { verifyPassword, hashPassword } from '../utils/password.js';
import { issueToken } from '../utils/jwt.js';
import { HttpError } from '../utils/httpError.js';
import { serializeDateOnly } from '../utils/dateTime.js';

const ACTIVE = 'Hoạt động';
const invalidCredentials = () => new HttpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');

function sqlErrorNumber(error) {
  return error.number ?? error.originalError?.info?.number ?? error.originalError?.number;
}

function mapProcedureError(error) {
  switch (sqlErrorNumber(error)) {
    case 50010: throw new HttpError(409, 'EMAIL_IN_USE', 'Email is already registered.');
    case 50011:
    case 50015: throw new HttpError(409, 'PHONE_IN_USE', 'Phone number is already registered.');
    case 50012: throw new HttpError(503, 'AUTH_CONFIGURATION_ERROR', 'Customer registration is not configured.');
    default: throw error;
  }
}

function permissionsFrom(rows = []) {
  return rows.map((row) => ({ code: row.MaQuyen, name: row.TenQuyen }));
}

function assignmentsFrom(rows = []) {
  return rows.map((row) => ({
    cinemaId: row.RapID,
    name: row.TenRap,
    city: row.ThanhPho,
    assignmentStatus: row.TrangThaiPhanCong ?? 'Hiệu lực',
  }));
}

export function toUserDto(row, permissions = [], cinemaAssignments = []) {
  return {
    userId: row.NguoiDungID,
    name: row.HoTen,
    email: row.Email,
    phone: row.SoDienThoai ?? null,
    createdAt: row.NgayTao ?? null,
    status: row.TrangThai,
    role: row.MaVaiTro,
    roleName: row.TenVaiTro,
    birthday: serializeDateOnly(row.NgaySinh),
    gender: row.GioiTinh ?? null,
    loyaltyPoints: row.DiemTichLuy ?? 0,
    permissions,
    cinemaAssignments,
  };
}

export function createAuthService({
  execute = executeProcedure,
  executeWithOutputs = executeProcedureWithOutputs,
  hash = hashPassword,
  verify = verifyPassword,
  createToken = issueToken,
} = {}) {
  async function registerCustomer(input) {
    const passwordHash = await hash(input.MatKhau);
    try {
      const result = await executeWithOutputs('AUTH_REGISTER_CUSTOMER', {
        HoTen: { type: DbTypes.NVarChar(100), value: input.HoTen },
        Email: { type: DbTypes.VarChar(150), value: input.Email },
        MatKhauHash: { type: DbTypes.VarChar(255), value: passwordHash },
        SoDienThoai: { type: DbTypes.VarChar(20), value: input.SoDienThoai },
        NgaySinh: { type: DbTypes.Date, value: input.NgaySinh },
        GioiTinh: { type: DbTypes.NVarChar(10), value: input.GioiTinh },
      }, { NewUserId: DbTypes.Int });
      const row = result.recordset?.[0];
      if (!row) throw new HttpError(500, 'AUTH_RESPONSE_INVALID', 'Registration could not be completed.');
      return toUserDto(row);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      mapProcedureError(error);
    }
  }

  async function login(input) {
    const result = await execute('AUTH_LOGIN', {
      Email: { type: DbTypes.VarChar(150), value: input.Email },
    });
    const row = result.recordsets?.[0]?.[0] ?? result.recordset?.[0];
    if (!row || row.TrangThai !== ACTIVE || !row.MatKhauHash) throw invalidCredentials();
    if (!(await verify(input.MatKhau, row.MatKhauHash))) throw invalidCredentials();

    const permissions = permissionsFrom(result.recordsets?.[1] ?? []);
    const cinemaAssignments = row.MaVaiTro === 'QUAN_LY_RAP' ? assignmentsFrom(result.recordsets?.[2] ?? []) : [];
    const token = createToken(row.NguoiDungID);
    return { ...token, user: toUserDto(row, permissions, cinemaAssignments) };
  }

  async function getCurrentUser(userId) {
    const [profileResult, permissionsResult] = await Promise.all([
      execute('USER_GET_CURRENT', { NguoiDungID: { type: DbTypes.Int, value: userId } }),
      execute('RBAC_GET_PERMISSIONS_BY_USER', { NguoiDungID: { type: DbTypes.Int, value: userId } }),
    ]);
    const row = profileResult.recordset?.[0];
    if (!row || row.TrangThai !== ACTIVE) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.');
    const permissions = permissionsFrom(permissionsResult.recordset ?? []);
    const cinemaAssignments = row.MaVaiTro === 'QUAN_LY_RAP'
      ? assignmentsFrom((await execute('MANAGER_LIST_ASSIGNED_CINEMAS', { NguoiDungID: { type: DbTypes.Int, value: userId } })).recordset ?? [])
      : [];
    return toUserDto(row, permissions, cinemaAssignments);
  }

  async function updateProfile(userId, fields) {
    try {
      const result = await execute('USER_UPDATE_PROFILE', {
        NguoiDungID: { type: DbTypes.Int, value: userId },
        HoTen: { type: DbTypes.NVarChar(100), value: fields.HoTen },
        SoDienThoai: { type: DbTypes.VarChar(20), value: fields.SoDienThoai },
        NgaySinh: { type: DbTypes.Date, value: fields.NgaySinh },
        GioiTinh: { type: DbTypes.NVarChar(10), value: fields.GioiTinh },
      });
      if (!result.recordset?.[0]) throw new HttpError(404, 'USER_NOT_FOUND', 'User was not found.');
      return getCurrentUser(userId);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      mapProcedureError(error);
    }
  }

  return { registerCustomer, login, getCurrentUser, updateProfile };
}

export const authService = createAuthService();
