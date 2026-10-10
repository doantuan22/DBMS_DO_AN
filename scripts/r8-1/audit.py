"""Read-only source/contract inspection and R8.1 documentation; never changes production."""
import collections
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / 'docs/evidence/r8-1/runs/2026-10-10T01-58-04-401313Z-3d49fc44'
RUN = ROOT / 'docs/evidence/r8-1/runs/2026-10-10T02-06-45-496193Z-b20ed2ee'
R73 = ROOT / 'docs/evidence/r7-3/runs/2026-10-09T16-23-18-873Z-ecf5beee/audit-final.json'


def read(path):
    return path.read_text(encoding='utf-8-sig')


def load(path):
    return json.loads(read(path))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def dump(name, value):
    path = RUN / name
    if path.exists():
        raise RuntimeError('Refuse to overwrite inspection evidence: ' + name)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def source_link(relative):
    return '[' + Path(relative).name + '](../' + relative + ')'


def evidence_link(name):
    return '[' + name + '](' + (RUN / name).relative_to(ROOT / 'docs').as_posix() + ')'


def cell(value):
    return str(value).replace('|', '&#124;').replace('\n', '<br>')


COMPONENTS = {
 'KH-01': ('/register', 'auth/Register.jsx', 'Register', 'authApi.registerCustomer'),
 'KH-02': ('/login', 'auth/Login.jsx', 'Login / AuthProvider / authSession', 'authApi.login/getCurrentUser'),
 'KH-03': ('/profile', 'auth/Profile.jsx', 'Profile / RequireAuth', 'authApi.getCurrentUser/updateCurrentUser'),
 'KH-04': ('/movies; /movies/:movieId', 'Movies.jsx; MovieDetail.jsx', 'Movies / MovieGrid / MovieDetail', 'catalogApi.getMovies/getGenres/getMovieDetail'),
 'KH-05': ('/movies/:movieId; /booking/:showtimeId', 'MovieDetail.jsx; BookingPreparation.jsx', 'ShowtimeBrowser / ShowtimeList', 'catalogApi.getCinemas/getShowtimes/getShowtimeDetail'),
 'KH-06': ('/booking/:showtimeId', 'BookingPreparation.jsx', 'BookingPreparation / SeatMap', 'catalogApi.getShowtimeDetail/getSeats'),
 'KH-07': ('/booking/:showtimeId', 'BookingPreparation.jsx', 'BookingPreparation / HoldDeadline', 'catalogApi.createBooking'),
 'KH-08': ('/booking/:showtimeId', 'BookingPreparation.jsx', 'ProductPicker / BookingPreparation', 'catalogApi.getProducts/createBooking'),
 'KH-09': ('/booking/:showtimeId', 'BookingPreparation.jsx', 'BookingPreparation promotion preview', 'catalogApi.validatePromotion/createBooking'),
 'KH-10': ('/orders/:orderId/payment', 'PaymentPage.jsx', 'PaymentPage / HoldDeadline / StatusBadge', 'ordersApi.getOrder/createPaymentAttempt/submitPaymentResult'),
 'KH-11': ('/orders', 'Orders.jsx', 'Orders / StatusBadge', 'ordersApi.getOrders'),
 'KH-12': ('/orders/:orderId', 'OrderDetail.jsx', 'OrderDetail / HoldDeadline', 'ordersApi.getOrder'),
 'KH-13': ('/movies/:movieId', 'MovieDetail.jsx', 'MovieReviews', 'feedbackApi.getReviews/createReview'),
 'KH-14': ('/complaints; /complaints/:complaintId', 'Complaints.jsx; ComplaintDetail.jsx', 'Complaints / ComplaintDetail', 'feedbackApi.getComplaints/createComplaint/getComplaint; ordersApi.getOrders'),
}
for number in range(1, 10):
 COMPONENTS[f'QLR-{number:02}'] = ('/login; /manager' if number == 1 else '/manager',
  'auth/Login.jsx; ManagerPortal.jsx' if number == 1 else 'ManagerPortal.jsx',
  {1: 'ManagerPortal / RequireRole', 2: 'ManagerWorkspace / ManagerResourceForm room', 3: 'ManagerWorkspace / ManagerResourceForm seat',
   4: 'ManagerResourceForm showtime create', 5: 'ManagerResourceForm showtime edit', 6: 'ManagerWorkspace cancel action',
   7: 'ManagerResourceForm pricing', 8: 'ManagerWorkspace dashboard', 9: 'ManagerRevenue'}[number],
  {1: 'authApi.login/getCurrentUser; managerApi.getAssignedCinemas', 2: 'managerApi.getRooms/createRoom/updateRoom/deleteRoom',
   3: 'managerApi.getSeats/createSeat/updateSeat/deleteSeat', 4: 'managerApi.getManagerShowtimes/createManagerShowtime',
   5: 'managerApi.updateManagerShowtime', 6: 'managerApi.cancelManagerShowtime', 7: 'managerApi.getPricing/createPricing/updatePricing',
   8: 'managerApi.getDashboard', 9: 'managerApi.getRevenue'}[number])
for number in range(1, 7):
 COMPONENTS[f'CSKH-{number:02}'] = ('/login; /support' if number == 1 else '/support',
  'auth/Login.jsx; SupportPortal.jsx' if number == 1 else 'SupportPortal.jsx',
  {1: 'Login / SupportPortal / RequireRole', 2: 'SupportPortal queue', 3: 'SupportPortal detail/timeline',
   4: 'ComplaintOrderReference / OrderReferenceDetails', 5: 'SupportPortal processing form', 6: 'SupportPortal status form'}[number],
  {1: 'authApi.login/getCurrentUser', 2: 'supportApi.getSupportComplaints', 3: 'supportApi.getSupportComplaint',
   4: 'supportApi.getComplaintOrderReference', 5: 'supportApi.addComplaintProcessing', 6: 'supportApi.updateComplaintStatus'}[number])
ADMIN_SECTIONS = {2:'users',3:'roles',4:'permissions',5:'permissions / role grants',6:'assignments',7:'cinemas / cinemaImages',
 8:'rooms / seats',9:'movies / actors / cast',10:'genres',11:'products',12:'promotions',13:'pricing',14:'showtimes',
 15:'complaints',16:'dashboard / revenue'}
