import Breadcrumbs from './Breadcrumbs';

export default function PageHeader({ title, description, breadcrumbs = [], actions }) {
  return (
    <header className="ui-page-header">
      {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      <div className="ui-page-header__row">
        <div className="ui-page-header__copy">
          <h1 className="ui-page-header__title">{title}</h1>
          {description && <p className="ui-page-header__description">{description}</p>}
        </div>
        {actions && <div className="ui-page-header__actions">{actions}</div>}
      </div>
    </header>
  );
}
