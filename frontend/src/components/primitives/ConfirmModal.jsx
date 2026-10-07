import Button from './Button';

export default function ConfirmModal({
  isOpen,
  title = 'Xác nhận hành động',
  message,
  entityName,
  warning,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  confirmVariant = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="modal-dialog">
        <h3 id="confirm-modal-title">{title}</h3>
        {entityName && (
          <p style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
            Mục: {entityName}
          </p>
        )}
        <p>{message}</p>
        {warning && (
          <div className="alert alert--warning" style={{ margin: '0 0 1.25rem' }}>
            <span>⚠️ {warning}</span>
          </div>
        )}
        <div className="modal-actions">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={busy}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
