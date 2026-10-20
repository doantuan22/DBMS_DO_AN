import { useEffect, useId, useMemo, useRef, useState } from 'react';

const normalize = (value) =>
  String(value ?? '')
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();

export default function SearchableSelect({
  id,
  value = '',
  options = [],
  onChange,
  placeholder = 'Chọn',
  searchPlaceholder,
  disabled = false,
  emptyMessage = 'Không có lựa chọn phù hợp.',
  noMatchMessage = 'Không tìm thấy kết quả khớp từ khóa.',
  allLabel = 'Tất cả',
  ariaLabel,
  textValue = false,
  includeAllOption = true,
  invalid = false,
  describedBy,
  required = false,
}) {
  const generatedId = useId();
  const inputId = id ?? `searchable-${generatedId}`;
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(-1);

  const normalizedOptions = useMemo(
    () =>
      (options ?? []).map((option, index) => ({
        value: String(option.value ?? ''),
        label: String(option.label ?? option.value ?? ''),
        key: option.key ?? `${option.value ?? ''}-${index}`,
      })),
    [options],
  );

  const selectedValue = String(value ?? '');
  const selected = normalizedOptions.find((option) =>
    textValue ? option.label === selectedValue : option.value === selectedValue,
  ) ?? null;
  const selectedLabel = selected?.label ?? selectedValue;

  const normalizedQuery = normalize(query);
  const filtered = useMemo(() => {
    if (!normalizedQuery) return normalizedOptions;
    return normalizedOptions.filter((option) => normalize(option.label).includes(normalizedQuery));
  }, [normalizedOptions, normalizedQuery]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openList = () => {
    if (disabled) return;
    setQuery('');
    setHighlight(-1);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const commit = (nextValue) => {
    const option = normalizedOptions.find((item) => item.value === String(nextValue ?? ''));
    onChange?.(textValue ? (option?.label ?? '') : String(nextValue ?? ''));
    setQuery('');
    setHighlight(-1);
    setOpen(false);
  };

  const onInputChange = (event) => {
    setQuery(event.target.value);
    setHighlight(-1);
    if (!open) setOpen(true);
  };

  const onInputKeyDown = (event) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      openList();
      return;
    }
    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((prev) => (filtered.length ? (prev + 1) % filtered.length : -1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((prev) => (filtered.length ? (prev <= 0 ? filtered.length - 1 : prev - 1) : -1));
    } else if (event.key === 'Enter') {
      if (highlight >= 0 && filtered[highlight]) {
        event.preventDefault();
        commit(filtered[highlight].value);
      } else if (normalizedQuery && filtered.length > 0) {
        event.preventDefault();
        commit(filtered[0].value);
      }
    }
  };

  const showAll = !normalizedQuery;
  const activeId =
    open && highlight >= 0 && filtered[highlight] ? `${listboxId}-opt-${highlight}` : undefined;

  return (
    <div className="ui-searchable-select" ref={containerRef}>
      <div className="ui-searchable-select__box">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          autoComplete="off"
          className="ui-input ui-searchable-select__input"
          placeholder={open ? (searchPlaceholder ?? 'Gõ để lọc...') : (placeholder ?? 'Chọn')}
          disabled={disabled}
          value={open ? query : selectedLabel}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          onFocus={() => {
            if (!disabled && !open) {
              setQuery('');
              setHighlight(-1);
              setOpen(true);
            }
          }}
        />
        {selectedValue && !disabled ? (
          <button
            type="button"
            className="ui-searchable-select__clear"
            aria-label="Xóa lựa chọn"
            onClick={() => {
              commit('');
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          >
            ×
          </button>
        ) : null}
        <button
          type="button"
          className="ui-searchable-select__toggle"
          aria-label={open ? 'Đóng danh sách' : 'Mở danh sách'}
          aria-expanded={open}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openList())}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
      {open && !disabled ? (
        <div className="ui-custom-select__dropdown ui-searchable-select__dropdown">
          <ul id={listboxId} role="listbox" aria-label={ariaLabel} className="ui-custom-select__list">
            {includeAllOption ? (
              <li
                role="option"
                aria-selected={selectedValue === ''}
                className={[
                  'ui-custom-select__option',
                  selectedValue === '' ? 'ui-custom-select__option--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit('')}
              >
                <span className="ui-custom-select__option-text">{allLabel}</span>
                {selectedValue === '' ? (
                  <span className="ui-custom-select__check" aria-hidden="true">
                    ✓
                  </span>
                ) : null}
              </li>
            ) : null}
            {showAll ? (
              <li className="ui-searchable-select__hint" aria-hidden="true">
                {normalizedOptions.length
                  ? `Click để chọn · gõ để lọc trong ${normalizedOptions.length} mục.`
                  : emptyMessage}
              </li>
            ) : null}
            {filtered.map((option, index) => {
              const isSelected = textValue
                ? option.label === selectedValue
                : option.value === selectedValue;
              const isHighlighted = index === highlight;
              return (
                <li
                  key={option.key}
                  id={`${listboxId}-opt-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    'ui-custom-select__option',
                    isSelected ? 'ui-custom-select__option--selected' : '',
                    isHighlighted ? 'ui-custom-select__option--highlighted' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => commit(option.value)}
                >
                  <span className="ui-custom-select__option-text">{option.label}</span>
                  {isSelected ? (
                    <span className="ui-custom-select__check" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </li>
              );
            })}
            {!showAll && filtered.length === 0 ? (
              <li className="ui-searchable-select__hint" role="status">
                {noMatchMessage}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
