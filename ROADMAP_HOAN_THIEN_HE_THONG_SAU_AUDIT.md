# ROADMAP HOÀN THIỆN HỆ THỐNG SAU FULL SYSTEM AUDIT

**Dự án:** Hệ thống đặt vé xem phim trực tuyến cho chuỗi rạp  
**Kiến trúc:** React.js → REST API → Node.js/Express → Stored Procedure → SQL Server  
**Định hướng:** DBMS-first / Stored-Procedure-Only  
**Baseline Use Case chính thức:** 45 Use Case  
**Phạm vi roadmap:** Database, Backend, dữ liệu mẫu, integration verification và ổn định Frontend sau cùng  
**Nguồn cơ sở:** `FULL_SYSTEM_AUDIT.md` ngày 07/10/2026 và các quyết định đã chốt sau audit

---

# 1. Mục đích của roadmap

Roadmap này được xây dựng để xử lý toàn bộ các vấn đề còn tồn tại sau Full System Audit theo hướng:

1. Không xây lại hệ thống.
2. Không thay đổi kiến trúc tổng thể.
3. Không thêm bảng mới vào database.
4. Không đưa SQL nghiệp vụ vào Backend.
5. Không sử dụng ORM/query builder để thay thế Stored Procedure.
6. Ưu tiên hoàn thiện Database và Backend trước.
7. Chỉ hoàn thiện Frontend mạnh sau khi Database và Backend đã ổn định.
8. Tập trung vào transaction safety, concurrency correctness, data integrity, business-rule correctness và integration verification.
9. Không mở rộng hệ thống vượt quá quy mô cần thiết của đồ án DBMS.
10. Mọi thay đổi phải giữ được các chức năng đang hoạt động và không phá cấu trúc hiện có.

Trạng thái sau audit cho thấy hệ thống đã có kiến trúc DBMS-first tương đối đầy đủ, Backend gần hoàn chỉnh về chuỗi Route → Middleware → Controller → Service → Procedure Client → Stored Procedure. Phần còn yếu nhất không phải là thiếu code mà là:

- Một số invariant trong Database chưa an toàn khi có transaction đồng thời.
- Một số business rule chưa được enforce đầy đủ.
- Một số thao tác thay đổi dữ liệu chưa bảo đảm all-or-nothing.
- Dữ liệu mẫu hiện tại không đủ để chạy các positive flow.
- Nhiều chức năng có đủ code nhưng chưa có bằng chứng integration/runtime để được xem là hoàn tất.
- Frontend còn một số lỗi state bất đồng bộ nhưng chưa phải ưu tiên lớn nhất.

Mục tiêu cuối cùng là đưa hệ thống tới trạng thái:

```text
Database correctness ổn định
        ↓
Backend contract ổn định
        ↓
Dữ liệu test đầy đủ và tái tạo được
        ↓
Transaction / concurrency / rollback được kiểm chứng
        ↓
45 Use Case được regression lại
        ↓
Frontend được ổn định trên Backend đã chốt
        ↓
Final System Verification
```

---

# 2. Baseline và các quyết định chính thức đã chốt

## 2.1. Số lượng Use Case

Baseline chính thức của hệ thống là **45 Use Case**.

| Actor | Số Use Case |
|---|---:|
| Khách hàng | 14 |
| Quản lý rạp | 9 |
| Nhân viên CSKH | 6 |
| Admin | 16 |
| **Tổng** | **45** |

`ADM-17 - Cấu hình hệ thống` đã được xác nhận **không thuộc phạm vi dự án** và phải được loại khỏi:

- Use Case Matrix.
- Completion Score.
- Final Audit.
- Roadmap.
- Checklist nghiệm thu.

Không được tiếp tục xem ADM-17 là một chức năng MISSING.

## 2.2. Backend dùng tài khoản `sa`

Backend kết nối SQL Server bằng `sa` là **chủ đích trong môi trường đồ án/local**.

Do đó:

```text
I-01 = ACCEPTED PROJECT CONSTRAINT
```

Không còn được xem là Critical Defect hoặc blocking issue đối với phạm vi đồ án.

Tuy nhiên quyết định này **không làm thay đổi kiến trúc DBMS-first**.

Backend vẫn phải tuân thủ:

```text
Frontend
→ REST API
→ Backend
→ Stored Procedure
→ SQL Server
```

Và vẫn cấm:

```text
SELECT/INSERT/UPDATE/DELETE SQL trực tiếp trong Backend
.query() cho SQL nghiệp vụ
ORM
Query Builder
Dynamic SQL từ request
Direct View access từ Backend
Direct Function access từ Backend
```

`sa` chỉ là tài khoản kết nối SQL Server của môi trường đồ án, không phải lý do để bỏ Stored Procedure gateway.

## 2.3. Không thêm bảng Database

Đây là ràng buộc cứng.

Trong toàn roadmap:

```text
Không thêm bảng mới.
Không xây event sourcing.
Không thêm history table mới.
Không thêm lock table mới.
Không thêm config table chỉ để giải quyết một issue.
```

Các giải pháp phải tận dụng:

- Bảng hiện có.
- Transaction.
- Locking của SQL Server.
- CHECK/FK/UQ hiện có.
- Stored Procedure.
- Function.
- View.
- Trigger.
- Dữ liệu snapshot đã có.

Nếu một vấn đề có thể được giải quyết bằng invariant hoặc Stored Procedure hiện tại thì ưu tiên giải pháp đó.

## 2.4. Pricing không có “Ngày lễ”

`Ngày lễ` là lỗi phát sinh trong quá trình giám sát phát triển.

Business rule chính thức chỉ còn:

```text
Ngày thường
Cuối tuần
Tất cả
```

Không phát triển holiday calendar.

Không thêm bảng ngày lễ.

Không giữ option `Ngày lễ` trong UI hoặc validator.

## 2.5. Ưu tiên Backend và Database

UI chưa phải trọng tâm.

Thứ tự ưu tiên:

```text
Database
→ Backend
→ Test Dataset
→ Integration
→ Use Case Regression
→ Frontend
```

Frontend hiện tại chỉ được sửa sớm nếu lỗi frontend có khả năng:

- gửi sai resource,
- xử lý nhầm đối tượng,
- làm sai nghiệp vụ,
- hoặc cản trở việc test Backend.

Không redesign UI trong các phase Database/Backend.

---

# 3. Các nguyên tắc kỹ thuật bắt buộc

## 3.1. Kiến trúc

Mọi flow nghiệp vụ phải theo:

```text
Frontend
→ REST API
→ Route
→ Middleware
→ Controller
→ Service
→ Procedure Client
→ Stored Procedure
→ View / Function / Table / Trigger
```

Backend chỉ được:

- nhận request,
- validate HTTP-level input,
- bind identity,
- bind typed parameters,
- gọi Stored Procedure cố định,
- map result,
- map domain error,
- trả response.

## 3.2. Business truth

Các giá trị sau phải do Database quyết định:

- Giá vé.
- Phụ thu.
- Tổng tiền vé.
- Tổng tiền đồ ăn.
- Mức giảm giá.
- Tổng tiền đơn.
- Trạng thái giữ ghế.
- Tình trạng ghế đã bị đặt.
- Trạng thái thanh toán/order.
- Eligibility của review.
- Scope của Manager.
- Permission nghiệp vụ cuối cùng.
- Compensation.
- Promotion quota.

Frontend và Backend có thể tính preview hoặc validate sớm cho UX nhưng không được xem là authoritative.

## 3.3. Transaction

Mọi Stored Procedure có thao tác nhiều bước mà nếu một bước fail có thể để dữ liệu ở trạng thái nửa chừng phải dùng transaction.

Pattern ưu tiên:

```sql
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRAN;

    -- validate
    -- lock
    -- update data

    COMMIT;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK;

    THROW;
END CATCH;
```

Không được:

```text
DELETE A
DELETE B
```

