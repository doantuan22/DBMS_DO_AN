import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { size = 'md', invalid = false, className = '', children, ...props },
  ref,
) {
  return (
    <select
      {...props}
      ref={ref}
      className={['ui-select', `ui-select--${size}`, className].filter(Boolean).join(' ')}
      aria-invalid={invalid || props['aria-invalid'] || undefined}
    >
      {children}
    </select>
  );
});

export default Select;
