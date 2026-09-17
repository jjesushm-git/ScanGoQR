# ScanGoQR V.1.0.3 — GitHub Pages + Cloudflare R2, D1 y enlaces cortos

## Cambios de la versión 1.0.3

- Al tocar la miniatura de un QR en **Mis QR**, se abre ampliado.
- Las tarjetas de **Mis QR** se ajustan completamente a pantallas de celular.
- Las direcciones largas ya no cortan ni ensanchan las tarjetas.
- Los botones se distribuyen en dos columnas y quedan completamente visibles.
- El botón físico **Atrás** de Android regresa a la pantalla anterior; si el QR ampliado está abierto, primero lo cierra.

El paquete contiene:

- La PWA que se publica en GitHub Pages.
- `cloudflare-worker/`, que recibe los archivos, los guarda en R2 y controla las 24 horas mediante D1.

## 1. Crear los recursos gratuitos en Cloudflare

Instala Node.js en la computadora. Abre una terminal dentro de `cloudflare-worker` y ejecuta:

```bash
npm install
npx wrangler login
npx wrangler r2 bucket create scangoqr-files
npx wrangler d1 create scangoqr-db
```

El último comando mostrará un `database_id`. Abre `cloudflare-worker/wrangler.toml` y reemplaza `PEGA_AQUI_EL_ID_DE_D1` por ese valor.

En el mismo archivo reemplaza:

```toml
ALLOWED_ORIGIN = "https://TU-USUARIO.github.io"
```

por el origen de tu GitHub Pages, por ejemplo:

```toml
ALLOWED_ORIGIN = "https://jjesushm-git.github.io"
```

No agregues el nombre del repositorio ni una diagonal final.

## 2. Crear la tabla y publicar el Worker

Desde `cloudflare-worker` ejecuta:

```bash
npm run db:remote
npm run deploy
```

Cloudflare mostrará una dirección parecida a:

```text
https://scangoqr-cloud.tu-subdominio.workers.dev
```

## 3. Conectar la app

Abre `config.js` y reemplaza:

```js
window.SCANGOQR_API_URL = 'PEGA_AQUI_LA_URL_DEL_WORKER';
```

por la URL real del Worker, sin diagonal final.

## 4. Publicar en GitHub Pages

Sube a tu repositorio estos elementos de la carpeta principal:

- `index.html`
- `styles.css`
- `file.css`
- `app.js`
- `config.js`
- `manifest.webmanifest`
- `sw.js`
- carpetas `icons` y `vendor`

La carpeta `cloudflare-worker` puede permanecer en el repositorio, pero no es utilizada directamente por GitHub Pages.

Después abre **Settings → Pages → Deploy from a branch → main → /(root) → Save**.

## Funcionamiento

- El botón **Enlace corto** convierte una URL larga en `https://scangoqr-cloud.tu-subdominio.workers.dev/nombre`.
- El nombre personalizado admite de 3 a 32 letras minúsculas, números, guion y guion bajo.
- Si el nombre ya existe, la app solicita elegir otro.
- El enlace resultante puede copiarse, abrirse o convertirse inmediatamente en código QR.
- La migración `0002_short_links.sql` crea la tabla necesaria al ejecutar `npm run db:remote`.
- Máximo: 50 MB por archivo.
- Se bloquean ejecutables potencialmente peligrosos.
- Los enlaces usan identificadores aleatorios.
- El token para conservar o eliminar sólo se guarda en el navegador del creador.
- Sin “Conservar”, QR y archivo vencen después de 24 horas.
- El proceso automático de Cloudflare limpia archivos vencidos cada hora.
- Al desmarcar “Conservar” comienza un nuevo periodo de 24 horas.
- Borrar los datos del navegador elimina el token de administración; el archivo no conservado aun se borrará automáticamente.