theo hai autocommit riêng nếu A và B phải thành công cùng nhau.

## 3.4. Lock order

Các Stored Procedure đụng cùng resource phải khóa theo thứ tự thống nhất.

Với resource liên quan đến lịch chiếu:

```text
PHONGCHIEU
→ SUATCHIEU
→ DONDATVE
→ CHITIETVE
```

Không tạo các SP có thứ tự khóa ngược nhau nếu có thể tránh.

Mục tiêu là:

- giảm race condition,
- giảm deadlock,
- dễ giải thích,
- dễ test.

## 3.5. Không over-engineer

Roadmap không được biến đồ án thành hệ thống cinema enterprise.

Không yêu cầu:

- Redis distributed locks.
- Kafka/RabbitMQ.
- Event sourcing.
- CQRS.
- Distributed transactions.
- MFA.
- SSO enterprise.
- Payment reconciliation platform phức tạp.
- Microservices.
- Separate reporting warehouse.
- Full observability stack.

Chỉ áp dụng các kỹ thuật phù hợp với:

```text
Node.js + Express
SQL Server
React.js
Đồ án DBMS
```

---

# 4. Tổng quan các issue sau khi cập nhật quyết định

| Issue | Trạng thái mới | Hướng xử lý |
|---|---|---|
| I-01 Runtime DB dùng `sa` | ACCEPTED | Không sửa kiến trúc; cập nhật tài liệu |
| I-02 Manager Room Delete không atomic | FIX | Transaction + room lock + dependency rule |
| I-03 Showtime overlap concurrency | FIX | Serialize theo row PHONGCHIEU |
| I-04 GRANT schema EXECUTE rộng | DEFER | Không ưu tiên do project dùng `sa` |
| I-05 Pricing có `Ngày lễ` | FIX | Loại bỏ hoàn toàn |
| I-06 Booking không enforce trạng thái parent | FIX | Central bookability rules |
| I-07 Promotion validate/consume chưa atomic | FIX | Authoritative validation trong booking transaction |
| I-08 Movie–Actor replace có thể mất association | FIX | Validate-before-replace |
| I-09 Historical metadata mutable | FIX CÓ GIỚI HẠN | Immutability cho transactional fields |
| I-10 Dataset không test được booking positive | FIX | Dynamic seed + test fixtures |
| I-11 Admin complaint async race | FIX SAU | Frontend stabilization |
| I-12 Backend test không reproducible | FIX | Loại dependency audit artifact |
| I-13 Admin report thiếu breakdown | FIX | Thêm recordset vào SP hiện tại |
| I-14 Admin pricing update thiếu field | FIX | Đồng bộ capability với Manager |
| I-15 Support queue stale response | FIX SAU | Request generation / abort |
| I-16 Complaint bulk trigger nondeterministic | FIX | Deterministic latest processing |
| I-17 Business preview duplication | HARDEN | DB authoritative + shared constants khi hợp lý |
| I-18 Auth thiếu rate policy | FIX NHẸ | Login/Register rate limit |
| I-19 Booking UI stale context | FIX SAU | Reset/key state theo showtime |
| I-20 Staff/Admin tạo customer profile | FIX | Role-aware profile update |
| I-21 Complaint order lookup che lỗi | FIX SAU | Error/retry state |
| I-22 GET Order Detail có side effect | FIX | Read-only detail; expiry qua job |
| I-23 Docs/setup/evidence chưa rõ | CLEANUP | Cuối roadmap |
| I-24 Frontend bundle warning | DEFER | Chỉ tối ưu nếu cần |
| I-25 Legacy/unused wrappers | CLEANUP | Review caller graph trước xóa |
| I-26 Pagination/observability | LIMITED | Làm vừa đủ |

---

# 5. ROADMAP CHI TIẾT

# PHASE R0 — CHUẨN HÓA BASELINE VÀ REQUIREMENT

## Mục tiêu

Đảm bảo mọi người, source, test và tài liệu đang làm việc trên cùng một baseline.

## Công việc

### R0.1. Chuyển I-01 sang Accepted Constraint

Cập nhật toàn bộ tài liệu liên quan để I-01 không còn:

```text
CRITICAL
FAIL
BLOCKER
```

Mà trở thành:

```text
ACCEPTED PROJECT CONSTRAINT
```

Ghi rõ:

> Backend sử dụng tài khoản `sa` để kết nối SQL Server trong phạm vi đồ án và môi trường local. Quyết định này được chấp nhận cho phạm vi học tập, không đại diện cho cấu hình production.

### R0.2. Loại ADM-17

Tất cả số liệu completion phải dùng 45 UC.

Xóa ADM-17 khỏi:

- Use Case Matrix.
- Final Completion.
- Missing Feature list.
- Audit scoring.
- Regression list.

### R0.3. Xóa “Ngày lễ”

Phải rà toàn repository:

```text
Ngày lễ
holiday
HOLIDAY
LoaiNgay
```

Các nơi có khả năng chứa:

```text
database/03_constraints
database/05_functions
database/08_procedures
shared/
backend/src/validators/
frontend/src/constants/
frontend/src/pages/
seed/
tests/
docs/
```

### R0.4. Kiểm tra dữ liệu trước migration

Trước khi thay CHECK:

```sql
SELECT *
FROM BANGGIA
WHERE LoaiNgay = N'Ngày lễ';
```

Nếu có record:

```text
FAIL migration
```

Không tự đổi dữ liệu.

### R0.5. Update CHECK

Giá trị hợp lệ:

```text
Ngày thường
Cuối tuần
Tất cả
```

### R0.6. Update pricing logic

`fn_TinhGiaVe` không còn nhánh hoặc assumption về `Ngày lễ`.

### R0.7. Update Backend/Frontend

Validator và dropdown chỉ có:

```text
Ngày thường
Cuối tuần
Tất cả
```

## Ràng buộc

- Không thêm bảng ngày lễ.
- Không thêm external calendar.
- Không giữ option hidden.
- Không map `Ngày lễ` thành `Cuối tuần`.
- Không tự đổi dữ liệu cũ.

## Đầu ra

```text
docs/USE_CASE_BASELINE_45.md
docs/PROJECT_ACCEPTED_CONSTRAINTS.md
migration/remove-holiday-pricing.sql
updated pricing validators/constants/tests
```

## Exit Criteria

```text
45 UC baseline thống nhất
ADM-17 không còn trong audit
I-01 = Accepted
0 occurrence “Ngày lễ” trong runtime contract
Pricing tests PASS
```

---

# PHASE R1 — DATABASE TRANSACTION & CONCURRENCY SAFETY

Đây là phase có độ ưu tiên cao nhất.

Không triển khai feature mở rộng lớn trước khi R1 hoàn tất.

## R1.1 — I-02: Manager Room Delete không atomic

### Lỗi

`sp_Manager_Room_Delete` có nguy cơ:

```text
1. Check room chưa có showtime
2. Một transaction khác tạo showtime
3. DELETE seats thành công
4. DELETE room fail bởi FK
5. Room vẫn tồn tại nhưng seats đã mất
```

Đây là partial commit.

### Mục tiêu sửa

Đảm bảo:

```text
Delete Room = all-or-nothing
```

Không được để database ở trạng thái:

```text
PHONGCHIEU tồn tại
SUATCHIEU tồn tại
GHE mất
```

### Phương án kỹ thuật

#### Bước 1 — Transaction

`sp_Manager_Room_Delete`:

```sql
SET XACT_ABORT ON;
```

và:

```sql
BEGIN TRY
    BEGIN TRAN;
    ...
    COMMIT;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK;
    THROW;
END CATCH;
```

#### Bước 2 — Lock parent resource

Lock row phòng:

```sql
SELECT @LockedPhongID = PhongID
FROM dbo.PHONGCHIEU WITH (UPDLOCK, HOLDLOCK)
WHERE PhongID = @PhongID;
```

