import { useRef, useState } from 'react';
import { fieldsFor, initialManagerValues, managerBody } from '../utils/managerForms';
import ResourceSelect from './ui/ResourceSelect';

const labels = { room: 'phòng', seat: 'ghế', showtime: 'suất', pricing: 'giá' };
export default function ManagerResourceForm({
  kind,
  row,
  onSave,
  onCancel,
  onRequestCancel,
  onDirtyChange,
  busy,
  scopeKey,
  lookups = {},
  draft,
  onDraftChange,
}) {
  const [initialValues] = useState(() => draft?.initialValues ?? initialManagerValues(kind, row));
  const [values, setValues] = useState(() => draft?.values ?? initialValues);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const editing = Boolean(row);
  const updateField = (name, value) => {
    const next = { ...values, [name]: value };
    setValues(next);
    const dirty = JSON.stringify(next) !== JSON.stringify(initialValues);
    onDraftChange?.({ values: next, initialValues, dirty });
    onDirtyChange?.(dirty);
  };
  return (
    <form
      className="catalog-form"
      aria-label={`${editing ? 'Sửa' : 'Tạo'} ${labels[kind]}`}
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending.current || busy) return;
        pending.current = true;
        setError('');
        try {
          await onSave(managerBody(kind, values, editing));
          setValues(initialValues);
          onDirtyChange?.(false);
          onDraftChange?.(null);
        } catch (failure) {
          setError(failure.message);
        } finally {
          pending.current = false;
        }
      }}
    >
      {editing && (
        <h3>
          Sửa {labels[kind]}
        </h3>
      )}
      {fieldsFor(kind, editing).map((field) => {
        const { name, label, type, options } = field;
        if (type === 'resource') {
          const lookup = lookups[field.lookup] ?? {};
          const fallbackOption =
            editing && field.lookup === 'rooms'
              ? { id: row.roomId, label: row.roomName ?? 'Phòng hiện tại' }
              : editing && field.lookup === 'movies'
                ? { id: row.movieId, label: row.movieTitle ?? 'Phim hiện tại' }
                : undefined;
          return (
            <ResourceSelect
              key={name}
              label={label}
              scopeKey={scopeKey}
              value={values[name]}
              options={lookup.options ?? []}
              lookupStatus={lookup.status ?? 'loading'}
              lookupError={lookup.error}
              onRetry={lookup.onRetry}
              onChange={(value) => updateField(name, value)}
              fallbackOption={fallbackOption}
              readOnly={Boolean(field.readOnly)}
              disabled={busy}
            />
          );
        }
        return (
        <label key={name}>
          {label}{type === 'datetime-local' ? ' (UTC+7)' : ['surcharge', 'basePrice'].includes(name) ? ' (VND)' : ''}
          {type === 'select' ? (
            <select
              aria-label={label}
              value={values[name]}
              disabled={busy}
              onChange={(event) =>
                updateField(name, event.target.value)
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
                updateField(name, event.target.value)
              }
            />
          )}
        </label>
        );
      })}
      {['showtime', 'pricing'].includes(kind) && <p className="operations__help">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(values[kind === 'pricing' ? 'surcharge' : 'basePrice']) || 0)} · {kind === 'pricing' ? 'Phụ thu; không thay đổi giá vé đã lưu.' : 'Giá vé cơ bản; server xác nhận lịch chiếu và giá khi lưu.'}</p>}
      <button className="catalog-button" disabled={busy}>
        {editing ? 'Lưu' : `Tạo ${labels[kind]}`}
      </button>
      {editing && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (onRequestCancel) { onRequestCancel(); return; }
            onDirtyChange?.(false);
            onDraftChange?.(null);
            onCancel?.();
          }}
        >
          Bỏ chọn
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
