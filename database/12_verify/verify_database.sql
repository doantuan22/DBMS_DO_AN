:on error exit
USE CinemaBookingDB;
GO
:r ./12_verify/verify_objects.sql
:r ./12_verify/verify_schema.sql
:r ./12_verify/verify_constraints.sql
:r ./12_verify/verify_triggers.sql
:r ./12_verify/verify_orphans.sql
:r ./12_verify/verify_procedures.sql
:r ./12_verify/verify_dependencies.sql
:r ./12_verify/verify_security.sql
:r ./12_verify/verify_seed.sql