Nếu không tồn tại:

```text
THROW domain error
```

#### Bước 3 — Validate scope

Manager scope phải được xác định từ phòng thật.

Không tin `RapID` do frontend gửi.

#### Bước 4 — Kiểm tra historical usage

Nếu:

```sql
EXISTS (
    SELECT 1
    FROM SUATCHIEU
    WHERE PhongID = @PhongID
)
```

thì không hard delete.

Business rule:

```text
Phòng chưa từng có suất → có thể hard delete.
Phòng đã từng có suất → chỉ chuyển Ngưng hoạt động.
```

#### Bước 5 — Delete

Nếu đủ điều kiện:

```text
DELETE GHE
DELETE PHONGCHIEU
```

trong cùng transaction.

#### Bước 6 — Đồng bộ Admin

`usp_Admin_Room_Delete` hiện đã tốt hơn về transaction nhưng vẫn cần kiểm tra lock order để đồng bộ với protocol chung.

### Ràng buộc

- Không thêm table lock.
- Không disable FK.
- Không cascade delete showtime/history.
- Không xóa historical showtime để xóa room.
- Không xóa seats trước khi xác định chắc chắn room được phép hard delete.
- Không dùng application transaction trong Node.js.

### Test bắt buộc

#### Unit/SQL

```text
Delete nonexistent room
Delete empty room
Delete room with seat only
Delete room with historical showtime
Delete room outside manager scope
```

#### Two-session concurrency

Scenario:

```text
Session A: Room Delete
Session B: Create Showtime same room
```

Kết quả hợp lệ:

```text
A commit, B fail
```

hoặc:

```text
B commit, A rollback
```

Không được:

```text
room survives with seats deleted
```

### Đầu ra

```text
database/.../sp_Manager_Room_Delete.sql
database/tests/room-delete-atomicity.sql
scripts/concurrency/room-delete-vs-showtime.mjs
docs/evidence/R1_ROOM_DELETE.md
```

### Exit Criteria

```text
Room delete all-or-nothing
No partial commit
Concurrency test PASS
QLR-02 không còn BROKEN vì I-02
```

---

## R1.2 — I-03: Concurrent Showtime Overlap

### Lỗi

Trigger overlap hiện tại có khả năng bảo vệ:

```text
nhiều row trong cùng statement
```

nhưng chưa đủ để bảo vệ:

```text
nhiều transaction song song
```

với `READ_COMMITTED_SNAPSHOT=ON`.

Hai transaction có thể cùng thấy “không overlap” rồi cùng commit.

### Mục tiêu

Invariant bắt buộc:

> Trong cùng một phòng, tại bất kỳ thời điểm nào không được tồn tại hai suất chiếu active có khoảng thời gian giao nhau.

### Phương án kỹ thuật

#### Chọn PHONGCHIEU làm mutex

Không thêm lock table.

Không dùng SERIALIZABLE cho toàn database.

Mọi create/update schedule phải khóa row phòng trước.

#### Lock pattern

```sql
SELECT @LockedPhongID = PhongID
FROM dbo.PHONGCHIEU WITH (UPDLOCK, HOLDLOCK)
WHERE PhongID = @PhongID;
```

Sau khi giữ lock mới:

```text
validate room
validate movie
validate time
check overlap
insert/update
```

#### Áp dụng cho

```text
sp_Manager_Showtime_Create
sp_Manager_Showtime_Update
sp_Manager_Showtime_Cancel

usp_Admin_Showtime_Create
usp_Admin_Showtime_Update
usp_Admin_Showtime_Cancel

sp_Manager_Room_Delete
usp_Admin_Room_Delete
```

#### Lock order

Bắt buộc:

```text
PHONGCHIEU
→ SUATCHIEU
→ DONDATVE
→ CHITIETVE
```

Nếu update showtime cũ từ một room sang room khác sau này được hỗ trợ thì phải define deterministic order, ví dụ lock room ID nhỏ trước room ID lớn. Hiện tại nếu không hỗ trợ đổi phòng thì không cần mở rộng.

#### Trigger

Giữ:

```text
TRG_SuatChieu_KiemTraTrungLich
```

Trigger tiếp tục là defense-in-depth.

Không loại bỏ trigger chỉ vì SP đã lock.

### Ràng buộc

- Không đưa lock vào Backend.
- Không dùng JS mutex.
- Không thêm Redis.
- Không đổi isolation toàn DB.
- Không dựa duy nhất vào trigger.
- Không bỏ check multi-row.

### Test bắt buộc

```text
Create + Create same room overlap
Create + Create same room no overlap
Create + Create different rooms same time

Create + Update
Update + Update
Cancel + Create
RoomDelete + Create
Multi-row INSERT
Boundary end == start
Nested transaction/savepoint behavior
```

Stress:

```text
>= 100 lần race
```

Assertion:

```text
0 overlapping committed showtime
```

### Error Contract

Overlap phải map về domain conflict:

```text
HTTP 409
```

Không trả raw SQL error.

### Đầu ra

```text
updated showtime SPs
updated room-delete lock protocol
current overlap trigger retained
scripts/concurrency/showtime-overlap.mjs
docs/evidence/R1_SHOWTIME_CONCURRENCY.md
```

### Exit Criteria

```text
CREATE+CREATE PASS
UPDATE+CREATE PASS
UPDATE+UPDATE PASS
RoomDelete+Create PASS
0 overlap commit
QLR-04 không BROKEN
QLR-05 không BROKEN
ADM-14 không BROKEN
```

---

# PHASE R2 — BOOKING BUSINESS CORRECTNESS

## R2.1 — I-06: Booking không enforce trạng thái parent

### Lỗi

Một showtime có thể vẫn `Mở bán` trong khi resource cha không còn phù hợp.

Ví dụ:

```text
Rạp = Tạm đóng
Phòng = Bảo trì
Phim = Ngừng chiếu
SUATCHIEU = Mở bán
```

Nếu booking chỉ check showtime/seat thì transaction vẫn có thể đi tiếp.

### Mục tiêu

Tạo một định nghĩa thống nhất cho:

```text
Bookable Showtime
```

### Business rule chính thức

#### Showtime

```text
TrangThai = Mở bán
ThoiGianBatDau > current DB time
```

#### Cinema

```text
TrangThai = Hoạt động
```

#### Room

```text
TrangThai = Hoạt động
```

#### Movie

```text
TrangThai != Ngừng chiếu
```

Không bắt buộc phải là `Đang chiếu`.

Phim `Sắp chiếu` vẫn có thể bán trước nếu showtime diễn ra đúng release window.

#### Release window

```text
showDate >= NgayKhoiChieu
AND
(NgayKetThuc IS NULL OR showDate <= NgayKetThuc)
```

#### Seat

```text
TrangThai = Hoạt động
```

#### Ticket/hold

Ghế không được có effective booking conflict.

### Nơi enforce

Authoritative:

```text
sp_Booking_Create
```

Read consistency:

```text
sp_Showtime_ListByMovie
sp_Showtime_GetDetail
sp_Seat_ListByShowtime
vw_LichChieuChiTiet
```

### Thiết kế

Không tạo một Boolean từ frontend rồi gửi xuống.

Database phải tự JOIN/kiểm tra resource hiện tại.

Có thể mở rộng View hiện có để chứa trạng thái parent, nhưng booking SP vẫn phải re-check.

### Ràng buộc

- Không tin frontend.
- Không chỉ filter ở read endpoint.
- Không hardcode logic ở Backend.
- Không thêm table.
- Không yêu cầu movie status phải `Đang chiếu`.

### Test

