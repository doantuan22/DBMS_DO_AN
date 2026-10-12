import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import AsyncState from '../src/components/ui/AsyncState.jsx';
import Button from '../src/components/ui/Button.jsx';
import ConfirmDialog from '../src/components/ui/ConfirmDialog.jsx';
import FilterBar from '../src/components/ui/FilterBar.jsx';
import FormField from '../src/components/ui/FormField.jsx';
import Input from '../src/components/ui/Input.jsx';
import PageHeader from '../src/components/ui/PageHeader.jsx';
import ResourceSelect from '../src/components/ui/ResourceSelect.jsx';
import ResourceTable from '../src/components/ui/ResourceTable.jsx';
import '../src/index.css';

function Fixture() {
  const [draft, setDraft] = useState({ search: '' });
  const [applied, setApplied] = useState({ search: '' });
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('101');
  const [scope, setScope] = useState('fixture-scope-a');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [state, setState] = useState('empty');
  const rows = page === 1
    ? [{ id: 91001, name: 'Resource Alpha' }, { id: 91002, name: 'Resource Beta' }]
    : [{ id: 91003, name: 'Resource Gamma' }];

  return (
    <main className="catalog-page" data-testid="uxr2a-fixture-only">
      <PageHeader
        title="Shared component fixture"
        description="Browser interaction fixture; sample resources are not application or API data."
        breadcrumbs={[{ label: 'Fixture' }, { label: 'Shared components' }]}
        primaryAction={<Button onClick={() => setDialogOpen(true)}>Open confirmation</Button>}
      />
      <FilterBar
        label="Fixture resource filters"
        schema={[{ key: 'search', label: 'Search' }]}
        draft={draft}
        applied={applied}
        onApply={(value) => setApplied({ ...value })}
        onReset={() => { setDraft({ search: '' }); setApplied({ search: '' }); }}
      >
        <FormField label="Search resources">
          <Input data-testid="filter-search" value={draft.search} onChange={(event) => setDraft({ search: event.target.value })} />
        </FormField>
      </FilterBar>
      <section aria-label="Named selector fixture">
        <Button data-testid="switch-fixture-scope" variant="secondary" onClick={() => setScope((current) => current === 'fixture-scope-a' ? 'fixture-scope-b' : 'fixture-scope-a')}>
          Switch fixture scope
        </Button>
        <ResourceSelect
          label="Cinema fixture"
          value={resource}
          options={[{ id: 101, label: 'Central Cinema' }, { id: 102, label: 'Riverside Cinema' }]}
          lookupStatus="success"
          scopeKey={scope}
          onChange={setResource}
        />
        <p data-testid="selected-resource">Selected ID: {resource}</p>
      </section>
      <ResourceTable
        caption="Fixture resources"
        columns={[{ key: 'name', label: 'Name' }]}
        rows={rows}
        getRowKey={(row) => row.id}
        pagination={{ page, pageSize: 2, total: 3, onPageChange: setPage }}
      />
      <section aria-label="Async state fixture">
        <Button variant="secondary" onClick={() => setState('conflict')}>Show conflict</Button>
        <AsyncState status={state} />
      </section>
      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Confirm fixture action"
        entityLabel="Resource Alpha (fixture)"
        description="This fixture does not submit an application request."
        onConfirm={() => setDialogOpen(false)}
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(<Fixture />);

export default Fixture;
