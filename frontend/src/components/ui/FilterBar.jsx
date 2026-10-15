import Button from './Button';

export default function FilterBar({
  onSubmit,
  onApply,
  onReset,
  actions,
  children,
  label = 'Bộ lọc',
  className = '',
  schema = [],
  showChips,
  draft,
  applied,
  pending = false,
  error,
  resultCount,
  resultLabel = 'kết quả phù hợp',
  onRemoveFilter,
  applyLabel = 'Áp dụng lọc',
  resetLabel = 'Xóa lọc',
}) {
  const activeSchema = Array.isArray(schema) ? schema : [];
  const hasValue = (value) =>
    value !== undefined &&
    value !== null &&
    (typeof value !== 'string' || value.trim() !== '') &&
    (!Array.isArray(value) || value.length > 0);
  const normalize = (value) => (hasValue(value) ? value : null);
  const renderChips = showChips ?? true;
  const appliedFilters = activeSchema.filter((field) =>
    typeof field.isActive === 'function'
      ? field.isActive(applied?.[field.key], applied)
      : hasValue(applied?.[field.key]),
  );
  const hasUnappliedChanges = activeSchema.some(
    (field) =>
      JSON.stringify(normalize(draft?.[field.key])) !==
      JSON.stringify(normalize(applied?.[field.key])),
  );
  const apply = (event) => {
    event.preventDefault();
    if (pending) return;
    if (onApply) onApply(draft, event);
    else onSubmit?.(event);
  };
  const reset = (event) => {
    if (onReset) event.preventDefault();
    if (pending) return;
    onReset?.(event);
  };

  return (
    <form
      className={['ui-filter-bar', className].filter(Boolean).join(' ')}
      aria-label={label}
      aria-busy={pending || undefined}
      onSubmit={apply}
      onReset={reset}
    >
      <div className="ui-filter-bar__fields">{children}</div>
      {(actions || onApply || onSubmit || onReset) && (
        <div className="ui-filter-bar__actions">
          {onReset && (
            <Button type="reset" variant="secondary" disabled={pending}>
              {resetLabel}
            </Button>
          )}
          {actions ??
            ((onApply || onSubmit) && (
              <Button type="submit" disabled={pending}>
                {applyLabel}
              </Button>
            ))}
        </div>
      )}
      {activeSchema.length > 0 && (renderChips || hasUnappliedChanges) && (
        <div className="ui-filter-bar__feedback">
          {renderChips && appliedFilters.length > 0 && (
            <ul className="ui-filter-bar__chips" aria-label="Bộ lọc đang áp dụng">
              {appliedFilters.map((field) => {
                const value = applied[field.key];
                const formatted = field.format ? field.format(value, applied) : value;
                return (
                  <li key={field.key}>
                    {onRemoveFilter && field.removable !== false ? (
                      <button
                        className="ui-filter-bar__chip"
                        type="button"
                        disabled={pending}
                        aria-label={`Xóa bộ lọc ${field.label}`}
                        onClick={() => onRemoveFilter(field.key, field)}
                      >
                        <span>{field.label}:</span>{' '}
                        {Array.isArray(formatted) ? formatted.join(', ') : String(formatted)}
                        <span aria-hidden="true" className="ui-filter-bar__chip-remove">
                          ×
                        </span>
                      </button>
                    ) : (
                      <span className="ui-filter-bar__chip">
                        <span>{field.label}:</span>{' '}
                        {Array.isArray(formatted) ? formatted.join(', ') : String(formatted)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {hasUnappliedChanges && (
            <p className="ui-filter-bar__pending" role="status">
              Có thay đổi chưa được áp dụng.
            </p>
          )}
        </div>
      )}
      {resultCount != null && (
        <p className="ui-filter-bar__results" role="status">
          {resultCount} {resultLabel}
        </p>
      )}
      {error && (
        <p className="ui-filter-bar__error" role="alert">
          {error.message ?? String(error)}
        </p>
      )}
    </form>
  );
}