for number in range(1, 17):
 COMPONENTS[f'ADM-{number:02}'] = ('/login; /admin' if number == 1 else '/admin',
  'auth/Login.jsx; AdminPortal.jsx' if number == 1 else 'AdminPortal.jsx',
  'Login / AdminPortal / RequireRole' if number == 1 else 'AdminPortal section ' + ADMIN_SECTIONS[number]
   + (' / CinemaImageManager' if number == 7 else ''),
  {1:'authApi.login/getCurrentUser',2:'adminApi.users/create/update(users/:id/status)',3:'adminApi.roles/create/update/remove',
   4:'adminApi.permissions/create/update/remove',5:'adminApi.rolePermissions/update(roles/:id/permissions)',
   6:'adminApi.assignments/create/update',7:'adminApi.cinemas/create/update/remove + cinema image helpers',
   8:'adminApi.rooms/seats/create/update/remove',9:'adminApi.movies/actors/create/update/remove + update(movies/:id/actors)',
   10:'adminApi.genres/create/update/remove',11:'adminApi.products/create/update/remove',12:'adminApi.promotions/create/update/remove',
   13:'adminApi.pricing/create/update',14:'adminApi.showtimes/create/update/create(showtimes/:id/cancel)',
   15:'adminApi.complaints/complaint/complaintOrderReference/addComplaintProcessing/updateComplaintStatus',
   16:'adminApi.dashboard/revenue'}[number])