```text
Cinema Hoạt động / Room Hoạt động / Movie valid → booking allowed

Cinema Tạm đóng → reject
Room Bảo trì → reject
Room Ngưng hoạt động → reject
Movie Ngừng chiếu → reject

Movie Sắp chiếu
showtime >= NgayKhoiChieu
→ allowed

showtime < NgayKhoiChieu
→ reject

showtime > NgayKetThuc
→ reject

Seat Hỏng/Bảo trì → reject
Showtime past → reject
Showtime Đóng bán → reject
Showtime Đã hủy → reject
```

### Đầu ra

```text
bookability contract
updated booking SP
aligned public showtime SP/view
DB tests
integration tests
```

### Exit Criteria

```text
No booking on inactive resource
Public availability aligned with DB booking rules
KH-05/KH-06/KH-07 no known parent-status defect
```

---

## R2.2 — I-07: Promotion Preview và Consume chưa atomic

### Lỗi

Promotion validation endpoint là preview.

Giữa preview và booking, promotion có thể:

- hết quota,
- hết hạn,
- bị disable,
- bị thay đổi threshold,
- bị thay đổi value.

Vấn đề lớn nhất:

```text
User gửi promotion
promotion invalid khi booking
→ hệ thống bỏ promotion
→ vẫn tạo order full price
```

Đây không phải behavior an toàn.

### Mục tiêu

Nếu user chủ động yêu cầu dùng promotion thì booking phải:

```text
Dùng đúng promotion
hoặc
Fail rõ ràng
```

Không âm thầm bỏ promotion.

### Contract mới

#### `/promotions/validate`

Chỉ phục vụ:

```text
PREVIEW
```

Không bảo đảm booking chắc chắn sẽ dùng được promotion.

#### `sp_Booking_Create`

Là:

```text
AUTHORITATIVE
```

### Kỹ thuật

Trong transaction booking:

```sql
SELECT ...
FROM KHUYENMAI WITH (UPDLOCK, HOLDLOCK)
WHERE MaCode = @MaKhuyenMai;
```

Sau đó check lại toàn bộ:

```text
Existence
TrangThai
NgayBatDau
NgayKetThuc
SoLuong
SoLuongDaDung
DonHangToiThieu
LoaiGiamGia
GiaTriGiam
GiamToiDa
```

#### Nếu không truyền promotion

```text
Booking full price
```

#### Nếu có truyền promotion nhưng invalid

```text
THROW domain error
```

Không:

```text
SET @KhuyenMaiID = NULL
SET @TienGiam = 0
continue
```

### Quota

Giữ constraint:

```text
SoLuongDaDung <= SoLuong
```

như defense-in-depth.

Promotion row lock đảm bảo validation và consume cùng transaction.

### Error mapping

Database:

```text
PROMOTION_NOT_AVAILABLE
```

Backend:

```text
409 Conflict
```

Frontend sau này hiển thị:

```text
Khuyến mãi không còn khả dụng.
Vui lòng kiểm tra lại đơn trước khi đặt.
```

### Test

```text
valid promotion
nonexistent
expired
inactive
minimum fail
quota exhausted
last quota
two booking requests for final quota
admin update promotion during booking
percent cap
fixed discount
max discount
```

### Đầu ra

```text
atomic promotion usage
domain error mapping
promotion concurrency test
booking + promotion integration report
```

### Exit Criteria

```text
No silent full-price booking when promo requested
No quota oversubscription
Clear 409 conflict
KH-09 no known promotion race defect
```

---

# PHASE R3 — DATA INTEGRITY

## R3.1 — I-08: Movie–Actor replace không atomic về reference validity

### Lỗi

Hiện flow có thể:

```text
DELETE PHIM_DIENVIEN hiện tại
INSERT ... JOIN DIENVIEN
```

Actor ID không tồn tại bị JOIN bỏ qua.

Kết quả:

```text
request chứa ID sai
→ association cũ bị mất
→ API có thể thành công
```

### Mục tiêu

Relationship replacement phải:

```text
ALL OR NOTHING
```

### Thiết kế

#### Parse

JSON input → table variable.

Ví dụ:

```text
ActorID
VaiDien
```

#### Validate duplicates

Không cho một ActorID lặp nếu schema không cho phép.

#### Validate references

So sánh:

```text
COUNT(request ActorID)
```

với:

```text
COUNT(DIENVIEN match)
```

Nếu khác:

```text
THROW invalid actor reference
```

#### Validate movie

Movie phải tồn tại.

#### Transaction

Chỉ sau khi tất cả validation PASS:

```text
BEGIN TRAN
DELETE old associations
INSERT new associations
COMMIT
```

#### Empty list

Nếu business contract xác định:

```text
[] = clear cast
```

thì cho phép.

### Ràng buộc

- Không silent skip.
- Không partial insert.
- Không auto-create actor.
- Không thêm temporary persistent table.
- Không thay đổi PHIM_DIENVIEN schema.

### Test

```text
all valid
one invalid
all invalid
duplicate ID
empty list
movie nonexistent
rollback
```

### Đầu ra

```text
safe sp_Admin_MovieActor_Set
actor-reference validation tests
ADM-09 no longer BROKEN
```

---

## R3.2 — I-09: Historical Metadata

### Vấn đề

Hệ thống đã snapshot tiền tốt nhưng một số metadata lịch sử vẫn JOIN resource hiện tại.

Nếu resource bị sửa thì order history có thể đổi cách hiển thị.

### Phân tích theo quy mô đồ án

Không cần snapshot toàn bộ:

```text
TenPhim
TenRap
TenPhong
TenSanPham
```

vì điều này sẽ kéo theo:

- thêm nhiều column,
- migration lớn,
- sửa nhiều SP/view,
- tăng độ phức tạp vượt lợi ích.

Thay vào đó, bảo vệ các field có ý nghĩa giao dịch trực tiếp.

### Quyết định

#### Giữ snapshot monetary

Tiếp tục bảo toàn:

```text
CHITIETVE.GiaVe
CHITIETDOAN.DonGia
DONDATVE.TongTienVe
DONDATVE.TongTienDoAn
DONDATVE.TienGiamGia
THANHTOAN.SoTien
```

#### Showtime immutability

Nếu `SUATCHIEU` đã từng xuất hiện trong bất kỳ `DONDATVE`:

Không được sửa:

```text
PhimID
PhongID
ThoiGianBatDau
ThoiGianKetThuc
DinhDang
GiaVeCoBan
```

Cho phép:

```text
state transition
cancel through approved cancellation flow
```

#### Seat immutability

Nếu `GHE` đã từng xuất hiện trong `CHITIETVE`:

Không cho đổi:

```text
LoaiGhe
```

Cho phép đổi operational status:

```text
Hoạt động
Bảo trì
Hỏng
```

#### Catalog label

Cho phép:

```text
TenPhim
TenRap
TenPhong
TenSanPham
```

là current descriptor.

Đây là trade-off chính thức của đồ án.

### Nơi sửa

```text
sp_Manager_Showtime_Update
usp_Admin_Showtime_Update

sp_Manager_Seat_Update
usp_Admin_Seat_Update
```

### Ràng buộc

- Không thêm history table.
- Không thêm snapshot table.
- Không thêm column hàng loạt.
- Không cấm sửa mọi catalog label.
- Không rewrite historical money.

### Test

```text
Unused showtime → structural update allowed
Showtime with historical order → structural update rejected

Unused seat → LoaiGhe update allowed
Seat used in historical ticket → LoaiGhe update rejected

Pricing edit after booking → order amount unchanged
Product catalog price change → old CHITIETDOAN.DonGia unchanged
```

### Đầu ra

```text
documented historical-data policy
showtime immutability guards
seat-type immutability guards
historical regression tests
```

### Exit Criteria

```text
Historical money stable
Core transaction identity stable
No new DB table
```

---

## R3.3 — I-16: Complaint status trigger nondeterministic trong batch

### Lỗi

Nếu một statement insert nhiều `XULY_KHIEUNAI` cho cùng `KhieuNaiID`, trigger update parent từ `INSERTED` có thể không xác định record cuối.

### Mục tiêu

