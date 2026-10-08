import assert from 'node:assert/strict';
import {sql,disposable} from './common.mjs';
export const roles=['KHACH_HANG','QUAN_LY_RAP','CSKH','ADMIN','R46_CUSTOM'];
export async function createFixtures(pool){
 disposable();
 const collision=(await pool.request().query("SELECT COUNT(*) n FROM dbo.NGUOIDUNG WHERE Email LIKE 'r46-%@example.test';SELECT COUNT(*) n FROM dbo.VAITRO WHERE MaVaiTro='R46_CUSTOM'")).recordsets;
 assert.equal(collision[0][0].n,0);assert.equal(collision[1][0].n,0);
 const ids=[];let roleId;
 try{
  roleId=(await pool.request().query("INSERT dbo.VAITRO(MaVaiTro,TenVaiTro,MoTa) VALUES('R46_CUSTOM',N'R46 fixture role',N'Fixture');SELECT CONVERT(INT,SCOPE_IDENTITY()) id")).recordset[0].id;
  for(const [index,role] of roles.entries()){
   const result=await pool.request().input('Role',sql.VarChar(50),role).input('Name',sql.NVarChar(100),'R46 original '+role).input('Email',sql.VarChar(150),`r46-${index}@example.test`).query("INSERT dbo.NGUOIDUNG(VaiTroID,HoTen,Email,MatKhau,SoDienThoai,NgayTao,TrangThai) SELECT v.VaiTroID,@Name,@Email,seed.MatKhau,NULL,dbo.fn_BayGio(),N'Hoạt động' FROM dbo.VAITRO v CROSS JOIN (SELECT MatKhau FROM dbo.NGUOIDUNG WHERE Email='khachhang1@gmail.com') seed WHERE v.MaVaiTro=@Role;SELECT CONVERT(INT,SCOPE_IDENTITY()) id");
   assert.ok(result.recordset[0].id);ids.push({id:result.recordset[0].id,role,email:`r46-${index}@example.test`});
  }
  const f={users:ids,roleId};await reset(pool,f.users[0],true);return f;
 }catch(error){await cleanup(pool,{users:ids,roleId});throw error;}
}
export async function reset(pool,user,hasProfile=false){
 await pool.request().input('ID',sql.Int,user.id).input('Role',sql.VarChar(50),user.role).input('Name',sql.NVarChar(100),'R46 original '+user.role).query("UPDATE dbo.NGUOIDUNG SET VaiTroID=(SELECT VaiTroID FROM dbo.VAITRO WHERE MaVaiTro=@Role),HoTen=@Name,SoDienThoai=NULL,TrangThai=N'Hoạt động' WHERE NguoiDungID=@ID;DELETE dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID;");
 if(hasProfile)await pool.request().input('ID',sql.Int,user.id).query("INSERT dbo.HOSOKHACHHANG(NguoiDungID,NgaySinh,GioiTinh,DiemTichLuy) VALUES(@ID,'1990-02-01',N'Nam',23)");
}
export async function state(pool,user){
 const result=await pool.request().input('ID',sql.Int,user.id).query(`SELECT NguoiDungID,VaiTroID,HoTen,Email,SoDienThoai,NgayTao,TrangThai,CONVERT(VARCHAR(64),HASHBYTES('SHA2_256',MatKhau),2) PasswordFingerprint FROM dbo.NGUOIDUNG WHERE NguoiDungID=@ID;SELECT * FROM dbo.HOSOKHACHHANG WHERE NguoiDungID=@ID`);
 return {user:result.recordsets[0][0],profiles:result.recordsets[1]};
}
export async function update(pool,user,patch={}){
 return pool.request().input('NguoiDungID',sql.Int,user.id).input('HoTen',sql.NVarChar(100),Object.hasOwn(patch,'HoTen')?patch.HoTen:'R46 changed').input('SoDienThoai',sql.VarChar(20),patch.SoDienThoai??null).input('NgaySinh',sql.Date,patch.NgaySinh??null).input('GioiTinh',sql.NVarChar(10),patch.GioiTinh??null).execute('dbo.sp_User_UpdateProfile');
}
export async function cleanup(pool,f){
 for(const user of f.users??[])await pool.request().input('ID',sql.Int,user.id).input('Email',sql.VarChar(150),user.email).query('DELETE h FROM dbo.HOSOKHACHHANG h JOIN dbo.NGUOIDUNG n ON n.NguoiDungID=h.NguoiDungID WHERE n.NguoiDungID=@ID AND n.Email=@Email;DELETE dbo.NGUOIDUNG WHERE NguoiDungID=@ID AND Email=@Email');
 if(f.roleId)await pool.request().input('ID',sql.Int,f.roleId).query("DELETE dbo.VAITRO WHERE VaiTroID=@ID AND MaVaiTro='R46_CUSTOM'");
}
