import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  // Optimización: si ya es WebP y pesa menos de 150 KB, no procesar para ahorrar CPU
  if (file.type === 'image/webp' && file.size <= 150 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: 0.15, // Max 150 KB
    maxWidthOrHeight: 1024, // Reasonable max dimension to maintain quality
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8 // Empezamos con una calidad del 80%
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // Al comprimirlo y convertirlo, cambiamos la extensión a .webp para Supabase
    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    
    // Retornamos un nuevo objeto File con el contenido comprimido y el nuevo nombre
    return new File([compressedFile], newName, { type: 'image/webp' });
  } catch (error) {
    console.error('Error al comprimir la imagen:', error);
    return file; // Si falla la compresión, retornamos el original por seguridad
  }
}
