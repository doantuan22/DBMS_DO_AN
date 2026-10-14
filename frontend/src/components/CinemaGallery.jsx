import { publicGalleryImages } from '../utils/cinemaGallery';
import MediaFrame from '../features/customer/MediaFrame';
export default function CinemaGallery({ images, cinemaName }) {
  const rows = publicGalleryImages(images);
  return (
    <section className="catalog-section" aria-label="Ảnh rạp">
      <h2>Ảnh rạp</h2>
      {rows.length ? (
        <div className="cinema-gallery">
          {rows.map((image, index) => (
            <figure key={image.id} className={image.cover ? 'cinema-gallery__cover' : undefined}>
              <MediaFrame
                src={image.url}
                alt={image.description || `Ảnh ${index + 1} của ${cinemaName}`}
                kind="cinema"
                priority={!index}
              />
              {image.description && <figcaption>{image.description}</figcaption>}
            </figure>
          ))}
        </div>
      ) : (
        <p className="catalog-state">Chưa có ảnh rạp.</p>
      )}
    </section>
  );
}
