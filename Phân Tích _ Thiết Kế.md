**BỘ GIÁO DỤC VÀ ĐÀO TẠO**

## Bổ sung quản lý đặt vé nhân viên — baseline hiện hành

**44 Use Case hoạt động:** Customer 14, Manager 10, CSKH 6, Admin 14. `QLR-10` quản lý đặt vé trong rạp được phân công còn hiệu lực; `ADM-18` quản lý đặt vé toàn hệ thống. `ADM-17` vẫn là cấu hình hệ thống ngoài phạm vi. Giữ ba ID `ADM-03/04/05` RETIRED: tổng 47 ID truy vết; số 45 chỉ còn trong snapshot nghiệm thu cũ và tên file giữ để tương thích liên kết.

Bốn role và ma trận seed cố định giữ nguyên. Module mới yêu cầu role chính xác ADMIN/QUAN_LY_RAP và quyền `DAT_VE` hiện có; mọi SP tự kiểm tra actor còn hoạt động và Manager scope. Customer chỉ được chọn từ tài khoản KHACH_HANG đang hoạt động bằng tên/email/SĐT, không nhập ID hay tạo tài khoản thay trong luồng này.

**Quy tắc được chủ dự án chấp thuận:** tạo đơn Chờ thanh toán bằng nghiệp vụ booking hiện có (giới hạn giữ chỗ/ghế, khóa concurrency, giá snapshot); không tự thanh toán. Chỉ sửa ghế trong cùng suất chiếu khi đơn còn hạn giữ chỗ, chưa có bất kỳ lần thử thanh toán, không có khuyến mãi/đồ ăn hoặc vé đã sử dụng. Customer, suất chiếu, thời hạn giữ, tiền đồ ăn/giảm giá không sửa. Ghế giữ nguyên giữ snapshot/mã vé; ghế bỏ chuyển Đã hủy và giữ bản ghi; ghế mới tính giá hiện tại và mã vé mới. Không xóa vật lý. Hủy toàn bộ đơn Chờ thanh toán bằng quy tắc hiện có, giữ lịch sử vé/payment. Chặn hủy khi có thanh toán đang xử lý/thành công hoặc vé đã sử dụng để không đua với thanh toán. Đơn đã thanh toán/hoàn thành chỉ xem: source chưa có hoàn tiền tự nguyện; đây là blocker của hủy/hoàn tiền loại đơn này, không dùng hủy suất chiếu để giả lập.

**Kiến trúc triển khai:** route `/admin/bookings` và `/manager/bookings` riêng cho module mới, không refactor portal cũ. API dưới `/api/admin/bookings` và `/api/manager/bookings`: GET list (search/status/cinemaId/page/pageSize), GET customers (search tên/email/SĐT, tối thiểu 2 ký tự, tối đa 50 kết quả mỗi tìm kiếm), GET options (cinemaId/showtimeId/orderId khi sửa), GET `/:orderId`, POST create, PUT `/:orderId/seats`, POST `/:orderId/cancel`. DELETE bị từ chối 405, không ghi/xóa dữ liệu; không có API ghi payment/RBAC mới. Pagination danh sách thực hiện ở SQL; lookup suất tối đa 200 kết quả, trả total/truncated rõ và lọc theo rạp.

**Nghiệm thu bắt buộc:** hai role list/search/filter/detail/create/edit/cancel; Customer không tồn tại/sai role/khóa; Manager ngoài scope/hết hiệu lực; invalid show/room/seat; cùng ghế race/double-submit; paid/used/payment-in-flight từ chối và no-write; snapshot/history giữ nguyên; browser desktop/mobile, keyboard/modal/dirty/stale-request. Không kế thừa PASS lịch sử; ghi kết quả thực chạy trong FINAL_SYSTEM_AUDIT.md. Main deployment vẫn cần review và phê duyệt theo database/README.md.


**TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT THÀNH PHỐ HỒ CHÍ MINH**

**KHOA CÔNG NGHỆ THÔNG TIN**

\-----🙞🙜🕮🙞🙜-----

**PHÂN TÍCH THIẾT KẾ HỆ THỐNG CỦA PROJECT**

**Giảng viên hướng dẫn: TS. Phan Thị Thể**

**Nhóm sinh viên thực hiện:**

|     |     |
| --- | --- |
| **Họ và tên** | **MSSV** |
| Đoàn Anh Tuấn | 24110366 |
| Ung Văn Trí | 24110361 |
| Lý Đông Thịnh | 24110337 |
| Ngô Anh Bằng | 24110166 |
| Nguyễn Minh Huân | 24110220 |

_Thành phố Hồ Chí Minh, tháng 09 năm 2026_

**Quyết định RBAC cố định (11/10/2026):** 44 Use Case hoạt động: Customer 14, Manager 10, CSKH 6, Admin 14. `ADM-03`, `ADM-04`, `ADM-05` là **RETIRED**; giữ ID/evidence lịch sử trong ma trận 47 ID. Chỉ có Customer (`KHACH_HANG`), Manager (`QUAN_LY_RAP`), CSKH và Admin (`ADMIN`). Vai trò xác định khi tạo tài khoản và bất biến sau đó; danh mục quyền và Role–Permission bất biến đối với ứng dụng. Customer tự đăng ký; Admin chỉ tạo Manager/CSKH/Admin. Admin tiếp tục phân công/chuyển rạp cho Manager bằng selector tên, hiển thị phân công hiện tại và xác nhận chuyển rạp; giữ scope/thời hạn và khả năng nhiều phân công hiện có.

**CHƯƠNG 1: TỔNG QUAN VÀ YÊU CẦU HỆ THỐNG**

**1.1. Phát biểu bài toán**

Xây dựng ứng dụng web quản lý đặt vé xem phim trực tuyến cho một chuỗi rạp. Khách hàng tự thực hiện toàn bộ quy trình mua vé online: xem phim và lịch chiếu, chọn ghế, mua thêm đồ ăn/thức uống, áp mã khuyến mãi, thanh toán, xem lịch sử đơn, đánh giá phim đã xem và gửi khiếu nại khi phát hiện vấn đề. Admin và Manager được tạo đơn Chờ thanh toán cho Customer có sẵn qua module quản lý đặt vé, theo phạm vi quyền/rạp và quy tắc đã duyệt; thanh toán tiếp tục dùng luồng Customer hiện có.

Hệ thống sử dụng một bảng NGUOIDUNG thống nhất cho tất cả tài khoản và phân quyền theo bốn vai trò: KHACH_HANG, QUAN_LY_RAP, CSKH và ADMIN. Quyền chức năng được xác định bằng VAITRO_QUYEN, trong khi phạm vi rạp mà quản lý được thao tác được giới hạn bởi PHANCONG_RAP.

**1.2. Mục tiêu**

- Thiết kế CSDL SQL Server đạt tối thiểu chuẩn 3NF, phản ánh đúng nghiệp vụ chuỗi rạp và đặt vé trực tuyến.
- Đảm bảo toàn vẹn dữ liệu bằng PK, FK, CHECK, UNIQUE, DEFAULT, Trigger, Stored Procedure và Transaction.
- Xây dựng frontend React.js theo hướng component, tách rõ giao diện khách hàng và giao diện nghiệp vụ nội bộ.
- Xây dựng backend Node.js/Express.js cung cấp REST API, kiểm soát xác thực, RBAC và phạm vi rạp trước khi truy cập dữ liệu.
- Giải quyết an toàn tình huống đồng thời quan trọng nhất: Nhiều khách hàng cùng đặt một ghế trong cùng suất chiếu.

**1.3. Phạm vi dự án**

| **Trong phạm vi** | **Ngoài phạm vi** |
| --- | --- |
| Tài khoản với role/quyền cố định, phân công Manager; quản lý đặt vé QLR-10/ADM-18 | POS/thu tiền mặt tại quầy, tự đánh dấu đơn đã thanh toán |
| Rạp, phòng chiếu, ghế, phim, thể loại, diễn viên, suất chiếu | Ứng dụng mobile native |
| Bảng giá, khuyến mãi, sản phẩm, đặt vé và thanh toán | Hệ thống kế toán/ERP ngoài phạm vi đặt vé |
| Đánh giá phim, khiếu nại và lịch sử xử lý | Tích hợp cổng thanh toán thật |
| Báo cáo/doanh thu ở mức phục vụ quản lý rạp và Admin | Hệ thống BI quy mô doanh nghiệp |

**1.4. Kiến trúc và công nghệ**

| **Tầng** | **Công nghệ** | **Vai trò** |
| --- | --- | --- |
| Frontend | React.js | Hiển thị giao diện SPA/component; quản lý form, trạng thái màn hình, điều hướng và gọi REST API. |
| Backend API | Node.js+ Express.js | Xác thực, RBAC, validate request, điều phối nghiệp vụ, gọi Stored Procedure/View/Function. |
| Data Access | package mssql | Connection pool, tham số hóa truy vấn, gọi RPC/Stored Procedure tới SQL Server. |
| Database | Microsoft SQL Server | 25 bảng, constraint, Trigger, View, Index, Stored Procedure, Function, Transaction, Role/Login. |

**Luồng tổng quát**: React.js gửi request JSON qua HTTP/HTTPS đến REST API Node.js/Express.js. Backend xác thực người dùng, kiểm tra quyền và phạm vi rạp, sau đó gọi lớp service/data access. Các nghiệp vụ nhiều bước như đặt vé, thanh toán và xử lý khiếu nại được ưu tiên đóng gói trong Stored Procedure/Transaction ở SQL Server để đảm bảo tính nguyên tử và nhất quán.

**CHƯƠNG 2: PHÂN TÍCH NGHIỆP VỤ VÀ CHỨC NĂNG**

**2.1 Nhận diện tác nhân và chức năng hệ thống**

<div class="joplin-table-wrapper"><table><thead><tr><th><p><strong>Tác nhân</strong></p></th><th><p><strong>Chức năng</strong></p></th></tr></thead><tbody><tr><td><p>Khách hàng</p></td><td><ul><li>Đăng ký tài khoản</li><li>Đăng nhập hệ thống</li><li>Xem và cập nhật thông tin cá nhân</li><li>Xem danh sách phim và chi tiết phim</li><li>Xem lịch chiếu theo rạp/suất chiếu</li><li>Chọn ghế theo suất chiếu</li><li>Đặt vé</li><li>Mua đồ ăn/thức uống kèm vé</li><li>Áp dụng mã khuyến mãi</li><li>Thanh toán đơn đặt vé</li><li>Xem lịch sử đặt vé</li><li>Xem chi tiết đơn đặt vé</li><li>Đánh giá phim đã xem</li><li>Gửi khiếu nại</li></ul></td></tr><tr><td><p>Quản lý rạp</p></td><td><ul><li>Đăng nhập hệ thống</li><li>Quản lý phòng chiếu thuộc rạp được phân công</li><li>Quản lý sơ đồ ghế thuộc rạp được phân công</li><li>Tạo suất chiếu</li><li>Sửa suất chiếu</li><li>Hủy suất chiếu</li><li>Cấu hình bảng giá cho rạp được phân công</li><li>Theo dõi hoạt động rạp được phân công</li><li>Xem báo cáo doanh thu rạp được phân công</li></ul></td></tr><tr><td><p>CSKH</p></td><td><ul><li>Đăng nhập hệ thống</li><li>Xem danh sách khiếu nại</li><li>Tra cứu chi tiết khiếu nại</li><li>Xem đơn đặt vé tham chiếu (nếu có)</li><li>Ghi nhận lần xử lý khiếu nại</li><li>Cập nhật trạng thái khiếu nại</li></ul></td></tr><tr><td><p>Quản trị viên</p></td><td><ul><li>Đăng nhập hệ thống</li><li>Quản lý tài khoản người dùng (khóa/mở tài khoản)</li><li>Phân công quản lý rạp</li><li>Quản lý rạp chiếu phim (toàn hệ thống)</li><li>Quản lý phòng chiếu và ghế (toàn hệ thống)</li><li>Quản lý danh mục phim</li><li>Quản lý thể loại phim</li><li>Quản lý sản phẩm ăn uống</li><li>Quản lý chương trình khuyến mãi</li><li>Quản lý bảng giá (toàn hệ thống)</li><li>Quản lý suất chiếu (toàn hệ thống)</li><li>Xử lý khiếu nại</li><li>Xem báo cáo doanh thu toàn hệ thống</li></ul></td></tr></tbody></table></div>

**2.2. Đặc tả Use Case**

**2.2.1 Tác nhân khách hàng**

**Chức năng Đăng ký tài khoản**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-01 |
| **Tên Use Case** | Đăng ký tài khoản |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Cho phép người dùng mới tự tạo tài khoản để sử dụng các chức năng dành cho khách hàng như đặt vé, đánh giá phim, gửi khiếu nại. |
| **Luồng hoạt động** | 1\. Người dùng truy cập trang đăng ký, nhập thông tin cá nhân (họ tên, email, mật khẩu, số điện thoại...).<br><br>2\. Hệ thống kiểm tra tính hợp lệ dữ liệu và kiểm tra trùng lặp Email trong bảng NGUOIDUNG.<br><br>3\. Hệ thống tạo bản ghi mới trong NGUOIDUNG, tự động gán VaiTroID tương ứng vai trò KHACH_HANG (theo chính sách ứng dụng).<br><br>4\. Hệ thống tạo bản ghi mở rộng trong HOSOKHACHHANG (ngày sinh, giới tính, điểm tích lũy...).<br><br>5\. Hệ thống thông báo đăng ký thành công và cho phép đăng nhập. |

**Chức năng Đăng nhập**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-02 |
| **Tên Use Case** | Đăng nhập hệ thống |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Xác thực tài khoản để truy cập các chức năng theo đúng vai trò được cấp. |
| **Luồng hoạt động** | 1\. Người dùng nhập Email + mật khẩu.<br><br>2\. Hệ thống kiểm tra thông tin đăng nhập trong NGUOIDUNG và kiểm tra trạng thái tài khoản (đang hoạt động/bị khóa).<br><br>3\. Hệ thống xác định VaiTroID của tài khoản, tra cứu VAITRO_QUYEN để lấy danh sách quyền tương ứng.<br><br>4\. Hệ thống khởi tạo phiên làm việc, trả về thông tin vai trò/quyền cần thiết cho phiên.<br><br>5\. Người dùng được điều hướng vào khu vực chức năng tương ứng với vai trò (Customer/Manager/CSKH/Admin). |

