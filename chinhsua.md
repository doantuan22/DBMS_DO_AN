# Đối chiếu báo cáo đồ án với dự án

Ngày rà soát: 21/10/2026

Tài liệu: `docs/BaoCaoDoAn_ChuanHoaVanPhong_HoanThien.docx`

## Kết luận

Báo cáo nhìn chung bám khá sát dự án, nhất là phần mô hình dữ liệu, giao dịch, RBAC và kiến trúc backend gọi Stored Procedure. Tôi đã đối chiếu nội dung Word với mã nguồn SQL/Backend/Frontend và đọc catalog của database `CinemaBookingDB` trên `DoanTuanIT` ở chế độ chỉ đọc.

Các định nghĩa của 29 bảng nghiệp vụ khớp tên cột, kiểu dữ liệu và NULL/NOT NULL với lược đồ hiện tại. Danh mục 147 Stored Procedure nghiệp vụ, 21 Function, 6 View và 9 Trigger trong báo cáo cũng khớp các đối tượng của dự án. Các lỗi đáng sửa chủ yếu nằm ở phạm vi thống kê catalog và một số mô tả giao diện/nghiệp vụ trong Chương 5.

## Nội dung lệch hoặc cần diễn đạt lại

### 1. Thống kê đối tượng: cần tách đối tượng của đồ án khỏi đối tượng hỗ trợ SQL Server

Các mục 2.1.1, 3.1–3.7, 5.1.4 và 6.1 đang dùng số liệu 29 bảng, 147 Stored Procedure, 21 Function, 6 View, 9 Trigger và 184 constraint như số của database. Đây là số đúng khi nói về **lược đồ nghiệp vụ do đồ án quản lý**, nhưng không phải tổng số mọi đối tượng đang có trong catalog của Main.

Kết quả đọc catalog Main ngày 21/10/2026 có 30 bảng, 154 Stored Procedure, 22 Function, 6 View, 9 Trigger, 30 PK, 12 UQ, 37 FK, 65 CHECK và 42 DEFAULT. Phần chênh lệch là các đối tượng sơ đồ database do SSMS tạo: bảng `sysdiagrams`, hàm `fn_diagramobjects` và 7 thủ tục `sp_*diagram` (`sp_alterdiagram`, `sp_creatediagram`, `sp_dropdiagram`, `sp_helpdiagramdefinition`, `sp_helpdiagrams`, `sp_renamediagram`, `sp_upgraddiagrams`). Chúng không thuộc lược đồ nghiệp vụ của đồ án. Sau khi loại chúng, các số 29 bảng, 147 thủ tục, 21 hàm, 29 PK, 11 UQ và 184 constraint khớp phạm vi ứng dụng; 37 FK, 65 CHECK, 42 DEFAULT, 31 index độc lập, 6 view và 9 trigger cũng khớp.

**Cách sửa:** ở lần xuất hiện đầu tiên, ghi rõ “29 bảng nghiệp vụ và các đối tượng do đồ án quản lý; không tính đối tượng Database Diagrams do SSMS sinh”. Sửa câu ở mục 2.1.1 từ “29 bảng vật lý” thành “29 bảng nghiệp vụ trong lược đồ ứng dụng”. Ở mục 3.1, thay câu nói số liệu chưa được đối chiếu database đang vận hành bằng câu có ngày/phạm vi, ví dụ:

> Tại thời điểm kiểm tra ngày 21/10/2026, lược đồ nghiệp vụ của đồ án có 29 bảng, 147 Stored Procedure, 21 Function, 6 View và 9 Trigger. Catalog Main có thêm các đối tượng Database Diagrams do SSMS tạo; các đối tượng này không được tính vào danh mục của hệ thống.

Sau đó dùng thống nhất cụm “đối tượng nghiệp vụ của đồ án” cho các số liệu ở mục 2.1.1, bảng 3.1–3.16, mục 5.1.4 và kết luận 6.1. `database/README.md` hiện ghi 29 bảng ứng dụng nhưng 154 Stored Procedure/22 Function; đây là cách đếm trộn phạm vi ứng dụng với đối tượng hỗ trợ SSMS, nên nên chuẩn hóa cùng nguyên tắc với báo cáo.

### 2. Trailer phim không mặc nhiên là trailer chính thức

Ở mục 5.3.1, đoạn “Tra cứu phim, rạp chiếu và lịch chiếu” nói trang phim hiển thị “video trailer chính thức”. Dự án chỉ có trường `TrailerURL` tùy chọn và bộ seed demo hiện đặt trường này thành `NULL`; frontend kiểm tra URL hợp lệ nhưng không xác minh đó là trailer chính thức. Ảnh Hình 5.3 cũng không thể hiện video trailer.

