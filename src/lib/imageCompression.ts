export async function compressImage(file: File): Promise<File> {
  // Desactivado por solicitud del usuario: retornamos la imagen original con su peso tal cual
  console.log(`[compresión] Omitiendo compresión para: ${file.name} (Tamaño original: ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  return file;
}
