# Phase 8 API: CSKH Portal

All endpoints require authenticated role `CSKH`; queue/detail/reference additionally require `QL_KHIEUNAI`, while writes require `XULY_KHIEUNAI`. Client input never supplies `NguoiXuLyID`.

| Endpoint | Contract |
| --- | --- |
| `GET /api/support/complaints?status&type&search` | SQL-filtered support queue via `sp_Support_Complaint_List`. |
| `GET /api/support/complaints/:complaintId` | Complaint plus append-only processing timeline. |
| `GET /api/support/complaints/:complaintId/order-reference` | Only obtains an order through that complaint reference; no generic staff order lookup exists. Null reference returns `{ order: null, message }`. |
| `POST /api/support/complaints/:complaintId/processings` | `{ content, nextStatus }`; authenticated support identity becomes processor. |
| `PUT /api/support/complaints/:complaintId/status` | `{ status }`; DBR-03 records an automatic processing-history entry atomically. |

SQL values: complaint status is `Mới`, `Đang xử lý`, `Đã giải quyết`, `Đã đóng`, or `Từ chối`. Priority remains database-defined (`Thấp`, `Trung bình`, `Cao`, `Khẩn cấp`).

## DBR-03

Before, `sp_Support_Complaint_UpdateStatus` updated the complaint directly, without support permission validation or processing history. `database/migrations/005_support_status_history_atomicity.sql` changes it to insert one `XULY_KHIEUNAI` row in a transaction. Existing triggers validate handler role and synchronize current complaint status; failure rolls back both operations.

`database/migrations/006_support_procedure_authorization.sql` must be applied after 005. It adds database-level permission and not-found guards to the detail, complaint-linked order-reference, and add-processing procedures. The REST role/permission middleware remains a second boundary; there is still no generic support order endpoint.

`Mới` is only an initial complaint state. The `XULY_KHIEUNAI` database constraint allows only `Đang xử lý`, `Đã giải quyết`, `Đã đóng`, and `Từ chối`; both write forms and API validation follow that contract.
