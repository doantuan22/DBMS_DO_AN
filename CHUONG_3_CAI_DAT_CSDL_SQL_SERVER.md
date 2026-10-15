# CHƯƠNG 3: CÀI ĐẶT CSDL TRÊN SQL SERVER

Hệ thống sử dụng Microsoft SQL Server làm nơi lưu trữ và thực thi các quy tắc nghiệp vụ. Các đối tượng ứng dụng được tổ chức trong schema dbo; bộ script khởi tạo tạo cơ sở dữ liệu với collation Vietnamese_CI_AS, kiểm tra yêu cầu SQL Server 2016 SP1 trở lên và bật READ_COMMITTED_SNAPSHOT. Thứ tự trong script xây dựng đặt bảng trước các ràng buộc, chỉ mục, hàm, view, trigger và stored procedure để đáp ứng phụ thuộc giữa các đối tượng.

Các thống kê trong chương được tính từ những tệp mà run-all.sql đưa vào build-objects.sql: 29 bảng, 184 ràng buộc khai báo, 31 chỉ mục tạo độc lập, 9 trigger, 6 view, 147 stored procedure và 21 function. Đây là số liệu của bộ script cài đặt hiện hành; nội dung không hàm ý rằng catalog của một máy chủ SQL Server đang chạy đã được truy vấn.

## 3.1. Tạo bảng

Cấu trúc dữ liệu gồm 29 bảng, được chia theo các miền nghiệp vụ để tách dữ liệu danh mục, giao dịch và lịch sử xử lý. Các quan hệ nhiều-nhiều được biểu diễn bằng bảng liên kết; các bản ghi mua vé lưu lại giá tại thời điểm giao dịch để không phụ thuộc vào giá danh mục được thay đổi về sau.

| Nhóm nghiệp vụ | Bảng | Chức năng và quan hệ chính |
|---|---|---|
| Tài khoản và phân quyền | NGUOIDUNG | Tài khoản, thông tin định danh, trạng thái và vai trò; liên kết VAITRO và là chủ thể của hồ sơ, đơn hàng, đánh giá, khiếu nại và phân công rạp. |
| Tài khoản và phân quyền | HOSOKHACHHANG | Hồ sơ bổ sung và số dư điểm của khách hàng; NguoiDungID đồng thời là khóa chính và khóa ngoại đến NGUOIDUNG. |
| Tài khoản và phân quyền | VAITRO | Danh mục vai trò được gán cho tài khoản, chẳng hạn khách hàng, quản lý rạp, CSKH và quản trị viên. |
| Tài khoản và phân quyền | QUYEN | Danh mục mã quyền chức năng. |
| Tài khoản và phân quyền | VAITRO_QUYEN | Bảng nối vai trò với quyền; khóa ghép ngăn một quyền được gắn lặp cho cùng vai trò. |
| Tài khoản và phân quyền | PHANCONG_RAP | Phạm vi rạp và thời hạn phân công của quản lý; tham chiếu NGUOIDUNG và RAPCHIEUPHIM. |
| Rạp, phim và lịch chiếu | RAPCHIEUPHIM | Danh mục rạp; là nút cha của phòng chiếu, bảng giá, ảnh rạp và phân công quản lý. |
| Rạp, phim và lịch chiếu | HINHANH_RAPCHIEUPHIM | Ảnh, thứ tự hiển thị, trạng thái và cờ ảnh đại diện của rạp. |
| Rạp, phim và lịch chiếu | PHONGCHIEU | Phòng thuộc một rạp; chứa các ghế và các suất chiếu được xếp lịch. |
| Rạp, phim và lịch chiếu | GHE | Sơ đồ ghế của phòng, gồm vị trí, loại ghế và trạng thái vật lý. |
| Rạp, phim và lịch chiếu | PHIM | Thông tin phim, thời lượng, độ tuổi, ngày khởi chiếu/kết thúc và trạng thái phát hành. |
| Rạp, phim và lịch chiếu | DIENVIEN | Danh mục diễn viên. |
| Rạp, phim và lịch chiếu | PHIM_DIENVIEN | Bảng nối phim với diễn viên. |
| Rạp, phim và lịch chiếu | THELOAI | Danh mục thể loại phim. |
| Rạp, phim và lịch chiếu | PHIM_THELOAI | Bảng nối phim với thể loại. |
| Rạp, phim và lịch chiếu | SUATCHIEU | Thời gian, phòng, phim, định dạng, giá vé cơ bản và trạng thái của suất chiếu. |
| Rạp, phim và lịch chiếu | BANGGIA | Quy tắc phụ thu theo rạp, loại ghế, loại ngày, định dạng và khoảng hiệu lực. |
| Đặt vé và thanh toán | DONDATVE | Đơn của một khách cho một suất chiếu; giữ tổng tiền vé, đồ ăn, mức giảm, điểm sử dụng, trạng thái và hạn giữ chỗ. |
| Đặt vé và thanh toán | CHITIETVE | Vé và ghế của đơn; lưu giá vé cùng trạng thái của vé tại thời điểm giao dịch. |
| Đặt vé và thanh toán | CHITIETDOAN | Sản phẩm, số lượng và đơn giá được chốt trong đơn. |
| Đặt vé và thanh toán | THANHTOAN | Các lần thử thanh toán của đơn, phương thức, mã giao dịch ngoài, trạng thái và thời điểm thanh toán. |
| Đặt vé và thanh toán | KHUYENMAI | Mã, điều kiện, thời gian và trạng thái khuyến mãi được tham chiếu tùy chọn từ đơn hàng. |
| Đặt vé và thanh toán | SANPHAM | Danh mục đồ ăn, thức uống và sản phẩm bán kèm. |
| Đặt vé và thanh toán | BOITHUONG_HUYSUAT | Bản ghi điểm bồi thường khi hủy suất; mỗi DonDatVeID chỉ có một bản ghi, liên kết duy nhất đến đơn. |
| Đánh giá và hỗ trợ khách hàng | DANHGIAPHIM | Đánh giá và số sao của khách đối với phim; liên kết NGUOIDUNG và PHIM. |
| Đánh giá và hỗ trợ khách hàng | KHIEUNAI | Nội dung, người gửi, đơn tham chiếu tùy chọn, trạng thái, độ ưu tiên và nhân viên phụ trách. |
| Đánh giá và hỗ trợ khách hàng | XULY_KHIEUNAI | Nhật ký nội dung xử lý và trạng thái sau xử lý; là nguồn để đồng bộ trạng thái khiếu nại. |
| Đánh giá và hỗ trợ khách hàng | TINNHAN_KHIEUNAI | Tin nhắn công khai hoặc ghi chú nội bộ giữa người gửi và bộ phận hỗ trợ. |
| Đánh giá và hỗ trợ khách hàng | YEUCAU_CHUYENCAP | Yêu cầu chuyển cấp khiếu nại, người yêu cầu, quản trị viên tiếp nhận, thời điểm và kết quả. |

