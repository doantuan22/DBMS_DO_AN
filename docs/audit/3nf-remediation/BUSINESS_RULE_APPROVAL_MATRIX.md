# BUSINESS RULE APPROVAL MATRIX — CINEMABOOKINGDB
**Dự án:** CinemaBookingDB — Hệ thống đặt vé xem phim trực tuyến  
**Vai trò:** Principal Database Architect & Normalization Expert  
**Tài liệu:** Gate A & Gate B — Technical Design Decision Record  
**Ngày cập nhật:** 13/10/2026  
**Trạng thái phê duyệt:** **GATE A: APPROVED | GATE B TECHNICAL DESIGN: APPROVED (OPTION 1 — 27 TABLES)**  

---

## 1. Giới thiệu và Căn cứ Phê duyệt

Tài liệu này ghi nhận quyết định phê duyệt chính thức từ Chủ dự án cho cả **Gate A (Business Rule Approval)** và **Gate B (Technical Design Decision)**:
- **Gate A:** Đã phê duyệt toàn bộ 7 quyết định nghiệp vụ D-01 đến D-07.
- **Gate B:** Đã chính thức lựa chọn **Phương án 1 — Giữ nguyên 27 bảng** cho bảng `KHIEUNAI` và **Phương án A (Loại bỏ cột vật lý `SoTien`)** cho bảng `THANHTOAN`.

---

## 2. Bảng tổng hợp Quyết định Nghiệp vụ và Thiết kế Kỹ thuật (Approved Matrix)

| ID | Vấn đề nghiệp vụ & Thiết kế | Quyết định được phê duyệt | Trạng thái | Căn cứ và Tác động Chuẩn hóa 3NF |
|---|---|---|:---:|---|
| **D-01** | Tính bất biến của số tiền thanh toán (Payment Amount Immutability) | Một đơn có nhiều attempt; tất cả attempt có chung số tiền phải thu; sau attempt đầu tiên không được đổi tổng đơn kể cả khi thất bại; hủy đơn/suất/hoàn tiền không làm sai lệch số tiền lịch sử. | **APPROVED** | Xác nhận FD $\text{DonDatVeID} \to \text{SoTien}$ là bất biến nghiệp vụ, dẫn tới vi phạm 3NF (N-001) trong schema `THANHTOAN` hiện tại. |
| **D-02** | Phương án chuẩn hóa thanh toán (Payment Normalization Direction) | Loại bỏ cột vật lý `THANHTOAN.SoTien`; tính toán số tiền trong Database từ `DONDATVE` ($\text{TongTienVe} + \text{TongTienDoAn} - \text{TienGiamGia}$); giữ nguyên mọi attempt lịch sử; không đổi API; không thêm bảng mới. | **APPROVED DESIGN DIRECTION** | Loại bỏ hoàn toàn FD vi phạm, đưa `THANHTOAN` về 3NF/BCNF mà không thêm bảng mới. Dữ liệu runtime đã xác minh 100% khớp (0 mismatch). |
| **D-03** | Mô hình Khiếu nại và Quyền sở hữu (Complaint Ownership & Model) | **LỰA CHỌN 1 — GIỮ NGUYÊN 27 BẢNG.** Không thêm bảng `KHIEUNAI_DONDATVE`. Không xóa `NguoiDungID` hoặc `DonDatVeID`. Giữ nguyên khiếu nại chung và khiếu nại có đơn. Đơn phải thuộc người gửi; kiểm soát quyền sở hữu tại Stored Procedure. | **APPROVED TECHNICAL DESIGN** | Hoàn thiện chứng minh 3NF toàn diện: Phân biệt rõ FD toàn quan hệ, Optional FK, và Ràng buộc Ownership xuyên quan hệ. Bảng đạt Classical 3NF toàn quan hệ. |
| **D-04** | Bản chất quy tắc Bảng giá (Pricing Rules Semantics) | Mỗi dòng `BANGGIA` là một quy tắc phụ thu; `GiaID` định danh bản ghi; quy tắc có thể cập nhật; giá đã bán được lưu lịch sử tại `CHITIETVE.GiaVe`; không đổi giá vé cũ khi bảng giá thay đổi. | **APPROVED** | Xác nhận `GiaID` là Khóa ứng viên duy nhất của quan hệ; loại bỏ giả thuyết Candidate Key ghép, chứng minh `BANGGIA` đạt 3NF. |
| **D-05** | Thuật toán tính phụ thu (Pricing Calculation Logic) | Giữ nguyên thuật toán cộng dồn (`SUM`) tất cả phụ thu hợp lệ; quy tắc tổng quát 'Tất cả' và quy tắc cụ thể cùng tham gia tính toán; không chuyển sang chọn quy tắc ưu tiên. | **APPROVED** | Logic nghiệp vụ liên quan hệ, không tạo thêm FD nội bảng, bảo đảm tính nhất quán cho hàm `fn_TinhGiaVe`. |
| **D-06** | Phân công quản lý rạp (Manager Assignments Semantics) | Quan hệ Manager–Cinema là nhiều–nhiều; cho phép 1 manager nhiều rạp, 1 rạp nhiều manager; cho phép phân công lại và chồng lấn thời gian; `PhanCongID` định danh bản ghi; không tạo UNIQUE giả tạo cấm chồng kỳ. | **APPROVED** | Xác nhận `PhanCongID` là Khóa ứng viên duy nhất; không áp đặt giả thuyết khóa ghép, chứng minh `PHANCONG_RAP` đạt 3NF. |
| **D-07** | Ngữ nghĩa Địa chỉ rạp (Cinema Address Domain) | `DiaChi` là văn bản thành phần; `ThanhPho` là thông tin độc lập; chuỗi `DiaChi` giống nhau có thể xuất hiện ở các thành phố khác nhau; bác bỏ giả thuyết $\text{DiaChi} \to \text{ThanhPho}$; không tạo bảng thành phố mới. | **APPROVED** | Bác bỏ giả thuyết FD $\text{DiaChi} \to \text{ThanhPho}$; xác nhận `RapID` là Candidate Key duy nhất, chứng minh `RAPCHIEUPHIM` đạt 3NF. |

