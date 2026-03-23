# iPhone Lab - Sistema de Ventas y Gestion

Incluye:
- Tienda online con productos nuevos/usados y accesorios.
- Precios en USD con conversion a ARS, margen y cuotas.
- Checkout basico con registro de ventas.
- Reparaciones con seguimiento por codigo.
- Panel admin para productos, stock, clientes, reparaciones y ventas.

## Requisitos
- Node.js 18+
- SQLite (incluido via Prisma)

## Configuracion rapida
1. Instala dependencias:
   - `npm install`
2. Genera la base de datos:
   - `npx prisma migrate dev --name init`
3. Carga datos de ejemplo:
   - `npx prisma db seed`
4. Ejecuta el proyecto:
   - `npm run dev`

## Variables opcionales
- `DATABASE_URL` (por defecto `file:./dev.db`)
- `EXCHANGE_RATE_API_URL` y `EXCHANGE_RATE_API_FIELD` para tipo de cambio automatico.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SECRET` para acceso al panel admin.

Credenciales por defecto (solo desarrollo):
- Email: `admin@local`
- Contrasena: `admin1234`

## Cambiar credenciales desde el panel
- Entra a `/admin/security` para actualizar email y contrasena.
- La primera vez guarda una contrasena para crear el usuario admin en la base.

## Mi cuenta (clientes)
- Login en `/mi-cuenta/login` con email + contrasena o con codigo por WhatsApp/SMS.
- Dashboard en `/mi-cuenta` con reparaciones y compras asociadas.
- En desarrollo el codigo OTP se muestra en pantalla.

## Notas
- El panel admin no tiene autenticacion aun.
- MercadoPago esta listo para integrar, pero requiere token y flujo final.
- Las fotos reales se cargan como URLs en el admin.
- En `public/sample` hay imagenes de ejemplo para pruebas rapidas.