# Observed request/response contracts. SQL types and validator rules stay authoritative.
CONTRACTS = {
 'KH-01': ('HoTen1–100, Email≤150, MatKhau8–72 UTF8 bytes, nullable SoDienThoai≤20/NgaySinh YYYY-MM-DD/GioiTinh Nam,Nữ,Khác; không actor/role', '{user}; HTTP201, redirect /login; SQL Customer/profile', '400 invalid/access fields;409 duplicate email/phone;429 auth limiter;500/503 unavailable'),
 'KH-02': ('Email≤150 + MatKhau1–72 UTF8 bytes; token nhận từ login, me tải current grants', '{token,user} rồi {user}; role/current permissions/assignments', '400 invalid;401 credentials/account;429;500/503'),
 'KH-03': ('HoTen1–100; nullable phone≤20/birthday DATE/gender enum; staff gửi birthday/gender NULL; identity JWT', '{user}; name/phone/birthday/gender/loyaltyPoints nullable', '400 invalid;401;409 phone duplicate;500/503'),
 'KH-04': ('GET search≤100/genreId positive INT; movieId path positive INT; public; không body', '{movies[]}, {genres[]}, {movie,genres[],actors[]}', '400 invalid IDs/query;404 movie detail;500/503; không403 permission public'),
 'KH-05': ('movieId path; optional cinemaId positive INT/date DATE; showtimeId path; public', '{cinemas[]}, {showtimes[]}, flat showtime detail; startsAt/endsAt UTC ISO', '400 query/path;404 detail;500/503; empty list200'),
 'KH-06': ('GET showtimeId positive INT; public; chọn IDs numeric, không gửi price', '{seats[]} id,label,row,number,type,status,price SQL; detail flat', '400 invalid;404 showtime;500/503;409 chỉ booking shared KH-07'),
 'KH-07': ('showtimeId INT; distinct seatIds number[]1–10; products[{productId,quantity1–10}]; optional trimmed promotionCode≤50; không amount/owner', '{booking} HTTP201; id,total,holdExpiresAt do SQL chốt', '400 invalid/limits;401;403 Customer/DAT_VE;404 refs;409 seat/hold/show/promo;500/503'),
 'KH-08': ('GET products public; booking quantity0 loại bỏ, mỗi product1–10, không trần tổng10; cùng body KH-07', '{products[]} id/name/price/type + {booking}; product snapshot SQL', 'GET500/503; write400/401/403/404/409 theoKH-07'),
 'KH-09': ('POST showtimeId/seatIds/products/promotionCode bắt buộc; code≤50; không preview subtotal/accepted discount', '{promotion} isValid/message/discountAmount provisional; booking.total final', '400 invalid;401;403 DAT_VE/role;409 changed promotion khi booking;500/503; invalid preview có thể200 isValid=false'),
 'KH-10': ('orderId/paymentId path INT; {paymentMethod} enum6; {status} Thành công/Thất bại; UI hiện chỉ confirm Thành công; khôngamount', '{order}; {payment}; {order} sau result; total/payments/compensation SQL', '400 method/result;401;403 Customer/THANH_TOAN;404 owner-hidden order/payment;409 expiry/terminal;500/503'),
 'KH-11': ('GET own /orders; không body; statusFilter là UX filter trên own returned list', '{orders[]} owner-specific total/latestPaymentStatus; empty[]', '401;403 wrong Customer role;500/503; không write grant bắt buộc'),
 'KH-12': ('GET orderId INT; owner JWT; no mutation/expiry job in GET', '{order} tickets[]/products[]/payments[]/compensation|null, totals SQL', '400 path;401;403 wrong role;404 ownership/missing;500/503'),
 'KH-13': ('movieId INT; POST {rating number integer1–5,content nullable text≤1000}; no reviewerId', '{reviews[]} public reviewerName; {review}201; eligibility SQL', 'GET400/500/503; POST400/401/403 DANH_GIA/409 ineligible or duplicate/500/503'),
 'KH-14': ('POST {type≤100,title≤200,content nonempty NVARCHARMAX,orderId nullable INT|string digits}; own reads', '{complaints[]}, {complaint}201 or detail with processingHistory[]', '400 invalid;401;403 Customer/GUI_KHIEU_NAI create;404 linked ownership/detail;500/503'),
 'QLR-01': ('Email/MatKhau như KH-02; bootstrap GET manager/cinemas không functional grant', '{user} role QUAN_LY_RAP/permissions/cinemaAssignments; {cinemas[]}', 'login400/401/429/500/503; manager401/403 wrong role; empty assigned200'),
 'QLR-02': ('cinemaId/roomId path INT; create{name≤100,type enum}; update adds status enum; DELETE no body', '{rooms[]}; {room}201/create or200/update; delete {message} authoritative', '400;401;403 QL_PHONG/current scope;404 refs;409 history;500/503'),
 'QLR-03': ('roomId/seatId INT; create{row≤10,number positive INT,type}; update{type,status}; không đổi row/number', '{seats[]} camelCase; {seat}; delete{deleted:true}', '400;401;403 QL_GHE/scope;404;409 ticket/history/duplicates;500/503'),
 'QLR-04': ('{movieId,roomId INT,startsAt/endsAt UTC ISO,format enum,basePrice DECIMAL18,2≥0}; end>start', '{showtime}201; {showtimes[]}; UTC times; no holiday', '400;401;403 QL_SUAT_CHIEU/scope;404 refs;409 overlap;500/503'),
 'QLR-05': ('{movieId,startsAt,endsAt,format,basePrice,status}; roomId không thuộc update; UTC offset bắt buộc', '{showtime}; history immutability SQL; refresh list', '400;401;403 scope/grant;404;409 history/overlap/cancel route;500/503'),
 'QLR-06': ('POST /cancel reason optional≤255; UI default{}; identity JWT, no status PUT shortcut', '{cancelled:true}; reload showtimes; compensation SQL', '400 invalid reason/path;401;403 scope/grant;404;409 held/started;500/503'),
 'QLR-07': ('seatType/dayType/format enums; surcharge DECIMAL18,2≥0; startsOn DATE/endsOn nullable DATE; update addsstatus/fullgroup', '{pricing[]}; {pricing}; price function SQL; no Ngày lễ', '400;401;403 QL_BANG_GIA/scope;404;409 overlap;500/503'),
 'QLR-08': ('GET cinemaId INT; no occupancy input/newformula', '{dashboard} activeRooms/activeSeats/showtimesToday/paidOrdersToday', '400 path;401;403 XEM_BAO_CAO_RAP/current scope;404 cinema;500/503'),
 'QLR-09': ('GET cinemaId; optional fromDate/toDate DATE inclusive; absent dates SQL default; from≤to', '{revenue[]} date,totalRevenue,orderCount; receipts/snapshots SQL', '400 path/range;401;403 XEM_BAO_CAO_RAP/scope;404 cinema;500/503; empty200'),
 'CSKH-01': ('Email/MatKhau; current role CSKH plus QL_KHIEUNAI for /support guard', '{user} current permissions; no inherited Admin bypass', 'login400/401/429/500/503; area401/403 role/grants'),
 'CSKH-02': ('GET status≤50/type≤100/search≤100/priority≤50 enum4; omit empty; AND SQL; current UI lacks priority', '{complaints[]} id,title,priority,status,senderName,processingCount; empty[]', '400 INVALID_PRIORITY/unknown query;401;403 CSKH+QL_KHIEUNAI;500/503'),
 'CSKH-03': ('complaintId path INT; role CSKH +QL_KHIEUNAI; no body', '{complaint} plus processings[]; nullable orderId/processorName', '400 path;401;403;404 COMPLAINT_NOT_FOUND;500/503'),
 'CSKH-04': ('GET complaintId; QL_KHIEUNAI AND TRA_CUU_DON; key remount selectedId/permission', '{order:null,message} unlinked OR {order} tickets/products/payments/history/total', '400 path;401;403 grants;404 COMPLAINT_NOT_FOUND/ORDER_NOT_FOUND;500/503'),
 'CSKH-05': ('POST {content nonempty NVARCHARMAX,nextStatus enum excluding Mới}; complaintId path; current actor', '{processing}; append history, refresh queue/detail', '400 invalid;401;403 QL_KHIEUNAI+XULY_KHIEUNAI;404;500/503'),
 'CSKH-06': ('PUT {status} processing enum excluding Mới; complaintId path; current actor', '{complaint:{id,status}}; append timeline SQL', '400 invalid;401;403 QL_KHIEUNAI+XULY_KHIEUNAI;404;500/503'),
 'ADM-01': ('Email/MatKhau; default /admin; section gates by current grants; route role ADMIN', '{user} current permissions; no all-permission shortcut', 'login400/401/429/500/503; admin401/403'),
 'ADM-02': ('create{name≤100,email≤150,password8–72bytes,phone optional≤20,roleId INT}; raw roleId field currently unbounded by role code; status only update', '{users[]} raw SQL columns; {user}200 create; list/status includesallroles', '400 refs/input;401;403 QL_NGUOIDUNG/ROLE_CREATE_FORBIDDEN;404 user;409 duplicates;500/503'),
 'ADM-03': ('create{code≤50,name≤100,description nullable≤255}; update no code; DELETE roleId', '{roles[]} SQL columns; {role}; delete{result}', '400;401;403 QL_VAITRO;404 role;409 role in use/duplicate;500/503'),
 'ADM-04': ('create{code≤50,name≤100,description nullable≤255}; update no code; DELETE permissionId', '{permissions[]} SQL columns; {permission}; delete{result}', '400;401;403 QL_QUYEN;404;409 permission in use/duplicate;500/503'),
 'ADM-05': ('roleId path INT; PUT {permissionIds:number[]} CSV→array, []valid; authenticated Admin QL_QUYEN', '{permissions[]} SQL QuyenID; authoritative atomic replace, no additive client assumption', '400 array/INT;401;403 QL_QUYEN;404 role/permission;409 refs/conflict;500/503'),
 'ADM-06': ('{userId,cinemaId INT,startsOn DATE,endsOn nullable DATE,status}; create only Hiệu lực; ends≥starts', '{assignments[]} SQL cols; {assignment}; no DELETE workflow', '400;401;403 PHANCONG_RAP;404;409 duplicate;500/503'),
 'ADM-07': ('cinema create/update name150/address255/city100/phone20/description500/status; images url500/description255/displayOrder INT/status/cover BIT', '{cinemas[]} raw rows; {cinema}; {images[]}; {image}201/create; cover PATCH', '400 types/enums/url;401;403 QL_RAP;404 scope/image;409 inactive cover/referenced cinema;500/503'),
 'ADM-08': ('rooms create cinemaId/name100/type; seats roomId/row10/number/type; update names/type/status; DELETE specificresource', '{rooms[]},{seats[]} SQL raw columns; {room}/{seat}/{result}; no client seatCountauthority', '400;401;403 QL_PHONG or QL_GHE;404;409 history/references;500/503'),
 'ADM-09': ('movies title255/duration INT/release DATE/end nullable/genreIds[]/optionaltext; cast[{actorId,role≤150}]; actors name150/birthDate DATE/nationality100', '{movies[]},{actors[]} rawrows; {movie}201/create; {actors} cast result; currentcatalog labels', '400 INT/dates/enums/cast;401;403 QL_DANHMUC_PHIM;404;409 history/refs/duplicate;500/503'),
 'ADM-10': ('{name≤100}; genreId path; SQL authoritative CRUD/references', '{genres[]} SQLraw; {genre}; {result}', '400;401;403 QL_THELOAI;404;409 referenced/duplicate;500/503'),
 'ADM-11': ('{name150,type enum,price DECIMAL18,2≥0,description255/image500nullable}; update addsstatus; number inputs have no explicitdecimalstep', '{products[]} SQLraw; {product}201/create; catalog price not historical snapshot', '400 decimals/enum;401;403 QL_SANPHAM;404;409 referenced/duplicate;500/503'),
 'ADM-12': ('discountType enum/value>0; percent≤99; min/max DECIMALnullable; quantity INT; UTC startsAt/endsAt; code≤50 createonly; missingexplicitdecimalstep', '{promotions[]} SQLraw; {promotion}201/create; quota/effectiveness SQL', '400 percent/decimal/date/enum;401;403 QL_KHUYENMAI;404;409 duplicate/inuse;500/503'),
 'ADM-13': ('cinemaIdcreate; seatType/dayType/format/startsOn/endsOnnullable +surcharge DECIMAL18,2≥0/status; missingexplicitdecimalstep', '{pricing[]} SQLraw; {pricing}; no Ngày lễ; nullopenend not omitted mistakenly', '400 enum/group/date/decimal;401;403 QL_BANG_GIA;404;409 overlap;500/503'),
 'ADM-14': ('movieId/roomIdcreate INT; UTC startsAt/endsAt; format/basePrice DECIMAL/status; cancelPOST{}; missingexplicitdecimalstep', '{showtimes[]} SQLraw; {showtime}; {result}; historyimmutability SQL', '400;401;403 QL_SUAT_CHIEU;404;409 overlap/history/held/cancel;500/503'),
 'ADM-15': ('same support query priority/status/type/search contract; default UI calls no params; ID path; processing/statusbodies; reference separate request', '{complaints[]},{complaint.processings[]},{order|null,message}; Admin uses own inline reference, not sharedcomponent', '400 including INVALID_PRIORITY;401;403 QL_KHIEUNAI +write/reference grants;404 complaint/order;500/503'),
 'ADM-16': ('GET report fromDate/toDate DATE/cinemaIdoptional INT; UI only date range; no revenuecalculationinReact', '{summary,byCinema[],byMovie[],byDate[],cinemas[],totals}; UI dataRows uses first array byCinema only', '400 range/ID;401;403 XEM_BAO_CAO_TOANHE;500/503; empty report200 zero summary'),
}