**Cách sửa:** đổi thành “Trang chi tiết hiển thị thông tin phim và liên kết trailer nếu quản trị viên đã cấu hình URL hợp lệ. Với bộ dữ liệu demo hiện tại, trường TrailerURL chưa được nạp nên không phải phim nào cũng có trailer.”

### 3. Sai tên View lịch chiếu

Ở mục 5.3.1, đoạn dưới Hình 5.3 gọi View là `v_LichChieu`. Tên thực tế là `dbo.vw_LichChieuChiTiet`; các Stored Procedure đọc lịch chiếu sử dụng View này.

**Cách sửa:** thay `v_LichChieu` bằng `vw_LichChieuChiTiet`, đồng thời diễn đạt rằng API/Stored Procedure sử dụng View để lấy dữ liệu, không phải giao diện frontend truy vấn trực tiếp SQL Server.

### 4. Mô tả thời điểm giữ ghế chưa đúng với luồng đặt vé

Ở mục 5.3.1, đoạn “Lựa chọn ghế và chuẩn bị đơn đặt vé” nói hệ thống giữ ghế ngay khi khách xác nhận bước chọn ghế. Nhưng Hình 5.4 ghi rõ “Ghế chỉ được giữ sau khi tạo đơn thành công”. Trong mã nguồn, việc giữ chỗ được biểu diễn bằng đơn `DONDATVE` ở trạng thái chờ thanh toán cùng `HanGiuCho`; không có trạng thái giữ ghế độc lập được ghi ngay lúc chọn ghế. Trạng thái ghế đang giữ được suy ra từ đơn còn hiệu lực. Chế độ xem trước cũng không tạo đơn hoặc chiếm ghế.

**Cách sửa:** thay bằng “Ở bước chọn ghế/xem trước, hệ thống kiểm tra khả năng đặt nhưng chưa giữ ghế. Sau khi tạo đơn thành công, database ghi đơn chờ thanh toán và thời hạn `HanGiuCho`; ghế được xem là đang giữ trong thời hạn này. Nếu ghế không còn khả dụng khi xác nhận, API trả xung đột và khách cần chọn lại.” Cách diễn đạt này cũng thống nhất với ảnh Hình 5.4 và luồng `sp_Booking_Create`.

### 5. Báo cáo nói có mã QR và soát vé tại quầy nhưng ứng dụng hiện chỉ có mã vé dạng văn bản

Mục 5.3.1, đoạn “Thanh toán mô phỏng và quản lý vé điện tử”/dưới Hình 5.5 mô tả mã QR và việc dùng vé để soát tại quầy. Mã nguồn hiện trả và hiển thị `MaVe` dưới dạng chuỗi văn bản; ảnh Hình 5.5 cũng minh họa “Mã vé: TK-…”, không có QR. Không tìm thấy chức năng tạo/hiển thị QR hoặc API/quy trình quét và check-in vé trong Frontend/Backend.

**Cách sửa:** thay “mã QR vé điện tử” bằng “mã vé điện tử (`MaVe`)” và bỏ câu khẳng định có thể dùng để soát vé tại quầy. Chỉ giữ lại nội dung QR/check-in nếu chức năng đó được bổ sung và kiểm thử.

### 6. Chưa có hạng thành viên theo điểm

Mục 5.3.1, đoạn đăng ký và quản lý tài khoản nói khách hàng “kiểm tra hạng thành viên”. Hồ sơ hiện chỉ hiển thị số dư điểm với nhãn “Thành viên CinemaStar”; chưa có cấp hạng hoặc quy tắc tính hạng theo điểm.

**Cách sửa:** đổi thành “theo dõi số điểm tích lũy hiện có”. Nếu muốn mô tả hạng thành viên, cần bổ sung cấp hạng, ngưỡng điểm, cách tính và giao diện tương ứng trước.

### 7. Sai tên thủ tục, khoảng đệm suất chiếu và nhãn loại ngày

Mục 5.3.2, đoạn “Quản lý suất chiếu, bảng giá và báo cáo doanh thu rạp” nêu thủ tục `sp_KiemTraTrungSuatChieu` và khoảng đệm dọn phòng 15 phút. Dự án không có thủ tục tên đó và không áp dụng khoảng đệm 15 phút. Tạo/cập nhật suất chiếu gọi `sp_Showtime_ValidateTimes`; trigger `TRG_SuatChieu_KiemTraTrungLich` chặn các khoảng thời gian giao nhau trong cùng phòng. Thủ tục kiểm tra thời lượng suất so với thời lượng phim (từ thời lượng phim đến tối đa thêm 120 phút) và giới hạn thời lượng; đây không phải quy tắc dọn phòng 15 phút.

