import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createEnvironment } from './test-environment.mjs';
const env = await createEnvironment({ browser: true, phase: '5B' });
const { api, pass, owned, navigate, resize, screenshot, field, click, evaluate, wait } = env;
const suffix = crypto.randomUUID().slice(0, 8), genreName = `UXR5_Genre_${suffix}`, actorName = `UXR5_Actor_${suffix}`, movieName = `UXR5_Movie_${suffix}`;
const modal = "document.querySelector('dialog[open]')";
let error;
try {
  for (const module of ['movies', 'actors', 'genres']) {
    await navigate(1, `/admin/catalog/${module}`);
    for (const width of [390, 768, 1280, 1440, 1920]) { pass(`${module}: responsive ${width}px`, await resize(width)); await screenshot(`5B-${module}-${width}`); }
    assert.ok(!await evaluate("document.querySelector('table').textContent.match(/PhimID|DienVienID|TheLoaiID|DanhSachDienVienJson/)"));
  }
  await navigate(1, '/admin/catalog/genres'); await click('Thêm thể loại'); await field('Tên thể loại', genreName, 'input', modal); await click('Tạo mới', true); await wait(`!document.querySelector('dialog[open]')&&document.body.textContent.includes('${genreName}')`);
  const genre = (await api(1, 'GET', '/genres')).genres.find((r) => r.TenTheLoai === genreName); assert.ok(genre); owned.push({ kind: 'genre', id: genre.TheLoaiID, owner: genreName });
  await navigate(1, '/admin/catalog/actors'); await click('Thêm diễn viên'); await field('Họ tên diễn viên', actorName, 'input', modal); await field('Ngày sinh', '1990-01-01', 'input', modal); await field('Quốc tịch', 'Việt Nam', 'input', modal); await click('Tạo mới'); await wait(`!document.querySelector('dialog[open]')&&document.body.textContent.includes('${actorName}')`);
  const actor = (await api(1, 'GET', '/actors')).actors.find((r) => r.HoTen === actorName); assert.ok(actor); owned.push({ kind: 'actor', id: actor.DienVienID, owner: actorName });
  pass('Genre/actor actual named create, strict metadata fields, single-submit');
  await navigate(1, '/admin/catalog/movies'); await click('Thêm phim'); await field('Tên phim', movieName, 'input', modal); await field('Thời lượng', '125', 'input', modal); await field('Thêm thể loại phim', genre.TheLoaiID, 'select', modal); assert.ok(await evaluate(`${modal}.textContent.includes('${genreName}')`)); await click('Tạo mới'); await wait("!document.querySelector('dialog[open]')");
  const getMovie = async () => (await api(1, 'GET', '/movies')).movies.find((r) => r.TenPhim === movieName);
  const movie = await getMovie(); assert.ok(movie); owned.push({ kind: 'movie', id: movie.PhimID, owner: movieName }); assert.equal(movie.TheLoaiIdList, String(genre.TheLoaiID));
  await field('Tìm tên phim', movieName); await click('Áp dụng lọc'); await wait("document.querySelectorAll('table tbody tr').length===1"); await click('Diễn viên'); await field('Thêm diễn viên', actor.DienVienID, 'select', modal); await field(`Vai diễn của ${actorName}`, 'Vai chính', 'input', modal); await click('Lưu thay đổi'); await click('Hủy'); assert.equal(JSON.parse((await getMovie()).DanhSachDienVienJson ?? '[]').length, 0); await click('Lưu thay đổi'); await click('Xác nhận', true); await wait("!document.querySelector('dialog[open]')");
  const castBefore = (await getMovie()).DanhSachDienVienJson; assert.deepEqual(JSON.parse(castBefore).map((r) => ({ actorId: r.actorId, role: r.role })), [{ actorId: actor.DienVienID, role: 'Vai chính' }]);
  pass('Movie named genre/cast picker, separate atomic cast endpoint, Cancel preserves DB');
  await click('Sửa'); await field('Đạo diễn', 'Đạo diễn UXR5', 'input', modal); await field('Thời lượng', '135', 'input', modal); await click('Lưu thay đổi'); await wait("!document.querySelector('dialog[open]')"); await env.reload(); const edited = await getMovie(); assert.equal(edited.DanhSachDienVienJson, castBefore); assert.equal(edited.TheLoaiIdList, movie.TheLoaiIdList); assert.equal(edited.ThoiLuong, 135); await field('Tìm tên phim', movieName); await click('Áp dụng lọc'); await click('Xem'); await wait(`document.querySelector('.admin-resource__panel')?.textContent.includes('${actorName}')`); pass('Actual metadata update and refresh preserve movie-cast and genre relations');
  for (const [module, name, id] of [['actors', actorName, actor.DienVienID], ['genres', genreName, genre.TheLoaiID]]) {
    await navigate(1, `/admin/catalog/${module}`); await field(`Tìm ${module === 'actors' ? 'diễn viên' : 'thể loại'}`, name); await click('Áp dụng lọc'); await wait("document.querySelectorAll('table tbody tr').length===1"); assert.ok(await evaluate("document.querySelector('table tbody').textContent.includes('1 phim')")); await click('Xóa'); await click('Hủy'); await click('Xóa'); await click('Xác nhận'); await wait("document.querySelector('.admin-resource__error')?.textContent.includes('Xung đột')"); assert.ok((await api(1, 'GET', `/${module}`))[module].some((r) => r[module === 'actors' ? 'DienVienID' : 'TheLoaiID'] === id));
  }
  pass('Linked actor/genre counts from complete authorized catalogue; destructive 409 retains relations');
  await api(1, 'DELETE', '/movies/1', null, 409); await api(2, 'GET', '/admin/movies', null, 403); pass('Historical movie deletion rejected; Manager cannot access Admin catalogue');
  await api(1, 'PUT', `/movies/${movie.PhimID}/actors`, { cast: [] }); await api(1, 'PUT', `/movies/${movie.PhimID}`, { title: movieName, durationMinutes: 135, releaseDate: edited.NgayKhoiChieu, ageRating: edited.DoTuoi, genreIds: [], status: edited.TrangThai });
  await navigate(1, '/admin/catalog/movies'); await field('Tìm tên phim', movieName); await click('Áp dụng lọc'); await click('Xóa'); await click('Xác nhận'); await wait("document.body.textContent.includes('Có 0 kết quả')"); assert.equal(await getMovie(), undefined); pass('Unreferenced fixture movie delete succeeds after explicit relation edits');
  assert.equal(env.evidence.runtimeErrors.length, 0);
} catch (failure) { error = failure; }
await env.close('5B-browser.json', error);