**Chức năng Xem và cập nhật thông tin cá nhân**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-03 |
| **Tên Use Case** | Xem và cập nhật thông tin cá nhân |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Khách hàng xem và chỉnh sửa thông tin hồ sơ cá nhân của chính mình. |
| **Luồng hoạt động** | 1\. Khách hàng truy cập trang hồ sơ cá nhân.<br><br>2\. Hệ thống truy xuất dữ liệu từ NGUOIDUNG và HOSOKHACHHANG theo NguoiDungID đang đăng nhập.<br><br>3\. Khách hàng chỉnh sửa các trường được phép (họ tên, số điện thoại, ngày sinh, giới tính...).<br><br>4\. Hệ thống kiểm tra hợp lệ và cập nhật vào NGUOIDUNG/HOSOKHACHHANG. |

**Chức năng Xem danh sách phim và chi tiết phim**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-04 |
| **Tên Use Case** | Xem danh sách phim và chi tiết phim |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Cho phép người dùng (kể cả khách chưa đăng nhập, route công khai) tra cứu thông tin phim đang chiếu/sắp chiếu. |
| **Luồng hoạt động** | 1\. Người dùng truy cập trang danh sách phim (route Public/Customer).<br><br>2\. Hệ thống truy vấn bảng PHIM, kết hợp PHIM_THELOAI/THELOAI và PHIM_DIENVIEN/DIENVIEN để hiển thị thể loại, diễn viên.<br><br>3\. Người dùng chọn một phim để xem chi tiết (mô tả, thời lượng, thể loại, diễn viên...). |

**Chức năng Xem lịch chiếu theo rạp/suất chiếu**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-05 |
| **Tên Use Case** | Xem lịch chiếu theo rạp/suất chiếu |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Khách hàng xem các suất chiếu của một phim theo rạp, phòng chiếu và thời gian. |
| **Luồng hoạt động** | 1\. Từ trang chi tiết phim, khách hàng chọn xem lịch chiếu.<br><br>2\. Hệ thống truy vấn SUATCHIEU kết hợp PHONGCHIEU và RAPCHIEUPHIM theo PHIM đã chọn (PHIM → SUATCHIEU → PHONGCHIEU → RAPCHIEUPHIM).<br><br>3\. Hệ thống hiển thị danh sách suất chiếu theo rạp, ngày, giờ, định dạng chiếu.<br><br>4\. Khách hàng chọn một suất chiếu để tiếp tục sang bước chọn ghế/đặt vé. |

**Chức năng Chọn ghế theo suất chiếu**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-06 |
| **Tên Use Case** | Chọn ghế theo suất chiếu |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Cho phép khách hàng chọn ghế còn trống trong sơ đồ ghế của phòng chiếu tương ứng với suất chiếu đã chọn. |
| **Luồng hoạt động** | 1\. Hệ thống xác định PHONGCHIEU của SUATCHIEU đã chọn, truy vấn toàn bộ GHE thuộc phòng.<br><br>2\. Hệ thống đối chiếu với CHITIETVE để xác định ghế nào đã được bán trong đúng suất chiếu này.<br><br>3\. Hệ thống hiển thị sơ đồ ghế: còn trống / đã đặt / đang giữ chỗ.<br><br>4\. Khách hàng chọn một hoặc nhiều ghế còn trống để tiếp tục đặt vé. |

**Chức năng Đặt vé**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-07 |
| **Tên Use Case** | Đặt vé |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Khách hàng hoàn tất chọn suất chiếu, ghế, đồ ăn, khuyến mãi để tạo đơn/vé duy nhất. |
| **Luồng hoạt động** | 1\. Khách hàng chọn SuatChieuID và danh sách GheID muốn đặt.<br><br>2\. (Tuỳ chọn) khách hàng chọn thêm SanPhamID ăn uống và/hoặc nhập mã khuyến mãi.<br><br>3\. Hệ thống kiểm tra ghế thuộc đúng phòng của suất chiếu (BR03) và chưa được bán hợp lệ trong cùng suất chiếu (BR02) trong một Transaction.<br><br>4\. Hệ thống tính giá vé (giá cơ bản của suất chiếu kết hợp phụ thu BANGGIA theo loại ghế/ngày/định dạng; mọi phụ thu áp dụng được CỘNG DỒN, và hai dòng BANGGIA cùng rạp, cùng điều kiện, cùng "Áp dụng" không được có khoảng hiệu lực giao nhau; cuối tuần là thứ Bảy và Chủ nhật) và chốt giá trị snapshot GiaVe (BR09).<br><br>5\. Hệ thống tạo bản ghi DONDATVE ở trạng thái Chờ thanh toán, các CHITIETVE tương ứng ghế đã chọn, CHITIETDOAN nếu có đồ ăn, gắn KhuyenMaiID nếu áp dụng khuyến mãi. Đơn được giữ ghế đúng 5 phút (HanGiuCho = thời điểm đặt + 5 phút, đặt một lần và không bao giờ được gia hạn); mỗi đơn tối đa 10 ghế, mỗi dòng sản phẩm tối đa 10, mỗi khách tối đa 3 đơn đang giữ chỗ (chưa thanh toán và chưa quá hạn); ghế đó hiển thị "đang giữ chỗ" với khách khác và không thể đặt. Quá hạn mà chưa thanh toán, đơn chuyển sang Hết hạn và ghế được nhả.<br><br>6\. Nếu phát hiện xung đột (ghế vừa bị người khác đặt), hệ thống rollback toàn bộ giao dịch và thông báo lỗi cho khách hàng. |

**Chức năng Mua đồ ăn/thức uống kèm vé**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-08 |
| **Tên Use Case** | Mua đồ ăn/thức uống kèm vé |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Cho phép khách hàng chọn thêm sản phẩm ăn uống/combo trong quá trình đặt vé. |
| **Luồng hoạt động** | 1\. Trong bước đặt vé, khách hàng xem danh sách SANPHAM đang kinh doanh.<br><br>2\. Khách hàng chọn sản phẩm và số lượng mong muốn.<br><br>3\. Hệ thống lưu lựa chọn vào CHITIETDOAN gắn với DONDATVE, ghi nhận đơn giá tại thời điểm mua (đơn giá snapshot). |

**Chức năng Áp dụng mã khuyến mãi**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-09 |
| **Tên Use Case** | Áp dụng mã khuyến mãi |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Trong lúc đặt vé, khách hàng nhập mã khuyến mãi để được giảm giá nếu mã hợp lệ. |
| **Luồng hoạt động** | 1\. Khách hàng nhập mã khuyến mãi ở bước đặt vé.<br><br>2\. Hệ thống tra cứu KHUYENMAI theo mã, kiểm tra thời gian hiệu lực, số lượng sử dụng còn lại và điều kiện đơn hàng tối thiểu.<br><br>3\. Nếu hợp lệ: hệ thống tính TienGiamGia (theo % hoặc số tiền cố định, có giới hạn mức giảm tối đa) và gắn KhuyenMaiID vào DONDATVE.<br><br>4\. Nếu không hợp lệ: hệ thống báo lỗi và không áp dụng giảm giá; đơn vẫn có thể tiếp tục mà không cần khuyến mãi (KhuyenMaiID được phép để trống). |

**Chức năng Thanh toán đơn đặt vé**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-10 |
| **Tên Use Case** | Thanh toán đơn đặt vé |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Khách hàng thực hiện thanh toán cho đơn đặt vé đã tạo; một đơn có thể có nhiều lần thử giao dịch. |
| **Luồng hoạt động** | 1\. Khách hàng chọn DonDatVeID cần thanh toán và phương thức thanh toán.<br><br>2\. Hệ thống tạo bản ghi THANHTOAN (số tiền, phương thức, thời gian, mã giao dịch, trạng thái = đang xử lý).<br><br>3\. Hệ thống ghi nhận kết quả giao dịch trả về và cập nhật trạng thái bản ghi THANHTOAN tương ứng.<br><br>4\. Hệ thống đồng bộ trạng thái DONDATVE.TrangThai theo kết quả thanh toán mới nhất.<br><br>5\. Thời gian giữ ghế KHÔNG được gia hạn dưới bất kỳ thao tác nào (kể cả bắt đầu thanh toán hay thanh toán thất bại); không thể bắt đầu thanh toán đơn đã hết hạn giữ ghế. Kết quả thanh toán thành công đến muộn sau hạn giữ vẫn được ghi nhận nếu suất chiếu còn mở bán và không đơn nào khác đang giữ hoặc đã mua các ghế đó (thanh toán hiện là mô phỏng; khi tích hợp cổng thanh toán thật cần chính sách riêng cho trường hợp này). Thanh toán thành công là hoàn tất: hệ thống không có chức năng hoàn tiền và không hủy đơn đã thanh toán. |

**Chức năng Xem lịch sử đặt vé**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-11 |
| **Tên Use Case** | Xem lịch sử đặt vé |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Khách hàng xem lại danh sách các đơn đặt vé đã thực hiện. |
| **Luồng hoạt động** | 1\. Khách hàng truy cập trang lịch sử đơn hàng.<br><br>2\. Hệ thống truy vấn các bản ghi DONDATVE theo đúng NguoiDungID đang đăng nhập.<br><br>3\. Hệ thống hiển thị danh sách đơn kèm thông tin tóm tắt: suất chiếu, tổng tiền, trạng thái đơn. |

**Chức năng Xem chi tiết đơn đặt vé**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-12 |
| **Tên Use Case** | Xem chi tiết đơn đặt vé |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Khách hàng xem đầy đủ thông tin của một đơn đặt vé cụ thể thuộc chính mình. |
| **Luồng hoạt động** | 1\. Khách hàng chọn một đơn từ danh sách lịch sử.<br><br>2\. Hệ thống truy vấn DONDATVE kết hợp SUATCHIEU/PHIM, CHITIETVE/GHE, CHITIETDOAN/SANPHAM và THANHTOAN liên quan.<br><br>3\. Hệ thống hiển thị đầy đủ chi tiết: phim, suất chiếu, ghế đã đặt, đồ ăn kèm theo, các giao dịch thanh toán.<br><br>4\. Hệ thống chỉ cho phép xem đơn thuộc đúng tài khoản đang đăng nhập (BR04). |

**Chức năng Đánh giá phim đã xem**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-13 |
| **Tên Use Case** | Đánh giá phim đã xem |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Khách hàng đánh giá một phim đã xem bằng số sao và nội dung nhận xét; mỗi người chỉ được đánh giá một phim một lần. |
| **Luồng hoạt động** | 1\. Khách hàng chọn phim muốn đánh giá.<br><br>2\. Hệ thống kiểm tra khách hàng có lịch sử DONDATVE hợp lệ (trạng thái đã thanh toán/hoàn thành) gắn với SUATCHIEU của phim này và suất chiếu đó đã bắt đầu (điều kiện phải có lịch sử xem hợp lệ).<br><br>3\. Hệ thống kiểm tra khách hàng chưa từng đánh giá phim này.<br><br>4\. Khách hàng nhập số sao và nội dung; hệ thống tạo bản ghi DANHGIAPHIM. |

**Chức năng Gửi khiếu nại**

|     |     |
| --- | --- |
| **Mã Use Case** | KH-14 (UC06) |
| **Tên Use Case** | Gửi khiếu nại |
| **Tác nhân thực hiện** | Khách hàng |
| **Mô tả chức năng** | Người dùng gửi khiếu nại khi phát hiện vấn đề trong quá trình sử dụng hệ thống, có thể gửi bất kỳ lúc nào, kể cả không gắn với đơn cụ thể. |
| **Luồng hoạt động** | 1\. Người dùng chọn chức năng gửi khiếu nại, nhập loại khiếu nại, tiêu đề, nội dung.<br><br>2\. (Tuỳ chọn) người dùng chọn DonDatVeID liên quan nếu khiếu nại gắn với một đơn cụ thể; trường này được phép để trống (BR06 - không dùng để suy ra người gửi).<br><br>3\. Hệ thống tạo bản ghi KHIEUNAI với trạng thái ban đầu (chưa xử lý) và ghi nhận thời gian tạo, người gửi. |

**2.2.2 Tác nhân Quản lý rạp**

**Chức năng Đăng nhập**

|     |     |
| --- | --- |
| **Mã Use Case** | QLR-01 |
| **Tên Use Case** | Đăng nhập hệ thống |
| **Tác nhân thực hiện** | Quản lý rạp |
| **Mô tả chức năng** | Quản lý rạp đăng nhập để truy cập khu vực Manager (dashboard rạp, phòng, ghế, suất chiếu, bảng giá, thống kê doanh thu). |
| **Luồng hoạt động** | 1\. Quản lý rạp nhập Email + mật khẩu.<br><br>2\. Hệ thống xác thực tài khoản, xác định vai trò QUAN_LY_RAP và tra cứu quyền qua VAITRO_QUYEN.<br><br>3\. Hệ thống kiểm tra thêm PHANCONG_RAP còn hiệu lực để xác định phạm vi rạp được truy cập.<br><br>4\. Hệ thống điều hướng vào khu vực Manager tương ứng. |

**Chức năng Quản lý phòng chiếu thuộc rạp được phân công**

