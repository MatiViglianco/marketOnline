Supermercado Monorepo (Backend + Frontend)

Estructura:

- backend: Django + DRF, app `shop` con categorías, productos, configuración del sitio y creación de pedidos.
- frontend: Vite + React + Tailwind, catálogo, carrito en localStorage y checkout con envío a WhatsApp.

Requisitos:

- Python 3.10+
- Node 18+

Backend (Django + DRF)

1) Instalar dependencias:

   pip install -r backend/requirements.txt

2) Migraciones y usuario admin:

   cd backend
   python manage.py migrate
   python manage.py createsuperuser

3) Ejecutar servidor:

   python manage.py runserver

Notas:
- El admin está en /admin. Cargar categorías, productos y la configuración del sitio (SiteConfig) ahí.
- CORS está habilitado para desarrollo (localhost:5173). Ajustar en settings si es necesario.

Frontend (Vite + React + Tailwind)

1) Instalar dependencias:

   cd frontend
   npm install

2) Configurar variables de entorno (crear `.env`):

   VITE_API_URL=http://localhost:8000/api
   VITE_WHATSAPP_PHONE=5493511234567

3) Ejecutar en desarrollo:

   npm run dev

Flujo de uso del MVP

- Home: lista categorías y productos con búsqueda y filtro por categoría; se pueden agregar productos al carrito.
- Carrito: se persiste en localStorage.
- Checkout: completar datos y método de pago; al confirmar se crea el pedido en /api/orders/ y se abre WhatsApp con un mensaje prellenado con el detalle.

## Seguridad y HTTPS

Para entornos de producción, el archivo `backend/supermercado/settings.py` permite ajustar opciones de seguridad mediante variables de entorno:

- `DJANGO_SECURE_SSL_REDIRECT`: redirige tráfico HTTP a HTTPS.
- `DJANGO_SECURE_HSTS_SECONDS`: segundos para HSTS (ej. `31536000`).
- `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS` y `DJANGO_SECURE_HSTS_PRELOAD`: activar en despliegues HTTPS.
- `DJANGO_SESSION_COOKIE_SECURE` y `DJANGO_CSRF_COOKIE_SECURE`: marcan cookies como seguras.
- `DJANGO_X_FRAME_OPTIONS`: política de `X-Frame-Options` (`DENY` por defecto).
- `DJANGO_SECURE_CONTENT_TYPE_NOSNIFF`: evita inferencia de tipos de contenido.
- `DJANGO_SECURE_REFERRER_POLICY`: política de referrer (`same-origin` por defecto).

Ajustar estos valores según el entorno (desarrollo o producción) para reforzar la seguridad.
