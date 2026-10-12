import { useState } from 'react';
export default function MediaFrame({ src, alt, kind = 'poster', className = '', priority = false }) {
  const [failedSrc, setFailedSrc] = useState(null);
  return <div className={`customer-media customer-media--${kind} ${className}`}>{src && failedSrc !== src ? <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} onError={() => setFailedSrc(src)} /> : <span role="img" aria-label={`${alt} · Chưa có ảnh`} className="customer-media__fallback"><span aria-hidden="true">◫</span><span>{kind === 'poster' ? 'Chưa có poster' : 'Chưa có ảnh'}</span></span>}</div>;
}