STATES = {
 'auth/Register.jsx': 'Controlled registration form; busy disables submit; retained inputs/error; success navigation /login. No async ownership fields.',
 'auth/Login.jsx': 'Controlled Email/MatKhau; busy/error; authSession saves token then real me; clear token if me fails; route default by current role.',
 'auth/Profile.jsx': 'Controlled form from current user, busy/error/success; current identity from AuthProvider; staff null-specific fields.',
 'Movies.jsx': 'search/genre/attempt; AbortController +180ms debounce + requestKey guards success/loading; retry; valid empty.',
 'MovieDetail.jsx': 'detail keyed movieId, showtimes keyed movie/cinema/date, AbortController; selected filters; no retry for detail/show list; review state separate.',
 'BookingPreparation.jsx': 'show detail abort guard; seats/products async; seats filter old IDs only after response; quantities/code/bookingState not reset by showtimeId; promo version guards result but busy finally unguarded; booking mutation unkeyed.',
 'PaymentPage.jsx': 'resource/orderId load without generation, method/busy/message/deadline timers; reload after error; readonly GET cannot run expiry; result locks SQL, route-change stale risk.',
 'Orders.jsx': 'resource loading/error/retry/empty; statusFilter local on own rows; readonly list; no mutation.',
 'OrderDetail.jsx': 'resource/orderId, loading/error/retry; hold timer/deadline; no generation/abort on route change; terminal money from SQL.',
 'Complaints.jsx': 'list/submit controlled state, busy/error; order prefill ownership checks; getOrders failure becomes [] without feedback; no explicit order lookup retry.',
 'ComplaintDetail.jsx': 'resource/complaintId loading/error/retry; no request generation; timeline+linked order display.',
 'ManagerPortal.jsx': 'assigned cinemas active guard; workspace key by cinema/user/grants; load and seat generations +mounted flag; busy mutation guards; per-section errors/retry preserve other sections; edit form keyed by resource row.',
 'SupportPortal.jsx': 'queue load clears rows but no generation/abort; detailGeneration guards detail success/error; selectedId; processing/status forms have no pending guard; afterWrite can restore a captured old selection.',
 'AdminPortal.jsx': 'active module/permitted sections, selected row/values, loadRequest and grantRequest guards; editor resets on module switch; generic submit lacks busy guard; complaint detail/reference unguarded; separate selected/write identity.',
}

