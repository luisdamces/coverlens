import { probeScreenScraperCover } from './providers/screenScraperProvider';
import { probeSteamGridCover } from './providers/steamGridDbProvider';

const DEMO_TITLE = 'Gears of War';
const DEMO_PLATFORM = 'Xbox 360';

/**
 * Líneas de log para Ajustes: llama a SteamGridDB y ScreenScraper con las credenciales **guardadas en el dispositivo**.
 * No sustituye a tests automatizados en CI (sin API keys).
 */
export async function runCoverSourcesProbeLogLines(): Promise<string[]> {
  const lines: string[] = [];
  lines.push(`── Prueba de portadas: «${DEMO_TITLE}» + ${DEMO_PLATFORM} ──`);
  lines.push('Usa las API keys guardadas (no se envían a ningún servidor ajeno a esas APIs).');

  const sg = await probeSteamGridCover(DEMO_TITLE);
  lines.push(
    sg.coverUrl
      ? `SteamGridDB: OK tras [${sg.attempts.join(' → ')}]`
      : `SteamGridDB: sin imagen (intentos: ${sg.attempts.join(' → ') || '—'})`
  );
  if (sg.coverUrl) {
    lines.push(`  URL (recortada): ${sg.coverUrl.slice(0, 88)}${sg.coverUrl.length > 88 ? '…' : ''}`);
  }

  const ss = await probeScreenScraperCover(DEMO_TITLE, DEMO_PLATFORM);
  lines.push(
    `ScreenScraper: ${ss.candidates} resultado(s) de búsqueda; plataforma elegida «${ss.pickedPlatform || '—'}»`
  );
  lines.push(`  título elegido: «${ss.pickedTitle || '—'}»`);
  if (ss.coverUrl) {
    const u = ss.coverUrl;
    lines.push(`  URL (recortada): ${u.length > 88 ? `${u.slice(0, 88)}…` : u}`);
  } else {
    lines.push('  sin URL de carátula (revisa login / Dev ID en ScreenScraper)');
  }

  lines.push('Catálogo: portada → SteamGridDB, luego IGDB, luego ScreenScraper.');
  return lines;
}