Parent complaint status phải phản ánh processing event mới nhất.

### Phương án

Trong trigger:

```sql
ROW_NUMBER() OVER (
    PARTITION BY KhieuNaiID
    ORDER BY XuLyID DESC
)
```

Chỉ dùng:

```text
rn = 1
```

để update `KHIEUNAI.TrangThai`.

### Ràng buộc

- Trigger phải set-based.
- Không cursor.
- Không loop row-by-row.
- Không giả định INSERTED chỉ có 1 row.
- Không thêm LastProcessingID column.

### Test

```text
single processing
multi complaint in one batch
multiple processing same complaint
mixed batch
different statuses
```

### Đầu ra

```text
deterministic complaint trigger
multi-row trigger tests
```

---

# PHASE R4 — BACKEND VÀ DB CONTRACT HARDENING

## R4.1 — I-12: Backend test suite không reproducible

### Lỗi

Một số test phụ thuộc file audit không còn tồn tại:

```text
database/_audit/known-contract-gaps.json
```

Kết quả clean checkout không thể đảm bảo test suite xanh.

### Mục tiêu

Test suite phải:

```text
clone repo
install dependencies
run test
→ deterministic PASS/FAIL
```

Không phụ thuộc evidence thủ công.

### Sửa

Mọi input test phải thuộc một trong hai dạng:

#### Versioned fixture

Được commit trong repo.

Hoặc:

#### Generated fixture

Được tạo deterministic trong setup.

Không đọc file phát sinh từ một audit cũ trừ khi test setup tự tạo.

### Ràng buộc

Không:

```text
tạo file giả chỉ để test xanh
skip test
comment out failing test
```

Phải sửa dependency đúng bản chất.

### Đầu ra

```text
backend test suite 100% reproducible
test setup docs
clean checkout test evidence
```

### Exit Criteria

```text
Backend test = 100% PASS
No missing artifact dependency
```

---

## R4.2 — I-13: Admin Report thiếu breakdown

### Yêu cầu

Admin report phải đủ ý nghĩa:

```text
Tổng kỳ
Theo rạp
Theo phim
Theo thời gian
```

### Phương án

Không thêm report table.

Mở rộng:

```text
sp_Admin_Report_Revenue
```

trả nhiều recordset.

Đề xuất:

#### Recordset 1

```text
Summary
```

#### Recordset 2

```text
RevenueByCinema
```

#### Recordset 3

```text
RevenueByMovie
```

#### Recordset 4

```text
RevenueByDate
```

Tất cả tính từ transaction snapshot.

### Backend

Chỉ mapping:

```json
{
  "summary": {},
  "byCinema": [],
  "byMovie": [],
  "byDate": []
}
```

Không SUM lại ở JS.

### Ràng buộc

- Không thêm aggregate table.
- Không thêm materialized reporting DB.
- Không tính authoritative report trong FE.
- Chỉ dùng dữ liệu successful/qualified transaction đúng business rule.

### Test

```text
empty transaction data
single cinema
multiple cinema
single movie
multiple movie
multi-day
date boundary
canceled/failed payment excluded as required
```

### Đầu ra

```text
complete Admin report SP contract
backend DTO mapping
integration tests
```

---

## R4.3 — I-14: Admin Pricing Update thiếu dimensions/date

### Lỗi

Create hỗ trợ:

```text
LoaiGhe
LoaiNgay
DinhDang
PhuThu
NgayBatDau
NgayKetThuc
```

Admin Update chỉ sửa một phần.

### Mục tiêu

Admin edit phải có capability tương đương Manager khi chỉnh pricing rule.

### Sửa

Admin Update nhận:

```text
LoaiGhe
LoaiNgay
DinhDang
PhuThu
NgayBatDau
NgayKetThuc
TrangThai
```

Trigger overlap tiếp tục là lớp bảo vệ.

### Đồng bộ

```text
DB SP
Backend validator
Service binding
Admin form contract
Tests
```

UI chưa cần đẹp lại, chỉ bảo đảm field tồn tại đúng.

### Ràng buộc

- Không duplicate rule bằng workaround nếu có thể update.
- Không bỏ trigger overlap.
- Không cho FE quyết định conflict.

### Đầu ra

```text
ADM-13 complete update contract
pricing regression suite
```

---

## R4.4 — I-17: Business preview duplication

### Hiện trạng

Một số giới hạn được lặp ở nhiều layer:

```text
max seats/order
max food quantity
max percent discount
```

### Quyết định

Không coi việc frontend/backend có UX validation là lỗi.

Nhưng phải phân định rõ:

```text
Frontend = UX guard
Backend = HTTP validation
Database = authoritative business enforcement
```

### Sửa

Nếu có constants có thể shared dễ dàng giữa FE/BE thì dùng shared module.

Database vẫn giữ Function/CHECK tương ứng.

Không bỏ DB rule để chỉ dùng shared JS constant.

### Preview money

Nếu Backend tính provisional subtotal cho promotion preview:

- phải ghi rõ là preview,
- không dùng preview đó để chốt payment/order,
- booking response từ DB là authoritative.

### Ràng buộc

- Không chuyển authoritative pricing sang JS.
- Không xóa DB function để tránh duplication.
- Không tạo config table mới.

### Đầu ra

```text
business-rule ownership documented
shared frontend/backend constants where appropriate
DB remains authoritative
```

---

## R4.5 — I-18: Auth hardening mức đồ án

### Vấn đề

Login/Register chưa có rate limiting.

### Phạm vi sửa

Thêm rate limit cho:

```text
POST /api/auth/login
POST /api/auth/register
```

Có thể dùng in-memory limiter phù hợp môi trường single-instance đồ án.

### Không yêu cầu

```text
Redis
MFA
OAuth enterprise
refresh-token system
JWT denylist
device management
```

### Rule

Rate limit không được làm hỏng:

- login bình thường,
- automated integration test hợp lý,
- frontend retry.

### Đầu ra

```text
basic login/register rate protection
auth regression tests
```

---

## R4.6 — I-20: Role khác tạo HOSOKHACHHANG

### Lỗi

Profile update chung có khả năng tạo `HOSOKHACHHANG` cho:

```text
Manager
CSKH
Admin
```

### Rule mới

#### Customer

Update:

```text
NGUOIDUNG
+
HOSOKHACHHANG
```

#### Manager / CSKH / Admin

Chỉ update các field chung ở:

```text
NGUOIDUNG
```

Không insert customer profile.

### Thiết kế

Role phải lấy từ Database hiện tại.

Không nhận role từ request body.

### Test

```text
Customer update
Customer profile missing → create allowed

Manager update
→ no HOSOKHACHHANG

CSKH update
→ no HOSOKHACHHANG

Admin update
→ no HOSOKHACHHANG
```

### Đầu ra

```text
role-aware profile SP
profile tests
no staff profile pollution
```

---

## R4.7 — I-22: GET Order Detail có side effect

### Lỗi

Read order detail có thể expire order.

Điều này khiến:

```text
GET
```

không còn là read-only.

### Phương án

#### Bỏ mutation khỏi detail SP

`sp_Order_GetDetailByCustomer` không gọi expiry mutation.

#### Lifecycle

Expiry được thực hiện bởi:

```text
sp_Order_ExpirePending
+
backend expiry job
```

#### UI freshness

Detail SP có thể trả:

```text
EffectiveStatus
```

được tính theo:

```text
TrangThai
HanGiuCho
Current DB Time
```

mà không update.

### Ràng buộc

- Không để GET tự trả coupon.
- Không để GET update ticket.
- Không để client quyết định expire.
- Không bỏ expiry job.

### Đầu ra

```text
read-only order detail
expiry lifecycle isolated
tests proving GET does not mutate
```

---

# PHASE R5 — DỮ LIỆU MẪU VÀ TEST FIXTURE