SCENARIOS = {
 'KH-01':'Register valid201 then /login; duplicate email/phone, invalid/multibyte password;429 retained inputs/manual retry; SQL no orphan.',
 'KH-04':'Search/genre A→B with late A; list/detail genres/cast;404 detail; empty200; network error+retry.',
 'KH-05':'Cinema/date filters A→B; empty schedule; available show link; SPA showtime A→B entry and back navigation.',
 'KH-06':'Free/held/sold/maintenance disabled; select/unselect0/10/11; switch showtime mid-load; concurrent seat lost→409 refresh.',
 'KH-07':'Create201 once; immediate double click; stale mutation response after show switch; max3 live holds;409 seat/promo;201 total/hold/paymentlink+SQLsnapshot.',
 'KH-08':'Zero removes line; quantity1/10/11 for each product, multiple products total>10 valid; inactive/empty/errors; A→B quantities reset.',
 'KH-09':'Valid/invalid/expired/exhausted/minimum promo; edit seat/product/code while quote pending; latequote after A→B;409 forces deliberate review, no silent no-promo booking.',
 'KH-10':'Live successful payment amount; failed→retry branch availability;holdexpiry/terminal replay/no double-submit;foreignorder404/revokedgrant;order A→B stale result.',
 'KH-11':'Own pending/paid/expired/canceled list;zeroorders;localfilter;error/retry;crossroleguard and readable own list without writegrant.',
 'KH-12':'Own detail tickets/food/payments/compensation;foreign404;readonly SQLfingerprint;UTCdisplay/elapsedhold reload;order A→B race.',
 'KH-13':'Eligible paid/past review201→list;ineligible/duplicate409;rating1/5/invalid;nullcontent/max1000;revokedgrant;movie A→B late list/submit.',
 'KH-14':'Linked/unlinked create201,ownhistory/timeline;spoof/foreign404;orderslookup403/500/network must not become [];retry;complaint A→B late detail.',
 'QLR-01':'Manager form login/me/grants;single/multiple/noassigned cinemas;revoked/expiredassignment with oldJWT;wrongrole/lockedaccount;realcinemalist.',
 'QLR-02':'Room create/edit/delete empty;referencedhistory409;scope/permissiondenied;refresh;switch cinema midload/write;error does not erase other grantedsections.',
 'QLR-03':'Seat room loading/edit/delete/empty;row-number immutable update;ticket history409;wrongroom/grantdenied;late room A load after B.',
 'QLR-04':'Future show create UTC201;end/start/duration invalid;overlap409;foreignroom403;selectedcinemascope;reloadpersisted shows.',
 'QLR-05':'Hydrate/edit allowed future show;roomId excluded;historyimmutable409;overlap;switch scope midwrite;no stale editor changes.',
 'QLR-06':'Cancel unusedfuture show;heldorder409;started/historyrules;paid cancellation compensation exactlyonce;reload;scope/grantdenied.',
 'QLR-07':'Create/full edit all dimensions/nullend/status;decimal surcharge;daytype3/noholiday;overlap409;current scope;filter;historicalprices unchanged.',
 'QLR-08':'Independently seeded active/inactive rooms/seats,today/canceled shows,receipt midnight UTC+7;assert four metrics including active seats in inactive room;scope/denied/zero/error.',
 'QLR-09':'Independent paidreceipt ledger across midnight/failed/canceled;inclusive/default/datebounds;empty/error/retry;scope/grantrevocation;SQLtotals rendered.',
 'CSKH-01':'Login CSKH/me;QL_KHIEUNAI area grant;wrongrole/missinggrant/inactiveoldJWT;no unintended Admin navigation.',
 'CSKH-02':'Status+priority+type+search AND oracle;all4 enum/default/invalid400;filter A slow→B fast;queue/loading/error onlyB;empty/error/retry.',
 'CSKH-03':'Detail A slow→B fast guarded;timeline/maxidentity order;404/grant403;retry;unmount;selection consistent.',
 'CSKH-04':'Linked full order;unlinked200 ordernull;403/404/500/network visibly error with retry;late A reference after B;current permission removal.',
 'CSKH-05':'Append processing then queue+detail refresh;switch selection while write pending;double submit;invalid/Mới400;grantdeny;exact actor/complaintSQL.',
 'CSKH-06':'Status change appendhistory;switch selection pending;double click;invalid/Mới400;latest committed status;grantdeny;reloadtimeline.',
 'ADM-01':'Admin login/currentgrants/defaultarea;deniedmodules hidden;wrongrole/lockedJWT;no all-grant shortcut;modulepermission removal.',
 'ADM-02':'Role choice onlyManager/CSKH/Admin from authoritative IDs;threecreates200/noCustomerprofile;tampered Customer/custom403 visible;duplicates;list/statusallroles;double submit.',
 'ADM-03':'Create/edit/delete unused role;code immutable;role in use409;empty/error/retry;currentgrant;no crossmodule editor/write response.',
 'ADM-04':'Create/edit/delete unusedpermission;code immutable;referenced409;invalid/duplicates;error/retry/currentgrant.',
 'ADM-05':'Read grants A slow→B fast;atomicreplaceempty/nonempty;unknown/duplicateIDs;revokedQL_QUYEN;writepending target unchanged;live sessiongrant refresh.',
 'ADM-06':'Assign Manager to cinema with dynamicdates;revoke/end assignment;overlap/duplicate409;invalidwrongrole/date400;reload and current Manager scope effect.',
 'ADM-07':'CinemaCRUD/useddelete409;images add/edit/delete/cover;inactivecover409;switchcinema whileload/write;singlecoverSQL;imagefallback/publicgallery;errors/grants.',
 'ADM-08':'Rooms/seats CRUD and empty-delete;referenced show/ticket409;immutable seat row-number;appropriategrants each;refresh/editor scope.',
 'ADM-09':'Movie/actorCRUD,genres[],cast atomicreplacement/emptylist;invalidrefs/duplicate cast;futurebirthdate/datewindow;historicalusage409;hydrateedit/fullrawcolumns.',
 'ADM-10':'GenreCRUD/unreferenceddelete;referenced409;duplicate/invalid400;deniedgrant;reload/error/empty.',
 'ADM-11':'ProductCRUD,decimalprice0/100.25;inactive/reference rules;optionalnulltext;invalidenum/negative;formvalidity and reloadSQL;deniedgrant.',
 'ADM-12':'PromotionCRUD percent1/99/100,flatdecimal;quota;nullable min/max;UTCwindow;historical/inuseerrors;decimal form validity;no change quotas in JS.',
 'ADM-13':'Pricing create/full edit/nullend;decimal surcharge;allallowed dimensions/status;holiday400/overlap409;immutable monetaryhistorical snapshots;errors/grants.',
 'ADM-14':'Show create/edit/cancel;decimalbaseprice;UTCtimes;filters/canceled/history/overlap;heldorder409;paidcompensation;correct editor/resource/no duplicatewrites.',
 'ADM-15':'I-11 A slow/B fast detail+reference;write target equals visible B;module switch/writepending;I-21 unlinked vs403/404/500+retry;shared priority default/AND;key warning exact collection.',
 'ADM-16':'Render summary/byCinema/byMovie/byDate independently;date/cinemafilters;receipt ledger/UTC+7;empty0/error/retry;aliases not countedtwice;currentgrants.',
}


