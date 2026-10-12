import NamedResourceSelect from '../NamedResourceSelect';

// The feature owns lookup requests/guards; a new scope remounts the local search state.
export default function ResourceSelect({ scopeKey, ...props }) {
  return <NamedResourceSelect key={String(scopeKey ?? 'unscoped')} {...props} />;
}
