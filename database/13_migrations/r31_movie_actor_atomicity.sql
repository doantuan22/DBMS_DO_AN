:on error exit
-- Existing modules only; transaction supplied by scripts/r31/deploy.mjs.
USE CinemaBookingDB;
GO
:r ./08_procedures/admin/sp_Admin_MovieActor_Set.sql
:r ./08_procedures/admin/sp_Admin_Actor_Delete.sql
