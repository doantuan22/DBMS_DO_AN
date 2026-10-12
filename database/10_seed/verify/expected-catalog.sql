DECLARE @ExpectedMovies TABLE(TenPhim nvarchar(255),ThoiLuong int,PosterURL nvarchar(500),TrangThai nvarchar(50));
INSERT @ExpectedMovies VALUES (N'Sintel',15,N'https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg',N'Đang chiếu'),
(N'Big Buck Bunny',11,N'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/960px-Big_buck_bunny_poster_big.jpg',N'Đang chiếu'),
(N'Tears of Steel',13,N'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Tos-poster.png/960px-Tos-poster.png',N'Đang chiếu'),
(N'Elephants Dream',11,N'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/ElephantsDreamPoster.jpg/960px-ElephantsDreamPoster.jpg',N'Đang chiếu'),
(N'Cosmos Laundromat: First Cycle',13,N'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/CosmosLaundromatPoster.jpg/960px-CosmosLaundromatPoster.jpg',N'Đang chiếu'),
(N'Spring',8,N'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Spring2019PillarPosterBlender.jpg/960px-Spring2019PillarPosterBlender.jpg',N'Đang chiếu'),
(N'Sprite Fright',11,N'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Sprite_Fright-movie_poster.jpg/960px-Sprite_Fright-movie_poster.jpg',N'Đang chiếu'),
(N'Charge',5,N'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Charge-movie_poster.jpg/960px-Charge-movie_poster.jpg',N'Đang chiếu'),
(N'Coffee Run',4,N'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Coffee_Run-movie_poster.png/960px-Coffee_Run-movie_poster.png',N'Đang chiếu'),
(N'Dune: Hành Tinh Cát - Phần Hai',167,NULL,N'Đang chiếu'),
(N'Mai',131,NULL,N'Đang chiếu'),
(N'Oppenheimer',181,NULL,N'Đang chiếu'),
(N'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô',111,NULL,N'Sắp chiếu'),
(N'Inside Out 2',96,NULL,N'Sắp chiếu'),
(N'Soul',100,NULL,N'Sắp chiếu'),
(N'Moana',107,NULL,N'Sắp chiếu'),
(N'Elemental',103,NULL,N'Sắp chiếu'),
(N'Coco',106,NULL,N'Sắp chiếu');
DECLARE @ExpectedCinemas TABLE(TenRap nvarchar(150),URL nvarchar(500));
INSERT @ExpectedCinemas VALUES (N'CinemaStar Demo Hà Nội A',N'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/60/Auditorium_of_the_Former_Ace_Cinema%2C_Rayners_Lane_%2801%29.jpg/960px-Auditorium_of_the_Former_Ace_Cinema%2C_Rayners_Lane_%2801%29.jpg'),
(N'CinemaStar Demo Hà Nội B',N'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Europa_Cinema_Auditorium%2C_February_2025.jpg/960px-Europa_Cinema_Auditorium%2C_February_2025.jpg'),
(N'CinemaStar Demo TP.HCM A',N'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/RZ_Metro_Movie_Theater_interior_2023-03_%283%29.jpg/960px-RZ_Metro_Movie_Theater_interior_2023-03_%283%29.jpg'),
(N'CinemaStar Demo TP.HCM B',N'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/RZ_Metro_Movie_Theater_interior_2023-03_%281%29.jpg/960px-RZ_Metro_Movie_Theater_interior_2023-03_%281%29.jpg');
