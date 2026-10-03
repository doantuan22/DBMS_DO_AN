# Backend SQL audit

Scanned 82 files.
Reviewed non-SQL keyword matches: 18.
NO RAW BUSINESS SQL IN BACKEND = PASS


Runtime path: backend/src → whitelist procedure client → typed mssql request.execute. 82 source/test files scanned. No query/batch/ORM/business SQL execution found. 18 reviewed keyword matches are SQL Server error-message parsing, natural-language validation text, test labels, SQL-source assertions, and an ordinary JavaScript variable named update. They are not SQL execution. Forbidden APIs remain checked even for these lines.

Database metadata, deployment and rollback tests run through sqlcmd under scripts/db and database/11_tests; these tools are never imported by backend runtime. Backend procedure client exposes only whitelisted execute methods, preserves recordsets/output/returnValue, rejects untyped input/output, shares one pool and closes it at shutdown.

120 captured procedure calls across 112 service/job/health methods. Parameter names, SQL types, string lengths, precision/scale and output flags checked; zero missing source. Full capture: backend-contract-check.json.
