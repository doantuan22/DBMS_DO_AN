# UXR-V3 — UXR-1D final browser acceptance

Ngày kiểm thử: 2026-10-11

## Kết luận

- **Browser preflight: PASS.**
- **Browser E2E các luồng selector, ghế, suất chiếu và Manager scope: PASS.**
- **Responsive 390/768/1280/1440/1920px: PASS**, không tràn ngang.
- **Test/lint/build: PASS** theo kết quả bên dưới.
- **UXR-1D Exit Gate: PASS.** Nghiệp vụ nhiều rạp đã được xác minh từ source, API, SP và constraint đang chạy. Fixture hai phân công đồng thời được tạo hợp lệ qua API hiện có trên DB test; Cancel/Confirm, A→B→A, late responses và authorization đều đã được kiểm thử browser thật. Phân công thử đã được hủy qua API và scope gốc được khôi phục.

Không có source Frontend/Backend/Database/API nào được sửa trong lượt nghiệm thu này. Không bắt đầu UXR-2.

## Môi trường và preflight

Dùng Chrome 155 trên host Windows trực tiếp, với profile kiểm thử riêng và CDP tại cổng riêng. Không dùng lại các cấu hình GPU/CDP đã lỗi trong môi trường ảo hóa; không dừng hoặc sửa browser/profile của người dùng. Playwright chưa có sẵn, nên dùng CDP automation tương đương mà không cài dependency.

Preflight trên trang kiểm thử đơn giản đã xác nhận:

1. Trang tải và renderer chạy JavaScript.
2. Có thể nhập vào input và nhấn button.
3. Nội dung sau tương tác được kiểm tra đúng.
4. Chụp được ảnh renderer thật ở 1280px.

Ảnh preflight: [browser-preflight-1280.png](screenshots/browser-preflight-1280.png). Kịch bản: [host-preflight.mjs](browser-startup-logs/host-preflight.mjs).

Frontend, Backend API và database kiểm thử cô lập đều hoạt động. Target DB được xác minh riêng biệt với DB chính, online và có thể ghi; tên DB và thông tin đăng nhập không ghi vào báo cáo.

## Kết quả E2E trên UI thật

| Scenario | Kết quả | Bằng chứng |
|---|---|---|
| Manager đăng nhập qua UI | **PASS** | Phiên browser thật gọi API xác thực. |
| Tải danh sách phim và phòng được phân công | **PASS** | Lookup thật có 4 phim, 3 phòng trong một rạp được phân công. |
| Tìm phim/phòng theo tên và chọn bằng bàn phím | **PASS** | Tên hiển thị khớp option đã chọn. |
| Gửi đúng movieId/roomId từ option đã chọn | **PASS** | Tạo suất chiếu qua UI trả HTTP 201; ID gửi là số và khớp option thật. |
| Tải ghế theo phòng; request phòng cũ trả về muộn | **PASS** | Hai request API thật được đảo thứ tự hoàn tất; kết quả cũ không ghi đè phòng đang chọn. |
| Tạo, sửa, hủy suất chiếu qua UI | **PASS** | Thao tác thật trên DB kiểm thử; hủy bằng nghiệp vụ hiện có, không xóa vật lý. |
| Form sửa hiển thị phòng hiện tại và không gửi roomId | **PASS** | Phòng hiện tại hiện bằng tên ở trạng thái chỉ đọc; request PUT không có roomId. |
| Manager truy cập rạp ngoài scope | **PASS** | API thật từ browser trả **403**. |
| Search, validation bắt buộc, no-match empty state | **PASS** | Không có kết quả khi tìm chuỗi không khớp; form chặn submit trước khi chọn tài nguyên. |
| Loading, error, retry | **PASS** | Một GET phim bị làm thất bại có chủ đích trong browser; UI hiện lỗi, retry gọi API thật và tải lại thành công. |
| Danh mục API trả danh sách rỗng | **NOT VERIFIED** | Fixture thật không rỗng; không chèn dữ liệu giả. |
| Form bẩn, đổi rạp, Cancel/Confirm | **PASS** | Fixture hai assignment hợp lệ qua API: Cancel giữ dữ liệu; Confirm chuyển scope và reset dữ liệu phụ thuộc. |
| Chuyển rạp A→B→A | **PASS** | Phòng, ghế và suất chiếu chỉ thuộc rạp hiện hành; có delayed-response assertions. |

