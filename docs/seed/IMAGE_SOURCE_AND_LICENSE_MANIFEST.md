# S2 — Nguồn và giấy phép media

Research thật ngày 2026-10-12 bằng web tools và HTTPS GET các trang/API công khai. Ảnh được nhìn trực tiếp từ downloaded bytes trong ignored audit. Không đoán CDN path; Commons imageinfo trả URL/kích thước/license theo từng file. Không commit poster binaries, không dùng image search thumbnails hoặc signed URLs.

## Chính sách đã đọc

[TMDB FAQ](https://developer.themoviedb.org/docs/faq) và [image basics](https://developer.themoviedb.org/docs/image-basics): API noncommercial có attribution và key; commercial cần phạm vi license phù hợp. [API terms](https://www.themoviedb.org/api-terms-of-use) bị robots chặn, không nói đã đọc toàn bộ. Không có TMDB key trong môi trường, không gọi API giả hoặc dùng image paths nhớ từ trước.

[Unsplash license](https://unsplash.com/license), [Pexels license](https://www.pexels.com/license/) được mở; không sử dụng stock cho poster. [Disney terms](https://disneytermsofuse.com/english/) không cấp quyền tự do republish/framing ngoài sản phẩm được phép; không dùng URL studio chỉ vì GET thành công. [NBCUniversal terms](https://www.nbcuniversal.com/terms) được mở. Các ảnh phim thương mại giữ BLOCKED_LICENSE; cần source/API/license đủ trước enable, không gọi free commercial.

## Movies

| Key | Nguồn / tác giả | License | Kết quả | Kích thước |
|---|---|---|---|---|
| sintel | [Source](https://commons.wikimedia.org/wiki/File:Sintel_poster.jpg); (c) copyright Blender Foundation / durian.blender.org | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | VALID | 905×1280 |
| big-buck-bunny | [Source](https://commons.wikimedia.org/wiki/File:Big_buck_bunny_poster_big.jpg); (c) copyright Blender Foundation / peach.blender.org | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | VALID | 960×1358 |
| tears-of-steel | [Source](https://commons.wikimedia.org/wiki/File:Tos-poster.png); (CC) Blender Foundation / Project Mango | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | VALID | 960×1422 |
| elephants-dream | [Source](https://commons.wikimedia.org/wiki/File:ElephantsDreamPoster.jpg); Bassam Kurdali, Andy Goralczyk, and the Blender Foundation | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | VALID | 960×1358 |
| cosmos-laundromat | [Source](https://commons.wikimedia.org/wiki/File:CosmosLaundromatPoster.jpg); Andy Goralczyk and the Blender Foundation | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | VALID | 960×1358 |
| spring | [Source](https://commons.wikimedia.org/wiki/File:Spring2019PillarPosterBlender.jpg); Francesco Siddi | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | VALID | 960×1358 |
| sprite-fright | [Source](https://commons.wikimedia.org/wiki/File:Sprite_Fright-movie_poster.jpg); Blender Studio | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | VALID | 960×1358 |
| charge | [Source](https://commons.wikimedia.org/wiki/File:Charge-movie_poster.jpg); Blender Studio | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | VALID | 960×1358 |
| coffee-run | [Source](https://commons.wikimedia.org/wiki/File:Coffee_Run-movie_poster.png); Hjalti Hjalmarsson (Blender Cloud) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | VALID | 960×1440 |
| dune-part-two | [Source](https://www.warnerbros.com/movies/dune-part-two); Hãng/distributor, chưa có quyền embed | LICENSE_REVIEW_REQUIRED | BLOCKED_LICENSE | — |
| mai | [Source](https://www.cgv.vn/default/mai.html); Hãng/distributor, chưa có quyền embed | LICENSE_REVIEW_REQUIRED | BLOCKED_LICENSE | — |
| oppenheimer | [Source](https://www.universalpicturesathome.com/movies/oppenheimer); Hãng/distributor, chưa có quyền embed | LICENSE_REVIEW_REQUIRED | BLOCKED_LICENSE | — |
| conan-million | [Source](https://www.conan-movie.jp/2024/); Hãng/distributor, chưa có quyền embed | LICENSE_REVIEW_REQUIRED | BLOCKED_LICENSE | — |
| inside-out-2 | [Source](https://movies.disney.com/inside-out-2); Hãng/distributor, chưa có quyền embed | LICENSE_REVIEW_REQUIRED | BLOCKED_LICENSE | — |
| soul | [Source](https://movies.disney.com/soul); Hãng/distributor, chưa có quyền embed | LICENSE_REVIEW_REQUIRED | BLOCKED_LICENSE | — |
| moana | [Source](https://movies.disney.com/moana); Hãng/distributor, chưa có quyền embed | LICENSE_REVIEW_REQUIRED | BLOCKED_LICENSE | — |
| elemental | [Source](https://movies.disney.com/elemental); Hãng/distributor, chưa có quyền embed | LICENSE_REVIEW_REQUIRED | BLOCKED_LICENSE | — |
| coco | [Source](https://movies.disney.com/coco); Hãng/distributor, chưa có quyền embed | LICENSE_REVIEW_REQUIRED | BLOCKED_LICENSE | — |

9 poster đúng tên nhìn rõ, không watermark của bên thu thập; logo/credits thuộc artwork gốc được giữ. Tỷ lệ chủ yếu 1:1.414 (poster gốc), Coffee Run 2:3; không kéo poster thành backdrop. API/DB không có backdrop field. Runtime của 9 phim ngắn đối chiếu video upload gốc được trang Blender Studio liên kết; làm tròn giây lên integer phút, gồm credits của phiên bản đó. Actor names có source, vai diễn/ngày sinh/quốc tịch chưa xác minh giữ NULL. Mai/Conan metadata đối chiếu CGV; Pixar metadata từ trang hãng, Dune từ nguồn catalog đã mở; mỗi phim lưu source và match reason trong JSON. Hai trailer Dune/Oppenheimer được YouTube oEmbed xác nhận official Warner Bros./Universal, embed thông thường; không đánh đồng với quyền poster.

## Cinema illustrations

| Key | Nguồn / tác giả | License | Kết quả | Kích thước |
|---|---|---|---|---|
| cinema-1 | [Source](https://commons.wikimedia.org/wiki/File:Auditorium_of_the_Former_Ace_Cinema,_Rayners_Lane_(01).jpg); Doyle of London | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | VALID | 960×721 |
| cinema-2 | [Source](https://commons.wikimedia.org/wiki/File:Europa_Cinema_Auditorium,_February_2025.jpg); City of Zagreb | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | VALID | 960×640 |
| cinema-3 | [Source](https://commons.wikimedia.org/wiki/File:RZ_Metro_Movie_Theater_interior_2023-03_(3).jpg); Razgrad | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | VALID | 960×640 |
| cinema-4 | [Source](https://commons.wikimedia.org/wiki/File:RZ_Metro_Movie_Theater_interior_2023-03_(1).jpg); Razgrad | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | VALID | 960×640 |

4 rạp demo hư cấu, không giả danh địa chỉ doanh nghiệp. Ảnh thật của auditorium/cinema ở nơi khác được ghi **Ảnh minh họa** trong description rạp và caption bảng ảnh, kèm creator + license URL. Hai ảnh Metro là góc khác nhau của cùng địa điểm nguồn, không phải cùng file; manifest không tuyên bố đó là hai cơ sở CinemaStar thật. Không có ảnh trùng byte giữa bốn cover.

## Product illustrations

| Key | Nguồn / tác giả | License | Kết quả | Kích thước |
|---|---|---|---|---|
| product-1 | [Source](https://commons.wikimedia.org/wiki/File:Popcorn_in_a_bowl.jpg); Ziongarage | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | VALID | 960×960 |
| product-2 | [Source](https://commons.wikimedia.org/wiki/File:Orange_juice_1_edit1.jpg); Agency of the United States Department of Agriculture Edited Version by: Arad | [Public domain](https://creativecommons.org/publicdomain/zero/1.0/) | VALID | 960×1365 |
| product-3 | [Source](https://commons.wikimedia.org/wiki/File:Chips_in_a_bowl_at_a_party.JPG); Tomwsulcer | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | VALID | 960×786 |
| product-4 | [Source](https://commons.wikimedia.org/wiki/File:Water_Glass_(6579974749).jpg); Kurt Bauschardt from Edmonton, Canada | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | UNVERIFIED | 960×1280 |

Popcorn/orange juice dùng cho hai cỡ cùng loại mặt hàng. File Chips visually là snack bánh giòn, seed tên tương ứng, không gọi potato chips. Water Glass chưa chứng minh nước lọc nên không sử dụng. Hai combo không có ảnh đầy đủ đúng thành phần: HinhAnh NULL. Không lấy một ảnh bắp giả làm combo.

## Attribution

Creator/license URI được ghi vào PHIM.MoTa, HINHANH_RAPCHIEUPHIM.MoTa và SANPHAM.MoTa để detail/description hiện hữu hiển thị; full source/credit nằm trong manifest này và JSON. Chỉ CDN resize; crop khi render frame, không sửa file gốc; ghi điều này khi chia sẻ. Giữ CC BY/SA theo từng file, không gắn nhãn toàn bộ repository thành CC. Không bổ sung UI Credits/TMDB logo vì chưa dùng TMDB API và task không sửa frontend. Nếu chuyển nguồn TMDB, cần tuân thủ credit/logo trước phát hành; chưa bật ảnh thương mại.
