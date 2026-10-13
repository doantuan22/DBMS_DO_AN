import { useState } from 'react';
import { recordMediaUrl } from '../public/mediaPolicy';
export default function MediaFrame({
  src,
  alt,
  title,
  kind = 'poster',
  className = '',
  priority = false,
}) {
  const [failedSrc, setFailedSrc] = useState(null);
  const media = recordMediaUrl(src);
  return (
    <div className={`customer-media customer-media--${kind} ${className}`}>
      {media && failedSrc !== media ? (
        <img
          src={media}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          width={kind === 'product' ? 160 : kind === 'poster' ? 400 : 720}
          height={kind === 'product' ? 160 : kind === 'poster' ? 600 : 405}
          onError={() => setFailedSrc(media)}
        />
      ) : (
        <span role="img" aria-label={`${alt} · Chưa có ảnh`} className="customer-media__fallback">
          <span className="cp-media-wordmark">CinemaStar</span>
          <span className="cp-media-title">
            {title ?? alt.replace(/^(Poster |Ảnh đại diện |Ảnh )/, '')}
          </span>
          <span className="cp-media-caption">
            {kind === 'poster' ? 'Chưa có poster' : 'Chưa có ảnh'}
          </span>
        </span>
      )}
    </div>
  );
}