E2E được lưu tại [browser-e2e-results.json](browser-e2e-results.json); script tái chạy là [manager-acceptance-cdp.mjs](browser-startup-logs/manager-acceptance-cdp.mjs). Kịch bản đọc credential từ environment, không lưu credential/token vào evidence.

JSON trên là snapshot lượt browser acceptance trước, khi fixture chỉ có một rạp. Trạng thái NOT VERIFIED của scope switching trong snapshot được thay thế bằng bằng chứng thực chạy tại [browser-scope-exit-gate-results.json](browser-scope-exit-gate-results.json); không sửa kết quả lịch sử thành PASS.

Tạo suất kiểm thử, sửa, rồi hủy bằng endpoint nghiệp vụ đã được thực hiện trong DB kiểm thử cô lập. Dữ liệu lịch sử được giữ theo luồng hủy hiện hành.

## Responsive và ảnh trước/sau

Năm viewport sau thay đổi đều có document width không vượt viewport width:

| Viewport | Ảnh sau |
|---:|---|
| 390px | [Manager 390](screenshots/manager-390-after.png) |
| 768px | [Manager 768](screenshots/manager-768-after.png) |
| 1280px | [Manager 1280](screenshots/manager-1280-after.png) |
| 1440px | [Manager 1440](screenshots/manager-1440-after.png) |
| 1920px | [Manager 1920](screenshots/manager-1920-after.png) |

Ảnh tập trung vào form suất chiếu sau thay đổi: [390px](screenshots/manager-showtimes-390-after.png), [1280px](screenshots/manager-showtimes-1280-after.png). So sánh với baseline UXR-0: [form suất chiếu trước thay đổi](../UXR-0/screenshots/manager-manager-showtimes-1791719031304.png). Baseline dùng ô Movie ID và mã phòng; ảnh mới dùng tìm kiếm và selector theo tên, xếp dọc ở mobile và hai cột trên desktop. Các ảnh 390/768/1280/1440/1920 và phép đo overflow nằm trong [browser-responsive-evidence.json](browser-responsive-evidence.json).

Console error: **0**. Runtime exception: **0**. API 5xx: **0**. Lỗi GET được tiêm để kiểm tra UI là request bị chặn có chủ đích trong browser, không phải response 5xx từ Backend.

## Chất lượng build

- Frontend tests: **77/77 PASS**.
- Lint: **PASS** (oxlint).
- Production build: **PASS**, output cô lập tại .audit-output/uxr1d-final-browser-acceptance-build-20261011; không đụng frontend/dist.
- Build phát cảnh báo bundle JavaScript khoảng 588 kB, lớn hơn ngưỡng cảnh báo 500 kB.
- Build mặc định trước đó gặp **EPERM** khi Vite dọn frontend/dist/assets. Không thử xóa/ghi đè thư mục đang bị khóa; lượt này xác minh production build thành công bằng outDir riêng.
- Không phát hiện lỗi chức năng UXR-1D cần sửa trong lượt browser acceptance.

## Manager Assignment — quy tắc đã xác minh

**Áp dụng trường hợp B: một Manager được phân công đồng thời nhiều rạp.** Kết luận này dựa trên contract và thao tác API thật, không suy từ số assignment ban đầu của tài khoản test.

