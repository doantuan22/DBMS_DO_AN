# R8.3 Final Re-acceptance

> **Ghi chú lưu trữ (10/10/2026):** Theo yêu cầu thu gọn `docs`, evidence, contracts, archive và tài liệu hỗ trợ đã được xóa khỏi workspace. Các nhãn case/selector trong báo cáo là tham chiếu lịch sử, không còn liên kết tới raw artifact. Kết quả và verdict được ghi trong báo cáo không thay đổi.


**R8.3 ACCEPTED — PHASE R8 DONE.**  
Ngày: 10/10/2026, Asia/Saigon. Baseline: 45 Use Case; ADM-17 ngoài phạm vi.

## Quyết định

R8.3 được nghiệm thu lại sau khi hotfix ADM-07 đã xử lý hai lỗi `R83-FE-01` (ảnh cũ còn hiển thị và mutation sai rạp) và `R83-FE-02` (retry gọi sai API). Kết quả hiện hành là **45/45 Use Case PASS**, **43/43 Frontend gaps RESOLVED**, Critical 0, High 0. Báo cáo lịch sử [R8.3 Final Acceptance](R8_3_FINAL_ACCEPTANCE_REPORT.md) giữ nguyên verdict 44/45 PARTIAL tại checkpoint trước hotfix.

## 44 Use Case tái sử dụng evidence

Không chạy lại 44 browser journeys vì prompt cho phép kế thừa evidence còn hợp lệ. Đã đối chiếu đủ 45 record trong verification-45.json: 44 record ngoài ADM-07 đều PASS, cleanup PASS và source freshness được ghi nhận; 39 artifact duy nhất mà các record tham chiếu đều tồn tại. Các record liên kết primary browser case, HTTP, typed Stored Procedure, SQL assertions, no-write và authorization/ownership cases khi UC yêu cầu.

So sánh code sau lần evidence đó cho thấy các thay đổi source còn lại là formatting, ADM-07 hotfix và một cleanup trong `MovieReviews`. Cleanup bỏ lần tăng request generation khi unmount; mounted guard cùng per-request generation check vẫn loại response sau unmount hoặc response cũ. Vì vậy behavior KH-13, API và contract không đổi; prior KH-13 browser proof còn phù hợp. `feedbackController.js` chỉ được format lại. SQL chỉnh whitespace, token/literal/`GO` giữ nguyên và parity hiện tại đạt 159/159 modules.

## ADM-07 fresh browser/API/SQL verification

Chạy mới trên React AppRoutes → Express → typed Stored Procedure → SQL Server Test DB, với Test DB identity được preflight trước run. HEAD là `98a542efdb3d6d70ac2428b55bcb134e85754f4a`; source manifest fingerprint bao phủ 117 production/harness inputs trong acceptance manifest. Source manifest ghi rõ working tree dirty vì các thay đổi re-audit chưa commit.

Lệnh đã dùng tại thời điểm nghiệm thu (harness phase sau đó được gỡ trong đợt dọn `scripts`):

```text
node scripts/r8-2-adm07/run.mjs --output=.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748 --confirm-target=<preflight-generated exact identity token>
node scripts/r8-2-adm07/audit.mjs --output=.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748
```

Kết quả: **19/19 PASS**, chia riêng **7 `REAL_BROWSER_SQL`** và **12 `CONTROLLED_TRANSPORT`**. Controlled Transport xác minh thứ tự response, 503, retry và pending mutation; không được tính thành SQL mutation evidence.

