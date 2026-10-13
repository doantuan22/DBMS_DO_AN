import { useId, useState } from 'react';
import Select from './ui/Select';

const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase();

export default function NamedResourceSelect({
  label,
  value,
  options = [],
  lookupStatus = 'loading',
  lookupError,
  onRetry,
  onChange,
  fallbackOption,
  disabled = false,
  readOnly = false,
  readOnlyHint = 'Theo hợp đồng hiện tại, không thể đổi phòng khi sửa suất chiếu.',
  required = true,
  emptyMessage = 'Không có lựa chọn phù hợp.',
  placeholder,
}) {
  const id = useId();
  const [search, setSearch] = useState('');
  const selectedValue = value === null || value === undefined ? '' : String(value);
  const available = options.map((option) => ({
    ...option,
    id: String(option.id),
    label: String(option.label ?? option.name ?? option.title ?? ''),
  }));
  if (
    fallbackOption?.id !== null &&
    fallbackOption?.id !== undefined &&
    !available.some((option) => option.id === String(fallbackOption.id))
  ) {
    available.unshift({
      ...fallbackOption,
      id: String(fallbackOption.id),
      label: String(fallbackOption.label ?? fallbackOption.name ?? fallbackOption.title ?? ''),
    });
  }

  const query = normalize(search);
  const filtered = query
    ? available.filter((option) => normalize(option.label).includes(query))
    : available;
  const selected = available.find((option) => option.id === selectedValue);
  const visible =
    selected && !filtered.some((option) => option.id === selected.id)
      ? [selected, ...filtered]
      : filtered;
  const lookupFailed = lookupStatus === 'error';
  const lookupLoading = lookupStatus === 'loading';
  const isDisabled = disabled || readOnly || lookupLoading || lookupFailed;

  return (
    <div className="manager-resource-select">
      <label htmlFor={`${id}-search`}>
        Tìm {label.toLocaleLowerCase()}
        <span className="manager-resource-select__search-input-wrap">
          <input
            id={`${id}-search`}
            type="search"
            value={search}
            disabled={disabled || readOnly || lookupLoading || lookupFailed}
            autoComplete="off"
            placeholder={`Nhập tên ${label.toLocaleLowerCase()}...`}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                if (filtered.length > 0) onChange(filtered[0].id);
              }
            }}
            aria-describedby={`${id}-help`}
          />
          <button
            type="button"
            className="ui-button ui-button--secondary ui-button--sm manager-resource-select__search-btn"
            disabled={disabled || readOnly || lookupLoading || lookupFailed || !search.trim()}
            onClick={() => {
              if (filtered.length > 0) onChange(filtered[0].id);
            }}
          >
            Tìm
          </button>
        </span>
      </label>
      <label htmlFor={id}>
        {label}
        <Select
          id={id}
          aria-label={label}
          aria-invalid={lookupFailed || undefined}
          aria-describedby={lookupFailed ? `${id}-help ${id}-error` : `${id}-help`}
          value={selectedValue}
          disabled={isDisabled || (!available.length && lookupStatus === 'success')}
          required={required && !readOnly}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{placeholder ?? `Chọn ${label.toLocaleLowerCase()}`}</option>
          {visible.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
      <p id={`${id}-help`} className="manager-resource-select__help" aria-live="polite">
        {lookupLoading
          ? `Đang tải danh sách ${label.toLocaleLowerCase()}…`
          : lookupFailed
            ? ''
            : !available.length
              ? emptyMessage
              : query && !filtered.length
                ? `Không tìm thấy ${label.toLocaleLowerCase()} khớp từ khóa.`
                : readOnly
                  ? readOnlyHint
                  : 'Có thể tìm theo tên hoặc dùng phím mũi tên để chọn.'}
      </p>
      {lookupFailed && (
        <div id={`${id}-error`} className="manager-resource-select__error" role="alert">
          <span>{lookupError?.message ?? `Không tải được danh sách ${label.toLocaleLowerCase()}.`}</span>
          {onRetry && (
            <button type="button" disabled={disabled} onClick={onRetry}>
              Tải lại
            </button>
          )}
        </div>
      )}
    </div>
  );
}
