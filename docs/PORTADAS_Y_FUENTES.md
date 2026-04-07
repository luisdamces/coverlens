# Portadas y fuentes de datos (CoverLens)

> Mantener alineado con `constants/documentation/portadasYFuentesDoc.ts` (la pantalla **Ajustes → Documentación: portadas y fuentes** lee ese módulo).

## Qué resuelve esta app

CoverLens combina varias fuentes externas. No hay un único proveedor oficial de «carátula por título»: cada uno tiene huecos (juegos viejos, regiones, ediciones). Por eso encadenamos varios pasos y preferimos cajas que coincidan con plataforma cuando es posible.

## Orden al elegir la URL de portada

La función `resolvePreferredCoverUrl` (`services/coverPreferenceResolver.ts`) prueba en este orden:

1. **GameplayStores** — solo si el juego tiene plataforma conocida y está mapeada a una categoría «Juegos …» de la tienda. Un GET JSON al buscador de PrestaShop con filtro `id_category`; elegimos el producto cuyo nombre (`Título - PS2`, etc.) encaja con el título y la plataforma. Suele acertar en stock PAL/español.

2. **SteamGridDB** — grids en tamaño moderado para ahorrar datos; buena cobertura pero a veces mezcla regiones o ediciones.

3. **IGDB** — URL de portada que ya venga del resultado de metadatos (si existe).

4. **ScreenScraper** — búsqueda por título/plataforma como último recurso; depende de credenciales y límites de la API.

## GameplayStores: por qué y cómo (sin API pública)

GameplayStores ([gameplaystores.es](https://www.gameplaystores.es/)) no publica una API documentada para la app. Reutilizamos el mismo mecanismo que el escáner de código de barras: peticiones al buscador con `Accept: application/json`.

- **EAN:** `busqueda?s=<codigo>` devuelve `products[]` con `name` tipo `Stellar Blade - PS5`.

- **Portada por título:** `busqueda?controller=search&s=<texto>&id_category=<id>` acota a la categoría de juegos de esa plataforma (p. ej. Juegos PS2 → `1246`). Así la primera página de resultados contiene candidatos de la plataforma correcta; el código filtra por similitud de título y por el sufijo de plataforma parseado con la misma lógica que el barcode (`parseGamePlayStoresName` en `services/utils/barcodeToTitle.ts`).

- La URL de la tienda con `mot_q` / `mot_s` en el navegador es el buscador Motive en la web; para la app se usa el flujo anterior porque es estable con JSON y categoría.

**Buenas prácticas:** cada resolución de portada puede implicar al menos un GET a la tienda; en lotes grandes («Descargar portadas en lote») conviene no saturar: ya hay timeouts; si hiciera falta, aumentar pausas entre ítems.

## Metadatos (título, ficha, estados)

`resolveMetadata` (`services/metadataResolver.ts`) combina IGDB, barcode→GameplayStores, ScreenScraper y fallback de portada:

- Con barcode y sin título: primero IGDB por EAN; si falla, `barcodeToTitle` en GameplayStores (y opcionalmente GameUPC) para rellenar título y plataforma.

- Luego IGDB por título; si falla, ScreenScraper.

- Si IGDB/ScreenScraper no devuelven ficha completa pero sí hay título (p. ej. solo desde GPS), puede guardarse `source` `cover_fallback` cuando la cadena de portadas obtiene imagen; el estado final pasa por `finalizeMetadataResult`.

## Estado resolved / partial

`deriveMetadataStatusFromGameFields` (`services/utils/metadataCompleteness.ts`) define la regla única en catálogo:

- **resolved:** portada con URL `http(s)` + título válido + plataforma conocida + al menos uno entre: año, género, desarrollador, publisher o descripción (>24 caracteres). No exige barcode ni precio.
- **partial:** falta portada, plataforma/título inválidos o ningún dato de ficha extra.

Las importaciones (Playnite JSON/CSV, export CoverLens) recalculan el estado; un juego solo con nombre y plataforma queda `partial` hasta tener imagen y un dato de ficha.

## Dónde se usa en la UI

- Ficha: **Completar metadatos** (`resolveMetadata`) y **Actualizar portada** (solo `resolvePreferredCoverWithSource` con `igdb` en null, misma prioridad: GameplayStores primero si aplica). La línea «Portada · …» infiere el origen por el host de la URL (`services/utils/coverUrlSource.ts`).
- Ajustes: reintento en lote y descarga de portadas en lote recalculan `metadataStatus` con la misma regla.

Credenciales: IGDB, SteamGridDB y ScreenScraper en Ajustes (`credentialsStore`). GameplayStores no requiere API key.

## Archivos útiles para mantenimiento

| Área | Archivo |
|------|---------|
| Regla resolved/partial | `services/utils/metadataCompleteness.ts` |
| Etiqueta «Portada ·» | `services/utils/coverUrlSource.ts` |
| Orden de portadas | `services/coverPreferenceResolver.ts` |
| GameplayStores (categorías + matching) | `services/providers/gameplayStoresCoverProvider.ts` |
| Barcode / parseo nombres GPS | `services/utils/barcodeToTitle.ts` |
| Flujo metadatos | `services/metadataResolver.ts` |
| SteamGridDB | `services/providers/steamGridDbProvider.ts` |
| ScreenScraper | `services/providers/screenScraperProvider.ts` |
| Texto de esta doc en la app | `constants/documentation/portadasYFuentesDoc.ts` |
| Pantalla in-app | `app/documentacion-fuentes.tsx` |
