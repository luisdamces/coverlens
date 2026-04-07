# Privacy Notes for Store Submission

## Datos que maneja la app
- Datos de catálogo local (juegos guardados por el usuario)
- Credenciales API (guardadas localmente en `expo-secure-store`)
- Uso de cámara para escaneo (barcode/OCR)

## Datos que NO se envían a servidor propio
- La app no usa backend propio ni crea cuentas.
- No hay tracking publicitario.

## Servicios externos bajo acción del usuario
- IGDB (consulta metadatos)
- ScreenScraper (fallback)
- SteamGridDB (carátulas)

## Declaración recomendada en tiendas
- Data linked to user: No (salvo políticas propias de servicios de terceros al consultar APIs).
- Tracking: No.
- Data collection by app owner: mínima o nula (local-first).

## Permisos
- Cámara: necesaria para escanear códigos de barras.
- Fotos: necesaria si se seleccionan imágenes para OCR.
