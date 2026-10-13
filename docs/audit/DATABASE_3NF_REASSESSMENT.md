# DATABASE 3NF REASSESSMENT — CinemaBookingDB

**Ngày:** 13/10/2026. **Database:** CinemaBookingDB. **Chế độ:** READ-ONLY BUSINESS ANALYSIS.

**Bằng chứng runtime mới:** SELECT-only lúc `2026-10-13T04:32:12.324Z`; 27 bảng, 174 cột, 31 FK, 169 module. Không có lệch metadata so với audit gốc; định nghĩa module khớp source.

**Bảo toàn:** 635 file SQL/code/tài liệu liên quan được chụp hash trước phân tích; 303 SQL file không thay đổi từ audit trước. Audit gốc giữ nguyên, SHA-256 `ac21d6d95ca747eaf70e1abbfb28e4bd50162168a6b57fa232a3e0dd24ddfa7f`.

Không chạy build/run-all, seed, migration, SP ghi hoặc regression/concurrency test có DML, kể cả rollback. Các test được đọc như đặc tả implementation, không được xem là approval của owner.

## 1. Scope & Baseline

BRC reassess **năm bảng**; không thực hiện lại audit toàn bộ 27 bảng hoặc thay các kết luận của 22 bảng còn lại. Báo cáo đầu vào: [docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md:5](../../docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md#L5).

| Baseline audit gốc | Giá trị |
|---|---|
| Tổng bảng | 27 |
| 1NF | 27 PASS |
| 2NF | 25 PASS / 2 UNKNOWN |
| 3NF | 22 PASS / 1 FAIL / 4 UNKNOWN |
| Verdict scope writer hiện hành | NOT_3NF |

Source không thay đổi, runtime không drift. BRC bổ sung truy vết API/UI/tests và tiêu chuẩn approval: một FD SOURCE_CONFIRMED trong behavior không tự là FD BUSINESS_APPROVED cho mọi trạng thái hợp lệ của mô hình owner mong muốn. Không sửa/xóa audit gốc.

**Hai lớp kết luận bắt buộc tách:** (1) model được closed set writer hiện hành duy trì — N-001 có chứng minh FAIL; (2) model nghiệp vụ được owner phê duyệt đầy đủ — N-001 đang chờ chốt D-01/D-02, các FD quan trọng khác chưa đầy đủ. Chọn **INCONCLUSIVE** cho lớp (2); không nói database hiện đã được sửa hoặc source FD cũ không còn đúng.

Source SQL dùng các file canonical từ build-objects.sql và module đã đối chiếu runtime. Backend typed procedure client/whitelist, controllers/services/validators và frontend form/payment/complaint flow được đọc để xác nhận contract. Seed, fixture, migration và SQL deploy được khảo sát tách biệt; chúng có DML đặc quyền nhưng không là tính năng ghi của ứng dụng.

Các thư mục thực tế: [database/README.md:34](../../database/README.md#L34) ghi `05_functions`, `06_views`, `07_triggers`, `08_procedures`. Báo cáo gốc: [docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md:5](../../docs/audit/DATABASE_3NF_NORMALIZATION_AUDIT.md#L5). BRC không dùng đường dẫn gợi ý sai hoặc thống kê roadmap cũ.

Nguồn đang có trong docs/ khi bắt đầu BRC chỉ gồm audit gốc. README dẫn docs/FINAL_SYSTEM_AUDIT.md và các tài liệu approval/deployment/seed không có trong checkout. README tự ghi “Approved edit rules”; phải giữ những giới hạn đang mô tả, nhưng không tự bổ sung ý định nghiệp vụ hoặc giả định đã truy xuất được quyết định owner cho FD/khóa của cả năm bảng.

SOURCE_CONFIRMED = constraint/hành vi chứng minh từ source; BUSINESS_APPROVED = yêu cầu/decision rõ của chủ dự án; INFERRED = ý định suy từ implementation; CONFLICT = hai nguồn nói khác nhau; UNDEFINED = thiếu đặc tả. SOURCE_CONFIRMED không tự nâng thành BUSINESS_APPROVED. Hai APP rule được BUSINESS_APPROVED từ chính yêu cầu BRC hiện tại, không từ suy đoán lịch sử repo.

## 2. Confirmed Functional Dependencies

| Quan hệ / FD | Căn cứ | Rule status | Giới hạn |
|---|---|---|---|
| THANHTOAN: ThanhToanID → R | [database/02_tables/thanhtoan.sql:2](../../database/02_tables/thanhtoan.sql#L2); [database/03_constraints/001_primary_unique.sql:129](../../database/03_constraints/001_primary_unique.sql#L129) | SOURCE_CONFIRMED | Key FD của bảng cơ sở; không tự kết luận 3NF từ đây. |
| KHIEUNAI: KhieuNaiID → R | [database/02_tables/khieunai.sql:2](../../database/02_tables/khieunai.sql#L2); [database/03_constraints/001_primary_unique.sql:57](../../database/03_constraints/001_primary_unique.sql#L57) | SOURCE_CONFIRMED | Key FD của bảng cơ sở; không tự kết luận 3NF từ đây. |
| BANGGIA: GiaID → R | [database/02_tables/banggia.sql:2](../../database/02_tables/banggia.sql#L2); [database/03_constraints/001_primary_unique.sql:3](../../database/03_constraints/001_primary_unique.sql#L3) | SOURCE_CONFIRMED | Key FD của bảng cơ sở; không tự kết luận 3NF từ đây. |
| PHANCONG_RAP: PhanCongID → R | [database/02_tables/phancong_rap.sql:2](../../database/02_tables/phancong_rap.sql#L2); [database/03_constraints/001_primary_unique.sql:75](../../database/03_constraints/001_primary_unique.sql#L75) | SOURCE_CONFIRMED | Key FD của bảng cơ sở; không tự kết luận 3NF từ đây. |
| RAPCHIEUPHIM: RapID → R | [database/02_tables/rapchieuphim.sql:2](../../database/02_tables/rapchieuphim.sql#L2); [database/03_constraints/001_primary_unique.sql:111](../../database/03_constraints/001_primary_unique.sql#L111) | SOURCE_CONFIRMED | Key FD của bảng cơ sở; không tự kết luận 3NF từ đây. |
| THANHTOAN: DonDatVeID→SoTien | [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:96](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L96); [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:98](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L98); [database/11_tests/staff_booking/regression.sql:513](../../database/11_tests/staff_booking/regression.sql#L513) | SOURCE_CONFIRMED; approval toàn nghiệp vụ PENDING D-01 | Closed set writer, full amount/freeze; không dùng runtime 0 mismatch để chứng minh. |
| KHIEUNAI: DonDatVeID→NguoiDungID trên linked subset | [database/08_procedures/customer/sp_Complaint_Create.sql:53](../../database/08_procedures/customer/sp_Complaint_Create.sql#L53) | SOURCE_CONFIRMED có điều kiện; PENDING D-03 | DonDatVeID khác NULL và writer hiện hành; không FD cổ điển toàn bảng. |

Các giả thuyết bị source bác bỏ/không bảo đảm: pricing condition+start là key toàn bảng; assignment người+rạp+start là key; dates→TrangThai phân công; address text→city toàn miền. Việc source cho phép biến thể không đồng nghĩa owner đã approve mọi biến thể; cần D-04/D-06/D-07 để chốt miền nghiệp vụ.

### Không đánh đồng quan hệ sau JOIN với lỗi 3NF

NguoiDungID xác định owner từ DONDATVE sau JOIN không tự gây 3NF của bất kỳ bảng nào không lưu cả hai thuộc tính. THANHTOAN có cả DonDatVeID và SoTien nên nếu amount bất biến là FD thật thì cần xét nội bảng. KHIEUNAI cũng có cả ID nhưng optional reference đòi xét tập có đơn riêng. Giá ticket, quote sản phẩm, tổng order và latest complaint state có ngữ nghĩa lịch sử/current-state, không bị loại vì JOIN tính ra được một biểu thức.

## 3. Candidate Key Reassessment

| Table | CK toàn bảng đã chứng minh | Prime | Non-prime | CK/Business key chưa chứng minh |
|---|---|---|---|---|
| THANHTOAN | (ThanhToanID) | ThanhToanID | DonDatVeID, PhuongThuc, SoTien, NgayTao, NgayThanhToan, MaGiaoDich, TrangThai, GhiChu | MaGiaoDich nullable/filtered chỉ key tra cứu khi non-NULL; DonDatVeID có nhiều attempts. |
| KHIEUNAI | (KhieuNaiID) | KhieuNaiID | NguoiDungID, DonDatVeID, LoaiKhieuNai, TieuDe, NoiDung, MucDoUuTien, NgayTao, TrangThai | DonDatVeID nullable và nhiều complaints/đơn; không là CK. |
| BANGGIA | (GiaID) | GiaID | RapID, LoaiGhe, LoaiNgay, DinhDang, PhuThu, NgayBatDau, NgayKetThuc, TrangThai | (RapID,LoaiGhe,LoaiNgay,DinhDang,NgayBatDau) không unique inactive; temporal active key không toàn phần. |
| PHANCONG_RAP | (PhanCongID) | PhanCongID | NguoiDungID, RapID, NgayBatDau, NgayKetThuc, TrangThai | (NguoiDungID,RapID,NgayBatDau) không unique; full content dedup chỉ writer/nullable comparator, chưa có CK tối thiểu được chốt. |
| RAPCHIEUPHIM | (RapID) | RapID | TenRap, DiaChi, ThanhPho, SoDienThoai, MoTa, NgayHoatDong, TrangThai | Không có proof TenRap hoặc DiaChi là key; cần định nghĩa địa điểm nếu muốn business key khác. |

Mọi superset chứa PK là superkey theo FD từ PK. Các PK đơn tối thiểu dưới các constraints/FD đã chứng minh. Không bổ sung prime attribute từ một filtered/nullable key hoặc từ việc runtime chưa có duplicate. Với key nghiệp vụ mới được chốt, phải xét tính tối thiểu và proper subsets; không xem surrogate ID như một phép miễn chuẩn hóa.

## 4. Normalization Assessment for Five Tables

**Bảng dưới là đánh giá của mô hình BUSINESS_APPROVED theo tiêu chuẩn BRC, không phải tuyên bố implementation FD source đã thay đổi.**

| Table | 2NF | 3NF | FD quan trọng | Business Rule Status | Giải thích |
|---|---|---|---|---|---|
| THANHTOAN | PASS | UNKNOWN | ThanhToanID→R; DonDatVeID→SoTien trong writer model | SOURCE_CONFIRMED; D-01/D-02 PENDING_DECISION | PK đơn; source-only 3NF FAIL, nhưng tính bắt buộc và chính sách snapshot trong nghiệp vụ được duyệt chưa chốt. |
| KHIEUNAI | PASS | UNKNOWN | KhieuNaiID→R; DonDatVeID→NguoiDungID có điều kiện | SOURCE_CONFIRMED subset; D-03 PENDING_DECISION | Không FD toàn bảng qua NULL; cần mô hình reporter/order chính thức và đánh giá linked/general. |
| BANGGIA | UNKNOWN | UNKNOWN | GiaID→R; version/business key khác chưa được chốt | SOURCE_CONFIRMED mutable behavior; D-04/D-05 PENDING_DECISION | Key giả thuyết không được source bảo đảm; thiếu business FD đầy đủ, không kết luận FAIL chỉ vì thiếu natural UQ. |
| PHANCONG_RAP | UNKNOWN | UNKNOWN | PhanCongID→R; period/content key chưa chốt | SOURCE_CONFIRMED many–many/flag/date; D-06 PENDING_DECISION | Xem CK ghép tiềm năng dù PK đơn; không biến overlap predicate thành FD. |
| RAPCHIEUPHIM | PASS | UNKNOWN | RapID→R; DiaChi→ThanhPho chưa được xác nhận | SOURCE_CONFIRMED independent inputs; D-07 PENDING_DECISION | Không dùng seed địa chỉ demo để chứng nhận miền địa chỉ chính thức. |

**Count trong năm bảng:** 2NF 3 PASS / 0 FAIL / 2 UNKNOWN; 3NF **0 PASS / 0 FAIL / 5 UNKNOWN** ở lớp business approval. Source-only finding giữ nguyên: THANHTOAN FAIL dưới contract writer hiện hành. Không dùng các số này để “đổi” bảng baseline gốc thành một audit toàn 27 bảng mới.

### THANHTOAN — chứng minh theo source và conditional assessment

- **Current Verified Assessment:** 1NF/2NF theo key/domain PASS; `DonDatVeID→SoTien` SOURCE_CONFIRMED. ThanhToanID→DonDatVeID→SoTien là FD bắc cầu; DonDatVeID không superkey do retries, SoTien non-prime. Vì vậy source-only FAIL 3NF, approved-business 3NF UNKNOWN.
- **Conditional Assessment If Option A Approved (D-01 freeze, D-02 giữ):** FD thành BUSINESS_APPROVED và N-001 FAIL 3NF ở schema hiện tại; gọi là intentional denormalization, không VERIFIED_3NF.
- **Conditional Assessment If Option B Approved (D-02 derive từ order):** approval một mình chưa đổi result. Sau migration/writer/readers được duyệt và triển khai đúng, SoTien bị loại khỏi quan hệ attempt; PASS chỉ theo các FD còn lại sau reaudit. Không lưu thêm net tổng vào order như non-key calculated data.
- **Conditional Assessment If independent attempt amount approved:** code hiện tại vẫn giữ FD và không hỗ trợ behavior mới. Chỉ sau khi mô hình mới/writer được triển khai hợp lệ và phân tích mọi FD thì mới có thể bác bỏ N-001; không tự đổi ngữ nghĩa SoTien.

### KHIEUNAI — linked/general khác nhau

- **Current Verified Assessment:** source reporter là authenticated Customer; linked đơn phải của mình; general không có đơn được phép. PK đơn không có partial dependency đã chứng minh. Toàn bảng 3NF UNKNOWN.
- **Conditional Assessment If Option A Approved:** linked subset vẫn có DonDatVeID→NguoiDungID khi nhiều complaints của cùng đơn. Trong quan hệ subset chuẩn cổ điển, nếu determinant không superkey/RHS không prime thì có normalization redundancy; không tự coi đây là FD toàn quan hệ chứa general NULL.
- **Conditional Assessment If Option B Approved:** giữ nguyên policy reporter/owner, nhưng chuyển optional order reference sang quan hệ riêng chỉ sau schema approval. Không thêm actor/Use Case/RBAC; phải chứng minh tái dựng và kiểm tra FD từng quan hệ mới. Approval trên giấy không tự PASS và không xóa reporter.

### BANGGIA — khóa phiên bản không được mặc định

- **Current Verified Assessment:** chỉ CK GiaID toàn bảng được chứng minh. Rule mutable, cả Tất cả/cụ thể SUM, active same-dimension periods không overlap. CK ghép dự đoán bị refuted trong source toàn bảng; 2NF/3NF UNKNOWN do mô hình version chưa chốt.
- **Conditional Assessment If Option A Approved:** một row là rule configuration theo GiaID, cho phép inactive rows dùng cùng conditions/start; chốt không có FD non-key thêm trong mô hình này. Theo F={GiaID→R}, key closure thỏa 2NF/3NF. Chứng cứ approval+FD đầy đủ phải được ghi trước PASS, không chỉ thiếu duplicate.
- **Conditional Assessment If Option B Approved:** xác định key của version, xử lý records inactive trùng và giữ version history. CK ghép không tự gây FAIL; phải xét PhuThu/end/status phụ thuộc đầy đủ. Approval chưa đồng nghĩa constraints mới đã enforce.
- **D-05:** SUM vs priority là thuật toán xuyên bảng, không quyết định 3NF một mình. Không lấy “không overlap” làm key toàn relation.

### PHANCONG_RAP — interval identity và state

- **Current Verified Assessment:** CK PhanCongID; nhiều–nhiều, overlap không cấm, exact-content dedup, state/date độc lập. Full-content comparator có end NULL không được tự coi là CK cổ điển toàn phần/tối thiểu. 2NF/3NF UNKNOWN trước khi chốt business keys.
- **Conditional Assessment If Option A Approved:** row là một interval mutable có identity ổn định, attributes là facts của assignment và không có dates→status hoặc manager→cinema. Chốt FD model đó và tính đầy đủ CK; khi đầy đủ có thể PASS, không cần thêm rule một manager một rạp.
- **Conditional Assessment If Option B Approved:** cần key tối thiểu/nullable comparator và temporal predicate riêng. Non-overlap không tự chứng minh một CK; nếu có CK ghép, kiểm tra mọi proper subset với end/status trước khi kết luận.

### RAPCHIEUPHIM — address domain

- **Current Verified Assessment:** address/city hai input độc lập, name/address không UQ, address có thể đổi trên cùng RapID. 2NF theo CK đơn PASS; 3NF UNKNOWN theo miền nghiệp vụ chưa định nghĩa.
- **Conditional Assessment If Option A Approved:** cùng address text ở khác city hợp lệ; bác bỏ DiaChi→ThanhPho trong miền đã chốt. Theo FD còn lại RapID→R, có thể PASS khi không có business FD/key khác chưa rõ.
- **Conditional Assessment If Option B Approved:** nếu DiaChi là determinant không superkey và ThanhPho non-prime thì FAIL 3NF. Nếu DiaChi thực sự là candidate key toàn bảng thì FD này hợp lệ; không mặc định cứ full address là phải thêm bảng địa chỉ.

## 5. Confirmed Violations

**Confirmed violation của approved business model:** chưa chốt được một vi phạm toàn bảng do thiếu decision D-01. Không có nghĩa đã chứng minh không có vi phạm.

**N-001 vẫn confirmed trong source writer model:** [database/08_procedures/payment/sp_Payment_CreateAttempt.sql:96](../../database/08_procedures/payment/sp_Payment_CreateAttempt.sql#L96); [database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql:98](../../database/08_procedures/staff_booking/sp_StaffBooking_UpdateSeats.sql#L98); [database/README.md:80](../../database/README.md#L80). Không phủ nhận chuỗi FD hoặc xóa audit cũ. Chỉ reclassify mức approval khi kết luận về business model chính thức.

Determinant DonDatVeID không key cho attempts; SoTien không prime. Anomaly chỉ xuất hiện khi ghi/điều chỉnh/import ngoài các writer hiện hành hoặc khi thay policy mà không cập nhật toàn bộ rows. Không phát hiện mismatch runtime; không gọi đây là incident thất thoát doanh thu.

## 6. Conditional Findings

| Finding | Source assessment giữ lại | Business reassessment | Quyết định còn thiếu |
|---|---|---|---|
| N-001 THANHTOAN | FAIL under full amount/freeze writer contract | UNKNOWN official approval | D-01 amount invariant; D-02 snapshot exception/derive |
| U-001 RAPCHIEUPHIM | UNKNOWN address semantic FD | UNKNOWN | D-07 address domain/business key |
| U-002 KHIEUNAI | Conditional linked ownership FD; global UNKNOWN | UNKNOWN | D-03 reporter/order/optional model |
| U-003 BANGGIA | Hypothetical version key not global in current source | UNKNOWN | D-04 rule/version identity; D-05 pricing semantics separately |
| U-004 PHANCONG_RAP | Exact duplicate guard, hypothetical smaller keys refuted | UNKNOWN | D-06 interval identity/key/temporal policy |

Không chuyển một nguồn INFERRED/UNDEFINED thành BUSINESS_APPROVED chỉ vì recommendation tiện hoặc làm tăng PASS. Schema may satisfy 3NF dưới F được chốt nhưng việc có surrogate key duy nhất không đủ proof F đầy đủ.

## 7. Intentional Denormalization

- THANHTOAN.SoTien: amount lúc tạo attempt; independent retention intent còn chờ. Nếu owner giữ invariance+snapshot thì chấp nhận ngoại lệ có chủ đích, không gọi bảng VERIFIED_3NF.
- CHITIETVE.GiaVe và CHITIETDOAN.DonGia: giá tại giao dịch; giá hiện tại có thể đổi. Không đề nghị loại bỏ, không áp FD từ catalog hiện tại cho lịch sử.
- DONDATVE tổng/discount: có thể sửa tổng vé trước attempt, chốt sau attempt theo source. Hủy giữ money snapshots; không lấy SUM(vé còn hiệu lực) để cập nhật đơn đã hủy về 0.
- KHIEUNAI.TrangThai/XULY_KHIEUNAI.TrangThaiSauXuLy: current state/event history, cross-table sync. Trigger chỉ INSERT nên privileged UPDATE/DELETE history có rủi ro; tách khỏi 3NF.
- BANGGIA/PHANCONG_RAP state: control flag cùng temporal bounds, không phải “tên trạng thái suy ra chắc chắn từ ngày”. Không dùng expiration/overlap để tạo FD giả.

## 8. Proposed Solutions

**PROPOSED — NOT APPROVED.** Mọi thay đổi schema: **PROPOSED SCHEMA CHANGE — REQUIRES APPROVAL**. Không thực hiện trong BRC.

### Payment: tận dụng cấu trúc hiện tại trước

A giữ SoTien + freeze là đơn giản nhất và bảo toàn history; cần owner chấp nhận 3NF exception nếu D-01 A. B có thể đọc net từ DONDATVE trong SP/view và giữ alias/type SoTien cho API; schema chỉ giữ attempts không amount. C amount độc lập chỉ khi có nghiệp vụ hợp lệ riêng, không tự mở partial payments.

#### Chứng minh bảo toàn cho B trước khi cân nhắc schema

Gọi R=THANHTOAN hiện tại, Q=π(R−{SoTien}), O=DONDATVE và M=π(DonDatVeID, TongTienVe+TongTienDoAn−TienGiamGia AS SoTien)(O). Nếu (i) mỗi attempt có order tồn tại qua FK, (ii) net(order)=SoTien của mọi attempt toàn lịch sử, (iii) net bất biến từ attempt đầu tiên trong mọi writer/import/retention, thì Q JOIN M khôi phục đúng R theo ThanhToanID; DonDatVeID là key của M nên không nhân bản tuples. Khi order hủy/refund, phải tiếp tục giữ net gốc, không thay bằng balance còn phải thu.

Đây là **lossless reconstruction có điều kiện với quan hệ order đã tồn tại**, không phải cứ xóa cột là đảm bảo lossless. Runtime 0 amount mismatch hôm nay chỉ là preflight quan sát; chưa là guarantee mọi trạng thái hợp lệ/tương lai. Cần đối soát full history và review tất cả writer, importer, retention trước deployment. Nếu có dữ liệu từng attempt khác net(order), B mất thông tin và phải dừng.

Dependency preservation: ThanhToanID→thuộc tính Q còn trong Q; DonDatVeID→net được FK/PK order và freeze contract cung cấp qua M. Không có constraint nội Q enforce equality amount vì cột không còn; business invariant theo order phải tiếp tục được bảo vệ. FK THANHTOAN→DONDATVE NO ACTION hiện có giúp chặn xóa order còn attempt. Không thêm net amount thành cột ordinary của DONDATVE: tuple tổng/discount sẽ là determinant không key của nó.

Nếu buộc phải giữ một amount riêng của obligation tách khỏi order mà B không bảo toàn, decomposition P(DonDatVeID,SoTien)+Q trong audit gốc có proof lossless theo DonDatVeID→SoTien. Nhưng đó thêm bảng và chưa được phê duyệt; không ưu tiên trước phương án tận dụng order hiện hữu. Không áp dụng nếu owner chọn amount độc lập.

### Bốn vùng còn lại

Complaint: chốt semantics trước; không bỏ reporter và không mở staff proxy/RBAC. Tận dụng cấu trúc hiện tại bằng cách giữ một bảng và giải thích conditional reference là phương án A đơn giản nhất: không thể loại một trong hai ID mà vẫn giữ thông tin người gửi chung và link đơn trong mọi trường hợp. Không dùng XULY_KHIEUNAI làm bảng link đơn vì đó là lịch sử sự kiện, không phải identity link.

Nếu chọn D-03 B cho chuẩn hóa nghiêm ngặt: đề xuất H=KHIEUNAI bỏ DonDatVeID và L(KhieuNaiID,DonDatVeID) chỉ chứa complaint có đơn, PK/FK KhieuNaiID→H, FK DonDatVeID→DONDATVE. H vẫn giữ NguoiDungID và history giữ KhieuNaiID. H LEFT JOIN L tái dựng optional relation vì mỗi complaint có tối đa một link và không có link biểu diễn DonDatVeID NULL. Đây là reconstruction theo semantics SQL NULL, không giả định classical natural join trên NULL. Owner-only được giữ bằng writer transaction/check giữa H/L/order; không được biến mất chỉ vì FD chuyển sang xuyên quan hệ. Đây là PROPOSED SCHEMA CHANGE — REQUIRES APPROVAL, chưa thêm bảng, không tự chứng nhận 3NF khi chưa audit toàn bộ FD của H/L.

Pricing: lựa chọn mutable rule hay version key, và thuật toán SUM hay priority là hai quyết định riêng. Assignment: định danh interval/duplicate/overlap phải tách nhau. Cinema: chỉ tách address→city nếu FD được chứng minh và determinant không key; nếu address là CK thì không có lỗi 3NF đó.

Impact chi tiết, lịch sử, chi phí và đủ schema/SP/function/trigger/view/API/FE/tests xem [docs/audit/BUSINESS_RULE_CLARIFICATION_REPORT.md:543](../../docs/audit/BUSINESS_RULE_CLARIFICATION_REPORT.md#L543). Recommendation không là approval, và approval semantics không tự là approval migration.

## 9. Final Verdict

```text
INCONCLUSIVE
```

Verdict này áp dụng cho **chuẩn hóa của mô hình nghiệp vụ được chủ dự án phê duyệt** theo tiêu chuẩn BRC. Năm bảng có kết luận 3NF 0 PASS / 0 FAIL / 5 UNKNOWN ở lớp đó; chưa có decision đủ để nâng PASS hoặc xác nhận FAIL của approved business model.

**Implementation verdict giữ nguyên:** source model của N-001 vẫn NOT_3NF nếu coi full amount/freeze của writer là bất biến định nghĩa tập trạng thái hợp lệ. Không có thay đổi schema/dữ liệu/code và không có phê duyệt hợp lệ khiến vi phạm tự biến mất. Audit gốc NOT_3NF được giữ nguyên, không overwritten.

Không dùng VERIFIED_3NF vì FD/CK semantic của năm bảng chưa chốt. Nếu D-01 A được approve và SoTien giữ nguyên, verdict approved-business sẽ NOT_3NF. Nếu D-02 B được approve thì vẫn phải triển khai được phép và reaudit; approval trên giấy không sửa bảng. Các FD/khu vực khác vẫn phải được chốt trước VERIFIED_3NF toàn hệ thống.

## 10. Required Next Actions

1. Owner trả lời D-01/D-02 (amount invariant và snapshot policy) trước; đây là điểm tác động trực tiếp N-001/lịch sử.
2. Chốt D-03 reporter/order/general complaint, không mở Use Case/RBAC mới trong scope.
3. Chốt D-04/D-05 pricing rule identity và cách cộng/chọn giá riêng; D-06 assignment intervals; D-07 address domain.
4. Ghi decision mới trong tài liệu riêng với nguồn/ngày/scope. Không sửa audit gốc để giấu verdict cũ; cập nhật reassessment khi có evidence hợp lệ.
5. Nếu owner chỉ approve semantics: rà lại FD/keys và kết luận, không tự triển khai schema. Nếu có schema change, chuẩn bị impact/preflight/history/rollback/test plan rồi xin approval cụ thể cuối cùng.

### Completion / preservation

- [x] Đọc audit gốc, schema cả năm bảng, constraints/indexes, canonical writer và wrappers.
- [x] Truy vết backend/API/frontend, function/trigger/view, seed/migration và regression source có liên quan.
- [x] Đối chiếu runtime bằng SELECT; không gọi SP ghi, không chạy test DML.
- [x] Phân biệt SOURCE_CONFIRMED/BUSINESS_APPROVED/INFERRED/CONFLICT/UNDEFINED; có decision matrix.
- [x] Candidate keys/prime/non-prime và FD/2NF/3NF được reassess đủ năm bảng với điều kiện approval.
- [x] Tạo hai báo cáo, giữ nguyên audit gốc và SQL/application files.
- [ ] Owner decisions D-01…D-07 — **PENDING_DECISION**, đây là đầu ra cần xác nhận, không là phần phân tích bị bỏ dở.

Database Changes: **NONE**. Application Code Changes: **NONE**. Original Audit Changes: **NONE**.
