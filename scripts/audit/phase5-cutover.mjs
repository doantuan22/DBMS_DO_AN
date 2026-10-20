// Retired legacy cutover utility. Its former workflow could drop/recreate Main,
// create a separate test database, and provision SQL credentials from source.
// Main cleanup requires an approved, count-checked transaction and never drops Main.
console.error('Legacy cutover is retired. Follow the approved cleanup and production-seed workflow.');
process.exitCode = 1;