Cùng câu này ghi loại ngày “Tất cả các ngày”, trong khi giá trị nghiệp vụ được lưu là `Tất cả` (cùng `Ngày thường`, `Cuối tuần`). Câu “tạo đơn đặt vé tại quầy” cũng dễ khiến người đọc hiểu là có POS/thu tiền mặt, trong khi phạm vi đề tài loại POS ra ngoài và Manager/Admin chỉ tạo đơn chờ thanh toán.

**Cách sửa:** viết lại theo hướng: “Khi tạo hoặc cập nhật suất chiếu, các Stored Procedure gọi `sp_Showtime_ValidateTimes`; trigger `TRG_SuatChieu_KiemTraTrungLich` tiếp tục ngăn các suất trong cùng phòng chồng lấn thời gian. Thời lượng và mốc thời gian được kiểm tra theo quy tắc của database; dự án không thiết lập khoảng đệm dọn phòng 15 phút. Bảng giá dùng các loại ngày `Ngày thường`, `Cuối tuần`, `Tất cả`. Manager/Admin có thể hỗ trợ tạo đơn trên hệ thống ở trạng thái chờ thanh toán; chức năng POS và thu tiền tại quầy chưa nằm trong phạm vi.”

### 8. Sai các trạng thái khiếu nại ở mục CSKH

Mục 5.3.3, đoạn “Tiếp nhận và phân loại khiếu nại” liệt kê `Chờ tiếp nhận`, `Đang xử lý`, `Chờ khách phản hồi`, `Đã giải quyết`, `Đã đóng`. Giá trị của `KHIEUNAI.TrangThai` mà CHECK constraint và API hiện cho phép là `Mới`, `Đang xử lý`, `Đã giải quyết`, `Đã đóng`, `Từ chối`. `Chờ tiếp nhận` là trạng thái ban đầu của **yêu cầu chuyển cấp** (`YEUCAU_CHUYENCAP`), không phải khiếu nại; `Chờ khách phản hồi` không có trong tập trạng thái hiện tại.

**Cách sửa:** thay danh sách trạng thái trong báo cáo bằng đúng năm giá trị trên. Nếu muốn có trạng thái chờ khách phản hồi hoặc dùng “Chờ tiếp nhận” cho khiếu nại, cần thay đổi đồng bộ CHECK constraint, API validator, bộ lọc giao diện và kiểm thử; không nên chỉ sửa câu chữ.

### 9. Chuyển cấp khiếu nại không đồng nghĩa với hoàn tiền hoặc một bước phê duyệt thanh toán

Mục 5.3.3, đoạn “Trao đổi hỗ trợ, ghi chú nội bộ và chuyển cấp hồ sơ” có thể khiến người đọc hiểu Admin duyệt và thực hiện hoàn tiền. Dự án cho phép CSKH gửi yêu cầu chuyển cấp; Admin kết luận yêu cầu bằng trạng thái `Đã giải quyết` hoặc `Từ chối` và ghi nội dung kết quả. Không có luồng hoàn tiền thực tế; điều này phù hợp với phần hạn chế 6.2.

**Cách sửa:** nói rõ yêu cầu hoàn tiền (nếu có) chỉ là nội dung được chuyển cấp để xem xét; hệ thống không thực hiện hoàn tiền. Dùng “Admin tiếp nhận và kết luận yêu cầu chuyển cấp” thay cho cách diễn đạt hàm ý có quy trình hoàn tiền/phê duyệt giao dịch.

### 10. Thời điểm được đánh giá phim đang được mô tả không thống nhất

Mục 5.3.1, đoạn dưới Hình 5.5 nói khách hàng gửi đánh giá sau khi suất chiếu kết thúc. Nhưng mục 2.1.1/mô tả Trigger và mã `TRG_DanhGia_KiemTraDaXemPhim` kiểm tra suất đã **bắt đầu** (`ThoiGianBatDau <= thời điểm hiện tại`), không kiểm tra `ThoiGianKetThuc`. Vì vậy, câu ở Chương 5 đang hứa điều kiện chặt hơn điều kiện thực sự được áp dụng.

**Cách sửa:** viết “Khách hàng có đơn đã thanh toán/hoàn thành cho phim có thể đánh giá khi suất chiếu đã bắt đầu.” Nếu muốn chỉ cho đánh giá sau khi phim kết thúc, cần sửa Trigger/thủ tục và kiểm thử tương ứng.

### 11. Quy tắc thay đổi ghế cần nêu đúng từng loại thao tác

