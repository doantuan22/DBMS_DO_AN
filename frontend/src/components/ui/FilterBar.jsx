import Button from './Button';

export default function FilterBar({
  onSubmit,
  onReset,
  actions,
  children,
  label = 'Bộ lọc',
  className = '',
}) {
  return (
    <form
      className={['ui-filter-bar', className].filter(Boolean).join(' ')}
      aria-label={label}
      onSubmit={onSubmit}
      onReset={onReset}
    >
      <div className="ui-filter-bar__fields">{children}</div>
      {(actions || onReset) && (
        <div className="ui-filter-bar__actions">
          {onReset && (
            <Button type="reset" variant="secondary">
              Xóa lọc
            </Button>
          )}
          {actions}
        </div>
      )}
    </form>
  );
}
