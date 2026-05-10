# 🗃️ Documentación de Base de Datos — Activa Sport
**Motor:** PostgreSQL (Supabase) · **Tipo:** Relacional · **Entorno:** Producción

---

## 📐 Diagrama de relaciones (simplificado)

```
auth.users (Supabase)
    │
    ├──→ pedidos.cliente_id
    ├──→ compras_producto.usuario_id
    └──→ movimientos_kardex.usuario_id

zapatos (tabla central)
    │
    ├──→ inventario.producto_id        (stock por color)
    ├──→ movimientos_kardex.producto_id (historial de movimientos)
    ├──→ detalle_pedidos.producto_id   (líneas de pedido)
    ├──→ compras_producto.producto_id  (registro de compras)
    └──→ portada_destacada.id_producto (banners destacados)

pedidos
    └──→ detalle_pedidos.pedido_id     (líneas del pedido)

kardex (VISTA de movimientos_kardex + zapatos)
```

---

## 📋 Descripción de cada tabla

---

### 🥇 `zapatos` — Tabla central del catálogo

> Es el núcleo del sistema. Toda la información del producto vive aquí.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | bigint (auto) | Identificador único del producto |
| `nombre` | text | Nombre del producto |
| `descripcion` | text | Descripción larga |
| `categoria` | text | Categoría asignada (ej: "Deportivo") |
| `subcategoria` | text | Subcategoría (ej: "Running") |
| `marca` | text | Marca del calzado |
| `genero` | text | Género objetivo (Hombre, Mujer, Niño) |
| `grupo_talla` | text | Grupo de tallas (ej: "Adulto 36-41") |
| `codigo` | text | Código interno del producto |
| `caja` | text | Tipo de caja o presentación |
| `origen` | text | País/origen del producto |
| `precio` | numeric | Precio público de referencia |
| `precio_costo` | numeric | Costo de adquisición |
| `stock_bultos` | numeric | Cantidad en stock (en bultos) |
| `url_imagen` | text | URL de la imagen principal |
| `imagen_hover` | text | URL de imagen al pasar el cursor |
| `colores` | jsonb | Array de colores con imágenes `[{color, imagen, imagen_hover}]` |
| `variantes_tallas` | jsonb | Variantes de talla con stock `[{curva, tallas, stock}]` |
| `tallas` | text[] | Array simple de tallas disponibles |
| `etiquetas` | text[] | Tags para búsqueda (ej: "nuevo", "oferta") |
| `disponible` | boolean | Si el producto está activo en el catálogo |
| `destacado` | boolean | Si aparece en la sección destacada |
| `vistas` | integer | Contador de visitas al producto |
| `consultas` | integer | Contador de consultas vía WhatsApp |
| `fecha_creacion` | timestamp | Fecha de registro |

**Relaciones que salen de esta tabla:**
- → `inventario` (stock por variante de color)
- → `movimientos_kardex` (historial de entradas/salidas)
- → `detalle_pedidos` (aparece en pedidos de clientes)
- → `portada_destacada` (puede ser destacado en la portada)

---

### 📦 `inventario` — Stock por producto y color

> Registra la cantidad disponible de cada producto, desglosada por color si aplica. Conectada formalmente a `zapatos` mediante FK.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `producto_id` | bigint **FK→zapatos** | Producto al que pertenece |
| `color` | text | Color específico (null = stock general) |
| `cantidad` | integer | Cantidad en stock |
| `ultima_actualizacion` | timestamp | Última vez que se modificó |

**Regla de integridad:** Si se elimina un zapato, su registro en inventario se elimina automáticamente (`ON DELETE CASCADE`).

---

### 📋 `kardex` — Vista del historial de movimientos

> No es una tabla física, es una **vista** que combina `movimientos_kardex` con el nombre del producto. Permite ver el kardex completo de forma legible.

| Campo | Descripción |
|---|---|
| `id` | ID del movimiento |
| `producto_id` | ID del producto |
| `producto_nombre` | Nombre del producto (traído de `zapatos`) |
| `producto_marca` | Marca del producto (traído de `zapatos`) |
| `tipo` | ENTRADA / SALIDA / VENTA / AJUSTE |
| `cantidad` | Cantidad del movimiento |
| `precio_total` | Monto total del movimiento |
| `fecha` | Fecha y hora del movimiento |

