# Cinema Booking — UI/UX MASTER ROADMAP after R8

## 1. Executive Summary

**SOURCE OF TRUTH: docs/UIUX_MASTER_ROADMAP.md.** Bản này chứa đủ phase/task/coverage/gates để AI coding khác tiếp quản. Detailed files chỉ là extract của cùng plan revision, không phải roadmap cạnh tranh. Nếu mâu thuẫn, sửa cả master và extract trước tiếp tục implementation.

Planning revision: UIUX-MASTER-20261005-v1. Baseline audit at 2026-10-05T10:06:23.606Z; planning checked 2026-10-05T11:59:30.651Z. HEAD hiện tại 10de2014f2c11d4e32d239493fd30e7774269817; R8 candidate recorded 893f81da813eb9ddee5ac3bb32d8ed4d9b7cb31f. HEAD khác R8 commit không tự có nghĩa source thay đổi: 388 production-source hashes khớp audit (0 stale).

Task này chỉ tạo tài liệu; **không bắt đầu UIUX-01**, không application source changes, không DBconnect/reset/write. READY nghĩa đủ kế hoạch để nhận task implementation tiếp theo, không chứng nhận UI mới đã triển khai. Trước mỗi phase, đọc lại source và compare current contract vì roadmap không thay thế code hiện tại.

Handoff protocol: đọc master §4–5 invariants, §13 levels, phase riêng ở§15, relevant screen/component rows§18–19, owner/continuation§16, tests§29. Snapshot candidate + immutable audit/R8 evidence trước sửa; chỉ implement phase đã được giao, reuse completed primitives, không làm phase sau sớm; hoàn thành đúng task acceptance/DONE rồi ghi evidence và report source diff/tests/limitations. Những UI-state changes được phép chỉ là presentation intent/busy/focus trackers bổ sung; không đổi existing controlled values/event signatures/business transitions. Nếu task cần API/DB/grant/framework mới thì giữ fallback trong plan và tách yêu cầu ngoài phạm vi; không tự mở rộng.

22 findings được map (P0=0/P1=1/P2=17/P3=4),20 routes/44 distinct views,18 Admin sections,41 component/pattern/helper items,9 phases. Không redesign hoặc đổi identity/functional baseline. Highest aggregate risk UIUX-07; first implementation UIUX-01.

## 2. Current UI/UX Baseline

Baseline functional [R8 STATUS](../audit/final/r8/STATUS.json): RELEASE READY,45/45 UC,112 backend tests/40 frontend tests/56 production browser checks;27 tables/125 SP/6 views/21 functions/7 triggers. Current UI audit:20 route screens,44 views,264 readings,88 screenshots 390/1440,44 AX snapshots;17 reusable component files/21 exports,25 shared including layout/guards/provider;0 captured runtime exceptions. Planning không rerun functional tests hoặc tạo fixture.

Đã đọc 16 audit inventory/report files và toàn bộ evidence files, view 88 PNGs và current frontend source. [Evidence review manifest](uiux/UIUX_EVIDENCE_REVIEW.json) ghi file/hashes/PNG dimensions/parser checks, [validation](uiux/UIUX_PLANNING_VALIDATION.json) ghi staleness/coverage/preservation. View_image có resize ảnh fullpage dài (Admin seats), nên DOM/AX metrics dùng để kiểm details/density thay vì giả là mọi chữ pixel đều đọc rõ. External seed media tải chưa xong ở một số frame; không thay poster/seed để làm đẹp.

Nguồn đã tổng hợp:

- [UIUX_FRONTEND_AUDIT.md](../audit/uiux/UIUX_FRONTEND_AUDIT.md)
- [FRONTEND_INVENTORY.md](../audit/uiux/FRONTEND_INVENTORY.md)
- [FRONTEND_INVENTORY.json](../audit/uiux/FRONTEND_INVENTORY.json)
- [SCREEN_INVENTORY.md](../audit/uiux/SCREEN_INVENTORY.md)
- [SCREEN_INVENTORY.json](../audit/uiux/SCREEN_INVENTORY.json)
- [DESIGN_SYSTEM_AUDIT.md](../audit/uiux/DESIGN_SYSTEM_AUDIT.md)
- [UX_FLOW_AUDIT.md](../audit/uiux/UX_FLOW_AUDIT.md)
- [FORM_AUDIT.md](../audit/uiux/FORM_AUDIT.md)
- [RESPONSIVE_AUDIT.md](../audit/uiux/RESPONSIVE_AUDIT.md)
- [RESPONSIVE_AUDIT.json](../audit/uiux/RESPONSIVE_AUDIT.json)
- [ACCESSIBILITY_AUDIT.md](../audit/uiux/ACCESSIBILITY_AUDIT.md)
- [COMPONENT_AUDIT.md](../audit/uiux/COMPONENT_AUDIT.md)
- [UIUX_FINDINGS.md](../audit/uiux/UIUX_FINDINGS.md)
- [UIUX_FINDINGS.json](../audit/uiux/UIUX_FINDINGS.json)
- [UIUX_ROADMAP_DRAFT.md](../audit/uiux/UIUX_ROADMAP_DRAFT.md)
- [STATUS.json](../audit/uiux/STATUS.json)

Evidence browser/style/AX/screenshots/fixture-context/reset/cleanup/integrity/harness-debug đều được đọc. Debug selector encoding là tooling issue đã sửa trước final audit, không tạo finding ứng dụng mới. Known limits: CSS viewport desktop Chrome height  900, không real phone/Safari/full screen-reader/zoom/high-volume usability certification; những test thiếu được quy hoạch 08/09. Existing worktree có thay đổi trước task (gồm xóa historical docs/audit-full evidence); không restore/delete/chỉnh chúng và không dùng chúng làm proof mới.

## 3. Frontend Architecture Summary

Resolved local lock: React/react-dom 19.3.0, react-router-dom 7.18.4, Vite 8.3.1, Temporal 0.5.1; package ranges không thay thế resolved versions. BrowserRouter/Routes + AreaLayout + RequireAuth/RequireRole; local React state/useEffect/useRef + AuthProvider/AuthContext; thin fetch REST with existing session/auth expiration handling. One global frontend/src/index.css; no CSS modules/UI framework/icon library/Redux/custom modal. Native window.confirm already Admin. Reuse adminForms/managerForms/dateTime/shared resource contract; no component extraction chỉ vì file dài.25 shared identity specified§19. Backend SP-only/DBMS-first architecture retained.

## 4. Visual Identity Invariants

| Visual language | Current baseline / KEEP | Incremental treatment |
| --- | --- | --- |
| Color | primary #273e82; hero #182b62→#3f63ad; page #f5f6fa; surfaces #fff; text #171923; muted #667085; danger #a42b2b/#8d2525; success #17653a | 01 dùng dark existing cho light eyebrow;02 token aliases; không đổi brand palette |
| Typography | Inter,system-ui,sans-serif; body16px/normal; hero clamp 2–3.4rem, detail 2–3.2rem; cards1.1rem; table.92rem; eyebrow.75rem/800 | 02 semantic type aliases;08 nhịp label/helper/body và localized labels; font fallback vẫn hợp lệ |
| Spacing | Page1rem; section2rem; auth1.5rem; booking2rem; grid1rem; actions.5rem; field helper.35/.4rem | Normalize repeated spacing 02; grouping 03/05–07;08 long-text/mobile validation |
| Surfaces/cards | White border1px; auth/system .75rem radius; cards .8rem; hero1rem; no shadow system | KEEP hero/catalog/gallery/auth-card; NORMALIZE missing catalog-card only; không card hóa tất cả |
| Shadows/radius | Flat/no authored shadow; radius .35–1rem | Token --shadow-surface:none nếu cần repeated consumer; không thêm elevation/decorative gradients |
| Controls/forms | Catalog/auth primary/secondary styles; portal native mismatch; four missing class rules | 02 native primitives/error/help/unit; existing validation/date/body serializers KEEP |
| Tables | Native table + horizontal wrapper; image headers explicit; Admin raw keys 11/16 cols | 02 pattern semantics;07 human descriptors/core identity+action/detail; horizontal scroll vẫn chấp nhận |
| Status/feedback | Existing status/alert; red/green text; Manager/auth/payment busy; Support notice loss/Admin pending missing | Text+color badges 02; notice/pending 06/07; no global state store |
| Navigation | AreaLayout actor-filtered links; Admin 18 sameweightbuttons; Manager all sections; local active selection | 03 same routes grouped tasks/current context; 05–07 adoption no forbidden reads |
| Responsive | auto-fit/minmax/min/clamp/flex-wrap; two 680 pxmedia; tested 360–1440 | Actual 003 fix 04; logicalSeatMap 04; dense-data 07;08 full width QA; no new visual style |

## 5. Functional Invariants

| Invariant | Binding contract | Evidence / regression |
| --- | --- | --- |
| 45 Use Cases | 45/45 functional UC remain PASS; no new business flow in this roadmap | audit/final/r8/UC_TRACEABILITY_FINAL.json/md; candidate rerun 09 |
| Routes/IDs/handlers/state | All 20 paths incl * remain; DTO IDs, event signatures, controlled values, payload shapes and business state transitions unchanged | routes/index.jsx + api clients + existing test contracts; additive UI-only busy/focus/confirmation accepted |
| Authority | Price, promotion, availability, payment and final totals stay Backend/SP authoritative; no frontend recomputation to override server | R2 booking/hold/payment/promo conflict paths; no raw SQL Backend |
| R1 datetime | UTC instants, Vietnam display/business-local input conversion, DATE_ONLY no timezone shift; HoldDeadline unchanged | Temporal/dateTime/adminForms/managerForms tests; R1 timezone integrations |
| R2/R2-FIX | 1000 VND=1 point; proportional ticket/food promotion allocation; no refund; live hold blocks show cancel; no double-credit; unique DonDatVeID 3 NF compensation snapshot; historical payment rows unchanged | Existing DB/SP behavior and R2/R2-FIX tests; UI never computes official points/changes cancellation eligibility |
| R3 RBAC | Exact role AND permission; ownership; Manager current assignments/resource scope; partial grants; no ADMIN bypass | authorization.js, RequireAuth/Role, APIrequest negative logs and R3 permission matrix |
| R4/R5/R7 forms | IDs immutable; descriptor create/edit distinctions; nullable/[]/0; status hydration; R5 validation and error.code/status preserved | adminForms/managerForms/shared/resourceContract and integration tests |
| R6 history | Append-only decisions/snapshots/audit/history remain as accepted; no deleting old rows to simplify UI | R6 audit and R8 preservation hashes; no data migration in UI scope |
| R8 architecture | React 19.3/Router 7.18/Vite 8.3/Temporal/local state/AuthContext/thin REST; Backend SP-only;27 tables baseline | No framework/icon/store/modal system or DB/API changes for aesthetics |

## 6. Main Findings

Root categories dùng 15 required groups: Safety, Accessibility, Design System, Navigation / IA, Forms, Dense Data UI, Customer Journey, Manager UX, CSKH UX, Admin UX, Responsive, Feedback, Component Architecture, CSS Architecture, Polish; thêmInteraction là tag liên quan. Đây làroot cause mapping, không coi mỗi finding một redesign. Primary phase làcoordinator; continuation phải chứng minh adoption trước global closure 09.

P1 intent confirmation, missing form styles, intrinsic filter overflow, light contrast, raw dense tables, task/context/draft navigation, lookup/CSV/JSON friction, flat SeatMap, return intent, recovery/complaint entry, notice/pending, semantics/errors vànormalization/polish. UIUX-014 FUNCTIONAL-RISK source-based, chưa reproduced DB/APIbug; 010/018 HIGH-CONFIDENCE cần behavioral evidence. Horizontal table scroll operable làdensity gap, không pageBROKEN; native focusvisible và 0 unlabelledinputs được KEEP.

## 7. P0/P1/P2/P3 Summary

| Severity | Count | Meaning / sequencing |
| --- | --- | --- |
| P0 | 0 | Không finding audit P0 |
| P1 | 1 | UIUX-002 Manager destructive confirmation → phase 01 first |
| P2 | 17 | 001,003–018; nhóm root causes, nhiều continuation, không 17 independent redesign tasks |
| P3 | 4 | 019–022; normalization 02 trước polish 08, cùng baseline visual identity |

## 8. KEEP

Current navy/blue/hero/cards/gallery/auth-card; native semantic controls/focus và Admin confirms; route/action guards/AuthContext; Manager assignments/scopeKey/generation/section loaders/busy; adminForms/managerForms/dateTime/shared enums; HoldDeadline; CatalogStates; owned orders/detail/payment history vàfull Support order-reference API/DTO. Không replace host portal hoặc booking architecture. KEEP có thể nhận primitive presentation adoption mà không đổi contracts.

## 9. REFINE

Manager/Admin/CSKH task navigation/current context; destructive confirmation 01; notices/pending 06/07; account/fallback recovery vàcomplaint discoverability 03; safe return 04; technical copy/payment labels 04; row identity/actions/disclosure 07; focus/edit/discard 03→05–07; viewport controls 04/08. Những cải tiến này bọc presentation quanh existing state/actions, không thay policy.

## 10. NORMALIZE

Repeated values→tokens 02; native Button/FormField/Input/Select/TextArea; StatusBadge/Feedback/SectionHeader/SurfaceCard/Tablepatterns; field helper/error/focus 01/02; spacing/type/formatter/states 02→adoption 04–07→polish 08. Không UI framework/custom modal/generic data-grid platform, không tokenize mọi one-off selector.

## 11. REPLACE

Chỉ 2 interaction items: SeatMap renderer (04-T2,LEVEL 4) vớiactualrow/number, stableIDs/onToggle/aria/disabled/selection/limit/payload; Cast editor candidate (07-T3,LEVEL 4) structuredactorId+role, same current castJSON/API/validation, raw fallback khi unresolved. Không replace AdminPortal/ManagerPortal/SupportPortal/booking architecture. Không invent aisles/screen geometry hoặc new Backend cast API.

## 12. Upgrade Principles

Incremental, evidence-first, contract preserving. Safety 01→foundation 02→IA 03 trước screen adoption. Mỗi shared primitive native/thin, không che authorization hoặc data fetching. Không đổi business rule để UIpass; Backend/DB/audit/R8 immutable trong UI scope. Có targeted meaningful tests cho behavioral risks (confirm/seat/cast/pending/return/grants), không test máy móc mirror mọi spacing class. Performance/layout improvements không tự authorize pagination/virtualization/server changes.

## 13. Change Level Rules

| Level | Permitted change | Tasks |
| --- | --- | --- |
| LEVEL 1 | Copy/spacing/type/visual/verification polish | 01-T2/T 5;04-T4;08-T1/T 3;09-T1/T 2/T 3 |
| LEVEL 2 | Native primitive/shared styles/formatter/semantics | 01-T3/T 4;02-T1–T 5;06-T3;07-T4 |
| LEVEL 3 | Task grouping/context/forms/tables/navigation/scoped feedback | 01-T1;03-T1–T 4;04-T1/T 3/T 5;05-T1–T 4;06-T1/T 2/T 4;07-T1/T 2/T 5;08-T2 |
| LEVEL 4 | Narrow interaction renderer/editor replacement | 04-T 2 SeatMap;07-T 3 Cast only |
| LEVEL 5 | Architecture redesign — FORBIDDEN, not scheduled | 0 tasks; no framework/store/router/business-flow/portal rewrites |

## 14. Master Phase Overview

