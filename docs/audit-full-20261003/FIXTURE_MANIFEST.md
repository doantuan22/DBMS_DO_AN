# Audit fixtures

Run `mus0s7zc`; tạo bằng API/SP, không direct INSERT. Dữ liệu fixture được giữ lại để review. Một số fixture rỗng mới tạo đã được xóa qua API để kiểm DELETE; `deleted:true` chỉ các dòng của audit. Không tự cleanup dữ liệu cũ. Manifest machine-readable: [fixture-manifest.json](./evidence/fixture-manifest.json)

## users

| Entry | Details |
| --- | --- |
| 1 | {"kind":"customerA","id":26,"email":"audit.mus0s7zc.customera@example.invalid","role":"KHACH_HANG"} |
| 2 | {"kind":"customerB","id":27,"email":"audit.mus0s7zc.customerb@example.invalid","role":"KHACH_HANG"} |
| 3 | {"kind":"managerA","id":28,"email":"audit.mus0s7zc.managera@example.invalid","role":"QUAN_LY_RAP"} |
| 4 | {"kind":"managerB","id":29,"email":"audit.mus0s7zc.managerb@example.invalid","role":"QUAN_LY_RAP"} |
| 5 | {"kind":"support","id":30,"email":"audit.mus0s7zc.support@example.invalid","role":"CSKH"} |
| 6 | {"kind":"extra","id":31,"email":"audit.mus0s7zc.extra@example.invalid","role":"KHACH_HANG"} |
| 7 | {"kind":"race0","id":32,"email":"audit.mus0s7zc.race0@example.invalid","role":"KHACH_HANG"} |
| 8 | {"kind":"race1","id":33,"email":"audit.mus0s7zc.race1@example.invalid","role":"KHACH_HANG"} |
| 9 | {"kind":"wrongstaff","id":34,"email":"audit.mus0s7zc.wrongstaff@example.invalid","role":"KHACH_HANG","purpose":"admin-staff-role-contract"} |
| 10 | {"kind":"browser","email":"audit.mus0s7zc.browser@example.invalid","role":"KHACH_HANG","createdVia":"browser","id":35} |
| 11 | {"kind":"longpassword","id":36,"email":"audit.mus0s7zc.longpassword@example.invalid","role":"CSKH","purpose":"password-boundary"} |

## cinemas

| Entry | Details |
| --- | --- |
| 1 | {"name":"A","id":40} |
| 2 | {"name":"B","id":41} |
| 3 | {"id":42,"purpose":"delete-new-empty-fixture","deleted":true} |

## rooms

| Entry | Details |
| --- | --- |
| 1 | {"id":35,"cinemaId":40} |
| 2 | {"id":36,"cinemaId":41} |
| 3 | {"id":37,"cinemaId":40,"purpose":"manager-ui-tests"} |

## seats

| Entry | Details |
| --- | --- |
| 1 | {"id":273,"roomId":35,"number":1} |
| 2 | {"id":274,"roomId":35,"number":2} |
| 3 | {"id":275,"roomId":35,"number":3} |
| 4 | {"id":276,"roomId":35,"number":4} |
| 5 | {"id":277,"roomId":35,"number":5} |
| 6 | {"id":278,"roomId":35,"number":6} |
| 7 | {"id":279,"roomId":35,"number":7} |
| 8 | {"id":280,"roomId":35,"number":8} |
| 9 | {"id":281,"roomId":35,"number":9} |
| 10 | {"id":282,"roomId":35,"number":10} |
| 11 | {"id":283,"roomId":35,"number":11} |
| 12 | {"id":284,"roomId":35,"number":12} |
| 13 | {"id":285,"roomId":35,"number":13} |
| 14 | {"id":286,"roomId":35,"number":14} |
| 15 | {"id":287,"roomId":36,"number":1} |
| 16 | {"id":288,"roomId":36,"number":2} |
| 17 | {"id":289,"roomId":36,"number":3} |
| 18 | {"id":290,"roomId":36,"number":4} |
| 19 | {"id":291,"roomId":36,"number":5} |
| 20 | {"id":292,"roomId":36,"number":6} |
| 21 | {"id":293,"roomId":36,"number":7} |
| 22 | {"id":294,"roomId":36,"number":8} |
| 23 | {"id":295,"roomId":36,"number":9} |
| 24 | {"id":296,"roomId":36,"number":10} |
| 25 | {"id":297,"roomId":36,"number":11} |
| 26 | {"id":298,"roomId":36,"number":12} |
| 27 | {"id":299,"roomId":36,"number":13} |
| 28 | {"id":300,"roomId":36,"number":14} |
| 29 | {"id":301,"roomId":37} |

