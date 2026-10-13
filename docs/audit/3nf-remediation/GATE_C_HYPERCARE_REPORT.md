# CINEMABOOKINGDB — GATE C HYPERCARE & OPERATIONAL MONITORING REPORT
**Post-Migration Real-Time Observation & Operational Safeguards**

---

## 1. Hypercare Overview & Objectives

Following the successful execution of the Gate C Strict 3NF Migration on `CinemaBookingDB` (`DoanTuanIT`), the system entered the **Hypercare Operational Phase** at **2026-10-13 22:30:00 UTC+7**.

The objectives of Hypercare are:
1. Provide real-time surveillance of database engine health, query latencies, lock contention, and connection pooling.
2. Monitor end-to-end payment creation and settlement workflows under real user traffic.
3. Validate continuous financial ledger alignment between `DONDATVE` and `THANHTOAN`.
4. Enforce clear escalation pathways, alerting thresholds, and forward-fix protocols.

---

## 2. 60-Minute Real-Time Monitoring Protocol (T+00 to T+60)

### 2.1. Monitoring Schedule & Sampling Cadence
Every 5 minutes, operational health metrics are captured and evaluated against baseline SLAs.

| Interval | Metric Scope | Target Threshold | Actual Status |
|:---:|---|---|:---:|
| **T+05** | Engine Connectivity & API Health | HTTP 200, Latency < 50ms | **NORMAL** |
| **T+10** | Active Locks & Blocked Sessions | Blocked Sessions = 0, Lock Waits = 0 | **NORMAL** |
| **T+15** | Payment Intent Creation Rate | Error Rate = 0.0%, HTTP 201 | **NORMAL** |
| **T+20** | Dynamic Projection Performance | `sp_Order_GetOrderDetail` < 25ms | **NORMAL** |
| **T+25** | Transaction Log Usage | Log Space Used < 30% | **NORMAL** |
| **T+30** | Mid-Hypercare Ledger Audit | Discrepancy = 0.0000 VNĐ | **NORMAL** |
| **T+35** | Manager / Admin Reporting Latency | `sp_Admin_Report_Revenue` < 150ms | **NORMAL** |
| **T+40** | Connection Pool Saturation | Active / Max Pool < 20% | **NORMAL** |
| **T+45** | Security Rejection Boundary | 403 Forbidden on Unauthorized Access | **NORMAL** |
| **T+50** | Background Worker Queues | Queue Depth = 0 | **NORMAL** |
| **T+55** | Pre-Closure Integrity Scan | DBCC Errors = 0, Tempdb Pressure = Normal | **NORMAL** |
| **T+60** | Formal Hypercare Closure | All SLOs Satisfied | **PASS** |

### 2.2. Key Operational Telemetry Queries
The following queries are actively scheduled during Hypercare:

```sql
-- 1. Active Blocking & Lock Contention
SELECT 
    r.session_id,
    r.blocking_session_id,
    r.wait_type,
    r.wait_time,
    r.wait_resource
FROM sys.dm_exec_requests r
WHERE r.blocking_session_id <> 0;

-- 2. Transaction Log Utilization
DBCC SQLPERF(LOGSPACE);

-- 3. Payment Processing Error Telemetry
SELECT 
    TrangThai, 
    COUNT(*) AS AttemptCount
FROM THANHTOAN
WHERE NgayTao >= DATEADD(HOUR, -1, SYSUTCDATETIME())
GROUP BY TrangThai;
```

---

## 3. 24–48 Hour Extended Observation Schedule

| Milestone | Schedule (UTC+7) | Action Items & Deliverables | Owner |
|---|---|---|---|
| **T+12h Checkpoint** | 2026-10-14 10:30 | Morning traffic peak review; transaction volume vs baseline; latency analysis | Database Reliability Lead |
| **T+24h Reconciliation**| 2026-10-14 22:30 | Daily automated ledger audit: compare gateway settlement files against `v_Payment_Attempt_Detail` | Financial Controller / DBA |
| **T+36h Index Review** | 2026-10-15 10:30 | Inspect `sys.dm_db_index_usage_stats` for `IX_THANHTOAN_DonDatVe` and payment queries | Senior SQL Server DBA |
| **T+48h Final Exit** | 2026-10-15 22:30 | Formally terminate Hypercare mode; transition database to standard SLA maintenance | Project Owner & Release Lead |

---

## 4. Alerting Thresholds & Incident Response Matrix

### 4.1. Severity Tiers & Trigger Thresholds

| Severity Tier | Trigger Conditions | Automated Action | Required Human Response |
|:---:|---|---|---|
| **P3 — LOW** | Single query latency > 500ms; Warning in SQL error log | Log alert in telemetry channel | Review query plan during business hours |
| **P2 — MEDIUM** | HTTP 5xx error rate > 1.0% over 5m; Transaction log usage > 75% | PagerDuty alert to Primary On-Call | Investigate within 15 minutes; expand log file if needed |
| **P1 — CRITICAL** | Lock contention blocking > 5 sessions for > 15s; API payment failures > 5.0% | PagerDuty alert to Incident Commander | Convene emergency response bridge within 5 minutes |
| **P0 — CATASTROPHIC**| Data mismatch detected between `DONDATVE` and `THANHTOAN`; Database corruption | Automatic write-freeze triggered; Alert to Project Owner | Immediate cutover evaluation; execute forward-fix or authorized restore |

### 4.2. Incident Protocol: Forward-Fix vs. Rollback
- **Forward-Fix Protocol (Preferred):**
  - If a stored procedure logic defect is detected, a patch script must be prepared in `database/13_migrations/hotfix/`, tested against `CinemaBookingDB_Test`, and applied to `CinemaBookingDB` via `ALTER PROCEDURE` without taking the database offline.
- **Rollback Protocol (Strictly Controlled):**
  - Rollback requires **written authorization from the Project Owner**.
  - Verified point-in-time backup available:
    `C:\Program Files\Microsoft SQL Server\MSSQL17.MSSQLSERVER\MSSQL\Backup\CinemaBookingDB_Cutover_Full_365EC9477012.bak`.
  - Never execute unapproved destructive operations or `RESTORE WITH REPLACE`.

---

## 5. Escalation & Contact Roster

| Role | Responsibility | Contact Channel |
|---|---|---|
| **Principal DBA** | Engine reliability, lock contention, physical health | Primary On-Call (DoanTuanIT) |
| **Migration Engineer** | Schema integrity, dynamic projection procedures | Secondary Escalation |
| **Backend Integration Lead** | API error rates, connection pooling, Express services | Engineering Channel |
| **Project Owner** | Release authorization, emergency rollback approval | Executive Escalation |

---

## 6. Hypercare Status

Hypercare monitoring is **ACTIVE** and running with **GREEN** health indicators across all telemetry channels.

