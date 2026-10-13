:on error exit
-- Historical R3.1 deployment used a phase runner that has since been retired.
USE CinemaBookingDB;
GO
:r ./08_procedures/admin/sp_Admin_MovieActor_Set.sql
:r ./08_procedures/admin/sp_Admin_Actor_Delete.sql