| Phase | Objective | Primary findings (coordinator) | Adoption/continuation | Complexity / reason | Risk | Depends on |
| --- | --- | --- | --- | --- | --- | --- |
| UIUX-01 — Safety & Accessibility Foundation | Loại click phá hủy vô ý; đặt semantic/focus/error baseline trước khi chuẩn hóa controls. | UIUX-002, UIUX-004, UIUX-015, UIUX-016 | UIUX-022 | MEDIUM: P1 destructive intent và semantic fixes chạm nhiều entry nhưng không đổi transaction. | HIGH — xác nhận hủy suất chạm tác vụ cuối cùng có bồi thường; payload/state phải nguyên vẹn. | Validated planning/R8 baseline |
| UIUX-02 — Design System & Shared Primitives | Chuẩn hóa giá trị và pattern đang lặp, cung cấp control nhỏ để các phase màn hình không tạo lại styling. | UIUX-001, UIUX-019, UIUX-021 | UIUX-004, UIUX-015, UIUX-016, UIUX-020, UIUX-022 | LARGE: Dùng chung trên 5 actor; native form semantics và cascade có blast radius rộng. | HIGH — wrapper có thể đổi submit type, ref, controlled state hoặc format số. | UIUX-01 |
| UIUX-03 — Navigation, IA & Context | Định hướng tác vụ và context mà không đổi route tree, eligibility hoặc business state. | UIUX-007, UIUX-011, UIUX-012, UIUX-018 | UIUX-010, UIUX-016, UIUX-017 | MEDIUM: Nhóm task và recovery trên routes sẵn có; cần kiểm từng partial grant. | HIGH — nhãn/group/context có thể vô tình bypass guard hoặc giữ draft ngoài scope. | UIUX-02 |
| UIUX-04 — Public & Customer Flows | Booking rõ vị trí ghế, public/customer thông tin dễ đọc, login quay lại target hợp lệ và history giữ đầy đủ. | UIUX-003, UIUX-009, UIUX-010, UIUX-017 | UIUX-001, UIUX-004, UIUX-011, UIUX-012, UIUX-015, UIUX-016, UIUX-018, UIUX-021 | LARGE: Journey dài và renderer ghế chạm booking; hợp nhất copy/state trên nhiều routes. | HIGH — seat IDs/availability, return navigation và server totals là contract quan trọng. | UIUX-03 |
| UIUX-05 — Manager Portal | Manager thao tác theo nhiệm vụ, đọc rõ rạp/phòng và form đang edit, không mất giới hạn scope. | — | UIUX-001, UIUX-002, UIUX-007, UIUX-008, UIUX-015, UIUX-018, UIUX-021 | LARGE: Nhiều scoped resource forms, asynchronous scope switching và partial grants. | HIGH — scope/room context và lookup có thể gọi API không được cấp quyền. | UIUX-03 |
| UIUX-06 — CSKH Portal | CSKH hiểu hàng chờ/chi tiết/diễn biến và nhận feedback ổn định, tránh một ý định gửi lặp. | UIUX-013, UIUX-014 | UIUX-001, UIUX-007, UIUX-015, UIUX-018, UIUX-021 | MEDIUM: Queue/detail/timeline hữu hạn; giữ notice và pending phải gắn đúng complaint. | HIGH — async refresh có thể đặt notice hoặc mutation cho complaint mới chọn. | UIUX-03 |
| UIUX-07 — Admin Portal & Dense Data | Admin đọc dense data theo nghĩa nghiệp vụ và chỉnh entity không cần JSON/CSV khi dữ liệu hợp lệ có sẵn, giữ exact permission. | UIUX-005, UIUX-006, UIUX-008 | UIUX-001, UIUX-007, UIUX-013, UIUX-014, UIUX-015, UIUX-016, UIUX-018, UIUX-021 | LARGE: 18 sections, RBAC/assignments và two-way cast/lookup adapters; nhiều edit contracts. | HIGH — cao nhất tổng thể do số section, exact grants, immutable fields, [] semantics và cast replacement. | UIUX-03 |
| UIUX-08 — Responsive, Interaction & Visual Polish | Hợp nhất nhịp chữ/khoảng cách/interaction trên desktop/mobile sau các flow đã đúng. | UIUX-020, UIUX-022 | UIUX-001, UIUX-003, UIUX-004, UIUX-006, UIUX-007, UIUX-009, UIUX-015, UIUX-016, UIUX-019, UIUX-021 | MEDIUM: Kiểm 44 views×6 widths sau adoption; CSS/focus refinements có scope. | MEDIUM — cascade, overlays/sticky actions, table/seat local scroll có thể che focus. | UIUX-04, UIUX-05, UIUX-06, UIUX-07 |
| UIUX-09 — Final UI/UX Regression & Acceptance | Chứng minh upgrade giữ Cinema Booking identity và R8 functionality, đóng findings bằng bằng chứng mới. | — | UIUX-001, UIUX-002, UIUX-003, UIUX-004, UIUX-005, UIUX-006, UIUX-007, UIUX-008, UIUX-009, UIUX-010, UIUX-011, UIUX-012, UIUX-013, UIUX-014, UIUX-015, UIUX-016, UIUX-017, UIUX-018, UIUX-019, UIUX-020, UIUX-021, UIUX-022 | LARGE: Full actor/grant/browser coverage và 45 UC/R1–R8 đối chiếu candidate. | HIGH — thiếu evidence dễ nhầm UI score với functional/release certification. | UIUX-08 |

## 15. Detailed Phase Plans

### UIUX-01 — Safety & Accessibility Foundation

| Required field | Phase specification |
| --- | --- |
| 1. Objective | Loại click phá hủy vô ý; đặt semantic/focus/error baseline trước khi chuẩn hóa controls. |
| 2. Findings | Primary: UIUX-002, UIUX-004, UIUX-015, UIUX-016; adoption: UIUX-022 |
| 3. Screens/views | Manager rooms/seats/showtimes; tất cả AreaLayout; login/register/profile; Forbidden/fallback; các table hiện có. |
| 4. Components | AreaLayout, ManagerPortal/ManagerWorkspace, Login/Register/Profile, Forbidden/Placeholder, Admin table và CinemaImageManager; CatalogStates. |
| 5. Tasks | Chi tiết có ID + LEVEL + acceptance ở bảng ngay dưới. |
| 6. KEEP | Native controls/focus, native Admin confirmations; Manager busy/run và SP guards; Register password helper; RBAC guards. |
| 7. REFINE | Manager destructive confirmation bằng window.confirm có context; lỗi auth chung được đọc và recovery rõ. |
| 8. NORMALIZE | Một main, skip navigation, nhãn nav, scope/caption table, association field/help/error. |
| 9. REPLACE | Không có. |
| 10. Constraints | Giữ routes/API/IDs/handler signatures/controlled values và business state transitions; exact role + grants + ownership + scope; R1 UTC/DATE_ONLY, R5 validation, R2 server authority/history. Không sửa Backend/SP/DB/framework/palette. UI-only pending/focus/confirmation bổ sung được phép, không thay contract state nghiệp vụ. |
| 11. Dependencies | Planning validated; snapshot candidate source before implementation |
| 12. Tests | Hủy confirm → 0 mutation request; đồng ý → đúng 1 request cùng ID/body; keyboard Enter/Space; 401 generic không quy lỗi riêng Email hay mật khẩu; DOM/AX main và skip; đo contrast riêng light/hero. |
| 13. DONE | Ba action Manager đều xác nhận đúng entity, cancel không gửi write; semantic main/nav/table đúng; auth lỗi có summary/help association và focus recovery; contrast light eyebrow kiểm lại; không mất native focus. |
| 14. Risk | HIGH — xác nhận hủy suất chạm tác vụ cuối cùng có bồi thường; payload/state phải nguyên vẹn. |
| 15. Required regression | Chạy frontend test/lint/build; kiểm diff contract, route và request payload; browser affected flow bằng actor hợp lệ và actor thiếu quyền; giữ toàn bộ 45 UC trong traceability. Nếu regression thì sửa/rollback UI, không đổi business rule. Bằng chứng mới trong audit/uiux/implementation/UIUX-XX, không ghi đè audit baseline/R8. R2 cancel hold còn hiệu lực bị chặn; paid cancel/no refund/points đúng; retry không double-credit; R3 Manager ngoài scope/thiếu grant bị chặn; R5 auth và readonly email giữ nguyên. |
| 16. Complexity | MEDIUM — P1 destructive intent và semantic fixes chạm nhiều entry nhưng không đổi transaction. |

| Task ID | Change level | Implementation work / boundaries | Acceptance evidence |
| --- | --- | --- | --- |
| 01-T1 | LEVEL 3 | Trong ManagerPortal bọc deleteRoom/deleteSeat/cancelManagerShowtime bằng native confirm trước action/run. Hiển thị tên + ID, rạp/phòng, phim/thời gian từ row hiện có. Hủy suất nêu không hoàn tiền, bồi thường điểm theo policy; không tự tính điểm hoặc cho phép hủy trái guard. Giữ Admin confirm hiện tại. | Dismiss/Escape không write; accept gọi cùng handler/ID một lần; focus trả trigger; nút vẫn disabled khi busy. |
| 01-T2 | LEVEL 1 | Tại index.css dùng #273e82 hoặc #171923 đã có cho eyebrow trên nền #f5f6fa/white; variant hero giữ riêng theo surface. Không đổi gradient, logo, background hay palette. | Đo từng cặp text/background; light eyebrow đạt chuẩn text thường áp dụng, hero không bị sửa bằng selector toàn cục sai. |
| 01-T3 | LEVEL 2 | Gắn id/help/error association cho auth forms; lỗi backend có field metadata mới map field, lỗi 401 chung dùng summary liên kết cả form và focus summary, không nói field nào sai. Native required/min/maxlength vẫn chạy; giữ password helper. Mẫu còn lại adopt qua UIUX-02/04–07. | Invalid submit đọc được lỗi; giữ input/draft, không auto-focus mỗi render; không đổi error.code/status/message hoặc tạo client business validation. |
| 01-T4 | LEVEL 2 | AreaLayout thêm skip tới main id ổn định; Forbidden bỏ main lồng, fallback có main/h 1, Placeholder account có h 1. Nhãn nav theo khu vực. Table hiện hữu thêm caption/scope và row action accessible name có context. | Mỗi route có đúng một main; skip focus tới nội dung; không đổi path/guards/handler; table keyboard không trap. |
| 01-T5 | LEVEL 1 | Kiểm keyboard/focus và target-size flags theo spacing/inline exception; ghi danh sách cần chỉnh tiếp ở 08, không gán mọi link <24px là lỗi chuẩn. | Native focus còn visible; mỗi flag có quyết định sửa/exception và evidence, không tuyên bố WCAG certified. |

### UIUX-02 — Design System & Shared Primitives

| Required field | Phase specification |
| --- | --- |
| 1. Objective | Chuẩn hóa giá trị và pattern đang lặp, cung cấp control nhỏ để các phase màn hình không tạo lại styling. |
| 2. Findings | Primary: UIUX-001, UIUX-019, UIUX-021; adoption: UIUX-004, UIUX-015, UIUX-016, UIUX-020, UIUX-022 |
| 3. Screens/views | Pilot auth forms + ManagerResourceForm + một owned list; sau đó 04–07 adopt; không migrate mọi screen cùng lúc. |
| 4. Components | Button, FormField, Input, Select, TextArea, StatusBadge, Feedback, SectionHeader, Surface/Card, Table pattern; CatalogStates; money formatter. |
| 5. Tasks | Chi tiết có ID + LEVEL + acceptance ở bảng ngay dưới. |
| 6. KEEP | Hero/cards/gallery/auth-card; mọi toBody/managerBody/dateTime/shared enums; router và AuthContext. |
| 7. REFINE | Thứ bậc primary/secondary/destructive và read-only/disabled; lỗi và helper có đơn vị. |
| 8. NORMALIZE | Tokens exact baseline; 4 class thiếu CSS; controls và state patterns thật; currency format display. |
| 9. REPLACE | Không có. |
| 10. Constraints | Giữ routes/API/IDs/handler signatures/controlled values và business state transitions; exact role + grants + ownership + scope; R1 UTC/DATE_ONLY, R5 validation, R2 server authority/history. Không sửa Backend/SP/DB/framework/palette. UI-only pending/focus/confirmation bổ sung được phép, không thay contract state nghiệp vụ. |
| 11. Dependencies | UIUX-01 |
| 12. Tests | Button trong/ngoài form và Enter; prop/ref/aria passthrough; value/onChange types; helper/error ids; currency null/0/decimal không đổi numeric payload; CSS before/after pilot. |
| 13. DONE | Token registry có consumers; primitives có contract ngắn và pilot PASS; 4 class có style đúng; không framework/dependency mới; không wrapper che guard hoặc state; roadmap adoption rõ. |
| 14. Risk | HIGH — wrapper có thể đổi submit type, ref, controlled state hoặc format số. |
| 15. Required regression | Chạy frontend test/lint/build; kiểm diff contract, route và request payload; browser affected flow bằng actor hợp lệ và actor thiếu quyền; giữ toàn bộ 45 UC trong traceability. Nếu regression thì sửa/rollback UI, không đổi business rule. Bằng chứng mới trong audit/uiux/implementation/UIUX-XX, không ghi đè audit baseline/R8. R1 date helpers không đổi; R4/R7 edit hydration/createOnly/editOnly; R5 nullable/[]/0 và enum validation; R3 hidden controls không phát API; booking totals chỉ display. |
| 16. Complexity | LARGE — Dùng chung trên 5 actor; native form semantics và cascade có blast radius rộng. |

| Task ID | Change level | Implementation work / boundaries | Acceptance evidence |
| --- | --- | --- | --- |
| 02-T1 | LEVEL 2 | Trong index.css tạo semantic CSS variables cho giá trị lặp/invariant theo bảng tokens §20; alias cùng giá trị không sinh theme mới. Style catalog-form/list/card/order-summary bằng nhịp auth/catalog hiện hữu. Gộp hai 680px media chỉ khi cascade chứng minh tương đương. | Pilot không đổi identity; form field tách rõ, controls min-width:0/box sizing; không xóa .catalog-grid/.phase-note chỉ từ static candidate. |
| 02-T2 | LEVEL 2 | Tạo native Button/FormField/Input/Select/TextArea pass props/ref/id/name/value/onChange/required/type/min/max/step/autoComplete/aria, không chứa fetch/auth/date conversion. Button default type=button; tại submit call-site bắt buộc type=submit. Không đổi native validation. | Click/Enter submit đúng một lần; link navigation vẫn Link/a; không nested label, duplicate id, controlled/uncontrolled warning. |
| 02-T3 | LEVEL 2 | Chuẩn hóa text+semantic StatusBadge, Feedback và CatalogStates; SectionHeader/Surface/Card chỉ wrapper presentation. Table pattern giữ native table, caption/scope, overflow và action context; không thêm generic data-fetching grid hoặc custom modal. | Status không chỉ dựa màu; LoadingState role=status/ErrorState alert + retry hiện hữu; không aria-live cho countdown mỗi giây. |
| 02-T4 | LEVEL 2 | Tạo display money formatter tái dùng Intl.NumberFormat vi-VN/VND theo behavior hiện tại; migrate khi touched. Giữ dateTime.formatApiValue fallback và từng DTO numeric value, không làm tròn giá tính toán/payload. | Golden display cases null/0/decimal/large; API bodies snapshots giữ nguyên numeric types và []/null semantics. |
| 02-T5 | LEVEL 2 | Pilot Login/Register/Profile, ManagerResourceForm và Orders/CatalogStates; viết migration checklist để 04/05/06/07 dùng cùng primitives. Các portal còn lại trước adoption vẫn nhận class styles tương thích. | Pilot và chưa-migrate screen không mất labels/submit behavior; không tạo lại Button/FormField riêng mỗi portal. |

### UIUX-03 — Navigation, IA & Context

| Required field | Phase specification |
| --- | --- |
| 1. Objective | Định hướng tác vụ và context mà không đổi route tree, eligibility hoặc business state. |
| 2. Findings | Primary: UIUX-007, UIUX-011, UIUX-012, UIUX-018; adoption: UIUX-010, UIUX-016, UIUX-017 |
| 3. Screens/views | AreaLayout mọi actor; /account; *; Manager task sections; Support queue/detail; Admin 18 sections; Orders/OrderDetail. |
| 4. Components | AreaLayout, Placeholder, AdminPortal local active selection, ManagerWorkspace, SupportPortal. |
| 5. Tasks | Chi tiết có ID + LEVEL + acceptance ở bảng ngay dưới. |
| 6. KEEP | Paths và route guards; local state containers và reset khi đổi user/scope; visibleAreasFor/userCanAct; per-section reads. |
| 7. REFINE | Link trùng destination, titles/active context/back; task grouping; complaint entry; intentional draft discard. |
| 8. NORMALIZE | Context header/action/back pattern theo 02; active nav aria-current khi phù hợp, section buttons aria-pressed hiện hữu. |
| 9. REPLACE | Không có; không sidebar/router/portal rewrite. |
| 10. Constraints | Giữ routes/API/IDs/handler signatures/controlled values và business state transitions; exact role + grants + ownership + scope; R1 UTC/DATE_ONLY, R5 validation, R2 server authority/history. Không sửa Backend/SP/DB/framework/palette. UI-only pending/focus/confirmation bổ sung được phép, không thay contract state nghiệp vụ. |
| 11. Dependencies | UIUX-02 |
| 12. Tests | Public và 4 roles + thiếu grants; no unauthorized section reads; /account links owned read không cần write grant; cancel switching giữ draft, accept dùng reset hiện tại; revoke/scope change không giữ data cũ. |
| 13. DONE | Task grouping và context spec được adopt shell; account/fallback có recovery; complaint link tìm được; dirty/discard/focus policy dùng thống nhất. Finding cross-portal chỉ CLOSED sau đủ evidence 05–07/09. |
| 14. Risk | HIGH — nhãn/group/context có thể vô tình bypass guard hoặc giữ draft ngoài scope. |
| 15. Required regression | Chạy frontend test/lint/build; kiểm diff contract, route và request payload; browser affected flow bằng actor hợp lệ và actor thiếu quyền; giữ toàn bộ 45 UC trong traceability. Nếu regression thì sửa/rollback UI, không đổi business rule. Bằng chứng mới trong audit/uiux/implementation/UIUX-XX, không ghi đè audit baseline/R8. R3 route role vs permission AND, Manager assignments, CSKH dual-grant; R4/R7 onSelect/Bỏ chọn hydration; R5 ownership; 010 return intent triển khai ở 04. |
| 16. Complexity | MEDIUM — Nhóm task và recovery trên routes sẵn có; cần kiểm từng partial grant. |

| Task ID | Change level | Implementation work / boundaries | Acceptance evidence |
| --- | --- | --- | --- |
| 03-T1 | LEVEL 3 | AreaLayout giữ destinations đang có, bỏ duplicate cùng URL, thêm link Khiếu nại cho KH (own reads vẫn có nếu thiếu GUI_KHIEU_NAI); từ order detail liên kết /complaints, không tự prefill unvalidated order ID hoặc tạo route mới. Profile có Home recovery. | Mọi route hiện hữu vẫn truy cập đúng guard; link read vs write phân biệt; actor khác KH không thấy owned customer actions. |
| 03-T2 | LEVEL 3 | /account thay nội dung placeholder bằng h 1 và shortcut Home/Orders/Profile/Complaints; không thêm dashboard/API/UC. Fallback giữ * với thông báo và Home/Movies; Forbidden recovery không sửa quyền. | Không blank destination; không request mới cho dashboard; h 1/main đúng với 01. |
| 03-T3 | LEVEL 3 | Nhóm Admin: Tổng quan/Báo cáo; Tài khoản/Quyền/Phân công; Rạp/Vận hành; Phim/Danh mục; Bán hàng; CSKH. Giữ toàn bộ 18 keys và exact permission map §25. Manager dùng mục lục section theo grants và context rạp/phòng; Support context complaint/list. Chỉ đổi grouping/render, không mount/reset business form để đổi tab visual. | Không nhóm nào cấp grant thay section; no-grants có empty explanation; active section bị revoke reset theo guard hiện tại, không fallback load dashboard trái grant. |
| 03-T4 | LEVEL 3 | Quy định focus-to-edit first editable field/heading; Bỏ chọn trả focus row trigger hoặc list heading nếu row mất. Có dirty confirmation trước switch section/record/scope/discard, cancel giữ nguyên state; accept gọi reset hiện hữu. Refresh: hỗ trợ beforeunload khi browser cho phép; thông báo draft chưa lưu, không autosave/persist sensitive fields. | Không URL/query contract mới hoặc sessionStorage draft; scope/user/grant đổi xóa stale data như hiện tại; return/filter state không chứa token/PII; 05–07 adopt đúng event boundaries. |