|     |     |
| --- | --- |
| **Mã Use Case** | QLR-02 |
| **Tên Use Case** | Quản lý phòng chiếu thuộc rạp được phân công |
| **Tác nhân thực hiện** | Quản lý rạp |
| **Mô tả chức năng** | Thêm/sửa/xóa thông tin phòng chiếu, chỉ trong phạm vi rạp đang được phân công quản lý. |
| **Luồng hoạt động** | 1\. Quản lý rạp truy cập màn hình quản lý phòng chiếu.<br><br>2\. Hệ thống kiểm tra PHANCONG_RAP còn hiệu lực của tài khoản để xác định danh sách rạp được phép thao tác (BR08).<br><br>3\. Quản lý rạp thêm/sửa/xóa PHONGCHIEU (tên phòng, loại phòng, trạng thái) thuộc rạp trong phạm vi được phân công.<br><br>4\. Hệ thống từ chối thao tác nếu phòng chiếu không thuộc rạp được phân công. |

**Chức năng Quản lý sơ đồ ghế thuộc rạp được phân công**

|     |     |
| --- | --- |
| **Mã Use Case** | QLR-03 |
| **Tên Use Case** | Quản lý sơ đồ ghế thuộc rạp được phân công |
| **Tác nhân thực hiện** | Quản lý rạp |
| **Mô tả chức năng** | Thêm/sửa/xóa ghế trong sơ đồ của các phòng chiếu thuộc rạp được phân công. |
| **Luồng hoạt động** | 1\. Quản lý rạp chọn một phòng chiếu thuộc rạp được phân công.<br><br>2\. Hệ thống hiển thị sơ đồ ghế (GHE) hiện có của phòng.<br><br>3\. Quản lý rạp thêm/sửa/xóa ghế: hàng ghế, số ghế, loại ghế, trạng thái sử dụng.<br><br>4\. Hệ thống lưu thông tin ghế gắn đúng PhongID và kiểm tra phòng thuộc phạm vi được phân công. |

**Chức năng Tạo suất chiếu**

|     |     |
| --- | --- |
| **Mã Use Case** | QLR-04 |
| **Tên Use Case** | Tạo suất chiếu |
| **Tác nhân thực hiện** | Quản lý rạp |
| **Mô tả chức năng** | Lập lịch chiếu phim mới cho một phòng chiếu thuộc rạp được phân công. |
| **Luồng hoạt động** | 1\. Quản lý rạp chọn PhimID, PhongID (thuộc rạp được phân công), nhập thời gian bắt đầu/kết thúc, định dạng chiếu và giá vé cơ bản.<br><br>2\. Hệ thống kiểm tra phòng chiếu có thuộc rạp mà tài khoản đang được phân công quản lý hay không.<br><br>3\. Hệ thống kiểm tra suất chiếu không trùng khoảng thời gian với suất chiếu khác trong cùng phòng.<br><br>4\. Hệ thống tạo bản ghi SUATCHIEU mới, mở lịch chiếu để khách hàng xem và đặt vé. |

**Chức năng Sửa suất chiếu**

|     |     |
| --- | --- |
| **Mã Use Case** | QLR-05 |
| **Tên Use Case** | Sửa suất chiếu |
| **Tác nhân thực hiện** | Quản lý rạp |
| **Mô tả chức năng** | Điều chỉnh thông tin một suất chiếu đã tạo (thời gian, định dạng, giá vé cơ bản...). |
| **Luồng hoạt động** | 1\. Quản lý rạp chọn suất chiếu cần sửa trong phạm vi rạp quản lý.<br><br>2\. Quản lý rạp cập nhật thông tin cần thay đổi.<br><br>3\. Hệ thống kiểm tra lại ràng buộc không trùng lịch chiếu trong cùng phòng (BR01) trước khi lưu.<br><br>4\. Hệ thống cập nhật bản ghi SUATCHIEU. |

**Chức năng Hủy suất chiếu**

|     |     |
| --- | --- |
| **Mã Use Case** | QLR-06 |
| **Tên Use Case** | Hủy suất chiếu |
| **Tác nhân thực hiện** | Quản lý rạp |
| **Mô tả chức năng** | Hủy một suất chiếu chưa diễn ra hoặc không còn nhu cầu chiếu. |
| **Luồng hoạt động** | 1\. Quản lý rạp chọn suất chiếu cần hủy trong phạm vi rạp quản lý.<br><br>2\. Hệ thống kiểm tra ràng buộc: chỉ được hủy suất chiếu chưa có ai đặt vé, tức không có đơn đang giữ chỗ hoặc đã thanh toán cho suất này (đơn đã hủy hoặc hết hạn không tính). Nếu đã có khách đặt, hệ thống từ chối hủy.<br><br>3\. Hệ thống cập nhật trạng thái/hủy bản ghi SUATCHIEU và ngừng hiển thị suất chiếu cho khách hàng. |

**Chức năng Cấu hình bảng giá cho rạp được phân công**

|     |     |
| --- | --- |
| **Mã Use Case** | QLR-07 |
| **Tên Use Case** | Cấu hình bảng giá cho rạp được phân công |
| **Tác nhân thực hiện** | Quản lý rạp |
| **Mô tả chức năng** | Thiết lập mức phụ thu theo loại ghế, loại ngày và định dạng chiếu cho rạp đang quản lý. |
| **Luồng hoạt động** | 1\. Quản lý rạp truy cập màn hình bảng giá của rạp được phân công.<br><br>2\. Quản lý rạp tạo/sửa quy tắc BANGGIA: loại ghế, loại ngày, định dạng, mức phụ thu, khoảng thời gian hiệu lực.<br><br>3\. Hệ thống lưu cấu hình; khi khách hàng đặt vé, hệ thống kết hợp giá vé cơ bản của SUATCHIEU với mức phụ thu tương ứng để xác định giá vé thực tế. |

**Chức năng Theo dõi hoạt động rạp được phân công**

|     |     |
| --- | --- |
| **Mã Use Case** | QLR-08 |
| **Tên Use Case** | Theo dõi hoạt động rạp được phân công |
| **Tác nhân thực hiện** | Quản lý rạp |
| **Mô tả chức năng** | Theo dõi tình hình vận hành (suất chiếu, tỉ lệ lấp đầy, số đơn đặt vé...) của các rạp đang được phân công. |
| **Luồng hoạt động** | 1\. Quản lý rạp truy cập dashboard rạp.<br><br>2\. Hệ thống tổng hợp dữ liệu theo chuỗi RAPCHIEUPHIM → PHONGCHIEU → SUATCHIEU → DONDATVE, giới hạn trong phạm vi rạp được phân công.<br><br>3\. Hệ thống hiển thị các chỉ số vận hành cho quản lý rạp theo dõi. |

**Chức năng Xem báo cáo doanh thu rạp được phân công**

|     |     |
| --- | --- |
| **Mã Use Case** | QLR-09 |
| **Tên Use Case** | Xem báo cáo doanh thu rạp được phân công |
| **Tác nhân thực hiện** | Quản lý rạp |
| **Mô tả chức năng** | Xem báo cáo doanh thu tổng hợp của rạp đang được phân công quản lý. |
| **Luồng hoạt động** | 1\. Quản lý rạp chọn khoảng thời gian cần xem báo cáo.<br><br>2\. Hệ thống tổng hợp các bản ghi THANHTOAN thành công liên kết qua DONDATVE → SUATCHIEU → PHONGCHIEU → RAPCHIEUPHIM, giới hạn trong phạm vi được phân công.<br><br>3\. Hệ thống hiển thị báo cáo doanh thu thông qua các View/Function tổng hợp đã thiết kế sẵn. |

**2.2.3. Tác nhân Nhân viên chăm sóc khách hàng**

**Chức năng Đăng nhập**

|     |     |
| --- | --- |
| **Mã Use Case** | CSKH-01 (UC01) |
| **Tên Use Case** | Đăng nhập hệ thống |
| **Tác nhân thực hiện** | CSKH (Nhân viên chăm sóc khách hàng) |
| **Mô tả chức năng** | Nhân viên CSKH đăng nhập để truy cập khu vực xử lý khiếu nại. |
| **Luồng hoạt động** | 1\. CSKH nhập Email + mật khẩu.<br><br>2\. Hệ thống xác thực tài khoản, xác định vai trò CSKH và tra cứu quyền qua VAITRO_QUYEN.<br><br>3\. Hệ thống điều hướng vào khu vực CSKH: danh sách khiếu nại, bộ lọc trạng thái/ưu tiên, chi tiết khiếu nại, form ghi lần xử lý. |

**Chức năng Xem danh sách khiếu nại**

|     |     |
| --- | --- |
| **Mã Use Case** | CSKH-02 |
| **Tên Use Case** | Xem danh sách khiếu nại |
| **Tác nhân thực hiện** | CSKH (Nhân viên chăm sóc khách hàng) |
| **Mô tả chức năng** | CSKH xem toàn bộ khiếu nại cần tiếp nhận và xử lý. |
| **Luồng hoạt động** | 1\. CSKH truy cập màn hình danh sách khiếu nại.<br><br>2\. Hệ thống truy vấn bảng KHIEUNAI, hỗ trợ lọc theo trạng thái/mức độ ưu tiên.<br><br>3\. Hệ thống hiển thị danh sách khiếu nại kèm trạng thái xử lý hiện tại. |

**Chức năng Tra cứu chi tiết khiếu nại**

|     |     |
| --- | --- |
| **Mã Use Case** | CSKH-03 |
| **Tên Use Case** | Tra cứu chi tiết khiếu nại |
| **Tác nhân thực hiện** | CSKH (Nhân viên chăm sóc khách hàng) |
| **Mô tả chức năng** | Xem đầy đủ nội dung và lịch sử xử lý của một khiếu nại cụ thể. |
| **Luồng hoạt động** | 1\. CSKH chọn một khiếu nại từ danh sách.<br><br>2\. Hệ thống hiển thị chi tiết KHIEUNAI: người gửi, loại khiếu nại, tiêu đề, nội dung, mức ưu tiên, ngày tạo, trạng thái.<br><br>3\. Hệ thống hiển thị kèm lịch sử các lần xử lý trong XULY_KHIEUNAI (nếu đã có). |

**Chức năng Xem đơn đặt vé tham chiếu**

|     |     |
| --- | --- |
| **Mã Use Case** | CSKH-04 |
| **Tên Use Case** | Xem đơn đặt vé tham chiếu (nếu có) |
| **Tác nhân thực hiện** | CSKH (Nhân viên chăm sóc khách hàng) |
| **Mô tả chức năng** | Khi khiếu nại có gắn DonDatVeID, CSKH xem thông tin đơn liên quan để đối chiếu, hỗ trợ xử lý. |
| **Luồng hoạt động** | 1\. Từ màn hình chi tiết khiếu nại, nếu DonDatVeID khác NULL, CSKH chọn xem đơn tham chiếu.<br><br>2\. Hệ thống truy vấn DONDATVE cùng thông tin liên quan (suất chiếu, vé/ghế, thanh toán) để CSKH đối chiếu.<br><br>3\. Nếu DonDatVeID là NULL, hệ thống thông báo khiếu nại này không gắn với đơn đặt vé cụ thể (BR06). |

**Chức năng Ghi nhận lần xử lý khiếu nại**

|     |     |
| --- | --- |
| **Mã Use Case** | CSKH-05 |
| **Tên Use Case** | Ghi nhận lần xử lý khiếu nại |
| **Tác nhân thực hiện** | CSKH (Nhân viên chăm sóc khách hàng) |
| **Mô tả chức năng** | CSKH ghi lại nội dung đã xử lý cho khiếu nại đang tiếp nhận; một khiếu nại có thể trải qua nhiều lần xử lý. |
| **Luồng hoạt động** | 1\. CSKH nhập nội dung xử lý cho khiếu nại đang chọn.<br><br>2\. Hệ thống kiểm tra quyền: chỉ CSKH/Admin được ghi XULY_KHIEUNAI.<br><br>3\. Hệ thống tạo bản ghi mới trong XULY_KHIEUNAI gồm: khiếu nại được xử lý, người xử lý, nội dung xử lý, thời gian, trạng thái sau xử lý. |

**Chức năng Cập nhật trạng thái khiếu nại**

|     |     |
| --- | --- |
| **Mã Use Case** | CSKH-06 (UC07) |
| **Tên Use Case** | Cập nhật trạng thái khiếu nại |
| **Tác nhân thực hiện** | CSKH (Nhân viên chăm sóc khách hàng) |
| **Mô tả chức năng** | Đồng bộ trạng thái của KHIEUNAI theo kết quả của lần xử lý mới nhất. |
| **Luồng hoạt động** | 1\. Sau khi ghi nhận lần xử lý (XULY_KHIEUNAI), CSKH chọn trạng thái mới cho khiếu nại.<br><br>2\. Hệ thống cập nhật trường trạng thái trong KHIEUNAI, đảm bảo đồng bộ với lịch sử xử lý mới nhất.<br><br>3\. Khách hàng có thể theo dõi trạng thái đã cập nhật khi tra cứu khiếu nại của mình. |

**2.2.4. Tác nhân Quan trị viên**

**Chức năng Đăng nhập hệ thống**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-01 (UC01) |
| **Tên Use Case** | Đăng nhập hệ thống |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Quản trị viên đăng nhập để truy cập toàn bộ khu vực Admin. |
| **Luồng hoạt động** | 1\. Admin nhập Email + mật khẩu.<br><br>2\. Hệ thống xác thực tài khoản, xác định vai trò ADMIN và tra cứu quyền qua VAITRO_QUYEN.<br><br>3\. Hệ thống điều hướng vào khu vực Admin: người dùng, rạp, phân công/chuyển rạp, danh mục phim/sản phẩm/khuyến mãi, suất chiếu, khiếu nại và báo cáo. |

**Chức năng Quản lý tài khoản người dùng**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-02 |
| **Tên Use Case** | Quản lý tài khoản người dùng (khóa/mở tài khoản) |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Tạo tài khoản cho nhân sự nội bộ (Quản lý rạp, CSKH, Admin khác) và quản lý trạng thái (khóa/mở) của mọi tài khoản trong hệ thống, kể cả tài khoản khách hàng. |
| **Luồng hoạt động** | 1\. Admin truy cập màn hình quản lý người dùng.<br><br>2\. Để tạo tài khoản nội bộ: Admin nhập thông tin và chọn vai trò cố định theo tên (QUAN_LY_RAP, CSKH hoặc ADMIN); hệ thống tạo bản ghi trong NGUOIDUNG với VaiTroID tương ứng (tài khoản Khách hàng do người dùng tự đăng ký, không tạo thay ở đây).<br><br>3\. Để quản lý trạng thái: Admin tìm kiếm tài khoản cần thao tác, xem thông tin chi tiết.<br><br>4\. Admin cập nhật TrangThai của tài khoản (khóa/mở) khi cần thiết; hệ thống ghi nhận thay đổi; không cho đổi VaiTroID sau khi tạo. |

