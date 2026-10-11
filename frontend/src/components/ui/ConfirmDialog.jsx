import { useState } from 'react';
import Button from './Button';
import Dialog from './Dialog';

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  busy = false,
  onConfirm,
}) {
  const [pending, setPending] = useState(false);
  const [confirmationError, setConfirmationError] = useState(null);
  const isBusy = busy || pending;

  const changeOpen = (nextOpen) => {
    if (!nextOpen) setConfirmationError(null);
    onOpenChange?.(nextOpen);
  };

  const confirm = async () => {
    if (isBusy) return;
    setPending(true);
    setConfirmationError(null);
    try {
      await onConfirm?.();
    } catch (error) {
      setConfirmationError(error?.message || 'Không thể hoàn tất thao tác.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={changeOpen}
      title={title}
      description={description}
      size="sm"
      busy={isBusy}
      footer={
        <>
          <Button variant="secondary" disabled={isBusy} onClick={() => changeOpen(false)}>
            {cancelLabel}
          </Button>
          <Button variant={variant} loading={isBusy} onClick={confirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {confirmationError && (
        <p className="ui-confirm-dialog__error" role="alert">
          {confirmationError}
        </p>
      )}
    </Dialog>
  );
}
