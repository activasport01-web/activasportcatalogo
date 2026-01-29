# 👟 Detalles del Proyecto: ActivaSport Catálogo

## 📋 Descripción General
**ActivaSport Catálogo** es una aplicación web moderna de comercio electrónico B2B (Mayorista) diseñada para la venta de calzados. La plataforma permite a los usuarios explorar un catálogo extenso, filtrar por categorías y origen, gestionar un carrito de compras mayorista (por cajas/docenas), y administrar sus productos favoritos. Incluye un panel de administración seguro para la gestión de inventario.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4 + Módulos CSS globales
- **Iconos:** Lucide React
- **Gestión de Estado Global:** React Context API (`CartContext`, `FavoritesContext`, `ThemeContext`)

### Backend & Base de Datos
- **Plataforma:** [Supabase](https://supabase.com/) (BaaS)
- **Base de Datos:** PostgreSQL
- **Autenticación:** Supabase Auth
- **Almacenamiento:** Supabase Storage (Imágenes de productos)

### Despliegue & Herramientas
- **Linter:** ESLint
- **Control de Versiones:** Git

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios Clave
```
/activasport-catalogo
├── /sql_backup            # Scripts SQL de mantenimiento y migración
├── /public                # Assets estáticos (imágenes, logos)
├── /src
│   ├── /app               # Rutas de la aplicación (Next.js App Router)
│   │   ├── /admin         # Panel de administración (protegido)
│   │   ├── /catalogo      # Páginas de navegación de productos
│   │   ├── /favoritos     # Página de lista de deseos
│   │   └── /producto      # Detalle dinámico de producto ([id])
│   ├── /components        # Componentes reutilizables de UI
│   ├── /context           # Lógica de estado global (Carrito, Favoritos)
│   └── /lib               # Clientes de servicios (Supabase)
```

### Componentes Principales
1.  **`ProductView` & `ProductCard`:**
    *   Manejan la visualización inteligente de productos.
    *   Integración con favoritos (❤) y carrito (🛒).
    *   Soporte para lógica mayorista (Docena/Media docena).
    *   Galería de imágenes con autoscroll y selección de colores.

2.  **Sistema de Navegación Híbrido:**
    *   **`TopHeader`:** Barra superior "Sticky" con búsqueda predictiva, acceso a perfil y switch de tema (Oscuro/Claro).
    *   **`DockNavbar`:** Barra de navegación inferior flotante (estilo iOS) para acceso rápido en móviles y escritorio.
    *   **Global Layout:** Integración en `layout.tsx` para persistencia durante la navegación.

3.  **Contextos (Estado Global):**
    *   **`FavoritesContext`:** Persistencia local (`localStorage`) de productos favoritos. Sincronización segura con hidratación de cliente para evitar errores de SSR.
    *   **`CartContext`:** Lógica de negocio B2B. Calcula precios por bulto/caja en lugar de unidad.

---

## 📘 Guía de Modificación para el Desarrollador/Cliente

Esta sección está diseñada para orientar sobre **dónde** realizar cambios comunes en la aplicación.

### 1. 🎨 Diseño y Marca (Branding)
*   **Cambiar el Logo:** Reemplaza los archivos en la carpeta `/public`.
    *   Logo principal: `/public/logo.png`
*   **Cambiar Colores Globales:** Dirigirse a `tailwind.config.ts`.
    *   Busca la sección `colors` -> `brand`. Ahí puedes cambiar el color `orange` (naranja) principal por el color corporativo que desees.
*   **Tipografía:** La fuente está configurada en `/src/app/layout.tsx`. Actualmente usa **Inter** de Google Fonts.

### 2. 🧭 Navegación y Menús
Si deseas cambiar los enlaces del menú o agregar nuevas secciones:
*   **Menú Superior y Buscador:** Edita `/src/components/TopHeader.tsx`.
*   **Barra Flotante Inferior (Dock):** Edita `/src/components/DockNavbar.tsx`.
    *   Busca el array `navItems` para modificar iconos, nombres o rutas.

### 3. 🛍️ Catálogo y Productos
*   **Lógica de Productos:** `/src/components/ProductView.tsx` contiene toda la lógica de visualización, selección de tallas/colores y precios.
*   **Tarjetas de Producto:** `/src/components/ProductCard.tsx` define cómo se ve cada "cajita" de zapato en las listas.
*   **Página Principal (Home):** `/src/app/page.tsx`. Aquí se decide qué secciones se muestran (Banner, Nuevos, Ofertas).

### 4. ⚙️ Administración
El panel de administración se encuentra en `/src/app/admin`.
*   **Seguridad:** La protección de rutas se maneja verificando la sesión de Supabase en cada página de admin.
*   **Gestión de Productos:** `/src/app/admin/productos/page.tsx`.

### 5. 📞 Contacto y Redes Sociales
*   **Botón de WhatsApp Flotante:** `/src/components/FloatingWhatsApp.tsx`. Cambia la constante `phoneNumber` para actualizar el número de destino.
*   **Redes Sociales (Menú Flotante):** `/src/components/SocialSpeedDial.tsx`.

---

## ✨ Características Destacadas

### 1. Experiencia de Usuario (UX) Premium
*   Diseño **Glassmorphism** en componentes de navegación.
*   Animaciones fluidas y micro-interacciones al hacer hover o click.
*   Modo **Oscuro/Claro** totalmente funcional.

### 2. Catálogo Inteligente
*   Filtros dinámicos por Categoría (Niño, Adulto, Deportivo) y Origen (Brasil, Perú, Nacional).
*   Etiquetas automáticas: "Nuevo", "Oferta", "Agotado".
*   Búsqueda en tiempo real con _debounce_ para optimizar consultas a base de datos.
*   **Favoritos:** Sistema persistente para guardar productos deseados.

### 3. Panel de Administración (`/admin`)
*   Login seguro para administradores.
*   CRUD completo de productos (Crear, Leer, Actualizar, Borrar).
*   Gestión de imágenes y stock.

### 4. SEO & Performance
*   **SSR (Server Side Rendering):** Las páginas de producto y catálogo se generan en el servidor para máxima velocidad e indexación en Google.
*   **Metadatos Dinámicos:** Cada página de producto genera sus propios títulos y descripciones OpenGraph (para compartir en WhatsApp/Facebook).

---

## 🚀 Scripts de Base de Datos
Los scripts SQL utilizados se encuentran respaldados en la carpeta `/sql_backup`.
Ejemplos de utilidad:
*   `crear_tabla_marcas.sql`: Estructura para gestión de marcas.
*   `asignar_marcas_productos.sql`: Lógica de asignación masiva.
*   `limpiar_variantes.sql`: Mantenimiento de datos.

---

_Documento generado para ActivaSport Catalogo._
