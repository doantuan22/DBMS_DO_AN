# Fixture matrix v2

| Case | Setup | Gateway / assertion |
|---|---|---|
| Expired | SQL-controlled hold timestamp within atomic disposable fixture | sp_Order_ExpirePending releases seat/quota |
| Canceled | Booking without food | sp_Order_Cancel preserves canceled ticket history |
| Paid retry | Booking, food, DEMO10 | Failed payment then new successful attempt; both immutable histories |
| Compensated | Future paid order, 2 food lines | Showtime cancellation SP; one ledger and exact points |
| History / eligible review | Atomic historical DBMS snapshot using fn_TinhGiaVe | Review_Create + eligibility trigger; no invented check-in endpoint |
| Live pending | Customer2, after expired-seat release | Real hold deadline, natural expiry |
| Complaints | Own linked/unlinked orders | 5 statuses with 7 processing events driven by SP |
| Ineligible / duplicate review | Customer4 without paid past history / Customer1 duplicate | Reject 50004 / 50040; rollback |
| Foreign complaint | Customer4 references Customer1 order | Reject 50041; no inserted complaint |
| Price snapshots | Change product price / pricing in rollback transaction | Existing money unchanged |
| Seat race | 2 real HTTP requests from Customer4/5, same show/seat | Exactly one 201 and one 409 |
| Scope | Manager1 assigned Hà Nội | TP.HCM denied; CSKH/Admin existing portals real data |

All fixtures are synthetic; source/schema/SP contracts unchanged. Actual outcomes and counts live in docs/seed/SEED_VERIFICATION_REPORT.md.
