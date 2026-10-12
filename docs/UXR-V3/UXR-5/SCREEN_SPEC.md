# UXR-5 screen spec — 12/10/2026

Source of requirements: Blueprint V3 §§2–5, 9, 11.6, 12–18 and explicit authorization to implement 5A → 5B → 5C → 5D. Preserve the existing uncommitted UXR-4 source. No backend/DB/RBAC/REST contract expansion, no UXR-6.

## 5A — Users and Manager assignments

List-first PageHeader → applied FilterBar → curated STT ResourceTable → detail → dialog editor. Users: name/email/phone search, fixed role and account status; source is the complete non-paged user response. Create internal accounts with authorized roles returned from read-only role lookup; Customer creation omitted. Only existing status endpoint for updates, immutable role; no unsupported profile edit or physical delete. Status changes require contextual confirmation.

Assignments: Manager name/email, cinema name, status and effective-on filter on the complete assignment set. Create adds a single assignment; transfer edits only the chosen assignment row, does not end all other assignments or invent single-cinema rules. Fixed Manager during edit, preview current assignments and source → destination, dates/status confirmation. Lookups are authorized, dependency permission failures are explicit. Server remains authoritative for duplicates and scope.

## 5B — Movies, actors, genres

Curated poster/name/genre/duration/status list; complete-set search/filters. Named genre add/remove picker; metadata edit preserves existing cast (omits cast payload). Separate named cast editor uses the existing atomic actor-set endpoint; actor selection and role text, no IDs/JSON input. Missing/corrupt hydration blocks relation editing; explicit null for zero cast relations follows the verified SP/driver response (see contract-read.json). Actor/genre counts only from a complete authorized movie set; otherwise show unknown, not zero. Delete confirmations describe relationship/history constraints; SP determines refusal/deactivation.

## 5C — Products and promotions

Thumbnail/name/type/VND/status product list. Promotions: business code/description, discount unit, limits, effective period, quota and status from actual DTO; filter by text/type/status and time range. Do not claim a locally derived business expired state; date filtering describes the interval actually selected. Money/percent/date/integer inputs follow existing SP limits; keep transactions and prices on server, no client quota consumption or history recalculation. Destructive actions use existing endpoint only and communicate actual behavior from contract.

## 5D — Admin complaints, revenue, dashboard

Admin complaint queue/detail/history/order-reference/actions with QL_KHIEUNAI and separate XULY_KHIEUNAI / TRA_CUU_DON guards. Independent applied filters preserve keyed notes and selected case; generation and write guards prevent cross-case responses/updates. Append-only processing/status endpoints, no pretending Admin is CSKH. Safe query may retain selected complaint ID, never body/search PII.

Revenue: inclusive date/cinema API query, curated official summary and by-cinema/movie/day tables/chart; financial truth only from returned aggregates. Dashboard endpoint is unfiltered; show its current/global KPIs with precise scope and operational links. Period/cinema summary is a distinct authoritative revenue query, never relabel global dashboard counts with a scoped filter. No fake KPI controls.

## Shared component/state contracts

Reuse StaffShell/PageHeader/FilterBar/ResourceSelect/ResourceTable/Dialog/ConfirmDialog/AsyncState. Feature descriptors explicitly define column/form/filter allowlists; never generate UI from DTO keys. Feature controller owns reads, selections, draft baseline, confirmation and a synchronous write lock. Persistent Admin layout owns actor-scoped memory drafts and pending writes; unmount/logout/actor change clear scope. Resource editor switches/close ask before discard; complaint case switches/close retain keyed drafts, and explicit discard asks for confirmation. Same-Admin navigation retains draft; leaving Admin asks. All server errors remain errors with retry, conflicts retain draft, writes never auto-retry. Safe URL contains non-PII filters, selection/page only; search/type text/note/password never in URL or browser storage. Breakpoints 390/768/1280/1440/1920, bounded grid tracks, table scroll, native dialog and named labels for keyboard/focus. Dialog instances have distinct identities across close/open and action/context changes to reject late native close events.
