# Seed Data Verification Report

- Result: **PASS** (SQL checks only; API result is appended by verify-demo-api.mjs)
- Target: CinemaBookingDB on DoanTuanIT
- Verified at UTC: 2026-10-21 10:40:20; Vietnam business date: 2026-10-21
- Fixed data seed: 20261021
- Seed age: 430 minutes; temporal fixtures are checked by their effective time window.
- Schema unchanged: 29 application tables, 147 procedures, 6 views, 21 functions, 9 triggers
- Integrity: 37 trusted FKs, 65 trusted CHECK constraints, zero disabled triggers, zero orphan rows, zero DBCC violations

## Coverage

| Area | Verified coverage | Result |
|---|---|---|
| Users/RBAC | 120 customers (3 locked), 130 users; 4 roles / 33 permissions / 59 mappings | PASS |
| Venues/catalog | 4 cinemas, 12 rooms, 960 seats, 20 movies, 12 genres, 48 actors | PASS |
| Showtime | 124 past, 0 ongoing, 167 future open; 4 original live fixtures (0 still in progress); 0 overlaps | PASS |
| Orders/payments | 310 orders (240 completed, 0 pending, 9 expired, 14 canceled); 4 original hold fixtures (0 active, 4 effectively expired); 356 payment attempts | PASS |
| Reviews | 80 eligible reviews; 0 invalid | PASS |
| Complaints | 30 total (20 linked, 10 unlinked), 32 timeline rows, 6 messages, 2 escalations | PASS |
| Compensation | 6 procedure-generated cases; 0 invalid | PASS |

## Per-table row counts

| Table | Rows | Coverage |
|---|---:|---|
| BANGGIA | 24 | Covered |
| BOITHUONG_HUYSUAT | 6 | Covered |
| CHITIETDOAN | 242 | Covered |
| CHITIETVE | 595 | Covered |
| DANHGIAPHIM | 80 | Covered |
| DIENVIEN | 48 | Covered |
| DONDATVE | 310 | Covered |
| GHE | 960 | Covered |
| HINHANH_RAPCHIEUPHIM | 4 | Covered |
| HOSOKHACHHANG | 120 | Covered |
| KHIEUNAI | 30 | Covered |
| KHUYENMAI | 8 | Covered |
| NGUOIDUNG | 130 | Covered |
| PHANCONG_RAP | 4 | Covered |
| PHIM | 20 | Covered |
| PHIM_DIENVIEN | 80 | Covered |
| PHIM_THELOAI | 40 | Covered |
| PHONGCHIEU | 12 | Covered |
| QUYEN | 33 | Covered |
| RAPCHIEUPHIM | 4 | Covered |
| SANPHAM | 13 | Covered |
| SUATCHIEU | 292 | Covered |
| TINNHAN_KHIEUNAI | 6 | Covered |
| THANHTOAN | 356 | Covered |
| THELOAI | 12 | Covered |
| VAITRO | 4 | Covered |
| VAITRO_QUYEN | 59 | Covered |
| XULY_KHIEUNAI | 32 | Covered |
| YEUCAU_CHUYENCAP | 2 | Covered |

Full machine-readable evidence: .audit-output/seed-data-verification.json.
