import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { size = 'md', invalid = false, className = '', ...props },
  ref,
) {
  return (
    <input
      {...props}
      ref={ref}
      className={['ui-input', `ui-input--${size}`, className].filter(Boolean).join(' ')}
      aria-invalid={invalid || props['aria-invalid'] || undefined}
    />
  );
});

export default Input;
