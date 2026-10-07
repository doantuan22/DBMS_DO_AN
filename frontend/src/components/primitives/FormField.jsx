import { useId } from 'react';

export default function FormField({
  label,
  id: providedId,
  helper,
  error,
  required = false,
  children,
  className = '',
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span style={{ color: 'var(--color-danger)', marginLeft: '0.25rem' }}>*</span>}
        </label>
      )}
      {typeof children === 'function'
        ? children({ id, 'aria-describedby': [helperId, errorId].filter(Boolean).join(' ') || undefined })
        : children}
      {helper && <span id={helperId} className="form-helper">{helper}</span>}
      {error && <span id={errorId} className="form-error" role="alert">{error}</span>}
    </div>
  );
}