Các khóa chính định danh từng thực thể hoặc từng sự kiện. PHIM_DIENVIEN, PHIM_THELOAI và VAITRO_QUYEN sử dụng khóa ghép để biểu diễn quan hệ nhiều-nhiều. Những bảng như CHITIETVE và CHITIETDOAN nối đơn với các tài nguyên được mua; THANHTOAN cho phép ghi nhận lần thử thanh toán riêng với vòng đời của đơn. Thiết kế này phân biệt dữ liệu danh mục hiện tại với ảnh chụp giao dịch, đồng thời giữ lại lịch sử xử lý khiếu nại và bồi thường.

## 3.2. Ràng buộc

Schema khai báo 184 ràng buộc: 29 PRIMARY KEY, 37 FOREIGN KEY, 11 UNIQUE, 65 CHECK và 42 DEFAULT. Cột NOT NULL được khai báo trực tiếp trong định nghĩa bảng, vì vậy không được tính như một đối tượng constraint có tên riêng.

| Loại | Phạm vi và ví dụ triển khai | Tác dụng |
|---|---|---|
| PRIMARY KEY | Khóa đơn trên các bảng thực thể và khóa ghép tại PHIM_DIENVIEN, PHIM_THELOAI, VAITRO_QUYEN; BOITHUONG_HUYSUAT khai báo PK_BOITHUONG_HUYSUAT inline. | Định danh bản ghi, loại bỏ khóa trùng và làm đích cho quan hệ tham chiếu. |
| FOREIGN KEY | Liên kết đơn với khách, suất chiếu và khuyến mãi; vé/đồ ăn với đơn; ghế với phòng; suất chiếu với phim/phòng; bảng xử lý với khiếu nại/người xử lý; và các bảng phân quyền. | Ngăn bản ghi mồ côi. Một số quan hệ chi tiết dùng ON DELETE CASCADE; các quan hệ giao dịch và lịch sử khác dùng NO ACTION để tránh xóa dữ liệu đang được tham chiếu. |
| UNIQUE | UQ_NGUOIDUNG_Email; UQ_KHUYENMAI_MaCode; UQ_GHE_ViTri trên PhongID, HangGhe, SoGhe; UQ_PHONGCHIEU_TenPhong trên RapID, TenPhong; UQ_DANHGIAPHIM_Phim_User; UQ_CHITIETDOAN_Don_SanPham; UQ_CHITIETVE_MaVe và UQ_BOITHUONG_HUYSUAT_Don. | Chặn các giá trị định danh hoặc tổ hợp nghiệp vụ bị lặp, ví dụ hai ghế cùng vị trí trong phòng hay cùng khách gửi nhiều đánh giá cho một phim. |
| CHECK | Nhóm CK_BANGGIA_* kiểm tra miền loại ghế/ngày/định dạng/trạng thái, phụ thu không âm và khoảng ngày; CK_GHE_SoGhe yêu cầu số ghế dương; CK_DANHGIAPHIM_SoSao giới hạn 1–5; CK_DONDATVE_* kiểm tra trạng thái, hạn giữ chỗ, tổng tiền và điểm không âm; CK_KHUYENMAI_PhanTram99 giới hạn mức phần trăm; CK_THANHTOAN_PhuongThuc và CK_THANHTOAN_TrangThai giới hạn phương thức/trạng thái. | Loại dữ liệu sai miền hoặc giá trị số không hợp lệ ngay tại thao tác ghi. |
| DEFAULT | Giá trị trạng thái ban đầu cho đơn, vé, thanh toán, ghế, rạp, phòng, phim, sản phẩm, khiếu nại và yêu cầu chuyển cấp; nhiều mốc tạo được cấp qua dbo.fn_BayGio(). | Cấp giá trị ban đầu thống nhất khi lệnh ghi không truyền cột tùy chọn. |
| NOT NULL | Các khóa quan hệ bắt buộc, trạng thái, số lượng, đơn giá chốt, tổng tiền và nội dung nghiệp vụ bắt buộc tại các bảng tương ứng. Một số cột được phép vắng mặt theo vòng đời, như DONDATVE.KhuyenMaiID, DONDATVE.HanGiuCho ngoài trạng thái chờ thanh toán, hoặc YEUCAU_CHUYENCAP.AdminPhuTrachID trước khi tiếp nhận. | Phân biệt thông tin bắt buộc với dữ liệu chỉ có sau một bước nghiệp vụ; các quan hệ giữa tính NULL và trạng thái được bổ sung bằng CHECK khi cần. |

