# R5.4 — Fixture Matrix

Ma trận được lập sau audit, trước khi viết fixture SQL. Chỉ áp dụng trên test target
đã xác nhận, có Base/Dynamic Seed R5.2/R5.3 còn hợp lệ và các bảng giao dịch trống.
Toàn bộ setup/assertion thuộc một transaction; mặc định ROLLBACK, có opt-in COMMIT
để giữ dataset. Không include vào seed-all. Identity lấy OUTPUT/SCOPE_IDENTITY hoặc
business key thuộc fixture; không hardcode transaction ID.

| ID | Mục tiêu / trạng thái đầu vào | Dependency và cách tạo | Kỳ vọng / assertion | Isolation |
|---|---|---|---|---|
| R54-O-EXPIRED | Order Hết hạn, vé Đã hủy | Customer 1, future open show, ghế A1, một product, CHAOBANMOI; Booking_Create → aging timestamps có kiểm soát → Order_ExpirePending | Ngày đặt trước deadline; quota tăng rồi hoàn; ticket lưu lại nhưng không giữ ghế | Outer transaction; không tạo payment cho order đã expired |
| R54-O-CANCELED | Order Đã hủy do khách | Customer 1, cùng show, ghế A2, một product, CHAOBANMOI; Booking_Create → Order_Cancel | Order/ticket hủy; quota trở lại baseline; giữ snapshot và history | Outer transaction |
| R54-O-PAID | Đã thanh toán sau retry | Customer 1, ghế A3, một product, CHAOBANMOI; booking → Payment_CreateAttempt/UpdateResult Thất bại → attempt khác Thành công | Hai payment ID khác nhau, một failed/one success, amount khớp; points chỉ cộng một lần; quota giữ một lượt | Outer transaction; SP simulation hiện có, không cổng thật |
| R54-O-COMPENSATED | Paid order → canceled show/order + điểm bồi thường | Customer 3, future show khác, hai ghế A1/A2, hai product, CHAOBANMOI; booking/pay → Showtime_CancelCascade bởi Admin | Không còn pending hold tại show hủy; đúng BOITHUONG_HUYSUAT; helper tính điểm từ ticket/food/discount; payment success và snapshots giữ nguyên; gọi cancel lần hai không cộng điểm/lượt nữa | Outer transaction; không direct INSERT compensation/refund |
| R54-O-HISTORY | Paid history cho review | Customer 1, suất Hoàn thành đã kết thúc, ghế A1 đúng phòng; SQL lịch sử có kiểm soát INSERT order/ticket/payment; giá lấy fn_TinhGiaVe, amount từ snapshot SQL | Account tạo trước order; payment attempt/settlement sau order và trước show; paid/ticket hợp lệ; một success; points theo payment contract; không gọi booking cho suất quá khứ | Outer transaction; không sửa thời gian/status suất hoặc tắt trigger |
| R54-O-PENDING | Chờ thanh toán, vé Đã đặt, không food | Customer 2; Booking_Create cuối setup, dùng lại ghế A1 đã được expiry giải phóng | Deadline đúng booking contract và còn hiệu lực tại assertion; lịch sử vé expired vẫn còn; không conflict với vé paid A3 | Outer transaction; không kéo dài hold, fixture cần chạy trong thời hạn thật |
| R54-FOOD | Không / một / nhiều product | History/Pending: không food; Expired/Canceled/Paid: một product; Compensation: hai product | Snapshot DonGia từ SP hoặc không food; SUM(SoLuong*DonGia)=TongTienDoAn, không duplicate order/product | Chung các order phía trên |
| R54-REVIEW-ELIGIBLE | Customer 1 chưa review phim history | Order/ticket/payment history đã hợp lệ → sp_Review_Create 5 sao | Đúng customer/movie, timeline hợp lệ, một review; DB trigger quyết định eligibility | Outer transaction |
| R54-REVIEW-INELIGIBLE | Customer 4 không có lịch sử paid/completed của phim đó | Chỉ dữ liệu đầu vào; negative-probes gọi Review_Create và rollback | Expected 50004; không lưu review sai | Mỗi negative probe có transaction riêng |
| R54-REVIEW-DUPLICATE | Customer 1 đã review phim history | Negative-probes gọi Review_Create lần hai | Expected 50040; review đầu không bị ghi đè | Mỗi negative probe rollback |
| R54-C-NEW | Không linked order; Mới, 0 history | Customer 1 → Complaint_Create | DonDatVeID NULL; status Mới; không history | Outer transaction |
| R54-C-PROCESSING | Linked paid order; Đang xử lý, 1 event | Customer 1 → Complaint_Create liên kết order của mình → CSKH AddProcessing | Parent status theo event XuLyID mới nhất; người xử lý có đủ hai quyền | Outer transaction |
| R54-C-RESOLVED | Linked history order; Đã giải quyết, 2 events | Customer 1 → Complaint_Create → CSKH processing/resolved | Hai event giữ lại, parent khớp latest XuLyID, timestamps không trước complaint | Outer transaction |
| R54-C-CLOSED | Linked compensated order; Đã đóng, 3 events | Customer 3 → Complaint_Create → CSKH processing/resolved → Admin close | Ownership đúng; parent Đã đóng theo history, không direct UPDATE KHIEUNAI | Outer transaction |
| R54-C-REJECTED | Không linked order; Từ chối, 1 event | Customer 2 → Complaint_Create → CSKH AddProcessing Từ chối | NULL order hợp lệ, role/permission và status thuộc contract | Outer transaction |
| R54-C-FOREIGN-ORDER | Customer 4 gửi order của Customer 1 | Chỉ input negative-probes → Complaint_Create | Expected 50041; không lưu complaint sai ownership | Mỗi negative probe rollback |