| Câu hỏi | Quy tắc thực tế | Bằng chứng |
|---|---|---|
| Có nhiều rạp đồng thời không? | Có. Chỉ chặn bản ghi trùng hoàn toàn; không áp dụng giới hạn một rạp hoặc quy tắc cấm mọi khoảng thời gian chồng lắp. | [sp_Admin_Assignment_Create](../../../database/08_procedures/admin/sp_Admin_Assignment_Create.sql), dòng 40–47; POST đã tạo assignment thứ hai trong cùng khoảng hiệu lực, GET Manager trả cả hai. |
| Phân công mới thêm hay chuyển? | POST thêm một dòng Hiệu lực, không kết thúc các phân công trước. | POST /api/admin/assignments → INSERT trong SP create. Assignment gốc vẫn có hiệu lực sau khi tạo fixture. |
| Chuyển phân công Admin thực hiện thế nào? | PUT cập nhật dòng được chỉ định bởi PhanCongID, có thể đổi RapID của dòng đó; không tự hủy/thay toàn bộ phân công khác của Manager. | [usp_Admin_Assignment_Update](../../../database/08_procedures/admin/usp_Admin_Assignment_Update.sql), dòng 34–41; [adminService](../../../backend/src/services/adminService.js), createAssignment/updateAssignment. |
| Ràng buộc DB có giới hạn một rạp không? | Không. Unique index chỉ trên PhanCongID; hai index tra cứu Manager/rạp không unique. Có FK tới tài khoản/rạp, CHECK khoảng ngày và trạng thái; không có trigger phân công. | Metadata thật trong [assignment-contract-evidence.json](assignment-contract-evidence.json), đối chiếu [constraints](../../../database/03_constraints/001_primary_unique.sql) và [indexes](../../../database/04_indexes/phancong_rap.sql). |
| Scope được tính thế nào? | Actor phải còn hoạt động, đúng role; assignment có trạng thái Hiệu lực và ngày kinh doanh nằm trong khoảng ngày bắt đầu/kết thúc. | [fn_KiemTraQuanLyRapScope](../../../database/05_functions/fn_KiemTraQuanLyRapScope.sql); [sp_Manager_ListAssignedCinemas](../../../database/08_procedures/manager/sp_Manager_ListAssignedCinemas.sql) trả mọi assignment còn hiệu lực. |
| Manager tự chọn context giữa các rạp không? | Có. Selector Rạp hiện tại dùng danh sách được API cấp quyền; đổi context là state UI, không cập nhật assignment. Workspace remount theo scopeKey; API/SP kiểm tra quyền độc lập. | [ManagerPortal](../../../frontend/src/pages/ManagerPortal.jsx), dòng 53–106; GET /api/manager/cinemas và các GET theo cinemaId. |
| Traceability | ADM-06 phân công quản lý; QLR-01 đăng nhập/rạp phân công, QLR-02/03/04 phòng/ghế/suất. Baseline giữ 44 UC hoạt động. | [Use Case Matrix](../../USE_CASE_MATRIX_45.md), quyết định hiện hành giữ khả năng nhiều phân công; Master Blueprint §6.1 và D-07 yêu cầu xác minh contract. |

Năm SP/function deployed trên DB test đều khớp source sau khi chuẩn hóa token SQL. Không thay schema, SP, RBAC hoặc API. D-07 được giải quyết cho phạm vi UXR-1D; trạng thái thiếu fixture trong UXR-0 là snapshot lịch sử.

## Final Exit Gate resolution — browser scope test

Browser Chrome 155 trên host Windows với profile riêng vượt preflight. Dùng Frontend/Backend thật và DB test đã xác minh cô lập; tạo assignment thứ hai bằng POST Admin, không INSERT thủ công. GET Manager xác nhận hai rạp hiệu lực đồng thời và assignment gốc còn hiệu lực.