def inspect():
    prior = load(R73)
    matrix = read(ROOT / 'docs/USE_CASE_MATRIX_45.md')
    handoff = read(ROOT / 'docs/R7_3_FINAL_ACCEPTANCE_REPORT.md')
    required = ['ROADMAP_HOAN_THIEN_HE_THONG_SAU_AUDIT.md', 'docs/USE_CASE_BASELINE_45.md',
     'docs/USE_CASE_MATRIX_45.md', 'docs/R7_1_BASELINE_EVIDENCE_REPORT.md', 'docs/R7_2_VERIFICATION_BACKLOG.md',
     'docs/R7_2_REGRESSION_REPORT.md', 'docs/R7_3_FINAL_ACCEPTANCE_REPORT.md', 'docs/MAIN_DATABASE_SYNC_REPORT.md',
     'docs/PROJECT_ACCEPTED_CONSTRAINTS.md', 'scripts/db/TEST_PIPELINE.md']
    required += [p.relative_to(ROOT).as_posix() for p in (ROOT / 'docs/contracts').glob('*.md')]
    documents = {name: {'sha256': sha(ROOT/name), 'lines': len(read(ROOT/name).splitlines())} for name in required}
    sources = {}
    for directory in ['frontend/src', 'frontend/tests', 'backend/src', 'shared']:
        for path in sorted((ROOT / directory).rglob('*')):
            if path.is_file():
                text = read(path)
                sources[path.relative_to(ROOT).as_posix()] = {'sha256': sha(path), 'lines': len(text.splitlines()),
                 'imports': re.findall(r'(?:from\s*|import\s*)[\"\x27]([^\"\x27]+)[\"\x27]', text)}
    graph = {}
    for name, data in sources.items():
        links = []
        for specifier in data['imports']:
            if not specifier.startswith('.'):
                continue
            target = (ROOT/name).parent / specifier
            candidates = [target, Path(str(target)+'.js'), Path(str(target)+'.jsx'), Path(str(target)+'.mjs'), target/'index.jsx',target/'index.js']
            for candidate in candidates:
                if candidate.is_file():
                    links.append(candidate.resolve().relative_to(ROOT).as_posix()); break
        graph[name] = links
    reachable, pending = set(), ['frontend/src/main.jsx']
    while pending:
        name = pending.pop()
        if name in reachable:
            continue
        reachable.add(name); pending.extend(graph.get(name, []))
    routes = [{'line': number, 'source': line.strip()} for number, line in enumerate(read(ROOT/'frontend/src/routes/index.jsx').splitlines(),1)
              if '<Route' in line]
    browser_registry = {}
    for match in re.finditer(r'^### (E\d+) — .*?\n(.*?)(?=^### |\Z)',matrix,re.M|re.S):
        eid, body = match.group(1), match.group(2)
        if '**Class:**' in body and re.search(r'\*\*Class:\*\*[^\n]*FRONTEND', body):
            artifact = re.search(r'\*\*Artifact:\*\* \[[^\]]+\]\(<([^>]+)>\); JSON Pointer `([^`]+)`',body)
            if artifact:
                path = ((ROOT/'docs') / artifact.group(1)).resolve()
                payload = load(path)
                for part in artifact.group(2)[1:].split('/'):
                    part=part.replace('~1','/').replace('~0','~')
                    payload=payload[int(part)] if isinstance(payload,list) else payload[part]
                browser_registry[eid]={'artifact':path.relative_to(ROOT).as_posix(),'selector':artifact.group(2),
                 'scope':body.split('**Scope/trace:**')[-1].strip().split('\n')[0], 'artifactSHA256':sha(path), 'selectorValidated':True}
    rows = []
    gap_lines = [line for line in handoff.splitlines() if line.startswith('| [R71-FE-')]
    handoffs = {re.search(r'/ ((?:KH|QLR|CSKH|ADM)-\d\d)',line).group(1):[part.strip() for part in line.strip('|').split('|')] for line in gap_lines}
    fixes = {'KH-05','KH-06','KH-07','KH-08','KH-09','KH-14','ADM-15'}
    aligns = {'CSKH-02','ADM-02','ADM-11','ADM-12','ADM-13','ADM-14','ADM-16'}
    risk_only = {'KH-10','KH-12','KH-13','CSKH-05','CSKH-06','ADM-05','ADM-07'}
    for old in prior['UCs']:
        uc = old['ucId']; route,page,component,client = COMPONENTS[uc]
        body = re.search(r'^### '+uc+r' .*?\n(.*?)(?=^### |^## |\Z)',matrix,re.M|re.S).group(1)
        legacy_frontend = [eid for eid in old['evidenceIDs'] if eid in browser_registry]
        request,response,errors = CONTRACTS[uc]
        state = ' '.join(STATES[name.strip()] for name in page.split(';'))
        if uc=='CSKH-04':
            state += ' Shared reference has active request guard, explicit loading/error/empty/retry; mounted only by SupportPortal.'
        if uc=='QLR-09':
            state += ' ManagerRevenue active effect guard/attempt retry; range form validates from≤to.'
        action = 'FIX_REQUIRED' if uc in fixes else 'CONTRACT_ALIGNMENT_REQUIRED' if uc in aligns else 'TEST_REQUIRED'
        issue = []
        if uc=='ADM-15': issue=['I-11','I-21','I-15 shared query coverage','R81-FIND-KEY-01']
        if uc=='CSKH-02': issue=['I-15','R72 priority']
        if uc in {'KH-05','KH-06','KH-07','KH-08','KH-09'}: issue=['I-19']
        if uc in {'CSKH-04','KH-14'}: issue=['I-21']
        if uc=='ADM-02':issue=['R72 create allowlist UX']
        if uc=='ADM-16':issue=['R4.2 report four-set UI consumption']
        if uc in {'ADM-11','ADM-12','ADM-13','ADM-14'}:issue=['Decimal number-input UX mismatch (source confirmed, browser validity pending)']
        classifications = ['SOURCE_MAPPED','BROWSER_PARTIAL' if legacy_frontend else 'BROWSER_MISSING']
        if uc in fixes or uc in risk_only or uc=='CSKH-02':classifications.append('STATE_RACE_RISK')
        if uc in aligns:classifications.append('CONTRACT_MISMATCH')
        if uc in {'KH-14','ADM-15'}:classifications.append('KNOWN_UI_DEFECT')
        if old['FE']=='PARTIAL':classifications.append('READY_FOR_R8_2')
        priority = 'P1' if uc in fixes or uc in {'CSKH-02','CSKH-04','CSKH-05','CSKH-06'} else 'P2' if uc in aligns else 'P3'
        fixture = ('F-CUSTOMER' if old['actor']=='Customer' else 'F-MANAGER' if old['actor']=='Manager'
                   else 'F-SUPPORT' if old['actor']=='CSKH' else 'F-ADMIN')
        if uc in {'KH-05','KH-06','KH-07','KH-08','KH-09','KH-10','KH-12','QLR-04','QLR-05','QLR-06','ADM-14'}:fixture += ' + F-BOOKING'
        if uc in {'KH-13','KH-14','CSKH-03','CSKH-04','CSKH-05','CSKH-06','ADM-15'}:fixture += ' + F-HISTORY/COMPLAINT'
        if uc in {'QLR-08','QLR-09','ADM-16'}:fixture += ' + F-REPORT'
        correction = ''
        if uc=='ADM-15':correction='Current AdminPortal does not import/mount ComplaintOrderReference; historical FE prose naming it is corrected here without changing R7 artifacts.'
        for chain in old['chains']:
            path=ROOT/chain['routeFile']; text=read(path)
            local=chain['route'].removeprefix('/api')
            # Full current route source and chain files are preserved by source hashes.
            assert chain['method'].lower() in text
            assert (ROOT/chain['controllerFile']).is_file() and (ROOT/chain['serviceFile']).is_file()
        rows.append({'ucId':uc,'name':old['name'],'actor':old['actor'],'officialFE':old['FE'],'gapId':
         'R71-FE-'+uc if old['FE']=='PARTIAL' else None,'route':route,'page':page,'component':component,
         'apiClient':client,'endpointChains':old['chains'],'authorization':old['authorization'],
         'requestContract':request,'responseContract':response,'errorContract':errors,
         'formAndAsyncState':state,'successBehavior':handoffs.get(uc,['','','Giữ provisional scope của R7.3'])[2],
         'loadingEmptyRetry':'See concrete state above; missing branches remain in scenarios, not assumed implemented.',
         'existingBrowserEvidence':{eid:browser_registry[eid] for eid in legacy_frontend},
         'allHistoricalEvidenceIDs':old['evidenceIDs'], 'missingVerification':handoffs.get(uc,['','','','','Full application E2E beyond provisional scope'])[4],
         'knownOrSuspectedIssue':issue,'currentSourceCorrection':correction,'classification':classifications,
         'action':action if old['FE']=='PARTIAL' else 'PRESERVE_PROVISIONAL_PASS','executionPriority':priority,
         'originalPriority':'P3 (unchanged inherited FE backlog priority)','browserScenarios':SCENARIOS.get(uc,'Provisional PASS retained; no new UC acceptance claim.'),
         'fixtures':fixture,'dependencies':['ENV-R81','current canonical SQL/backend contracts'] + issue,
         'fixtureCurrentReadiness':'Four roles/basic queue ready and smoke-verified; expanded business fixtures are designed, create per scenario in R8.2.',
         'acceptance':'Actual AppRoutes UI + real API/typed SP/SQL assertions for listed scenarios; current grants/scope/ownership; no stale target/doublewrite/false success; cleanup hashes; preserve UI tokens.',
         'recommendation':('Minimal state/identity/error fix after targeted reproduction; no redesign.' if uc in fixes
          else 'Align supported controls/response display/decimal input; keep backend authority.' if uc in aligns
          else 'Run planned browser scenarios first; change code only if a defect is reproduced.')})
    assert len(rows)==45 and len({r['ucId'] for r in rows})==45
    assert sum(r['officialFE']=='PARTIAL' for r in rows)==43
    assert set(r['ucId'] for r in rows if r['officialFE']=='PASS')=={'KH-02','KH-03'}
    dump('source-audit.json',{'status':'PASS','requiredDocuments':documents,'sources':sources,
      'frontendImportGraph':graph,'reachableFromActualMain':sorted(reachable),'routes':routes,
      'browserEvidenceSelectorsValidated':len(browser_registry),'browserRegistry':browser_registry,
      'sourceMappedIsNotRuntimePASS':True})
    dump('frontend-mapping.json',{'status':'INSPECTED','ucCount':45,'inheritedGaps':43,'officialFE':{'PASS':2,'PARTIAL':43},
      'coverageClassificationsAreNotAcceptance':True,'UCs':rows})
    dump('backlog.json',{'status':'PENDING_R8_2','gapCount':43,'counts':dict(collections.Counter(r['action'] for r in rows if r['gapId'])),
      'priorityCounts':dict(collections.Counter(r['executionPriority'] for r in rows if r['gapId'])), 'gaps':[r for r in rows if r['gapId']]})
    return rows


