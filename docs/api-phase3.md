# Phase 3 public catalog API

All endpoints are public and do not require a Bearer token. Backend calls only the whitelisted stored procedures listed below; SQL Server remains responsible for catalog joins, status rules, and showtime availability. List responses use `{ movies: [] }`, `{ genres: [] }`, `{ cinemas: [] }`, or `{ showtimes: [] }`. Errors use `{ error: { code, message } }`.

| Method and path | Purpose | Query / path parameters | Stored procedure |
| --- | --- | --- | --- |
| `GET /api/movies` | List movies | `status`, `genreId` (positive integer), `search` (up to 100 characters). No pagination is supported by the procedure. | `dbo.sp_Movie_List` |
| `GET /api/movies/:movieId` | Movie details, genres, actors, recent reviews | `movieId` must be a positive integer. | `dbo.sp_Movie_GetDetail` |
| `GET /api/genres` | Genre selector data | None | `dbo.sp_Genre_List` |
| `GET /api/cinemas` | Active cinema list with nullable cover image URL | Optional `city` (up to 100 characters) | `dbo.sp_Cinema_List` |
| `GET /api/cinemas/:cinemaId/images` | Active cinema gallery | Required positive `cinemaId` | `dbo.sp_Cinema_GetImages` |
| `GET /api/movies/:movieId/showtimes` | Future showtimes for a movie | Required positive `movieId`; optional positive `cinemaId`; optional real `date` in `YYYY-MM-DD` format | `dbo.sp_Showtime_ListByMovie` |
| `GET /api/showtimes/:showtimeId` | Showtime selection context for Phase 4 | `showtimeId` must be a positive integer. | `dbo.sp_Showtime_GetDetail` |

## Response shapes

- Movie list: `{ "movies": [{ "id", "title", "durationMinutes", "releaseDate", "language", "subtitle", "ageRating", "director", "posterUrl", "trailerUrl", "status", "averageRating", "reviewCount", "genres" }] }`.
- Movie detail: `{ "movie": { ... }, "genres": [], "actors": [], "reviews": [] }`.
- Genre list: `{ "genres": [{ "id", "name" }] }`.
- Cinema list: `{ "cinemas": [{ "id", "name", "address", "city", "phone", "description", "operatingSince", "status", "coverImageUrl" }] }`, where `coverImageUrl` is `null` if the cinema has no active cover.
- Cinema gallery: `{ "images": [{ "id", "cinemaId", "url", "description", "cover", "displayOrder", "status", "createdAt" }] }`; only active images are returned in deterministic display order.
- Showtime list: `{ "showtimes": [{ "id", "movieId", "movieTitle", "cinemaId", "cinemaName", "roomId", "roomName", "startsAt", "endsAt", "date", "startTime", "endTime", "format", "basePrice", "status", "totalSeats", "bookedSeats", "availableSeats" }] }`.
- Showtime detail: one showtime DTO with the fields above.

## Validation and errors

- `400 INVALID_REQUEST`: malformed/non-positive IDs, invalid date, invalid filter types, or oversized text filters.
- `400 UNKNOWN_QUERY_PARAMETER`: query parameter is not supported by the corresponding procedure contract.
- `404 MOVIE_NOT_FOUND`: movie detail procedure returned no movie row.
- `404 SHOWTIME_NOT_FOUND`: showtime detail procedure returned no row.
- `503 SERVICE_UNAVAILABLE`: database connection unavailable, using the centralized error handler.
- `500 INTERNAL_ERROR`: unexpected server/procedure failure; SQL details are not returned to clients.

The movie list procedure supports status, genre, and title/director search, but does not support pagination. Cinema list filters out cinemas that are not active. Showtime list filters to future showtimes in the database's `Mở bán` state and accepts cinema/date filters. The detail procedure returns its row without applying those list filters; later booking procedures must enforce current eligibility. Movie actors come from recordset 3 of `sp_Movie_GetDetail`; there is no separate actor-list procedure in the current SQL baseline.

Selecting a showtime navigates to `/booking/:showtimeId`, which now loads seats/products, previews promotion and creates a booking. The earlier Phase 3 context-only implementation is historical. Public cinema detail/gallery uses active images from `GET /api/cinemas/:cinemaId/images`; current source/route inventory is in [R8 traceability](../audit/final/r8/UC_TRACEABILITY_FINAL.md).
