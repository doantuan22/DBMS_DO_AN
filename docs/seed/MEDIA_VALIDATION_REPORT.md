# Media validation — S2/S6

STATUS: PARTIAL_COVERAGE; PASS transport cho mọi URL đang seed.

| Nhóm | VALID được seed | UNVERIFIED / BLOCKED | Ghi chú |
|---|---:|---:|---|
| Movie posters | 9 / 18 | 9 BLOCKED_LICENSE | Title/artwork/license/GET/visual verified; fallback NULL cho phần còn lại |
| Backdrop | 0 | NOT_SUPPORTED | Schema không có field; không bổ sung |
| Trailer | 2 | 16 không có verified trailer | Official oEmbed; không placeholder |
| Cinema covers | 4 / 4 | 0 | 4 licensed illustrations; gallery ownership đúng RapID |
| Products | 5 / 8 records, 3 URLs distinct | 1 water UNVERIFIED + 2 combos missing | Fallback honest, không ảnh sai |

16 URL distinct đang seed: HTTPS GET **16/16 HTTP 200, image MIME**. Kích thước initial được parse từ JPEG/PNG bytes: poster 905–960px ngang, cinema/product 960px; SHA256/bytes/date ở manifest. GET lại cuối: .audit-output/seed-v2/media-transport-latest.json. Ảnh PNG Tears of Steel ~2.38 MB, Coffee Run ~1.07 MB; đã dùng resize thay original lớn, vẫn có chi phí download cần cân nhắc về sau. Không có field backdrop, không giả 16:9 từ ảnh dọc.

Edge thật đã tải ảnh Home/card/detail/cinema/booking/orders trên real API/SQL: responses 200 và image MIME, naturalWidth >0. Test chuyển loading=eager **chỉ trong DOM kiểm thử** để kiểm tra cả ảnh ngoài viewport; production lazy loading không đổi. Native card/hero crop được xem ở desktop/mobile. 23 screenshots tại .audit-output/seed-v2/browser; không HTML mock.

Vòng chỉ đọc trên DEMO cuối thêm 8 screenshots tại `.audit-output/seed-v2/demo-browser`; 18 API records khớp manifests, 9 poster và 2 trailer, fingerprint DB không đổi. Tổng 31 ảnh chụp, ảnh frontend vẫn lấy URL từ DB/API.

Các lần thử helper ban đầu sai endpoint cinema-showtimes, nhầm contract promotion preview và kiểm tra lazy ảnh chưa vào viewport: sửa helper theo contract hiện hữu, không đổi app/SP. Final 126 checks PASS. Network abort Fetch khi đổi route được ghi trong results, không phải image transport failure. Truy cập web tool Blender có một số fetch errors trong khi direct HTTPS GET thành công; không gọi URL hỏng khi chỉ tool bị hạn chế. Wikipedia API rate-limit 429 được ghi research, không bịa phản hồi.

9 phim thương mại: Dune Part Two, Mai, Oppenheimer, Conan, Inside Out 2, Soul, Moana, Elemental, Coco. Poster chưa enable vì không có nguồn cấp quyền/API credential phù hợp. Disney/Universal candidate URL có thể tải, không coi đó là license. Giữ NULL; cần nguồn hợp lệ và attribution trước bổ sung. Chính vì các blocker này **không đạt gate full DONE**.
