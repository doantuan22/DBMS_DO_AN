IF CONVERT(int,SESSION_CONTEXT(N'CinemaSeedSkip')) = 0
BEGIN
 INSERT dbo.HINHANH_RAPCHIEUPHIM(RapID,URL,MoTa,LaAnhDaiDien,ThuTuHienThi,NgayTao)
 SELECT RapID,N'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba',N'Development cinema image',1,0,CONVERT(datetime2,SESSION_CONTEXT(N'CinemaSeedDay')) FROM dbo.RAPCHIEUPHIM;
END;
GO
