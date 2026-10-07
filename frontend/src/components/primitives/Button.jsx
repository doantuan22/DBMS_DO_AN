export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const variantClass = {
    primary: 'btn--primary',
    secondary: 'btn--secondary',
    danger: 'btn--danger',
  }[variant] || 'btn--primary';

  const sizeClass = {
    sm: 'btn--sm',
    md: '',
    lg: 'btn--lg',
  }[size] || '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {loading ? 'Đang xử lý…' : children}
    </button>
  );
}
