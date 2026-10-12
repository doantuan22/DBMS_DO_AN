import { useEffect, useId, useRef } from 'react';
import Button from './Button';

export default function Dialog({
  open = false,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeLabel = 'Đóng hộp thoại',
  busy = false,
  initialFocusRef,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      initialFocusRef?.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, initialFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      className={`ui-dialog ui-dialog--${size}`}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Hộp thoại'}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal={open ? 'true' : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onOpenChange?.(false);
      }}
      onClose={() => {
        if (open) onOpenChange?.(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onOpenChange?.(false);
      }}
    >
      <header className="ui-dialog__header">
        <div>
          {title && (
            <h2 className="ui-dialog__title" id={titleId}>
              {title}
            </h2>
          )}
          {description && (
            <p className="ui-dialog__description" id={descriptionId}>
              {description}
            </p>
          )}
        </div>
        <Button
          variant="quiet"
          size="sm"
          aria-label={closeLabel}
          disabled={busy}
          onClick={() => onOpenChange?.(false)}
        >
          <span aria-hidden="true">×</span>
        </Button>
      </header>
      <div className="ui-dialog__body">{children}</div>
      {footer && <footer className="ui-dialog__footer">{footer}</footer>}
    </dialog>
  );
}
