# UXR-5 — Final report

Ngày 12/10/2026. **Đã triển khai UXR-5A → 5B → 5C → 5D; core acceptance PASS** trong phạm vi frontend và API/SP hiện có. Giữ nguyên backend, schema, procedure, REST contracts và RBAC cố định. Dữ liệu kiểm thử chỉ ghi qua nghiệp vụ hiện có trên DB cô lập, sau đó dọn fixture/khôi phục seed; fingerprint trước/sau bằng nhau. Dừng tại UXR-5, không thực hiện UXR-6.

## Kết quả từng work package

| Phần | Cải tiến thực tế | Nghiệm thu |
|---|---|---|
| **5A — Tài khoản / phân công** | List-first, STT, lọc có applied state, detail; tạo Manager/CSKH/Admin bằng role lookup read-only; chỉ đổi status, role bất biến. Manager/rạp bằng tên, phân công hiện tại, Manager cố định khi edit, preview và xác nhận chuyển một row, giữ multi-assignment | **PASS**: 15 browser/API checks, actual create/status/transfer/scope/multi-assignment, duplicate/dirty/keyboard và fixed-RBAC negatives |
| **5B — Phim / diễn viên / thể loại** | Poster và thông tin nghiệp vụ; tìm/lọc đầy đủ danh sách; picker tên thể loại và diễn viên/vai diễn; edit thông tin phim tách khỏi thay cast; tên/count/related movie links; hydration error chặn ghi, delete có xác nhận và lịch sử/quan hệ 409 | **PASS**: 21 browser/API checks, actual create/edit/cast/reload/delete; cast/genre giữ nguyên sau metadata edit |
| **5C — Sản phẩm / khuyến mãi** | Thumbnail, loại, VND, status, khoảng giá; promotion code/đơn vị giảm/điều kiện/period/quota rõ ràng; code/used count không sửa; precision tiền, giới hạn 99%, tổng lượt ≥ đã dùng; datetime-local Việt Nam; overlap filter đúng phạm vi | **PASS**: 16 browser/API checks + 5 API/SQL edge groups; actual booking quota và snapshot equality khi sửa giá/giảm; in-use delete 409 |
| **5D — Khiếu nại / báo cáo / Dashboard** | Admin queue/detail/history/scoped reference, quyền đọc/xử lý/tham chiếu tách riêng; draft theo case, status không mất note, append-only confirm. Report ngày/rạp inclusive, 6 server metrics, chart ngày/rạp và curated table ngày/phim/rạp. Dashboard 8 current/global metrics tách khỏi period report | **PASS**: 23 browser/API checks; actor/history/single-submit, Admin vs CSKH, query scope và KPI khớp API, zero/empty report |

Workspace dùng shared PageHeader/FilterBar/ResourceTable/ResourceSelect/Dialog/ConfirmDialog/AsyncState/StatusBadge và tokens trắng–xanh. URL chứa selection/page/filters an toàn; search, nội dung và password không đưa vào URL/browser storage mới. Draft trong bộ nhớ gắn actor và quyền, xóa khi rời layout/logout/đổi actor; write lock và read generations bảo vệ request ownership. Dialog identity chặn close event muộn khi mở lại nhanh.

## Source và routes

- `frontend/src/features/admin-resources/`: definitions/payload/validation/filter allowlists, adapters gọi client hiện có, controller đọc/ghi/draft và presentation cho bảy modules. Không tạo bảng bằng DTO keys hoặc mở hành động ngoài contract.
- `frontend/src/features/admin-service/`: Admin-specific complaint adapter/model/controller/view; reuse pure order-reference presentation, không sửa CSKH portal để giả lập Admin.
- `frontend/src/features/admin-analytics/`: report/Dashboard adapter/controller/model/view, named cinema filter và chart từ metric đã trả, không cộng lại tài chính làm truth.
- `frontend/src/features/admin-workspace/`, `frontend/src/layouts/AdminLayout.jsx`: persistent actor-scoped memory store; reuse navigation guard hiện hữu.
- `AdminSectionRoute.jsx`, `routes/index.jsx`: đưa 10 màn hình vào workspace mới dưới Admin layout, giữ đường dẫn và role/permission guards. `NamedResourceSelect.jsx` chỉ thêm optional readonly hint để Manager hiển thị đúng context; default Room behavior giữ nguyên.
- Hai tests mới: `adminResources.test.js`, `adminServiceAnalytics.test.js` (**28 tests**). Docs/evidence/scripts nằm tại thư mục UXR-5 này. Không overwrite source và evidence UXR-4 chưa commit.

