-- Tạo phim demo cùng thể loại, diễn viên và nguồn ảnh đã kiểm tra.
IF @BaseNew = 1
BEGIN
    INSERT
        dbo.THELOAI(TenTheLoai)
    VALUES
        (N'Hoạt hình'),
        (N'Giả tưởng'),
        (N'Hài'),
        (N'Khoa học viễn tưởng'),
        (N'Hành động'),
        (N'Kinh dị'),
        (N'Tình cảm'),
        (N'Phiêu lưu'),
        (N'Tâm lý'),
        (N'Lịch sử'),
        (N'Trinh thám'),
        (N'Gia đình');
    INSERT
        dbo.DIENVIEN(HoTen, NgaySinh, QuocTich)
    VALUES
        (N'Halina Reijn', NULL, NULL),
        (N'Thom Hoffman', NULL, NULL),
        (N'Derek de Lint', NULL, NULL),
        (N'Sergio Hasselbaink', NULL, NULL),
        (N'Cas Jansen', NULL, NULL),
        (N'Tygo Gernandt', NULL, NULL),
        (N'Timothée Chalamet', NULL, NULL),
        (N'Zendaya', NULL, NULL),
        (N'Phương Anh Đào', NULL, NULL),
        (N'Tuấn Trần', NULL, NULL),
        (N'Cillian Murphy', NULL, NULL),
        (N'Emily Blunt', NULL, NULL),
        (N'Amy Poehler', NULL, NULL),
        (N'Maya Hawke', NULL, NULL),
        (N'Jamie Foxx', NULL, NULL),
        (N'Tina Fey', NULL, NULL),
        (N'Auliʻi Cravalho', NULL, NULL),
        (N'Dwayne Johnson', NULL, NULL),
        (N'Leah Lewis', NULL, NULL),
        (N'Mamoudou Athie', NULL, NULL),
        (N'Anthony Gonzalez', NULL, NULL),
        (N'Gael García Bernal', NULL, NULL);
    INSERT
        dbo.PHIM(
            TenPhim,
            ThoiLuong,
            NgayKhoiChieu,
            NgayKetThuc,
            NgonNgu,
            PhuDe,
            DoTuoi,
            DaoDien,
            MoTa,
            PosterURL,
            TrailerURL,
            TrangThai
        )
    VALUES
        (
            N'Sintel',
            15,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Colin Levy',
            N'Cô gái Sintel tìm kiếm chú rồng Scales trên một hành trình đầy mất mát. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2010.] Poster: (c) copyright Blender Foundation | durian.blender.org; CC BY 3.0; https://creativecommons.org/licenses/by/3.0',
            N'https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg',
            NULL,
            N'Đang chiếu'
        ),
        (
            N'Big Buck Bunny',
            11,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            NULL,
            NULL,
            NULL,
            N'Sacha Goedegebure',
            N'Chú thỏ hiền lành đối mặt với nhóm thú rừng thích quấy phá. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2008.] Poster: (c) copyright Blender Foundation | peach.blender.org; CC BY 3.0; https://creativecommons.org/licenses/by/3.0',
            N'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/960px-Big_buck_bunny_poster_big.jpg',
            NULL,
            N'Đang chiếu'
        ),
        (
            N'Tears of Steel',
            13,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Ian Hubert',
            N'Các nhà khoa học và chiến binh ở Amsterdam tìm cách ngăn cuộc tấn công của robot. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2012.] Poster: (CC) Blender Foundation | Project Mango; CC BY 3.0; https://creativecommons.org/licenses/by/3.0',
            N'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Tos-poster.png/960px-Tos-poster.png',
            NULL,
            N'Đang chiếu'
        ),
        (
            N'Elephants Dream',
            11,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Bassam Kurdali',
            N'Hai người khám phá một cỗ máy kỳ lạ với những góc nhìn khác nhau về thế giới. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2006.] Poster: Bassam Kurdali, Andy Goralczyk, and the Blender Foundation; CC BY 4.0; https://creativecommons.org/licenses/by/4.0',
            N'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0c/ElephantsDreamPoster.jpg/960px-ElephantsDreamPoster.jpg',
            NULL,
            N'Đang chiếu'
        ),
        (
            N'Cosmos Laundromat: First Cycle',
            13,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Mathieu Auvray',
            N'Một chú cừu trên hòn đảo hoang gặp người lạ và nhận cơ hội đổi đời. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2015.] Poster: Andy Goralczyk and the Blender Foundation; CC BY 4.0; https://creativecommons.org/licenses/by/4.0',
            N'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/CosmosLaundromatPoster.jpg/960px-CosmosLaundromatPoster.jpg',
            NULL,
            N'Đang chiếu'
        ),
        (
            N'Spring',
            8,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            NULL,
            NULL,
            NULL,
            N'Andy Goralczyk',
            N'Cô bé chăn cừu và chú chó đối diện các linh hồn cổ xưa để đưa mùa xuân trở lại. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2019.] Poster: Francesco Siddi; CC BY 4.0; https://creativecommons.org/licenses/by/4.0',
            N'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/05/Spring2019PillarPosterBlender.jpg/960px-Spring2019PillarPosterBlender.jpg',
            NULL,
            N'Đang chiếu'
        ),
        (
            N'Sprite Fright',
            11,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Matthew Luhn',
            N'Nhóm thanh thiếu niên trong rừng gặp những sinh vật nấm với sức mạnh bất ngờ. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2021.] Poster: Blender Studio; CC BY 4.0; https://creativecommons.org/licenses/by/4.0',
            N'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Sprite_Fright-movie_poster.jpg/960px-Sprite_Fright-movie_poster.jpg',
            NULL,
            N'Đang chiếu'
        ),
        (
            N'Charge',
            5,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Hjalti Hjalmarsson',
            N'Trong thế giới thiếu năng lượng, một người đàn ông đột nhập nhà máy pin và đối mặt robot bảo vệ. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2022.] Poster: Blender Studio; CC BY 4.0; https://creativecommons.org/licenses/by/4.0',
            N'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Charge-movie_poster.jpg/960px-Charge-movie_poster.jpg',
            NULL,
            N'Đang chiếu'
        ),
        (
            N'Coffee Run',
            4,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            NULL,
            NULL,
            NULL,
            N'Hjalti Hjalmarsson',
            N'Một người phụ nữ chạy qua những ký ức vui buồn của mối quan hệ đã qua. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2020.] Poster: Hjalti Hjalmarsson (Blender Cloud); CC BY 4.0; https://creativecommons.org/licenses/by/4.0',
            N'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Coffee_Run-movie_poster.png/960px-Coffee_Run-movie_poster.png',
            NULL,
            N'Đang chiếu'
        ),
        (
            N'Dune: Hành Tinh Cát - Phần Hai',
            167,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Denis Villeneuve',
            N'Paul Atreides cùng người Fremen đối diện cuộc chiến trên Arrakis. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2024.] Poster chưa đủ quyền sử dụng; giữ fallback.',
            NULL,
            N'https://www.youtube.com/watch?v=Way9Dexny3w',
            N'Đang chiếu'
        ),
        (
            N'Mai',
            131,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Việt',
            NULL,
            N'T18',
            N'Trấn Thành',
            N'Mai đối diện quá khứ và tìm kiếm cơ hội hạnh phúc trong một mối quan hệ mới. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2024.] Poster chưa đủ quyền sử dụng; giữ fallback.',
            NULL,
            NULL,
            N'Đang chiếu'
        ),
        (
            N'Oppenheimer',
            181,
            DATEADD(DAY, - 30, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Christopher Nolan',
            N'Câu chuyện về nhà vật lý J. Robert Oppenheimer và dự án Manhattan. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2023.] Poster chưa đủ quyền sử dụng; giữ fallback.',
            NULL,
            N'https://www.youtube.com/watch?v=uYPbbksJxIg',
            N'Đang chiếu'
        ),
        (
            N'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô',
            111,
            DATEADD(DAY, 14, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Nhật',
            NULL,
            NULL,
            N'Chika Nagaoka',
            N'Conan và Heiji điều tra bí ẩn liên quan đến những thanh kiếm tại Hakodate. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2024.] Poster chưa đủ quyền sử dụng; giữ fallback.',
            NULL,
            NULL,
            N'Sắp chiếu'
        ),
        (
            N'Inside Out 2',
            96,
            DATEADD(DAY, 14, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Kelsey Mann',
            N'Những cảm xúc mới xuất hiện trong tâm trí Riley khi cô bước vào tuổi thiếu niên. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2024.] Poster chưa đủ quyền sử dụng; giữ fallback.',
            NULL,
            NULL,
            N'Sắp chiếu'
        ),
        (
            N'Soul',
            100,
            DATEADD(DAY, 14, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Pete Docter',
            N'Một nhạc công jazz khám phá ý nghĩa của cuộc sống trên hành trình ngoài thế giới thường ngày. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2020.] Poster chưa đủ quyền sử dụng; giữ fallback.',
            NULL,
            NULL,
            N'Sắp chiếu'
        ),
        (
            N'Moana',
            107,
            DATEADD(DAY, 14, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Ron Clements, John Musker',
            N'Moana vượt đại dương cùng Maui để khôi phục sự cân bằng cho quê hương. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2016.] Poster chưa đủ quyền sử dụng; giữ fallback.',
            NULL,
            NULL,
            N'Sắp chiếu'
        ),
        (
            N'Elemental',
            103,
            DATEADD(DAY, 14, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Peter Sohn',
            N'Ember và Wade tìm thấy sự kết nối giữa những khác biệt của lửa và nước. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2023.] Poster chưa đủ quyền sử dụng; giữ fallback.',
            NULL,
            NULL,
            N'Sắp chiếu'
        ),
        (
            N'Coco',
            106,
            DATEADD(DAY, 14, @Day),
            DATEADD(DAY, 90, @Day),
            N'Tiếng Anh',
            NULL,
            NULL,
            N'Lee Unkrich, Adrian Molina',
            N'Miguel bước vào thế giới người đã khuất để khám phá âm nhạc và câu chuyện gia đình. [DEMO_SCENARIO: lịch chiếu mô phỏng; phim phát hành thật 2017.] Poster chưa đủ quyền sử dụng; giữ fallback.',
            NULL,
            NULL,
            N'Sắp chiếu'
        );
    INSERT
        dbo.PHIM_THELOAI(PhimID, TheLoaiID)
    SELECT
        p.PhimID,
        g.TheLoaiID
    FROM
        (
            VALUES
                (N'Sintel', N'Hoạt hình'),
                (N'Sintel', N'Giả tưởng'),
                (N'Big Buck Bunny', N'Hoạt hình'),
                (N'Big Buck Bunny', N'Hài'),
                (N'Tears of Steel', N'Khoa học viễn tưởng'),
                (N'Tears of Steel', N'Hành động'),
                (N'Elephants Dream', N'Hoạt hình'),
                (N'Elephants Dream', N'Giả tưởng'),
                (N'Cosmos Laundromat: First Cycle', N'Hoạt hình'),
                (N'Cosmos Laundromat: First Cycle', N'Giả tưởng'),
                (N'Spring', N'Hoạt hình'),
                (N'Spring', N'Giả tưởng'),
                (N'Sprite Fright', N'Hoạt hình'),
                (N'Sprite Fright', N'Kinh dị'),
                (N'Charge', N'Hoạt hình'),
                (N'Charge', N'Khoa học viễn tưởng'),
                (N'Coffee Run', N'Hoạt hình'),
                (N'Coffee Run', N'Tình cảm'),
                (N'Dune: Hành Tinh Cát - Phần Hai', N'Khoa học viễn tưởng'),
                (N'Dune: Hành Tinh Cát - Phần Hai', N'Phiêu lưu'),
                (N'Mai', N'Tình cảm'),
                (N'Mai', N'Tâm lý'),
                (N'Oppenheimer', N'Tâm lý'),
                (N'Oppenheimer', N'Lịch sử'),
                (N'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô', N'Hoạt hình'),
                (N'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô', N'Trinh thám'),
                (N'Inside Out 2', N'Hoạt hình'),
                (N'Inside Out 2', N'Gia đình'),
                (N'Soul', N'Hoạt hình'),
                (N'Soul', N'Giả tưởng'),
                (N'Moana', N'Hoạt hình'),
                (N'Moana', N'Phiêu lưu'),
                (N'Elemental', N'Hoạt hình'),
                (N'Elemental', N'Tình cảm'),
                (N'Coco', N'Hoạt hình'),
                (N'Coco', N'Gia đình')
        ) x(TenPhim, TheLoai)
        JOIN dbo.PHIM p ON p.TenPhim = x.TenPhim
        JOIN dbo.THELOAI g ON g.TenTheLoai = x.TheLoai;
    INSERT
        dbo.PHIM_DIENVIEN(PhimID, DienVienID, VaiDien)
    SELECT
        p.PhimID,
        a.DienVienID,
        NULL
    FROM
        (
            VALUES
                (N'Sintel', N'Halina Reijn'),
                (N'Sintel', N'Thom Hoffman'),
                (N'Tears of Steel', N'Derek de Lint'),
                (N'Tears of Steel', N'Sergio Hasselbaink'),
                (N'Elephants Dream', N'Cas Jansen'),
                (N'Elephants Dream', N'Tygo Gernandt'),
                (N'Dune: Hành Tinh Cát - Phần Hai', N'Timothée Chalamet'),
                (N'Dune: Hành Tinh Cát - Phần Hai', N'Zendaya'),
                (N'Mai', N'Phương Anh Đào'),
                (N'Mai', N'Tuấn Trần'),
                (N'Oppenheimer', N'Cillian Murphy'),
                (N'Oppenheimer', N'Emily Blunt'),
                (N'Inside Out 2', N'Amy Poehler'),
                (N'Inside Out 2', N'Maya Hawke'),
                (N'Soul', N'Jamie Foxx'),
                (N'Soul', N'Tina Fey'),
                (N'Moana', N'Auliʻi Cravalho'),
                (N'Moana', N'Dwayne Johnson'),
                (N'Elemental', N'Leah Lewis'),
                (N'Elemental', N'Mamoudou Athie'),
                (N'Coco', N'Anthony Gonzalez'),
                (N'Coco', N'Gael García Bernal')
        ) x(TenPhim, HoTen)
        JOIN dbo.PHIM p ON p.TenPhim = x.TenPhim
        JOIN dbo.DIENVIEN a ON a.HoTen = x.HoTen;
    -- Demo release window makes a verified poster eligible for the existing Homepage featured rule.
    UPDATE dbo.PHIM
    SET
        NgayKhoiChieu = DATEADD(DAY, - 14, @Day)
    WHERE
        TenPhim = N'Sintel';
END;
