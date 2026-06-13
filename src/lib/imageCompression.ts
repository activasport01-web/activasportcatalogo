export async function compressImage(file: File): Promise<File> {
  // Safe check for server-side pre-rendering
  if (typeof window === 'undefined') {
    return file;
  }

  // Optimización: si ya es WebP y pesa menos de 150 KB, no procesar para ahorrar CPU
  if (file.type === 'image/webp' && file.size <= 150 * 1024) {
    return file;
  }

  // Si no es una imagen, retornar el original por seguridad
  if (!file.type.startsWith('image/')) {
    return file;
  }

  try {
    const compressed = await new Promise<File>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200; // Resolución óptima para catálogo web (alta definición pero súper liviana)

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas 2D'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a WebP con calidad del 75% (balance perfecto de calidad/peso)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Fallo al generar el blob desde el canvas'));
                return;
              }
              const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
              const compressedFile = new File([blob], newName, { type: 'image/webp' });
              resolve(compressedFile);
            },
            'image/webp',
            0.75
          );
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen en memoria'));
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    });
    return compressed;
  } catch (error) {
    console.error('Error al comprimir la imagen con Canvas, usando original:', error);
    return file; // Retornar original por seguridad ante cualquier fallo
  }
}