### UIUX-04 — Public & Customer Flows

| Required field | Phase specification |
| --- | --- |
| 1. Objective | Booking rõ vị trí ghế, public/customer thông tin dễ đọc, login quay lại target hợp lệ và history giữ đầy đủ. |
| 2. Findings | Primary: UIUX-003, UIUX-009, UIUX-010, UIUX-017; adoption: UIUX-001, UIUX-004, UIUX-011, UIUX-012, UIUX-015, UIUX-016, UIUX-018, UIUX-021 |
| 3. Screens/views | Home/Movies/MovieDetail/Cinemas/CinemaDetail, auth/profile, booking, owned orders/payment/complaints/reviews; movies-empty. |
| 4. Components | SeatMap, ProductPicker, ShowtimeBrowser/ShowtimeList, MovieCard/Grid/Reviews, CinemaList/Gallery, HoldDeadline, DatabaseHealth, auth forms, order summary. |
| 5. Tasks | Chi tiết có ID + LEVEL + acceptance ở bảng ngay dưới. |
| 6. KEEP | Catalog/hero/cards/gallery; existing handlers/state + DAT_VE/THANH_TOAN/DANH_GIA/GUI_KHIEU_NAI; order creation→payment route flow; server total/deadline/snapshots. |
| 7. REFINE | Filter bounds, safe login return, customer copy/CTA hierarchy/history/review/complaint discoverability. |
| 8. NORMALIZE | 02 controls/summary/cards/status/states; phương thức payment human label giữ code; data formatting. |
| 9. REPLACE | LEVEL 4 duy nhất trong phase: SeatMap renderer flat-wrap → logical rows; không đổi booking architecture. |
| 10. Constraints | Giữ routes/API/IDs/handler signatures/controlled values và business state transitions; exact role + grants + ownership + scope; R1 UTC/DATE_ONLY, R5 validation, R2 server authority/history. Không sửa Backend/SP/DB/framework/palette. UI-only pending/focus/confirmation bổ sung được phép, không thay contract state nghiệp vụ. |
| 11. Dependencies | UIUX-03 |
| 12. Tests | Six widths; seat row/number, holes/non-ASCII rows, label fallback, selected/disabled keyboard; guest→login→booking re-fetch; safe return wrong actor/externalURL rejection; all order statuses/deadline; field errors/review eligibility. |
| 13. DONE | Filter không outer overflow; SeatMap giữ row identity và mọi prop/action; safe return không mở redirect ngoài/khác actor; customer copy không còn DB jargon, vẫn nêu payment mô phỏng; owned history/complaint full fields/states PASS. |
| 14. Risk | HIGH — seat IDs/availability, return navigation và server totals là contract quan trọng. |
| 15. Required regression | Chạy frontend test/lint/build; kiểm diff contract, route và request payload; browser affected flow bằng actor hợp lệ và actor thiếu quyền; giữ toàn bộ 45 UC trong traceability. Nếu regression thì sửa/rollback UI, không đổi business rule. Bằng chứng mới trong audit/uiux/implementation/UIUX-XX, không ghi đè audit baseline/R8. R1 timezone/date-only/deadline; R2 same seats/products/promo body, max 10 seats/products bounds, server promo/pricing/conflicts/payment/history/compensation; R3 ownership/write guards; R5 errors; R7 gallery/reviews/complaints. |
| 16. Complexity | LARGE — Journey dài và renderer ghế chạm booking; hợp nhất copy/state trên nhiều routes. |

| Task ID | Change level | Implementation work / boundaries | Acceptance evidence |
| --- | --- | --- | --- |
| 04-T1 | LEVEL 3 | ShowtimeBrowser filter label/select có min-width:0/max-width:100%/box sizing trong wrapper thích hợp; test tên rạp dài. Không overflow:hidden che control hoặc body overflow-x:hidden để giấu lỗi. Giữ query filters và state. | MovieDetail 360/390 scrollWidth-clientWidth ≤1px rounding; select/date/CTA keyboard usable, khác table local scroll. |
| 04-T2 | LEVEL 4 | SeatMap render group seat.row và sort seat.number (DTO đã có), key/onToggle vẫn seat.id, aria-pressed/disabled/status text/limitNotice giữ nguyên. Missing row/number render labeled fallback giữ tất cả seats. Nhãn hàng + neutral orientation caption “Sơ đồ theo hàng ghế”; chỉ ghi vị trí màn hình/lối đi nếu dữ liệu thật có, hiện không có. Row không wrap sang hàng logic khác; local horizontal pan có nhãn khi cần. | Mọi seat xuất hiện đúng 1 lần; A/B không lẫn khi resize; gaps không renumber; Tab/Enter/Space toggle cùng ID; limit 10/held/sold/maintenance bất biến, không ARIA grid giả khi chưa keyboard grid. |
| 04-T3 | LEVEL 3 | Login dùng location.state.from có sẵn; guest booking link gửi target nội bộ hiện hữu. Sau login chọn target qua cùng role/permission policy và route guards; reject external/protocol-relative/login loops; fallback landing hiện tại. Booking quay lại fetch seats/pricing mới, không phục hồi stale reservation/totals. Không hứa persist seat/product selection qua login/reload. | Direct owned detail reauth trở lại path đúng; wrong actor vẫn Forbidden/landing phù hợp; không open redirect; không write tự động sau login. |
| 04-T4 | LEVEL 1 | Đổi “Database chốt” thành “Tổng thanh toán được xác nhận khi tạo đơn”; method human labels map đúng code; giữ mô phỏng và deadline. DatabaseHealth giữ GET/state/retry cần thiết, tóm tắt dịch vụ cho public và technical detail disclosure ít nổi bật, không đổi API/env/RBAC hay thêm telemetry. | Không đổi method code, health outcome hoặc API; không làm tổng tạm tính thành giá chính thức; không thêm refund/đổi points wording. |
| 04-T5 | LEVEL 3 | Adopt 02 primitives/state/formatter cho auth, products/promo/checkout, orders/detail/payment, complaint form/history/detail và reviews; rõ bước/primary CTA, full payment/history/compensation và back hiện hữu. Gallery/catalog giữ bố cục. | Loading/empty/error/retry/success đúng từng flow; 401 summary không field guessing; no-write KH vẫn đọc owned history/complaints; deadline expiry refresh và pending giữ nguyên. |

### UIUX-05 — Manager Portal

| Required field | Phase specification |
| --- | --- |
| 1. Objective | Manager thao tác theo nhiệm vụ, đọc rõ rạp/phòng và form đang edit, không mất giới hạn scope. |
| 2. Findings | Primary: —; adoption: UIUX-001, UIUX-002, UIUX-007, UIUX-008, UIUX-015, UIUX-018, UIUX-021 |
| 3. Screens/views | /manager dashboard/rooms/seats/showtimes/pricing/revenue; manager-seats, manager-pricing-edit, manager-showtime-edit. |
| 4. Components | ManagerPortal/ManagerWorkspace, ManagerResourceForm, ManagerRevenue, scoped lists and primitives. |
| 5. Tasks | Chi tiết có ID + LEVEL + acceptance ở bảng ngay dưới. |
| 6. KEEP | Assignment bootstrap role-only; scopeKey remount + generation stale guards; loadAuthorizedSections, busy/run; managerForms create/edit fields and datetime; confirmation 01. |
| 7. REFINE | Section/context/action hierarchy và focus-to-edit; lookup permission-safe; forms/read lists/pricing/revenue. |
| 8. NORMALIZE | 02 field/control/status/feedback/formatter, list/table/action presentation; headers và unit/time helpers. |
| 9. REPLACE | Không có; không thay ManagerWorkspace architecture. |
| 10. Constraints | Giữ routes/API/IDs/handler signatures/controlled values và business state transitions; exact role + grants + ownership + scope; R1 UTC/DATE_ONLY, R5 validation, R2 server authority/history. Không sửa Backend/SP/DB/framework/palette. UI-only pending/focus/confirmation bổ sung được phép, không thay contract state nghiệp vụ. |
| 11. Dependencies | UIUX-03 |
| 12. Tests | Rooms-only/seats-only/showtimes-only/pricing-only/report-only/no-functional-grants, two assigned scopes; scope change during load/write; edit/cancel; confirmation deny/accept; revenue reset/filter. Request log 0 calls cho section thiếu grant. |
| 13. DONE | Task nav chỉ tới sections có grant; rạp/phòng/form edit context rõ; manual ID fallback hoạt động khi thiếu lookup grant; 4 forms hydrated và scope stale response không xuất hiện; room/seat/show cancel confirm 01 vẫn đúng. |
| 14. Risk | HIGH — scope/room context và lookup có thể gọi API không được cấp quyền. |
| 15. Required regression | Chạy frontend test/lint/build; kiểm diff contract, route và request payload; browser affected flow bằng actor hợp lệ và actor thiếu quyền; giữ toàn bộ 45 UC trong traceability. Nếu regression thì sửa/rollback UI, không đổi business rule. Bằng chứng mới trong audit/uiux/implementation/UIUX-XX, không ghi đè audit baseline/R8. R3 assignments/ownership/resource-scope/partial-grants; R1 DATE_ONLY/UTC showtime; R2 paid/hold cancel/no-double-credit; R4/R5 conflict/validation; R7 full pricing/edit status/revenue. |
| 16. Complexity | LARGE — Nhiều scoped resource forms, asynchronous scope switching và partial grants. |

| Task ID | Change level | Implementation work / boundaries | Acceptance evidence |
| --- | --- | --- | --- |
| 05-T1 | LEVEL 3 | Adopt grouping 03: Tổng quan/Phòng/Ghế/Suất/Bảng giá/Doanh thu theo grant. Context rạp hiển thị liên tục trong nội dung, ghế có tên phòng nếu already-authorized rows có. Không đổi loadAuthorizedSections hoặc report loaders; section nav không che form bằng unmount mất draft. | Scoped loads không rộng hơn; assignment-only Manager vẫn vào được area và có hướng dẫn thiếu quyền, không gọi functional API. |
| 05-T2 | LEVEL 3 | ManagerResourceForm dùng 02; create/edit heading entity+ID, required/unit/“giờ Việt Nam”/optional endsOn. Rooms/seats/shows/pricing list có dòng identity/status/action liền nhau. Revenue formatter và filter/reset giữ API args. | onSave/body/kind/row/busy/onCancel giữ contract; edit pricing đủ fields/null endsOn; roomID showtime immutable edit; status enums không thay. |
| 05-T3 | LEVEL 3 | Movie lookup dùng public getMovies; room picker chỉ từ scoped getRooms khi QL_PHONG đã có, không fetch Admin API. QL_GHE-only hoặc QL_SUAT_CHIEU-only thiếu room read giữ Mã phòng với helper/fallback hiện hữu. Không tự hạn chế options làm mất ID hợp lệ. | Không thêm API/Backend/SP để lookup; unresolved IDs có raw-ID fallback, server validation giữ nguyên; cinema switch xóa lookup cũ. |
| 05-T4 | LEVEL 3 | Adopt focus/draft 03 ở select edit/room/cinema; notices retained qua reload; busy state dùng existing run, action labels có context, confirm 01 không làm lại. | Cancel dirty giữ form; accepted discard dùng reset hiện tại; no stale scope notice/response; double-click write không bị mở bằng wrapper Button. |

### UIUX-06 — CSKH Portal

| Required field | Phase specification |
| --- | --- |
| 1. Objective | CSKH hiểu hàng chờ/chi tiết/diễn biến và nhận feedback ổn định, tránh một ý định gửi lặp. |
| 2. Findings | Primary: UIUX-013, UIUX-014; adoption: UIUX-001, UIUX-007, UIUX-015, UIUX-018, UIUX-021 |
| 3. Screens/views | /support, support-detail; reference/no-reference/error/processing/status states. |
| 4. Components | SupportPortal, ComplaintOrderReference, OrderReferenceDetails, Feedback/FormField/StatusBadge/Table/list. |
| 5. Tasks | Chi tiết có ID + LEVEL + acceptance ở bảng ngay dưới. |
| 6. KEEP | Full reference DTO hiện đủ; canProcess QL_KHIEUNAI+XULY_KHIEUNAI và canReference QL_KHIEUNAI+TRA_CUU_DON; history/date formatting; generation guard. |
| 7. REFINE | Queue/detail hierarchy, timeline, notice lifecycle đúng entity; scoped pending double-submit prevention. |
| 8. NORMALIZE | 02 forms/badges/states/summary; readable process/status labels và list/detail mobile. |
| 9. REPLACE | Không có; không thay SupportPortal hoặc reference API. |
| 10. Constraints | Giữ routes/API/IDs/handler signatures/controlled values và business state transitions; exact role + grants + ownership + scope; R1 UTC/DATE_ONLY, R5 validation, R2 server authority/history. Không sửa Backend/SP/DB/framework/palette. UI-only pending/focus/confirmation bổ sung được phép, không thay contract state nghiệp vụ. |
| 11. Dependencies | UIUX-03 |
| 12. Tests | Read-only + reference-only + process-only + all grants; delayed write/refresh; rapid A→B selection; processing/status success retained; double-click 1 intended write; failed refresh sau write không gọi write lại. |
| 13. DONE | Notice success survive refresh cho đúng complaint; failed refresh phân biệt write thành công với load fail; busy khóa cùng target và released khi lỗi; đầy đủ order/tickets/food/payments/points/history còn đọc; reference thiếu quyền không fetch. |
| 14. Risk | HIGH — async refresh có thể đặt notice hoặc mutation cho complaint mới chọn. |
| 15. Required regression | Chạy frontend test/lint/build; kiểm diff contract, route và request payload; browser affected flow bằng actor hợp lệ và actor thiếu quyền; giữ toàn bộ 45 UC trong traceability. Nếu regression thì sửa/rollback UI, không đổi business rule. Bằng chứng mới trong audit/uiux/implementation/UIUX-XX, không ghi đè audit baseline/R8. R3 AND-grants/ownership; R5 processing/status validation; R6 append-only history; R7 reference completeness; R1 times; 014 Admin/image acceptance tiếp nối 07, global close 09. |
| 16. Complexity | MEDIUM — Queue/detail/timeline hữu hạn; giữ notice và pending phải gắn đúng complaint. |

| Task ID | Change level | Implementation work / boundaries | Acceptance evidence |
| --- | --- | --- | --- |
| 06-T1 | LEVEL 3 | Queue phía trước detail theo DOM order; wide có hai vùng vừa đủ, nhỏ stack cùng renderer, không duplicate hidden forms/IDs. Active complaint #ID/title/status rõ; list và timeline có section headings. | Mobile chọn complaint thấy detail/focus heading; back-to-list không đổi filters hiện hữu; full text/reference không bị ellipsis không có cách mở. |
| 06-T2 | LEVEL 3 | Fix lifecycle afterWrite/selectComplaint: capture target ID trước write; refresh thành công rồi phát/giữ notice đúng target, hoặc giữ success scoped qua refresh. User chọn entity khác không nhận stale notice. Load error sau write được báo riêng “Đã lưu; tải lại thất bại”, retry chỉ read. | Thêm diễn biến/đổi status each success còn thấy sau refresh; old async result không overwrite mới; không tự retry mutation, không sửa history event policy. |
| 06-T3 | LEVEL 2 | UI-only pending guard tại processing/status: chặn cùng intent đang pending, disable target/form actions và hiển thị đang gửi; try/finally, unmount/selection generation protection. Không đổi processing/content/nextStatus/statusValue shape hoặc API body. Shared Feedback 02; 07 adopt Admin/image. | Rapid double click trong pending →1 write; response failure cho retry chủ động; update khác complaint không bị gửi bằng selectedId mới. |
| 06-T4 | LEVEL 3 | Adopt reference presentation 02: rõ customer/show/tickets/food/discount/total/payment attempts/transaction/note/compensation và timeline; keep loadReference/allowed props. Dirty/focus 03 cho processing; no-reference explicit. | All fields read từ DTO snapshots; không frontend bồi thường/refund calculation, no new Backend; reference 403/no-grant không lộ private values. |

### UIUX-07 — Admin Portal & Dense Data

