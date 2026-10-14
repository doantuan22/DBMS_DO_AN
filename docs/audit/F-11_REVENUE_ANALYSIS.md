# F-11 — "Tiền thực thu" và doanh thu được ghi nhận

**Trạng thái: ĐÃ CHỐT bằng quy tắc nghiệp vụ (2026-10-14).** Các phương án C và D bên dưới bị loại: hệ thống **không có cơ chế hoàn tiền** và **không quy đổi điểm ra tiền mặt**. Phương án A được thực hiện và mở rộng: doanh thu là **tiền thực thu** = `TongTienVe + TongTienDoAn − TienGiamGia − TienGiamBangDiem` của đơn có thanh toán thành công; phần trả bằng điểm không vào doanh thu; hủy suất không trừ doanh thu đã thu. Chi tiết và bằng chứng: [FINAL_BUSINESS_RULE_IMPLEMENTATION.md](FINAL_BUSINESS_RULE_IMPLEMENTATION.md). Phần dưới đây giữ nguyên làm lịch sử phân tích (số liệu trước khi có thanh toán bằng điểm).  
**Bằng chứng tái lập:** `node scripts/audit/revenue-analysis.mjs` (chỉ đọc, `CinemaBookingDB_Test`) → `.audit-output/acceptance/revenue/f11-reconciliation.json`.

## 1. Câu hỏi

Dashboard và báo cáo Admin gọi chỉ số là **"Tiền thực thu"** và tính cả các đơn đã bị hủy do hủy suất chiếu. Điều đó có đúng không, và nó khác "doanh thu ghi nhận" ở điểm nào?

## 2. Hệ thống đang làm gì (đối chiếu mã nguồn SQL)

| Nơi hiển thị | Nguồn | Điều kiện một đơn được tính | Mốc ngày |
|---|---|---|---|
| Dashboard Admin — "Tiền thực thu toàn thời gian" | `sp_Admin_Dashboard` | có ≥ 1 `THANHTOAN.TrangThai = N'Thành công'` | — (toàn thời gian) |
| Báo cáo Admin — "Tiền thực thu" | `sp_Admin_Report_Revenue` | như trên | ngày kinh doanh (UTC+7) của lần thanh toán thành công **gần nhất** |
| Báo cáo Manager | `sp_Manager_Revenue` | như trên, theo `RapID` | như trên |
| View `vw_DoanhThuTheoRap` | view | như trên | — |

Cả bốn dùng **cùng một định nghĩa: tiền mặt đã thu (cash basis)** — *không* phụ thuộc `DONDATVE.TrangThai`. Số tiền của một đơn là snapshot `TongTienVe + TongTienDoAn − TienGiamGia`.

Các sự kiện vòng đời liên quan:

* `sp_Showtime_CancelCascade` khi hủy suất: đơn `Đã thanh toán` → `Đã hủy`, vé → `Đã hủy`, ghi `BOITHUONG_HUYSUAT` và cộng `HOSOKHACHHANG.DiemTichLuy`. Comment trong SP: *"No payment writes and no reversal"* — **không hoàn tiền, không đổi `THANHTOAN`**.
* Điểm tích lũy chỉ được **cộng** (đăng ký/thanh toán/bồi thường); không có thủ tục nào đổi điểm thành tiền hoặc giảm giá.
* Trạng thái `THANHTOAN = Đã hoàn tiền` và `DONDATVE = Hoàn tiền` tồn tại trong CHECK constraint nhưng **không có thủ tục nào ghi chúng** (kiểm chứng: 0 dòng ở mọi lần chạy; `sp_StaffBooking_Cancel/Detail` chỉ đọc).

## 3. Số liệu đối chiếu (CSDL test, 2026-10-14, sau khi dọn dữ liệu kiểm thử)

| Nhóm đơn có thanh toán thành công | Đơn | Tiền | Điểm bồi thường |
|---|---:|---:|---:|
| Suất đã chiếu xong (`Hoàn thành`) | 3 | 280.000 | 0 |
| Suất chưa chiếu (còn hiệu lực) | 20 | 2.517.500 | 0 |
| **Đơn bị hủy do hủy suất** | **4** | **762.500** | **607** |
| Hủy vì lý do khác | 0 | 0 | 0 |
| **Tiền thực thu (cash received)** | **27** | **3.560.000** | |

* Dashboard, báo cáo Admin và view đều bằng **3.560.000** ⇒ ba nguồn **nhất quán** với nhau (không có lỗi tính toán).
* Chỉ số "Đơn đã thanh toán / hoàn thành" của dashboard là **23** đơn (loại đơn đã hủy) trong khi tiền ứng với **27** đơn ⇒ hai ô cạnh nhau dùng hai mẫu số khác nhau, đây là nguồn gây hiểu nhầm thực tế của F-11.
* "Vé theo đơn đã thu" trong báo cáo đếm vé còn hiệu lực nên đơn bị hủy đóng góp **0 vé nhưng vẫn có tiền vé** trong "Tiền vé snapshot".

## 4. Khái niệm — hai con số đều đúng, nhưng trả lời hai câu hỏi khác nhau

