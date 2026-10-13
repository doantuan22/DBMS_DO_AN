export function passwordMessage(value) {
  const bytes = new TextEncoder().encode(value ?? '').length;
  return bytes < 8 || bytes > 72 ? 'Mật khẩu cần từ 8 đến 72 byte UTF-8.' : '';
}