| Test ID | Evidence type | Kết quả |
|---|---|---|
| HF-ADM07-CINEMA-CRUD-SETUP | REAL_BROWSER_SQL | PASS |
| HF-ADM07-IMAGE-CRUD-COVER | REAL_BROWSER_SQL | PASS |
| HF-R83-FE01-503-NO-STALE-NO-WRITE | CONTROLLED_TRANSPORT | PASS |
| HF-R83-FE02-IMAGE-RETRY | CONTROLLED_TRANSPORT | PASS |
| HF-R83-FE02-CINEMA-LIST-RETRY | CONTROLLED_TRANSPORT | PASS |
| HF-ABA-LATE-SUCCESS | CONTROLLED_TRANSPORT | PASS |
| HF-ABA-LATE-ERROR | CONTROLLED_TRANSPORT | PASS |
| HF-INVALID-OWNERSHIP-NO-WRITE | REAL_BROWSER_SQL | PASS |
| HF-PENDING-CREATE-SWITCH | CONTROLLED_TRANSPORT | PASS |
| HF-PENDING-UPDATE-SWITCH | CONTROLLED_TRANSPORT | PASS |
| HF-PENDING-DELETE-SWITCH | CONTROLLED_TRANSPORT | PASS |
| HF-PENDING-COVER-SWITCH | CONTROLLED_TRANSPORT | PASS |
| HF-MUTATION-REFRESH-LATE-READ | CONTROLLED_TRANSPORT | PASS |
| HF-MUTATION-ABA-LATE-ERROR | CONTROLLED_TRANSPORT | PASS |
| HF-DOUBLE-CREATE | CONTROLLED_TRANSPORT | PASS |
| HF-AUTHORIZATION-CURRENT-GRANT | REAL_BROWSER_SQL | PASS |
| HF-AUTHORIZATION-OTHER-ROLES | REAL_BROWSER_SQL | PASS |
| HF-RESPONSIVE-KEYBOARD | REAL_BROWSER_SQL | PASS |
| HF-ADM07-DELETE-EMPTY-CINEMA-REGRESSION | REAL_BROWSER_SQL | PASS |

Tất cả 15 SQL assertions PASS; có 8 no-write fingerprints. Các case xác minh A→B→A và response đảo thứ tự, GET ảnh B trả 503 không lộ ảnh A, retry đúng cinema/image API và phục hồi tương tác, mutation đang pending khi đổi rạp, ownership/authorization denial, single-cover, double-submit, delete rạp rỗng và keyboard/responsive.

## Kết quả theo vai trò và Frontend gaps

| Vai trò | Tổng | PASS | PARTIAL | BROKEN | MISSING |
|---|---:|---:|---:|---:|---:|
| Customer | 14 | 14 | 0 | 0 | 0 |
| Manager | 9 | 9 | 0 | 0 | 0 |
| CSKH | 6 | 6 | 0 | 0 | 0 |
| Admin | 16 | 16 | 0 | 0 | 0 |
| **Tổng** | **45** | **45** | **0** | **0** | **0** |

42 gap đã nghiệm thu trước đó vẫn RESOLVED; `R71-FE-ADM-07` được xác minh lại trong run mới. Tổng **43/43 RESOLVED**. I-11, I-15, I-19 và I-21 giữ kết quả đã nghiệm thu; không có issue Critical/High mở.

## Regression, Database safety và quality gates

Test chỉ mutation trên SQL Server Test DB `CinemaBookingDB_R0_R81_20261010_3d49fc44`, server `DESKTOP-E67DPCV`, `database_id=48`, GUID `33876608-D109-43B5-ACEC-0B84C2639A73`. Main `CinemaBookingDB` được fingerprint trước/sau: preservation PASS, `mainWrites=0`. Fixture cleanup PASS, before/after fingerprint giống nhau. Final read-only audit PASS: 27 tables, 159 modules, không còn test transaction/user; SQL foreign key, CHECK và trigger integrity checks PASS. Không đổi schema, Stored Procedure, API contract hoặc database nghiệp vụ.

| Gate | Kết quả |
|---|---|
| Backend tests | 192/192 PASS; 0 skipped |
| Frontend tests | 65/65 PASS; 0 skipped |
| Frontend lint | PASS, không warning |
| Production build | PASS, 93 modules |
| Prettier format check | PASS |
| Backend no-SQL audit | PASS, 66 runtime files |
| DB service contract check | PASS, 112 methods / 120 calls, 0 problems |
| SQL source parity | PASS, 159/159 modules |
| ADM-07 fixture cleanup / Main preservation | PASS / PASS, Main writes 0 |

Build còn cảnh báo Vite về bundle 545.57 kB vượt ngưỡng 500 kB; build thành công. Đây là cảnh báo hiệu năng không chặn acceptance.

## Kết luận chính thức

Tại thời điểm nghiệm thu, acceptance manifest ghi danh sách 45 UC, 19 ADM-07 checks, 15 SQL assertion IDs, 8 no-write fingerprints, source hashes và DB identity. Theo đợt thu gọn `docs` ngày 10/10/2026, manifest và raw artifacts trong `docs/evidence` đã bị xóa khỏi workspace; báo cáo này giữ lại kết quả, còn raw run details từng nằm dưới ignored `.audit-output/r8-2-adm07/r8-3-reacceptance-20261010-163748/` trên máy kiểm thử.

**R8.3: ACCEPTED. PHASE R8: DONE.** Không chuyển sang phase khác.
