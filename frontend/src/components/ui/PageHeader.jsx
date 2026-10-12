import Breadcrumbs from './Breadcrumbs';

export default function PageHeader({
  title,
  description,
  breadcrumbs = [],
  primaryAction,
  actions,
}) {
  const headerAction = primaryAction ?? actions;

  return (
    <header className="ui-page-header">
      {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="ui-page-header__row">
        <div className="ui-page-header__copy">
          <h1 className="ui-page-header__title">{title}</h1>
          {description && <p className="ui-page-header__description">{description}</p>}
        </div>
        {headerAction && <div className="ui-page-header__actions">{headerAction}</div>}
      </div>
    </header>
  );
}
