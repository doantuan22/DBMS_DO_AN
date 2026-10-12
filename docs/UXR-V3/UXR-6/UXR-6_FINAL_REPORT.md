# UXR-6 — CSKH & Customer: báo cáo nghiệm thu

**Đã hoàn thành UXR-6A → 6B → 6C → 6D.** Ngày 12/10/2026, baseline `b3d7f59` (UXR-0–5 đã hoàn thành). Cả bốn package **PASS trong phạm vi implementation và acceptance thực đã ghi nhận**. Dừng ở UXR-6; **không triển khai UXR-7**. Những phạm vi chưa kiểm chứng được liệt kê riêng, không suy rộng kết quả thành toàn bộ 44 UC PASS.

| Package | Kết quả | Cải tiến chính |
|---|---|---|
| 6A CSKH | PASS | Workspace 3 vùng desktop, tablet 2 cột, mobile queue/case/back, deep link và contextual confirmation; giữ keyed drafts/generations/write lock |
| 6B Home/Catalog/Cinema | PASS | Hierarchy trắng–xanh, actual poster/group/status, applied filters, lịch chiếu trước synopsis, lịch tại rạp theo named movie và asset fallback |
| 6C Booking | PASS | Các bước ghế/sản phẩm/kiểm tra, summary sticky desktop và anchor mobile, pending controls, receipt + own detail/payment, server truth |
| 6D Account/after booking | PASS | Account navigation, own order search/filter/refresh, stored amounts/tickets/attempts, payment confirmation, profile/auth/password và own complaint workflow |

## Trải nghiệm và ranh giới nghiệp vụ

CSKH có `/support/complaints` và `/support/complaints/:id`, giữ `/support` tương thích. URL chỉ chứa status/priority an toàn; search/type/note không đưa vào URL. Chuyển filter/case giữ draft theo actor/case. Refresh hỏi xác nhận và phục hồi session draft; discard là hành động riêng. Processing và status không gộp mutation; timeline chỉ có một nơi, cập nhật từ response đã được xác nhận. Read trễ A→B đã được chạy thực với delay transport, không ghi đè case B. Queue denial không giữ PII/action của case cũ.

Home và discovery dùng dữ liệu thực hiện có. Không tạo phim/suất nổi bật, inventory hay promotion giả. Bộ lọc phim chỉ gửi search/genreId/status được hỗ trợ; rạp tìm tên/địa chỉ trên collection hoàn chỉnh. Lịch tại rạp chọn phim có tên rồi gọi movie-showtimes cùng cinemaId cố định. Ảnh giữ tỷ lệ, có fallback khi request ảnh thất bại. Metadata, ngày/giờ và CTA gắn đúng tài nguyên.

BookingContext giữ remount theo showtime/actor, loadSeats generation, promotion preview invalidation, original limits và pending create lock. Chỉ tách composition. Từng giá lấy từ API; tổng preview trước ưu đãi chỉ hiển thị khi API promotion trả. Tổng cuối và hold lấy response tạo đơn, không tự cộng thành tổng nguồn sự thật ở browser. Đã kiểm tra competing Customer tạo cùng ghế → UI 409 → refresh/clear selection; Admin tạm dừng promotion sau valid preview → create bị từ chối, giữ ghế đã chọn và không tiêu hao quota. Đơn thành công có đường tới detail/payment.

Orders, payments và complaints chỉ dùng existing own APIs. API/SP từ chối foreign order/payment/case; UI không hiển thị receipt/nội dung cũ khi lỗi. Payment giữ create attempt/result logic và hiển thị rõ mô phỏng; dialog xác nhận mã đơn, phương thức và số tiền. Failed attempt vẫn nằm trong history khi retry thành công; duplicate confirm tạo đúng một attempt, replay không cộng điểm lại. Profile chỉ gửi allowlisted editable fields, role/email readonly; registration không chọn role. Complaint dùng selector đơn có mã/phim/ngày thực, trạng thái và timeline do CSKH/server cập nhật.

## Source và routes

25 file source cũ được thay đổi, cộng feature files và tests mới. [source-audit.json](source-audit.json) liệt kê đầy đủ existing changes; [SCREEN_SPEC.md](SCREEN_SPEC.md) và [API_UI_CAPABILITY_MATRIX.md](API_UI_CAPABILITY_MATRIX.md) ghi thiết kế/contract.

