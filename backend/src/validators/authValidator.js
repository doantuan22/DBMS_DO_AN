import { HttpError } from '../utils/httpError.js';

const allowedRegistrationFields = new Set(['HoTen', 'Email', 'MatKhau', 'SoDienThoai', 'NgaySinh', 'GioiTinh']);
const allowedProfileFields = new Set(['HoTen', 'SoDienThoai', 'NgaySinh', 'GioiTinh']);

function objectBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Request body must be a JSON object.');
  }
  return body;
}

function rejectUnknownFields(body, allowed) {
  const unexpected = Object.keys(body).filter((key) => !allowed.has(key));
  if (unexpected.length) {
    const containsAccessFields = unexpected.some((key) => /role|vaiTro|permission|quyen|status|trangThai|userId|nguoiDungId/i.test(key));
    throw new HttpError(400, containsAccessFields ? 'ACCESS_FIELDS_NOT_ALLOWED' : 'UNKNOWN_FIELDS', 'Request contains unsupported fields.');
  }
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new HttpError(400, 'INVALID_REQUEST', `${field} must be text.`);
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new HttpError(400, 'INVALID_REQUEST', `${field} is too long.`);
  return normalized;
}

function dateOrNull(value, field) {
  const date = optionalText(value, field, 10);
  if (date === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new HttpError(400, 'INVALID_REQUEST', `${field} must be a valid YYYY-MM-DD date.`);
  }
  return date;
}

function validateName(value) {
  if (typeof value !== 'string') throw new HttpError(400, 'INVALID_REQUEST', 'HoTen is required.');
  const name = value.trim();
  if (!name || name.length > 100) throw new HttpError(400, 'INVALID_REQUEST', 'HoTen must be between 1 and 100 characters.');
  return name;
}

function validateEmail(value) {
  if (typeof value !== 'string') throw new HttpError(400, 'INVALID_REQUEST', 'Email is required.');
  const email = value.trim().toLowerCase();
  if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Email is invalid.');
  }
  return email;
}

function validatePhone(value) {
  const phone = optionalText(value, 'SoDienThoai', 20);
  if (phone !== null && !/^\+?[0-9 ()-]{6,20}$/.test(phone)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'SoDienThoai is invalid.');
  }
  return phone;
}

function validateGender(value) {
  const gender = optionalText(value, 'GioiTinh', 10);
  if (gender !== null && !['Nam', 'Nữ', 'Khác'].includes(gender)) {
    throw new HttpError(400, 'INVALID_REQUEST', 'GioiTinh is invalid.');
  }
  return gender;
}

function profileFields(body) {
  return {
    HoTen: validateName(body.HoTen),
    SoDienThoai: validatePhone(body.SoDienThoai),
    NgaySinh: dateOrNull(body.NgaySinh, 'NgaySinh'),
    GioiTinh: validateGender(body.GioiTinh),
  };
}

export function validateRegister(body) {
  const input = objectBody(body);
  rejectUnknownFields(input, allowedRegistrationFields);
  if (typeof input.MatKhau !== 'string' || Buffer.byteLength(input.MatKhau, 'utf8') < 8 || Buffer.byteLength(input.MatKhau, 'utf8') > 72) {
    throw new HttpError(400, 'INVALID_REQUEST', 'MatKhau must be 8 to 72 bytes.');
  }
  return {
    ...profileFields(input),
    Email: validateEmail(input.Email),
    MatKhau: input.MatKhau,
  };
}

export function validateLogin(body) {
  const input = objectBody(body);
  rejectUnknownFields(input, new Set(['Email', 'MatKhau']));
  if (typeof input.MatKhau !== 'string' || !input.MatKhau || Buffer.byteLength(input.MatKhau, 'utf8') > 72) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Email and password are required.');
  }
  return { Email: validateEmail(input.Email), MatKhau: input.MatKhau };
}

export function validateProfile(body) {
  const input = objectBody(body);
  rejectUnknownFields(input, allowedProfileFields);
  return profileFields(input);
}