Đây là phase quan trọng để biến các chức năng hiện có từ `PARTIAL` thành có bằng chứng runtime.

## R5.1 — Tổ chức seed

Không để toàn bộ seed trong một script khó quản lý.

Chia logic thành:

```text
seed_base
seed_demo_dynamic
test_fixture
```

Tên file có thể theo convention hiện tại của repository.

## R5.2 — Base seed

Phải chứa đủ:

```text
4 roles
permissions
role-permission
users
customer profiles
manager assignments

cinemas
rooms
seats

movies
genres
movie-genres
actors
movie-actors

products
pricing
promotions
```

Có thể giữ số lượng catalog hiện tại nếu đã đủ.

## R5.3 — Dynamic showtime seed

Không hardcode ngày cụ thể.

Thời gian phải dựa trên current DB clock.

Ví dụ:

```text
today - 7 days
today - 3 days
today - 1 day

today + 1 day
today + 2 days
today + 3 days
today + 7 days
```

Mục tiêu:

```text
6–10 past showtimes
20–30 future open showtimes
```

Phải phân bố nhiều phòng và nhiều phim.

Không overlap trong cùng room.

## R5.4 — Transaction data mẫu

Cần tạo đủ trạng thái để test.

### Orders

```text
Pending
Paid
Expired
Canceled
Completed nếu business lifecycle dùng
```

### Tickets

```text
active
canceled
used nếu cần
```

### Food

Có order:

```text
không food
1 product
nhiều product
```

### Payment

Có:

```text
failed attempt
successful attempt
multiple attempts same order
```

### Review

Có:

```text
eligible
non-eligible fixture dùng test
```

### Complaint

Có:

```text
without linked order
with linked order
new
processing
resolved
closed/rejected nếu contract dùng
```

### Compensation

Có ít nhất một:

```text
canceled show
paid orders
compensation
```

## R5.5 — Test database riêng

Tạo:

```text
CinemaBookingDB_Test
```

hoặc tên tương đương.

Pipeline:

```text
Create DB
→ Schema
→ Constraints
→ Indexes
→ Functions
→ Views
→ Triggers
→ Procedures
→ Seed
→ Test
→ Cleanup
```

### Ràng buộc

- Không chạy destructive fixture trên `CinemaBookingDB` dev chính.
- Test database phải rebuild được.
- Không phụ thuộc dữ liệu người dùng tạo thủ công.
- Dữ liệu không chứa secret thật.
- Date phải dynamic.

### Đầu ra

```text
rebuild-test-db script
dynamic seed scripts
transaction fixture scripts
test data documentation
```

### Exit Criteria

```text
Có future open showtime
Có real order data
Có payment attempts
Có review
Có complaint
Có complaint history
Có compensation
Rebuild deterministic
```

---

# PHASE R6 — DATABASE & BACKEND INTEGRATION VERIFICATION

Không chỉ test từng SP riêng lẻ.

Phải test theo business flow.

## R6.1 — Booking Integration

Test:

```text
Movie
→ Showtime
→ Seat
→ Food
→ Promotion
→ Booking
```

Cases:

```text
normal booking
no food
with food
with promotion
without promotion
wrong seat room
inactive seat
same seat duplicate
held seat
expired hold
max seats
max food quantity
inactive parent
past showtime
```

## R6.2 — Booking Concurrency

Ít nhất:

```text
same showtime same seat
same showtime overlapping seat lists
different seats
same customer hold limit
promotion last quota
```

Mục tiêu:

```text
không double-seat commit
không quota oversubscription
```

## R6.3 — Payment Integration

Flow:

```text
Create booking
→ Create payment attempt
→ Fail payment
→ Create second attempt
→ Success
→ Re-read order
```

Cases:

```text
wrong owner
wrong payment/order
double same terminal result
different terminal result replay
expired order
already paid order
```

## R6.4 — Historical Integrity

Flow:

```text
Create booking
→ pay
→ edit pricing
→ read old order
```

Assert monetary values không đổi.

Flow:

```text
historical order exists
→ try update showtime structural field
```

Reject.

Flow:

```text
historical ticket exists
→ try change seat type
```

Reject.

## R6.5 — Manager Scope

Test:

```text
assigned cinema
foreign cinema
expired assignment
revoked assignment
room in assigned cinema
room outside assigned cinema
seat indirect resource
showtime indirect resource
```

## R6.6 — Room Delete Concurrency

Test đúng I-02.

Lưu evidence.

## R6.7 — Showtime Concurrency

Test đúng I-03.

Lưu evidence.

## R6.8 — Complaint Integration

Flow:

```text
Customer create complaint
→ CSKH list
→ detail
→ linked order
→ add processing
→ update status
→ Customer read timeline
```

Test:

```text
foreign customer
CSKH permission missing
Admin permission conjunction
bulk trigger
```

## R6.9 — Admin Integration

Test:

```text
User
Role
Permission
Role-Permission
Assignment
Cinema
Image
Room
Seat
Movie
Actor
Cast
Genre
Product
Promotion
Pricing
Showtime
Complaint
Report
```

Không bắt buộc browser UI trong phase này.

## R6.10 — Báo cáo đầu ra

Phải tạo:

```text
docs/DATABASE_INTEGRATION_REPORT.md
docs/BACKEND_INTEGRATION_REPORT.md
docs/CONCURRENCY_REPORT.md
docs/ROLLBACK_REPORT.md
docs/DATA_INTEGRITY_REPORT.md
```

Mỗi report cần:

```text
Test ID
Scenario
Input
Expected
Actual
Result
Evidence
```

---

# PHASE R7 — 45 USE CASE REGRESSION

Đây là phase đánh giá lại toàn hệ thống sau khi DB/BE ổn.

## R7.1 — Matrix mới

Tạo:

```text
docs/USE_CASE_MATRIX_45.md
```

Mỗi Use Case gồm:

| Field | Nội dung |
|---|---|
| UC | ID |
| Function | Chức năng |
| DB | PASS/PARTIAL/BROKEN |
| SP | Stored Procedure |
| Backend | Controller/Service/Route |
| Frontend | Page/Component |
| Integration | Evidence |
| Status | Overall |
| Issue | Nếu còn |
| Test | Test IDs |

## R7.2 — Status Rule

### PASS

Chỉ khi:

```text
DB correct
Stored Procedure correct
Backend contract correct
Authorization correct
Integration evidence exists
No known material issue
```

### PARTIAL

Implementation tồn tại nhưng:

- chưa có positive test,
- chưa có browser evidence,
- hoặc một layer chưa chứng minh.

### BROKEN

Có known incorrect path.

### MISSING

Requirement bắt buộc không tồn tại.

## R7.3 — Mục tiêu của phase

Backend/Database:

```text
BROKEN = 0
MISSING = 0
```

Frontend có thể còn PARTIAL nếu chưa đến R8.

## R7.4 — Không fake PASS

Không được nâng PASS chỉ vì:

```text
file exists
route exists
SP exists
unit test mock PASS
```

Nếu chức năng cần transaction thật thì phải có DB integration evidence.

---

# PHASE R8 — FRONTEND STABILIZATION

Frontend chỉ bắt đầu mạnh sau khi Backend contract ổn.

Không redesign.

## R8.1 — I-11: Admin Complaint stale detail

### Lỗi

Flow có thể:

```text
Open A
Open B
Response B về
Response A về muộn
UI hiển thị A
selected ID vẫn B
```

Người dùng có thể nhìn complaint A nhưng thao tác B.

### Sửa

Dùng:

```text
AbortController
hoặc
generation/request ID
```

Response chỉ được cập nhật state khi:

```text
response resource = selected resource hiện tại
```

Write action phải dùng cùng object/resource đang hiển thị.

### Đầu ra

```text
Admin complaint detail race fixed
```

## R8.2 — I-15: Support Queue stale filter

### Lỗi

Response filter cũ có thể overwrite filter mới.

### Sửa