Các constraint tiền tệ trên DONDATVE ngăn tổng vé, tổng đồ ăn hoặc mức giảm âm và không cho TienGiamGia vượt tổng giá trị đơn. CK_DONDATVE_DiemSuDung chỉ kiểm tra điểm không âm; việc quy đổi điểm sang tiền và giới hạn theo số dư được thực hiện trong stored procedure, không phải điều kiện CHECK. Tương tự, FK bảo đảm sự tồn tại của bản ghi liên quan nhưng không thay thế các quy tắc nhiều dòng như ghế thuộc đúng phòng của suất chiếu.

Ràng buộc về hai suất chiếu không giao nhau, một ghế không được giữ/bán hai lần cho cùng suất, điều kiện khách đã xem trước khi đánh giá, quy tắc nhân viên xử lý khiếu nại và tính bất biến vai trò tài khoản được cài bằng trigger hoặc stored procedure. Việc tách này tránh mô tả sai quy tắc liên bảng như một CHECK constraint cục bộ.

## 3.3. Trigger

Có 9 trigger gắn với các thao tác ghi dữ liệu. Các trigger dùng tập inserted/deleted để kiểm tra toàn bộ bản ghi của một lệnh nhiều dòng thay vì giả định mỗi lần kích hoạt chỉ có một hàng.

| Trigger | Bảng và sự kiện | Quy tắc được bảo vệ |
|---|---|---|
| TRG_BangGia_KiemTraChongLan | BANGGIA; AFTER INSERT, UPDATE | Chặn các khoảng hiệu lực chồng lấn khi rạp, loại ghế, loại ngày và định dạng trùng nhau ở trạng thái Áp dụng; kiểm tra cả dữ liệu đã có và các dòng trong cùng inserted. |
| TRG_ChiTietVe_KiemTraGheDungPhong | CHITIETVE; AFTER INSERT, UPDATE | Yêu cầu ghế của vé thuộc phòng gắn với suất chiếu của đơn. |
| TRG_ChiTietVe_KiemTraTrungGhe | CHITIETVE; AFTER INSERT, UPDATE | Chặn ghế trùng trong cùng tập ghi và ghế đã có vé còn hiệu lực ở một đơn khác của cùng suất; vé/đơn đã hủy hoặc hết hạn được loại khỏi phép kiểm tra theo điều kiện trong trigger. |
| TRG_DanhGia_KiemTraDaXemPhim | DANHGIAPHIM; AFTER INSERT | Chỉ chấp nhận đánh giá khi người dùng có đơn đã thanh toán/hoàn thành cho phim và suất chiếu đã bắt đầu. |
| TRG_KhieuNai_NhanVienPhuTrachBatBien | KHIEUNAI; AFTER UPDATE | Khi đã gán NhanVienPhuTrachID, không cho đưa về NULL hoặc đổi sang người khác. |
| TRG_NguoiDung_VaiTroBatBien | NGUOIDUNG; AFTER UPDATE | Không cho thay đổi VaiTroID sau khi tạo tài khoản. |
| TRG_SuatChieu_KiemTraTrungLich | SUATCHIEU; AFTER INSERT, UPDATE | Chặn khoảng thời gian giao nhau trong cùng phòng đối với các suất chưa hủy; so sánh cả dòng mới với bảng và các dòng mới với nhau. |
| TRG_XuLyKhieuNai_CapNhatTrangThaiKhieuNai | XULY_KHIEUNAI; AFTER INSERT | Đồng bộ KHIEUNAI.TrangThai theo trạng thái của bản ghi xử lý mới nhất cho từng khiếu nại bị ảnh hưởng. |
| TRG_XuLyKhieuNai_KiemTraVaiTro | XULY_KHIEUNAI; AFTER INSERT, UPDATE | Chỉ tài khoản đang hoạt động với vai trò CSKH hoặc ADMIN được ghi nhận xử lý khiếu nại. |

Hai trigger lịch chiếu và vé có kiểm tra set-based nên xử lý được lệnh ghi nhiều hàng. Trigger xếp lịch xét điều kiện giao nhau theo khoảng thời gian; trigger ghế đối chiếu suất chiếu của đơn và trạng thái hiệu lực của đơn/vé. Riêng tính an toàn khi nhiều yêu cầu đặt đồng thời còn dựa vào transaction và khóa tường minh trong sp_Booking_Create; trigger không được xem như thay thế cơ chế điều phối đồng thời của thủ tục này. Trigger bảng giá phối hợp khóa trên bản ghi rạp để tuần tự hóa thao tác cập nhật quy tắc giá cùng phạm vi rạp.

## 3.4. View

Sáu view đóng gói các phép nối và phép tổng hợp thường dùng. Chúng được gọi từ stored procedure hoặc function trong Database; Backend chỉ gọi thủ tục qua lớp thực thi RPC.

