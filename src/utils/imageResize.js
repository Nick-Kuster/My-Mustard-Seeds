// Keep uploads lossless for now. Mobile browser canvas export can produce
// black images for some camera/photo-library files, so avoid decode/resample
// until resizing can be handled with a more reliable pipeline.
export const resizeImageFile = async (file) => ({
  blob: file,
  mimeType: file.type || 'image/jpeg',
})
