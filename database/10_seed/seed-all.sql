-- Retired legacy entry point. It formerly loaded demo-dynamic and volume data.
-- Historical seed fragments remain in seed_base/, seed_demo_dynamic/, and
-- seed_extended/ for Git history; this entry point cannot execute them.
:on error exit
;THROW 51100, N'Legacy demo seed is retired. Use the approved production seed entry point.', 1;
GO
