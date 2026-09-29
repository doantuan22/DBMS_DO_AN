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
- Procedure names come from the whitelist in `backend/src/db/procedures.js`. Services pass a key (`'BOOK_TICKET'`); a request can never choose the procedure.
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

1. Write the procedure in `database/procedures/<actor>/` and its tests in `database/tests/`.
2. Add its name to `backend/src/db/procedures.js`.
3. Add route -> controller -> service in the backend.
4. Add the API call in `frontend/src/api/` and the page.
