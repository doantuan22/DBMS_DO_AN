import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { read, dbRoot, expandSql } from './lib.mjs';

const entry = () => read(path.join(dbRoot, 'run-all.sql'));

test('run-all remains a small dispatcher with dependency-ordered includes', () => {
  const source = entry();
  assert.ok(source.length < 10000);
  const includes = [...source.matchAll(/^:r\s+\.\/(.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(includes, [
    'build-objects.sql', '10_seed/seed-all.sql',
    '12_verify/verify_database.sql', '10_seed/verify/seed-v2.sql',
  ]);
  assert.ok(!/CREATE OR ALTER (?:PROCEDURE|FUNCTION|VIEW|TRIGGER)/i.test(source));
  assert.ok(!/11_tests|13_migrations|001_drop_database\.sql/.test(source));
});

test('SQLCMD stops on errors and refuses an existing database before the build', () => {
  const source = entry();
  assert.match(source, /^:on error exit$/m);
  assert.match(source, /^:setvar SeedProfile "demo-dynamic"$/m);
  assert.ok(source.indexOf('THROW 51601') < source.indexOf(':r ./build-objects.sql'));
  assert.ok(!/DROP DATABASE|TRUNCATE TABLE/i.test(source));
});

test('creation receipt is captured after build, before seed, then cleared at the end', () => {
  const source = entry();
  const capture = source.indexOf('@value = @NewGuid');
  assert.ok(capture > source.indexOf(':r ./build-objects.sql'));
  assert.ok(capture < source.indexOf(':r ./10_seed/seed-all.sql'));
  assert.ok(source.lastIndexOf("@key = N'RunAllNewDatabaseGuid', @value = NULL") > source.indexOf(':r ./10_seed/verify/seed-v2.sql'));
});

test('seed and lifecycle require both GUID and creation date for the installation exception', () => {
  for (const file of ['10_seed/seed-all.sql', '10_seed/test_fixture/lifecycle-v2.sql']) {
    const source = read(path.join(dbRoot, file));
    assert.match(source, /AND @InitialInstall = 0/);
    assert.match(source, /TRY_CONVERT\(uniqueidentifier, SESSION_CONTEXT\(N'RunAllNewDatabaseGuid'\)\)/);
    assert.match(source, /TRY_CONVERT\(datetime, SESSION_CONTEXT\(N'RunAllCreateDate'\)\)/);
  }
  assert.match(read(path.join(dbRoot, '10_seed/seed-all.sql')), /@InitialInstall = 1 AND EXISTS/);
});

test('all includes expand and the seed profile can be resolved without changing source modules', () => {
  const expanded = expandSql('run-all.sql');
  assert.ok(!/^:r\s/m.test(expanded));
  assert.ok(expanded.includes('CREATE OR ALTER PROCEDURE dbo.sp_Booking_Create'));
  assert.ok(expanded.includes("PRINT 'PASS seed v2 integrity and snapshots'"));
});
