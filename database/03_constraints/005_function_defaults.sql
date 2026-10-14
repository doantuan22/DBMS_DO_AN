-- Khai báo ràng buộc toàn vẹn dữ liệu.
ALTER TABLE dbo.[DANHGIAPHIM]
ADD CONSTRAINT [DF_DANHGIAPHIM_NgayDanhGia_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [NgayDanhGia];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[DONDATVE]
ADD CONSTRAINT [DF_DONDATVE_NgayDat_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [NgayDat];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[HINHANH_RAPCHIEUPHIM]
ADD CONSTRAINT [DF_HINHANH_RAPCHIEUPHIM_NgayTao_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [NgayTao];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[KHIEUNAI]
ADD CONSTRAINT [DF_KHIEUNAI_NgayTao_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [NgayTao];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[NGUOIDUNG]
ADD CONSTRAINT [DF_NGUOIDUNG_NgayTao_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [NgayTao];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[THANHTOAN]
ADD CONSTRAINT [DF_THANHTOAN_NgayTao_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [NgayTao];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[VAITRO_QUYEN]
ADD CONSTRAINT [DF_VAITRO_QUYEN_NgayGan_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [NgayGan];

GO

-- Gán giá trị mặc định khi tạo bản ghi.
ALTER TABLE dbo.[XULY_KHIEUNAI]
ADD CONSTRAINT [DF_XULY_KHIEUNAI_NgayXuLy_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [NgayXuLy];

GO

-- Gán giá trị mặc định thời gian cho tin nhắn khiếu nại.
ALTER TABLE dbo.[TINNHAN_KHIEUNAI]
ADD CONSTRAINT [DF_TINNHAN_KHIEUNAI_ThoiGianGui_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [ThoiGianGui];

GO

-- Gán giá trị mặc định thời gian cho yêu cầu chuyển cấp.
ALTER TABLE dbo.[YEUCAU_CHUYENCAP]
ADD CONSTRAINT [DF_YEUCAU_CHUYENCAP_ThoiGianGui_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [ThoiGianGui];

GO

-- Gán giá trị mặc định thời gian cho lịch sử phân công.
ALTER TABLE dbo.[LICHSU_PHANCONG_KHIEUNAI]
ADD CONSTRAINT [DF_LICHSU_PHANCONG_ThoiGian_ClockVN] DEFAULT([dbo].[fn_BayGio]()) FOR [ThoiGian];

GO
