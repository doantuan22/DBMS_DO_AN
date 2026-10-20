import { useId } from 'react';
import SearchableSelect from './ui/SearchableSelect';

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
  includeAllOption = false,
  allLabel = 'Tất cả',
}) {
  const id = useId();
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

  const lookupFailed = lookupStatus === 'error';
  const lookupLoading = lookupStatus === 'loading';
  const lowerLabel = label.toLocaleLowerCase('vi');
  const selected = available.find((option) => option.id === selectedValue);
  const isDisabled =
    disabled ||
    readOnly ||
    lookupLoading ||
    lookupFailed ||
    (!available.length && lookupStatus === 'success');

  return (
    <div className="manager-resource-select">
      <label htmlFor={`${id}-combobox`}>{label}</label>
      <SearchableSelect
        id={`${id}-combobox`}
        ariaLabel={label}
        value={selected ? selectedValue : ''}
        options={available.map((option) => ({ value: option.id, label: option.label }))}
        onChange={(next) => onChange(next)}
        placeholder={placeholder ?? `Chọn ${lowerLabel}`}
        searchPlaceholder={`Gõ để tìm ${lowerLabel}...`}
        disabled={isDisabled}
        includeAllOption={includeAllOption}
        allLabel={allLabel}
        emptyMessage={emptyMessage}
        noMatchMessage={`Không tìm thấy ${lowerLabel} khớp từ khóa.`}
        invalid={lookupFailed}
        describedBy={`${id}-help${lookupFailed ? ` ${id}-error` : ''}`}
        required={required && !readOnly}
      />
      <p id={`${id}-help`} className="manager-resource-select__help" aria-live="polite">
        {lookupLoading
          ? `Đang tải danh sách ${lowerLabel}…`
          : lookupFailed
            ? ''
            : !available.length
              ? emptyMessage
              : readOnly
                ? readOnlyHint
                : 'Bấm để mở danh sách, gõ để tìm hoặc dùng phím mũi tên để chọn.'}
      </p>
      {lookupFailed && (
        <div id={`${id}-error`} className="manager-resource-select__error" role="alert">
          <span>
            {lookupError?.message ?? `Không tải được danh sách ${lowerLabel}.`}
          </span>
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
