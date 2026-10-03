SET SHOWPLAN_XML ON;
GO
EXEC dbo.sp_Order_GetDetailByCustomer @NguoiDungID=31,@DonDatVeID=41;
GO
SET SHOWPLAN_XML OFF;
GO