| | Tiền thực thu (hiện tại) | Doanh thu được ghi nhận (revenue recognised) |
|---|---|---|
| Câu hỏi | Rạp đã nhận bao nhiêu tiền? | Rạp đã *cung cấp dịch vụ* và được giữ lại bao nhiêu? |
| Đơn đã thu tiền nhưng suất chưa chiếu | tính | **chưa** (nghĩa vụ chưa thực hiện) |
| Đơn bị hủy suất, tiền không hoàn | tính | **không** (dịch vụ không được cung cấp; thay bằng nghĩa vụ bồi thường) |
| Đơn đã chiếu xong | tính | tính |
| Ví dụ với số liệu trên | 3.560.000 | 280.000 (đã chiếu) — 2.517.500 là "đã thu chưa ghi nhận", 762.500 là "đã thu nhưng dịch vụ bị hủy" |

Hệ thống hiện chỉ cài đặt cột bên trái và gọi đúng tên (*thanh toán thành công*). Điểm cần quyết định là việc **đơn bị hủy do hủy suất** vẫn nằm trong tổng và việc điểm bồi thường (1.000 VND = 1 điểm, không đổi được) có giá trị kinh tế hay không.

## 5. Phương án đề xuất (chưa thực hiện — cần phê duyệt)

| Phương án | Nội dung | Phạm vi thay đổi | Rủi ro |
|---|---|---|---|
| **A. Giữ nguyên + minh bạch hóa** *(rủi ro thấp nhất)* | Giữ cash basis. Thêm vào báo cáo/dashboard các cột phụ **"trong đó: đơn bị hủy do hủy suất (n đơn, X VND)"** và **"chưa chiếu"**; đổi nhãn đơn "Đơn đã thanh toán/hoàn thành" thành "Đơn còn hiệu lực" kèm "Đơn có tiền thực thu" | Thêm cột vào `sp_Admin_Dashboard`, `sp_Admin_Report_Revenue`, `sp_Manager_Revenue`; chỉnh nhãn UI. Không đổi quy tắc | Thấp. Thay đổi hợp đồng response (thêm trường) |
| **B. Thêm chỉ số "Doanh thu ghi nhận"** | Giữ "Tiền thực thu", thêm chỉ số thứ hai = đơn có thanh toán thành công **và** suất `Hoàn thành` (hoặc đã kết thúc), loại đơn hủy | Thủ tục báo cáo + UI + tài liệu định nghĩa; cần chốt thời điểm ghi nhận (kết thúc suất / bắt đầu suất) | Trung bình: cần định nghĩa kế toán thống nhất; báo cáo theo ngày khác nhau |
| **C. Trừ bồi thường khỏi doanh thu** | Quy đổi điểm bồi thường thành giá trị tiền (1 điểm = 1.000 VND?) và trình bày "thực thu ròng" | Cần chính sách đổi điểm — hiện **không có** nghiệp vụ đổi điểm | Cao: tạo nghiệp vụ mới |
| **D. Hoàn tiền thật khi hủy suất** | Ghi `THANHTOAN = Đã hoàn tiền`, `DONDATVE = Hoàn tiền`, loại khỏi thực thu | Nghiệp vụ mới (cổng thanh toán, chứng từ, quyền); thay đổi `sp_Showtime_CancelCascade` | Cao: đổi quy tắc đã ban hành ("không hoàn tiền tự nguyện") |

**Khuyến nghị:** A ngay (không đổi nghiệp vụ, hết hiểu nhầm), cân nhắc B khi có yêu cầu kế toán. C/D chỉ khi chủ nghiệp vụ muốn thay đổi chính sách bồi thường.

## 6. Việc cần phê duyệt

1. Chọn phương án (A / A+B / C / D / giữ nguyên).
2. Nếu B: thời điểm ghi nhận doanh thu (kết thúc hay bắt đầu suất chiếu).
3. Xác nhận điểm bồi thường có giá trị đổi/hoàn hay chỉ là điểm thưởng.

Trong khi chờ, hành vi hiện tại được bảo vệ bởi test hồi quy: `E2E-ADM-DASHBOARD`, `E2E-ADM-REVENUE`, `LC-CMP-02` và bước đối chiếu `revenue-analysis.mjs` trong `audit:all`.

## 7. Quyết định (2026-10-14)

1. Chọn: **A** (giữ cash basis, minh bạch hóa) — đã thêm `SoDonHopLe`, `SoDonCoTienThucThu`, `TienThuocDonHuy`, `TongGiaTriThanhToanBangDiem` vào Dashboard Admin, báo cáo Admin và Manager. **B/C/D không thực hiện.**
2. Điểm bồi thường **không** được đổi/hoàn thành tiền; chỉ dùng để giảm tiền vé ở lần đặt sau (1 điểm = 1.000 VND giá trị vé sau khuyến mãi).
3. Phần vé trả bằng điểm không phải tiền thực thu; vé trả 100 % bằng điểm đóng góp 0 đồng.
4. `THANHTOAN = Đã hoàn tiền` / `DONDATVE = Hoàn tiền` là trạng thái legacy trong CHECK constraint, **không thuộc nghiệp vụ đang hoạt động** và không có thủ tục nào ghi chúng.

