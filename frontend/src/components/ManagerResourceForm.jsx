import { useState } from 'react';
import { fieldsFor, initialManagerValues, managerBody } from '../utils/managerForms';

const labels = { room: 'phòng', seat: 'ghế', showtime: 'suất', pricing: 'giá' };
export default function ManagerResourceForm({ kind, row, onSave, onCancel, busy }) {
  const [values, setValues] = useState(() => initialManagerValues(kind, row));
  const [error, setError] = useState('');
  const editing = Boolean(row);
  return (
    <form
      className="catalog-form"
      aria-label={`${editing ? 'Sửa' : 'Tạo'} ${labels[kind]}`}
      onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        try {
          await onSave(managerBody(kind, values, editing));
        } catch (failure) {
          setError(failure.message);
        }
      }}
    >
      {editing && (
        <h3>
          Sửa {labels[kind]} #{row.id}
        </h3>
      )}
      {editing && kind === 'showtime' && <p>Phòng: {row.roomName ?? row.roomId}</p>}
      {fieldsFor(kind, editing).map(({ name, label, type, options }) => (
        <label key={name}>
          {label}
          {type === 'select' ? (
            <select
              aria-label={label}
              value={values[name]}
              disabled={busy}
              onChange={(event) =>
                setValues((current) => ({ ...current, [name]: event.target.value }))
              }
            >
              {options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              aria-label={label}
              placeholder={label}
              type={type}
              value={values[name]}
              disabled={busy}
              maxLength={name === 'name' ? 100 : name === 'row' ? 10 : undefined}
              min={
                type === 'number' ? (['surcharge', 'basePrice'].includes(name) ? 0 : 1) : undefined
              }
              step={
                type === 'number'
                  ? ['surcharge', 'basePrice'].includes(name)
                    ? '0.01'
                    : '1'
                  : type === 'datetime-local'
                    ? '0.001'
                    : undefined
              }
              required={name !== 'endsOn'}
              onChange={(event) =>
                setValues((current) => ({ ...current, [name]: event.target.value }))
              }
            />
          )}
        </label>
      ))}
      <button className="catalog-button" disabled={busy}>
        {editing ? 'Lưu' : `Tạo ${labels[kind]}`}
      </button>
      {editing && (
        <button type="button" disabled={busy} onClick={onCancel}>
          Bỏ chọn
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
