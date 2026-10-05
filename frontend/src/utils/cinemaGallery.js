export function publicGalleryImages(images) {
  return images.filter(image => image.status === 'Hoạt động').sort((a, b) => Number(b.cover) - Number(a.cover)
    || a.displayOrder - b.displayOrder || a.id - b.id);
}