| View | Dữ liệu và cách tổng hợp | Nơi hỗ trợ |
|---|---|---|
| vw_ChiTietDonDatVe | Ghép đơn với khách, suất, phim, rạp, phòng và khuyến mãi; cung cấp tổng tiền, trạng thái hiển thị và danh sách ghế. | sp_Order_GetDetailByCustomer, sp_Support_Complaint_GetOrderReference và sp_StaffBooking_Detail. |
| vw_DanhSachKhieuNai | Ghép người gửi/người phụ trách với khiếu nại; tổng hợp số lần xử lý và thông tin bản ghi xử lý gần nhất. | sp_Support_Complaint_List và sp_Complaint_Unassigned_List. |
| vw_DoanhThuTheoRap | Tổng hợp theo rạp từ các đơn có bản ghi THANHTOAN.TrangThai = Thành công; phân biệt tiền đã thu với đơn chỉ đang chờ hoặc thanh toán thất bại. | Cung cấp read model doanh thu; các procedure hiện tại không tham chiếu trực tiếp view này. |
| vw_LichChieuChiTiet | Ghép phim, rạp, phòng và suất; quy đổi giờ hiển thị theo giờ rạp và tính IsBookable từ trạng thái, thời điểm, ngày chiếu và trạng thái các thực thể liên quan. | Các thủ tục tra cứu lịch, kiểm tra điều kiện đặt vé và thao tác lịch của quản lý/nhân viên. |
| vw_LichSuDatVe | Cung cấp lịch sử đơn, thông tin suất/phim/rạp, tổng tiền, số vé, trạng thái hết hạn suy ra và thông tin thanh toán gần nhất. | sp_Order_ListByCustomer và sp_StaffBooking_List. |
| vw_ThongKePhim | Tập hợp số đánh giá, điểm trung bình và tổng số suất theo phim; phim không có dữ liệu tổng hợp vẫn được giữ nhờ LEFT JOIN. | sp_Movie_List và sp_Movie_GetDetail. |

View không thay thế quy tắc ghi. Chẳng hạn, IsBookable là kết quả đọc phục vụ hiển thị/kiểm tra; khi tạo đơn, sp_Booking_Create vẫn khóa và đánh giá lại dữ liệu cần thiết trong transaction.

## 3.5. Index

Ngoài các index do khóa chính và UNIQUE constraint hỗ trợ, 15 tệp trong database/04_indexes khai báo 31 index độc lập. Tất cả 31 index này là NONCLUSTERED; năm index là UNIQUE có bộ lọc. Bảng dưới đây nêu các cột khóa, cột INCLUDE hoặc bộ lọc có khai báo. Mục tiêu được suy ra từ cấu trúc index và mẫu lọc/join, không phải kết quả benchmark.

