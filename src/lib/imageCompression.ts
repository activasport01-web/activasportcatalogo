export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg'
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.78,
    format = 'webp',
  } = options

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Redimensionar manteniendo proporción
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }

      ctx.drawImage(img, 0, 0, width, height)

      const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg'
      const ext      = format === 'webp' ? 'webp' : 'jpg'

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }

          const baseName   = file.name.replace(/\.[^.]+$/, '')
          const compressed = new File([blob], `${baseName}.${ext}`, { type: mimeType })

          // Solo usar la versión comprimida si es realmente menor
          const winner = compressed.size < file.size ? compressed : file
          const pct    = Math.round((1 - winner.size / file.size) * 100)
          if (pct > 0) {
            console.log(
              `[img] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(winner.size / 1024).toFixed(0)}KB (-${pct}%)`
            )
          }
          resolve(winner)
        },
        mimeType,
        quality,
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}
