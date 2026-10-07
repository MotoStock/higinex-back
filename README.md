# Higinex Backend

API REST para catalogo, precios, inventario y ordenes. Autenticacion JWT + refresh cookie y notificaciones por email.

## Arranque rapido

1. `pnpm install`
2. Copia `.env.development` a `.env` y ajusta `DATABASE_URL`.
3. `docker compose up -d` (opcional)
4. `npx prisma migrate dev`
5. `pnpm start:dev`

## URLs

- Base: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api`

## Auth (frontend)

- `POST /auth/login` devuelve `accessToken` y setea cookie httpOnly con refresh.
- En requests protegidas: `Authorization: Bearer <accessToken>`.
- `POST /auth/refresh` renueva el access token (usa cookie).
- `POST /auth/logout` limpia la cookie de refresh.
- `GET /auth/me` devuelve el usuario actual.
- No se permite login sin `email` verificado.

## Verificacion de email (link)

- Se envia un link de verificacion con expiracion de 10 minutos.
- Reenvio: cooldown 60s; max 3 links por hora.
- `POST /auth/email/resend` `{ email }`
- `GET /auth/email/verify?token=...`

## Registro

- `POST /auth/register` (solo ADMIN). Envia link de verificacion al email.

## Configuración de Email (Resend)

1. Crea una cuenta en [Resend](https://resend.com).
2. Genera una API Key en la sección de API Keys.
3. En `.env` (o variables de entorno de producción):
   - `SMTP_HOST=smtp.resend.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=resend`
   - `SMTP_PASS=re_123456789...` (Tu API Key)
   - `EMAIL_FROM=onboarding@resend.dev` (Para desarrollo, solo envía a tu email de registro)
4. Para producción:
   - Verifica tu dominio en Resend (DNS records).
   - Cambia `EMAIL_FROM` a un correo de tu dominio (ej. `no-reply@tudominio.com`).

## Notas

- Si SMTP no esta configurado (o `EMAIL_PROVIDER=DISABLED`), no se envian correos (se registra warning en logs).
- Si frontend y backend usan dominios distintos, habilita `CORS_ORIGINS` y envia `withCredentials`.
- Para el link de verificacion, configura `EMAIL_VERIFY_URL` con `{token}`.