Mỗi queue request có generation ID.

Chỉ request mới nhất được cập nhật queue.

### Đầu ra

```text
Support filter state deterministic
```

## R8.3 — I-19: Booking stale context

Khi `showtimeId` thay đổi phải reset:

```text
selected seats
food quantities
promotion
promotion preview
booking result
success state
errors
```

Promotion request cũng phải stale-safe.

### Đầu ra

```text
Booking state keyed by showtime
```

## R8.4 — I-21: Complaint order lookup che lỗi

Không:

```js
.catch(() => [])
```

Phải phân biệt:

```text
loading
success
empty
error
retry
```

### Đầu ra

```text
visible order lookup error
```

## R8.5 — UI constraints

Không được:

```text
đổi palette
đập layout
redesign portal
đổi visual identity
thay component hierarchy lớn nếu không cần
```

Chỉ sửa:

```text
state
async request
feedback
loading
error
retry
business flow
```

---

# PHASE R9 — CLEANUP, DOCUMENTATION, FINAL AUDIT

## R9.1 — I-23: Documentation

Root README phải có:

```text
Project overview
Architecture
Database setup
Backend setup
Frontend setup
Environment variables
Build
Seed
Test DB
Tests
Run
Known demo constraints
```

Tài liệu phải thống nhất:

```text
45 UC
27 current tables
No Holiday pricing
sa accepted for project
DBMS-first
```

## R9.2 — I-24: Bundle

Frontend bundle warning không phải blocker.

Chỉ tối ưu nếu:

- load thực sự chậm,
- hoặc dễ lazy-load portal.

Candidate:

```text
AdminPortal
ManagerPortal
SupportPortal
```

Không ưu tiên trước business correctness.

## R9.3 — I-25: Legacy/Unused

Review:

```text
legacy SP aliases
unused frontend API wrappers
unused DB functions/views
stale comments
old audit scripts
```

Không xóa dựa trên tên hoặc grep duy nhất.

Phải kiểm:

```text
Backend caller
SQL dependency
Tooling caller
Test caller
Documentation compatibility
```

## R9.4 — I-26: Pagination / Observability

Làm mức đồ án.

### Logging

Có:

```text
request ID
actor ID
route
status
duration
error code
```

Không log:

```text
password
JWT
hash
sensitive secrets
```

### Pagination

Chỉ thêm cho resource có khả năng list lớn nếu cần:

```text
users
orders
complaints
showtimes
```

Không cần paginate catalog rất nhỏ chỉ để “enterprise”.

### Performance

Chạy basic measurements trên test dataset.

Không cần production load platform.

---

# 6. MILESTONE

## M0 — Baseline Correct

Điều kiện:

```text
45 UC
ADM-17 removed
I-01 Accepted
Ngày lễ removed
```

## M1 — Database Transaction Safe

Điều kiện:

```text
I-02 fixed
I-03 fixed
RoomDelete race PASS
Showtime race PASS
```

Không được chuyển milestone nếu vẫn có khả năng partial room delete hoặc overlapping showtime commit.

## M2 — Core Booking Correct

Điều kiện:

```text
I-06 fixed
I-07 fixed
Bookability correct
Promotion atomic
```

## M3 — Data Integrity Stable

Điều kiện:

```text
I-08 fixed
I-09 policy implemented
I-16 fixed
```

## M4 — Backend Stable

Điều kiện:

```text
Backend tests 100% PASS
Admin report complete
Admin pricing complete
Profile role correct
GET detail read-only
Basic auth rate limit
```

## M5 — Testable System

Điều kiện:

```text
Fresh dynamic dataset
Future open showtimes
Orders
Payments
Reviews
Complaints
Compensation
Rebuildable test DB
```

## M6 — Database/Backend Verified

Điều kiện:

```text
Booking integration PASS
Booking concurrency PASS
Promotion concurrency PASS
Payment retry PASS
Ownership PASS
Manager scope PASS
Historical integrity PASS
Complaint PASS
Admin PASS
```

## M7 — 45 UC Backend/DB Complete

Điều kiện:

```text
BROKEN = 0
MISSING = 0
```

trong phạm vi DB/Backend.

## M8 — Frontend Stable

Điều kiện:

```text
I-11 fixed
I-15 fixed
I-19 fixed
I-21 fixed
Browser flow stable
```

## M9 — Final Project Ready

Điều kiện:

```text
Docs updated
Final audit
All critical regression PASS
```

---

# 7. DELIVERABLES DỰ KIẾN

Cấu trúc gợi ý:

```text
docs/
├── PROJECT_ACCEPTED_CONSTRAINTS.md
├── USE_CASE_BASELINE_45.md
├── DATABASE_INTEGRATION_REPORT.md
├── BACKEND_INTEGRATION_REPORT.md
├── CONCURRENCY_REPORT.md
├── ROLLBACK_REPORT.md
├── DATA_INTEGRITY_REPORT.md
├── USE_CASE_MATRIX_45.md
├── FINAL_SYSTEM_AUDIT.md
└── evidence/
    ├── R1_ROOM_DELETE.md
    ├── R1_SHOWTIME_CONCURRENCY.md
    ├── R2_BOOKABILITY.md
    ├── R2_PROMOTION.md
    ├── R3_CAST_ATOMICITY.md
    ├── R3_HISTORICAL_DATA.md
    └── ...

database/
├── existing schema...
├── tests/
│   ├── room-delete-atomicity.sql
│   ├── showtime-overlap.sql
│   ├── bookability.sql
│   ├── promotion.sql
│   ├── historical-integrity.sql
│   └── complaint-multirow.sql
└── seed/
    ├── base
    ├── demo-dynamic
    └── test-fixtures

scripts/
├── rebuild-test-db
├── concurrency/
│   ├── room-delete-vs-showtime
│   ├── showtime-overlap
│   ├── booking-seat-stress
│   └── promotion-quota-stress
└── verification/
```

Tên thực tế có thể điều chỉnh để phù hợp cấu trúc repository hiện có.

Không được tạo cây thư mục mới nếu repository đã có convention khác phù hợp hơn.

---

# 8. RÀNG BUỘC TOÀN ROADMAP

| ID | Ràng buộc bắt buộc |
|---|---|
| C-01 | Không viết SQL nghiệp vụ trong Backend |
| C-02 | Backend chỉ gọi Stored Procedure |
| C-03 | Không ORM/query builder |
| C-04 | Không `.query()` runtime cho business SQL |
| C-05 | Transaction thuộc DBMS |
| C-06 | DB là source of truth cho giá/trạng thái/invariant |
| C-07 | Không thêm bảng mới |
| C-08 | Không redesign Database toàn bộ |
| C-09 | Không phá 45 Use Case đã chốt |
| C-10 | Không triển khai ADM-17 |
| C-11 | Không có `Ngày lễ` trong pricing |
| C-12 | `sa` được chấp nhận trong phạm vi đồ án |
| C-13 | Dùng `sa` không đồng nghĩa được bỏ SP gateway |
| C-14 | Không redesign UI trước khi Backend ổn |
| C-15 | Không đổi visual identity/tông màu UI nếu không được yêu cầu |
| C-16 | Lock order phải thống nhất |
| C-17 | Multi-step write phải rollback-safe |
| C-18 | Concurrency phải test bằng nhiều connection thật |
| C-19 | Không chạy destructive concurrency test trên DB dev |
| C-20 | Seed phải dynamic theo thời gian |
| C-21 | Không hardcode future showtime bằng ngày tuyệt đối dễ stale |
| C-22 | Không nâng PASS chỉ vì code tồn tại |
| C-23 | Không fake evidence |
| C-24 | Không skip test để làm xanh |
| C-25 | Không tự động sửa dữ liệu có nghĩa business khi migration gặp conflict |
| C-26 | Không mở rộng scope thành hệ thống production enterprise |
| C-27 | Không đưa authoritative money calculation sang Frontend/Backend |
| C-28 | Không tin userId/role/price/totals từ client |
| C-29 | Manager scope phải derive từ resource thật trong DB |
| C-30 | Historical monetary snapshot không được tính lại từ catalog hiện tại |