---

### 📝 `movimientos_kardex` — Historial real de inventario

> Registra cada movimiento de stock: entradas de mercadería, ventas realizadas, ajustes manuales. Es la fuente de verdad del historial de inventario.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `producto_id` | bigint **FK→zapatos** | Producto involucrado |
| `tipo` | text | `ENTRADA`, `SALIDA`, `VENTA`, `AJUSTE` |
| `cantidad` | numeric | Cantidad del movimiento |
| `precio_total` | numeric | Valor total del movimiento en Bs |
| `detalle` | text | Descripción del movimiento |
| `usuario_id` | uuid **FK→auth.users** | Usuario que registró el movimiento |
| `fecha` | timestamp | Fecha y hora exacta |

---

### 🛒 `pedidos` — Órdenes de clientes

> Cada vez que un cliente completa su carrito y envía el pedido por WhatsApp, se crea un registro aquí.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único del pedido |
| `cliente_nombre` | text | Nombre del cliente |
| `cliente_telefono` | text | Teléfono de contacto |
| `cliente_id` | uuid **FK→auth.users** | Si el cliente tiene cuenta |
| `total` | numeric | Total del pedido en Bs |
| `estado` | text | `pendiente`, `confirmado`, `enviado`, etc. |
| `metodo_pago` | text | Por defecto: `whatsapp` |
| `fecha_creacion` | timestamp | Cuándo se hizo el pedido |

---

### 📋 `detalle_pedidos` — Líneas de cada pedido

> Contiene cada producto dentro de un pedido. Un pedido tiene múltiples líneas de detalle.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `pedido_id` | uuid **FK→pedidos** | Pedido al que pertenece |
| `producto_id` | bigint **FK→zapatos** | Producto pedido |
| `nombre_producto` | text | Nombre en el momento del pedido (histórico) |
| `cantidad_pares` | integer | Pares solicitados |
| `tipo_curva` | text | Curva/variante seleccionada |
| `color` | text | Color seleccionado |
| `precio_unitario` | numeric | Precio al momento del pedido |
| `subtotal` | numeric | Subtotal de esa línea |

---

### 💰 `compras_producto` — Registro de compras a proveedores

> Permite registrar cada vez que se compra mercadería. Calcula automáticamente costos en bolivianos usando el tipo de cambio del dólar.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | uuid | Identificador único |
| `producto_id` | bigint | Producto comprado |
| `fecha` | date | Fecha de compra |
| `precio_usd` | numeric | Precio de compra en dólares |
| `bultos_qty` | numeric | Cantidad de bultos comprados |
| `tipo_cambio` | numeric | Tipo de cambio USD→Bs usado |
| `costo_bs_total` | numeric | `precio_usd × tipo_cambio` (calculado) |
| `costo_bs_por_bulto` | numeric | `costo_total / bultos_qty` (calculado) |
| `precio_venta_ref` | numeric | Precio de venta sugerido |
| `notas` | text | Observaciones |
| `usuario_id` | uuid **FK→auth.users** | Quién registró la compra |

---

### 🖼️ `portada_destacada` — Banners de la página principal

> Controla las imágenes que aparecen en el slider o sección destacada de la tienda.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | bigint (auto) | Identificador único |
| `titulo` | text | Título del banner |
| `descripcion` | text | Descripción o subtítulo |
| `url_imagen` | text | URL de la imagen del banner |
| `id_producto` | bigint **FK→zapatos** | Producto que enlaza el banner (opcional) |
| `activo` | boolean | Si se muestra en la portada |
| `fecha_creacion` | timestamp | Cuándo se creó |

---

### 🏷️ `categorias` — Categorías del catálogo

> Define las categorías principales de productos. Usadas para filtrar y navegar el catálogo.

