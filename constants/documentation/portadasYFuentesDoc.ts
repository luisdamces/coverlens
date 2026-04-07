/**
 * Documentación de portadas y fuentes (mantenimiento).
 * Pantalla: app/documentacion-fuentes.tsx
 * Copia en Markdown: docs/PORTADAS_Y_FUENTES.md (mantener alineados si cambia la lógica).
 */

export type PortadasDocSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export const PORTADAS_DOC_TITLE = 'Portadas y fuentes de datos';

export const PORTADAS_DOC_FOOTNOTE =
  'Copia para lectura en IDE o Git: docs/PORTADAS_Y_FUENTES.md. Código: services/coverPreferenceResolver.ts, services/providers/gameplayStoresCoverProvider.ts, services/metadataResolver.ts.';

export const PORTADAS_Y_FUENTES_SECTIONS: PortadasDocSection[] = [
  {
    heading: 'Qué resuelve esta app',
    paragraphs: [
      'CoverLens combina varias fuentes externas. No hay un único proveedor oficial de “carátula por título”: cada uno tiene huecos (juegos viejos, regiones, ediciones). Por eso encadenamos varios pasos y preferimos cajas que coincidan con plataforma cuando es posible.',
    ],
  },
  {
    heading: 'Orden al elegir la URL de portada',
    paragraphs: [
      'La función resolvePreferredCoverUrl (services/coverPreferenceResolver.ts) prueba en este orden:',
    ],
    bullets: [
      'GameplayStores — solo si el juego tiene plataforma conocida y está mapeada a una categoría «Juegos …» de la tienda. Un GET JSON al buscador de PrestaShop con filtro id_category; elegimos el producto cuyo nombre (Título - PS2, etc.) encaja con el título y la plataforma. Suele acertar en stock PAL/espanol.',
      'SteamGridDB — grids en tamaño moderado para ahorrar datos; buena cobertura pero a veces mezcla regiones o ediciones.',
      'IGDB — URL de portada que ya venga del resultado de metadatos (si existe).',
      'ScreenScraper — búsqueda por título/plataforma como último recurso; depende de credenciales y límites de la API.',
    ],
  },
  {
    heading: 'GameplayStores: por qué y cómo (sin API pública)',
    paragraphs: [
      'GameplayStores (gameplaystores.es) no publica una API documentada para nosotros. Reutilizamos el mismo mecanismo que el escáner de código de barras: peticiones al buscador con Accept: application/json.',
      'Para EAN: busqueda?s=<codigo> devuelve products[] con name tipo «Stellar Blade - PS5».',
      'Para portada por título: busqueda?controller=search&s=<texto>&id_category=<id> acota a la categoría de juegos de esa plataforma (p. ej. Juegos PS2 → 1246). Así la primera página de resultados contiene candidatos de la plataforma correcta; el código filtra por similitud de título y por el sufijo de plataforma parseado con la misma lógica que el barcode (parseGamePlayStoresName en services/utils/barcodeToTitle.ts).',
      'La URL de la tienda con mot_q / mot_s en el navegador es el buscador Motive en la web; para la app usamos el flujo anterior porque es estable con JSON y categoría.',
      'Buenas prácticas: cada resolución de portada puede implicar al menos un GET a la tienda; en lotes grandes (Descargar portadas en lote) conviene no saturar: ya hay timeouts; si hiciera falta, aumentar pausas entre ítems.',
    ],
  },
  {
    heading: 'Metadatos (título, ficha, estados)',
    paragraphs: [
      'resolveMetadata (services/metadataResolver.ts) combina IGDB, barcode→GameplayStores, ScreenScraper y fallback de portada:',
    ],
    bullets: [
      'Con barcode y sin título: primero IGDB por EAN; si falla, barcodeToTitle en GameplayStores (y opcionalmente GameUPC) para rellenar título y plataforma.',
      'Luego IGDB por título; si falla, ScreenScraper.',
      'Si IGDB/ScreenScraper no devuelven ficha completa pero sí hay título (p. ej. solo desde GPS), puede guardarse estado partial y source cover_fallback cuando resolvePreferredCoverUrl sí obtiene imagen.',
    ],
  },
  {
    heading: 'Estado resolved / partial en el catálogo',
    paragraphs: [
      'No depende solo del proveedor (IGDB podía marcar partial si el título coincidía con el hint). Ahora deriveMetadataStatusFromGameFields (services/utils/metadataCompleteness.ts) unifica la regla: resolved = URL de portada http(s) + título válido + plataforma conocida + al menos uno entre año, género, desarrollador, publisher o descripción (>24 caracteres). No exige barcode ni precio. Importaciones Playnite/CSV/JSON recalculan el estado; un juego con nombre y plataforma pero sin imagen o sin dato de ficha queda partial hasta completar.',
    ],
  },
  {
    heading: 'Dónde se usa en la UI',
    paragraphs: [
      'En la ficha: «Completar metadatos» (IGDB/ScreenScraper + cadena de portadas) y «Actualizar portada» solo vuelve a ejecutar la cadena GameplayStores → SteamGrid → IGDB → ScreenScraper sin tocar el resto de campos. La etiqueta «Portada · …» se infiere del host de la URL (sin columna extra en BD). Reintentar metadatos en lote (Ajustes) y descarga de portadas en lote recalculan el estado con la misma regla.',
    ],
  },
  {
    heading: 'Archivos útiles para mantenimiento',
    paragraphs: [],
    bullets: [
      'services/coverPreferenceResolver.ts — orden de portadas.',
      'services/providers/gameplayStoresCoverProvider.ts — mapa plataforma → id_category y matching.',
      'services/utils/barcodeToTitle.ts — parseo de nombres GPS y búsqueda por EAN.',
      'services/metadataResolver.ts — flujo completo de metadatos.',
      'services/providers/steamGridDbProvider.ts — SteamGridDB.',
      'services/providers/screenScraperProvider.ts — ScreenScraper.',
    ],
  },
];
