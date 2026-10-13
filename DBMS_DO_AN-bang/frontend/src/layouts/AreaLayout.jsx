import PublicShell from './PublicShell';

// Kept as a compatibility wrapper for existing route definitions and tests.
export default function AreaLayout({ title, links = [] }) {
  return <PublicShell title={title} links={links} />;
}
