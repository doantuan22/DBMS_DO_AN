SET SHOWPLAN_XML ON;
GO
EXEC dbo.sp_Support_Complaint_List @NguoiDungID=30;
GO
SET SHOWPLAN_XML OFF;
GO