Mục 5.3.2 nói không cho “xóa hoặc thay đổi cấu hình” của ghế từng có vé. Điều này đúng với xóa ghế và đổi loại ghế, nhưng hơi rộng nếu hiểu là không được đổi bất kỳ thuộc tính nào: mã hiện tại vẫn cho cập nhật trạng thái ghế nếu ghế không có vé hiệu lực ở suất tương lai. Ngược lại, đổi loại ghế bị chặn nếu có bất kỳ lịch sử vé nào.

**Cách sửa:** nêu cụ thể “không xóa ghế hoặc đổi loại ghế đã có lịch sử vé; trạng thái hoạt động/bảo trì/hỏng chỉ được cập nhật khi không có vé hiệu lực ở suất chiếu tương lai.”

### 12. “Theo thời gian thực” ở dashboard nên giới hạn nghĩa

Mục 5.3.2 mô tả số liệu dashboard bảo đảm nhất quán “theo thời gian thực”. Dữ liệu được tổng hợp từ truy vấn database khi API/dashboard tải hoặc làm mới; mã nguồn không thể hiện cơ chế đẩy cập nhật liên tục (streaming/subscription). Do đó, “real-time” dễ bị hiểu là cập nhật tức thì liên tục.

**Cách sửa:** thay bằng “số liệu được tổng hợp từ dữ liệu database tại thời điểm truy vấn/làm mới”. Chỉ dùng “thời gian thực” nếu có cơ chế cập nhật liên tục được triển khai và kiểm thử.

### 13. Các tổng số kiểm thử cần gắn với lần chạy cụ thể

Mục 4.1.5 đã ghi rõ một số kết quả ngày 14–15/10/2026 và lưu ý Browser E2E 64/65 chưa được chạy lại trên snapshot hiện tại; đây là cách trình bày phù hợp. Tuy nhiên, bảng kết quả 6.1 còn nêu nhiều tổng số suite (Backend 216/216, Frontend 239/239, vòng đời nghiệp vụ 44/44, điểm/doanh thu 44/44) mà không gắn ngày, commit hoặc đường dẫn log ngay cạnh số liệu. Trong `.audit-output` hiện có báo cáo xác minh seed, nhưng không có log để xác nhận những tổng này là kết quả của mã nguồn hiện tại.

**Cách sửa:** giữ các số liệu nếu đó là kết quả lịch sử, nhưng ghi ngày chạy, commit/snapshot, database đích và dẫn tới log/artifact tương ứng. Nếu muốn coi là trạng thái hiện tại, chạy lại suite liên quan trên phiên bản hiện tại rồi cập nhật; không suy từ kết quả seed verification sang kết quả kiểm thử toàn hệ thống.

## Nội dung đã đối chiếu và có thể giữ

- Tên 29 bảng nghiệp vụ, toàn bộ tên cột, kiểu dữ liệu và tính NULL/NOT NULL trong các bảng cấu trúc Chương 2 khớp lược đồ dự án.
- Danh sách tên 147 Stored Procedure nghiệp vụ, 21 Function, 6 View và 9 Trigger trong các bảng Chương 3 khớp Main sau khi loại các đối tượng sơ đồ SSMS. Các số 37 FK, 65 CHECK, 42 DEFAULT, 31 index độc lập và 184 constraint theo phạm vi nghiệp vụ cũng nhất quán.
- Thông tin RBAC gồm 4 vai trò, 33 quyền và 59 quan hệ vai trò–quyền khớp database hiện tại. Nhận xét rằng ma trận quyền cố định và quyền `THANH_TOAN` trong ma trận không tự động mở nghiệp vụ thanh toán cho Manager là diễn đạt có cơ sở.
- Mô tả transaction đặt vé, giá/đơn giá snapshot, giữ chỗ theo hạn, thanh toán mô phỏng, thanh toán hoàn toàn bằng điểm trong điều kiện phù hợp và bồi thường bằng điểm khi hủy suất chiếu nhìn chung khớp mã nguồn. Phần nói chưa chứng minh đầy đủ 3NF cũng thận trọng và nên giữ.
- Các hình giao diện chính có trong file Word; riêng Hình 5.4 và 5.5 hỗ trợ việc sửa mô tả giữ ghế và mã vé như trên.

## Thứ tự chỉnh sửa đề xuất

1. Chốt quy ước đếm “đối tượng nghiệp vụ” và sửa thống nhất các số liệu ở Chương 2, Chương 3, Chương 5, Chương 6 cùng `database/README.md`.
2. Sửa nội dung các mục 5.3.1–5.3.3 theo các điểm 2–12, đặc biệt là giữ ghế, QR/check-in, hạng thành viên, kiểm tra suất chiếu, trạng thái khiếu nại và đánh giá phim.
3. Bổ sung nguồn/log và mốc phiên bản cho các tổng số kiểm thử ở Chương 4 và Chương 6.
