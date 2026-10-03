import {fixtures,check,call,finish} from './api.mjs';
import {inspect} from './live-inspect.mjs';
import {save} from './collect.mjs';
try{
  const counts=inspect('movie-review-count-multiplication',`SELECT v.PhimID,v.SoLuotDanhGia viewReviewCount,(SELECT COUNT(*) FROM dbo.DANHGIAPHIM r WHERE r.PhimID=v.PhimID) actualReviewCount,(SELECT COUNT(*) FROM dbo.SUATCHIEU s WHERE s.PhimID=v.PhimID) showtimeCount FROM dbo.vw_ThongKePhim v WHERE v.SoLuotDanhGia<>(SELECT COUNT(*) FROM dbo.DANHGIAPHIM r WHERE r.PhimID=v.PhimID)`);
  const movie=await call('movie-review-count-real-api','GET',`/movies/${fixtures.movieId}`);
  const fixture=counts.find(r=>r.PhimID===fixtures.movieId);
  check('movie-review-count-not-multiplied',!fixture||movie.body.movie.reviewCount===fixture.actualReviewCount,{database:fixture,responseCount:movie.body.movie?.reviewCount});
}catch(error){save('aggregates-blocker.txt',error.stack);console.error(error.message);process.exitCode=1;}finally{finish('aggregates');}