| Testcase mới | Kết quả | Assertion thực tế |
|---|---|---|
| Form phòng và suất có thay đổi → chọn rạp B → Cancel | **PASS** | Native confirm xuất hiện khi đổi selector bằng keyboard; rạp A, draft, room options, ghế và suất đang hiển thị giữ nguyên. |
| Cùng draft → chọn B → Confirm | **PASS** | Scope B được tải; form phòng/phim/phòng suất/giá và lựa chọn ghế reset; room options và showtime list khớp API thật của B. |
| A→B→A | **PASS** | Danh sách phòng/suất khớp đúng API scope; dữ liệu ghế cũ bị clear và chỉ tải ghế của phòng thuộc rạp hiện hành; không phát sinh confirm khi form sạch. |
| Response ghế của rạp A đến muộn sau khi chuyển B | **PASS** | Giữ response API thật ở browser rồi tải ghế B; thả response A không thay snapshot B. |
| Response rooms/showtimes/pricing/dashboard của A đến muộn | **PASS** | Giữ 8 response thật; chuyển lại B, tải ghế B rồi thả response A; snapshot scope B không đổi. |
| Quyền sau đổi context | **PASS** | Hai rạp được phân công trả 200; rạp thật chưa được phân công trả 403. |
| Dọn fixture qua nghiệp vụ | **PASS** | PUT assignment thử thành Đã hủy; lịch sử được giữ, danh sách Manager về assignment gốc, API rạp thử trả 403 bằng cùng token. |
| Browser console/runtime | **PASS** | 0 console error, 0 runtime exception, 0 API 5xx; quan sát hai confirm tương ứng Cancel và Confirm. |
| Nhánh A — nghiệp vụ chỉ một rạp mỗi Manager | **N/A** | Hệ thống thực tế hỗ trợ nhiều rạp; các testcase multi-cinema bên trên đã chạy. |

Artifacts: [API fixture/cleanup](assignment-fixture-api-results.json), [browser assertions/network](browser-scope-exit-gate-results.json), [preflight](exit-gate-browser-preflight.json). Ảnh thật: [Cancel giữ draft](screenshots/manager-scope-cancel-1280.png), [Confirm chuyển B](screenshots/manager-scope-confirm-1280.png), [B sau khi thả response A](screenshots/manager-scope-race-1280.png).

Không chạy lại browser CRUD/selector/responsive hoặc frontend test/lint/build đã PASS, vì source ứng dụng không đổi. Các script nghiệm thu mới được kiểm tra cú pháp bằng node --check. Một lỗi tên field token trong harness được sửa trước khi tạo fixture; đây không phải lỗi ứng dụng. Bộ kiểm tra focused cuối cùng và fixture cleanup đều exit 0.

Để tái chạy trên host Windows: cung cấp UXR1D_TEST_DATABASE (DB test có sẵn), UXR1D_ADMIN_EMAIL/PASSWORD và UXR1D_MANAGER_EMAIL/PASSWORD qua environment; chạy node docs/UXR-V3/UXR-1D/browser-startup-logs/run-manager-scope-acceptance.mjs tại root repo. Runner tự kiểm tra DB/module/port, preflight, tạo fixture hợp lệ, chạy phần scope và hủy riêng assignment thử. Yêu cầu Chrome, dependencies hiện có và Manager ban đầu có một assignment; cần rạp thứ hai có phòng cùng một rạp khác để kiểm tra 403. Credentials/DB identifier không lưu trong artifacts.

## Exit Gate cuối cùng và phần ngoài slice

**UXR-1D: PASS.** Không còn blocker thuộc phạm vi named resource selectors và scope-switch dirty guard. Các kết quả NOT VERIFIED trước đó cho Cancel/Confirm và A→B→A đã được thay thế bằng browser evidence thật ở trên.

- Danh mục API hoàn toàn rỗng vẫn **NOT VERIFIED** do thiếu fixture, đã có component empty-state và browser no-match checks; đây là giới hạn coverage được giữ, không phải blocker scope còn lại.
- EPERM của build output mặc định và cảnh báo bundle 588 kB vẫn giữ như phần build; isolated production build trước đó PASS. Việc xử lý output lock/chunking thuộc công việc riêng.
- UXR-5A/UXR-7 cần kiểm thử rộng hơn Admin sửa thời hạn/chuyển assignment trong khi Manager đang thao tác. SP hiện cho phép các khoảng phân công chồng lắp và list trả từng assignment; việc trình bày nhiều bản ghi cùng một rạp cần tuân thủ contract này, không tự đặt thêm quy tắc một rạp.
- UXR-3/4 còn các phần sơ đồ ghế và workspace vận hành theo roadmap; không thuộc lượt nghiệm thu này.

Dừng tại UXR-1D để chờ nghiệm thu. Không khởi động UXR-2.