## showtimes

| Entry | Details |
| --- | --- |
| 1 | {"id":57,"body":{"movieId":14,"roomId":35,"startsAt":"2026-10-04T10:00:00+07:00","endsAt":"2026-10-04T11:30:00+07:00","format":"2D","basePrice":80000}} |
| 2 | {"id":58,"body":{"movieId":14,"roomId":37,"startsAt":"2026-10-05T10:00:00+07:00","endsAt":"2026-10-05T11:30:00+07:00","format":"2D","basePrice":80000},"purpose":"manager-update-status"} |
| 3 | {"id":60,"body":{"movieId":14,"roomId":35,"startsAt":"2026-10-07T17:00:00+07:00","endsAt":"2026-10-07T18:30:00+07:00","format":"2D","basePrice":80000},"purpose":"concurrency-and-browser"} |
| 4 | {"id":61,"body":{"movieId":14,"roomId":36,"startsAt":"2026-10-03T14:01:04.465Z","endsAt":"2026-10-03T15:31:04.465Z","format":"2D","basePrice":80000},"purpose":"natural-clock-review"} |
| 5 | {"id":62,"body":{"movieId":14,"roomId":35,"startsAt":"2026-10-11T17:00:00+07:00","endsAt":"2026-10-11T18:30:00+07:00","format":"2D","basePrice":80000},"purpose":"cross-show-promotion-race"} |
| 6 | {"id":63,"purpose":"showtime-overlap-concurrency","body":{"movieId":14,"roomId":37,"startsAt":"2026-10-15T17:00:00","endsAt":"2026-10-15T18:30:00"}} |

## orders

| Entry | Details |
| --- | --- |
| 1 | {"id":36,"owner":26,"purpose":"snapshot-and-payment"} |
| 2 | {"id":37,"owner":27,"purpose":"expiry-after-five-minutes","paymentId":15,"holdExpiresAt":"2026-10-03T13:42:32.054Z"} |
| 3 | {"id":38,"owner":26,"purpose":"same-seat-concurrency"} |
| 4 | {"id":39,"owner":26,"purpose":"multi-seat-concurrency"} |
| 5 | {"id":40,"owner":27,"purpose":"real-five-minute-expiry"} |
| 6 | {"id":41,"owner":31,"purpose":"browser-payment"} |
| 7 | {"id":42,"owner":31,"purpose":"three-order-limit"} |
| 8 | {"id":43,"owner":31,"purpose":"three-order-limit"} |
| 9 | {"id":44,"owner":31,"purpose":"three-order-limit"} |
| 10 | {"id":45,"owner":32,"purpose":"last-promotion-use"} |
| 11 | {"id":46,"owner":33,"purpose":"last-promotion-use"} |
| 12 | {"id":47,"owner":35,"purpose":"browser-customer-full-flow"} |
| 13 | {"id":48,"owner":27,"purpose":"unknown-product-validation"} |
| 14 | {"id":49,"owner":35,"purpose":"natural-clock-review"} |
| 15 | {"id":50,"owner":35,"purpose":"browser-food-and-promotion"} |
| 16 | {"id":51,"owner":32,"purpose":"cross-show-promotion-race"} |
| 17 | {"id":52,"owner":33,"purpose":"cross-show-promotion-race"} |

## images

| Entry | Details |
| --- | --- |
| 1 | {"id":1069,"cinemaId":40} |
| 2 | {"id":1070,"cinemaId":40} |
| 3 | {"id":1071,"cinemaId":40} |

## other

| Entry | Details |
| --- | --- |
| 1 | {"table":"PHANCONG_RAP","id":12} |
| 2 | {"table":"THELOAI","id":13} |
| 3 | {"table":"DIENVIEN","id":10} |
| 4 | {"table":"KHUYENMAI","id":18} |
| 5 | {"table":"VAITRO","id":11,"deleted":true} |
| 6 | {"table":"QUYEN","id":28,"deleted":true} |
| 7 | {"table":"VAITRO","id":12,"purpose":"browser-role-edit"} |
| 8 | {"table":"PHANCONG_RAP","id":13,"purpose":"future-assignment-concurrency"} |
| 9 | {"table":"PHANCONG_RAP","id":14,"purpose":"future-assignment-concurrency"} |
| 10 | {"table":"KHUYENMAI","id":19,"purpose":"cross-show-promotion-race"} |
| 11 | {"table":"THELOAI","id":14,"purpose":"browser-crud","deleted":true} |
| 12 | {"table":"QUYEN","id":29,"purpose":"browser-crud","deleted":true} |
