# UXR-V3 / UXR-0 — Blockers and Decisions

Danh sách dưới đây phân biệt điều đã xác minh, giới hạn fixture/môi trường và quyết định cần owner duyệt. **Không có blocker nào được giải quyết bằng cách giả lập API/data.**

## 1. Decision log

| ID | Chủ đề | Trạng thái hiện tại | Điều đã biết / rủi ro | Hành động cần có trước |
|---|---|---|---|---|
| D-01 | Use Case baseline | **RESOLVED** | Matrix hiện hành có 44 active: Customer 14, Manager 10, CSKH 6, Admin 14; `ADM-03/04/05` retired, `ADM-17` ngoài scope; `QLR-10`, `ADM-18` active. Tên file chứa 45 chỉ là lịch sử. | Dùng 44 active cho traceability của các phase sau. |
| D-02 | Staff booking create/edit/cancel | **SOURCE/SP VERIFIED; E2E NOT VERIFIED trong UXR-0** | Có API/SP list/detail/create/edit seats/cancel. SP có validation Customer, Manager scope, showtime/seat/locking/price snapshot/payment/history. | UXR-4D phải replay trên DB test và xác minh DB postconditions; không coi source inventory là PASS. |
| D-03 | Phạm vi sửa vé staff | **APPROVED trước đó; áp dụng đúng scope hiện hữu** | Chỉ đổi ghế cùng suất khi đơn còn chờ thanh toán/còn hạn giữ, chưa có payment attempt/history, không promotion/food/used ticket. Ghế giữ nguyên giữ snapshot; ghế mới dùng giá hiện hành; ghế bị bỏ giữ lịch sử và chuyển `Đã hủy`. Paid/used chỉ xem; cancel dùng nghiệp vụ, không xóa vật lý. | Không mở rộng sửa sang suất/phim/đồ ăn/khuyến mãi hoặc refund. UXR-4D xác nhận các guard bằng test thực tế. |
| D-04 | “Xóa vé/đơn” | **RESOLVED** | API DELETE hiện hữu trả `405 HISTORY_PRESERVED`; flow là cancel khi đủ điều kiện, dữ liệu vé/giao dịch được giữ. | UI không bao giờ cung cấp physical delete. |
| D-05 | Filter cho mỗi screen | **PARTLY RESOLVED; gaps enumerated** | Matrix liệt kê query cụ thể theo route. Admin/Manager pricing thiếu type/day filter đã xác minh; Admin showtime movie/room chưa query-backed; nhiều lists không có paging/search. | Trước code, chọn contract có sẵn hoặc xin approval cho DBMS-first API/SP; chỉ client-filter nếu chứng minh response đầy đủ và bounded. |
| D-06 | Seat map geometry | **PARTLY RESOLVED** | Test DB có 240/240 ghế với row/number hợp lệ, không trùng; schema/query không cung cấp coordinate, aisle, walkway. | UI vẽ row/number từ dữ liệu thực; không tự tạo layout vật lý. Tọa độ chi tiết là thay đổi schema/API riêng cần duyệt. |
| D-07 | Manager multi-cinema context | **BLOCKED — thiếu fixture phù hợp** | Có 2 Manager ở 2 rạp; mỗi Manager trong fixture chỉ có 1 assignment. Không thể chứng minh chuyển context A→B của cùng Manager hoặc stale-result isolation qua hai scope hợp lệ. | Cung cấp Manager test có ≥2 assignment hiệu lực ở isolated DB, hoặc ghi nhận case không áp dụng nếu business rule/fixture xác nhận một rạp mỗi Manager. Không sửa scope để phù hợp UI. |
| D-08 | Availability vs physical seats | **RESOLVED BOUNDARY** | Physical Manager/Admin seat endpoints mô tả ghế phòng; showtime seat API mới có availability. | Tách chế độ sơ đồ ghế vật lý và sơ đồ theo suất. Không dùng physical seat status thay sold/held status. |
| D-09 | Order identifier in UI | **OPEN — cần owner xác nhận copy/lookup semantics** | Staff booking DTO hiển thị `DonDatVeID` thành “Mã đơn”; chưa xác minh đây là mã nghiệp vụ cho khách/nhân viên hay chỉ DB technical key. | Trước khi đổi thành “Mã đơn”, thêm public/business code hoặc thiết kế search theo mã, xác nhận label/search hiện tại đúng nghĩa; không tự phát minh mã mới. |
| D-10 | Showtime picker cap | **BLOCKED khi kết quả vượt 200** | `sp_StaffBooking_Options` trả tối đa 200 suất và `TotalMatches`; contract hiện không cho search/date/pagination options. Có thể chọn rạp để thu hẹp, nhưng vẫn không đầy đủ nếu `TotalMatches` > 200 sau filter. | UX phải báo giới hạn và không cho hiểu danh sách là toàn bộ. Nếu cần đủ lựa chọn, cần owner approval cho API/SP query/paging/filter và test concurrency. |
| D-11 | Browser external assets | **ENVIRONMENT BLOCKER** | Headless Edge environment từ chối `fonts.googleapis.com` và `images.unsplash.com` (`ERR_NETWORK_ACCESS_DENIED`); không thể phân biệt lỗi mạng môi trường với lỗi URL/host ở production. | Retest trên staging có network/fixture media trước khi phê duyệt đổi asset/CSP/font. Tiếp tục giữ fallback an toàn. |
| D-12 | Browser request final status | **OBSERVED, cần telemetry correlation** | Harness ghi 760 API/network request records: 378 status 200, 319 status 304, 63 không có final status được ghi; không có API status >=400 hoặc aborted response trong log, nhưng 63 request không đủ căn cứ nói tất cả đã thành công. | Nếu cần debug network, rerun với correlation/response lifecycle logging phù hợp trong môi trường test. Không suy đoán từ request thiếu status. |
| D-13 | Full five-width route coverage | **PARTLY VERIFIED** | Home và staff shells chụp ở 390/768/1280/1440/1920. Screen-specific images phần lớn ở 1440; không có mọi route ở đủ năm viewport. | Mỗi screen slice sau cần same fixture ở cả năm width; UXR-0 không phải acceptance responsive toàn hệ thống. |
| D-14 | 390px public overflow | **OBSERVED** | Home viewport 390 có `documentElement.scrollWidth=375` nhưng `bodyWidth=401`; DatabaseHealth card là nghi phạm cụ thể theo ảnh/layout, chưa được sửa hay xác minh bằng isolation. | UXR-1B remove panel rồi đo lại DOM/body/document width; không gọi finding này đã fix. |
| D-15 | CSKH draft/filter behavior | **V2 ISSUE OBSERVED; exact repair not run here** | Filter/case interaction có thể làm mất/ngắt draft và context; baseline mới đã thao tác với case fixture nhưng không replay các negative navigation permutations. | UXR-1A phải kiểm thử giữ draft, confirm bỏ, filter applied vs draft, deep link, case switch và stale response. |
| D-16 | A11y coverage | **NOT VERIFIED** | Browser baseline là smoke review; không chạy axe, screen reader, full keyboard audit hoặc WCAG contrast measurement. | Mỗi slice và UXR-7 phải làm keyboard/manual + automated accessibility checks. |
| D-17 | Test/lint/build | **NOT RUN trong UXR-0** | Không thay code; UXR-0 yêu cầu baseline/readiness, còn full scripts nằm trong UXR-7 acceptance. | Thực hiện đúng test/lint/build ở implementation/acceptance phases; ghi command và kết quả thực. |
| D-18 | Browser business writes | **NOT RUN by design** | Baseline duyệt screen/forms, chọn ghế local và fixture support có sẵn; không replay create/cancel/payment, không tạo fixture mới. | Ghi các nghiệp vụ là NOT VERIFIED cho đến khi E2E test DB postconditions được capture. |
| D-19 | Screenshot privacy | **MITIGATED in deliverables** | 15 PNG có tên/email/điện thoại/transaction-adjacent or account details được che trên evidence copy; original temporary copies are in ignored audit scratch, not linked in report. | Không đưa credential/token/real PII vào report; nếu screenshot chia sẻ ra ngoài repo cần review lại vùng redaction. |