| Required field | Phase specification |
| --- | --- |
| 1. Objective | Admin đọc dense data theo nghĩa nghiệp vụ và chỉnh entity không cần JSON/CSV khi dữ liệu hợp lệ có sẵn, giữ exact permission. |
| 2. Findings | Primary: UIUX-005, UIUX-006, UIUX-008; adoption: UIUX-001, UIUX-007, UIUX-013, UIUX-014, UIUX-015, UIUX-016, UIUX-018, UIUX-021 |
| 3. Screens/views | /admin và đủ 18 sections; admin-user-edit/admin-movie-edit; CinemaImageManager; grants/assignment/complaint/reports. |
| 4. Components | AdminPortal giữ nguyên host; adminForms/formFields/toBody; table descriptors, Cast editor narrow adapter; CinemaImageManager; reference presentation. |
| 5. Tasks | Chi tiết có ID + LEVEL + acceptance ở bảng ngay dưới. |
| 6. KEEP | ADMIN role + ADMIN_SECTION_PERMISSIONS; request/generation guards; users status-only edit, createOnly/editOnly/immutable IDs; native confirmation; entire API. |
| 7. REFINE | Task grouping 03, human headers/context/actions/detail disclosure, entity lookup có permission, pending/notice/scope/draft. |
| 8. NORMALIZE | 02 Table pattern/form primitives/status/money; UI column descriptors có explicit raw-key mapping cho 18 sections. |
| 9. REPLACE | LEVEL 4 candidate: chỉ castJson textarea interaction; không replace AdminPortal/generic CRUD pipeline. |
| 10. Constraints | Giữ routes/API/IDs/handler signatures/controlled values và business state transitions; exact role + grants + ownership + scope; R1 UTC/DATE_ONLY, R5 validation, R2 server authority/history. Không sửa Backend/SP/DB/framework/palette. UI-only pending/focus/confirmation bổ sung được phép, không thay contract state nghiệp vụ. |
| 11. Dependencies | UIUX-03 |
| 12. Tests | 18 sections full/partial/no grants; row selection/save/cancel and all generic CRUD; users status, roles permissions empty[], assignment bounds, gallery cover/delete; cast roundtrip/empty/invalid; local scroll keyboard; status stale refresh. |
| 13. DONE | 18 section descriptors/headers/action identity được map; users/movie mobile vẫn truy cập đủ fields/actions; lookup fallback không cần thêm grant/API; cast structured editor payload-equivalent hoặc candidate defer có evidence contract gap; Admin/image pending và complaint notices scoped PASS. |
| 14. Risk | HIGH — cao nhất tổng thể do số section, exact grants, immutable fields, [] semantics và cast replacement. |
| 15. Required regression | Chạy frontend test/lint/build; kiểm diff contract, route và request payload; browser affected flow bằng actor hợp lệ và actor thiếu quyền; giữ toàn bộ 45 UC trong traceability. Nếu regression thì sửa/rollback UI, không đổi business rule. Bằng chứng mới trong audit/uiux/implementation/UIUX-XX, không ghi đè audit baseline/R8. R3 exact section + per-action AND gates (including reference/process/grants), R4/R7 create/edit payload/hydration, R5 validation/immutable columns/enums/[] vs null, R1 dates/times, R2 show cancel/history; global 008 gồm Manager verification 09. |
| 16. Complexity | LARGE — 18 sections, RBAC/assignments và two-way cast/lookup adapters; nhiều edit contracts. |

| Task ID | Change level | Implementation work / boundaries | Acceptance evidence |
| --- | --- | --- | --- |
| 07-T1 | LEVEL 3 | Giữ AdminPortal/local loaders; adopt groups 03 và 02. Tạo presentation column descriptors mỗi 18 section: key/name/format/priority/row identity; existing response/raw keys không rename. Table showing core identity/status/action gần nhau; detail disclosure bằng native details hoặc section cho text/URLs/JSON dài, vẫn truy cập đủ field đã có. Unknown field hiển thị fallback readable, không silently drop. | Users 11/movie 16 columns không mất dữ liệu; clicked action nhận original row ID, row name visible; scroll wrapper chỉ local; caption/scope theo 01/02. |
| 07-T2 | LEVEL 3 | Adopt descriptors adminForms + existing shared/resourceContract enums tại presentation, không đổi toBody/business validation. Lookup roles→QL_VAITRO, permissions→QL_QUYEN, cinemas→QL_RAP, rooms→QL_PHONG, users→QL_NGUOIDUNG và Admin actor role đều được kiểm trước reads; movies/actors→QL_DANHMUC_PHIM, genres→QL_THELOAI hoặc public genres đọc sẵn phù hợp. CSV/grant multi-select encode cùng numeric arrays, [] revocation rõ; thiếu grant/data giữ validated manual ID/CSV fallback. | Không thêm backend endpoint/pagination; không dùng group grant thay exact grant; code/IDs giữ immutable; lookup dữ liệu chưa loaded không làm clear existing values; options không đủ không xóa IDs đã lưu. |
| 07-T3 | LEVEL 4 | Thay riêng castJson textarea bằng structured rows actorId+role, add/remove, empty [] rõ; adapter vào cùng saveCast hiện có {cast:[{actorId,role}]} PUT /admin/movies/:id/actors. Decode existing value không mất role/ID/array order; invalid/unrecognized input phải báo lỗi và giữ raw editor fallback, không gửi empty vô ý. Actors same QL_DANHMUC_PHIM read nếu allowed; không custom multiselect library. | Golden roundtrip existing cast/empty/non-ASCII role; payload/API/validation nguyên vẹn; selected movie switching dùng dirty 03; candidate chỉ promote nếu contract đầy đủ, otherwise document defer rõ, không bịa backend capability. |
| 07-T4 | LEVEL 2 | Adopt 06 pending rule cho submit/update/delete/lock/showcancel/grants/cast/complaint writes và image create/edit/delete/cover: UI locks đúng entity; try/finally giữ payload và existing confirm. Notice sau refresh scoped current entity/section; load fail sau write không tự retry write. | Mỗi pending intent 1 request; field names/types/status-only user edit và negative R5 giữ; section switch/revoke không stale notice/write target. |
| 07-T5 | LEVEL 3 | Adopt dirty/focus 03 và detail reference presentation từ existing full DTO, keep per-action grants ở Admin complaint; CinemaImageManager chọn rạp/image context, preview optional từ URL đã có, cover/status ordering KEEP; báo cáo dùng server aggregates. | Không extend permissions hoặc scope; all 18 section positive/negative request logs; assignments DATE_ONLY, promo/showtime UTC, pricing create/edit contract và revenue numbers giữ nguyên. |

### UIUX-08 — Responsive, Interaction & Visual Polish

| Required field | Phase specification |
| --- | --- |
| 1. Objective | Hợp nhất nhịp chữ/khoảng cách/interaction trên desktop/mobile sau các flow đã đúng. |
| 2. Findings | Primary: UIUX-020, UIUX-022; adoption: UIUX-001, UIUX-003, UIUX-004, UIUX-006, UIUX-007, UIUX-009, UIUX-015, UIUX-016, UIUX-019, UIUX-021 |
| 3. Screens/views | 20 routes/44 baseline views + new interaction states; all 5 actors at 360/390/768/1024/1280/1440. |
| 4. Components | Shared primitives/tokens, nav/action bars/forms/table scroll/seat rows/gallery/queue. |
| 5. Tasks | Chi tiết có ID + LEVEL + acceptance ở bảng ngay dưới. |
| 6. KEEP | Palette/gradient/font stack/cards/flat surfaces, six viewport baseline; native focus, all functional states. |
| 7. REFINE | Spacing/type labels, hover/focus/disabled, restrained motion, target spacing theo context; action bars candidate sau evidence. |
| 8. NORMALIZE | Tokens consumers đã migrate; consistent feedback/loading/empty, contained tables và local seat scroll. |
| 9. REPLACE | Không có mới; chỉ kiểm hai narrow replacement 04/07. |
| 10. Constraints | Giữ routes/API/IDs/handler signatures/controlled values và business state transitions; exact role + grants + ownership + scope; R1 UTC/DATE_ONLY, R5 validation, R2 server authority/history. Không sửa Backend/SP/DB/framework/palette. UI-only pending/focus/confirmation bổ sung được phép, không thay contract state nghiệp vụ. |
| 11. Dependencies | UIUX-04, UIUX-05, UIUX-06, UIUX-07 |
| 12. Tests | 264 baseline readings + desktop/mobile screenshots; keyboard toàn flow; zoom 200/400% ảnh hưởng; long Vietnamese/currency/URLs/row names; reduced-motion; CSS override check và target exception ledger. |
| 13. DONE | Không reproduced outer overflow/hidden action; local table/seat scroll giải thích và keyboard reachable; focus không bị sticky che; all targets flag triaged; typography/copy/spacing cùng baseline identity; browser limitations ghi thật. |
| 14. Risk | MEDIUM — cascade, overlays/sticky actions, table/seat local scroll có thể che focus. |
| 15. Required regression | Chạy frontend test/lint/build; kiểm diff contract, route và request payload; browser affected flow bằng actor hợp lệ và actor thiếu quyền; giữ toàn bộ 45 UC trong traceability. Nếu regression thì sửa/rollback UI, không đổi business rule. Bằng chứng mới trong audit/uiux/implementation/UIUX-XX, không ghi đè audit baseline/R8. Full frontend tests/lint/build và focused R1/R2/R3/R5/R7 browser sau global CSS; 45 UC routes/CTA smoke; no data/API delta. 09 chạy full acceptance. |
| 16. Complexity | MEDIUM — Kiểm 44 views×6 widths sau adoption; CSS/focus refinements có scope. |

| Task ID | Change level | Implementation work / boundaries | Acceptance evidence |
| --- | --- | --- | --- |
| 08-T1 | LEVEL 1 | Dùng tokens 02 chỉnh nhịp chữ/spacing/labels hiện hữu; controls kế thừa font; focus-visible rõ bằng current primary/dark, preserve native outline cho fallback; hover không đổi layout. Nếu transition dùng ngắn/subtle và respect reduced-motion; không thêm shadow/theme/icon library mới. | Không màu/style identity mới; disabled/read-only hiểu được qua text+semantics; 200/400% zoom không mất action/labels. |
| 08-T2 | LEVEL 3 | Six widths rà filters/nav/Manager/Admin/CSKH/forms/action bars/tables/SeatMap. Ưu tiên min-width:0/wrap/gap cho actual bugs; density dùng grouping/column-priority existing patterns. Horizontal table/row scroll hợp lệ giữ, có hint/keyboard; sticky action chỉ nếu không che content/focus. | Movie clipping 003 được fix 04,08 verify; contained scroll không bị phân loại BROKEN chỉ vì rộng; mọi field hidden priority có disclosure accessible. |
| 08-T3 | LEVEL 1 | Triaged target flags UIUX-022 theo element/spacing/inline exceptions; padding nav/action group nếu cần, không chỉ phóng mọi text link. Cross-screen state/feedback/required/unit language đồng nhất; skeleton chỉ nếu measured loading đáng kể, không mandatory decoration. | Ledger flag fix/exception+evidence; state không chỉ màu; no skeleton flash che live notices/hold; QA cả mouse/touch emulation/keyboard. |

### UIUX-09 — Final UI/UX Regression & Acceptance

| Required field | Phase specification |
| --- | --- |
| 1. Objective | Chứng minh upgrade giữ Cinema Booking identity và R8 functionality, đóng findings bằng bằng chứng mới. |
| 2. Findings | Primary: —; adoption: UIUX-001, UIUX-002, UIUX-003, UIUX-004, UIUX-005, UIUX-006, UIUX-007, UIUX-008, UIUX-009, UIUX-010, UIUX-011, UIUX-012, UIUX-013, UIUX-014, UIUX-015, UIUX-016, UIUX-017, UIUX-018, UIUX-019, UIUX-020, UIUX-021, UIUX-022 |
| 3. Screens/views | Tất cả 20 route,44 views/18 Admin sections + auth/permission/error/empty/pending/success/confirm/cast/seat states. |
| 4. Components | 25 shared hiện hữu và primitives/composites được migrate; hai narrow interactions. |
| 5. Tasks | Chi tiết có ID + LEVEL + acceptance ở bảng ngay dưới. |
| 6. KEEP | R8/R6/audit baseline immutable; không publish/release/reset main trong QA UI. |
| 7. REFINE | Chỉ fix UI regressions đúng phase owner; không thêm feature hoặc đổi policy. |
| 8. NORMALIZE | Evidence/traces/status summary và acceptance cùng rubric; không ép scores=5. |
| 9. REPLACE | Không thêm; compare 04 SeatMap/07 cast với baseline contract. |
| 10. Constraints | Giữ routes/API/IDs/handler signatures/controlled values và business state transitions; exact role + grants + ownership + scope; R1 UTC/DATE_ONLY, R5 validation, R2 server authority/history. Không sửa Backend/SP/DB/framework/palette. UI-only pending/focus/confirmation bổ sung được phép, không thay contract state nghiệp vụ. |
| 11. Dependencies | UIUX-08 |
| 12. Tests | Production build browser all 5 actors, six widths/keyboard/focus/form states/partial grants/no-grants; 45 UC; all frontend/backend tests; lint/build/no-raw-SQL/contracts; R1–R8 applicable regression và isolated DB verify/reset nếu full integration cần. |
| 13. DONE | 45/45 UC PASS; no new P0/P1 hoặc contract regressions; all 22 findings có fixed/verified hoặc explicitly scoped accepted candidate evidence; toàn 44 views+18 sections và new states traced; report observed/not-run chính xác; same identity source diff reviewed. |
| 14. Risk | HIGH — thiếu evidence dễ nhầm UI score với functional/release certification. |
| 15. Required regression | Chạy frontend test/lint/build; kiểm diff contract, route và request payload; browser affected flow bằng actor hợp lệ và actor thiếu quyền; giữ toàn bộ 45 UC trong traceability. Nếu regression thì sửa/rollback UI, không đổi business rule. Bằng chứng mới trong audit/uiux/implementation/UIUX-XX, không ghi đè audit baseline/R8. R1 datetime/R2 3 NF compensation and races/history/R3 role ownership scope/R4 forms/R5 validation/R6 history/R7 features/R8 release baseline. Không claim RELEASE READY mới nếu required check còn BLOCKED. |
| 16. Complexity | LARGE — Full actor/grant/browser coverage và 45 UC/R1–R8 đối chiếu candidate. |

| Task ID | Change level | Implementation work / boundaries | Acceptance evidence |
| --- | --- | --- | --- |
| 09-T1 | LEVEL 1 | Đối chiếu evidence mới với baseline: five actors,20 routes,44 views,18 Admin sections và viewport list. Từng finding có source diff/visual/DOM/action proof + primary owner + continuation results. Source HIGH-CONFIDENCE 013/014/018 phải có behavioral proof. | Không lấy test cũ làm PASS mới; route nested scores không fabricate; no-runtime-error/network negative cases có logs đã redact. |
| 09-T2 | LEVEL 1 | Rerun suites theo regression §29; production dist phải build từ candidate. Integration chỉ isolated approved disposable fixture, verify target trước reset. Parameterize/wrap harness output vào implementation/UIUX-09 để bảo toàn R8 và audit baseline. Không chạy scripts/r8/run.mjs nguyên bản vì out hardcode historical folder. | R8 legacy files hash preserved; failed checks ghi FAIL/BLOCKED, không đổi assertions/policy; backup/restore drills không lặp nếu UI-only diff và previous infrastructure evidence còn phù hợp. |
| 09-T3 | LEVEL 1 | Tạo final acceptance matrix: visual identity, customer journey, manager scope, cskh reference, admin 18 CRUD/RBAC, responsive/a 11 y/keyboard/states,45 UC và source/API diff. Fix regression ở UI owner rồi rerun impacted checks; ghi candidate defer nếu cast contract gap tồn tại. | Verdict phân biệt functional PASS, UX findings accepted/fixed, device/AT coverage; không WCAG AA certification; release/production deploy là task riêng. |


Every phase 16 fields and task IDs/levels/acceptance above bind implementation. Files named in component/screen inventories are current touchpoints, not permission to expand scope. All phases currently PLANNED / NOT STARTED.

## 16. Findings → Phase Traceability