---

## 3. Hoàn thiện Chứng minh 3NF Toàn diện cho Bảng KHIEUNAI (Theo Quyết định Gate B)

Theo chỉ thị của Chủ dự án, chứng minh chuẩn 3NF của bảng `KHIEUNAI` không được dựa vào lập luận đơn giản "hai dòng có NULL khác người gửi", mà phải được xây dựng dựa trên 4 trụ cột lý thuyết quan hệ:

$$\text{KHIEUNAI}(\underline{\text{KhieuNaiID}}, \text{NguoiDungID}, \text{DonDatVeID}, \text{LoaiKhieuNai}, \text{TieuDe}, \text{NoiDung}, \text{MucDoUuTien}, \text{NgayTao}, \text{TrangThai})$$

### Trụ cột 1: Phụ thuộc hàm toàn quan hệ (Relation-Wide Functional Dependency)
- **Định nghĩa chuẩn tắc (Codd 1970, Date 2004):** Một phụ thuộc hàm $X \to Y$ trên lược đồ $R$ đòi hỏi với *mọi* trạng thái hợp lệ của quan hệ $r(R)$, nếu hai bộ $t_1, t_2 \in r(R)$ có $t_1[X] = t_2[X]$ thì bắt buộc $t_1[Y] = t_2[Y]$.
- **Ngữ nghĩa thực thể của `NguoiDungID`:** Trong bảng `KHIEUNAI`, `NguoiDungID` là định danh **Người gửi khiếu nại (Reporter)**. Đây là thuộc tính bắt buộc (`NOT NULL`), phản ánh bản chất của thực thể khiếu nại: Mọi phản hồi/khiếu nại gửi vào hệ thống đều phải xuất phát từ một khách hàng cụ thể.
- **Ngữ nghĩa của `DonDatVeID`:** Đây là thuộc tính tùy chọn (`NULLable`), chỉ ra ngữ cảnh giao dịch nếu có.
- **Xét tính toàn phần:** Phụ thuộc hàm $\text{DonDatVeID} \to \text{NguoiDungID}$ **KHÔNG TỒN TẠI trên toàn quan hệ $R$**, bởi vì `DonDatVeID` không phải là một hàm xác định người gửi trên toàn bộ không gian dữ liệu của `KHIEUNAI`. Việc người gửi có gắn đơn hay không không làm biến đổi vai trò của `NguoiDungID` từ "Người gửi" thành "Thuộc tính phụ thuộc của đơn".

