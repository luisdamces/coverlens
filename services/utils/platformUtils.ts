/**
 * Nombres canónicos de plataformas.
 *
 * Todas las fuentes de datos (IGDB, GamePlayStores, entrada manual) deben
 * pasar sus nombres de plataforma por `canonicalizePlatform` para garantizar
 * consistencia en la base de datos.
 *
 * Orden importante: de más específico a menos específico para evitar falsos positivos.
 */

const PLATFORM_CANONICAL: Array<{ patterns: string[]; canonical: string }> = [
  // PlayStation (más específico primero)
  { patterns: ['playstation 5', 'ps5'], canonical: 'PlayStation 5' },
  { patterns: ['playstation 4', 'ps4'], canonical: 'PlayStation 4' },
  { patterns: ['playstation 3', 'ps3'], canonical: 'PlayStation 3' },
  { patterns: ['playstation 2', 'ps2'], canonical: 'PlayStation 2' },
  { patterns: ['playstation portable', 'psp'], canonical: 'PSP' },
  { patterns: ['playstation vita', 'ps vita', 'vita'], canonical: 'PS Vita' },
  { patterns: ['playstation', 'psx', 'ps one', 'ps1'], canonical: 'PlayStation' },
  // Nintendo Switch (2 antes que 1)
  { patterns: ['nintendo switch 2', 'switch 2'], canonical: 'Nintendo Switch 2' },
  { patterns: ['nintendo switch', 'switch'], canonical: 'Nintendo Switch' },
  // Wii U antes que Wii
  { patterns: ['wii u', 'wiiu', 'nintendo wiiu', 'nintendo wii u'], canonical: 'Wii U' },
  { patterns: ['wii', 'nintendo wii'], canonical: 'Wii' },
  // 3DS / DS (3DS primero)
  { patterns: ['nintendo 3ds', '3ds', 'new 3ds', '2ds', 'new nintendo 3ds'], canonical: 'Nintendo 3DS' },
  { patterns: ['nintendo ds', 'nds'], canonical: 'Nintendo DS' },
  // Game Boy (Advance > Color > plain)
  { patterns: ['game boy advance', 'gameboy advance', 'gba'], canonical: 'Game Boy Advance' },
  { patterns: ['game boy color', 'gameboy color', 'gbc'], canonical: 'Game Boy Color' },
  { patterns: ['game boy', 'gameboy'], canonical: 'Game Boy' },
  // GameCube
  { patterns: ['nintendo gamecube', 'gamecube', 'game cube', 'ngc'], canonical: 'GameCube' },
  // Otras Nintendo
  { patterns: ['nintendo 64', 'n64'], canonical: 'Nintendo 64' },
  { patterns: ['super nintendo entertainment system', 'super nintendo', 'super nes', 'snes'], canonical: 'Super Nintendo' },
  { patterns: ['nintendo entertainment system', 'nes', 'famicom'], canonical: 'NES' },
  // Xbox (Series X antes que One, One antes que 360, 360 antes que plain)
  { patterns: ['xbox series x|s', 'xbox series x', 'xbox series s', 'xbox series'], canonical: 'Xbox Series X' },
  { patterns: ['xbox one'], canonical: 'Xbox One' },
  { patterns: ['xbox 360', 'x360'], canonical: 'Xbox 360' },
  { patterns: ['xbox'], canonical: 'Xbox' },
  // Sega
  { patterns: ['sega dreamcast', 'dreamcast'], canonical: 'Dreamcast' },
  { patterns: ['sega saturn', 'saturn'], canonical: 'Saturn' },
  { patterns: ['sega mega drive', 'sega genesis', 'mega drive', 'megadrive', 'genesis'], canonical: 'Mega Drive' },
  { patterns: ['sega game gear', 'game gear'], canonical: 'Game Gear' },
  { patterns: ['sega master system', 'master system'], canonical: 'Master System' },
  // PC (Playnite suele usar «PC (Windows)»)
  { patterns: ['pc (windows)', 'pc (microsoft windows)', 'microsoft windows'], canonical: 'PC' },
  { patterns: ['windows'], canonical: 'PC' },
];

/**
 * Convierte cualquier nombre de plataforma a su nombre canónico.
 * "Nintendo GameCube" → "GameCube"
 * "PlayStation 4" → "PlayStation 4"  (ya canónico)
 * "GC" no llega aquí (se resuelve en PLATFORM_SUFFIX_MAP de barcodeToTitle)
 */
export function canonicalizePlatform(name: string): string {
  if (!name) return name;
  const lower = name.toLowerCase().trim();
  for (const { patterns, canonical } of PLATFORM_CANONICAL) {
    if (patterns.some((p) => lower === p || lower.includes(p))) {
      return canonical;
    }
  }
  return name;
}