**Lịch sử Use Case RBAC đã nghỉ hoạt động**

| Mã | Tên lịch sử | Trạng thái và quyết định |
|---|---|---|
| ADM-03 | Quản lý vai trò | **RETIRED** — bỏ thêm/sửa/xóa; bốn vai trò cố định |
| ADM-04 | Quản lý danh mục quyền | **RETIRED** — danh mục seed bất biến |
| ADM-05 | Gán quyền cho vai trò | **RETIRED** — Role–Permission seed bất biến; không gán/thu hồi |

Ba ID và verdict/evidence trước retirement được giữ tại `docs/USE_CASE_MATRIX_45.md`. Không có màn hình hoặc workflow ghi RBAC. Bảng/FK và SP đọc vẫn phục vụ xác thực; SP ghi lịch sử giữ signature nhưng từ chối.

**Chức năng Phân công quản lý rạp**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-06 |
| **Tên Use Case** | Phân công quản lý rạp |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Gán một tài khoản có vai trò QUAN_LY_RAP phụ trách quản lý một hoặc nhiều rạp trong một khoảng thời gian. |
| **Luồng hoạt động** | 1\. Admin chọn Manager bằng tên/email và xem phân công hiện tại.<br><br>2\. Admin chọn rạp bằng tên cần phân công và nhập khoảng thời gian hiệu lực (ngày bắt đầu - ngày kết thúc).<br><br>3\. Hệ thống kiểm tra tài khoản được chọn đúng có vai trò QUAN_LY_RAP.<br><br>4\. Hệ thống tạo hoặc cập nhật PHANCONG_RAP; chuyển rạp phải xác nhận Manager, rạp cũ và mới; phạm vi phân công còn hiệu lực này được dùng để kiểm soát mọi thao tác quản lý sau đó của tài khoản (BR08). |

**Chức năng Quản lý rạp chiếu phim**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-07 |
| **Tên Use Case** | Quản lý rạp chiếu phim (toàn hệ thống) |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Thêm/sửa/xóa thông tin rạp chiếu phim trên toàn hệ thống, không giới hạn phạm vi phân công; quản lý gallery ảnh URL/metadata thuộc rạp. |
| **Luồng hoạt động** | 1\. Admin truy cập màn hình quản lý rạp.<br><br>2\. Admin thêm/sửa/xóa thông tin RAPCHIEUPHIM: tên rạp, địa chỉ, thành phố, số điện thoại, mô tả, ngày hoạt động, trạng thái.<br><br>3\. Trong cùng ADM-07, Admin quản lý HINHANH_RAPCHIEUPHIM: URL/path, mô tả, thứ tự hiển thị, trạng thái và một ảnh đại diện. |

**Chức năng Quản lý rạp chiếu phim**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-08 |
| **Tên Use Case** | Quản lý phòng chiếu và ghế (toàn hệ thống) |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Thêm/sửa/xóa phòng chiếu và ghế của bất kỳ rạp nào trong hệ thống, không bị giới hạn theo PHANCONG_RAP như Quản lý rạp. |
| **Luồng hoạt động** | 1\. Admin chọn một rạp bất kỳ trong hệ thống (RAPCHIEUPHIM).<br><br>2\. Admin quản lý PHONGCHIEU thuộc rạp: tên phòng, loại phòng, trạng thái.<br><br>3\. Admin quản lý GHE thuộc từng phòng: hàng ghế, số ghế, loại ghế, trạng thái. |

**Chức năng Quản lý danh mục phim**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-09 |
| **Tên Use Case** | Quản lý danh mục phim |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Thêm/sửa/xóa thông tin phim và thiết lập quan hệ với thể loại, diễn viên. |
| **Luồng hoạt động** | 1\. Admin truy cập màn hình quản lý phim.<br><br>2\. Admin thêm/sửa/xóa PHIM (tên phim, mô tả, thời lượng, ngày khởi chiếu...).<br><br>3\. Admin gán thể loại cho phim qua PHIM_THELOAI (quan hệ n-n với THELOAI).<br><br>4\. Admin gán diễn viên và vai diễn cho phim qua PHIM_DIENVIEN (quan hệ n-n với DIENVIEN). |

**Chức năng Quản lý thể loại phim**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-10 |
| **Tên Use Case** | Quản lý thể loại phim |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Thêm/sửa/xóa danh mục thể loại phim dùng trong quan hệ n-n với phim. |
| **Luồng hoạt động** | 1\. Admin truy cập màn hình danh mục thể loại.<br><br>2\. Admin thêm/sửa/xóa thể loại trong bảng THELOAI. |

**Chức năng Quản lý sản phẩm ăn uống**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-11 |
| **Tên Use Case** | Quản lý sản phẩm ăn uống |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Thêm/sửa/xóa danh mục sản phẩm đồ ăn, thức uống, combo phục vụ khách hàng khi đặt vé. |
| **Luồng hoạt động** | 1\. Admin truy cập màn hình quản lý sản phẩm.<br><br>2\. Admin thêm/sửa/xóa SANPHAM: tên sản phẩm, giá, mô tả, trạng thái kinh doanh. |

**Chức năng Quản lý chương trình khuyến mãi**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-12 |
| **Tên Use Case** | Quản lý chương trình khuyến mãi |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Thêm/sửa/xóa các chương trình khuyến mãi áp dụng khi khách hàng đặt vé. |
| **Luồng hoạt động** | 1\. Admin truy cập màn hình quản lý khuyến mãi.<br><br>2\. Admin tạo/sửa/xóa KHUYENMAI: mã code, loại giảm giá (phần trăm/số tiền), giá trị giảm, điều kiện đơn tối thiểu, mức giảm tối đa, thời gian hiệu lực, số lượng sử dụng, trạng thái. |

**Chức năng Quản lý bảng giá**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-13 |
| **Tên Use Case** | Quản lý bảng giá (toàn hệ thống) |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Cấu hình mức phụ thu theo loại ghế/loại ngày/định dạng cho bất kỳ rạp nào trong hệ thống. |
| **Luồng hoạt động** | 1\. Admin chọn rạp cần cấu hình bảng giá (không giới hạn phạm vi phân công).<br><br>2\. Admin tạo/sửa quy tắc BANGGIA: loại ghế, loại ngày, định dạng, mức phụ thu, thời gian hiệu lực.<br><br>3\. Hệ thống lưu cấu hình để sử dụng khi tính giá vé thực tế cho khách hàng. |

**Chức năng Quản lý suất chiếu**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-14 |
| **Tên Use Case** | Quản lý suất chiếu (toàn hệ thống) |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Tạo/sửa/hủy suất chiếu cho bất kỳ phòng chiếu/rạp nào, không bị ràng buộc theo phạm vi phân công. |
| **Luồng hoạt động** | 1\. Admin chọn PhimID và PhongID (thuộc bất kỳ rạp nào), nhập thời gian, định dạng, giá vé cơ bản.<br><br>2\. Hệ thống kiểm tra không trùng thời gian với suất chiếu khác trong cùng phòng (BR01).<br><br>3\. Hệ thống tạo/cập nhật/hủy bản ghi SUATCHIEU tương ứng thao tác của Admin. |

**Chức năng Xử lý khiếu nại**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-15 (UC07) |
| **Tên Use Case** | Xử lý khiếu nại |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Admin có quyền tiếp nhận và xử lý khiếu nại tương tự CSKH khi cần thiết. |
| **Luồng hoạt động** | 1\. Admin xem danh sách/chi tiết khiếu nại (tương tự luồng CSKH-02, CSKH-03).<br><br>2\. Admin nhập nội dung xử lý; hệ thống tạo bản ghi trong XULY_KHIEUNAI (BR07: chỉ CSKH/Admin được ghi).<br><br>3\. Hệ thống cập nhật trạng thái KHIEUNAI đồng bộ theo kết quả xử lý. |

**Chức năng Xem báo cáo doanh thu toàn hệ thống**

|     |     |
| --- | --- |
| **Mã Use Case** | ADM-16 |
| **Tên Use Case** | Xem báo cáo doanh thu toàn hệ thống |
| **Tác nhân thực hiện** | Quản trị viên (Admin) |
| **Mô tả chức năng** | Tổng hợp doanh thu và số liệu vận hành của toàn bộ hệ thống, không giới hạn theo rạp. |
| **Luồng hoạt động** | 1\. Admin chọn khoảng thời gian/tiêu chí báo cáo.<br><br>2\. Hệ thống tổng hợp dữ liệu từ toàn bộ RAPCHIEUPHIM → PHONGCHIEU → SUATCHIEU → DONDATVE → THANHTOAN thông qua các View/Function báo cáo (F12).<br><br>3\. Hệ thống hiển thị báo cáo doanh thu theo rạp, theo phim, theo thời gian cho Admin theo dõi. |

**CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ CƠ SỞ DỮ LIỆU**

**3.1. Mục tiêu và nguyên tắc thiết kế**

CSDL là phần lõi của hệ thống vì các nghiệp vụ đặt vé, thanh toán, lịch chiếu và phân quyền đều cần đảm bảo tính nhất quán ngay cả khi nhiều request đến đồng thời. Thiết kế theo hướng dữ liệu chuẩn hóa, hạn chế lặp thông tin, nhưng vẫn giữ các giá trị snapshot giao dịch cần thiết để phản ánh đúng trạng thái tại thời điểm phát sinh.

- Mỗi thực thể có khóa chính ổn định, khóa ngoại biểu diễn quan hệ thay vì lặp thuộc tính suy diễn.
- Quan hệ nhiều - nhiều được tách thành bảng nối có khóa ghép phù hợp.
- Dữ liệu có thể suy ra nhưng không cần snapshot thì ưu tiên tính qua View/Function thay vì lưu lặp.
- Dữ liệu giao dịch cần bất biến theo thời điểm như GiaVe, DonGia, TongTienVe, TongTienDoAn, TienGiamGia được giữ như snapshot và chỉ cập nhật qua nghiệp vụ kiểm soát.
- Ràng buộc cục bộ dùng CHECK/UNIQUE/DEFAULT; ràng buộc nhiều bảng/nhiều dòng dùng Trigger/Stored Procedure/Transaction.
- Các cột thường xuyên lọc/join/sắp xếp được thiết kế Index có chủ đích, tránh tạo index tràn lan.

**3.1b. Quy tắc nghiệp vụ điểm, thanh toán và doanh thu (chốt 2026-10-14)**

Các quy tắc sau là quyết định nghiệp vụ cuối cùng; chúng nằm trong Use Case đặt vé/thanh toán/hủy suất hiện có (KH-07, KH-09, KH-10, QLR-06, ADM-14), không bổ sung Use Case mới.

1. **Hệ thống không có hoàn tiền** dưới bất kỳ hình thức nào (không refund API, giao dịch hoàn tiền hay tiến trình hoàn tiền). Các trạng thái `Đã hoàn tiền` (THANHTOAN) và `Hoàn tiền` (DONDATVE) chỉ còn trong CHECK để tương thích dữ liệu; không có thủ tục nào ghi chúng và không thuộc nghiệp vụ hoạt động.
2. **Hủy suất chiếu có đơn đã thanh toán:** tiền vé còn lại sau khuyến mãi (cả phần đã trả bằng tiền lẫn bằng điểm) được quy đổi thành điểm bồi thường theo `dbo.fn_TinhBoiThuongVe` (1.000 VNĐ = 1 điểm) và cộng vào tài khoản một lần. Thanh toán và doanh thu đã thu **không bị trừ**; việc cộng điểm không phải giao dịch hoàn tiền.
3. **Dùng điểm để trả tiền vé:** 1 điểm = 1.000 VNĐ (tỷ lệ nghịch đảo của điểm bồi thường). Điểm chỉ giảm phần *tiền vé còn phải trả sau khuyến mãi* (không giảm đồ ăn), tối đa theo số dư và theo giá trị đó (làm tròn xuống điểm nguyên). SQL Server tự tính mọi số tiền; khách chỉ chọn số điểm muốn thử.
4. **Giữ điểm:** điểm được trừ ngay khi tạo đơn (khóa dòng hồ sơ khách để không tiêu hai lần). Đơn chưa thanh toán hết hạn hoặc bị nhân viên hủy trả lại đúng số điểm đã giữ, một lần; đơn đã thanh toán không trả lại điểm khi đổi suất/hủy suất mà được bồi thường theo quy tắc 2.
5. **Đơn trả đủ bằng điểm** (tiền còn phải trả = 0) hoàn tất bằng phương thức thanh toán `DIEM`; các phương thức tiền chỉ nhận khi còn tiền phải trả. Đơn này đóng góp **0 đồng** tiền thực thu và không tích điểm.
6. **Tích điểm** (1 điểm / 1.000 VNĐ) tính trên **tiền thật đã trả** của lần thanh toán thành công, không tính trên phần trả bằng điểm.
7. **TienGiamGia** là tổng tiền giảm từ khuyến mãi và `DiemSuDung × 1.000 VNĐ`. **Tiền thực thu** = `MAX(0, TongTienVe + TongTienDoAn − TienGiamGia)` của các đơn có thanh toán thành công, mỗi đơn một lần; phần trả bằng điểm không phải doanh thu; đơn bị hủy suất vẫn giữ tiền đã thu. Dashboard Admin, báo cáo Admin/Manager, `vw_DoanhThuTheoRap` và các thủ tục báo cáo dùng cùng công thức và tách rõ: tổng đơn thanh toán thành công, đơn còn hiệu lực, đơn có tiền thực thu, tiền thuộc đơn bị hủy, giá trị trả bằng điểm.

