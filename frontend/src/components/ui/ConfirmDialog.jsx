import { useRef, useState } from 'react';
import Button from './Button';
import Dialog from './Dialog';

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  body,
  entityLabel,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  dangerLevel,
  busy = false,
  onConfirm,
}) {
  const [pending, setPending] = useState(false);
  const [confirmationError, setConfirmationError] = useState(null);
  const pendingRef = useRef(false);
  const cancelRef = useRef(null);
  const isBusy = busy || pending;
  const resolvedDescription = description ?? body;
  const resolvedVariant =
    dangerLevel === 'dangerous' ? 'danger' : dangerLevel === 'caution' ? 'secondary' : variant;

  const changeOpen = (nextOpen) => {
    if (!nextOpen && isBusy) return;
    if (!nextOpen) setConfirmationError(null);
    onOpenChange?.(nextOpen);
  };

  const confirm = async () => {
    if (isBusy || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setConfirmationError(null);
    try {
      await onConfirm?.();
    } catch (error) {
      setConfirmationError(error?.message || 'Không thể hoàn tất thao tác.');
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={changeOpen}
      title={title}
      description={resolvedDescription}
      size="sm"
      busy={isBusy}
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button
            ref={cancelRef}
            variant="secondary"
            disabled={isBusy}
            onClick={() => changeOpen(false)}
          >
            {cancelLabel}
          </Button>
          <Button variant={resolvedVariant} loading={isBusy} onClick={confirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {entityLabel && <p className="ui-confirm-dialog__entity">{entityLabel}</p>}
      {confirmationError && (
        <p className="ui-confirm-dialog__error" role="alert">
          {confirmationError}
        </p>
      )}
    </Dialog>
  );
}
