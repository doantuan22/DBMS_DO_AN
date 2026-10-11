import { useState } from 'react';
import { fieldsFor, initialManagerValues, managerBody } from '../utils/managerForms';
import NamedResourceSelect from './NamedResourceSelect';

const labels = { room: 'phòng', seat: 'ghế', showtime: 'suất', pricing: 'giá' };
export default function ManagerResourceForm({
  kind,
  row,
  onSave,
  onCancel,
  onDirtyChange,
  busy,
  lookups = {},
}) {
  const [initialValues] = useState(() => initialManagerValues(kind, row));
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const editing = Boolean(row);
  const updateField = (name, value) => {
    const next = { ...values, [name]: value };
    setValues(next);
    onDirtyChange?.(JSON.stringify(next) !== JSON.stringify(initialValues));
  };
  return (
    <form
      className="catalog-form"
      aria-label={`${editing ? 'Sửa' : 'Tạo'} ${labels[kind]}`}
      onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        try {
          await onSave(managerBody(kind, values, editing));
          setValues(initialValues);
          onDirtyChange?.(false);
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
            <NamedResourceSelect
              key={name}
              label={label}
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
          {label}
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
      <button className="catalog-button" disabled={busy}>
        {editing ? 'Lưu' : `Tạo ${labels[kind]}`}
      </button>
      {editing && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            onDirtyChange?.(false);
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