**3.2. Các bảng theo nhóm dữ liệu**

| **Nhóm dữ liệu** | **Các bảng** | **Trách nhiệm** |
| --- | --- | --- |
| Tài khoản - RBAC | VAITRO, QUYEN, VAITRO_QUYEN, NGUOIDUNG, HOSOKHACHHANG, PHANCONG_RAP | Danh tính, quyền chức năng và phạm vi rạp. |
| Rạp - phòng - ghế | RAPCHIEUPHIM, PHONGCHIEU, GHE, HINHANH_RAPCHIEUPHIM | Cấu trúc vật lý và hình ảnh của chuỗi rạp. |
| Phim - danh mục | PHIM, THELOAI, PHIM_THELOAI, DIENVIEN, PHIM_DIENVIEN | Thông tin phim và các quan hệ n-n. |
| Lịch chiếu - giá | SUATCHIEU, BANGGIA | Lập lịch chiếu, định dạng, giá cơ bản và phụ thu. |
| Đặt vé - bán hàng | KHUYENMAI, DONDATVE, CHITIETVE, SANPHAM, CHITIETDOAN, THANHTOAN | Đơn, vé, đồ ăn, khuyến mãi và giao dịch thanh toán. |
| Tương tác sau bán & CSKH | DANHGIAPHIM, KHIEUNAI, XULY_KHIEUNAI, TINNHAN_KHIEUNAI, YEUCAU_CHUYENCAP | Đánh giá phim, hồ sơ khiếu nại, chat 2 chiều, phân công một lần và chuyển cấp Admin. |

**3.3. Mô hình ERD**

Mô hình ERD của hệ thống quản lý đặt vé xem phim trực tuyến được xây dựng nhằm biểu diễn đầy đủ các thực thể dữ liệu, thuộc tính và mối quan hệ phát sinh từ các nghiệp vụ của hệ thống. Theo thiết kế chuẩn hóa hoàn chỉnh cơ sở dữ liệu gồm 29 bảng được chia thành các nhóm chính: tài khoản – phân quyền, rạp – phòng – ghế – hình ảnh, phim – thể loại – diễn viên, suất chiếu – bảng giá, đặt vé – sản phẩm – thanh toán, bồi thường hủy suất, đánh giá phim và khiếu nại – chăm sóc khách hàng (với nguyên tắc phân công một lần duy nhất, loại bỏ hoàn toàn cơ chế chuyển giao/lịch sử phân công).

Trong mô hình, bảng NGUOIDUNG giữ vai trò trung tâm đối với các nghiệp vụ liên quan đến tài khoản. Mỗi người dùng thuộc một VAITRO, trong khi quyền của từng vai trò được xác định thông qua bảng trung gian VAITRO_QUYEN liên kết với QUYEN. Đối với khách hàng, các thông tin mở rộng được lưu tại HOSOKHACHHANG. Riêng người dùng có vai trò quản lý rạp có thể được gán cho một hoặc nhiều rạp thông qua bảng PHANCONG_RAP, từ đó giới hạn phạm vi dữ liệu mà quản lý được phép thao tác.

Nhóm dữ liệu rạp chiếu được tổ chức theo cấu trúc phân cấp. Một RAPCHIEUPHIM có nhiều PHONGCHIEU và mỗi phòng chiếu có nhiều GHE. Ngoài ra, mỗi rạp có thể có nhiều cấu hình BANGGIA để xác định mức phụ thu theo loại ghế, loại ngày và định dạng chiếu. Cách tổ chức này giúp tách biệt rõ thông tin cơ sở vật chất với chính sách giá vé.

Nhóm dữ liệu phim bao gồm PHIM, THELOAI và DIENVIEN. Do một phim có thể thuộc nhiều thể loại và một thể loại có thể áp dụng cho nhiều phim, quan hệ nhiều-nhiều này được tách qua bảng PHIM_THELOAI. Tương tự, quan hệ giữa phim và diễn viên được biểu diễn bằng bảng PHIM_DIENVIEN, trong đó có thể lưu thêm thông tin vai diễn.

Bảng SUATCHIEU liên kết PHIM với PHONGCHIEU thể hiện một phim được chiếu tại phòng nào, vào thời điểm nào, với định dạng và giá vé cơ bản tương ứng. Một phòng có thể có nhiều suất chiếu theo các thời điểm khác nhau và một phim có thể xuất hiện trong nhiều suất chiếu.

Đối với nghiệp vụ đặt vé DONDATVE là thực thể trung tâm. Mỗi đơn đặt vé thuộc một NGUOIDUNG và một SUATCHIEU. Nếu khách hàng sử dụng mã khuyến mãi, đơn có thể liên kết với một bản ghi KHUYENMAI; quan hệ này là tùy chọn nên KhuyenMaiID có thể để trống.

Một đơn đặt vé có thể chứa nhiều vé, được lưu trong CHITIETVE. Mỗi bản ghi chi tiết vé xác định một GHE cụ thể, giá vé tại thời điểm đặt, mã vé và trạng thái vé. Nhờ đó, hệ thống có thể quản lý chính xác từng ghế đã được đặt trong từng đơn. Ngoài vé xem phim, khách hàng có thể mua thêm sản phẩm ăn uống. Thông tin sản phẩm được lưu trong SANPHAM, còn các sản phẩm thuộc một đơn được lưu thông qua CHITIETDOAN. Một đơn có thể có nhiều sản phẩm và một sản phẩm có thể xuất hiện trong nhiều đơn khác nhau.

Nghiệp vụ thanh toán được tách thành bảng THANHTOAN. Một đơn đặt vé có thể có nhiều bản ghi thanh toán, phù hợp với trường hợp một giao dịch thất bại rồi được thực hiện lại hoặc phát sinh nhiều trạng thái giao dịch liên quan đến cùng một đơn. Quan hệ giữa DONDATVE và THANHTOAN vì vậy là quan hệ một-nhiều.

Đối với chức năng đánh giá phim bảng DANHGIAPHIM liên kết NGUOIDUNG với PHIM. Mỗi bản ghi lưu số sao, nội dung và thời điểm đánh giá. Thiết kế cho phép kiểm soát để một người dùng chỉ đánh giá một phim một lần.

Nhóm chăm sóc khách hàng được tổ chức qua hai bảng KHIEUNAI và XULY_KHIEUNAI. Mỗi khiếu nại bắt buộc thuộc về một NGUOIDUNG, thể hiện người gửi khiếu nại. DonDatVeID trong KHIEUNAI chỉ là tham chiếu tùy chọn, vì người dùng có thể khiếu nại về những vấn đề không liên quan trực tiếp đến một đơn đặt vé. Một khiếu nại có thể được xử lý nhiều lần, do đó KHIEUNAI có quan hệ một-nhiều với XULY_KHIEUNAI. Mỗi bản ghi xử lý tiếp tục tham chiếu tới NGUOIDUNG thông qua NguoiXuLyID để xác định nhân viên CSKH hoặc Admin đã thực hiện xử lý.

Các quan hệ chính trong ERD được xác định như sau:

VAITRO (1) — (n) NGUOIDUNG

VAITRO (1) — (n) VAITRO_QUYEN — (n) — (1) QUYEN

NGUOIDUNG (1) — (0..1) HOSOKHACHHANG

NGUOIDUNG (1) — (n) PHANCONG_RAP — (n) — (1) RAPCHIEUPHIM

RAPCHIEUPHIM (1) — (n) HINHANH_RAPCHIEUPHIM

RAPCHIEUPHIM (1) — (n) PHONGCHIEU

PHONGCHIEU (1) — (n) GHE

RAPCHIEUPHIM (1) — (n) BANGGIA

PHONGCHIEU (1) — (n) SUATCHIEU — (n) — (1) PHIM

PHIM (n) — (n) THELOAI thông qua PHIM_THELOAI

PHIM (n) — (n) DIENVIEN thông qua PHIM_DIENVIEN

NGUOIDUNG (1) — (n) DONDATVE — (n) — (1) SUATCHIEU

KHUYENMAI (0..1) — (n) DONDATVE

DONDATVE (1) — (n) CHITIETVE — (n) — (1) GHE

DONDATVE (1) — (n) CHITIETDOAN — (n) — (1) SANPHAM

DONDATVE (1) — (n) THANHTOAN

NGUOIDUNG (1) — (n) DANHGIAPHIM — (n) — (1) PHIM

NGUOIDUNG (1) — (n) KHIEUNAI

KHIEUNAI (1) — (n) XULY_KHIEUNAI — (n) — (1) NGUOIDUNG.

_Hình 3.1: Mô hình ERD hệ thống quản lý đặt vé xem phim trực tuyến_

**3.4. Quan hệ giữa các bảng**

| **Quan hệ** | **Ý nghĩa thiết kế** |
| --- | --- |
| VAITRO 1 - n NGUOIDUNG | Mỗi tài khoản có một vai trò hiện tại; một vai trò có nhiều tài khoản. |
| VAITRO n - n QUYEN qua VAITRO_QUYEN | Tách permission khỏi tài khoản, ma trận seed cố định, ứng dụng chỉ đọc. |
| NGUOIDUNG 1 - 0..1 HOSOKHACHHANG | Hồ sơ mở rộng chỉ cần cho tài khoản khách hàng. |
| NGUOIDUNG n - n RAPCHIEUPHIM qua PHANCONG_RAP | Một quản lý có thể quản lý nhiều rạp; một rạp có thể có nhiều phân công theo thời gian. |
| RAPCHIEUPHIM 1 - n PHONGCHIEU 1 - n GHE | Mỗi ghế thuộc đúng một phòng; mỗi phòng thuộc đúng một rạp. |
| RAPCHIEUPHIM 1 - n HINHANH_RAPCHIEUPHIM | Một rạp có thể chưa có hoặc có nhiều ảnh URL/metadata; mỗi ảnh thuộc đúng một rạp. Một filtered unique index bảo đảm tối đa một ảnh đại diện/rạp. |
| PHONGCHIEU 1 - n SUATCHIEU; PHIM 1 - n SUATCHIEU | Mỗi suất chiếu gắn một phim và một phòng. |
| PHIM n - n THELOAI / DIENVIEN | Dùng PHIM_THELOAI và PHIM_DIENVIEN để chuẩn hóa quan hệ nhiều-nhiều. |
| NGUOIDUNG 1 - n DONDATVE; SUATCHIEU 1 - n DONDATVE | Mỗi đơn thuộc một Customer và một suất chiếu; Admin/Manager tạo thay qua SP kiểm tra actor/scope, không đổi owner thành nhân viên. |
| DONDATVE 1 - n CHITIETVE; GHE 1 - n CHITIETVE | Chi tiết vé xác định ghế của đơn; khóa nghiệp vụ SuatChieuID + GheID được suy qua đơn. |
| DONDATVE 1 - n THANHTOAN | Một đơn có thể có nhiều lần thử thanh toán hoặc bồi thường. |
| NGUOIDUNG 1 - n KHIEUNAI; DONDATVE 0..1 - n KHIEUNAI | Người gửi là bắt buộc; đơn tham chiếu là tùy chọn. |
| KHIEUNAI 1 - n XULY_KHIEUNAI | Mỗi khiếu nại có lịch sử xử lý theo thời gian. |
| NGUOIDUNG 0..1 - n KHIEUNAI (NhanVienPhuTrachID) | Mỗi khiếu nại có tối đa một nhân viên CSKH phụ trách duy nhất. Ban đầu là NULL; sau khi Admin phân công hoặc CSKH tiếp nhận lần đầu, giá trị này trở nên bất biến (immutable) trong toàn bộ vòng đời khiếu nại. Không cho phép chuyển giao, phân công lại hay thu hồi (được bảo vệ ở tầng CSDL bởi trigger TRG_KhieuNai_NhanVienPhuTrachBatBien). |
| KHIEUNAI 1 - n TINNHAN_KHIEUNAI; NGUOIDUNG 1 - n TINNHAN_KHIEUNAI | Lưu hội thoại 2 chiều giữa khách và nhân viên, hỗ trợ ghi chú nội bộ bảo mật. |
| KHIEUNAI 1 - n YEUCAU_CHUYENCAP; NGUOIDUNG 1 - n YEUCAU_CHUYENCAP | Quản lý yêu cầu CSKH chuyển cấp lên Admin khi vấn đề vượt thẩm quyền. Xử lý chuyển cấp không làm thay đổi nhân viên CSKH phụ trách ban đầu. |

**3.5. Lược đồ quan hệ**

