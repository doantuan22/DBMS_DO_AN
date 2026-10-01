# Phase 6 API: reviews and customer complaints

The database remains the source of truth. All endpoints use the stored-procedure whitelist and an authenticated customer's `NguoiDungID`; clients cannot submit an identity, status, priority, or procedure name.

## Reviews

### List reviews

`GET /api/movies/:movieId/reviews` is public and calls `dbo.sp_Review_ListByMovie(@PhimID INT)`. It returns `{ "reviews": [...] }`; each item contains only `id`, `movieId`, `reviewerName`, `rating`, `content`, and `createdAt` supplied by the procedure. The procedure returns one recordset and has no output parameters or explicit errors. A movie with no reviews (including an unknown id under the current SQL contract) returns an empty list.

### Create review

`POST /api/movies/:movieId/reviews` requires a JWT for `KHACH_HANG` and calls `dbo.sp_Review_Create(@NguoiDungID INT, @PhimID INT, @SoSao INT, @NoiDung NVARCHAR(1000) = NULL)`.

```json
{ "rating": 5, "content": "Phim rất hay" }
```

`rating` is an integer from 1 through 5. `content` is optional/null and at most 1,000 characters. The response is `201 { "review": { "id", "movieId", "rating", "content", "createdAt" } }`. `userId` is intentionally not accepted: the JWT identity is passed to SQL.

The procedure rejects a prior review with SQL `50040`, mapped to `409 REVIEW_ALREADY_EXISTS`. The `TRG_DanhGia_KiemTraDaXemPhim` trigger rejects someone who lacks an order in `Đã thanh toán`/`Hoàn thành` for the same movie whose showtime has started; SQL `50004` maps to `403 REVIEW_NOT_ELIGIBLE`. The unique constraint `(PhimID, NguoiDungID)` is a second protection against duplicates. A review FK violation maps to `404 MOVIE_NOT_FOUND`; malformed input is `400`.

## Complaints

All complaint endpoints require a JWT for `KHACH_HANG`.

### Create complaint

`POST /api/complaints` calls `dbo.sp_Complaint_Create(@NguoiDungID INT, @DonDatVeID INT = NULL, @LoaiKhieuNai NVARCHAR(100), @TieuDe NVARCHAR(200), @NoiDung NVARCHAR(MAX), @MucDoUuTien NVARCHAR(50) = N'Trung bình')`.

```json
{ "type": "Thanh toán", "title": "Chưa nhận xác nhận", "content": "…", "orderId": 42 }
```

`orderId` is **optional** and may be omitted or `null`; it is only a reference. It never identifies the sender. The sender is the authenticated JWT customer, and the SQL procedure sets initial status `Mới` and default priority `Trung bình`. When an order is supplied, `sp_Complaint_Create` requires it to belong to that authenticated sender. Clients may not submit `senderId`, `userId`, `status`, `priority`, or staff-processing fields. Successful response: `201 { "complaint": ... }`. SQL `50041` maps to the non-disclosing `404 ORDER_REFERENCE_INVALID` for both a missing order and another customer's order.

### List my complaints

`GET /api/complaints` calls `dbo.sp_Complaint_ListByCustomer(@NguoiDungID INT)` and returns `{ "complaints": [...] }`. There is no `userId` query parameter; SQL filters by the JWT identity.

### Get my complaint

`GET /api/complaints/:complaintId` calls `dbo.sp_Complaint_GetByCustomer(@NguoiDungID INT, @KhieuNaiID INT)`. It returns the complaint and its SQL-supplied `processingHistory`. SQL `50042` covers both missing and another customer's complaint and maps to `404 COMPLAINT_NOT_FOUND`, avoiding ownership disclosure.

## Database-contract observations

| Classification | Observation |
| --- | --- |
| MATCH | `DANHGIAPHIM` has rating `1..5`, nullable `NoiDung` max 1,000, and unique `(PhimID, NguoiDungID)`. |
| STRONGER THAN DESIGN | The review trigger also requires a paid/completed order and a showtime that has already begun. |
| MATCH | `KHIEUNAI.DonDatVeID` is nullable and `sp_Complaint_Create` accepts null. |
| IMPLEMENTATION DETAIL | Detail returns a second recordset with customer-visible processing history; Phase 6 does not write it. |
| MATCH | When `DonDatVeID` is non-null, `sp_Complaint_Create` requires the order to exist and belong to `@NguoiDungID`; SQL `50041` deliberately does not disclose which condition failed. |

DBR-01 changes only `dbo.sp_Complaint_Create`, recorded in `database/migrations/003_complaint_order_ownership.sql`. It does not alter the schema, optional-order semantics, seed, view, trigger, constraint, or index.
