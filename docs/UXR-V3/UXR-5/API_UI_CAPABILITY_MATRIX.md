# UXR-5 capability matrix

Inspected current clients, controllers/validators/services, registry and procedure source. All resources require exact ADMIN role plus the listed permissions. No API/SP changes planned.

| Resource | Existing read/filter | Existing write / limitation |
|---|---|---|
| Users | QL_NGUOIDUNG; GET /users search/roleId/status, complete non-paged; GET /roles read-only | POST internal Manager/Support/Admin only; PUT /users/:id/status only; no role/profile/delete mutation |
| Assignments | PHANCONG_RAP; GET /assignments cinemaId/userId complete set; users QL_NGUOIDUNG / cinemas QL_RAP named lookups | POST adds; PUT updates selected assignment (multi-assignment allowed, no fabricated overlap rule); fixed Manager in UI; no DELETE |
| Movies | QL_DANHMUC_PHIM; complete GET /movies search/status/genreId | POST/PUT metadata with genreIds; separate PUT /movies/:id/actors cast; DELETE existing SP guards |
| Actors / genres | Actor QL_DANHMUC_PHIM; genre QL_THELOAI complete lists | Existing POST/PUT/DELETE; counts/relations derived only from complete authorized movie list |
| Products | QL_SANPHAM; complete GET /products | Existing create/update/delete; product type/status/price contract and historical metadata guards retained |
| Promotions | QL_KHUYENMAI; complete GET /promotions | Existing create/update/delete; code immutable on edit; quota/unit/date/in-use constraints authoritative |
| Complaints | QL_KHIEUNAI; GET /complaints search/status/type/priority; GET detail | Additional XULY_KHIEUNAI for note/status; TRA_CUU_DON for order reference; shared existing SP authorizes Admin separately from CSKH |
| Revenue | XEM_BAO_CAO_TOANHE; GET /reports/revenue fromDate/toDate/cinemaId | Read-only official summary/byCinema/byMovie/byDate |
| Dashboard | XEM_BAO_CAO_TOANHE; GET /dashboard no query | Current/global counts + all-time successful payment sum; no fake date/cinema filter on these counts |

All client filtering/pagination must operate on a verified complete response; no filtering of a single server page. Bounded small data counts will be captured on isolated DB ID 9. UXR-4 booking capability gaps stay tracked separately, not implemented here.

## Verified transport details

- Users/assignments/actors/genres create return 200; movies/products/promotions create return 201. Client accepts successful REST responses, without inventing a uniform status.
- Movie cast JSON is explicit null when there are zero rows in PHIM_DIENVIEN on this SP/driver, confirmed by a matching SQL count. Missing property or invalid JSON still blocks editing; null is not interpreted as a hydration failure.
- Product price and promotion monetary values fit DECIMAL(18,2), without silent rounding. Inputs are also checked for exact cents through the existing JSON-number contract; values that JavaScript would change are rejected rather than rounded and sent. Percent types are Phần trăm/PERCENT and must be greater than zero through 99; fixed types are Số tiền/FIXED. Promotion code is creation-only; SoLuongDaDung is server-owned. Quantity cannot be lower than the consumed count; DB remains authoritative for concurrent usage.
- Promotion periods use UTC instants through the existing API and Vietnam datetime-local in the editor. Overlap date filters are explicitly local complete-set filters of the returned period, not a fabricated computed status. Revenue dates are inclusive Vietnam receipt dates; report totals never use client reaggregation.
- Complaint list/detail DTO deliberately does not expose sender email/phone; search can still use the authorized server email filter. The queue displays sender name; order-reference PII is shown only with the separate permission, through the existing scoped endpoint. No unsupported complaint date/customer-ID filter or complaint delete/create-on-behalf action is added.

Current bounded counts and no-mutation fingerprint: browser-suite.json. Larger catalogues need server filtering/pagination work separately; this task does not extend contracts.
