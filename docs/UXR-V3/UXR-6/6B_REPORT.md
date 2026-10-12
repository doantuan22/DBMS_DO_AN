# UXR-6B — nghiệm thu

Trạng thái: **PASS** trong phạm vi Chrome/API đã chạy. Home, phim, chi tiết phim, rạp và chi tiết rạp có 25 ảnh trước/sau tại 390/768/1280/1440/1920 px, không tràn ngang. Hero và nhóm phim dùng trạng thái/dữ liệu thực; ảnh có khung tỷ lệ và fallback; lịch chiếu đưa lên trước nội dung phụ. Bộ lọc phim dùng search/genreId/status API; tìm tên/địa chỉ rạp chỉ lọc toàn bộ collection đang hoạt động. Chi tiết rạp chọn phim có tên rồi gọi movie-showtimes với cinemaId cố định, không thêm endpoint.

`6B-browser.json`: 29 checks PASS, 22 records API, không runtime/console error. Đã kiểm tra Apply/Reset, empty thực, query không chứa nội dung tìm kiếm, schedule của rạp và chặn request ảnh thực. `catalogPages/catalogResource/r7-contract`: 17 tests PASS; lint PASS. Ảnh đã được xem trực tiếp ở desktop/mobile.

Giới hạn: chưa nghiệm thu thiết bị cảm ứng vật lý, Edge/Safari hoặc audit axe đầy đủ. Không có dữ liệu độ phổ biến để suy diễn “hot”; không tạo trạng thái marketing hay khuyến mãi giả. Review/eligibility giữ component/API hiện hữu, chưa chạy mutation review ở checkpoint này.
