# LizGlam Beauty Platform 💄✨

Plataforma e-commerce y estudio de citas de belleza para **LizGlam** (dominio: `lizglam.happycorner.top`, Instagram: `@lizglamstore`).

Diseñada con una estética ultra-premium inspirada en **Atenea Profesional**, con navegación fluida, sistema de catálogo de maquillaje, reservación de citas de belleza, carrito persistente y checkout directo por Instagram / portapapeles (sin pasarela de pago).

---

## 🌟 CARACTERÍSTICAS PRINCIPALES

- 🎨 **Estilo Premium Atenea**: Tipografía editorial (`Playfair Display`, `Cormorant Garamond`, `Montserrat`), colores rose gold, crema y tonos nude, tarjetas limpias y animación fluida.
- 🛍️ **Catálogo de Maquillaje**: Productos categorizados (Bases, Labiales, Sombras, Rubores, Brochas) con imágenes de alta definición y filtros dinámicos en tiempo real.
- 💇‍♀️ **Servicios & Citas**: Sección de reserva de citas de maquillaje social, maquillaje para novias y lifting de pestañas con tiempos y horarios.
- 🎁 **Combos Glamour**: Paquetes promocionales combinando productos y servicios con margen reservado.
- 🛒 **Carrito Persistente**:
  - Sincronizado en `localStorage` para clientes no registrados.
  - Sincronizado automáticamente en **Firestore** (`saved_carts`) al iniciar sesión.
- 📱 **Checkout Directo Sin Pasarela**:
  1. **"Contactar por Instagram @lizglamstore"**: Prepara la orden, la registra en el backend y redirige directamente a la cuenta de Instagram `@lizglamstore`.
  2. **"Copiar pedido"**: Copia al portapapeles un resumen estructurado del pedido con un formato elegante y notificación toast instantánea.
- 🔐 **Autenticación Independiente**: Google Sign-In integrado mediante Firebase Auth.
- 🛠️ **Panel de Administración**: dashboard protegido para gestionar el inventario, servicios, consultas de pedidos y métricas de venta.

---

## 🏗️ ARQUITECTURA TÉCNICA

- **Hosting & Backend**: Vercel (Plan Hobby - máximo 12 funciones serverless). Consolidado en `api/account.js`.
- **Base de Datos**: Instancia independiente de **Firebase / Firestore** (colecciones: `users`, `products`, `services`, `combos`, `saved_carts`, `orders`).
- **Almacenamiento de Imágenes**: Cloudflare R2 / CDN de activos.
- **Frontend**: Vanilla HTML5, CSS3 modular (`styles/main.css`, `styles/components.css`) y JavaScript ES6 (`js/auth.js`, `js/cart.js`, `js/instagram.js`, `js/app.js`).

---

## 📂 ESTRUCTURA DE ARCHIVOS

```
liz-glam/
├── api/
│   └── account.js          # Router serverless único para Vercel
├── assets/                 # Imágenes y activos visuales de demostración
├── styles/
│   ├── main.css            # Sistema de diseño Atenea (variables, tipografía, layouts)
│   └── components.css      # Componentes (botones, tarjetas, modal de carrito, admin)
├── js/
│   ├── config.js           # Configuración de Firebase y ayudantes globales
│   ├── auth.js             # Autenticación Google Sign-In y perfil de usuario
│   ├── cart.js             # Gestor de carrito persistente y sincronización
│   ├── instagram.js        # Formateador de pedidos y copia al portapapeles / IG
│   └── app.js              # Controlador principal del catálogo y UI
├── index.html              # Landing principal, hero banner y destacados
├── productos.html          # Catálogo completo con buscador y filtros
├── servicios.html          # Sección de citas de maquillaje y disponibilidad
├── carrito.html            # Resumen de orden y botones de checkout
├── cuenta.html             # Perfil del usuario y carritos guardados
├── admin.html              # Panel de administración e inventario
├── vercel.json             # Rutas y cabeceras de Vercel
├── firestore.rules         # Reglas de seguridad para Firestore LizGlam
└── package.json            # Configuración de dependencias Vercel Node.js
```

---

## 🚀 DESPLIEGUE EN VERCEL

1. Clona el repositorio `liz-glam`:
   ```bash
   git clone https://github.com/realgangstaforlife/liz-glam.git
   cd liz-glam
   ```

2. Configura las variables de entorno en Vercel (si se utiliza servicio Firebase Admin):
   - `FIREBASE_SERVICE_ACCOUNT`: JSON de credenciales de servicio de la nueva instancia de Firebase.

3. Despliega en Vercel:
   ```bash
   vercel --prod
   ```

---

## 📲 CONTACTO & INSTAGRAM

- **Dominio**: `lizglam.happycorner.top`
- **Instagram**: `@lizglamstore`