| Finding / severity / confidence | Root cause + groups | Screens/components (source evidence) | Primary phase → continuation | Complexity / risk | Required regression |
| --- | --- | --- | --- | --- | --- |
| UIUX-001 — P2; PROVEN | Form/list presentation dùng class chưa có rule; Design System; Forms; Component Architecture | frontend/src/components/ManagerResourceForm.jsx; frontend/src/index.css | UIUX-02 → UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08 | MEDIUM / MEDIUM | Controlled props + missing class computed styles |
| UIUX-002 — P1; PROVEN | Destructive handler gọi mutation trước intent confirmation; Safety; Manager UX; Interaction | frontend/src/pages/ManagerPortal.jsx; frontend/src/pages/ManagerPortal.jsx; frontend/src/pages/AdminPortal.jsx | UIUX-01 → UIUX-05, UIUX-09 | MEDIUM / HIGH | Dismiss=0 write; accept=same ID; R2 hold/points/retry |
| UIUX-003 — P2; PROVEN | Intrinsic select width vượt parent nhỏ; Responsive; Customer Journey | frontend/src/components/ShowtimeBrowser.jsx; frontend/src/index.css | UIUX-04 → UIUX-08, UIUX-09 | SMALL / LOW | Six widths; ≤1px outer overflow; filters unchanged |
| UIUX-004 — P2; PROVEN | Cùng eyebrow color áp cả light surface và hero; Accessibility; Design System | frontend/src/index.css | UIUX-01 → UIUX-02, UIUX-08, UIUX-09 | SMALL / LOW | Light contrast/hero independently, palette unchanged |
| UIUX-005 — P2; PROVEN | Table header/cell dựa raw response keys; Dense Data UI; Admin UX; Component Architecture | frontend/src/pages/AdminPortal.jsx; frontend/src/utils/dateTime.js | UIUX-07 → UIUX-08, UIUX-09 | LARGE / HIGH | 18 descriptors; no fields/IDs dropped; row actions correct |
| UIUX-006 — P2; PROVEN | Wide rows thiếu cột identity/action và scroll cue; Dense Data UI; Responsive; Admin UX | frontend/src/index.css; frontend/src/pages/AdminPortal.jsx | UIUX-07 → UIUX-08, UIUX-09 | MEDIUM / MEDIUM | Contained scroll; keyboard all cells/actions; no outer overflow |
| UIUX-007 — P2; PROVEN | Task nav ngang cấp; long workspace thiếu grouping; Navigation / IA; Manager UX; Admin UX; CSKH UX | frontend/src/pages/AdminPortal.jsx; frontend/src/pages/ManagerPortal.jsx | UIUX-03 → UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM / HIGH | Exact grants sections/loads; no nav-caused draft unmount |
| UIUX-008 — P2; PROVEN | Generic field renderer lộ IDs/CSV/JSON; thiếu lookup context; Forms; Manager UX; Admin UX; Dense Data UI | frontend/src/utils/adminForms.js; frontend/src/pages/AdminPortal.jsx; frontend/src/utils/managerForms.js | UIUX-07 → UIUX-05, UIUX-09 | LARGE / HIGH | Authorized lookup + raw fallback; enums/[]/cast roundtrip |
| UIUX-009 — P2; PROVEN | Seat layout gắn viewport wrap thay row/number; Customer Journey; Responsive; Interaction | frontend/src/components/SeatMap.jsx; frontend/src/index.css | UIUX-04 → UIUX-08, UIUX-09 | MEDIUM / HIGH | Seat IDs/onToggle/aria/disabled/selection/limit/body identical |
| UIUX-010 — P2; HIGH-CONFIDENCE | Login bỏ state.from; booking link không truyền intent; Customer Journey; Navigation / IA | frontend/src/routes/RequireAuth.jsx; frontend/src/pages/auth/Login.jsx; frontend/src/pages/BookingPreparation.jsx | UIUX-04 → UIUX-09 | MEDIUM / HIGH | Safe same-origin return + actor guard + fresh seats |
| UIUX-011 — P2; PROVEN | Reusable placeholder không recovery/context; Navigation / IA; Customer Journey; Accessibility | frontend/src/routes/index.jsx; frontend/src/pages/Placeholder.jsx | UIUX-03 → UIUX-04, UIUX-09 | SMALL / LOW | Account/fallback existing links; one main/h 1 |
| UIUX-012 — P2; PROVEN | Complaint flow tồn tại nhưng thiếu entry ở owned contexts; Customer Journey; Navigation / IA | frontend/src/routes/index.jsx; frontend/src/pages/OrderDetail.jsx | UIUX-03 → UIUX-04, UIUX-09 | SMALL / MEDIUM | Read without GUI_KHIEU_NAI; write remains gated/owned |
| UIUX-013 — P2; PROVEN (source) | Refresh selection clears success notification; Feedback; CSKH UX; Interaction | frontend/src/pages/SupportPortal.jsx; frontend/src/pages/SupportPortal.jsx | UIUX-06 → UIUX-07, UIUX-09 | MEDIUM / HIGH | Real write success survives reload; scoped target/no stale notice |
| UIUX-014 — P2; HIGH-CONFIDENCE | Write handlers thiếu UI pending intent lock; Interaction; Feedback; CSKH UX; Admin UX | frontend/src/pages/AdminPortal.jsx; frontend/src/pages/SupportPortal.jsx; frontend/src/components/CinemaImageManager.jsx | UIUX-06 → UIUX-07, UIUX-09 | MEDIUM / HIGH | Double click 1 intent write; fail/retry/section switch safe |
| UIUX-015 — P2; PROVEN | General error lacks input association/focus contract; Accessibility; Forms; Feedback | frontend/src/pages/auth/Login.jsx; frontend/src/components/ManagerResourceForm.jsx; frontend/src/pages/auth/Register.jsx | UIUX-01 → UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-09 | MEDIUM / MEDIUM | Native validation + known field mapping only; generic 401 summary |
| UIUX-016 — P2; PROVEN | Semantic container/nav/table rules chưa thống nhất; Accessibility; Navigation / IA; Dense Data UI | frontend/src/pages/Forbidden.jsx; frontend/src/layouts/AreaLayout.jsx; frontend/src/pages/AdminPortal.jsx | UIUX-01 → UIUX-02, UIUX-03, UIUX-07, UIUX-09 | MEDIUM / MEDIUM | 1 main/skip/nav names/caption/scope/action names |
| UIUX-017 — P2; PROVEN | Implementation terminology xuất hiện trong customer copy; Customer Journey; Feedback; Polish | frontend/src/pages/BookingPreparation.jsx; frontend/src/pages/PaymentPage.jsx; frontend/src/components/DatabaseHealth.jsx | UIUX-04 → UIUX-09 | SMALL / MEDIUM | Human method labels=same codes; simulated/no-refund/server totals |
| UIUX-018 — P2; HIGH-CONFIDENCE | Local edit/selection clearing thiếu explicit discard/focus policy; Navigation / IA; Forms; Manager UX; CSKH UX; Admin UX | frontend/src/pages/AdminPortal.jsx; frontend/src/pages/SupportPortal.jsx; frontend/src/pages/ManagerPortal.jsx | UIUX-03 → UIUX-05, UIUX-06, UIUX-07, UIUX-09 | LARGE / HIGH | Cancel retains draft, accepted reset; scope/revoke purge; no autosave |
| UIUX-019 — P3; PROVEN | Repeated CSS literals chưa có registry; CSS Architecture; Design System | frontend/src/index.css; frontend/src/index.css | UIUX-02 → UIUX-08, UIUX-09 | MEDIUM / MEDIUM | Exact token consumers; cascade audit; candidates not assumed dead |
| UIUX-020 — P3; PROVEN | Shared type/interaction presentation thiếu contract; Polish; Design System; Interaction | frontend/src/index.css; frontend/src/pages/ManagerPortal.jsx | UIUX-08 → UIUX-09 | SMALL / MEDIUM | Native focus retained; current colors/font; zoom/reduced motion |
| UIUX-021 — P3; PROVEN | Formatter/control markup duplication cross-feature; Component Architecture; Design System | frontend/src/pages/Orders.jsx; frontend/src/pages/PaymentPage.jsx; frontend/src/pages/AdminPortal.jsx | UIUX-02 → UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-09 | MEDIUM / MEDIUM | Display-only formatter; submit/controlled props unchanged |
| UIUX-022 — P3; PROVEN measurement; conformance unclaimed | Targets measured small, exceptions chưa classified; Accessibility; Responsive; Polish | frontend/src/index.css; frontend/src/pages/ManagerPortal.jsx | UIUX-08 → UIUX-01, UIUX-09 | SMALL / LOW | Size/spacing/inline exception ledger; keyboard reachable |

22 unique IDs; one primary/coordinator each. Primary counts 4+3+4+4+0+2+3+2+0=22. UIUX-05 and 09 having 0 primary does not mean no scope:05 adopts cross-cutting findings,09 verifiesall 22. Findings 007/008/014/015/018 may have PENDING_ADOPTION until continuation results; do not reportgloballyFIXED atfoundationDONE.

## 17. Dependency Graph

```mermaid
flowchart TD
  P1[UIUX-01 Safety and A 11 y] --> P2[UIUX-02 Tokens and Primitives]
  P2 --> P3[UIUX-03 Navigation and Context]
  P3 --> P 4[UIUX-04 Public and Customer]
  P3 --> P 5[UIUX-05 Manager]
  P3 --> P 6[UIUX-06 CSKH]
  P3 --> P 7[UIUX-07 Admin and Dense Data]
  P 4 --> P 8[UIUX-08 Responsive and Polish]
  P 5 --> P 8
  P 6 --> P 8
  P 7 --> P 8
  P 8 --> P 9[UIUX-09 Final Acceptance]
```

01→02→03 là prerequisite cứng;04–07 cùng phụ thuộc 03, có thể làm độc lập về feature nhưng phải phối hợp khi chạm index.css/primitives/AreaLayout. Thứ tự tuần tự khuyến nghị 04→05→06→07;07 không phụ thuộc code mới 06: pending/notice convention đã có trong 02/03 và §28. Không task screen styling riêng trước 02; không dời P1 tới 05.008/007/018 có continuation ở nhiều portal,09 kiểm closure toàn bộ.08 chỉ bắt đầu khi 04–07 DONE;09 sau 08. Graph không vòng.

Khác draft audit: filter overflow 003 được owner 04 (screen fix sau shared control foundation 02),08 chỉ verify. Semantic/safety 01 làm nhỏ dùng native controls;02 tokenize giữ kết quả 01, không làm lại confirmation/custom modal. Feedback lifecycle owner 06 và adoption 07 có action/payload tests riêng, không chờ polish 08.

## 18. Screen Roadmap

20 route rows + 24 nested/focused rows = **44 distinct audited views**, không cộng dashboard Admin hai lần. Điểm current lấy Overall UX từ audit 1–5 (judgment có evidence); nested chưa chấm riêng, ghi điểm parent tham chiếu, không tạo score giả. Target không ép mọi screen 5/5.

### 20 route screens

| Screen/View | Actor | Current Score | Main Issues | KEEP | Planned Changes | Phase | Complexity | Risk | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home (/) | PUBLIC | 4/5 overall | UIUX-004, UIUX-017 | Hero/CINEMA STAR/catalog/health outcomes | Light eyebrow; health summary/copy; shared nav/states | UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-08, UIUX-09 | SMALL | LOW | Same catalog links/health GET; identity retained; text contrast verified |
| movies (/movies) | PUBLIC | 4/5 overall | UIUX-004 | MovieGrid/search/genre filters/debounce/empty retry | Tokens/control/state adoption, nav focus/targets | UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-08, UIUX-09 | SMALL | LOW | Same filters/queries/card links; long titles and empty search accessible |
| movie-detail (/movies/:movieId) | PUBLIC + KH | 3/5 overall | UIUX-003, UIUX-004, UIUX-015 | Detail/facts/genres/trailer/reviews/showtime fetch | Constrain cinema filter; review fields; states and contrast | UIUX-01, UIUX-02, UIUX-04, UIUX-08, UIUX-09 | MEDIUM | MEDIUM | 360/390 no outer overflow; DANH_GIA eligibility/errors; dates/showtime IDs unchanged |
| cinemas (/cinemas) | PUBLIC | 4/5 overall | UIUX-004 | CinemaList/phone/detail links/media data | Consistent controls/eyebrows/states/alt fallback | UIUX-01, UIUX-02, UIUX-04, UIUX-08, UIUX-09 | SMALL | LOW | Gallery/detail paths unchanged; media unavailable does not remove link/context |
| cinema-detail (/cinemas/:cinemaId) | PUBLIC | 4/5 overall | UIUX-004 | CinemaGallery/cover/caption/phone/back | Shared typography/contrast/state; no invented cinema showtime feature | UIUX-01, UIUX-02, UIUX-04, UIUX-08, UIUX-09 | SMALL | LOW | Gallery scales; existing cover/status ordering/alt and phone/back stay |
| booking (/booking/:showtimeId) | PUBLIC + KH | 3/5 overall | UIUX-009, UIUX-010, UIUX-017 | Seat/product/promo state, existing createBooking/CTA/limits | Logical rows LEVEL 4; context; controls/summary/copy/login target | UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-08, UIUX-09 | LARGE | HIGH | Same seat/product/promo body; limit 10; held/sold disabled; server total authority; stale conflict handled |
| login (/login) | PUBLIC | 4/5 overall | UIUX-010, UIUX-015 | Auth-card/Email/MatKhau/autocomplete/busy/error contract | Generic-error association; safe state.from return | UIUX-01, UIUX-02, UIUX-04, UIUX-08, UIUX-09 | MEDIUM | HIGH | No untrusted redirects or wrong-actor access; Enter exactly 1 submit; 401 non-specific |
| register (/register) | PUBLIC | 4/5 overall | UIUX-015 | Auth-card/password UTF 8 bytes/DOB/validation/busy | Field help/error pattern/control adoption | UIUX-01, UIUX-02, UIUX-04, UIUX-08, UIUX-09 | SMALL | MEDIUM | R5 password/DOB/null constraints unchanged; no validation relaxation |
| forbidden (/forbidden) | PUBLIC | 3/5 overall | UIUX-016 | Denial and Home recovery, current guards | Remove nested main; improve recovery/focus | UIUX-01, UIUX-03, UIUX-08, UIUX-09 | SMALL | LOW | Exactly 1 main; 403 routing still denies; no grant change |
| profile (/profile) | AUTH | 4/5 overall | UIUX-015 | Current identity, readonly email/role and date-only DOB | Shared fields/errors; Home navigation; existing submit | UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-08, UIUX-09 | SMALL | MEDIUM | Readonly values not converted into edits; owner/current identity and DATE_ONLY stable |
| orders (/orders) | KH | 3/5 overall | UIUX-001, UIUX-012 | Owned reads, server status/totals/latest payment | Missing list/card styles; status/actions/currency; complaint entry | UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-08, UIUX-09 | MEDIUM | MEDIUM | Customer no write grants still reads own history; other owner denied; IDs/dates unchanged |
| order-detail (/orders/:orderId) | KH | 3/5 overall | UIUX-012, UIUX-017 | Tickets/foods/totals/payment history, HoldDeadline and pay guard | Summary/hierarchy/states, complaint link and human copy | UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-08, UIUX-09 | MEDIUM | HIGH | Same payment/history/snapshot fields, own read; pay requires THANH_TOAN; no refund CTA |
| payment (/orders/:orderId/payment) | KH | 3/5 overall | UIUX-017 | Own order/THANH_TOAN, simulated payment/deadline/busy/reload | Human method labels mapped to same codes; button/summary/states | UIUX-01, UIUX-02, UIUX-04, UIUX-08, UIUX-09 | MEDIUM | HIGH | Expired/already paid/error/retry states; same body/amount; history unchanged/no client total authority |
| complaints (/complaints) | KH | 3/5 overall | UIUX-001, UIUX-012, UIUX-015 | Owned history/read and GUI_KHIEU_NAI write; order picker | Entry links + fields/cards/states/status/feedback | UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-08, UIUX-09 | MEDIUM | MEDIUM | No-grant KH reads, cannot submit; optional order association belongs to owner; lengths/enums unchanged |
| complaint-detail (/complaints/:complaintId) | KH | 3/5 overall | UIUX-001 | Owned complaint/history/back | Readable metadata/status/timeline/empty state | UIUX-01, UIUX-02, UIUX-04, UIUX-08, UIUX-09 | SMALL | MEDIUM | Processing history all accessible; other owner blocked; no customer status-write action |
| manager (/manager) | QLR | 2/5 overall | UIUX-001, UIUX-002, UIUX-007, UIUX-008, UIUX-018 | Assigned scope, per-action grants, forms/run/generation | Confirm 01; task nav/context; fields/lookup/focus/scoped lists/revenue | UIUX-01, UIUX-02, UIUX-03, UIUX-05, UIUX-08, UIUX-09 | LARGE | HIGH | Scope/partial-grant API logs; room/seat/show/pricing/edit/report and R2 cancel checks PASS |
| support (/support) | CSKH | 3/5 overall | UIUX-001, UIUX-013, UIUX-014, UIUX-018 | Queue/detail/full reference/history and AND grants | Stable notice/pending; list/detail/forms/timeline/context | UIUX-01, UIUX-02, UIUX-03, UIUX-06, UIUX-08, UIUX-09 | MEDIUM | HIGH | Real write notice retained;1 intent write; reference forbidden causes 0 API load; stale complaint ignored |
| account (/account) | KH | 2/5 overall | UIUX-011, UIUX-012 | /account + KH role guard/current identity | Existing-flow shortcut page; title/main/recovery | UIUX-01, UIUX-03, UIUX-04, UIUX-08, UIUX-09 | SMALL | LOW | Orders/Profile/Complaints/Home links only; no dashboard/new API or UC |
| admin (/admin) | ADM | 2/5 overall | UIUX-001, UIUX-005, UIUX-006, UIUX-007, UIUX-008, UIUX-014, UIUX-018 | 18 keys/exact grants/CRUD/forms/generation/nativeconfirm | Groups/table descriptors/lookup/castLEVEL 4/pending/focus | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | LARGE | HIGH | All 18 sections full/partial/no-grants; same resource bodies; no field loss; no broad API loading |
| not-found (*) | PUBLIC | 2/5 overall | UIUX-011, UIUX-016 | Wildcard path fallback behavior | Main/h 1/Home/Movies recovery, shared state style | UIUX-01, UIUX-03, UIUX-08, UIUX-09 | SMALL | LOW | Unknown path recovers without new route/automatic wrong-actor redirect |

### 24 important nested/focused views