def write_mapping(rows):
    text = ['# R8 Frontend Gap Matrix — work package R8.1', '',
     '45 UC được khảo sát; giữ **2 provisional FE PASS / 43 PARTIAL** và tất cả `R71-FE-*` IDs. Đây là mapping/inspection, không Final Frontend Acceptance.', '',
     'Work package R8.1 hiện tại là inspection/environment; roadmap R8.1/I-11 vẫn pending fix R8.2. SOURCE_MAPPED/BROWSER_PARTIAL/BROWSER_MISSING/CONTRACT_MISMATCH/STATE_RACE_RISK/KNOWN_UI_DEFECT/READY_FOR_R8_2 là classification hỗ trợ, không thay thế grade. READY_FOR_R8_2 nghĩa là có kế hoạch và environment dùng được; không có nghĩa mọi scenario fixture đã tạo.', '',
     'Nguồn: [baseline45](USE_CASE_BASELINE_45.md), [matrix lịch sử](USE_CASE_MATRIX_45.md), [R7.3](R7_3_FINAL_ACCEPTANCE_REPORT.md), '+evidence_link('frontend-mapping.json')+'.', '',
     '| UC / Actor | FE baseline | Gap | Mounted route / component | Classification | R8.2 action / order |',
     '| --- | --- | --- | --- | --- | --- |']
    for r in rows:
        text.append('| ['+r['ucId']+'](#uc-'+r['ucId'].lower()+') / '+r['actor']+' | '+r['officialFE']+' | '+(r['gapId'] or '—')+' | '+cell(r['route']+' → '+r['component'])+' | '+', '.join(r['classification'])+' | '+r['action']+' / '+r['executionPriority']+' |')
    for r in rows:
        text += ['', '<a id="uc-'+r['ucId'].lower()+'"></a>', '', '## '+r['ucId']+' — '+r['name'], '',
          '| Mapping / verification | Current inspection |','| --- | --- |',
          '| Entry / route / page | '+cell(r['route']+' → '+r['page'])+' |',
          '| Mounted component | '+cell(r['component'])+'; '+cell(r['currentSourceCorrection'])+' |',
          '| API client | '+cell(r['apiClient'])+' |',
          '| Authorization | '+cell(r['authorization'])+' |',
          '| Request / type / null / money / date / identity | '+cell(r['requestContract'])+' |',
          '| Response / arrays / empty / nullable | '+cell(r['responseContract'])+'; no invented pagination envelope |',
          '| Form state / async / pending / success/error | '+cell(r['formAndAsyncState'])+' |',
          '| Success behavior required | '+cell(r['successBehavior'])+' |',
          '| Actual error contracts | '+cell(r['errorContract'])+'; shared error.message/status/code;401 clears session,403 refreshes current user; no422 added |',
          '| Loading / empty / retry | '+cell(r['loadingEmptyRetry'])+' |',
          '| Existing browser evidence | '+(' ; '.join('['+eid+'](USE_CASE_MATRIX_45.md#evidence-'+eid.lower()+') '+info['scope'] for eid,info in r['existingBrowserEvidence'].items()) or 'No UC-specific browser artifact in accepted R7 registry; R8.1 smoke is readiness evidence only.')+' |',
          '| Missing verification | '+cell(r['missingVerification'])+' |',
          '| Known/suspected issue | '+cell('; '.join(r['knownOrSuspectedIssue']) or 'No confirmed defect from this inspection; missing proof is not missing implementation.')+' |',
          '| Browser scenarios | '+cell(r['browserScenarios'])+' |',
          '| Fixture / dependency | '+cell(r['fixtures']+'; ENV-R81, approved contracts; '+r['fixtureCurrentReadiness'])+' |',
          '| Recommendation / acceptance | '+cell(r['recommendation']+' '+r['acceptance'])+' |', '',
          '| Method / path | Current backend route → controller → service → whitelist/SP |','| --- | --- |']
        for c in r['endpointChains']:
            text.append('| '+c['method']+' '+c['route']+' | '+source_link(c['routeFile'])+' → '+c['controller']+' → '+c['service']+' → '+cell(c['whitelist'])+' |')
        # Link all actual UI production locations; source audit preserves exact hashes/line counts.
        paths=['frontend/src/pages/'+name.strip() for name in r['page'].split(';')]
        text += ['', 'Current UI source: '+', '.join(source_link(p) for p in paths)+'. Raw mapping selector `'+f"/UCs/{rows.index(r)}"+'` tại '+evidence_link('frontend-mapping.json')+'.']
    (ROOT/'docs/R8_FRONTEND_GAP_MATRIX.md').write_text('\n'.join(text)+'\n',encoding='utf-8')


