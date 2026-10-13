# Backend test setup (R4.1)

Chạy từ một clone mới bằng Node.js 24.x và npm đi kèm (đã kiểm chứng với Node 24.21.0 / npm 11.19.0):

```powershell
cd backend
npm ci --no-audit --no-fund
npm test
npm test
```

`npm ci` dùng `package-lock.json` được version trong Git. Không cần `.env`, SQL Server, seed, backup hay `database/_audit`. Giữ nguyên cấu trúc repository khi chạy: test import `shared/` và đọc canonical SQL ở `database/03_constraints`, `05_functions`, `07_triggers`, `08_procedures`.

Suite dùng `node:test` hiện có. Dữ liệu kiểm thử nằm trong test/source được version; service tests inject executor tại chỗ, JWT tests truyền secret/clock của test, HTTP tests dùng cổng tạm, date/time tests đặt múi giờ cho subprocess. SQL contract guards đọc source thực và phải phát hiện mã lỗi chưa mapping. Không tạo `known-contract-gaps.json` để đáp ứng test.

The R4.1 clean-clone replay runner has been retired with the phase tooling.
Run the maintained backend unit/contract suite with `npm test` from `backend`; the
recorded R4.1 acceptance result is historical and is not a replay command.

## Fixed RBAC integration (11 October 2026)

From the repository root, against an explicitly selected disposable database already built and seeded from canonical source:

```powershell
node scripts/db/fixed-rbac-smoke.mjs --database=CinemaBookingDB_R0_FIXED_RBAC_20261011
```

This is real HTTP/SP/SQL integration, separate from `npm test`: four-role login and authorization, rejected legacy RBAC writes, immutable account roles, allowed account creation, Manager assignment/transfer and immediate scope enforcement with the original JWT. The runner validates the test target, applies the fixed RBAC migration there, and writes evidence under ignored `.audit-output/`. Never point integration or fixture runners at Main. The Backend runs native ESM and has no package build/lint scripts; use `node --check` for syntax and the existing Oxlint executable for lint without adding dependencies. Current executed results and deployment limitations are in [FINAL_SYSTEM_AUDIT.md](../docs/FINAL_SYSTEM_AUDIT.md).