Giữ canonical routes: `/admin/access/users`, `/admin/access/assignments`, `/admin/catalog/movies`, `/admin/catalog/actors`, `/admin/catalog/genres`, `/admin/commerce/products`, `/admin/commerce/promotions`, `/admin/service/complaints`, `/admin/reports/revenue`, `/admin/overview`. Operations/bookings/facility routes UXR-0–4 tiếp tục hoạt động.

## Kiểm thử và regression

- **207 frontend tests PASS**, **205 backend tests PASS**, lint PASS không warning, production build PASS. Build vẫn có warning chunk >500 kB (JS khoảng 765.95 kB, gzip 220.88 kB); đây là performance follow-up, không phải build failure.
- **146 browser checks PASS**, Chrome thật/CDP với API/SP/SQL thật; 5 nhóm API-only edge assertions riêng. Runtime exception và console error = 0 trong suite cuối. Sáu route UXR-4 được replay browser read tại 390/1440; full automated suite kiểm tra regression API/auth/rooms/seats/images/public/customer/support/operations/bookings hiện có.
- **10 screens × 5 widths** 390/768/1280/1440/1920 PASS; **50 before + 50 final after**, thêm 20 scenario screenshots đã chấp nhận. Before dùng snapshot working tree thật trước UXR-5 có UXR-4, không reset/checkout workspace.
- **Preservation PASS**: 145-file source baseline, chỉ ba file nền có thay đổi dự kiến; API/auth/shared/backend/database không có diff. Hash DB business/history/RBAC trước/sau suite bằng nhau, counts trở về users 8 / assignments 2 / movies 4 / actors 6 / genres 7 / products 5 / promotions 3 / complaints 1; không còn fixture.

Chi tiết lệnh, số checks, scope từng verdict và lỗi đã xử lý: [TEST_EVIDENCE.md](./TEST_EVIDENCE.md). Ảnh/link theo màn hình: [BROWSER_EVIDENCE.md](./BROWSER_EVIDENCE.md). [ACCEPTANCE_CHECKLIST.md](./ACCEPTANCE_CHECKLIST.md) và [API_UI_CAPABILITY_MATRIX.md](./API_UI_CAPABILITY_MATRIX.md) giữ phân loại rõ ràng.

## Capability gaps / phần chưa kiểm chứng

- User API chỉ hỗ trợ trạng thái sau tạo; assignment không có DELETE; actors/genres không có status; Admin complaint DTO không cung cấp sender email/phone và không có date/customer-ID filter/create-on-behalf/delete. UI dùng đúng các giới hạn này, không dựng thao tác giả.
- Dashboard endpoint không có date/cinema input. Chỉ số global/current giữ scope thật; period section gọi revenue riêng. Catalogues non-paged hiện được xác minh ở kích thước DB test; scale lớn cần server filtering/pagination workstream riêng.
- Giữ [UXR-4 gaps](../UXR-4/UXR-4_FINAL_REPORT.md): staff product/promotion edits, filters ngày/suất/payment, voluntary refund/manual paid/hard delete, capped lookups và các branch chưa live verified. Không xử lý chúng bằng thay đổi backend/DB trong UXR-5.
- **NOT VERIFIED live browser toàn bộ**: permission revocation trong pending write, mọi tổ hợp thiếu permission/401/race/network ở mọi screen. Những nhánh đã unit/API test chỉ nhận PASS theo đúng loại evidence, không thay thế browser verdict.
- **NOT VERIFIED**: Edge journey, axe/screen reader, touch device thật, production volume/performance và all-44-UC E2E. Không công bố toàn frontend restructuring đã hoàn tất hoặc 44/44 UC PASS.

## Tuân thủ Blueprint và chuyển giai đoạn

Core UXR-5 đáp ứng list-first, named relationships, applied filters, guarded forms, explicit async states, source-authoritative financial/history rules và responsive shared design system. Baseline [UC Matrix](../../USE_CASE_MATRIX_45.md) vẫn **44 active / 3 RETIRED / 47 ID**, không mở RBAC động hoặc ADM-17. UXR-5 đủ điều kiện tiếp tục UXR-6 trong frontend; các gaps/NOT VERIFIED được giữ để kiểm tra và integration acceptance UXR-7. **Phiên này dừng ở UXR-5.**