| Index | Bảng; loại | Cột khóa và bộ lọc/INCLUDE | Mẫu truy cập hỗ trợ |
|---|---|---|---|
| IX_BANGGIA_Lookup | BANGGIA; NONCLUSTERED | RapID, LoaiGhe, LoaiNgay, DinhDang, TrangThai, NgayBatDau, NgayKetThuc | Tra quy tắc giá áp dụng theo rạp, ghế, ngày, định dạng và thời hạn. |
| IX_CHITIETVE_DonDatVe | CHITIETVE; NONCLUSTERED | DonDatVeID; INCLUDE GheID, TrangThai, GiaVe | Đọc vé và trạng thái theo đơn. |
| IX_CHITIETVE_GheID | CHITIETVE; NONCLUSTERED | GheID, TrangThai | Tra cứu lịch sử/chiếm ghế theo ghế. |
| IX_DONDATVE_HanGiuCho | DONDATVE; NONCLUSTERED, filtered | HanGiuCho; INCLUDE SuatChieuID; WHERE TrangThai = N'Chờ thanh toán' | Tìm đơn chờ thanh toán đến hạn để giải phóng giữ chỗ. |
| IX_DONDATVE_KhuyenMai | DONDATVE; NONCLUSTERED, filtered | KhuyenMaiID; WHERE KhuyenMaiID IS NOT NULL | Tra cứu đơn có sử dụng một mã khuyến mãi. |
| IX_DONDATVE_NguoiDung | DONDATVE; NONCLUSTERED | NguoiDungID, NgayDat DESC | Lấy lịch sử đơn theo khách và thứ tự thời gian. |
| IX_DONDATVE_SuatChieu | DONDATVE; NONCLUSTERED | SuatChieuID, TrangThai | Tìm đơn theo suất và trạng thái trong kiểm tra đặt/hủy suất. |
| IX_GHE_PhongID_LoaiGhe | GHE; NONCLUSTERED | PhongID, LoaiGhe, TrangThai | Liệt kê ghế trong phòng theo loại và trạng thái. |
| IX_HINHANH_RAPCHIEUPHIM_Rap_TrangThai_ThuTu | HINHANH_RAPCHIEUPHIM; NONCLUSTERED | RapID, TrangThai, ThuTuHienThi, HinhAnhRapID | Lọc ảnh theo rạp/trạng thái và thứ tự hiển thị. |
| UX_HINHANH_RAPCHIEUPHIM_Rap_Cover | HINHANH_RAPCHIEUPHIM; UNIQUE NONCLUSTERED, filtered | RapID; WHERE LaAnhDaiDien = 1 | Giới hạn một ảnh đại diện cho mỗi rạp. |
| IX_KHIEUNAI_DonDatVe | KHIEUNAI; NONCLUSTERED, filtered | DonDatVeID; WHERE DonDatVeID IS NOT NULL | Tìm khiếu nại gắn với đơn. |
| IX_KHIEUNAI_NguoiDung | KHIEUNAI; NONCLUSTERED | NguoiDungID, TrangThai | Lọc khiếu nại của người gửi theo trạng thái. |
| IX_KHIEUNAI_TrangThai | KHIEUNAI; NONCLUSTERED | TrangThai, MucDoUuTien, NgayTao DESC | Xếp hàng khiếu nại theo tình trạng, ưu tiên và thời điểm. |
| IX_KHIEUNAI_NhanVienPhuTrach | KHIEUNAI; NONCLUSTERED | NhanVienPhuTrachID, TrangThai | Tìm công việc theo nhân viên phụ trách. |
| IX_NGUOIDUNG_TrangThai | NGUOIDUNG; NONCLUSTERED | TrangThai; INCLUDE HoTen, Email | Lọc tài khoản theo trạng thái và trả thông tin hiển thị. |
| IX_NGUOIDUNG_VaiTroID | NGUOIDUNG; NONCLUSTERED | VaiTroID | Tìm tài khoản theo vai trò. |
| UQ_NGUOIDUNG_SoDienThoai | NGUOIDUNG; UNIQUE NONCLUSTERED, filtered | SoDienThoai; WHERE SoDienThoai IS NOT NULL | Giữ số điện thoại đã nhập không trùng nhưng vẫn cho phép NULL. |
| IX_PHANCONG_RAP_NguoiDung | PHANCONG_RAP; NONCLUSTERED | NguoiDungID, TrangThai, NgayBatDau, NgayKetThuc | Tra phạm vi rạp và thời hạn phân công của quản lý. |
| IX_PHANCONG_RAP_Rap | PHANCONG_RAP; NONCLUSTERED | RapID, TrangThai | Liệt kê phân công còn hiệu lực theo rạp. |
| IX_PHIM_TrangThai | PHIM; NONCLUSTERED | TrangThai, NgayKhoiChieu | Lọc phim theo trạng thái và thời điểm khởi chiếu. |
| IX_PHONGCHIEU_RapID | PHONGCHIEU; NONCLUSTERED | RapID, TrangThai | Liệt kê phòng theo rạp và trạng thái. |
| IX_SUATCHIEU_Phim_ThoiGian | SUATCHIEU; NONCLUSTERED | PhimID, ThoiGianBatDau, TrangThai | Tìm lịch theo phim, thời gian và trạng thái. |
| IX_SUATCHIEU_Phong_ThoiGian | SUATCHIEU; NONCLUSTERED | PhongID, ThoiGianBatDau, ThoiGianKetThuc | Tra và đối chiếu lịch trong cùng phòng. |
| IX_THANHTOAN_DonDatVe | THANHTOAN; NONCLUSTERED | DonDatVeID, TrangThai; INCLUDE NgayThanhToan, NgayTao | Đọc lần thanh toán và trạng thái theo đơn. |
| UQ_THANHTOAN_MaGiaoDich | THANHTOAN; UNIQUE NONCLUSTERED, filtered | MaGiaoDich; WHERE MaGiaoDich IS NOT NULL | Ngăn trùng mã giao dịch ngoài trong các bản ghi có mã. |
| IX_TINNHAN_KHIEUNAI_KhieuNai_ThoiGian | TINNHAN_KHIEUNAI; NONCLUSTERED | KhieuNaiID, ThoiGianGui, TinNhanID; INCLUDE NguoiGuiID, LoaiTinNhan | Đọc hội thoại theo khiếu nại và trình tự gửi. |
| IX_XULY_KHIEUNAI_KhieuNai | XULY_KHIEUNAI; NONCLUSTERED | KhieuNaiID, NgayXuLy DESC | Lấy lịch sử xử lý gần nhất của khiếu nại. |
| IX_YEUCAU_CHUYENCAP_TrangThai_UuTien | YEUCAU_CHUYENCAP; NONCLUSTERED | TrangThai, MucDoUuTien, ThoiGianGui DESC | Xếp hàng yêu cầu chuyển cấp theo trạng thái và ưu tiên. |
| IX_YEUCAU_CHUYENCAP_KhieuNai | YEUCAU_CHUYENCAP; NONCLUSTERED | KhieuNaiID, ThoiGianGui DESC | Tìm lịch sử chuyển cấp của một khiếu nại. |
| UQ_YEUCAU_CHUYENCAP_ChoTiepNhan | YEUCAU_CHUYENCAP; UNIQUE NONCLUSTERED, filtered | KhieuNaiID; WHERE TrangThai = N'Chờ tiếp nhận' | Giới hạn mỗi khiếu nại có tối đa một yêu cầu đang chờ tiếp nhận. |
| UQ_YEUCAU_CHUYENCAP_DangXuLy | YEUCAU_CHUYENCAP; UNIQUE NONCLUSTERED, filtered | KhieuNaiID; WHERE TrangThai = N'Đang xử lý' | Giới hạn mỗi khiếu nại có tối đa một yêu cầu đang được xử lý. |

Các index hỗ trợ những phép lọc và nối xuất hiện trong tra cứu suất/ghế, xử lý hạn giữ chỗ, lịch sử giao dịch, phân công rạp và hàng đợi CSKH. Các index UNIQUE filtered còn thể hiện bất biến theo tập con dữ liệu, chẳng hạn chỉ một ảnh cover mỗi rạp hoặc một yêu cầu chuyển cấp ở mỗi trạng thái hoạt động. Chưa có số liệu đo thời gian truy vấn hay execution plan trong nội dung này để định lượng mức cải thiện.