| **Bảng** | **Lược đồ** |
| --- | --- |
| VAITRO | VaiTroID (PK), MaVaiTro, TenVaiTro, MoTa |
| QUYEN | QuyenID (PK), MaQuyen, TenQuyen, MoTa |
| VAITRO_QUYEN | VaiTroID (PK, FK), QuyenID (PK, FK) |
| NGUOIDUNG | NguoiDungID (PK), VaiTroID (FK), HoTen, Email, MatKhau, SoDienThoai, NgayTao, TrangThai |
| HOSOKHACHHANG | NguoiDungID (PK, FK), NgaySinh, GioiTinh, DiemTichLuy |
| PHANCONG_RAP | PhanCongID (PK), NguoiDungID (FK), RapID (FK), NgayBatDau, NgayKetThuc, TrangThai |
| RAPCHIEUPHIM | RapID (PK), TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai |
| HINHANH_RAPCHIEUPHIM | HinhAnhRapID (PK), RapID (FK), URL, MoTa, LaAnhDaiDien, ThuTuHienThi, TrangThai, NgayTao |
| PHONGCHIEU | PhongID (PK), RapID (FK), TenPhong, LoaiPhong, TrangThai |
| GHE | GheID (PK), PhongID (FK), HangGhe, SoGhe, LoaiGhe, TrangThai |
| PHIM | PhimID (PK), TenPhim, ThoiLuong, NgayKhoiChieu, NgayKetThuc, NgonNgu, PhuDe, DoTuoi, DaoDien, MoTa, PosterURL, TrailerURL, TrangThai |
| THELOAI | TheLoaiID (PK), TenTheLoai |
| PHIM_THELOAI | PhimID (PK, FK), TheLoaiID (PK, FK) |
| DIENVIEN | DienVienID (PK), HoTen, NgaySinh, QuocTich |
| PHIM_DIENVIEN | PhimID (PK, FK), DienVienID (PK, FK), VaiDien |
| SUATCHIEU | SuatChieuID (PK), PhimID (FK), PhongID (FK), ThoiGianBatDau, ThoiGianKetThuc, DinhDang, GiaVeCoBan, TrangThai |
| BANGGIA | GiaID (PK), RapID (FK), LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai |
| KHUYENMAI | KhuyenMaiID (PK), MaCode, MoTa, LoaiGiamGia, GiaTriGiam, DonHangToiThieu, GiamToiDa, NgayBatDau, NgayKetThuc, SoLuong, SoLuongDaDung, TrangThai |
| DONDATVE | DonDatVeID (PK), NguoiDungID (FK), SuatChieuID (FK), KhuyenMaiID (FK, NULL), NgayDat, TongTienVe, TongTienDoAn, TienGiamGia, DiemSuDung, TrangThai |
| CHITIETVE | VeID (PK), DonDatVeID (FK), GheID (FK), GiaVe, MaVe, TrangThai |
| SANPHAM | SanPhamID (PK), TenSanPham, LoaiSanPham, Gia, MoTa, HinhAnh, TrangThai |
| CHITIETDOAN | ChiTietDoAnID (PK), DonDatVeID (FK), SanPhamID (FK), SoLuong, DonGia |
| THANHTOAN | ThanhToanID (PK), DonDatVeID (FK), PhuongThuc, SoTien, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai |
| DANHGIAPHIM | DanhGiaID (PK), PhimID (FK), NguoiDungID (FK), SoSao, NoiDung, NgayDanhGia |
| KHIEUNAI | KhieuNaiID (PK), NguoiDungID (FK), DonDatVeID (FK, NULL), LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai, NhanVienPhuTrachID (FK, NULL) |
| XULY_KHIEUNAI | XuLyID (PK), KhieuNaiID (FK), NguoiXuLyID (FK), NoiDungXuLy, NgayXuLy, TrangThaiSauXuLy |
| TINNHAN_KHIEUNAI | TinNhanID (PK), KhieuNaiID (FK), NguoiGuiID (FK), NoiDung, LoaiTinNhan, ThoiGianGui |
| YEUCAU_CHUYENCAP | YeuCauID (PK), KhieuNaiID (FK), NguoiYeuCauID (FK), LyDo, MucDoUuTien, AdminPhuTrachID (FK, NULL), TrangThai, ThoiGianGui, ThoiGianTiepNhan, KetQuaXuLy, ThoiGianHoanTat |
| BOITHUONG_HUYSUAT | BoiThuongID (PK), DonDatVeID (FK, UNIQUE), DiemBoiThuong, NgayBoiThuong, GhiChu |

**3.6. Phân tích chuẩn hóa**

**3.6.1. Chuẩn 1NF**

Các thuộc tính được lưu dưới dạng giá trị đơn. Những tập nhiều giá trị được tách riêng thay vì lưu chuỗi danh sách: PHIM_THELOAI cho nhiều thể loại của phim, PHIM_DIENVIEN cho nhiều diễn viên, VAITRO_QUYEN cho nhiều quyền của vai trò và PHANCONG_RAP cho nhiều rạp được quản lý. Vì vậy không có cột chứa danh sách ID hoặc danh sách tên lặp trong một ô.

**3.6.2. Chuẩn 2NF**

Phần lớn bảng dùng khóa chính đơn dạng ...ID nên mọi thuộc tính không khóa phụ thuộc toàn bộ khóa. Ba bảng khóa ghép quan trọng là VAITRO_QUYEN, PHIM_THELOAI và PHIM_DIENVIEN. Hai bảng đầu không có thuộc tính không khóa; ở PHIM_DIENVIEN, VaiDien phụ thuộc vào toàn bộ cặp (PhimID, DienVienID), vì vai diễn chỉ có nghĩa trong ngữ cảnh diễn viên tham gia một phim cụ thể.

**3.6.3. Chuẩn 3NF**

Thiết kế tránh lưu lại thông tin có thể suy ra qua quan hệ. CHITIETVE không lưu SuatChieuID vì có thể suy ra CHITIETVE -> DONDATVE -> SUATCHIEU. PHONGCHIEU không lưu địa chỉ rạp vì địa chỉ thuộc RAPCHIEUPHIM. DONDATVE không lặp thông tin phim/phòng/rạp vì tất cả được xác định qua SuatChieuID. HOSOKHACHHANG không lưu hạng thành viên nếu hạng này có thể suy từ DiemTichLuy theo quy tắc nghiệp vụ.

Một số cột tổng/giá được giữ có chủ đích và không bị xem như lỗi chuẩn hóa khi chúng đóng vai trò snapshot giao dịch. GiaVe trong CHITIETVE và DonGia trong CHITIETDOAN phải giữ mức giá tại thời điểm mua, không phụ thuộc vào giá hiện tại của SUATCHIEU/BANGGIA/SANPHAM sau đó. TongTienVe, TongTienDoAn và TienGiamGia trong DONDATVE là trạng thái chốt của giao dịch và cần được đồng bộ bằng Stored Procedure/Transaction.

**Chứng minh chuẩn hóa 3NF cho các bảng Chăm sóc khách hàng (CSKH) mới:**

1. **Bảng TINNHAN_KHIEUNAI:**
   - *Tập thuộc tính:* $R_1 = \{\text{TinNhanID, KhieuNaiID, NguoiGuiID, NoiDung, LoaiTinNhan, ThoiGianGui}\}$
   - *Khóa ứng viên:* $\{\text{TinNhanID}\}$ (Khóa chính đơn, tự tăng).
   - *Tập phụ thuộc hàm F:*
     - $\text{TinNhanID} \to \{\text{KhieuNaiID, NguoiGuiID, NoiDung, LoaiTinNhan, ThoiGianGui}\}$
   - *Kiểm tra 1NF:* Mọi thuộc tính đều mang giá trị nguyên tố (scalar atomic values), không chứa multi-valued attributes hay lặp nhóm $\implies$ Đạt 1NF.
   - *Kiểm tra 2NF:* Khóa chính là thuộc tính đơn ($\text{TinNhanID}$), do đó không thể tồn tại phụ thuộc hàm bộ phận vào một phần của khóa $\implies$ Đạt 2NF.
   - *Kiểm tra 3NF:* Mọi phụ thuộc hàm $X \to Y$ đều có $X = \text{TinNhanID}$ là siêu khóa (superkey). Bảng hoàn toàn **không lưu** các thuộc tính `HoTenNguoiGui`, `EmailNguoiGui`, `TenNhanVien`, hay `TieuDeKhieuNai` mà mọi thông tin người gửi/khiếu nại được truy xuất thông qua khóa ngoại $\text{NguoiGuiID} \to \text{NGUOIDUNG}$ và $\text{KhieuNaiID} \to \text{KHIEUNAI}$. Không có bất kỳ phụ thuộc bắc cầu nào giữa các thuộc tính không khóa $\implies$ **Đạt chuẩn 3NF**.

2. **Bảng YEUCAU_CHUYENCAP:**
   - *Tập thuộc tính:* $R_2 = \{\text{YeuCauID, KhieuNaiID, NguoiYeuCauID, LyDo, MucDoUuTien, AdminPhuTrachID, TrangThai, ThoiGianGui, ThoiGianTiepNhan, KetQuaXuLy, ThoiGianHoanTat}\}$
   - *Khóa ứng viên:* $\{\text{YeuCauID}\}$ (Khóa chính đơn).
   - *Tập phụ thuộc hàm F:*
     - $\text{YeuCauID} \to \{\text{KhieuNaiID, NguoiYeuCauID, LyDo, MucDoUuTien, AdminPhuTrachID, TrangThai, ThoiGianGui, ThoiGianTiepNhan, KetQuaXuLy, ThoiGianHoanTat}\}$
   - *Kiểm tra 1NF:* Toàn bộ các trường dữ liệu đều là giá trị đơn tử $\implies$ Đạt 1NF.
   - *Kiểm tra 2NF:* Khóa chính là đơn tính $\implies$ Đạt 2NF.
   - *Kiểm tra 3NF:* Với mọi phụ thuộc hàm không tầm thường $X \to Y$, $X = \text{YeuCauID}$ là siêu khóa. Bảng **không lưu dư thừa** tên nhân viên yêu cầu, email Admin, hay tiêu đề khiếu nại. Các thuộc tính này được liên kết qua FK: $\text{KhieuNaiID} \to \text{KHIEUNAI}$, $\text{NguoiYeuCauID} \to \text{NGUOIDUNG}$, $\text{AdminPhuTrachID} \to \text{NGUOIDUNG}$. Không có phụ thuộc bắc cầu $A \to B \to C$ giữa các thuộc tính không khóa $\implies$ **Đạt chuẩn 3NF**.

3. **Thuộc tính NhanVienPhuTrachID trong bảng KHIEUNAI và nguyên tắc phân công một lần bất biến:**
   - *Tập thuộc tính liên quan:* $R_{\text{KN}} = \{\text{KhieuNaiID, NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai, NhanVienPhuTrachID}\}$
   - *Khóa ứng viên:* $\{\text{KhieuNaiID}\}$ (Khóa chính đơn).
   - *Phụ thuộc hàm:* $\text{KhieuNaiID} \to \text{NhanVienPhuTrachID}$
   - *Chuẩn 3NF:* $\text{NhanVienPhuTrachID}$ là Foreign Key trỏ tới $\text{NGUOIDUNG}(\text{NguoiDungID})$, phụ thuộc trực tiếp vào khóa chính $\text{KhieuNaiID}$, không tồn tại phụ thuộc bắc cầu qua thuộc tính không khóa nào $\implies$ **Đạt chuẩn 3NF**.
   - *Quy tắc nghiệp vụ và bảo vệ toàn vẹn tại Database:*
     - Mỗi khiếu nại chỉ có tối đa một nhân viên CSKH phụ trách duy nhất trong suốt vòng đời.
     - Ban đầu trường mang giá trị `NULL`.
     - Khi Admin phân công lần đầu hoặc nhân viên CSKH tiếp nhận, `NhanVienPhuTrachID` được xác lập.
     - Ngay sau khi được gán, giá trị này **bất biến tuyệt đối (immutable)**: không cho phép cập nhật sang nhân viên khác, không cho phép gán lại `NULL`.
     - Tính bất biến được cưỡng chế ở tầng Database bằng trigger `TRG_KhieuNai_NhanVienPhuTrachBatBien` (chặn đứng mọi lệnh `UPDATE` trái phép với mã lỗi 50605) và các Stored Procedure `sp_Complaint_Assign_Self`, `sp_Complaint_Assign_Admin`.
     - Bảng `LICHSU_PHANCONG_KHIEUNAI` và mọi nghiệp vụ chuyển giao/phân công lại đã bị loại bỏ hoàn toàn khỏi hệ thống theo quyết định nghiệp vụ chính thức.

**3.7. Thiết kế logic theo từng nhóm dữ liệu**

**3.7.1. Tài khoản, vai trò, quyền và phạm vi rạp**

NGUOIDUNG là thực thể tài khoản duy nhất, liên kết trực tiếp tới VAITRO. Danh mục QUYEN và bảng nối VAITRO_QUYEN tách quyền chức năng khỏi dữ liệu người dùng, lưu ma trận quyền cố định theo seed; ứng dụng chỉ đọc và không đổi vai trò tài khoản sau khi tạo. HOSOKHACHHANG là quan hệ 1 - 0..1 dùng cho thông tin mở rộng khách hàng. PHANCONG_RAP biểu diễn phạm vi quản lý theo thời gian, nhờ đó quyền và phạm vi được tách thành hai chiều độc lập: được làm gì và được làm ở đâu.

**3.7.2. Rạp, phòng và ghế**

RAPCHIEUPHIM -> PHONGCHIEU -> GHE tạo cấu trúc phân cấp rõ ràng. UNIQUE(PhongID, HangGhe, SoGhe) đảm bảo không tồn tại hai ghế cùng vị trí trong một phòng. Khi đặt vé, chỉ cần lưu GheID ở CHITIETVE; phòng và rạp được suy ra từ GHE, tránh lặp thông tin vị trí vào dữ liệu giao dịch.

**3.7.3. Phim, thể loại và diễn viên**

PHIM chứa thuộc tính mô tả của phim. THELOAI và DIENVIEN là thực thể độc lập; các quan hệ nhiều-nhiều được chuẩn hóa qua PHIM_THELOAI và PHIM_DIENVIEN. Thuộc tính VaiDien nằm ở PHIM_DIENVIEN vì nó phụ thuộc vào cặp phim - diễn viên, không phải thuộc tính cố định của DIENVIEN.

**3.7.4. Suất chiếu và bảng giá**

SUATCHIEU xác định phim, phòng, khoảng thời gian, định dạng và giá cơ bản. BANGGIA không gắn trực tiếp một suất chiếu mà mô tả quy tắc phụ thu theo RapID, LoaiGhe, LoaiNgay, DinhDang và khoảng hiệu lực. Khi chốt vé, hệ thống tìm quy tắc BANGGIA hợp lệ rồi ghi giá cuối cùng vào CHITIETVE.GiaVe để tạo snapshot.

**3.7.5. Đơn đặt vé, chi tiết vé, đồ ăn và thanh toán**

DONDATVE là aggregate giao dịch chính, liên kết một khách hàng với một suất chiếu và một khuyến mãi tùy chọn. CHITIETVE chứa các ghế được mua và giá thực tế. CHITIETDOAN lưu sản phẩm, số lượng và đơn giá snapshot. THANHTOAN là quan hệ 1-n với DONDATVE để hỗ trợ nhiều lần thử giao dịch, thất bại hoặc hoàn tiền mà không ghi đè lịch sử.

