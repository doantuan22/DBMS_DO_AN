# Public UI before / after

Ngày 12/10/2026. Ảnh là browser thực với React/Vite/Express/SP trên database test riêng; artifacts ở `.audit-output/` theo convention repo, không commit profile/tokens/screenshot.

| Trang | Before | Final after |
|---|---|---|
| Home 1440 | [before](../../.audit-output/public-redesign/before/home-1440.png) | [after](../../.audit-output/public-redesign/final/home-1440.png) |
| Home 390 | [before](../../.audit-output/public-redesign/before/home-390.png) | [after](../../.audit-output/public-redesign/final/home-390.png) |
| Movies 1440 | [before](../../.audit-output/public-redesign/before/movies-1440.png) | [after](../../.audit-output/public-redesign/final/movies-1440.png) |
| Movie detail 1440 | [before](../../.audit-output/public-redesign/before/movie-detail-1440.png) | [after](../../.audit-output/public-redesign/final/movie-detail-1440.png) |
| Cinemas 1440 | [before](../../.audit-output/public-redesign/before/cinemas-1440.png) | [after](../../.audit-output/public-redesign/final/cinemas-1440.png) |
| Booking 390 | [before](../../.audit-output/public-redesign/before/booking-390.png) | [after](../../.audit-output/public-redesign/final/booking-390.png) |
| Login 1440 | [before](../../.audit-output/public-redesign/before/login-1440.png) | [after](../../.audit-output/public-redesign/final/login-1440.png) |
| Register 390 | [before](../../.audit-output/public-redesign/before/register-390.png) | [after](../../.audit-output/public-redesign/final/register-390.png) |

Baseline có 7 trang public ×5 viewport; final có đủ 15 trang ×5 viewport. Orders/profile/complaints trong final dùng fixture REST riêng có tên kiểm chứng, không phải dữ liệu bịa trong production JSX. Trạng thái empty/error/conflict/payment thật và bộ results nằm ở `qa-production/` và `final/`.

Home sau có tên phim/synopsis làm focal point, date rail theo suất thật, film rail responsive, rạp/thể loại thật và footer dark; không còn khối 3 bước marketing. Poster và ảnh rạp vẫn fallback vì source media không hợp lệ, nên artwork acceptance là PARTIAL. Auth có ảnh minh họa tĩnh riêng; booking map/summary/receipt dùng dữ liệu server, selection đỏ và native control focus gold.

Staff regression cuối: [Admin before](../../.audit-output/public-redesign/before/staff-admin-1440.png) / [after](../../.audit-output/public-redesign/s7/staff-admin-1440.png), [Manager before](../../.audit-output/public-redesign/before/staff-manager-1440.png) / [after](../../.audit-output/public-redesign/s7/staff-manager-1440.png), [CSKH before](../../.audit-output/public-redesign/before/staff-support-1440.png) / [after](../../.audit-output/public-redesign/s7/staff-support-1440.png). Cả 3 portal ở 390/1440: PNG hashes giống nhau, không chỉ so một vài màu. [Pixel regression results](../../.audit-output/public-redesign/staff-pixel-regression.json).

Các vòng polish có evidence tại `s1/`, `s2/`, `s2-polish/`, `s3/`, `s4/`, `s5/`, `s6/`. Report nêu giới hạn reference chưa được cung cấp và site ngoài bị chặn; không dùng screenshot fallback để khẳng định đạt artwork DNA.
