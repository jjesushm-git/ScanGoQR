# ScanGoQR V.1.0.5 — GitHub Pages

## Cambios de esta versión

- Se eliminó completamente QRFileG0.
- Se retiraron el botón, el modal, la carga de archivos y la conexión con Cloudflare.
- Ya no se incluyen `config.js`, `file.css` ni la carpeta `cloudflare-worker`.
- Se conservan la generación de QR para texto y URL, TransferNow, Mis QR y las descargas JPEG/PDF.
- Los QR guardados localmente siguen durando 24 horas, excepto los marcados como **Conservar**.

## Publicar en GitHub Pages

Sube al nivel principal de tu repositorio:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `sw.js`
- La carpeta `icons`
- La carpeta `vendor`

Después abre **Settings → Pages → Deploy from a branch → main → /(root) → Save**.

## Crear un QR para un archivo mediante TransferNow

1. Abre **Generar QR**.
2. Toca **TransferNow** para abrir `https://www.transfernow.net/es`.
3. Sube el archivo y copia el enlace que genere TransferNow.
4. Regresa a ScanGoQR, toca **URL**, pega el enlace y genera el QR.

TransferNow es un servicio externo. La duración, privacidad y disponibilidad del archivo dependen de sus condiciones.

## Funciones incluidas

- QR para texto.
- QR para URL con validación del enlace.
- Vista previa antes de guardar.
- Descarga en JPEG.
- Descarga en PDF con enlace clickable cuando el QR contiene una URL.
- Mis QR con vista ampliada al tocar el código.
- Eliminación automática local después de 24 horas.
- Opción **Conservar** para evitar la eliminación automática.
- Eliminación manual.
- Instalación como PWA en Android.