## 2. Readiness blockers theo mức độ

### Cần có trước UXR-1

- Screen owner duyệt bắt đầu code sau UXR-0; UXR-1 chưa được ủy quyền bởi task này.
- CSKH cần fixture có thể kiểm tra draft/status/detail không làm thay đổi complaint history ngoài tác vụ dự kiến.
- Network-permitted browser environment cho media/font decision; không cần để bắt đầu layout fallback, nhưng cần trước khi kết luận asset defect.
- Manager named-selector lookup phải chứng minh đủ dữ liệu và đúng scope từ API đã có.

### Cần có trước UXR-3/4

- Manager test identity có 2 assigned cinemas nếu multi-context switching thuộc deployed behavior; nếu không, owner xác nhận single-cinema context là expected.
- Staff showtime selection có fixture lọc tới ≤200, hoặc approval/spec cho query pagination/filter để chọn mọi suất hợp lệ.
- Quyết định label/business semantics của order identifier.
- Nếu yêu cầu lọc type/day trên pricing hay movie/room trên Admin showtimes, approval DBMS-first cho contract additions hoặc giới hạn screen spec đúng với API hiện có.
- Seat-map acceptance chỉ theo row/number; yêu cầu aisle/coordinates cần quyết định/data riêng.

### Cần có trước UXR-7

- Fixture matrix bao phủ positive/negative cases cho 44 active UC; test accounts an toàn và được xác minh, không chứa credential trong báo cáo.
- Automated/manual accessibility method và người review screenshot diff.
- Có thể quan sát response completion (hoặc giải thích 63 request không status) cho những route acceptance cần network proof.

## 3. Những điều không được xử lý bằng suy đoán

1. Không thêm endpoint/SP/filter/field, role, permission hoặc UC để làm UI thuận tiện.
2. Không coi selector được đổ bằng list cắt cụt 200 phần tử là đầy đủ.
3. Không đổi `DonDatVeID` thành mã khác hoặc tạo public order code giả.
4. Không suy trạng thái available/sold/held từ ghế vật lý; status phải từ API theo suất chiếu.
5. Không coi request chưa ghi final status là success, hay asset bị network policy chặn là lỗi app đã tái hiện.
6. Không coi route opened/screenshot hoặc 0 HTTP error là E2E PASS.
7. Không kế thừa verdict UC lịch sử từ báo cáo R8/V2 làm acceptance của UI mới.

## 4. Quyết định đóng UXR-0

- Baseline 44 UC và fixed RBAC được xác minh; không có xung đột baseline âm thầm.
- DB/browser test environment có sẵn và được dùng an toàn; không gọi main/production DB.
- Các thiếu hụt phục vụ phase sau được ghi cụ thể và có điều kiện xử lý.
- UXR-0 có thể đóng với trạng thái **PASS — baseline/readiness only, caveats retained**.
- Chỉ bắt đầu UXR-1 sau approval riêng; mọi D-ID trạng thái BLOCKED/OPEN vẫn phải được giải quyết trước slice phụ thuộc.

