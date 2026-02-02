# 🚀 Guía Oficial de Despliegue en Vercel - Activa Sport

Esta guía te llevará paso a paso para subir tu catálogo a internet usando **Vercel** (la mejor plataforma para Next.js).

## 📋 Requisitos Previos
1.  Tu código ya debe estar actualizado en GitHub (¡Ya hicimos esto!).
2.  Tener una cuenta en [vercel.com](https://vercel.com) (puedes entrar con tu GitHub).
3.  Tener a mano tus claves de Supabase (URL y KEY) que están en tu archivo `.env.local` de tu computadora.

---

## 👣 Paso 1: Conectar Vercel con GitHub

1.  Entra a **[vercel.com/new](https://vercel.com/new)**.
2.  Verás una lista de tus repositorios de GitHub.
3.  Busca el repositorio **`activasport-catalogo`** (o el nombre que le hayas puesto).
4.  Haz clic en el botón **"Import"** a la derecha de ese repositorio.

---

## 🔑 Paso 2: Configurar las "APIs" (Variables de Entorno)

Este es el paso más importante. Para que tu página se conecte con tu base de datos (Supabase) desde la nube, necesitas decirle las claves.

1.  En la pantalla de configuración de Vercel (después de dar Import), baja hasta la sección **"Environment Variables"** y haz clic para expandirla.
2.  Necesitas agregar las mismas claves que tienes en tu archivo `.env.local`:

    *   **Nombre (Key):** `NEXT_PUBLIC_SUPABASE_URL`
        *   **Valor:** *(Copia aquí la URL larga de supabase de tu archivo .env.local)*
        *   Haz clic en **"Add"**.

    *   **Nombre (Key):** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   **Valor:** *(Copia aquí la clave larga eyJ... de tu archivo .env.local)*
        *   Haz clic en **"Add"**.

> **Nota:** ¡No necesitas subir ningún archivo de API! Al configurar estas variables, Vercel conecta automáticamente tu proyecto con Supabase.

---

## 🚀 Paso 3: Desplegar (Deploy)

1.  Revisa que "Framework Preset" diga **Next.js** (Vercel lo detecta solo).
2.  No cambies nada en "Build and Output Settings".
3.  Haz clic en el botón azul grande **"Deploy"**.

---

## 🎉 Paso 4: ¡Éxito!

*   Vercel tardará 1-2 minutos procesando (verás una consola de colores).
*   Cuando termine, verás una lluvia de confeti y una foto de tu página web.
*   Haz clic en la imagen o en **"Visit"** para ir a tu nueva página web en vivo.

### 🌐 Tu Dominio
Vercel te dará una dirección gratuita tipo `activasport-catalogo.vercel.app`.
Si luego compras un dominio `.com` o `.bo`, puedes conectarlo en la sección **Settings > Domains** de Vercel muy fácilmente.

---

## 🆘 ¿Problemas Comunes?

*   **Error de Build:** Si el deploy falla, Vercel te mostrará un "Log". Generalmente es porque faltó alguna Variable de Entorno (Paso 2). Revisa que las hayas copiado exactamente igual, sin espacios extra.
*   **Imágenes no cargan:** Asegúrate de que en Supabase tus "Buckets" (imágenes) sean públicos. (Ya lo son en tu proyecto actual).

¡Listo! Tu tienda está online.
