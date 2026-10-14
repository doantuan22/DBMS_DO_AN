import { useEffect, useRef } from 'react';
import { formatDateTime } from '../../utils/dateTime';
import { money } from '../operations/operationsModel';
import { bookingCanEdit, bookingSelection } from './bookingModel';
import SeatMap from '../../components/SeatMap';
import { AsyncState, Button, FormField, Input, Select } from '../../components/ui';

export default function BookingEditor({ state, controller, cinemaId }) {
  const { draft, step, pending: busy } = state,
    editing = state.editor === 'edit';
  const order = state.detail.status === 'success' ? state.detail.order : null,
    selection = bookingSelection(state);
  const cinemas = state.metadata.data?.cinemas ?? [],
    showtimes = selection.current ? state.options.data.showtimes : [];
  const show = showtimes.find((row) => String(row.SuatChieuID) === draft.showtimeId);
  const customerName = draft.customer?.HoTen ?? draft.customer?.name,
    customerEmail = draft.customer?.Email ?? draft.customer?.email;
  const labels = ['Khách hàng', 'Suất chiếu', 'Ghế', 'Kiểm tra'];
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  return (
    <section
      className="staff-bookings__editor"
      aria-label={editing ? 'Sửa ghế đơn đặt vé' : 'Tạo đơn đặt vé'}
    >
      <h2 ref={heading} tabIndex={-1}>
        {editing ? `Sửa ghế đơn #${order?.id ?? state.selectedId}` : 'Tạo đơn cho Customer có sẵn'}{' '}
        · Bước {step + 1}: {labels[step]}
      </h2>
      <ol className="staff-bookings__steps" aria-label="Các bước đặt vé">
        {labels.map((label, index) => (
          <li
            key={label}
            aria-current={step === index ? 'step' : undefined}
            className={step === index ? 'is-active' : ''}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>
      {!editing && step === 0 && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void controller.searchCustomers();
            }}
            className="staff-bookings__actions"
          >
            <FormField
              label="Tìm Customer bằng tên/email/SĐT"
              required
              hint="Từ 2 đến 100 ký tự. Chỉ Customer đang hoạt động."
            >
              <Input
                value={state.customerSearch}
                minLength={2}
                maxLength={100}
                required
                disabled={busy}
                onChange={(e) => controller.setCustomerSearch(e.target.value)}
              />
            </FormField>
            <Button type="submit" disabled={busy || state.customerSearch.trim().length < 2}>
              Tìm khách hàng
            </Button>
          </form>
          <AsyncState
            status={
              state.customers.status === 'success'
                ? state.customers.data.customers.length
                  ? 'idle'
                  : 'empty'
                : state.customers.status
            }
            error={state.customers.error}
            onRetry={() => void controller.searchCustomers()}
            emptyMessage="Không có Customer đang hoạt động phù hợp."
          />
          {state.customers.status === 'success' && state.customers.data.customers.length > 0 && (
            <FormField label="Khách hàng có sẵn" required>
              <Select
                value={draft.customer?.NguoiDungID ?? ''}
                disabled={busy}
                onChange={(e) => controller.chooseCustomer(e.target.value)}
              >
                <option value="">Chọn Customer</option>
                {state.customers.data.customers.map((row) => (
                  <option key={row.NguoiDungID} value={row.NguoiDungID}>
                    {row.HoTen} · {row.Email} · {row.SoDienThoai || 'Chưa có SĐT'}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          {state.customers.data?.total > 50 && (
            <p>
              Hiển thị 50/{state.customers.data.total} Customer. Thu hẹp từ khóa để chọn đúng người.
            </p>
          )}
        </>
      )}
      {draft.customer && (
        <p>
          Khách hàng đã chọn: <strong>{customerName}</strong> · {customerEmail}
        </p>
      )}
      {!editing && step === 1 && (
        <>
          <FormField label="Rạp đặt vé" required>
            <Select
              value={draft.cinemaId}
              disabled={busy || Boolean(cinemaId)}
              onChange={(e) => controller.chooseCinema(e.target.value)}
            >
              <option value="">Chọn rạp</option>
              {cinemas.map((row) => (
                <option key={row.RapID} value={row.RapID}>
                  {row.TenRap}
                </option>
              ))}
            </Select>
          </FormField>
          <AsyncState
            status={state.options.status === 'success' ? 'idle' : state.options.status}
            error={state.options.error}
            onRetry={() => void controller.reloadOptions()}
            loadingMessage="Đang tải suất chiếu và ghế…"
          />
          <FormField label="Suất chiếu / phim / phòng" required>
            <Select
              value={draft.showtimeId}
              disabled={busy || !draft.cinemaId || !selection.current}
              onChange={(e) => controller.chooseShowtime(e.target.value)}
            >
              <option value="">Chọn suất chiếu</option>
              {showtimes.map((row) => (
                <option key={row.SuatChieuID} value={row.SuatChieuID}>
                  {row.TenPhim} · {formatDateTime(row.ThoiGianBatDau)} · {row.TenPhong} ·{' '}
                  {row.DinhDang}
                </option>
              ))}
            </Select>
          </FormField>
          {state.options.data?.showtimeTotal > 200 && (
            <p>
              Hiển thị 200/{state.options.data.showtimeTotal} suất gần nhất tại rạp. Các suất xa hơn
              chưa có tra cứu bổ sung.
            </p>
          )}
          {selection.current && !showtimes.length && (
            <p role="status">Rạp chưa có suất chiếu đủ điều kiện đặt vé.</p>
          )}
        </>
      )}
      {step === 2 && (
        <>
          <p>
            {show?.TenPhim ?? order?.movieTitle} ·{' '}
            {show ? formatDateTime(show.ThoiGianBatDau) : formatDateTime(order?.startsAt)} ·{' '}
            {show?.TenPhong ?? order?.roomName}
          </p>
          <AsyncState
            status={state.options.status === 'success' ? 'idle' : state.options.status}
            error={state.options.error}
            onRetry={() => void controller.reloadOptions()}
            loadingMessage="Đang tải sơ đồ ghế…"
          />
          {selection.current && (
            <fieldset
              disabled={busy || (editing && !bookingCanEdit(order))}
              className="staff-bookings__seat-fieldset"
            >
              <SeatMap
                seats={selection.seats}
                selectedSeatIds={draft.seatIds}
                limitNotice={state.limitNotice}
                onToggle={controller.toggleSeat}
              />
            </fieldset>
          )}
          {draft.seatIds.length > 0 && (
            <div className="staff-bookings__actions" aria-label="Ghế đã chọn">
              {draft.seatIds.map((id) => (
                <Button
                  key={id}
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => controller.toggleSeat(id)}
                >
                  Bỏ ghế{' '}
                  {selection.seats.find((seat) => seat.id === id)?.label ?? 'không còn trong sơ đồ'}
                </Button>
              ))}
            </div>
          )}
          {draft.seatIds.length > 0 && !selection.valid && selection.current && (
            <p role="alert">Một số ghế đã không còn khả dụng. Bỏ ghế xung đột và chọn ghế trống.</p>
          )}
          <p>
            Giá vé dự kiến từ server: <strong>{money(selection.preview)}</strong>. Ghế chỉ được giữ
            sau khi lưu thành công.
          </p>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void controller.reloadOptions()}
          >
            Tải lại ghế
          </Button>
        </>
      )}
      {step === 3 && (
        <section className="staff-bookings__review" aria-label="Kiểm tra đơn trước khi lưu">
          <h3>Kiểm tra trước khi {editing ? 'đổi ghế' : 'tạo đơn'}</h3>
          <p>
            <strong>{customerName}</strong> · {customerEmail}
          </p>
          <p>
            {show?.TenRap ?? order?.cinemaName} · {show?.TenPhim ?? order?.movieTitle} ·{' '}
            {show?.TenPhong ?? order?.roomName}
          </p>
          <p>
            {show ? formatDateTime(show.ThoiGianBatDau) : formatDateTime(order?.startsAt)} (UTC+7)
          </p>
          <p>
            Ghế: <strong>{selection.selected.map((seat) => seat.label).join(', ')}</strong> ·{' '}
            {draft.seatIds.length} vé
          </p>
          <p>
            Giá dự kiến: <strong>{money(selection.preview)}</strong>. Server xác nhận lại giá và ghế
            khi lưu.
          </p>
          {editing && (
            <p>
              Giữ nguyên Customer, suất chiếu và hạn giữ chỗ: {formatDateTime(order?.holdExpiresAt)}
              .
            </p>
          )}
        </section>
      )}
      {editing && !bookingCanEdit(order) && state.detail.status === 'success' && (
        <p role="alert">
          Đơn đã hết hạn giữ chỗ hoặc không còn cho phép đổi ghế. Tải lại chi tiết để xem trạng thái
          mới.
        </p>
      )}
      <div className="staff-bookings__actions">
        {step > (editing ? 2 : 0) && (
          <Button variant="secondary" disabled={busy} onClick={() => controller.goToStep(step - 1)}>
            Quay lại
          </Button>
        )}
        {step < 3 ? (
          <Button
            disabled={
              busy ||
              (step === 0 && !draft.customer) ||
              (step === 1 && (!draft.showtimeId || !selection.current)) ||
              (step === 2 && (!selection.valid || (editing && !bookingCanEdit(order))))
            }
            onClick={() => controller.goToStep(step + 1)}
          >
            Tiếp tục
          </Button>
        ) : (
          <Button
            loading={busy}
            disabled={!selection.valid || (editing && !bookingCanEdit(order))}
            onClick={controller.requestSave}
          >
            {editing ? 'Lưu ghế' : 'Tạo đơn Chờ thanh toán'}
          </Button>
        )}
        <Button variant="secondary" disabled={busy} onClick={controller.closeEditor}>
          Đóng form
        </Button>
      </div>
      <p className="staff-bookings__help">
        Luồng nhân viên hiện hỗ trợ đặt vé theo ghế. Khách hàng thanh toán qua luồng hiện có; giá và
        trạng thái thanh toán không chỉnh tay.
      </p>
    </section>
  );
}
