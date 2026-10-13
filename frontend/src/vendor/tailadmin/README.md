# TailAdmin integration

Source: https://github.com/TailAdmin/free-react-tailwind-admin-dashboard (MIT).
Upstream revision: e888dd1716b9803b535c7c2fa4f2c6b7d39b3da9.

The CinemaStar admin shell, menu, metric cards, tables, fields and theme adapt
TailAdmin's AppLayout, AppHeader, AppSidebar, EcommerceMetrics and design tokens
to the existing cinema workflows. SVG icons are copied from the upstream source.
The upstream license is retained in LICENSE.md.

Tailwind v4 is compiled by the Vite plugin. Preflight is intentionally omitted
to preserve the public, manager and support interfaces. Admin styles are scoped
to `.staff-shell--admin`; business controllers, APIs and permissions stay intact.
