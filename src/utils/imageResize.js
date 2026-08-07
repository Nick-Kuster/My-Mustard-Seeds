// Client-side downscale before encrypting/uploading — the whole point is
// cost control (Storage is billed per GB), so a 5MB phone photo shouldn't
// go up untouched when nothing in this app displays images larger than a
// journal entry's content width. Images already at or under MAX_DIMENSION
// are left completely alone (no pointless lossy re-compression of an
// already-small file).
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

export const resizeImageFile = async (file) => {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const longestSide = Math.max(width, height)

  if (longestSide <= MAX_DIMENSION) {
    bitmap.close()
    return { blob: file, mimeType: file.type }
  }

  const scale = MAX_DIMENSION / longestSide
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)

  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  return { blob, mimeType: 'image/jpeg' }
}