## 3.6. Stored procedure

Các thao tác dữ liệu ứng dụng được đóng gói thành 147 stored procedure trong database/08_procedures. Backend dùng procedureClient để kiểm tra khóa tên procedure trong danh sách cho phép, bind tham số có kiểu dữ liệu và gọi request.execute; các service không tự ghép truy vấn SQL nghiệp vụ. View và function được sử dụng bên trong SQL Server, không được gọi trực tiếp từ Backend.

| Nhóm | Stored procedure và chức năng |
|---|---|
| Xác thực, hồ sơ và quyền (7) | sp_Auth_Login và sp_Auth_RegisterCustomer phục vụ đăng nhập/đăng ký; sp_User_GetCurrent, sp_User_UpdateProfile, sp_User_GetPasswordHash và sp_User_ChangePassword đọc/cập nhật hồ sơ xác thực; sp_RBAC_GetPermissionsByUser trả quyền của tài khoản. |
| Danh mục công khai (10) | sp_Cinema_List và sp_Cinema_GetImages trả danh sách rạp/ảnh; sp_Genre_List trả thể loại; sp_Movie_List và sp_Movie_GetDetail trả danh mục/chi tiết phim; sp_Showtime_ListByMovie và sp_Showtime_GetDetail trả lịch/chi tiết suất; sp_Seat_ListByShowtime trả sơ đồ ghế; sp_Product_ListActive trả sản phẩm đang bán; sp_Promotion_Validate kiểm tra mã khuyến mãi. |
| Đặt vé (2) | sp_Booking_Create tạo đơn; sp_DatVe là thủ tục tương thích chuyển tiếp tham số sang sp_Booking_Create. |
| Khách hàng: đơn, đánh giá và khiếu nại (9) | sp_Order_ListByCustomer và sp_Order_GetDetailByCustomer đọc đơn; sp_Order_Cancel hủy đơn; sp_Order_ExpirePending xử lý đơn chờ quá hạn; sp_Review_Create và sp_Review_ListByMovie ghi/đọc đánh giá; sp_Complaint_Create, sp_Complaint_ListByCustomer và sp_Complaint_GetByCustomer tạo/đọc khiếu nại của khách. |
| Thanh toán (3) | sp_Payment_CreateAttempt khởi tạo lần thanh toán; sp_Payment_UpdateResult xử lý kết quả; sp_XuLyThanhToan giữ hợp đồng tên cũ và chuyển tiếp đến sp_Payment_UpdateResult. |
| Quản lý rạp (19) | sp_Manager_ListAssignedCinemas đọc phạm vi được giao; sp_Manager_Room_List/Create/Update/Delete quản lý phòng; sp_Manager_Seat_ListByRoom/Create/BatchCreate/Update/Delete quản lý ghế; sp_Manager_Showtime_List/Create/Update/Cancel quản lý suất; sp_Manager_Pricing_List/Create/Update quản lý bảng giá; sp_Manager_Dashboard và sp_Manager_Revenue cung cấp số liệu tổng quan/doanh thu. |
| Đặt vé tại quầy (9) | sp_StaffBooking_Authorize kiểm tra tác nhân và vai trò; sp_StaffBooking_LockShow khóa/kiểm tra phạm vi suất; sp_StaffBooking_Customers và sp_StaffBooking_Options cung cấp lựa chọn; sp_StaffBooking_List và sp_StaffBooking_Detail đọc đơn; sp_StaffBooking_Create tạo đơn; sp_StaffBooking_UpdateSeats sửa ghế theo điều kiện; sp_StaffBooking_Cancel hủy theo quy tắc. |
| CSKH và chuyển cấp (19) | sp_Support_Complaint_List/GetDetail/GetOrderReference/AddProcessing/UpdateStatus phục vụ hàng đợi và xử lý khiếu nại; sp_Complaint_Chat_List/Send/AddInternalNote quản lý hội thoại; sp_Complaint_Unassigned_List và sp_Complaint_Assign_Self/Assign_Admin quản lý phân công; sp_Escalation_Create/List_Admin/List_CSKH/GetDetail/Claim/Process quản lý chuyển cấp; sp_Support_Customer_GetPoints đọc điểm phục vụ CSKH; sp_XuLyKhieuNai là thủ tục tương thích chuyển tiếp đến sp_Support_Complaint_AddProcessing. |
| Quản trị hệ thống và danh mục (63) | sp_Admin_Actor_Create/Update/Delete/List quản lý diễn viên; sp_Admin_Assignment_Create/List và usp_Admin_Assignment_Update quản lý phân công; sp_Admin_Cinema_Create/Update/Delete và usp_Admin_Cinema_List quản lý rạp; usp_Admin_CinemaImage_Create/Update/Delete/List/SetCover quản lý ảnh; sp_Admin_Dashboard tổng quan; sp_Admin_Genre_Create/Update/Delete/List quản lý thể loại; sp_Admin_Movie_Create/Update/Delete, usp_Admin_Movie_List và sp_Admin_MovieActor_Set quản lý phim/diễn viên; sp_Admin_Permission_Create/Update/Delete/List, sp_Admin_Role_Create/Update/Delete/List, sp_Admin_RolePermission_Set và usp_Admin_RolePermission_List (các thủ tục ghi vai trò/quyền bị từ chối như mô tả dưới đây); sp_Admin_Product_Create/Update/Delete và usp_Admin_Product_List quản lý sản phẩm; sp_Admin_Promotion_Create/Update/Delete/List quản lý khuyến mãi; sp_Admin_Report_Revenue báo cáo doanh thu; sp_Admin_User_Create/List/UpdateStatus quản lý tài khoản; usp_Admin_Pricing_Create/Update/List quản lý bảng giá; usp_Admin_Room_Create/Update/Delete/List quản lý phòng; usp_Admin_Seat_Create/Update/Delete/List quản lý ghế; usp_Admin_Showtime_Create/Update/Cancel/List quản lý suất chiếu. |
| Tiện ích hệ thống (6) | sp_System_HealthCheck kiểm tra trạng thái dịch vụ SQL; sp_Clock_GetNow cung cấp thời điểm từ Database; sp_Showtime_ValidateTimes kiểm tra quy tắc thời gian; sp_Showtime_CancelCascade điều phối hủy suất; sp_ThemSuatChieu chuyển tiếp đến thủ tục tạo suất của quản lý; sp_PhanCongQuanLyRap chuyển tiếp đến thủ tục phân công của quản trị. |

