# Guía corta para testers — APIs y portadas

## Es normal que sin credenciales veas menos cosas

CoverLens guarda tu catálogo **en el móvil** y funciona sin cuentas externas, pero **metadatos enriquecidos** (género, año, descripciones, muchas portadas) y **cabeceras** anchas en la ficha dependen de servicios de terceros.

Si **no configuras** IGDB, SteamGridDB, ScreenScraper, etc.:

- Puedes **añadir juegos** (escáner, título manual, import CSV/JSON).
- Algunas **portadas** pueden salir igualmente (p. ej. cadena GameplayStores → otras fuentes según Ajustes), pero **habrá más huecos** o fichas «parciales».
- **IGDB** es el que más completa la ficha de texto; sin él, «Actualizar ficha» y «Reintentar metadatos» harán menos.

**No es un fallo de la beta**: es el diseño (local-first + APIs opcionales).

---

## Dónde poner las claves en la app

1. Abre **Ajustes** (última pestaña).
2. Toca **«APIs de metadatos»** para desplegar el bloque.
3. Rellena solo lo que quieras usar (no hace falta todo).
4. Pulsa **«Guardar credenciales»** al final de ese bloque.

Las claves se guardan en el dispositivo (almacenamiento seguro), no en nuestros servidores.

---

## Qué configurar primero (recomendado)

### 1. IGDB (gratis, lo más útil para datos de juego)

IGDB usa la **consola de desarrollador de Twitch** (misma cuenta que Twitch).

1. Entra en **https://dev.twitch.tv/console** e inicia sesión.
2. **Registrar tu aplicación** (nombre cualquiera, OAuth redirect puede ser `http://localhost` si te lo pide).
3. Copia **Client ID** y genera un **Client Secret**.
4. En CoverLens → Ajustes → APIs → **IGDB**: pega ambos y guarda.

Con esto mejoran búsquedas de metadatos, portada por URL de IGDB y la **cabecera** ancha en la ficha cuando haya datos.

### 2. SteamGridDB (gratis, buenas rejillas / portadas)

1. Crea cuenta en **https://www.steamgriddb.com**
2. En tu perfil, sección de **API** / preferencias, genera una **API Key**.
3. Pégala en CoverLens → **SteamGridDB** → Guardar.

Ayuda cuando la cadena de portadas elige SteamGridDB (orden configurable en **«Orden de fuentes (portadas)»** en Ajustes).

### 3. ScreenScraper (opcional, último recurso)

1. Registro en **https://www.screenscraper.fr**
2. Usuario y contraseña en CoverLens. Si el foro te da **Dev ID / Dev password**, puedes añadirlos (mejor cuota en algunos casos).

---

## Opcional: precios (no afectan al catálogo básico)

- **PriceCharting**: requiere suscripción **Pro** y token de API — solo para estimaciones de valor en la ficha.
- **eBay Developers**: app gratuita con Client ID + Secret — mediana de anuncios activos (orientativo).

Enlaces de referencia:

- Twitch / IGDB: https://dev.twitch.tv/console  
- SteamGridDB: https://www.steamgriddb.com  
- ScreenScraper: https://www.screenscraper.fr  
- PriceCharting Pro / API: https://www.pricecharting.com/pricecharting-pro?f=api  
- eBay Developers: https://developer.ebay.com  

---

## Si algo «no encuentra» juego o portada

- Revisa **título y plataforma** (y código de barras si aplica).
- En **Ajustes** → **Ejecutar diagnóstico** o **Probar portadas** para ver si las APIs responden con tus credenciales.
- Las APIs tienen **límites** y a veces fallan por red; prueba otra red o más tarde.

---

## Resumen para testers

| Situación                         | Qué esperar                                      |
|----------------------------------|--------------------------------------------------|
| Sin ninguna API                  | Catálogo OK; menos metadatos y más portadas vacías |
| Solo IGDB                        | Fichas de texto mucho mejores + portada/cabecera IGDB cuando existan |
| IGDB + SteamGridDB (+ opcional SS) | Mejor cobertura de portadas en el grid            |

Cualquier duda sobre la beta, anótala con **pasos para reproducir** y modelo de móvil; eso ayuda mucho.
