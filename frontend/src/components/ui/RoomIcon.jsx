// Shared room glyph so the Admin and Manager room surfaces stay visually identical.
export default function RoomIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M3 3h18v8H3zM5 15h4v6H5zM15 15h4v6h-4zM3 18h8M13 18h8" strokeLinejoin="round" />
    </svg>
  );
}
