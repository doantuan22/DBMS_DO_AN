import { Children, cloneElement, isValidElement, useId } from 'react';

export default function FormField({ id, label, required = false, hint, error, children }) {
  const generatedId = useId();
  const controlId = id ?? `field-${generatedId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const control = Children.only(children);

  if (!isValidElement(control)) {
    throw new TypeError('FormField expects one React control element as its child.');
  }

  const describedBy = [control.props['aria-describedby'], hintId, errorId]
    .filter(Boolean)
    .join(' ');
  const labeledControl = cloneElement(control, {
    id: controlId,
    required: required || control.props.required,
    'aria-invalid': Boolean(error) || control.props['aria-invalid'] || undefined,
    'aria-describedby': describedBy || undefined,
  });

  return (
    <div className="ui-form-field">
      <label className="ui-form-field__label" htmlFor={controlId}>
        {label}
        {required && <span className="ui-form-field__required">*</span>}
        {required && <span className="ui-visually-hidden"> bắt buộc</span>}
      </label>
      {labeledControl}
      {hint && (
        <p className="ui-form-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="ui-form-field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
