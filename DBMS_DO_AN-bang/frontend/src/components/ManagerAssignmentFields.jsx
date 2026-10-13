import { formatApiValue } from '../utils/dateTime';
import Select from './ui/Select';

export function ManagerAssignmentSelect({ field, label, value, managers, cinemas, disabled, editing, onChange }) {
  const manager = field === 'userId';
  const options = manager
    ? managers.map((row) => ({ id: row.NguoiDungID, name: `${row.HoTen} · ${row.Email}` }))
    : cinemas.map((row) => ({ id: row.RapID, name: `${row.TenRap}${row.ThanhPho ? ` · ${row.ThanhPho}` : ''}` }));
  return (
    <Select aria-label={label} required value={value} disabled={disabled || (manager && editing)}
      onChange={(event) => onChange(event.target.value)}>
      <option value="">{manager ? 'Chọn quản lý' : 'Chọn rạp'}</option>
      {options.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
    </Select>
  );
}

export function ManagerAssignmentsContext({ managerId, assignments }) {
  if (!managerId) return <p>Chọn Manager để xem các phân công hiện có.</p>;
  const current = assignments.filter((row) => row.NguoiDungID === Number(managerId));
  return (
    <div aria-label="Phân công hiện có của Manager">
      <h4>Phân công hiện có</h4>
      {current.length ? <ul>{current.map((row) => (
        <li key={row.PhanCongID}>
          {row.TenRap} · {formatApiValue(row.NgayBatDau)} → {row.NgayKetThuc ? formatApiValue(row.NgayKetThuc) : 'Không có ngày kết thúc'} · {row.TrangThai}
        </li>
      ))}</ul> : <p>Manager chưa có phân công.</p>}
      <p>Khi sửa phân công, Manager được giữ cố định. Kiểm tra ngày hiệu lực và các phân công hiện có trước khi lưu.</p>
    </div>
  );
}