**3.7.6. Đánh giá và khiếu nại - Hệ thống CSKH hiện đại**

DANHGIAPHIM liên kết trực tiếp NGUOIDUNG - PHIM và có UNIQUE(PhimID, NguoiDungID). KHIEUNAI liên kết bắt buộc với người gửi và tùy chọn với đơn đặt vé, mở rộng với `NhanVienPhuTrachID`. XULY_KHIEUNAI tách lịch sử xử lý khỏi trạng thái hiện tại, giúp biết ai đã xử lý, xử lý khi nào và sau mỗi lần trạng thái chuyển thành gì. Hệ thống bổ sung ba phân hệ CSKH cốt lõi:
- **Hội thoại hai chiều & Ghi chú nội bộ:** `TINNHAN_KHIEUNAI` lưu trữ dòng trao đổi công khai và ghi chú nội bộ (`LoaiTinNhan` = 'Nội bộ'). Quyền xem được bảo vệ nghiêm ngặt ở cả API và Stored Procedure: Khách hàng tuyệt đối không thể đọc tin nhắn nội bộ.
- **Tiếp nhận & Phân công nhân viên một lần duy nhất:** Khiếu nại mới nằm trong hàng đợi chưa phân công (`NhanVienPhuTrachID IS NULL`). Nhân viên CSKH dùng thủ tục `sp_Complaint_Assign_Self` để tiếp nhận bằng transaction kiểm soát concurrency (UPDLOCK, HOLDLOCK). Admin có quyền phân công nhân viên lần đầu qua `sp_Complaint_Assign_Admin`. Ngay khi được gán, `NhanVienPhuTrachID` trở thành bất biến (immutable), không cho phép chuyển giao, phân công lại hay thu hồi dưới bất kỳ hình thức nào (bảo vệ bởi trigger `TRG_KhieuNai_NhanVienPhuTrachBatBien`). Hệ thống loại bỏ hoàn toàn bảng lịch sử phân công.
- **Chuyển cấp lên Admin:** Khi vấn đề vượt thẩm quyền (lỗi tài chính, yêu cầu đối soát, bồi thường quy mô lớn), CSKH gửi yêu cầu qua `sp_Escalation_Create` vào `YEUCAU_CHUYENCAP`. Admin theo dõi hàng đợi chuyển cấp, tiếp nhận (`sp_Escalation_Claim`), đưa ra chỉ đạo/kết luận (`sp_Escalation_Process`), và CSKH tiếp nhận kết luận để phản hồi khách hàng.
- **Tra cứu hỗ trợ chỉ đọc:** CSKH được cấp quyền `TRA_CUU_DON` để kiểm tra đơn đặt vé tham chiếu, lịch sử thanh toán, điểm tích lũy và điểm bồi thường của khách hàng thông qua `sp_Support_Customer_GetPoints`, phục vụ giải thích minh bạch cho khách hàng mà không được quyền sửa đổi số dư tài chính.

**3.8 Phân tích các bảng giao dịch trọng tâm**

**3.8.1.** **DONDATVE**

| **Cột** | **Kiểu dữ liệu** | **Ràng buộc** | **Ý nghĩa** |
| --- | --- | --- | --- |
| DonDatVeID | INT | PK, IDENTITY | Định danh đơn |
| NguoiDungID | INT | FK, NOT NULL | Khách hàng tạo đơn |
| SuatChieuID | INT | FK, NOT NULL | Suất chiếu được đặt |
| KhuyenMaiID | INT | FK, NULL | Khuyến mãi áp dụng nếu có |
| NgayDat | DATETIME2 | DEFAULT thời điểm hiện tại | Thời điểm đặt |
| TongTienVe | DECIMAL | \>= 0 | Tổng vé snapshot |
| TongTienDoAn | DECIMAL | \>= 0 | Tổng đồ ăn snapshot |
| TienGiamGia | DECIMAL | \>= 0 | Tổng mức giảm thực tế từ khuyến mãi và điểm sử dụng |
| DiemSuDung | INT | \>= 0, DEFAULT 0 | Số điểm khách dùng để trả tiền vé của đơn (snapshot) |
| TrangThai | NVARCHAR | DEFAULT Chờ thanh toán | Trạng thái đơn |
| HanGiuCho | DATETIME2 | NULL; bắt buộc khi Chờ thanh toán | Hạn giữ ghế của đơn chờ thanh toán (NgayDat + 5 phút, đặt một lần lúc tạo đơn, không gia hạn) |

**3.8.2. SUATCHIEU**

| **Cột** | **Kiểu dữ liệu** | **Ràng buộc** | **Ý nghĩa** |
| --- | --- | --- | --- |
| SuatChieuID | INT | PK, IDENTITY | Mã suất |
| PhimID | INT | FK, NOT NULL | Phim được chiếu |
| PhongID | INT | FK, NOT NULL | Phòng chiếu |
| ThoiGianBatDau | DATETIME2 | NOT NULL | Bắt đầu |
| ThoiGianKetThuc | DATETIME2 | CHECK > bắt đầu | Kết thúc |
| DinhDang | NVARCHAR | CHECK tập giá trị | 2D/3D/IMAX/... |
| GiaVeCoBan | DECIMAL | CHECK >= 0 | Giá cơ bản |
| TrangThai | NVARCHAR | DEFAULT Mở bán | Trạng thái suất |

**3.8.3. CHITIETVE**

| **Cột** | **Kiểu dữ liệu** | **Ràng buộc** | **Ý nghĩa** |
| --- | --- | --- | --- |
| VeID | INT | PK, IDENTITY | Mã vé |
| DonDatVeID | INT | FK, NOT NULL | Đơn chứa vé |
| GheID | INT | FK, NOT NULL | Ghế được đặt |
| GiaVe | DECIMAL | CHECK >= 0 | Giá snapshot |
| MaVe | VARCHAR | UNIQUE, NOT NULL | Mã vé/QR |
| TrangThai | NVARCHAR | DEFAULT Đã đặt | Trạng thái vé |

**3.8.4. THANHTOAN**

| **Cột** | **Kiểu dữ liệu** | **Ràng buộc** | **Ý nghĩa** |
| --- | --- | --- | --- |
| ThanhToanID | INT | PK, IDENTITY | Mã giao dịch |
| DonDatVeID | INT | FK, NOT NULL | Đơn được thanh toán |
| PhuongThuc | NVARCHAR | CHECK tập phương thức | Phương thức |
| SoTien | DECIMAL | CHECK >= 0 | Số tiền |
| NgayTao | DATETIME2 | DEFAULT hiện tại | Lúc khởi tạo |
| NgayThanhToan | DATETIME2 | NULL | Lúc hoàn tất |
| MaGiaoDich | VARCHAR | UNIQUE khi có | Mã tham chiếu |
| TrangThai | NVARCHAR | DEFAULT Đang xử lý | Kết quả giao dịch |

**3.8.5. KHIEUNAI**

| **Cột** | **Kiểu dữ liệu** | **Ràng buộc** | **Ý nghĩa** |
| --- | --- | --- | --- |
| KhieuNaiID | INT | PK, IDENTITY | Mã khiếu nại |
| NguoiDungID | INT | FK, NOT NULL | Người gửi |
| DonDatVeID | INT | FK, NULL | Đơn tham chiếu tùy chọn |
| LoaiKhieuNai | NVARCHAR | NOT NULL | Loại vấn đề |
| TieuDe | NVARCHAR | NOT NULL | Tiêu đề |
| NoiDung | NVARCHAR | NOT NULL | Nội dung |
| MucDoUuTien | NVARCHAR | CHECK tập giá trị | Mức ưu tiên |
| NgayTao | DATETIME2 | DEFAULT hiện tại | Ngày gửi |
| TrangThai | NVARCHAR | DEFAULT Mới | Trạng thái hiện tại |

**3.9. Ràng buộc toàn vẹn dữ liệu**

| **Loại** | **Đối tượng** | **Ý nghĩa** |
| --- | --- | --- |
| UNIQUE | VAITRO.MaVaiTro | Không trùng mã vai trò. |
| UNIQUE | QUYEN.MaQuyen | Không trùng mã quyền. |
| UNIQUE | NGUOIDUNG.Email | Mỗi email chỉ thuộc một tài khoản. |
| UNIQUE | NGUOIDUNG.SoDienThoai | Không trùng số điện thoại khi có khai báo. |
| PK ghép | VAITRO_QUYEN(VaiTroID, QuyenID) | Không gán lặp cùng quyền cho cùng vai trò. |
| UNIQUE | GHE(PhongID, HangGhe, SoGhe) | Không có hai ghế cùng vị trí trong một phòng. |
| CHECK | SUATCHIEU.ThoiGianKetThuc > ThoiGianBatDau | Khoảng thời gian suất chiếu hợp lệ. |
| Trigger | SUATCHIEU - chống chồng lịch | Một phòng không có hai suất giao nhau. |
| UNIQUE | KHUYENMAI.MaCode | Mã khuyến mãi duy nhất. |
| CHECK | KHUYENMAI.NgayKetThuc >= NgayBatDau | Khoảng hiệu lực hợp lệ. |
| CHECK | Các giá trị tiền >= 0 | Không cho dữ liệu tiền âm. |
| DEFAULT | DONDATVE.TrangThai = Chờ thanh toán | Trạng thái khởi tạo nhất quán. |
| UNIQUE | CHITIETVE.MaVe | Mỗi vé có mã duy nhất. |
| Transaction/Trigger | SuatChieuID + GheID | Chống đặt trùng ghế. |
| Trigger | GHE.PhongID = SUATCHIEU.PhongID | Không đặt ghế sai phòng. |
| CHECK | CHITIETDOAN.SoLuong > 0 | Số lượng dương. |
| UNIQUE | CHITIETDOAN(DonDatVeID, SanPhamID) | Một sản phẩm một dòng trong đơn. |
| CHECK | DANHGIAPHIM.SoSao BETWEEN 1 AND 5 | Giới hạn thang điểm. |
| UNIQUE | DANHGIAPHIM(PhimID, NguoiDungID) | Một người đánh giá một phim một lần. |
| CHECK | PHANCONG_RAP.NgayKetThuc >= NgayBatDau | Thời gian phân công hợp lệ. |
| Procedure/Trigger | NguoiXuLyID phải CSKH/Admin | Bảo vệ nghiệp vụ xử lý khiếu nại. |

**CHƯƠNG 4. CÀI ĐẶT CSDL VÀ TÍCH HỢP REACT.JS - NODE.JS**

**4.1. Định hướng cài đặt SQL Server**

CHECK/UNIQUE/DEFAULT xử lý điều kiện cục bộ; Trigger bảo vệ quy tắc nhiều dòng/nhiều bảng; View đóng gói truy vấn đọc; Function tái sử dụng phép tính; Stored Procedure điều phối nghiệp vụ ghi; Transaction đảm bảo nguyên tử; Index tối ưu mẫu truy vấn; Role/Login minh họa phân quyền ở tầng DBMS. Các Stored Procedure có ghi dữ liệu phải dùng TRY...CATCH và Transaction khi phù hợp.

**4.2. Trigger**

| **Trigger** | **Bảng** | **Sự kiện** | **Chức năng** |
| --- | --- | --- | --- |
| TRG_SuatChieu_KiemTraTrungLich | SUATCHIEU | AFTER INSERT, UPDATE | Chống hai suất cùng phòng có khoảng thời gian giao nhau. |
| TRG_ChiTietVe_KiemTraGheDungPhong | CHITIETVE | AFTER INSERT, UPDATE | Ghế phải thuộc phòng của suất chiếu qua DONDATVE. |
| TRG_ChiTietVe_KiemTraTrungGhe | CHITIETVE | AFTER INSERT | Không bán hai vé còn hiệu lực cho cùng SuatChieuID + GheID. |
| TRG_DanhGia_KiemTraDaXemPhim | DANHGIAPHIM | AFTER INSERT | Chỉ cho đánh giá nếu có đơn đặt vé hợp lệ (đã thanh toán/hoàn thành) cho một suất chiếu của phim đó và suất chiếu đã bắt đầu (ThoiGianBatDau <= thời điểm hiện tại). |
| TRG_XuLyKhieuNai_KiemTraVaiTro | XULY_KHIEUNAI | AFTER INSERT, UPDATE | Chỉ CSKH/Admin được ghi lịch sử xử lý. |
| TRG_KhieuNai_NhanVienPhuTrachBatBien | KHIEUNAI | AFTER UPDATE | Cưỡng chế quy tắc phân công một lần: chặn cập nhật đổi người phụ trách hoặc gán lại NULL khi khiếu nại đã có nhân viên. |

**4.3. View**

| **View** | **Nguồn dữ liệu** | **Mục đích** |
| --- | --- | --- |
| vw_LichChieuChiTiet | SUATCHIEU, PHIM, PHONGCHIEU, RAPCHIEUPHIM | Trang lịch chiếu React. |
| vw_LichSuDatVe | DONDATVE, NGUOIDUNG, SUATCHIEU, PHIM, PHONGCHIEU, RAPCHIEUPHIM | Lịch sử đơn khách hàng. |
| vw_ChiTietDonDatVe | DONDATVE, CHITIETVE, GHE, CHITIETDOAN, SANPHAM, THANHTOAN | Chi tiết đơn tổng hợp. |
| vw_DoanhThuTheoRap | RAPCHIEUPHIM, PHONGCHIEU, SUATCHIEU, DONDATVE, THANHTOAN | Dashboard quản lý/Admin. |
| vw_DanhSachKhieuNai | KHIEUNAI, NGUOIDUNG, XULY_KHIEUNAI | Màn hình CSKH. |

**4.4. Stored Procedure**

