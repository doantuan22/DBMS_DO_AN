# Media correction report — dữ liệu giữ nguyên

Ngày 12/10/2026. Đọc qua GET `/api/movies`, `/api/cinemas` và `/api/cinemas/:id/images`. Không sửa seed, database, API hoặc URL trong bản ghi.

| Bản ghi | URL hiện tại | Vấn đề / hành động UI | Nguồn cần bổ sung | License |
|---|---|---|---|---|
| Movie 1 — Dune: Hành Tinh Cát - Phần Hai | https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800 | stock, không chứng minh là poster Dune; fallback tên phim | key art do nhà phát hành/chủ dự án cung cấp, cập nhật posterUrl theo quy trình dữ liệu riêng | LICENSE_REVIEW_REQUIRED |
| Movie 2 — Mai | https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800 | ảnh không gian rạp, không phải poster Mai; fallback | poster chính thức được cấp phép | LICENSE_REVIEW_REQUIRED |
| Movie 3 — Oppenheimer | https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800 | stock, không chứng minh là poster phim; fallback | poster chính thức được cấp phép | LICENSE_REVIEW_REQUIRED |
| Movie 4 — Conan | https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800 | stock, không chứng minh liên hệ phim; fallback | poster chính thức được cấp phép | LICENSE_REVIEW_REQUIRED |
| Cinema 1/2/3 | https://images.unsplash.com/photo-1489599849927-2ee91cede3ba | cùng một ảnh stock cho ba địa điểm khác nhau; không trình bày là ảnh cơ sở; fallback tên từng rạp | ảnh chụp từng địa điểm đã được chủ sở hữu cho phép | LICENSE_REVIEW_REQUIRED |
| Trailer Mai / Conan | `watch?v=exampleMai`, `watch?v=exampleConan` | placeholder ID; bỏ CTA chưa hoạt động khỏi presentation | URL trailer chính thức đúng phim, qua quy trình dữ liệu riêng | NEEDS_DATA_CORRECTION |

Không hardcode mapping movieId → poster, không tải poster bên thứ ba vào repo. `recordMediaUrl` từ chối host stock cho media của bản ghi; ảnh mới hợp lệ do API trả vẫn đi qua mô hình URL hiện hữu. Ảnh lỗi/thiếu giữ tỷ lệ và tên phim/rạp. Media gaps là blocker cho nghiệm thu artwork của Hero/rails, không phải lý do mở rộng backend.
