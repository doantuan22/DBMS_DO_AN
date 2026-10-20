// Retired legacy utility. It created a separate CinemaBookingDB_DryRun database,
// which is outside the single-main / temporary-Test database policy.
console.error('Dry-run bootstrap is retired. Use only CinemaBookingDB and the approved temporary CinemaBookingDB_Test target.');
process.exitCode = 1;