def write_backlog(rows):
    gaps=[r for r in rows if r['gapId']]
    counts=collections.Counter(r['action'] for r in gaps)
    text=['# R8.2 Execution Backlog — prepared by R8.1','',
     '**PENDING R8.2: 43 inherited Frontend gaps.** Không gap nào RESOLVED; giữ issue IDs và historical backlog. '+evidence_link('backlog.json')+' lưu từng field và counts.', '',
     'Primary action categories loại trừ nhau: '+str(dict(counts))+'; BLOCKED0. STATE_RACE_RISK/KNOWN_UI_DEFECT/CONTRACT_MISMATCH có thể giao nhau; không cộng chúng thành số gap. FIX_REQUIRED bao gồm UC dùng chung BookingPreparation cần reset context; không phải bảy defect độc lập. Contract alignment còn cần UI validation/proof, không đồng nghĩa SQL/backend sai.', '',
     'P1/P2/P3 dưới đây là thứ tự thực hiện R8.2; priority P3 của backlog lịch sử giữ nguyên. ENV-R81 = [môi trường đã smoke](R8_TEST_ENVIRONMENT.md).', '',
     '| Work item / original roadmap | UC | Root mechanism / current protection | R8.2 scope / verification |',
     '| --- | --- | --- | --- |',
     '| I-11 / roadmap R8.1 | ADM-15 | Admin loadRequest bảo vệ list, không openComplaint/detail/reference; selected/write ID có thể khác visible detail. | Latest request +resource identity; protect write refresh/module switch; delayed A/B, write targetB,abort/error/retry. |',
     '| I-15 / roadmap R8.2 | CSKH-02; ADM-15 shared contract | Support queue thiếu guard; detail đã có generation; Admin list đã có loadRequest. | Guard current queue filters/loading/error; AND priority; no old rows; do not remove existing detail/list protections. |',
     '| I-19 / roadmap R8.3 | KH-05..09 | Detail abort/promo version chỉ partial protection; quantities/code/booking result persist; seats old before new response. | Context keyed byshowtime for seat/food/code/quote/result/error/loading; latewrites/quotes ignored; no wrong-context submit. |',
     '| I-21 / roadmap R8.4 | CSKH-04; KH-14; ADM-15 | Shared CSKH component đã error/retry; Customer getOrders.catch→[]; Admin catch→message loses status/retry. | Preserve existing good component; fix actual remaining paths; linked/unlinked/403/404/500/network+retry. |',
     '| CT-PRIORITY | CSKH-02; ADM-15 shared | API can serialize priority, controls absent. | Approved4options/omit empty/AND SQL/error400/stale guards. |',
     '| CT-ADMIN-ROLE | ADM-02 | Numeric roleId field; no role option source or hardcoded IDs; generic403 visible. | Constrained role choices from permissible authoritative IDs; handle lacking QL_VAITRO without adding grants/new API; list/status stillallroles. |',
     '| CT-DASHBOARD | QLR-08 | Four fields already matched; zero fallback can hide missing-field contract regressions. | Test independent numeric semantics; retain four metrics, no occupancy. |',
     '| CT-DECIMAL | ADM-11..14 | Generic number fields no explicit step; browser defaultinteger conflicts with valid2decimal payload. | Incremental step/validation only; real HTML validity +API +persisted decimals; no final-money JSformula. |',
     '| CT-REPORT | ADM-16 | Generic dataRows consumes first report array; other three canonical sections undisplayed. | Incremental rendering four sets; SQL totals, range/empty/retry; preserve layout/colors. |',
     '| R81-FIND-KEY-01 | ADM-15 / AdminPortal collection | Actual Chrome console key warning; exact source collection root cause pending. | Reproduce warning, inspect affected keys under dashboard/complaints, fix stable identity without UI redesign; diagnostic console clean afterward. |', '',
     'Suggested order: ENV/fixtures → I-11/I-15/I-19/I-21 → approved contracts/decimal/report → auth/grant and booking/payment journeys → remaining Manager/CSKH/Admin CRUD/report scenarios. Expand fixtures per isolated journey; no main mutation. Controlled delay/fault cases retain provenance of real API responses and are labeled CONTROLLED_TRANSPORT; separate uninjected real SQL E2E assertions.', '',
     'Common acceptance: actual AppRoutes (not component-only mount), recorded UI/network and SQL state assertions, allowed+denied grants/ownership/scope, error distinct from empty, deterministic latest state, pending/double-submit behavior, no fatal console errors, fixture cleanup. Minimal accessibility/responsive regression checks preserve labels/focus/keyboard/390px and1440px baseline. Unit/mock green alone does not resolve a gap.', '',
     'Fixture specs F-* và commands: [R8_TEST_ENVIRONMENT.md](R8_TEST_ENVIRONMENT.md). Each gap below remains actionable independently even when one journey covers several UCs.']
    for r in sorted(gaps,key=lambda r:(r['executionPriority'],0 if r['ucId'] in {'ADM-15','CSKH-02'} else 1,r['ucId'])):
        text += ['', '<a id="gap-'+r['ucId'].lower()+'"></a>','', '## '+r['gapId']+' — '+r['name'], '',
          '| Field | Plan |','| --- | --- |',
          '| UC / actor / state | '+r['ucId']+' / '+r['actor']+' / PENDING_R8_2, official FE PARTIAL |',
          '| Action / execution order | '+r['action']+' / '+r['executionPriority']+'; original FE priorityP3 unchanged |',
          '| Route / page / component / API | '+cell(r['route']+'; '+r['page']+'; '+r['component']+'; '+r['apiClient'])+' |',
          '| Current implementation / known risk | '+cell(r['formAndAsyncState']+' '+str(r['knownOrSuspectedIssue']))+' |',
          '| Contract | '+cell(r['requestContract']+' → '+r['responseContract']+'; '+r['errorContract'])+' |',
          '| Existing / missing proof | [Accepted source+registry](USE_CASE_MATRIX_45.md#uc-'+r['ucId'].lower()+'); '+cell(r['missingVerification'])+' |',
          '| Required UI behavior | '+cell(r['successBehavior'])+' |',
          '| Recommended change | '+cell(r['recommendation'])+' |',
          '| Browser scenarios | '+cell(r['browserScenarios'])+' |',
          '| Fixture / dependencies | '+cell(r['fixtures']+'; '+', '.join(r['dependencies']))+'; full business fixtures created per scenario in R8.2 |',
          '| Acceptance | '+cell(r['acceptance'])+' |']
    (ROOT/'docs/R8_2_EXECUTION_BACKLOG.md').write_text('\n'.join(text)+'\n',encoding='utf-8')


if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    rows=inspect();write_mapping(rows);write_backlog(rows)
    print(json.dumps({'UCs':len(rows),'gaps':sum(bool(r['gapId']) for r in rows),
      'actions':dict(collections.Counter(r['action'] for r in rows if r['gapId'])),'status':'INSPECTED'},ensure_ascii=True))
