import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { out,save } from './collect.mjs';
import { inspect } from './live-inspect.mjs';
import { fixtures } from './api.mjs';

const all=JSON.parse(fs.readFileSync(path.join(out,'live-objects.json'),'utf8'));
const checks=all.filter(o=>o.type.trim()==='C');
const violations=[];
for(const c of checks){const t=JSON.parse(fs.readFileSync(path.join(out,'live-checks.json'),'utf8')).find(x=>x.name===c.name);const rows=inspect(`constraint-${c.name}`,`SELECT COUNT(*) invalidRows FROM dbo.[${t.tableName}] WHERE NOT(${t.definition})`);if(rows[0]?.invalidRows)violations.push({constraint:c.name,...rows[0]});}
save('constraint-violations.json',violations);
inspect('unresolved-dependencies',`SELECT OBJECT_NAME(d.referencing_id) objectName,d.referenced_schema_name,d.referenced_entity_name FROM sys.sql_expression_dependencies d WHERE d.referenced_id IS NULL AND d.referenced_schema_name IS NOT NULL AND d.referenced_database_name IS NULL`);
inspect('adm17-live-absence',`SELECT name,type_desc FROM sys.objects WHERE name=N'CAUHINH_HE_THONG' OR name LIKE 'sp_Admin_Config[_]%'`);
inspect('fixture-final-tickets',`SELECT d.DonDatVeID,d.SuatChieuID,d.NguoiDungID,d.TrangThai,d.HanGiuCho,v.VeID,v.GheID,v.GiaVe,v.TrangThai ticketStatus FROM dbo.DONDATVE d JOIN dbo.CHITIETVE v ON v.DonDatVeID=d.DonDatVeID JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=d.NguoiDungID WHERE u.Email LIKE 'audit.${fixtures.runId}.%' ORDER BY d.DonDatVeID,v.VeID`);
inspect('fixture-final-payments',`SELECT t.ThanhToanID,t.DonDatVeID,t.SoTien,t.TrangThai,t.GhiChu,d.TrangThai orderStatus,d.LyDoHuy,d.ThongBaoHuy FROM dbo.THANHTOAN t JOIN dbo.DONDATVE d ON d.DonDatVeID=t.DonDatVeID JOIN dbo.NGUOIDUNG u ON u.NguoiDungID=d.NguoiDungID WHERE u.Email LIKE 'audit.${fixtures.runId}.%' ORDER BY t.ThanhToanID`);
inspect('fixture-final-promotions',`SELECT KhuyenMaiID,MaCode,SoLuong,SoLuongDaDung FROM dbo.KHUYENMAI WHERE MaCode LIKE '${fixtures.prefix.toUpperCase()}%'`);
inspect('fixture-final-complaints',`SELECT c.KhieuNaiID,c.TrangThai,x.XuLyID,x.NoiDungXuLy,x.TrangThaiSauXuLy,x.NgayXuLy FROM dbo.KHIEUNAI c LEFT JOIN dbo.XULY_KHIEUNAI x ON x.KhieuNaiID=c.KhieuNaiID WHERE c.TieuDe LIKE '${fixtures.prefix}%' ORDER BY c.KhieuNaiID,x.NgayXuLy,x.XuLyID`);
inspect('fixture-final-covers',`SELECT i.HinhAnhRapID,i.RapID,i.URL,i.TrangThai,i.LaAnhDaiDien,i.ThuTuHienThi FROM dbo.HINHANH_RAPCHIEUPHIM i JOIN dbo.RAPCHIEUPHIM r ON r.RapID=i.RapID WHERE r.TenRap LIKE '${fixtures.prefix}%'`);
inspect('fixture-active-seat-duplicates',`SELECT d.SuatChieuID,v.GheID,COUNT(*) tickets FROM dbo.CHITIETVE v JOIN dbo.DONDATVE d ON d.DonDatVeID=v.DonDatVeID WHERE v.TrangThai<>N'Đã hủy' AND dbo.fn_DonDangGiuGhe(d.TrangThai,d.HanGiuCho,SYSDATETIME())=1 GROUP BY d.SuatChieuID,v.GheID HAVING COUNT(*)>1`);
inspect('fixture-oversold-promotions',`SELECT KhuyenMaiID,MaCode,SoLuong,SoLuongDaDung FROM dbo.KHUYENMAI WHERE SoLuongDaDung>SoLuong`);
const health=spawnSync('sqlcmd',['-S','localhost','-d','CinemaBookingDB','-E','-C','-I','-b','-l','8','-t','60','-f','65001','-Q',"DBCC CHECKDB (N'CinemaBookingDB') WITH NO_INFOMSGS; DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;"],{encoding:'utf8',maxBuffer:16*1024*1024});
save('dbcc-health.txt',`exitCode=${health.status}\n${health.stdout}${health.stderr}`);console.log(`DBCC health exit ${health.status}`);
const plans=[
  ['movie-list','EXEC dbo.sp_Movie_List;'],['cinema-list','EXEC dbo.sp_Cinema_List;'],['cinema-gallery',`EXEC dbo.sp_Cinema_GetImages @RapID=${fixtures.cinemas[0].id};`],
  ['showtime-list',`EXEC dbo.sp_Showtime_ListByMovie @PhimID=${fixtures.movieId};`],['seat-map',`EXEC dbo.sp_Seat_ListByShowtime @SuatChieuID=${fixtures.browserShowtimeId};`],
  ['order-history',`EXEC dbo.sp_Order_ListByCustomer @NguoiDungID=${fixtures.users.find(u=>u.kind==='customerA').id};`],
  ['order-detail',`EXEC dbo.sp_Order_GetDetailByCustomer @NguoiDungID=${fixtures.users.find(u=>u.kind==='extra').id},@DonDatVeID=${fixtures.browserOrderId};`],
  ['complaint-queue',`EXEC dbo.sp_Support_Complaint_List @NguoiDungID=${fixtures.users.find(u=>u.kind==='support').id};`],
  ['manager-revenue',`EXEC dbo.sp_Manager_Revenue @NguoiDungID=${fixtures.users.find(u=>u.kind==='managerA').id},@RapID=${fixtures.cinemas[0].id};`],
  ['admin-revenue','EXEC dbo.sp_Admin_Report_Revenue;'],['manager-dashboard',`EXEC dbo.sp_Manager_Dashboard @NguoiDungID=${fixtures.users.find(u=>u.kind==='managerA').id},@RapID=${fixtures.cinemas[0].id};`],
];
const summary=[];
for(const [name,exec] of plans){const file=path.join(out,`plan-${name}.sql`);fs.writeFileSync(file,`SET SHOWPLAN_XML ON;\nGO\n${exec}\nGO\nSET SHOWPLAN_XML OFF;\nGO\n`);
  const r=spawnSync('sqlcmd',['-S','localhost','-d','CinemaBookingDB','-E','-C','-I','-b','-l','8','-t','30','-f','65001','-y','0','-w','65535','-i',file],{encoding:'utf8',maxBuffer:32*1024*1024});
  save(`plan-${name}.xml.txt`,r.stdout+r.stderr);summary.push({name,exit:r.status,scanOperators:(r.stdout.match(/PhysicalOp="(?:Clustered Index Scan|Index Scan|Table Scan)"/g)??[]).length,seekOperators:(r.stdout.match(/PhysicalOp="(?:Clustered Index Seek|Index Seek)"/g)??[]).length,planAffectingConversions:(r.stdout.match(/<PlanAffectingConvert/g)??[]).length,missingIndexGroups:(r.stdout.match(/<MissingIndexGroup/g)??[]).length});
}
save('query-plan-summary.json',summary);console.log(JSON.stringify(summary));
