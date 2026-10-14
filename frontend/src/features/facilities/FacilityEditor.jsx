import { useId, useRef } from 'react';
import { ROOM_TYPES, SEAT_TYPES, RESOURCE_STATUSES } from '../../../../shared/resourceContract.mjs';
import Dialog from '../../components/ui/Dialog';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FormField from '../../components/ui/FormField';
import AsyncState from '../../components/ui/AsyncState';
import { facilityLabels } from './facilityModel';

export default function FacilityEditor({ kind, editor, contextLabel, busy, controller }) {
  const id = useId(),
    first = useRef(null),
    editing = Boolean(editor.row);
  const field = (name, label, options, type = 'text', maxLength) => (
    <FormField
      key={name}
      label={label}
      required={['name', 'row', 'number', 'type', 'address', 'city', 'url'].includes(name)}
      error={editor.errors[name]}
    >
      {options ? (
        <Select
          ref={kind === 'seats' && editing && name === 'type' ? first : undefined}
          value={editor.values[name]}
          disabled={busy}
          onChange={(event) => controller.changeField(name, event.target.value)}
        >
          {options.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
      ) : (
        <Input
          ref={['name', 'row', 'url'].includes(name) ? first : undefined}
          type={type}
          value={editor.values[name]}
          disabled={busy}
          maxLength={maxLength}
          min={type === 'number' ? (name === 'displayOrder' ? 0 : 1) : undefined}
          step={type === 'number' ? 1 : undefined}
          onChange={(event) => controller.changeField(name, event.target.value)}
        />
      )}
    </FormField>
  );
  return (
    <Dialog
      open
      size="facility-drawer"
      title={`${editing ? 'Chỉnh sửa' : 'Thêm'} ${facilityLabels[kind]}`}
      description={contextLabel}
      initialFocusRef={first}
      busy={busy}
      onOpenChange={(open) => {
        if (!open) controller.closeEditor();
      }}
      footer={
        <>
          <Button variant="secondary" disabled={busy} onClick={() => controller.closeEditor()}>
            Hủy
          </Button>
          <Button type="submit" form={id} loading={busy}>
            Lưu {facilityLabels[kind]}
          </Button>
        </>
      }
    >
      <form
        id={id}
        className="facility-editor"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void controller.save();
        }}
      >
        {kind !== 'cinemas' && (
          <FormField label={kind === 'seats' ? 'Phòng / rạp' : 'Rạp'}>
            <Input readOnly value={contextLabel} />
          </FormField>
        )}
        {kind === 'seats' && (
          <>
            {!editing ? (
              <>
                {field('row', 'Hàng ghế', null, 'text', 10)}
                {field('number', 'Số ghế', null, 'number')}
              </>
            ) : (
              <p>Ghế {editor.row.label} · hàng/số ghế được giữ nguyên.</p>
            )}
            {field('type', 'Loại ghế', SEAT_TYPES)}
          </>
        )}
        {kind === 'rooms' && (
          <>
            {field('name', 'Tên phòng', null, 'text', 100)}
            {field('type', 'Loại phòng', ROOM_TYPES)}
          </>
        )}
        {kind === 'cinemas' && (
          <>
            {field('name', 'Tên rạp', null, 'text', 150)}
            {field('address', 'Địa chỉ', null, 'text', 255)}
            {field('city', 'Thành phố', null, 'text', 100)}
            {field('phone', 'Điện thoại', null, 'tel', 20)}
            {field('description', 'Mô tả', null, 'text', 500)}
            {!editing && field('operatingSince', 'Ngày hoạt động', null, 'date')}
          </>
        )}
        {kind === 'images' && (
          <>
            {field('url', 'URL hoặc đường dẫn ảnh', null, 'text', 500)}
            {field('description', 'Chú thích', null, 'text', 255)}
            {field('displayOrder', 'Thứ tự hiển thị', null, 'number')}
            {!editing && (
              <label className="facility-checkbox">
                <input
                  type="checkbox"
                  checked={editor.values.cover}
                  disabled={busy}
                  onChange={(event) => controller.changeField('cover', event.target.checked)}
                />
                Đặt làm ảnh chính
              </label>
            )}
          </>
        )}
        {(editing || kind === 'images') &&
          field(
            'status',
            'Trạng thái',
            RESOURCE_STATUSES[kind === 'images' ? 'cinemaImages' : kind],
          )}
        {!editing && kind !== 'images' && (
          <p className="facility-help">{facilityLabels[kind]} mới có trạng thái Hoạt động.</p>
        )}
        {Object.values(editor.errors).some(Boolean) && (
          <p role="alert">Kiểm tra các trường được đánh dấu trước khi lưu.</p>
        )}
        {editor.error && (
          <AsyncState status="error" error={editor.error} errorMessage={editor.error.message} />
        )}
      </form>
    </Dialog>
  );
}
