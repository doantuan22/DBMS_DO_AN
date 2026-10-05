# Architecture

Online cinema ticket booking for a cinema chain. DBMS-first: the database owns integrity and business rules; the backend orchestrates; the frontend renders.

```
React.js (frontend/)
    | REST / JSON
Node.js + Express.js (backend/)
    | Route -> Middleware -> Controller -> Service
DB Procedure Client (mssql: pool -> request -> typed input/output -> execute)
    | EXEC dbo.sp_xxx
Microsoft SQL Server (database/)
    | Stored Procedure -> View / Function / Trigger / Table
```

## Layers

| Layer | Responsibility | Must not |
| --- | --- | --- |
| Route | Endpoints and HTTP methods | Touch the database |
| Middleware | Authentication, RBAC, cinema scope, basic validation | Contain booking logic |
| Controller | Parse request, call a service, shape the response | Orchestrate transactions |
| Service | Use-case orchestration; picks a procedure key | Contain SQL text |
| Procedure Client | `executeProcedure`, `executeProcedureWithOutputs` | Expose a way to run arbitrary SQL |
| SQL Server | Constraints, triggers, transactions, procedures | - |

## Stored-Procedure-only

- The backend has no SQL text, no ORM and no query builder. `backend/src/db/procedureClient.js` exposes only two functions, both ending in `request.execute(name)`.
- Procedure names come from the whitelist in `backend/src/db/procedures.js`. Services pass a whitelisted procedure key; a request can never choose the procedure.
- Views are read through wrapper procedures; functions are called inside procedures. Triggers fire inside SQL Server.
- The application login gets `GRANT EXECUTE` only, with no direct table permissions.
- The frontend knows REST endpoints only, never tables, views, functions or procedure names.
- `npm run audit:no-sql` enforces this by scanning `backend/`.

## Roles and areas

| Role | Frontend area | Scope |
| --- | --- | --- |
| KHACH_HANG | `/account` (+ public `/`) | Own data |
| QUAN_LY_RAP | `/manager` | Cinemas assigned in PHANCONG_RAP |
| CSKH | `/support` | Complaints |
| ADMIN | `/admin` | Whole system |

The frontend route guard is a UX convenience. Real authorization is checked in the backend and enforced again in the database.

## Adding a feature

1. Write the procedure in `database/08_procedures/<actor>/` and its tests in `database/11_tests/`.
2. Add its name to `backend/src/db/procedures.js`.
3. Add route -> controller -> service in the backend.
4. Add the API call in `frontend/src/api/` and the page.

## Release contract R8

Authoritative scope: 45 UC (14 Customer, 9 Manager, 6 CSKH, 16 Admin). SQL baseline: 27 tables, 125 procedures, 6 views, 21 functions, 7 triggers, 63 indexes, 161 constraints. JWT carries identity and expiry only; current role, active account, exact permissions (AND), ownership and date-effective cinema assignment are checked on every request. Admin also needs the current exact grant.

SQL owns booking locks, compensation uniqueness and transaction rollback. UTC instants cross the API; business display uses Asia/Ho_Chi_Minh. DATE_ONLY values remain YYYY-MM-DD. Payment is simulated, valid live holds block cancellation, and paid cancellation keeps payment history and awards ticket compensation points without refund. BOITHUONG_HUYSUAT retains order FK and actual points as event audit; money/customer/showtime are read from the order.

Development currently uses the configured administrative SQL login. Deployment uses a separately provisioned login mapped to db_executor, without sysadmin/db_owner or direct table DML. R8 proved this path with a temporary restricted login and production Backend process. Provision credentials privately; R8 does not change the development credentials. See [release guide](RELEASE_READINESS.md) and [final evidence](../audit/final/r8/FINAL_ACCEPTANCE_REPORT.md).
