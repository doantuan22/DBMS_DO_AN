import { NavLink, Outlet } from 'react-router-dom';

export default function AreaLayout({ title, links = [] }) {
  return (
    <div className="area">
      <header className="area__header">
        <strong>{title}</strong>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end>{l.label}</NavLink>
          ))}
        </nav>
      </header>
      <main className="area__main"><Outlet /></main>
    </div>
  );
}
