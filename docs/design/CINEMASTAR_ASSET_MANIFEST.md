# CinemaStar public asset manifest

Kiểm tra ngày 12/10/2026. Không có poster/key art/trailer của phim được tải hoặc phân phối thêm trong repo.

| File | Nguồn / tác giả | License / bằng chứng | Mục đích | Dung lượng / kiểm chứng |
|---|---|---|---|---|
| `frontend/public/assets/fonts/InterVariable.woff2` | [Inter — Rasmus Andersson](https://rsms.me/inter/), [font gốc](https://rsms.me/inter/font-files/InterVariable.woff2) | [SIL OFL 1.1](https://github.com/rsms/inter/blob/master/LICENSE.txt); full license lưu `Inter-LICENSE.txt` cùng thư mục | body/heading Public, font-family riêng `Cinema Inter`, weights 100–900; không thay font staff | 352240 bytes, tự host, font-display swap; glyph tiếng Việt kiểm tra riêng trong QA |
| `frontend/public/assets/cinema/auth-seats.jpg` | [Pexels photo 7991576](https://www.pexels.com/photo/woman-watching-a-movie-7991576/), tác giả chưa xác minh trực tiếp do trang nguồn bị chặn | [Pexels license](https://www.pexels.com/vi-vn/license/), [fixed CDN](https://images.pexels.com/photos/7991576/pexels-photo-7991576.jpeg?auto=compress&cs=tinysrgb&w=1280) | ảnh minh họa trải nghiệm xem phim tại phần auth; không gắn phim/rạp/cơ sở cụ thể, không ngụ ý người trong ảnh xác nhận thương hiệu | JPEG resized/compressed bởi CDN, 1280px; đã mở xem ảnh thực. Caption minh họa. Không runtime hotlink |
| Wordmark/star SVG inline | tự thiết kế tối giản trong PublicShell | source thuộc thay đổi frontend này | CinemaStar Public; không dùng logo Netflix | vector code, không phụ thuộc thư viện icon |

Ảnh dữ liệu giữ nguyên các URL qua API. Tình trạng poster/cinema/trailer sai và quyền cần xác nhận nằm trong `MOVIE_MEDIA_CORRECTION_REPORT.md`. Không suy diễn license Pexels/Unsplash thành quyền dùng poster phim. Ảnh auditorium 7991579 thử nghiệm có nội dung phim trên màn hình đã được loại khỏi repo trước sử dụng.

Ảnh auth tối ưu 1280×853, **103154 bytes**. Font WOFF2 cmap audit PASS cho glyph tiếng Việt trong mẫu, browser xác nhận font loaded. Hai trailer Dune 2/Oppenheimer xác minh metadata official studio qua YouTube oEmbed, không tải video vào repo; xem `.audit-output/public-redesign/trailer-metadata.json`.
