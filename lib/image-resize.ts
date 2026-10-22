const MAX_FILE_BYTES = 15 * 1024 * 1024

/** Réduit une photo (max 900 px, JPEG) pour qu'elle reste légère à enregistrer et rapide à afficher. */
export async function photoToDataUrl(file: File, maxSize = 900, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Ce fichier n’est pas une image. Choisissez une photo JPG ou PNG.')
  if (file.size > MAX_FILE_BYTES) throw new Error('Cette photo est trop lourde (15 Mo maximum).')

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Impossible de lire cette photo. Essayez un fichier JPG ou PNG.'))
      el.src = url
    })
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Impossible de traiter cette photo sur cet appareil.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