Trong nhóm quản trị vẫn có bảy procedure liên quan đến việc ghi vai trò/quyền: sp_Admin_Role_Create/Update/Delete, sp_Admin_Permission_Create/Update/Delete và sp_Admin_RolePermission_Set. Các định nghĩa hiện tại cố ý phát lỗi 50405 vì ma trận vai trò/quyền được giữ cố định; script phân quyền cũng DENY EXECUTE các thủ tục này cho db_executor. Những thủ tục đọc danh mục vai trò/quyền vẫn được giữ riêng.

### 3.6.1. Đặt vé, giá và giữ ghế

sp_Booking_Create nhận người dùng, suất chiếu, mã khuyến mãi tùy chọn, danh sách ID ghế, danh sách sản phẩm dạng JSON, điểm khách muốn sử dụng, cờ xem trước và ID đơn đầu ra. Thủ tục xác thực tài khoản/vai trò/quyền, kiểm tra điều kiện suất và ghế, giải phóng đơn giữ chỗ quá hạn, tính giá theo từng ghế bằng fn_TinhGiaVe, chụp đơn giá sản phẩm, kiểm tra lại khuyến mãi và số dư điểm, rồi ghi đơn cùng chi tiết trong một transaction. Nhánh xem trước được thiết kế để hoàn tác thay đổi sau khi dựng kết quả.

Để điều phối đặt đồng thời, thủ tục khóa tài khoản khách trước khi kiểm tra giới hạn đơn giữ; sau đó khóa các tài nguyên cha của lịch chiếu và các ghế liên quan bằng UPDLOCK/HOLDLOCK, kiểm tra lại khả năng đặt và ghế đang bị giữ/bán trước khi ghi. Transaction được quản lý bằng TRY/CATCH, rollback đầy đủ khi thủ tục tự mở transaction hoặc rollback đến savepoint khi được gọi bên trong transaction khác. Cơ chế này phối hợp với trigger kiểm tra ghế; bản thân view lịch chiếu chỉ cung cấp trạng thái đọc.

### 3.6.2. Thanh toán, hết hạn và bồi thường

sp_Payment_CreateAttempt và sp_Payment_UpdateResult quản lý vòng đời một lần thử thanh toán. Khi nhận kết quả, thủ tục khóa người dùng, suất, thanh toán và đơn; kiểm tra quyền sở hữu đơn, trạng thái giao dịch, hạn giữ chỗ và điều kiện suất trước khi cập nhật. Kết quả thành công chuyển đơn sang trạng thái đã thanh toán và cộng điểm tích lũy trên số tiền đủ điều kiện; kết quả thất bại không làm đơn thành đã thanh toán. TRY/CATCH, transaction hoặc savepoint bảo đảm các cập nhật liên quan được xử lý cùng nhau.

sp_Order_ExpirePending giải phóng các vé thuộc đơn chờ đã hết hạn và đồng bộ các giá trị liên quan theo logic trong procedure. sp_Showtime_CancelCascade kiểm soát trạng thái và thời điểm suất, phối hợp với xử lý đơn chờ, rồi hủy các đơn đủ điều kiện và ghi điểm bồi thường trong cùng quy trình giao dịch. fn_TinhBoiThuongVe xác định phần tiền vé thực trả sau phân bổ giảm giá và số điểm bồi thường; script hiện tại không triển khai hoàn tiền mặt. sp_StaffBooking_UpdateSeats giới hạn việc đổi ghế vào đơn còn chờ, chưa có lần thử thanh toán và không có các thành phần khuyến mãi/đồ ăn/vé đã sử dụng; thủ tục đối chiếu danh sách ID vé kỳ vọng để phát hiện dữ liệu đơn đã đổi trước khi cập nhật.

### 3.6.3. Lịch chiếu, quyền và phạm vi rạp

sp_Showtime_ValidateTimes kiểm tra thời lượng và thời điểm suất so với phim, đồng thời phát hiện khoảng lịch trùng phòng. Các thủ tục tạo/sửa lịch dùng transaction và khóa phòng trước khi kiểm tra để các thao tác cùng phòng được điều phối. fn_KiemTraQuyenNguoiDung được sử dụng trong quy trình kiểm tra quyền chức năng; fn_KiemTraQuanLyRapScope kiểm tra phân công rạp còn hiệu lực. Các thủ tục quản lý và CSKH có bước xác thực tác nhân theo nhóm nghiệp vụ, thay vì dựa duy nhất vào quyền của giao diện.

