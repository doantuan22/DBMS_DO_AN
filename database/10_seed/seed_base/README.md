# Seed base v2

Chạy qua [pipeline canonical](../README.md). Fixed RBAC 001–003 giữ nguyên; modules 020 users → 030 cinemas/rooms/seats → 040 films/relations → 050 commerce. FK nghiệp vụ resolve bằng natural keys; không đoán identity. 9 poster verified, 9 NULL có blocker rõ. Compile từ reviewed manifests bằng `database/10_seed/compile-real-seed.mjs`, không dùng legacy extraction.
