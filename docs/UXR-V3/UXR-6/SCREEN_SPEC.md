# UXR-6 screen spec — 12/10/2026

Requirements: Blueprint V3 §§2–4, 7–9, 11.7, 12. Explicit authorization: complete 6A → 6B → 6C → 6D without stopping between slices, then stop before UXR-7. Baseline commit b3d7f59 includes UXR-0–5; source snapshot taken before edits. Keep fixed RBAC, backend/SP/contracts and verified core logic.

## 6A — CSKH

Preserve current support hooks: per-actor/case session draft store, independent processing/status drafts, queue/detail request generations, mounted/selection ownership, synchronous write lock and authoritative reload. Change composition to queue / original case + single timeline / order reference + actions at desktop ≥1280; tablet two columns then actions; mobile queue → deep-linked case → back to queue. Add `/support/complaints/:id` while keeping `/support`, safe status/priority query, no search/body/PII URL. Apply/reset preserve case drafts; safe internal navigation preserves, leave/refresh guard reads synchronous pending/dirty state. Writes require contextual confirmation; never combine status and processing writes or modify/delete timeline entries.

## 6B — Public / Customer discovery

Keep existing catalog clients, signal abort and context keys. White–blue cinematic hierarchy with real posters and fixed-ratio fallback, human metadata and clear detail/showtime CTA. Home hero → real movie groups only when status exists → cinema exploration → booking steps. Movie search/genre and cinema search/city only from actual complete response or supported API. Movie detail: poster/facts → real dated/cinema-filtered showtimes → synopsis/actors → existing reviews. Cinema detail: actual gallery/address and API-backed schedule. No diagnostic cards, fake features, inventory or commercial content.

## 6C — Booking

Keep original scoped BookingContext, server seat/product/promotion calls, preview version, generation and synchronous booking lock. Recompose into showtime context + seat map + extras/promo + review, desktop sticky summary and mobile summary access. Seat states retain text/icon labels; summaries distinguish returned seat prices and promotion preview from final API totals. No client financial total as truth, no new pricing/locking/payment logic. Inline review identifies selected film/show/seats before the existing single create action; 409 recovery, promotion unavailable, stale context and hold timeout follow existing rules. Actual new order links to its own detail/payment and uses server deadline.

## 6D — Account / after booking

Curated own orders, detail, server monetary snapshots, tickets/products and all payment attempts. Existing payment methods/results only, explicit unpaid/paid/expired/failed/pending states and no duplicate submit. Profile/auth reuse current field allowlists/role routing/session behavior, add clearer forms/password/feedback. Own complaint list/detail and creation with existing own-order lookup by business label; no raw numeric ID input or new Customer support actions. Filter only verified complete own data; errors stay distinct from empty.

## Shared / acceptance

Use existing tokens/shared components and feature CSS, avoid duplicated architecture. 390/768/1280/1440/1920, named labels, native focus/keyboard, bounded grids and deliberate table/seat scroll. Before captures from local source snapshot; browser uses actual API/SP on isolated DB ID9 with owned fixture cleanup. Verify each slice before the next. Full lint/tests/build and regressions including UXR-1A/4/5; report PASS/FAIL/BLOCKED/NOT VERIFIED by evidence type, no all-44-UC claim.