| Campo | Descripción |
|---|---|
| `id` | UUID único |
| `nombre` | Nombre de la categoría (ej: "Deportivo") |
| `slug` | URL amigable (ej: "deportivo") — único |
| `descripcion` | Descripción para SEO |
| `emoji` | Emoji representativo (ej: "👟") |
| `imagen_url` | Imagen de la categoría |
| `orden` | Orden de aparición en el menú |
| `activa` | Si está visible en el catálogo |

---

### 🔖 `subcategorias` — Subcategorías del catálogo

> Nivel más específico de clasificación. Ej: dentro de "Deportivo" puede haber "Running", "Fútbol", etc.

| Campo | Descripción |
|---|---|
| `nombre` | Nombre de la subcategoría |
| `categoria_relacionada` | Texto de la categoría padre |
| `imagen_url` | Imagen de la subcategoría |
| `activa` | Si está visible |

---

### 🏭 `marcas` — Marcas de calzado

> Catálogo de marcas disponibles para asignar a los productos.

| Campo | Descripción |
|---|---|
| `nombre` | Nombre único de la marca |
| `logo_url` | URL del logo de la marca |
| `active` | Si está activa |

---

### 👤 `generos` — Géneros de calzado

> Define los géneros disponibles: Hombre, Mujer, Niño, Unisex, etc.

| Campo | Descripción |
|---|---|
| `nombre` | Nombre del género |
| `slug` | URL amigable |
| `orden` | Orden en el selector |

---

### 📏 `grupos_tallas` — Grupos de tallas

> Agrupa rangos de tallas para facilitar la selección. Ej: "Adulto 36-41", "Niño 28-35".

| Campo | Descripción |
|---|---|
| `nombre` | Nombre del grupo |
| `rango_tallas` | Descripción del rango (ej: "36-41") |
| `orden` | Orden de aparición |

---

### 📣 `promociones` — Banners promocionales

> Gestiona banners y promociones que aparecen en la tienda. Independiente de los productos.

| Campo | Descripción |
|---|---|
| `titulo` | Título de la promo |
| `descripcion` | Descripción |
| `imagen_url` | Imagen de la promoción |
| `color_fondo` | Clase CSS del color de fondo |
| `texto_boton` | Texto del botón de acción |
| `link_boton` | URL destino del botón |
| `activo` | Si se muestra en la tienda |
| `orden` | Orden de aparición |

---

### 🏢 `proveedores` — Proveedores de mercadería

> Directorio de proveedores y distribuidores con quienes trabaja Activa Sport.

| Campo | Descripción |
|---|---|
| `nombre` | Nombre del proveedor |
| `contacto` | Persona de contacto |
| `telefono` | Teléfono |
| `email` | Correo electrónico |
| `pais` / `ciudad` | Ubicación |
| `notas` | Observaciones internas |
| `activo` | Si está activo |

---

## 🔗 Resumen de relaciones formales (Foreign Keys)

| Tabla origen | Campo | → Tabla destino | Tipo |
|---|---|---|---|
| `inventario` | `producto_id` | `zapatos.id` | CASCADE (si borro zapato, borro stock) |
| `movimientos_kardex` | `producto_id` | `zapatos.id` | Referencial |
| `movimientos_kardex` | `usuario_id` | `auth.users.id` | Referencial |
| `detalle_pedidos` | `pedido_id` | `pedidos.id` | Referencial |
| `detalle_pedidos` | `producto_id` | `zapatos.id` | Referencial |
| `pedidos` | `cliente_id` | `auth.users.id` | Referencial |
| `compras_producto` | `usuario_id` | `auth.users.id` | Referencial |
| `portada_destacada` | `id_producto` | `zapatos.id` | Referencial |

---

## 🔐 Seguridad

- **Row Level Security (RLS):** Activado en las tablas principales vía Supabase
- **Autenticación:** Manejada por `auth.users` de Supabase (email + password)
- **Panel Admin:** Protegido por middleware de Next.js + cookie de sesión `admin_session`
- **API Proxy:** Todas las llamadas del cliente pasan por `/api/proxy` para evitar bloqueos de operadoras móviles

---

*Documentación generada en Abril 2026 — Sistema Activa Sport v2.0*