- CSKH: `SupportPortal`, `SupportWorkspaceView`, `supportNavigation`, additive `supportDraftStore.hasDrafts`, feature CSS; Support route wildcard được component kiểm tra local path và StaffShell chỉ đổi link queue CSKH.
- Discovery: Home/Movies/MovieDetail/Cinemas/CinemaDetail; MovieCard/Grid, CinemaList/Gallery, ShowtimeBrowser; `MediaFrame`, `CinemaSchedule`, `discoveryModel`, feature CSS.
- Booking: `BookingPreparation` giữ business hooks, composition `BookingExperience`; SeatMap/ProductPicker thêm optional disabled (default behavior staff không đổi); shared money formatting và journey CSS.
- Account: Orders/OrderDetail/PaymentPage/Complaints/ComplaintDetail/Login/Register/Profile; `AccountNavigation`, `OrderReceipt`, `AuthFrame`, `PasswordInput`, `useCustomerResource`, `useFormWriteLock`, UTF-8 validator và account CSS.
- Tests: 4 support tests + 4 customer tests mới; 3 existing tests chỉ cập nhật router/presentation assertion phù hợp refactor, giữ business assertions.

Không đổi Backend, Database, SP, REST clients, shared contracts, auth/context, route permission guards hoặc workflow Admin/Manager/staff. UXR-0–5 documents/evidence giữ nguyên. Runtime vẫn React → REST → Express → SP → SQL Server.

## Kiểm thử và bằng chứng

**Lint PASS; frontend 215/215 PASS; backend 205/205 PASS; production build PASS; REST/SP signature check PASS (110 methods/118 calls/0 problems).** Build còn warning chunk JS 792.17kB (>500kB); không dùng warning này để đổi kiến trúc ngoài phạm vi.

Chrome thật với Express/API/SP trên test DB ID9: **111 checks PASS** (6A 10, 6B 29, 6C 10, 6D 48, regression 14), cộng **75 capture-only checks** trước triển khai. Responsive đủ năm widths, keyboard native dialog/Escape và error focus. Thực sự tạo/sửa fixture và kiểm tra lại API; cleanup mỗi fixture ghi remaining=0. Source guard kiểm tra 163 file baseline và không có thay đổi protected areas. DB final **PASS 3 checks: counts trở về baseline, không còn fixture UXR-6 và 169 SQL module definitions khớp manifest**, được ghi trong [database-final.json](database-final.json).

Chi tiết kết quả, commands, giới hạn và lỗi đã sửa: [TEST_EVIDENCE.md](TEST_EVIDENCE.md). Checkpoint riêng: [6A](6A_REPORT.md), [6B](6B_REPORT.md), [6C](6C_REPORT.md), [6D](6D_REPORT.md). Các file `*-browser.json` và before/after screenshots là bằng chứng browser/API, không chỉ SSR render.

## Capability gaps và NOT VERIFIED

**BLOCKED theo contract, ngoài thao tác UXR-6 hiện có:** Customer tự hủy/hoàn tiền/xóa lịch sử; provider payment thật; aggregate cinema-showtimes mới; independent pricing quote không cần promotion. Không thêm nút dead-end hoặc workaround đổi nghiệp vụ. Khi thiếu quote, summary trình bày đơn giá hiện có và final total sau tạo đơn.

**NOT VERIFIED:** physical touch, Edge/Safari, screen reader/axe toàn diện; countdown từ đơn mới đến server expiry trong cùng session; mọi revoke/logout/pending race và toàn bộ SQL concurrency matrix. Đơn expired thật không có nút thanh toán, unit deadline tests, CSKH read trễ, seat conflict và promo availability đã được xác minh. Không có blocker được xác định cản trở implementation UXR-6 trong phạm vi REST/SP hiện hành.

Đáp ứng hướng nâng cấp CSKH/Customer trong Blueprint §§7–9 và §11.7, giữ nghiệp vụ đã kiểm chứng. Có thể dùng kết quả này làm đầu vào UXR-7 để mở rộng cross-role/lifecycle/device coverage; đây là đánh giá khả năng chuyển giai đoạn, **không phải bắt đầu UXR-7**.
