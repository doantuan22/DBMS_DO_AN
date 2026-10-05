# Harness development history

The archived failure used a non-existent TongTienThanhToan column in the test harness. The existing payment contract uses THANHTOAN.SoTien; the harness was corrected without changing application/SQL/policy. Earlier harness assumptions about admin response envelopes/status, retry idempotency, promotion fallback and browser selectors were aligned with existing contracts. This file is not final gate evidence. The final complete clean replay is ../final-replay.json (PASS).