## 3.7. Function

Cơ sở dữ liệu có 21 function: 19 scalar-valued function và hai inline table-valued function. Các hàm tập trung những phép tính, giới hạn và kiểm tra được nhiều procedure/view dùng chung.

| Function | Loại, tham số và kết quả | Vai trò |
|---|---|---|
| fn_BayGio | Scalar; không tham số; DATETIME2(7) | Trả thời điểm hiện tại theo UTC từ SYSUTCDATETIME; được dùng thống nhất trong thời hạn, lịch sử và các giá trị mặc định thời gian. |
| fn_DanhSachGheSuatChieu | Inline TVF; @SuatChieuID INT; bảng ghế, giá và trạng thái | Trả ghế của suất có thể đặt, tính giá và phân biệt ghế trống, đang giữ, đã đặt hoặc không hoạt động; được dùng trong tra cứu ghế. |
| fn_DonDangGiuGhe | Scalar; @TrangThai, @HanGiuCho, @Now; BIT | Xác định đơn đã thanh toán/hoàn thành hoặc đơn chờ còn hạn có đang chiếm ghế hay không. |
| fn_GheCoVeHieuLucSuatTuongLai | Scalar; @GheID INT; BIT | Kiểm tra ghế có vé hiệu lực ở suất tương lai; hỗ trợ bảo vệ thao tác thay đổi ghế/phòng. |
| fn_GioiHanDonDangGiu | Scalar; không tham số; INT = 3 | Cấp giới hạn số đơn giữ chỗ đồng thời của khách cho thủ tục đặt vé. |
| fn_GioiHanGheMoiDon | Scalar; không tham số; INT = 10 | Cấp giới hạn số ghế trong một đơn. |
| fn_GioiHanGiamGiaPhanTram | Scalar; không tham số; INT = 99 | Cấp trần phần trăm giảm giá, đồng bộ với CK_KHUYENMAI_PhanTram99. |
| fn_GioiHanSoLuongSanPham | Scalar; không tham số; INT = 10 | Cấp giới hạn số lượng mỗi sản phẩm trong đơn. |
| fn_GioRap | Scalar; @UtcInstant DATETIME2(7); DATETIMEOFFSET(7) | Chuyển instant UTC sang múi giờ SE Asia Standard Time để hiển thị theo giờ rạp. |
| fn_HomNay | Scalar; không tham số; DATE | Trả ngày kinh doanh hiện tại theo giờ rạp. |
| fn_KiemTraQuanLyRapScope | Scalar; @NguoiDungID INT, @RapID INT; BIT | Kiểm tra tài khoản quản lý có phân công hiệu lực cho rạp theo ngày kinh doanh hay không. |
| fn_KiemTraQuyenNguoiDung | Scalar; @NguoiDungID INT, @MaQuyen VARCHAR(50); BIT | Đối chiếu tài khoản đang hoạt động với VAITRO_QUYEN và QUYEN để kiểm tra quyền chức năng. |
| fn_NgayKinhDoanh | Scalar; @UtcInstant DATETIME2(7); DATE | Đổi thời điểm UTC thành ngày theo giờ rạp, dùng trong điều kiện ngày phim/lịch chiếu. |
| fn_ThoiGianGiaHanThanhToanPhut | Scalar; không tham số; INT = 5 | Cấp khoảng gia hạn thanh toán dùng trong nghiệp vụ thanh toán. |
| fn_ThoiGianGiuChoPhut | Scalar; không tham số; INT = 5 | Cấp thời gian giữ ghế cho đơn chờ thanh toán. |
| fn_TinhBoiThuongVe | Inline TVF; @TongTienVe, @TongTienDoAn, @TienGiamGia DECIMAL(18,2); bảng gồm TienVeThucTra DECIMAL(38,6), DiemCong BIGINT | Phân bổ giảm giá theo tỷ trọng để xác định phần tiền vé được tính bồi thường và quy đổi thành điểm. |
| fn_TinhGiaVe | Scalar; @SuatChieuID INT, @GheID INT; DECIMAL(18,2) | Tính giá ghế từ giá cơ bản của suất và các phụ thu bảng giá phù hợp với rạp, loại ghế, loại ngày, định dạng và thời hạn. |
| fn_TinhTongTienDoAn | Scalar; @DonDatVeID INT; DECIMAL(18,2) | Cộng số lượng nhân đơn giá đã chốt trong CHITIETDOAN. |
| fn_TinhTongTienDon | Scalar; @DonDatVeID INT; DECIMAL(18,2) | Tính số tiền đơn từ tổng vé, đồ ăn và mức giảm đã lưu. |
| fn_TinhTongTienVe | Scalar; @DonDatVeID INT; DECIMAL(18,2) | Cộng GiaVe của vé trong đơn, loại vé đã hủy. |
| fn_UtcTuGioRap | Scalar; @LocalDateTime DATETIME2(7); DATETIME2(7) | Chuyển thời gian địa phương theo múi giờ rạp về UTC để lưu/so sánh. |

Hai hàm bảng được viết dạng inline TVF, cho phép truy vấn kết quả như một nguồn hàng trong câu lệnh SQL. Những function còn lại trả một giá trị scalar; chúng không tự ghi dữ liệu và được procedure dùng như các phép tính hoặc điều kiện tái sử dụng. Cách tổ chức này giữ cách diễn giải thời gian, trạng thái ghế, quyền và giá nhất quán trong Database, trong khi các bước thay đổi trạng thái và transaction vẫn thuộc stored procedure.
