import assert from 'node:assert/strict';
import { sql } from './common.mjs';
export { cleanSession } from '../r21/fixtures.mjs';
export async function createFixture(pool) {
 const rs=(await pool.request().query(`
 DECLARE @Movies TABLE(ID INT); DECLARE @Actors TABLE(ID INT);
 INSERT dbo.PHIM(TenPhim,ThoiLuong,NgayKhoiChieu,TrangThai) OUTPUT inserted.PhimID INTO @Movies
 VALUES(N'R31 target '+CONVERT(NVARCHAR(36),NEWID()),90,'20200101',N'Đang chiếu'),(N'R31 other '+CONVERT(NVARCHAR(36),NEWID()),90,'20200101',N'Đang chiếu');
 INSERT dbo.DIENVIEN(HoTen) OUTPUT inserted.DienVienID INTO @Actors VALUES(N'R31 actor1'),(N'R31 actor2'),(N'R31 actor3'),(N'R31 actor4'),(N'R31 actor5'),(N'R31 actor6'),(N'R31 actor7');
 SELECT ID FROM @Movies ORDER BY ID;SELECT ID FROM @Actors ORDER BY ID;
 SELECT NguoiDungID,Email,VaiTroID FROM dbo.NGUOIDUNG WHERE Email IN('admin@cinemadb.vn','khachhang1@gmail.com');`)).recordsets;
 const f={movie:rs[0][0].ID,other:rs[0][1].ID,actors:rs[1].map(r=>r.ID),admin:rs[2].find(r=>r.Email.startsWith('admin@')).NguoiDungID,customer:rs[2].find(r=>r.Email.startsWith('khachhang')).NguoiDungID};
 await pool.request().query(`INSERT dbo.PHIM_DIENVIEN(PhimID,DienVienID,VaiDien) VALUES(${f.movie},${f.actors[0]},N'old1'),(${f.movie},${f.actors[1]},N'old2'),(${f.movie},${f.actors[2]},N'old3'),(${f.other},${f.actors[0]},N'other');
 INSERT dbo.PHIM_THELOAI(PhimID,TheLoaiID) SELECT ${f.movie},MIN(TheLoaiID) FROM dbo.THELOAI;`);
 return f;
}
export async function cleanupFixture(pool,f) {
 if(!f)return;
 await pool.request().query(`DELETE dbo.PHIM WHERE PhimID IN(${f.movie},${f.other});DELETE dbo.DIENVIEN WHERE DienVienID IN(${f.actors.join(',')});`);
}
export async function state(pool,f) {
 const rs=(await pool.request().query(`SELECT * FROM dbo.PHIM_DIENVIEN WHERE PhimID IN(${f.movie},${f.other}) ORDER BY PhimID,DienVienID;
 SELECT * FROM dbo.PHIM WHERE PhimID IN(${f.movie},${f.other}) ORDER BY PhimID;
 SELECT * FROM dbo.DIENVIEN WHERE DienVienID IN(${f.actors.join(',')}) ORDER BY DienVienID;
 SELECT * FROM dbo.PHIM_THELOAI WHERE PhimID IN(${f.movie},${f.other}) ORDER BY PhimID,TheLoaiID;`)).recordsets;
 return Object.fromEntries(['cast','movies','actors','genres'].map((k,i)=>[k,rs[i]]));
}
export const list=(f,ids=[3,4],role='new')=>ids.map(i=>({DienVienID:f.actors[i],VaiDien:role+i}));
export const cast=(f,input)=>input.map(r=>({PhimID:f.movie,DienVienID:r.DienVienID,VaiDien:r.VaiDien??null})).sort((a,b)=>a.DienVienID-b.DienVienID);
export const setRequest=(pool,f,json,movie=f.movie,admin=f.admin)=>pool.request().input('ActorID',sql.Int,admin).input('PhimID',sql.Int,movie).input('DanhSachJson',sql.NVarChar(sql.MAX),json);
export const set=(pool,f,input,movie=f.movie,admin=f.admin)=>setRequest(pool,f,JSON.stringify(input),movie,admin).execute('dbo.sp_Admin_MovieActor_Set');
export const deleteActor=(pool,f,id)=>pool.request().input('ActorID',sql.Int,f.admin).input('DienVienID',sql.Int,id).execute('dbo.sp_Admin_Actor_Delete');
export async function assertPersisted(pool,f,input,initial) {
 const current=await state(pool,f);assert.deepEqual(current.cast.filter(r=>r.PhimID===f.movie),cast(f,input));
 assert.deepEqual(current.cast.filter(r=>r.PhimID===f.other),initial.cast.filter(r=>r.PhimID===f.other));
 for(const key of ['movies','actors','genres'])assert.deepEqual(current[key],initial[key],key);
 const read=await pool.request().input('PhimID',sql.Int,f.movie).execute('dbo.sp_Movie_GetDetail');
 assert.deepEqual(read.recordsets[2].map(r=>({PhimID:f.movie,DienVienID:r.DienVienID,VaiDien:r.VaiDien})).sort((a,b)=>a.DienVienID-b.DienVienID),cast(f,input));
 return current;
}
