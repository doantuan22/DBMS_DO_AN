// Bundled, trusted SVG assets from TailAdmin. No remote or user-provided markup.
const sources = import.meta.glob('../../vendor/tailadmin/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const icons = Object.fromEntries(
  Object.entries(sources).map(([path, svg]) => [
    path.split('/').at(-1).replace('.svg', ''),
    svg
      .replace(/className="[^"]*"/g, '')
      .replace(/fill="(?:#[^"]*|)"/g, 'fill="currentColor"')
      .replace(/fillRule=/g, 'fill-rule=')
      .replace(/clipRule=/g, 'clip-rule=')
      .replace(/strokeWidth=/g, 'stroke-width=')
      .replace(/strokeLinecap=/g, 'stroke-linecap=')
      .replace(/strokeLinejoin=/g, 'stroke-linejoin='),
  ]),
);

export default function AdminIcon({ name = 'grid', className = '' }) {
  return (
    <span
      className={`admin-icon ${className}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icons[name] ?? icons.grid }}
    />
  );
}