| Screen/View | Actor | Current Score | Main Issues | KEEP | Planned Changes | Phase | Complexity | Risk | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| support-detail [parent support] | CSKH | Chưa chấm riêng; parent 3/5 | Reference complete; notice cleared; no pending | Existing entity data/guard/hydration/state | Selected complaint/order-reference/timeline; Reference complete; notice cleared; no pending | UIUX-01, UIUX-02, UIUX-03, UIUX-06, UIUX-08, UIUX-09 | MEDIUM | HIGH | Same full DTO/grants; notice persists after write; A→B race cannot overwrite |
| admin-users [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_NGUOIDUNG; original row keys/form/loader | 11 cols identity/status/action and account create/status-only edit; role lookup | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | User immutable id/email rules; create password handling; lock confirm; same status-only body |
| admin-roles [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_VAITRO; original row keys/form/loader | Name/code/description and grants context; lookup if dual-read authorized | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Code/create vs edit immutable; role grant[] supported; separate permissions gate retained |
| admin-permissions [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_QUYEN; original row keys/form/loader | Permission human names; role grant read/write; CSV→selection if permitted | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Role IDs+permission numeric[] exact; revoke-all[]; QL_VAITRO-only cannot grant via UI |
| admin-assignments [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact PHANCONG_RAP; original row keys/form/loader | Manager/cinema identity; lookup only QL_NGUOIDUNG/QL_RAP; DATE_ONLY help | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Existing assignment IDs/actor validity/status/start/end; manual fallback with partial grants |
| admin-cinemas [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_RAP; original row keys/form/loader | Name/address/phone/status context; form and long-cell disclosure | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | All current fields retained; operatingSince createOnly; existing delete confirmation |
| admin-images [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_RAP; original row keys/form/loader | Rạp/image context; existing six headers; pending/preview/order/cover | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Same API URL/status/cover/order; delete confirm; media fallback; no production image/data rewrite |
| admin-rooms [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_PHONG; original row keys/form/loader | Room/cinema identity and human type/status; cinema lookup if allowed | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | cinemaId createOnly; status edit; resource delete guards; same scope/global-admin behavior |
| admin-seats [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_GHE; original row keys/form/loader | Room/row/number context; compact columns/action; local filtering existing responses only | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | IDs immutable; room/row/number createOnly; no invented layout or server pagination |
| admin-movies [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_DANHMUC_PHIM; original row keys/form/loader | 16 cols priority/detail, enums/genres, edit hydration and cast narrow editor | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | LARGE | HIGH | Same complete movie fields/genreIds[]/cast body; raw fallback unresolved cast; dates unchanged |
| admin-genres [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_THELOAI; original row keys/form/loader | Human name/key/action form/table normalization | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Create/update/delete same key/body; confirmation and duplicate-name validation |
| admin-actors [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_DANHMUC_PHIM; original row keys/form/loader | Name/birthDate/nationality identity and fields | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | DATE_ONLY birthDate; same actor IDs/delete/in-use rules; no new cast capability |
| admin-products [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_SANPHAM; original row keys/form/loader | Type/status enum helpers; price units; long description/media detail | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Same numeric price/status/payload, no inventory/quantity/business rule changes |
| admin-promotions [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_KHUYENMAI; original row keys/form/loader | Discount type/unit/code and bounds; local datetime helpers; human status | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | UTC promotion dates; R5 bounds/enums/quantity; code createOnly; server validation unchanged |
| admin-pricing [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_BANG_GIA; original row keys/form/loader | Currency/context/type/day/format + effective DATE_ONLY help | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Admin pricing createOnly/edit fields remain Admin contract; do not copy broader Manager edit contract |
| admin-showtimes [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_SUAT_CHIEU; original row keys/form/loader | Movie/room/date/format/status; authorized lookup; native cancel confirm | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Same UTC/ID/immutable room edit and R2 cancel hold/points/no-refund/history |
| admin-complaints [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact QL_KHIEUNAI; original row keys/form/loader | Queue/detail/timeline/reference presentation; pending/notice; keep additional action gates | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | QL_KHIEUNAI+TRA_CUU_DON reference, +XULY_KHIEUNAI process/status; no backend for presentation |
| admin-revenue [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | 001/005/006/007/008/014/018 theo section | Exact XEM_BAO_CAO_TOANHE; original row keys/form/loader | Date filter/currency/server metric labels and zero data | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Same server totals/date query; no client aggregation substituting report |
| manager-seats [parent manager] | QLR | Chưa chấm riêng; parent 2/5 | Long 40 seat list; task/action context | Existing entity data/guard/hydration/state | Loaded seats scoped room; Long 40 seat list; task/action context | UIUX-01, UIUX-02, UIUX-03, UIUX-05, UIUX-08, UIUX-09 | MEDIUM | HIGH | QL_GHE-only fallback works; room/rạp remain scoped; create/edit/delete confirm |
| admin-user-edit [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | Focus/context/pending; table density | Existing entity data/guard/hydration/state | Selected user status edit; Focus/context/pending; table density | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Status-only edit, readonly identity, Bỏ chọn focus recovery; same userID |
| admin-movie-edit [parent admin] | ADM | Chưa chấm riêng; parent 2/5 | CSV/JSON/16 cols/dirty/focus | Existing entity data/guard/hydration/state | Selected movie + cast interaction; CSV/JSON/16 cols/dirty/focus | UIUX-01, UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | LARGE | HIGH | Cast roundtrip or explicit fallback; movie hydration/body+genre[] unchanged |
| manager-pricing-edit [parent manager] | QLR | Chưa chấm riêng; parent 2/5 | Field units/grouping/edit focus | Existing entity data/guard/hydration/state | Hydrated pricing edit; Field units/grouping/edit focus | UIUX-01, UIUX-02, UIUX-03, UIUX-05, UIUX-08, UIUX-09 | MEDIUM | HIGH | All Manager pricing fields/status/optional endsOn; DATE_ONLY no shift |
| manager-showtime-edit [parent manager] | QLR | Chưa chấm riêng; parent 2/5 | Datetime controls/context/focus | Existing entity data/guard/hydration/state | Hydrated showtime edit; Datetime controls/context/focus | UIUX-01, UIUX-02, UIUX-03, UIUX-05, UIUX-08, UIUX-09 | MEDIUM | HIGH | UTC roundtrip; room immutable; status options exclude direct cancel; cancel action remains R2 |
| movies-empty [parent movies] | PUBLIC | Chưa chấm riêng; parent 4/5 | Empty/recovery/type/contrast | Existing entity data/guard/hydration/state | Search yields empty result; Empty/recovery/type/contrast | UIUX-01, UIUX-02, UIUX-04, UIUX-08, UIUX-09 | SMALL | LOW | EmptyState preserved; clear/search recovery; no fake movies or source data replacement |

### Đủ 18 Admin sections (dashboard nằm trong route admin)

| Section / audited view | Exact permission (ADMIN role required) | Planned changes / phase | Acceptance |
| --- | --- | --- | --- |
| Tổng quan (dashboard; admin) | XEM_BAO_CAO_TOANHE | Human metric names, server aggregates; no decorative charts/new aggregation; 03→07→08→09 | Metric raw-key mapping; GET role+grant; no client replacement for revenue |
| Tài khoản (users; admin-users) | QL_NGUOIDUNG | 11 cols identity/status/action and account create/status-only edit; role lookup; 03→07→08→09 | User immutable id/email rules; create password handling; lock confirm; same status-only body |
| Vai trò (roles; admin-roles) | QL_VAITRO | Name/code/description and grants context; lookup if dual-read authorized; 03→07→08→09 | Code/create vs edit immutable; role grant[] supported; separate permissions gate retained |
| Quyền (permissions; admin-permissions) | QL_QUYEN | Permission human names; role grant read/write; CSV→selection if permitted; 03→07→08→09 | Role IDs+permission numeric[] exact; revoke-all[]; QL_VAITRO-only cannot grant via UI |
| Phân công (assignments; admin-assignments) | PHANCONG_RAP | Manager/cinema identity; lookup only QL_NGUOIDUNG/QL_RAP; DATE_ONLY help; 03→07→08→09 | Existing assignment IDs/actor validity/status/start/end; manual fallback with partial grants |
| Rạp (cinemas; admin-cinemas) | QL_RAP | Name/address/phone/status context; form and long-cell disclosure; 03→07→08→09 | All current fields retained; operatingSince createOnly; existing delete confirmation |
| Ảnh rạp (cinemaImages; admin-images) | QL_RAP | Rạp/image context; existing six headers; pending/preview/order/cover; 03→07→08→09 | Same API URL/status/cover/order; delete confirm; media fallback; no production image/data rewrite |
| Phòng (rooms; admin-rooms) | QL_PHONG | Room/cinema identity and human type/status; cinema lookup if allowed; 03→07→08→09 | cinemaId createOnly; status edit; resource delete guards; same scope/global-admin behavior |
| Ghế (seats; admin-seats) | QL_GHE | Room/row/number context; compact columns/action; local filtering existing responses only; 03→07→08→09 | IDs immutable; room/row/number createOnly; no invented layout or server pagination |
| Phim (movies; admin-movies) | QL_DANHMUC_PHIM | 16 cols priority/detail, enums/genres, edit hydration and cast narrow editor; 03→07→08→09 | Same complete movie fields/genreIds[]/cast body; raw fallback unresolved cast; dates unchanged |
| Thể loại (genres; admin-genres) | QL_THELOAI | Human name/key/action form/table normalization; 03→07→08→09 | Create/update/delete same key/body; confirmation and duplicate-name validation |
| Diễn viên (actors; admin-actors) | QL_DANHMUC_PHIM | Name/birthDate/nationality identity and fields; 03→07→08→09 | DATE_ONLY birthDate; same actor IDs/delete/in-use rules; no new cast capability |
| Sản phẩm (products; admin-products) | QL_SANPHAM | Type/status enum helpers; price units; long description/media detail; 03→07→08→09 | Same numeric price/status/payload, no inventory/quantity/business rule changes |
| Khuyến mãi (promotions; admin-promotions) | QL_KHUYENMAI | Discount type/unit/code and bounds; local datetime helpers; human status; 03→07→08→09 | UTC promotion dates; R5 bounds/enums/quantity; code createOnly; server validation unchanged |
| Bảng giá (pricing; admin-pricing) | QL_BANG_GIA | Currency/context/type/day/format + effective DATE_ONLY help; 03→07→08→09 | Admin pricing createOnly/edit fields remain Admin contract; do not copy broader Manager edit contract |
| Suất chiếu (showtimes; admin-showtimes) | QL_SUAT_CHIEU | Movie/room/date/format/status; authorized lookup; native cancel confirm; 03→07→08→09 | Same UTC/ID/immutable room edit and R2 cancel hold/points/no-refund/history |
| Khiếu nại (complaints; admin-complaints) | QL_KHIEUNAI | Queue/detail/timeline/reference presentation; pending/notice; keep additional action gates; 03→07→08→09 | QL_KHIEUNAI+TRA_CUU_DON reference, +XULY_KHIEUNAI process/status; no backend for presentation |
| Doanh thu (revenue; admin-revenue) | XEM_BAO_CAO_TOANHE | Date filter/currency/server metric labels and zero data; 03→07→08→09 | Same server totals/date query; no client aggregation substituting report |

## 19. Component Roadmap

**41 roadmap items:** 25 existing shared React components (17 files/21 exports + layout/2guards/provider), 10 planned primitives/patterns, 1 formatter helper và 5 composite/interaction items. Đây không phải 41 runtime components hiện tại. Auth forms, Admin forms và ManagerWorkspace vẫn giữ host/state.

| Component | Current Status | KEEP / REFINE / NORMALIZE / REPLACE | Target Phase | Complexity | Risk | Reason | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AccessErrorHandler | frontend/src/components/AccessErrorHandler.jsx | KEEP | UIUX-01, UIUX-03, UIUX-09 | SMALL | HIGH | 401/403 recovery and authForbidden event already valid | No bypass/changed status handling or location leak |
| LoadingState | frontend/src/components/CatalogStates.jsx | KEEP + NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | SMALL | LOW | Shared role=status useful; presentation adoption only | Same state contract; no live duplicate announcement |
| EmptyState | frontend/src/components/CatalogStates.jsx | KEEP + NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | SMALL | LOW | Explicit empty states exist | Contextual recovery only existing handler/link |
| ErrorState | frontend/src/components/CatalogStates.jsx | KEEP + NORMALIZE | UIUX-01, UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-09 | SMALL | MEDIUM | Alert/retry reusable | Same API error semantics; retry read only where current handler |
| CinemaGallery | frontend/src/components/CinemaGallery.jsx | KEEP + REFINE | UIUX-04, UIUX-08, UIUX-09 | SMALL | LOW | Cover/captions/real media responsive | Same image status/order/cover/alt, bounded width |
| CinemaImageManager | frontend/src/components/CinemaImageManager.jsx | REFINE + NORMALIZE | UIUX-02, UIUX-03, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Six headers good; pending/forms/context gaps | Same image API/grants and cover/delete rules;1 intent pending |
| CinemaList | frontend/src/components/CinemaList.jsx | KEEP + NORMALIZE | UIUX-04, UIUX-08, UIUX-09 | SMALL | LOW | Public cards suit browsing | Same ID/link/phone/media fallback; same identity |
| OrderReferenceDetails | frontend/src/components/ComplaintOrderReference.jsx | KEEP + NORMALIZE | UIUX-02, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Full snapshot DTO complete | All tickets/food/totals/history/transactions/points exposed via same data |
| ComplaintOrderReference | frontend/src/components/ComplaintOrderReference.jsx | KEEP + REFINE | UIUX-06, UIUX-07, UIUX-09 | SMALL | HIGH | allowed/loadReference and stale guards useful | No-grant 0 fetch; id change/error retry correct; no new API |
| DatabaseHealth | frontend/src/components/DatabaseHealth.jsx | KEEP + REFINE | UIUX-04, UIUX-09 | SMALL | LOW | Health result/retry valid, technical copy distracting | Same GET/outcomes; public summary and secondary details, no env/RBAC change |
| ErrorBoundary | frontend/src/components/ErrorBoundary.jsx | KEEP | UIUX-02, UIUX-09 | SMALL | MEDIUM | Recovery containment already shared | Render exception still recoverable; no swallowed failures |
| HoldDeadline | frontend/src/components/HoldDeadline.jsx | KEEP | UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | SMALL | HIGH | UTC live countdown authoritative hold behavior | Same expiry callback/refresh; no extending deadline or per-second live spam |
| ManagerResourceForm | frontend/src/components/ManagerResourceForm.jsx | KEEP + NORMALIZE | UIUX-02, UIUX-05, UIUX-08, UIUX-09 | MEDIUM | HIGH | Descriptor/hydration contract correct; style missing | kind/row/onSave/onCancel/busy and managerBody unchanged |
| ManagerRevenue | frontend/src/components/ManagerRevenue.jsx | KEEP + NORMALIZE | UIUX-02, UIUX-05, UIUX-08, UIUX-09 | SMALL | HIGH | Scoped report/filter/refresh already good | Same cinemaId/refresh/date filters/server totals; grant gated |
| MovieCard | frontend/src/components/MovieCard.jsx | KEEP + REFINE | UIUX-04, UIUX-08, UIUX-09 | SMALL | LOW | Established catalog identity | Same poster/title/ID route/fallback |
| MovieGrid | frontend/src/components/MovieGrid.jsx | KEEP | UIUX-04, UIUX-08, UIUX-09 | SMALL | LOW | Existing responsive composition fits | No browse framework/rewrite; list keys stable |
| MovieReviews | frontend/src/components/MovieReviews.jsx | KEEP + NORMALIZE | UIUX-01, UIUX-02, UIUX-04, UIUX-08, UIUX-09 | MEDIUM | HIGH | Complete review/eligibility/busy | Same DANH_GIA/body/errors/score bounds and write eligibility |
| ProductPicker | frontend/src/components/ProductPicker.jsx | KEEP + NORMALIZE | UIUX-02, UIUX-04, UIUX-08, UIUX-09 | SMALL | HIGH | Quantity bounds/name/price label valid | Same IDs/quantities/onChange/min/max and numeric body |
| SeatMap | frontend/src/components/SeatMap.jsx | REPLACE (narrow LEVEL 4) | UIUX-04, UIUX-08, UIUX-09 | MEDIUM | HIGH | Flat wrap loses row identity | seat.id/row/number, selectedSeatIds/onToggle/aria/disabled/limitNotice all same |
| ShowtimeList | frontend/src/components/ShowtimeBrowser.jsx | KEEP + NORMALIZE | UIUX-04, UIUX-08, UIUX-09 | SMALL | MEDIUM | Cards and selected show IDs valid | Same date/cinema/movie IDs/price labels/link routes |
| ShowtimeBrowser | frontend/src/components/ShowtimeBrowser.jsx | REFINE + NORMALIZE | UIUX-02, UIUX-04, UIUX-08, UIUX-09 | SMALL | MEDIUM | Filter intrinsic width clips 360 | Width fix without query/state changes; empty/error retry preserved |
| AreaLayout | layout/route/context infrastructure | KEEP + REFINE | UIUX-01, UIUX-02, UIUX-03, UIUX-08, UIUX-09 | MEDIUM | HIGH | Useful actor shell; duplicates/skip/main gaps | Same links visibility/auth logout/router outlet; one main/skip/active context |
| RequireAuth | layout/route/context infrastructure | KEEP | UIUX-03, UIUX-04, UIUX-09 | SMALL | HIGH | Existing state.from must be consumed, guard not rewritten | No change auth eligibility/redirect semantics; Login safe return honors guard |
| RequireRole | layout/route/context infrastructure | KEEP | UIUX-03, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-09 | SMALL | HIGH | Role/exact entry grants R3 correct | Same role+permission AND behavior; no ADMIN bypass |
| AuthProvider | layout/route/context infrastructure | KEEP | UIUX-02, UIUX-03, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-09 | SMALL | HIGH | Identity/session/permission loader already correct | No new store/permission caching/persistence or role assumptions |
| Button | Chưa có shared abstraction; có native markup/classes tương tự | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Explicit native button primary/secondary/destructive | type/disabled/ref/aria/onClick preserved; form submits explicitly type=submit |
| FormField | Chưa có shared abstraction; có native markup/classes tương tự | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | MEDIUM | Labels/help/error convention without business validation | Stable unique id, describedby includes helper/error; unknown field errors stay summary |
| Input | Chưa có shared abstraction; có native markup/classes tương tự | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Native text/number/date/datetime/email/password controls | Pass same required/min/max/step/autocomplete/value/onChange; no date coercion |
| Select | Chưa có shared abstraction; có native markup/classes tương tự | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | HIGH | Native options with controlled value | Same enum/ID option values; unresolved current value not deleted |
| TextArea | Chưa có shared abstraction; có native markup/classes tương tự | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | MEDIUM | Native multiline description/review/processing fields | Same names/lengths/required and content; no trimming/payload normalization change |
| StatusBadge | Chưa có shared abstraction; có native markup/classes tương tự | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | MEDIUM | Current enum text plus existing semantic colors | Text conveys state; no automatic enum/status rewrite |
| Feedback | Chưa có shared abstraction; có native markup/classes tương tự | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | MEDIUM | Status/alert summary and pending presentation | No global notice store; entity owned lifecycle; error contract untouched |
| Table pattern | Chưa có shared abstraction; có native markup/classes tương tự | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | MEDIUM | Native caption/header/overflow/action context | No UI grid framework/fetch/pagination; raw keys/IDs retained |
| SectionHeader | Chưa có shared abstraction; có native markup/classes tương tự | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | MEDIUM | Heading/context/action hierarchy | Correct h-level; no duplicated h 1 or hidden actions |
| Surface/Card | Chưa có shared abstraction; có native markup/classes tương tự | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-08, UIUX-09 | MEDIUM | MEDIUM | Current white/border/radius wrapper | No default decorative card around all content; existing hero/gallery unchanged |
| Money formatter | Intl.NumberFormat lặp | NORMALIZE | UIUX-02, UIUX-04, UIUX-05, UIUX-06, UIUX-07, UIUX-09 | SMALL | MEDIUM | Display reuse only | Same vi-VN VND display/null policy; never computes totals/payload |
| Auth forms (Login/Register/Profile) | Auth-card + local controlled form state | KEEP + NORMALIZE | UIUX-01, UIUX-02, UIUX-04, UIUX-09 | MEDIUM | HIGH | Keep good auth layout; field error/safe return | Same handlers/Email/MatKhau/readonly and R5 validation |
| Booking summary/actions | BookingPreparation local state + product/promo sections | REFINE + NORMALIZE | UIUX-02, UIUX-04, UIUX-08, UIUX-09 | MEDIUM | HIGH | Clarify checkout without wizard rewrite | Server authoritative totals; no new state architecture/automatic payment |
| Admin form renderer | adminForms/formFields/inputValue/toBody + local JSX | KEEP + NORMALIZE | UIUX-02, UIUX-03, UIUX-07, UIUX-09 | LARGE | HIGH | Existing descriptor contracts; improve presentation | createOnly/editOnly/status user/pricing differences/[] preserved |
| Cast editor interaction | castJson textarea + saveCast in AdminPortal | REPLACE candidate (narrow LEVEL 4) | UIUX-07, UIUX-09 | MEDIUM | HIGH | Structured actorId/role rows; same serialization | Payload roundtrip/empty/invalid and raw fallback; no portal rewrite |
| ManagerWorkspace | Page-local scoped state/generation/run/forms | KEEP + REFINE | UIUX-01, UIUX-03, UIUX-05, UIUX-09 | LARGE | HIGH | Task context/focus/confirmation without state rewrite | ScopeKey/generation/busy/per-section guards retained |

## 20. Design System Roadmap

Current literal styles → normalized tokens → native shared primitives → screen adoption → final QA. Token names là mục tiêu của phase 02, chưa tồn tại trong source hiện tại; exact aliases giữ value đã có. Không token hóa mọi one-off CSS.

| Token / pattern proposed name | Current value / semantics | Consumers | Create → migrate → QA |
| --- | --- | --- | --- |
| --color-primary / --color-hero-start / --color-hero-end | #273e82 / #182b62 / #3f63ad | Button/links/hero/seat selected | 02 → shared controls 02 & touched 04–07 →08/09 |
| --color-page / --color-surface / --color-text | #f5f6fa / #fff / #171923 | Page/Surface/forms/headers | 02 → no wholesale background rewrite →08 |
| --color-muted / --color-danger / --color-success | #667085 / #a42b2b / #17653a | Helpers/StatusBadge/Feedback | 02 →04–07 →state contrast 08/09 |
| --color-danger-state / --border-error | #8d2525 / #edcaca | ErrorState existing variant | 02 CatalogStates →04–07 →08/09 |
| --border-surface / --border-control / --border-table | #dfe3eb / #cbd1dc / #dce2ee; 1px | Surface/Input/Select/Table | 02 pilot →04–07 →08 |
| --color-eyebrow-light / --color-eyebrow-hero | Light alias dark existing fixed 01; hero retains existing #8ca6e5 if contrast confirmed | SectionHeader/hero eyebrow | 01 surface-specific fix →02 aliases →04–07 →08 verify |
| --space-xs / --space-sm / --space-md / --space-lg / --space-section | .35rem/.5rem/1rem/1.5rem/2rem; semantic alias only where pattern repeats | FormField/actions/cards/sections | 02 →03 grouping/04–07 forms →08 spacing QA |
| --radius-control / --radius-surface / --radius-card / --radius-hero | .35–.45rem by existing variants / .75rem / .8rem /1rem | Input/Button/Surface/card/hero | 02 exact variants →consumer adoption →08 |
| --font-ui / --text-body / --text-card / --text-table / --text-eyebrow | Inter,system-ui,sans-serif /1rem /1.1rem /.92rem /.75rem | All controls, cards, tables, eyebrow | 02 alias; retain clamp hero/detail;08 line-height proposal verified before adoption |
| --content-catalog / --content-auth / --content-booking | 76rem /34rem /52rem | Existing page wrappers | 02 only repeated invariants →04–07 →six widths 08 |
| --shadow-surface | none (current flat surfaces) | Surface only if consumer repeats | 02 registry; no decorative shadow addition |
| border/transition/disabled/focus contract | 1px borders; native outline fallback; opacity .6 existing busy; no authored transition currently | Native controls and Feedback | 02 semantic policy;08 optional subtle transition, reduced-motion; no animation system |
| breakpoint.compact (documentation constant) | 680px existing threshold; viewport tests are not 6 CSSbreakpoints | movie intro/header account media rules | 02 preserve literal media threshold;08 only introduce geometry-driven breakpoints when evidence requires |
| Button/FormField/Input/Select/TextArea | Native and controlled; unit/error/ref passthrough | Auth pilot/ManagerResourceForm 02; all forms 04–07 | 02 contract + pilot →04–07 →08/09 |
| StatusBadge/Feedback/SectionHeader/Surface/Card | Text roles/current palette/small wrappers; no data management | Owned lists/portal context/forms/feedback | 02 pattern →03/04–07 →08/09 |
| Table pattern / money formatter | Native table and display-only vi-VN/VND; no fetch/sort/pagination framework | Manager/Support lists when useful; Admin descriptors and summary | 02 foundation →05–07 specific schemas →08/09 |

CSS custom property không dùng trực tiếp trong media-query condition:680 pxgiữ literal/documented constant, không viết @media(max-width:var(...)). Không tạo new yellow/purple/theme; semantic warning nếu chưa cần vẫn dùng text và border health hiện có. !important chỉ bỏ nếu cascade proof và screenshot sau migration đúng; static-unused candidates không đủ để xóa style. Button default type=button, submit call-sites explicit, Link/a tiếp tục navigation; FormField không tự hiểu API/payload. Không custom dialog/grid/framework/store.

## 21. Navigation / IA Roadmap

03 thực thi AreaLayout recovery/shortcuts/dedup và shared context;05/06/07 adopt task grouping trong host page hiện có.

| Actor / surface | Target grouping and context | Permission/data rule | Acceptance |
| --- | --- | --- | --- |
| PUBLIC | Home / Phim / Rạp; login/register; back từ detail | Không thêm navigation destination/API | Active destination/name/skip/back rõ; same 20 routes |
| KH | Home/Phim/Rạp + Đơn của tôi/Khiếu nại/Hồ sơ; /account shortcuts | Orders/complaints owned reads do not require write grants; submit/pay/review remain exact gated | Không phải biết URL khiếu nại; no-write KH vẫn xem history; order link không auto-submit |
| MANAGER | Tổng quan; Phòng/Ghế; Suất chiếu; Bảng giá; Doanh thu; current rạp/phòng/entity | Assignment bootstrap role-only, sections/actions exact grants, lookups scoped; preserve scopeKey resets | User thiếu QL_PHONG vẫn QL_GHE fallback; no unauthorized loads/draft leak |
| CSKH | Queue/filters → complaint context → reference/timeline → process/status | Reference and processing different AND-grants; no global order search beyond existing API | SelectedId and mutations bound target; back-to-list/draft focus intentional |
| ADMIN | Tổng quan/Báo cáo; Tài khoản/Quyền/Phân công; Rạp/Vận hành; Phim/Danh mục; Bán hàng; CSKH | Groups are visual only;18 individual keys/exact grants remain; read additional lookup only allowed | Partial grants show exact sections; no default dashboard request without grant; keyboard task nav |
| Context/draft all | Heading+entity ID/status+action/back; focus-to-edit; dirty discard native confirmation | Giữ local business state/reset handlers; UI-only dirty tracker allowed, no autosave/global store/new URL contract | Cancel giữ state; accept reset theo hiện tại; permission/user/scope change purge stale data; refresh has explicit no-draft-persistence behavior |

Không đổi state contract để giải quyết finding 018: bổ sung presentation/focus/intent confirmation quanh reset hiện có. URL-backed selection/refresh restoration không mandatory; current routes/query contracts giữ nguyên. Native beforeunload chỉ dùng khi dirty và browser hỗ trợ, không hứa prompt trên mọi thiết bị. Safe login return 010 owner 04 dùng existing state.from; chỉ target actor hợp lệ và re-fetch authoritative availability, không persist prices/payment/seats vào session storage.

## 22. Public / Customer Roadmap

04 owns public/customer refinement. KEEP browsing/cinema gallery/auth-card/owned orders/payment history/reviews. Order flow remains one booking page then existing payment route; no new wizard/checkout state-machine. Filter clippingfixed 04; rowSeatMap narrow renderer; product/promotion/summary context and human copy; safe login return; complaints reachable via 03 entry. All loading/empty/error/retry/success retained, payment simulated disclosure explicit, server authority no client totals override. Guest booking view remains allowed; DAT_VE/THANH_TOAN/DANH_GIA/GUI_KHIEU_NAI exactwrites and owned readsunchanged. Detailed 04 tasks +§18 routeAC bind.

## 23. Manager Roadmap

05 adopts 03 task navigation and 02 forms/lists/formatter; reverify 01 confirmation instead of implementing twice. Rooms/seats/shows/pricing/dashboard/revenue allcovered. Rạp/phòng/entity-edit context and focus/discard; existingbusy/run/load generation KEEP. Lookup public movies and permission-scopedrooms; seat-only/show-only lackingQL_PHONG keepsmanualMãphòng fallback. No Admin API loads, no extra functional-grant requirement forassignmentbootstrap, no responsefromoldscope persists. Fourresource payload/edit/date contracts andR 2 cancellation kept. Detailed 05 tests + focusedviews map§18.

## 24. CSKH Roadmap

06 queue/detail/timeline/form hierarchy; fullComplaintOrderReference/OrderReferenceDetails KEEP; process/statussuccessnotice retained acrossrefresh and bound capturedcomplaintID; UIpending locks 1 intent, failure/reload separation andfocus/draft 03. canReference = QL_KHIEUNAI+TRA_CUU_DON, canProcess = QL_KHIEUNAI+XULY_KHIEUNAI remainAND. No referenceAPI/backendchange for styling; no new globalorderlookup or timelineeventpolicy.07 adopts samefeedbackpolicy forAdmin without changinghost architecture.

## 25. Admin Roadmap

07 fulfills 18-section matrix§18. FullADMIN+exactsectiongrants as authorization.js; tabgroups visualonly. Per-actiongrantrolepermission/ref/process remainsgate. Rawkeys→humanpresentationdescriptors; everyexistingfield stillvisible or disclosed; rowcontext/actions/localtablekeyboard; enums/lookup/backedexistingreads andmanualfallback whenmissinggrants. Castcandidateonly 07-T 3 LEVEL 4; genericCRUDforms/toBody remainhost. PendingAdmin/image/complaint, gallerycover/status, grants[] revoke andassignment/DATETIME/DATE_ONLY allcovered. Highestaggregate risk; tests cannot cover onlydashboard/users/movie.

## 26. Responsive Roadmap

| Class | Actual audit evidence | Owner / treatment | Acceptance |
| --- | --- | --- | --- |
| Actual bug | MovieDetail 360 client 345/scroll 377=32px;390 client 375/scroll 377=2px; intrinsic cinema select | 04-T1 constrained native select;08 verify | Six widths max 1 pxrounding outer overflow; không dùng body overflow:hidden che lỗi |
| Density issue | Manager all-function page and ~4000 px 40 seat view; Admin 18 navbuttons | 03 task grouping +05/07 scoped lists +08 QA | Tasks/context dễ quét; không coi page height tự nó là functional failure |
| Acceptable horizontal scroll | Admin users~1256 px 11 cols/movie~1953 px 16 cols inside343px mobile wrapper | 07 column priority/context/detail;08 keyboard/cue | Wrapper local scroll còn usable; every field/action accessible; no automatic BROKEN classification |
| Candidate adaptation | CSKH queue/detail stacked; forms/action groups plain | 06 wide two-region/small stack single DOM;02 form foundation;08 action bars after measurement | No duplicated form IDs/state, focus order sensible, no hidden notice/controls |
| Narrow renderer replacement | Seat flat wrap mixes rows/2 columnsmobile | 04 logical seat rows, local pan if needed;08 QA | Keep row identity and exactIDs/status/selection/aria/limits; no invented aisle/screen coordinates |
| KEEP | Gallery/catalog grids/auth-card responsive already operable | 04 adoption/08 long labels/media fallback checks | No new desktop/mobile design style; same image source/order/alt |

Required widths 360/390/768/1024/1280/1440 (baselineheight 900,desktopChromeCSS viewport). Capture 44 views at 6 widths plus new interaction states;390/1440 before-after PNGs for all 44, current images must remain unedited. Long Vietnamese text/empty/large values/URL/many seats/table rows and zoom 200/400% belong 08/09. Viewport emulation does not equal real-phone/Safari coverage; mark actual device/AT runs DONE/NOT RUN by environment, no fabricated certification. No mandatory server pagination/virtualization/Backend redesign.

## 27. Accessibility Roadmap

| Finding / positive invariant | Owner / continuation | Implementation and acceptance |
| --- | --- | --- |
| 004 contrast | 01→02→08→09 | Dark current palette on light eyebrow; compare specific surfaces; hero checked separately; preserve identity |
| 015 field/error/focus | 01 auth baseline→02 pattern→04/05/06/07 adopt→09 | Known backend field errors map without guessing; generic 401 form summary; stable describedby/help/errors; focus summary or first invalid after explicit submit, no every-render jumps |
| 016 semantics | 01→02/03/07→09 | 1 main perroute; h 1 fallback/account; skip link with focus target; nav names; native th scope/caption and meaningful action name |
| 020 authored interactions / native focus | 02 baseline→08→09 | Native auto 1 pxfocus was visible; keep fallback, add consistent focus-visible current colors; no outline:none unless equivalent visible replacement |
| 022 target flags | 01 triage→08 fix/exception→09 | Raw size<24px is flag; spacing/inline exceptions reviewed by context, no automatic failure claim; nav/action target padding when actually needed |
| 009 SeatMap | 04→08→09 | Native buttons + row labels, aria-pressed/disabled/status text unchanged; Tab/Enter/Space; no role=grid without appropriate interaction |
| 007/018 nav/edit | 03→05/06/07→09 | Keyboard active context; native dirty confirm; focus-to-edit/back; no duplicated/hidden tab-order controls |
| 013/014 feedback | 06→07→09 | Status/alert scoped entity; busy disabled and progress text; refresh cannot clear success; not spam countdown live every second |
| 001/005/006/008 form/table | 02→05/07→08/09 | Labels/units/help and readable headers; exact enum/ID body; overflow/detail disclosure keyboard reachable |
| KEEP labels/alt/names | 04 gallery/catalog +all phases→09 | Audit 0 unlabelled visible controls; meaningful existing alt/status text/native labels remain after wrappers; broken media keeps fallback/recovery |

Mục tiêu: semantic structure, keyboard/focus, labels/errors, meaningful alt/name, contrast và tables/skip, no obvious blocker. Dùng criteria/exception analysis trong ACCESSIBILITY_AUDIT.md làm reference. Không tuyên bố WCAG AA certified từ DOM/AX hoặc điểm UX. Dedicated screen-reader/zoom/real-device observations báo phạm vi thực tế và giới hạn.

## 28. Interaction / Feedback Roadmap

| State / action | Binding UI rule | Owner / proof |
| --- | --- | --- |
| Loading/empty/error | Reuse CatalogStates semantic roles and existing retry; no fake sample rows; errors preserve R5 code/status/body | 02 pattern,04–07 adoption; actual loading/empty/error 09 |
| General vs field errors | Only known field metadata maps to input; summary for generic auth/conflict/server unavailable; preserve entered values | 01/02; keyboard recovery 04–07 |
| Pending | UI-only lock same intent/target; native disabled + progress; same business state/body; try/finally releases on error; no automatic mutation retry | Existing Auth/Manager/PaymentKEEP;06 Support,07 Admin/image; delayed write double-click proof |
| Success + refresh | Bind notice to captured entity/section; completed write success not cleared by background reload; refresh failure distinct | 06013;07 Admin/image; A→B and successful-write/read-failure cases |
| Destructive | Native window.confirm, entity/context/consequence; dismiss 0 writes, acceptsame existing handler; no custom modal system | 01002→05 verify; Admin/imageconfirmationKEEP |
| Edit/cancel/draft | Explicit edit identity; focus field/heading then return to row/list; dirty switch/discard confirm; accepting uses existing reset; revoke/scope change clears | 03 policy→05/06/07; no sessionStorage/autosave/router rewrite |
| Payment/hold | Keep simulated payment disclosure, pending and official server responses/deadline; no changed retries/TTL/history/points | 04/09 R 2; never use UXpending as cross-client idempotency proof |

UIUX-014 là FUNCTIONAL-RISK từ source, chưa là reproduced DB bug. UI pending tránh một người click lặp trong cùng interaction; server concurrency/idempotency guards vẫn chịu trách nhiệm và được rerun riêng. Không sửa SP/RBAC/error policy để làm UI test xanh.

## 29. Regression Contract

| Invariant | Binding contract | Evidence / regression |
| --- | --- | --- |
| 45 Use Cases | 45/45 functional UC remain PASS; no new business flow in this roadmap | audit/final/r8/UC_TRACEABILITY_FINAL.json/md; candidate rerun 09 |
| Routes/IDs/handlers/state | All 20 paths incl * remain; DTO IDs, event signatures, controlled values, payload shapes and business state transitions unchanged | routes/index.jsx + api clients + existing test contracts; additive UI-only busy/focus/confirmation accepted |
| Authority | Price, promotion, availability, payment and final totals stay Backend/SP authoritative; no frontend recomputation to override server | R2 booking/hold/payment/promo conflict paths; no raw SQL Backend |
| R1 datetime | UTC instants, Vietnam display/business-local input conversion, DATE_ONLY no timezone shift; HoldDeadline unchanged | Temporal/dateTime/adminForms/managerForms tests; R1 timezone integrations |
| R2/R2-FIX | 1000 VND=1 point; proportional ticket/food promotion allocation; no refund; live hold blocks show cancel; no double-credit; unique DonDatVeID 3 NF compensation snapshot; historical payment rows unchanged | Existing DB/SP behavior and R2/R2-FIX tests; UI never computes official points/changes cancellation eligibility |
| R3 RBAC | Exact role AND permission; ownership; Manager current assignments/resource scope; partial grants; no ADMIN bypass | authorization.js, RequireAuth/Role, APIrequest negative logs and R3 permission matrix |
| R4/R5/R7 forms | IDs immutable; descriptor create/edit distinctions; nullable/[]/0; status hydration; R5 validation and error.code/status preserved | adminForms/managerForms/shared/resourceContract and integration tests |
| R6 history | Append-only decisions/snapshots/audit/history remain as accepted; no deleting old rows to simplify UI | R6 audit and R8 preservation hashes; no data migration in UI scope |
| R8 architecture | React 19.3/Router 7.18/Vite 8.3/Temporal/local state/AuthContext/thin REST; Backend SP-only;27 tables baseline | No framework/icon/store/modal system or DB/API changes for aesthetics |


### Checks and trigger scope

| Check | When required | How to preserve baseline |
| --- | --- | --- |
| Frontend tests/lint/build | Mỗi phase có source/UI change;09 full | npm.cmd --prefix frontend test; npm.cmd --prefix frontend run lint; npm.cmd --prefix frontend run build. Current 40 tests là baseline, không freeze số tests khi thêm meaningful tests |
| Backend tests / SP-only / contracts | 09 full; earlier if contract risk unresolved | npm.cmd --prefix backend test; npm.cmd run audit:no-sql; npm.cmd run db:contracts; baseline 112 tests. No backend edit for UI |
| Browser affected flow | Every implementation phase | Build candidate dist, dedicated browser profile and isolated seeded API fixture; positive+negative actor; capture paths/payload/DOM/screenshot/errors/keyboard |
| R1 datetime/timezone | 04/05/07 when date/control adoption;09 | Reuse scripts/r1 and scripts/r2/checks timezone scenarios (UTC/Vietnam/input/display/DATE_ONLY); preserve historical outputs with wrapper/overridable evidence paths |
| R2/R2-FIX | 01 confirmation,04 booking/payment,05/07 cancellation;09 | Live hold cancel denial, paid cancel proportional promo→points, retry/concurrent no double credit; payment history snapshot equality; schema UNIQUE DonDatVeID 3 NF remains unchanged |
| R3 role/ownership/scope/grants | 03–07 and 09; shared controls also do guard smoke | Reuse R3 B permission probes/current R8 matrix; public/non-role/no-grant/partial grants/exact AND gates, unauthorized API calls=0 for hidden sections; direct API still protected |
| R4/R5/R7 functional/forms/features | Affected 04–07 then 09 full | Hydrated edit fields/createOnly/editOnly/enum values/body[]/null/0; invalid IDs/UTF 8 limits/numeric/dates/status/ownership; gallery/reviews/full reference/report data |
| R6 historical decisions | Everyphase diff guard;09 verify history | No schema/SP/data transformation; compare existing history and snapshots after reads and intended fixture actions; accepted historical findings not reopened for aesthetics |
| R8 candidate 45 UC | Everyphase preserve traceability;09 rerun all 45 | UC_TRACEABILITY_FINAL IDs retained; record candidate functional result and linked UI evidence. Previous PASS cannot substitute new candidate browser results |
| DBreset/verify/integration | 09 full integration fixture, not every cosmeticphase | npm.cmd run db:reset -- --database=<approved-disposable-name>; npm.cmd run db:verify -- --database=<same-name>. First prove scripts accept target and never point reset at CinemaBookingDB; scope/UI has 0 schema/migration changes |
| Backup/migration/security drills | Infrastructure unchanged: retain R8 proof; rerun only if relevant invariant/evidence invalidated | No need to create production backup/restore or alter DB for a UI color/class change. R8 historical proofs stay immutable; new full integration can reuse safe fixture assertions with fresh output path |


### Harness handoff

Existing scripts/uiux/audit.mjs and scripts/r8/common.mjs currently hardcode audit output roots; R8 fixtures are allowlisted. **Không chạy nguyên bản harness để ghi đè historical reports**. Khi implementation bắt đầu, trước capture tạo wrapper hoặc optional evidence-dir support trong test tooling ONLY; keep default behaviors/contracts and exact fixture safeguards; output audit/uiux/implementation/UIUX-XX. Helpers có legacy outputs phải snapshot/restore hoặc redirect rồi prove hashes unchanged. Current planning không sửa harness hay chạy suites.

R8 regressions.mjs có tasks R1/R2 checks, R3 authorization/browser, R4 functional/browser, R5 validation/integrity, R7 browser;09 reuse assertions, đọc fixture/output handling trước chạy. Một acceptance run cần at least frontend/backend/lint/build/contracts, browser all 5 actors/20 routes/18 sections/new states,45 UCcandidate trace và affected R1–R7 integration; DBbaseline 27 tables 125 SP 6 views 21 functions 7 triggers unchanged. Không refresh manifest/seed/schema chỉ để tests pass.

### Evidence and rollback

Mỗi phase ghi source diff/fingerprints, finding/task coverage, screenshots 390/1440 +sixwidth DOMreadings, keyboard/AX/error associations, request counts/payloads/statuses (redact Authorization/password/token), positive/negative grant scenarios, test exit codes, limitations và DONE review. Compare numeric snapshot/history, không chỉ text format. Copy source baseline path/index evidence, không beautify seed images. Nếu assertion hoặc flow fail: isolate/revert UI change đúng phase, giữ Backend/business policy; rerun impacted checks vàfull 09 khi shared style/state risk. Không nhận PASS từ skipped checks. Không deploy production trong roadmap acceptance.

## 30. Risks / Constraints

| Risk/constraint | Control |
| --- | --- |
| R8 source invariant vs upgrade | Future frontend hashes intentionally change onlycandidate UI, historical proof immutable; new candidate regression required |
| Global CSS blast radius | 02 tokens/pilot before 04–07; each consumer checked; no bodyoverflowhidden blanketfix |
| Partial lookup grants | Lookuponlyallowedreads, preservemanualIDs/currentvaluefallback; neveraddgrant or newendpoint |
| Seatgeometrydata | ExistingDTOrow/number sufficient logical grouping; no actualaisle/screenorientationdata →neutralcaption, nofabrication |
| Castcandidatehydration | Roundtripexistingarrays/roles/[] andinvalid cases; raw fallback +DEFERREDif unprovable; no silent emptywrite |
| Draft/context vs statecontracts | Onlyintent/focus overlays existingreset; no autosave/session persistence or query/route change; scope/revokeclears |
| Pending/notice races | Capturetarget, guardentity/generation; distinguish completedwrite/readreloadfailure; no automaticmutationretry |
| A 11 y auditfinite | Use actual keyboard/AX/contrast/error evidence; targetexceptions; nativefocusbaseline; no certification claim |
| Seedimages/data | CurrentseedURLsnotproductiondesignfixtures; keeprealrenders, no beautification/datacleanup for screenshots |
| Evidence/tooling outputs | Parameterize/wrap before implementationtests; current R8/UIUXharness hardcoded output protection; newfoldersnotoverwrite |
| Preexisting worktree | Planning snapshots preserve existingdeletions/changes; do notrestoreunrelatedfiles |
| Backend/DBscope | 0backend/rawSQL/SP/schema/migration changes for UI; fixtureonlyfuturetesting with targetguard, neverresetmain |

## 31. Complexity Estimates

| Scope | Complexity | Reason / risk |
| --- | --- | --- |
| UIUX-01 Safety & Accessibility Foundation | MEDIUM | P1 destructive intent và semantic fixes chạm nhiều entry nhưng không đổi transaction. HIGH — xác nhận hủy suất chạm tác vụ cuối cùng có bồi thường; payload/state phải nguyên vẹn. |
| UIUX-02 Design System & Shared Primitives | LARGE | Dùng chung trên 5 actor; native form semantics và cascade có blast radius rộng. HIGH — wrapper có thể đổi submit type, ref, controlled state hoặc format số. |
| UIUX-03 Navigation, IA & Context | MEDIUM | Nhóm task và recovery trên routes sẵn có; cần kiểm từng partial grant. HIGH — nhãn/group/context có thể vô tình bypass guard hoặc giữ draft ngoài scope. |
| UIUX-04 Public & Customer Flows | LARGE | Journey dài và renderer ghế chạm booking; hợp nhất copy/state trên nhiều routes. HIGH — seat IDs/availability, return navigation và server totals là contract quan trọng. |
| UIUX-05 Manager Portal | LARGE | Nhiều scoped resource forms, asynchronous scope switching và partial grants. HIGH — scope/room context và lookup có thể gọi API không được cấp quyền. |
| UIUX-06 CSKH Portal | MEDIUM | Queue/detail/timeline hữu hạn; giữ notice và pending phải gắn đúng complaint. HIGH — async refresh có thể đặt notice hoặc mutation cho complaint mới chọn. |
| UIUX-07 Admin Portal & Dense Data | LARGE | 18 sections, RBAC/assignments và two-way cast/lookup adapters; nhiều edit contracts. HIGH — cao nhất tổng thể do số section, exact grants, immutable fields, [] semantics và cast replacement. |
| UIUX-08 Responsive, Interaction & Visual Polish | MEDIUM | Kiểm 44 views×6 widths sau adoption; CSS/focus refinements có scope. MEDIUM — cascade, overlays/sticky actions, table/seat local scroll có thể che focus. |
| UIUX-09 Final UI/UX Regression & Acceptance | LARGE | Full actor/grant/browser coverage và 45 UC/R1–R8 đối chiếu candidate. HIGH — thiếu evidence dễ nhầm UI score với functional/release certification. |
| SeatMap narrow renderer | MEDIUM | LEVEL 4, logical grouping and all states/keyboard/six widths; booking integration riskHIGH |
| Cast editor narrow candidate | MEDIUM | LEVEL 4, adapter/read/write/empty/invalid/fallback; movie contract riskHIGH |
| Navigation refinement | MEDIUM | 18 Admin keys + Manager groups + Customer recovery/CSKH contexts; exact guards riskHIGH |
| Dense data normalization | LARGE | 18 schemas +11/16 cols+detail/actions/forms/RBAC/status/null; per-section regression |
| Overall roadmap | LARGE | Incremental adoption across 5 actors/44 views, foundation and full acceptance; no hours/day guesses |

## 32. DONE Criteria per Phase

| Phase | DONE gate (all required, not just screenshot) | Required regression |
| --- | --- | --- |
| UIUX-01 | Ba action Manager đều xác nhận đúng entity, cancel không gửi write; semantic main/nav/table đúng; auth lỗi có summary/help association và focus recovery; contrast light eyebrow kiểm lại; không mất native focus. | R2 cancel hold còn hiệu lực bị chặn; paid cancel/no refund/points đúng; retry không double-credit; R3 Manager ngoài scope/thiếu grant bị chặn; R5 auth và readonly email giữ nguyên. |
| UIUX-02 | Token registry có consumers; primitives có contract ngắn và pilot PASS; 4 class có style đúng; không framework/dependency mới; không wrapper che guard hoặc state; roadmap adoption rõ. | R1 date helpers không đổi; R4/R7 edit hydration/createOnly/editOnly; R5 nullable/[]/0 và enum validation; R3 hidden controls không phát API; booking totals chỉ display. |
| UIUX-03 | Task grouping và context spec được adopt shell; account/fallback có recovery; complaint link tìm được; dirty/discard/focus policy dùng thống nhất. Finding cross-portal chỉ CLOSED sau đủ evidence 05–07/09. | R3 route role vs permission AND, Manager assignments, CSKH dual-grant; R4/R7 onSelect/Bỏ chọn hydration; R5 ownership; 010 return intent triển khai ở 04. |
| UIUX-04 | Filter không outer overflow; SeatMap giữ row identity và mọi prop/action; safe return không mở redirect ngoài/khác actor; customer copy không còn DB jargon, vẫn nêu payment mô phỏng; owned history/complaint full fields/states PASS. | R1 timezone/date-only/deadline; R2 same seats/products/promo body, max 10 seats/products bounds, server promo/pricing/conflicts/payment/history/compensation; R3 ownership/write guards; R5 errors; R7 gallery/reviews/complaints. |
| UIUX-05 | Task nav chỉ tới sections có grant; rạp/phòng/form edit context rõ; manual ID fallback hoạt động khi thiếu lookup grant; 4 forms hydrated và scope stale response không xuất hiện; room/seat/show cancel confirm 01 vẫn đúng. | R3 assignments/ownership/resource-scope/partial-grants; R1 DATE_ONLY/UTC showtime; R2 paid/hold cancel/no-double-credit; R4/R5 conflict/validation; R7 full pricing/edit status/revenue. |
| UIUX-06 | Notice success survive refresh cho đúng complaint; failed refresh phân biệt write thành công với load fail; busy khóa cùng target và released khi lỗi; đầy đủ order/tickets/food/payments/points/history còn đọc; reference thiếu quyền không fetch. | R3 AND-grants/ownership; R5 processing/status validation; R6 append-only history; R7 reference completeness; R1 times; 014 Admin/image acceptance tiếp nối 07, global close 09. |
| UIUX-07 | 18 section descriptors/headers/action identity được map; users/movie mobile vẫn truy cập đủ fields/actions; lookup fallback không cần thêm grant/API; cast structured editor payload-equivalent hoặc candidate defer có evidence contract gap; Admin/image pending và complaint notices scoped PASS. | R3 exact section + per-action AND gates (including reference/process/grants), R4/R7 create/edit payload/hydration, R5 validation/immutable columns/enums/[] vs null, R1 dates/times, R2 show cancel/history; global 008 gồm Manager verification 09. |
| UIUX-08 | Không reproduced outer overflow/hidden action; local table/seat scroll giải thích và keyboard reachable; focus không bị sticky che; all targets flag triaged; typography/copy/spacing cùng baseline identity; browser limitations ghi thật. | Full frontend tests/lint/build và focused R1/R2/R3/R5/R7 browser sau global CSS; 45 UC routes/CTA smoke; no data/API delta. 09 chạy full acceptance. |
| UIUX-09 | 45/45 UC PASS; no new P0/P1 hoặc contract regressions; all 22 findings có fixed/verified hoặc explicitly scoped accepted candidate evidence; toàn 44 views+18 sections và new states traced; report observed/not-run chính xác; same identity source diff reviewed. | R1 datetime/R2 3 NF compensation and races/history/R3 role ownership scope/R4 forms/R5 validation/R6 history/R7 features/R8 release baseline. Không claim RELEASE READY mới nếu required check còn BLOCKED. |

## 33. Final Acceptance Strategy

09 dùng production dist candidate, giữ tất cả 20 paths và 45 UC, kiểm 5 actors Public/KH/Manager/CSKH/Admin với full/partial/no grant và wrong-owner/scope. Evidence cần positive và negative network assertions; screenshot đẹp không chứng minh permission/payload.

Matrix gồm visual consistency/identity; six widths; keyboard/focus/labels/error association/contrast/table semantics/skip; loading/empty/error/success/pending/disabled/readonly; destructive dismiss/accept; login return; booking/SeatMap/product/promo/hold/payment/history; Manager 4 resource forms/dashboard/revenue; Support reference/no-reference/timeline/process/status; gallery/image; Admin 18 CRUD/grants/assignment/cast/reports.

45 UC trace dùng IDs từ [R8 traceability](../audit/final/r8/UC_TRACEABILITY_FINAL.md), results mới từ candidate; counts 112backend/40frontend/56browser là previous baseline, không được tuyên bố rerun trong planning. Không ép screenshot equivalence pixel tuyệt đối sau intended refinement, nhưng compare unchanged identity/semantics/payload. Không ép UX scores 5/5; scores parent cho nested chỉ reference.

Closure: findings table giữ priority/confidence gốc, root coordinator + all continuation tests; P1 must fixed 01 và reverified 05/09, no new P0/P1 hoặc functional regressions. HIGH-CONFIDENCE flows phải được tái hiện lúc implementation. Cast editor là candidate: nếu adapter contract hiện hữu không thể chứng minh roundtrip thì giữ JSON fallback và ghi DEFERRED/contract evidence, không đóng giả finding 008 hoặc đòi Backend mới; final UX verdict phải nêu phần chưa hoàn tất thay vì all-findings-fixed. Không để required regression BLOCKED rồi gọi release accepted. Real device/AT thiếu environment ghi NOT RUN và đánh giá phạm vi acceptance, không WCAG certification.

Artifacts mới theo phase nằm audit/uiux/implementation/UIUX-XX; historical audit vàR8 unchanged hashes. Không deploy/merge/đổi DBmain trong acceptance. Từng phase exit cần diff scope, verified tasks/screens/components, actual test exit codes/evidence và known limitations.

## 34. Final Target State

Cùng Cinema Booking navy/blue system: hierarchy/nav/context rõ, forms/control/table/actions đồng bộ, mobile/desktop usable, status/loading/empty/error/success dễ nhận biết; Manager vận hành scoped tasks, CSKH xử lý complaints/reference/timeline, Admin quản trị dense data và exact grants, booking chọn ghế theo hàng. Identity/React architecture/business flow/R8 contracts remain recognizable. Không brand/palette/framework/backend/DB mới. Final target phải chứng minh bằng candidate browser/functional evidence; roadmap READY không có nghĩa target đã đạt.

## 35. Final Implementation Order

Recommended serial order: **UIUX-01 → UIUX-02 → UIUX-03 → UIUX-04 → UIUX-05 → UIUX-06 → UIUX-07 → UIUX-08 → UIUX-09**. Dependency graph allows 04–07 independent after  03 but shared CSS/primitives edits need coordination; không skip foundation/DONE. Start only next explicit implementation task, current planning stops with documents. **READY TO START UIUX IMPLEMENTATION** after planning coverage/source preservation validation; all 9 phases PLANNED / NOT STARTED. Source of truth docs/UIUX_MASTER_ROADMAP.md.