## NOT APPLICABLE và lựa chọn lịch sử

`Hoàn thành` của order và `Đã sử dụng` của ticket có trong CHECK, nhưng không có
workflow hoàn tất đơn/check-in trong SP hiện hành. Contract order detail xác nhận
state lịch sử không đồng nghĩa workflow mới. Vì vậy **N/A cho đường chuyển trạng
thái Completed/Used trong R5.4**: không tự đổi status để đạt checklist. History
fixture giữ order Đã thanh toán, ticket Đã đặt; review rule chỉ yêu cầu paid/completed
history và start đã qua, không đòi status Used. Ticket snapshot và payment vẫn được
dựng đầy đủ, không dựa riêng vào điều kiện yếu hơn của trigger review.

`Hoàn tiền`/`Đã hoàn tiền` cũng tồn tại ở schema nhưng cancellation hiện hành là
bồi thường điểm, giữ successful payment và không refund. Không tạo refund state hoặc
mechanism. Canceled order sau compensation từng là Paid; cuối fixture nó phải Đã hủy,
không giữ hai trạng thái cùng lúc để khớp chữ trong roadmap.

## Kiểm chứng và cleanup

Static checker chỉ kiểm nguồn, references/signature và các assertion; không mô phỏng
tiền/DB runtime bằng JavaScript. Khi có target an toàn, chạy SQL fixture để kiểm thực
tế monetary snapshot, conflict, quota, points, ownership/history và repeat cancellation.
Default ROLLBACK giữ dữ liệu baseline (identity vẫn có thể bị tiêu thụ). Opt-in COMMIT
giữ 6 order, 7 ticket, 5 food rows, 4 payments, 1 review, 5 complaints, 7 processing
events và 1 compensation. Pending sẽ hết hạn theo đồng hồ thật sau 5 phút; không có
cam kết trạng thái Pending cố định vô thời hạn.

Không có script delete/reset cleanup trong R5.4. Target riêng/rebuild thuộc R5.5;
không xóa history để chạy lại. Fixture từ chối nếu transaction tables đã có dữ liệu.