### Trụ cột 2: Ngữ nghĩa Optional Foreign Key (Semantics of Nullable Foreign Keys)
- Trong mô hình dữ liệu quan hệ, quan hệ 1-N tùy chọn giữa `DONDATVE` (Order) và `KHIEUNAI` (Complaint) được biểu diễn chuẩn tắc bằng cách đặt Khóa chính của bảng 1 (`DonDatVeID`) làm Khóa ngoại cho phép NULL trong bảng N (`KHIEUNAI`).
- Bảng `KHIEUNAI` chứa đồng thời 2 Khóa ngoại độc lập:
  1. $FK_1: \text{NguoiDungID} \to \text{NGUOIDUNG}(\text{NguoiDungID})$ [Bắt buộc — Xác định ai gửi khiếu nại]
  2. $FK_2: \text{DonDatVeID} \to \text{DONDATVE}(\text{DonDatVeID})$ [Tùy chọn — Xác định khiếu nại về đơn nào]
- Bản thân sự tồn tại của 2 Khóa ngoại độc lập trong cùng một bảng con không cấu thành một phụ thuộc hàm nội bộ giữa 2 Khóa ngoại đó.

### Trụ cột 3: Ràng buộc Ownership xuyên quan hệ (Cross-Table Inclusion Constraint)
- Quy tắc nghiệp vụ KN-02 quy định: *"Nếu khiếu nại có gắn DonDatVeID, thì DonDatVeID đó phải thuộc về NguoiDungID đang gửi."*
- Trong lý thuyết cơ sở dữ liệu, đây là một **Ràng buộc phụ thuộc bao hàm (Inclusion Dependency - IND)** liên quan hệ:
  $$\Pi_{\text{DonDatVeID}, \text{NguoiDungID}}(\sigma_{\text{DonDatVeID} \ne \text{NULL}}(\text{KHIEUNAI})) \subseteq \Pi_{\text{DonDatVeID}, \text{NguoiDungID}}(\text{DONDATVE})$$
- **Nguyên lý lý thuyết cốt lõi:** Một ràng buộc toàn vẹn liên quan hệ (Inter-relational Constraint) **không đồng nhất và không tự động biến thành một Phụ thuộc hàm nội bảng (Intra-relational Functional Dependency)**. Chuẩn 3 (3NF) chỉ đánh giá tập phụ thuộc hàm nội tại của lược đồ quan hệ $R$, không trừng phạt quan hệ vì một ràng buộc bảo mật/phân quyền liên bảng.

### Trụ cột 4: Đánh giá Phụ thuộc hàm có điều kiện (CFD Analysis) và Quyết định Gate B
- Trên tập con các khiếu nại có gắn đơn $\sigma_{\text{DonDatVeID} \ne \text{NULL}}$, do quy tắc liên bảng bảo đảm tính nhất quán, giá trị `NguoiDungID` của các khiếu nại cùng đơn sẽ trùng nhau.
- Tuy nhiên, việc loại bỏ sự trùng lặp này đòi hỏi phải tách bảng thành Sixth Normal Form (6NF / Null-Free vertical partitioning: `KHIEUNAI_DONDATVE`), làm tăng tổng số bảng lên 28 và tăng chi phí JOIN.
- **Quyết định Gate B đã chọn:** Giữ nguyên mô hình 27 bảng. Tính nhất quán của người gửi và đơn được kiểm soát chặt chẽ tại tầng Database thông qua Stored Procedure `sp_Complaint_Create`.
- **Kết luận khoa học:** Bảng `KHIEUNAI` với Khóa chính duy nhất `KhieuNaiID` thỏa mãn điều kiện Chuẩn 3 toàn quan hệ ($\text{KhieuNaiID}$ là Superkey duy nhất, không có phụ thuộc bắc cầu toàn quan hệ). Đạt danh hiệu **VERIFIED_PASS (Classical 3NF)**.

---

## 4. Quyết định Chuẩn hóa Bảng THANHTOAN (Theo Quyết định Gate B)

- **Phương án được chọn:** Phương án A — Loại bỏ cột vật lý `THANHTOAN.SoTien`.
- **Cơ chế tái dựng:** Truy xuất trực tiếp từ biểu thức snapshot của `DONDATVE`:
  $$\text{SoTien} = \text{d.TongTienVe} + \text{d.TongTienDoAn} - \text{d.TienGiamGia}$$
- **Kết quả tiền kiểm runtime (Live Preflight Result):**
  - Đã thực thi truy vấn đối soát trên database runtime: 4/4 bản ghi khớp 100% (0 mismatch).
  - Không có attempt mồ côi (0 orphan record).
- **Tính bất biến DBMS-first:** Bất biến đóng băng tiền sau attempt đầu tiên được bảo vệ ở mức Stored Procedure (`sp_StaffBooking_UpdateSeats` ném lỗi 50514) kết hợp phân quyền `db_executor` (chặn DML trực tiếp).

---
*Tài liệu ghi nhận chính thức Gate A và Gate B Technical Design Decision.*
