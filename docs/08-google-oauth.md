# Entrar con Google

El código ya está escrito desde el esqueleto: `signInWithGoogle()` en
`apps/web/src/lib/auth/AuthProvider.tsx` y el botón de `routes/SignIn.tsx`. Lo que falta siempre es
configuración, y está repartida en tres lugares que tienen que coincidir.

## Por dónde pasa el pedido

Google nunca le habla a la app. Le habla a Supabase, y Supabase le habla a la app:

```
localhost:5173  →  Supabase /auth/v1/authorize  →  Google  →  Supabase /auth/v1/callback  →  localhost:5173
```

De ahí sale la trampa principal: **el URI de redirección que se carga en Google es el de Supabase,
no el de la app.** Poner `http://localhost:5173` ahí es el error más común y da
`redirect_uri_mismatch`.

## 1. Crear el cliente OAuth en Google Cloud Console

Esto es tuyo: la consola pide aceptar términos y genera un secreto, dos cosas que no hago yo.

1. <https://console.cloud.google.com> → crear un proyecto (o elegir uno). Nombre sugerido:
   `Blue Horse Gym`.
2. **APIs y servicios → Pantalla de consentimiento de OAuth**:
   - Tipo de usuario: **Externo**.
   - Nombre de la app: `Blue Horse`. Correo de asistencia y de contacto: el tuyo.
   - Alcances: no agregues ninguno. Los tres que Supabase pide (`openid`, `email`, `profile`) son
     los que Google da por defecto y no requieren verificación.
   - Mientras esté en **Prueba**, solo entran los correos que cargues como usuarios de prueba.
     Agregá ahí tu cuenta y las de quien vaya a probar. Publicarla es el último paso, cuando la app
     esté en producción.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: `Blue Horse PWA`.
   - **Orígenes autorizados de JavaScript**: no hacen falta para este flujo (la app no usa Google
     Identity Services en el navegador). Dejalos vacíos.
   - **URI de redirección autorizados** — acá van los de Supabase, uno por entorno:

     | Entorno | URI |
     |---|---|
     | Local | `http://127.0.0.1:54321/auth/v1/callback` |
     | Nube | `https://<ref-del-proyecto>.supabase.co/auth/v1/callback` |

     Google acepta `http://` solo para `localhost` y `127.0.0.1`; para el resto exige HTTPS.
     Cargá los dos ahora aunque todavía no exista el proyecto en la nube: agregarlos después
     obliga a esperar a que Google propague el cambio.
4. Copiá el **ID de cliente** y el **secreto**.

## 2. Pegar las credenciales en `.env`

En la raíz del monorepo, el mismo `.env` que ya tiene `VITE_SUPABASE_URL`:

```
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=GOCSPX-...
```

`supabase/config.toml` los lee con `env(...)` — el secreto no queda escrito en un archivo
versionado.

Después de cambiarlos:

```bash
npm run db:stop && npm run db:start
```

**No alcanza con reiniciar la app ni con `db:reset`.** GoTrue lee la configuración del provider al
arrancar el contenedor.

## 3. Lo que ya quedó configurado en el repo

En `supabase/config.toml`:

- `[auth.external.google]` con `enabled = true` y las dos variables de arriba.
- `skip_nonce_check = true`. Sin esto, entrar con Google contra el Supabase local falla siempre: el
  GoTrue local no puede validar el nonce del id_token sin un dominio real. **Solo aplica al local**
  — el proyecto de la nube se configura desde su panel y esta línea no lo toca.
- `site_url = "http://localhost:5173"` y `additional_redirect_urls` con `localhost` y `127.0.0.1`
  en el puerto 5173. Antes apuntaban a `:3000`, que es el default de la CLI y no es donde sirve
  Vite. Para el allow-list de Auth, `localhost` y `127.0.0.1` **no son el mismo origen**: el
  callback vuelve exactamente al origen desde el que salió, así que están los dos.

## 4. En la nube

El proyecto de Blue Horse todavía no existe en Supabase Cloud. Cuando exista:

1. Panel → **Authentication → Sign In / Providers → Google**: activar y pegar el mismo client ID y
   secreto. `config.toml` no se aplica a la nube salvo que corras `supabase config push`.
2. Panel → **Authentication → URL Configuration**: `Site URL` al dominio de producción, y el mismo
   dominio en `Redirect URLs`.
3. Agregar el callback de ese proyecto a los URIs de redirección de Google (paso 1.3).

## Errores y qué significan

| Lo que se ve | Causa |
|---|---|
| `redirect_uri_mismatch` | En Google cargaste la URL de la app en vez de la de Supabase, o falta el puerto exacto |
| `Unsupported provider: provider is not enabled` | El contenedor de Auth arrancó sin las variables: faltan en `.env`, o no reiniciaste con `db:stop`/`db:start` |
| Vuelve a `/auth` sin sesión y sin error | El origen del callback no está en `additional_redirect_urls` |
| `Error 403: access_denied` | La pantalla de consentimiento está en Prueba y ese correo no es usuario de prueba |
| Entra pero el nonce falla | `skip_nonce_check` quedó en `false` en local |
