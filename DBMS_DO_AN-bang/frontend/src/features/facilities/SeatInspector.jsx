import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';

export default function SeatInspector({ seat, roomName, mode, busy, onEdit, onDelete }) {
  return <section className="facility-panel facility-inspector" aria-label="Chi tiết ghế">
    <h2>Chi tiết ghế</h2>{seat ? <>
      <p className="facility-selected-seat">{seat.label}</p><p>{roomName}</p>
      <dl className="facility-details"><div><dt>Hàng / số</dt><dd>{seat.row} / {seat.number}</dd></div><div><dt>Loại ghế</dt><dd>{seat.type}</dd></div><div><dt>{mode === 'occupancy' ? 'Tình trạng suất' : 'Trạng thái cấu hình'}</dt><dd><StatusBadge status={seat.status} /></dd></div></dl>
      {mode === 'occupancy' ? <p className="facility-help">Chế độ quan sát theo suất chiếu, chỉ đọc.</p> : <>
        <p className="facility-help">Hệ thống kiểm tra lịch sử vé và vé hiệu lực trước khi cho phép đổi cấu hình hoặc xóa ghế.</p>
        <div className="facility-actions">{onEdit && <Button disabled={busy} onClick={() => onEdit(seat)}>Sửa ghế</Button>}{onDelete && <Button variant="danger" disabled={busy} onClick={() => onDelete(seat)}>Xóa ghế</Button>}</div>
      </>}
    </> : <p className="facility-empty">Chọn một ghế trên sơ đồ hoặc danh sách để xem thông tin.</p>}
  </section>;
}
