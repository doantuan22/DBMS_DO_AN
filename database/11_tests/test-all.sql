:on error exit
USE CinemaBookingDB;
GO
:r ./11_tests/procedures/smoke.sql
:r ./11_tests/timezone/contract.sql
:r ./11_tests/triggers/multirow.sql
:r ./11_tests/integrity/constraints.sql
:r ./11_tests/permissions/execute_only.sql
