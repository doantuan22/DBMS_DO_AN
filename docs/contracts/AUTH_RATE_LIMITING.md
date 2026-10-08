# Authentication Rate Limiting — Task 13 / R4.5 / I-18

Only `POST /api/auth/login` and `POST /api/auth/register` are protected. Existing Login/Register validation, success responses, password hashing, JWT claims/signing, live identity/RBAC loading and typed Stored Procedure gateway remain unchanged. This is an HTTP guard for one Backend instance, not account lockout or distributed protection.

## Policy and configuration

No numeric policy is specified in roadmap R4.5. **Task 13 implementation decision:** login20 requests and register10 requests per60-second fixed window, independently per client IP and endpoint. Both successful and failed/malformed requests count. These values allow ordinary attempts/manual retries and existing integration logins while bounding short bursts. The allowed threshold request proceeds; the next one returns429.

Use the existing environment configuration at app startup:

| Setting | Default | Meaning |
| --- | --- | --- |
| AUTH_RATE_LIMIT_WINDOW_MS |60000 | Common fixed window in milliseconds |
| AUTH_RATE_LIMIT_LOGIN_MAX |20 | Login requests allowed in the window |
| AUTH_RATE_LIMIT_REGISTER_MAX |10 | Register requests allowed in the window |
| AUTH_RATE_LIMIT_MAX_KEYS |10000 | Maximum active endpoint/IP buckets in one app |

All configured values must be positive safe integers; invalid/zero/negative/fractional values fail configuration rather than disabling protection. There is no NODE_ENV bypass. Policy lives in one existing configuration module; no package, persistent store or background timer.

## Identity, placement and state

Express `req.ip` is the source, falling back to socket address only if unavailable. IPv4-mapped IPv6 matches the same IPv4 key. Native IPv6 is normalized and grouped by /64 so changing an interface address within that prefix cannot evade the counter. Different IPv4s and different IPv6 /64s have independent counters. No password/email/JWT enters state. Unknown address uses one conservative key.

Current Express has `trust proxy=false`; keep it unchanged. Client X-Forwarded-For, Forwarded and X-Real-IP headers do not control the key. Development Vite proxy calls share the proxy's socket IP, as do users behind the same NAT. No production reverse-proxy topology is configured in the repository. Deploying behind another proxy requires deliberate, separately verified trust configuration; this task does not set global trust proxy or accept arbitrary forwarded headers.

Mount middleware under existing `/api/auth` prefix **after helmet/CORS and before express.json**. An explicit method/path guard matches only POST login/register, including Express's existing case-insensitive and optional trailing-slash variants. Other methods/paths and CORS preflight are unaffected. Counting before parsing stops malformed JSON and changed credentials from evading protection; excessive requests never reach parsers/controllers/services/bcrypt/SP/JWT issuance.

Each `createApp()` creates a fresh private Map. Window starts on the first admitted request for the endpoint/IP and is not extended by rejected attempts. Count check/update is synchronous before next(), so parallel requests in one process cannot over-admit. Monotonic performance.now controls expiry; tests inject a deterministic clock. Expired buckets are removed opportunistically on protected requests in creation/expiry order; no timer. After expiry, a new window/counter begins. Process/app restart discards counters.

Memory is bounded by MAX_KEYS. If all buckets are active and a new key arrives at capacity, reject429 with Retry-After until the earliest bucket expires. Existing buckets retain their counts; do not evict active clients and reset protection. Capacity refusal may persist if other requests fill newly freed slots; it is not a reservation. This is an explicit bounded-memory tradeoff for a single-instance project.

## HTTP and retry contract

Use existing HttpError/errorHandler convention:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: <ceil(remaining milliseconds / 1000)>
Content-Type: application/json
```

```json
{"error":{"code":"RATE_LIMIT_EXCEEDED","message":"Too many authentication requests. Please try again later."}}
```

Retry-After is a positive integer number of seconds, calculated from the blocked bucket's actual expiry (or earliest active bucket for capacity refusal), never hardcoded to the full window. The response is account-neutral. No automatic Backend retry, account status change or token revocation occurs. Allowed requests retain their existing400/401/403/409/success contracts.

Existing Frontend httpClient throws status/code, Login/Register show a form error, keep inputs and release busy state; they do not auto-submit or loop on429. They show the existing generic retry message rather than a countdown. Explicit retries before expiry may get429; retries after expiry can proceed subject to ordinary authentication. No Frontend production changes needed.

## Verification and limitations

Factory options `createApp({authRateLimit:{policy,now}})` support isolated in-process tests; these are not HTTP fields/endpoints. Tests use fresh apps or advance a deterministic clock, with real limiter enabled. No reset API or test-only request bypass. Focused tests cover thresholds, expiry, independent keys, capacity, parallel bursts, forwarding spoofing, IPv4/IPv6, parser placement, downstream short-circuit and unaffected routes. SQL auth regression uses only the existing disposable DB and cleans its own registration fixture.

```powershell
npm.cmd --prefix backend test
node scripts/r45/checks.mjs --database=CinemaBookingDB_R0_R33_20261008_01
node scripts/r45/main-check.mjs --database=CinemaBookingDB
node scripts/r45/final-checks.mjs
```

See [actual Task 13 evidence](../evidence/R4_AUTH_RATE_LIMITING.md). In-memory counters are per app/process, reset at restart and are not shared across multiple instances. Fixed windows can allow bursts across a boundary; shared IP/prefix users share allowances. This limiter does not claim absolute brute-force prevention, account lockout or server logout revocation. Stop at R4.5.