| **Stored Procedure** | **Bảng chính** | **Nghiệp vụ** |
| --- | --- | --- |
| sp_DatVe | DONDATVE, CHITIETVE, SUATCHIEU, GHE, KHUYENMAI | Kiểm tra role, suất, phòng, ghế, giá, khuyến mãi, tạo đơn/vé trong Transaction. |
| sp_ThemSuatChieu | SUATCHIEU, PHONGCHIEU, PHIM | Kiểm tra dữ liệu và thời gian trước khi tạo suất. |
| sp_XuLyThanhToan | DONDATVE, THANHTOAN | Ghi/cập nhật giao dịch và đồng bộ trạng thái đơn. |
| sp_XuLyKhieuNai | KHIEUNAI, XULY_KHIEUNAI, NGUOIDUNG | Kiểm tra quyền, ghi lịch sử và cập nhật trạng thái. |
| sp_PhanCongQuanLyRap | NGUOIDUNG, VAITRO, PHANCONG_RAP, RAPCHIEUPHIM | Chỉ phân công QUAN_LY_RAP; kiểm tra thời gian và dữ liệu trùng. |

**4.5. User-Defined Function**

| **Function** | **Loại** | **Tham số** | **Ý nghĩa** |
| --- | --- | --- | --- |
| fn_TinhGiaVe | Scalar | @SuatChieuID, @GheID | Giá cơ bản + phụ thu BANGGIA hợp lệ. |
| fn_TinhTongTienVe | Scalar | @DonDatVeID | Tổng snapshot CHITIETVE.GiaVe, loại vé Đã hủy khỏi tiền đơn. |
| fn_TinhTongTienDoAn | Scalar | @DonDatVeID | SUM(SoLuong \* DonGia). |
| fn_TinhTongTienDon | Scalar | @DonDatVeID | Tổng vé + đồ ăn - giảm giá. |
| fn_DanhSachGheSuatChieu | Table-Valued | @SuatChieuID | Danh sách ghế, loại ghế, giá và trạng thái Trống/Đã đặt. |

**4.6. Transaction và xử lý đồng thời**

| **Nghiệp vụ** | **Bảng** | **Mục tiêu** |
| --- | --- | --- |
| Đặt vé | DONDATVE, CHITIETVE, KHUYENMAI | Kiểm tra lại ghế/giá, tạo đơn/vé, rollback khi một bước lỗi. |
| Thanh toán | THANHTOAN, DONDATVE, HOSOKHACHHANG | Ghi giao dịch và đổi trạng thái đơn đồng bộ; tích điểm theo tiền thật đã trả. Đơn đã trả đủ bằng điểm hoàn tất bằng phương thức nội bộ DIEM, không tạo tiền thực thu. |
| Hủy đơn chưa thanh toán / hết hạn giữ ghế | DONDATVE, CHITIETVE, KHUYENMAI, HOSOKHACHHANG | Đổi trạng thái đơn, hủy vé để nhả ghế và hoàn lại lượt dùng mã khuyến mãi như một giao dịch logic. Chưa có hoàn tiền tự nguyện: không hủy đơn đã thanh toán bằng luồng này; hủy suất chiếu có nghiệp vụ bồi thường riêng hiện hữu, không dùng thay thế. |
| Xử lý khiếu nại | KHIEUNAI, XULY_KHIEUNAI | Ghi lịch sử và cập nhật trạng thái cùng lúc. |
| Phân công rạp | PHANCONG_RAP, NGUOIDUNG | Tạo/điều chỉnh phân công nhất quán. |

**4.7. Bảo mật và phân quyền (Fixed RBAC Matrix - 33 Quyền)**

Hệ thống duy trì cố định 4 vai trò (`KHACH_HANG`, `QUAN_LY_RAP`, `CSKH`, `ADMIN`) và 33 quyền chức năng, được thực thi đồng bộ từ Express Middleware đến Stored Procedure qua hàm `dbo.fn_KiemTraQuyenNguoiDung`:

| STT | Mã quyền | Tên quyền | KHACH_HANG | QUAN_LY_RAP | CSKH | ADMIN |
|---|---|---|:---:|:---:|:---:|:---:|
| 1 | XEM_PHIM | Xem danh mục phim | ✓ | ✓ | ✓ | ✓ |
| 2 | DAT_VE | Đặt vé xem phim | ✓ | ✓ | | ✓ |
| 3 | THANH_TOAN | Thực hiện thanh toán | ✓ | | | ✓ |
| 4 | DANH_GIA | Đánh giá phim đã xem | ✓ | | | ✓ |
| 5 | GUI_KHIEU_NAI | Gửi yêu cầu khiếu nại | ✓ | | | ✓ |
| 6 | QL_PHONG | Quản lý phòng chiếu | | ✓ | | ✓ |
| 7 | QL_GHE | Quản lý sơ đồ ghế | | ✓ | | ✓ |
| 8 | QL_SUAT_CHIEU | Quản lý lịch chiếu | | ✓ | | ✓ |
| 9 | QL_BANG_GIA | Quản lý bảng giá rạp | | ✓ | | ✓ |
| 10 | XEM_BAO_CAO_RAP | Xem báo cáo rạp phân công | | ✓ | | ✓ |
| 11 | QL_KHIEUNAI | Xem và quản lý khiếu nại | | | ✓ | ✓ |
| 12 | XULY_KHIEUNAI | Ghi nhật ký xử lý khiếu nại | | | ✓ | ✓ |
| 13 | TRA_CUU_DON | Tra cứu đơn hàng & điểm (chỉ đọc) | | | ✓ | ✓ |
| 14 | QL_NGUOIDUNG | Quản trị tài khoản người dùng | | | | ✓ |
| 15 | QL_VAITRO | Quản trị danh mục vai trò | | | | ✓ |
| 16 | QL_QUYEN | Quản trị quyền ứng dụng | | | | ✓ |
| 17 | PHANCONG_RAP | Phân công quản lý cụm rạp | | | | ✓ |
| 18 | QL_RAP | Quản lý thông tin cụm rạp | | | | ✓ |
| 19 | QL_DANHMUC_PHIM | Quản lý danh mục phim & diễn viên | | | | ✓ |
| 20 | QL_THELOAI | Quản lý thể loại phim | | | | ✓ |
| 21 | QL_SANPHAM | Quản lý sản phẩm ăn uống | | | | ✓ |
| 22 | QL_KHUYENMAI | Quản lý chương trình khuyến mãi | | | | ✓ |
| 23 | XEM_BAO_CAO_TOANHE | Xem báo cáo doanh thu toàn hệ | | | | ✓ |
| 24 | KHIEUNAI_CHAT_XEM | Xem lịch sử chat khiếu nại | ✓ | | ✓ | ✓ |
| 25 | KHIEUNAI_CHAT_GUI | Gửi tin nhắn công khai trong hồ sơ | ✓ | | ✓ | ✓ |
| 26 | KHIEUNAI_NOIBO_XEM | Xem ghi chú nội bộ khiếu nại | | | ✓ | ✓ |
| 27 | KHIEUNAI_NOIBO_GHI | Ghi chép xử lý nội bộ CSKH | | | ✓ | ✓ |
| 28 | KHIEUNAI_TIEPNHAN | CSKH tự nhận xử lý khiếu nại | | | ✓ | ✓ |
| 29 | KHIEUNAI_PHANCONG | Admin phân công nhân viên lần đầu | | | | ✓ |
| 30 | CHUYENCAP_TAO | Tạo yêu cầu chuyển cấp lên Admin | | | ✓ | ✓ |
| 31 | CHUYENCAP_XEM | Xem danh sách yêu cầu chuyển cấp | | | ✓ | ✓ |
| 32 | CHUYENCAP_TIEPNHAN | Admin tiếp nhận yêu cầu chuyển cấp | | | | ✓ |
| 33 | CHUYENCAP_XULY | Admin đưa ra chỉ đạo / giải quyết | | | | ✓ |

Backend Node.js kiểm tra cả quyền chức năng và phạm vi rạp trước khi gọi SQL. Ở SQL Server các Stored Procedure tự kiểm tra quyền của người dùng gọi (`@NguoiDungID`) qua `dbo.fn_KiemTraQuyenNguoiDung`. Không cấp quyền trực tiếp quá rộng cho tài khoản ứng dụng; ưu tiên quyền thực thi Stored Procedure cần thiết.

_Hình 4.1. Luồng xác thực, RBAC và kiểm tra phạm vi rạp_

**4.8. Tích hợp React.js với Node.js và SQL Server**

React.js không kết nối trực tiếp SQL Server. Frontend gọi REST API của Express.js bằng JSON. Backend dùng connection pool của package mssql, truyền tham số có kiểu dữ liệu rõ ràng và chỉ execute Stored Procedure. View/Function được dùng bên trong DBMS, không query trực tiếp từ Backend. Cách tách này giúp không lộ chuỗi kết nối CSDL, tập trung kiểm soát quyền ở server và tránh việc client tự quyết định nghiệp vụ.

| **Nhóm API** | **React.js** | **Node.js/Express.js** | **Đối tượng SQL** |
| --- | --- | --- | --- |
| Lịch chiếu | Trang phim/lịch chiếu gọi GET | Controller -> service đọc | vw_LichChieuChiTiet |
| Sơ đồ ghế | SeatMap component gọi GET theo SuatChieuID | Service validate suất rồi đọc TVF | fn_DanhSachGheSuatChieu |
| Đặt vé | Booking/Checkout gửi danh sách ghế và sản phẩm | Service gọi một nghiệp vụ ghi thống nhất | sp_DatVe |
| Thanh toán | Payment page gửi kết quả/transaction ref | Service cập nhật giao dịch | sp_XuLyThanhToan |
| Lịch sử | Account/Orders tải danh sách/chi tiết | Service lọc theo user đăng nhập | vw_LichSuDatVe, vw_ChiTietDonDatVe |
| Khiếu nại | Complaint form + CSKH dashboard | Service kiểm tra role và quyền truy cập | KHIEUNAI, sp_XuLyKhieuNai |
| Quản lý suất | Manager dashboard gửi PhongID/thời gian | Middleware + service kiểm tra PHANCONG_RAP | sp_ThemSuatChieu |

**4.9. Cấu trúc backend**

| **Tầng** | **Trách nhiệm** | **Nguyên tắc** |
| --- | --- | --- |
| Route | Khai báo endpoint và HTTP method | Không truy vấn SQL trực tiếp. |
| Middleware | Xác thực, RBAC, phạm vi rạp, validate cơ bản | Không chứa nghiệp vụ đặt vé. |
| Controller | Nhận request, gọi service, chuẩn hóa response | Mỏng; không tự điều phối transaction. |
| Service | Điều phối use case và dữ liệu đầu vào | Chỉ gọi Stored Procedure; View/Function và business SQL nằm trong DBMS. |
| Data Access | mssql pool/request/execute | Typed SP RPC, không query business SQL hoặc chứa logic giao diện. |
| SQL Server | Toàn vẹn, transaction, SP/Trigger/View/Function/Index | Là lớp bảo vệ cuối cho dữ liệu. |

**Use Case bổ sung QLR-10 / ADM-18:** Luồng danh sách/tìm/lọc → chi tiết → tạo thay Customer có sẵn → sửa ghế đủ điều kiện hoặc hủy logic. Tác nhân, tiền điều kiện, trạng thái, quyền, scope, hậu điều kiện và acceptance criteria theo quyết định tại đầu tài liệu. ERD không đổi bảng/quan hệ; CHITIETVE giữ các vé bị hủy, THANHTOAN giữ mọi lần thử. Không hoàn tiền tự nguyện hoặc xóa vật lý.

**Đặc tả Use Case QLR-10 / ADM-18 (44 UC hoạt động)**

| Thuộc tính | QLR-10 | ADM-18 |
| --- | --- | --- |
| Tác nhân / phạm vi | Manager đang hoạt động, rạp phân công còn hiệu lực | Admin đang hoạt động, toàn hệ thống |
| Quyền | DAT_VE trong ma trận cố định | DAT_VE trong ma trận cố định |
| Tiền điều kiện tạo | Customer KHACH_HANG có sẵn, hoạt động; show mở bán/bookable; ghế đúng phòng, hoạt động, chưa bị giữ/bán; đúng scope | Cùng điều kiện Customer/show/phòng/ghế, scope toàn hệ |
| Luồng chính | Tìm/lọc danh sách → xem Customer/phim/show/rạp/phòng/ghế/trạng thái/giá/history → chọn Customer theo tên/email/SĐT → rạp/show/ghế → tạo đơn Chờ thanh toán | Cùng luồng, nhìn thấy rạp toàn hệ |
| Sửa được duyệt | Đổi ghế cùng show, còn hold, chưa thử payment, không promotion/food/used; gửi active ticket IDs để chặn stale edit | Cùng quy tắc, SQL xác nhận lại toàn bộ |
| Hủy được duyệt | Hủy toàn bộ pending order, không used/in-flight/success/refunded payment; không xóa row | Cùng quy tắc; không tự hoàn tiền |
| Hậu điều kiện | Giữ Customer/show/hold, snapshot vé giữ nguyên; vé bỏ Đã hủy; vé mới giá hiện tại; tiền đơn loại vé hủy; giữ payment history | Cùng hậu điều kiện |
| Ngoại lệ | 401/403, Customer sai role/khóa/không tồn tại, 404, show/seat conflict, expired hold, paid/used/payment attempt, stale edit; rollback/no-write | Cùng ngoại lệ, không có scope rạp hạn chế |
| Nghiệm thu | HTTP/SQL + browser list/create/edit/cancel, foreign/expired scope, concurrency/snapshot/history; Test DB, không kế thừa PASS lịch sử | HTTP/SQL + browser toàn hệ; paid/read-only; giữ fixed RBAC; Test DB |

DBMS bổ sung 9 SP `sp_StaffBooking_*`; Backend chỉ expose 7 nghiệp vụ đọc/ghi cần thiết qua typed RPC. `Authorize` và `LockShow` là helper nội bộ, không có API. ERD giữ nguyên bảng/FK; không thêm cột người tạo hoặc đổi owner thành nhân viên. Xem API và kết quả kiểm thử trong `docs/FINAL_SYSTEM_AUDIT.md`.