---

# 9. DEFINITION OF DONE CHO DATABASE/BACKEND

Database/Backend chỉ được coi là hoàn thành khi tất cả điều kiện sau đạt:

```text
[ ] Baseline = 45 UC
[ ] ADM-17 removed
[ ] I-01 documented as Accepted Constraint
[ ] Holiday pricing removed

[ ] No-SQL Backend PASS
[ ] Backend tests 100% PASS
[ ] Database tests PASS

[ ] Room Delete Atomicity PASS
[ ] Room Delete vs Showtime Race PASS
[ ] Showtime Create/Create Race PASS
[ ] Showtime Create/Update Race PASS
[ ] Showtime Update/Update Race PASS

[ ] Booking Same Seat Concurrency PASS
[ ] Booking Overlapping Seat List PASS

[ ] Parent Status Rules PASS
[ ] Promotion Atomicity PASS
[ ] Promotion Last Quota Race PASS

[ ] Movie Actor Atomic Replacement PASS
[ ] Historical Price Preservation PASS
[ ] Showtime Historical Immutability PASS
[ ] Seat Historical Type Immutability PASS

[ ] Complaint Multi-row Trigger PASS

[ ] Admin Report Contract PASS
[ ] Admin Pricing Full Update PASS
[ ] Role-aware Profile PASS
[ ] Order Detail Read-only PASS

[ ] Dynamic Test DB rebuild PASS
[ ] Future Showtime data available
[ ] Orders available
[ ] Payment attempts available
[ ] Reviews available
[ ] Complaints available
[ ] Compensation available

[ ] Manager Scope PASS
[ ] Customer Ownership PASS
[ ] RBAC PASS
[ ] Rollback PASS
[ ] Payment Retry PASS

[ ] 45 UC regression completed
[ ] DB/Backend BROKEN = 0
[ ] Mandatory MISSING = 0
```

---

# 10. DEFINITION OF DONE CHO TOÀN HỆ THỐNG

Sau khi Database/Backend đạt DoD, Frontend phải đạt thêm:

```text
[ ] Admin complaint stale-response fixed
[ ] Support queue stale-response fixed
[ ] Booking state keyed by showtime
[ ] Complaint order lookup error visible
[ ] Loading/Error/Empty/Retry states đúng
[ ] 401/403/404/409/422/500 handled đúng
[ ] Browser E2E chạy được
[ ] Customer main flow PASS
[ ] Manager main flow PASS
[ ] CSKH main flow PASS
[ ] Admin main flow PASS
[ ] Final audit 45 UC completed
```

Không yêu cầu UI redesign để đạt DoD.

---

# 11. THỨ TỰ THỰC HIỆN BẮT BUỘC

```text
R0  Baseline
 ↓
R1  Transaction + Concurrency Safety
 ↓
R2  Booking Business Correctness
 ↓
R3  Data Integrity
 ↓
R4  Backend / DB Contract Hardening
 ↓
R5  Dynamic Dataset + Test Database
 ↓
R6  Database / Backend Integration
 ↓
R7  45 Use Case Regression
 ↓
R8  Frontend Stabilization
 ↓
R9  Cleanup + Documentation + Final Audit
```

Không nên triển khai theo kiểu:

```text
R1
→ redesign frontend
→ R2
→ thêm feature
→ R3
```

vì Backend contract sẽ thay đổi trong khi UI đang được sửa.

---

# 12. MỨC ƯU TIÊN

## P0 — Phải sửa trước

```text
I-02 Room Delete
I-03 Showtime Concurrency
```

Đây là các lỗi có thể phá invariant dữ liệu.

## P1 — Core correctness

```text
I-05 Remove Holiday
I-06 Parent Status
I-07 Promotion
I-08 Movie-Actor
I-09 Historical Integrity
I-12 Test Reproducibility
I-16 Complaint Trigger
```

## P2 — Hoàn thiện contract

```text
I-13 Admin Report
I-14 Admin Pricing
I-17 Preview Ownership
I-18 Auth Rate Limit
I-20 Profile
I-22 Read-only Order Detail
```

## P3 — Frontend stability

```text
I-11
I-15
I-19
I-21
```

## P4 — Cleanup

```text
I-23
I-24
I-25
I-26
```

---

# 13. KẾT LUẬN KIẾN TRÚC SAU ROADMAP

Sau roadmap, kiến trúc cuối cùng vẫn giữ:

```text
React.js
   ↓
REST API
   ↓
Node.js / Express
   ↓
Authentication / RBAC / Scope
   ↓
Controller
   ↓
Service
   ↓
Typed Procedure Client
   ↓
EXEC Stored Procedure
   ↓
SQL Server
```

Database tiếp tục chịu trách nhiệm:

```text
Pricing
Booking invariants
Seat concurrency
Showtime concurrency
Promotion
Payment state
Historical monetary values
Manager scope
RBAC business guard
Complaint processing
Reports
Transaction
Rollback
```

Backend chịu trách nhiệm:

```text
HTTP
JWT
Request validation
Identity binding
Typed parameter binding
Stored Procedure execution
DTO mapping
Domain error mapping
Rate limiting
```

Frontend chịu trách nhiệm:

```text
User interaction
Form state
Loading
Error
Retry
Navigation
Non-authoritative preview
```

Không layer nào được giành business truth khỏi Database.

---

# 14. TRẠNG THÁI MỤC TIÊU SAU KHI HOÀN THÀNH ROADMAP

Kết quả mong muốn:

```text
Database:
- Không còn known integrity defect nghiêm trọng.
- Transaction chính all-or-nothing.
- Showtime concurrency an toàn.
- Booking concurrency được chứng minh.
- Promotion atomic.
- Historical core data ổn định.

Backend:
- Không raw SQL.
- Test 100% reproducible.
- Contract rõ ràng.
- Error mapping đầy đủ.
- Authorization giữ nguyên.
- Main API flow đã integration test.

Data:
- Có dynamic seed.
- Có historical transaction.
- Có future transaction.
- Có đủ positive và negative fixture.

Use Case:
- 45 baseline.
- 0 MISSING.
- 0 BROKEN do Database/Backend.

Frontend:
- Không redesign bắt buộc.
- Các race/state lỗi được sửa.
- Hoàn thiện dựa trên Backend đã chốt.

Final:
- Có evidence rõ.
- Có regression rõ.
- Có thể bảo vệ đồ án bằng cả kiến trúc lẫn kết quả kiểm thử.
```

---

# 15. NGUYÊN TẮC QUAN TRỌNG NHẤT KHI TRIỂN KHAI

Không cố làm mọi thứ cùng lúc.

Mỗi phase phải tuân thủ:

```text
Analyze
→ Implement
→ Unit/DB Test
→ Integration Test
→ Evidence
→ Mark DONE
```

Một phase chưa có evidence thì chưa được xem là DONE.

Đặc biệt:

```text
R1 phải hoàn tất trước R2.
R2/R3 phải ổn trước R5-R6.
R6 phải hoàn tất trước khi đánh giá lại 45 UC.
Frontend chỉ được đẩy mạnh sau khi Backend/DB đạt milestone ổn định.
```

Mục tiêu không phải biến dự án thành hệ thống production hoàn chỉnh, mà là xây một hệ thống đặt vé xem phim có:

```text
Database đúng
Backend sạch
Luồng nghiệp vụ nhất quán
Transaction an toàn
Concurrency được kiểm chứng
Dữ liệu đủ để test
45 Use Case có evidence rõ ràng
```

Đây là phạm vi phù hợp nhất với một đồ án Hệ quản trị Cơ sở dữ liệu theo kiến trúc DBMS-first.
