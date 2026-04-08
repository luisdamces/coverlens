/**
 * En el grid se muestra primero la URL remota de carátula (misma proporción que la ficha).
 * La miniatura en disco era `t_thumb` IGDB u otros recortes → priorizar `coverUrl` http(s) o file local de carátula.
 */
export function pickGridCoverDisplayUri(
  coverUrl: string | null | undefined,
  coverLocalThumbUri: string | null | undefined
): string | null {
  const r = coverUrl?.trim() ?? '';
  if (/^https?:\/\//i.test(r) || r.startsWith('file://')) return r;
  const l = coverLocalThumbUri?.trim() ?? '';
  if (l.length > 0) return l;
  return r.length > 0 ? r : null;
}

/**
 * URL usada para descargar la miniatura en disco (listado del catálogo).
 * IGDB: usar **t_cover_small** (misma proporción que la carátula), no t_thumb (suele enmarcar mal y en el grid parece «zoom»).
 * SteamGridDB suele venir ya en tamaño pedido a la API (p. ej. 467×600).
 */
export function remoteToThumbnailUrl(remote: string): string {
  const u = remote.trim();
  if (u.includes('/t_cover_big/')) return u.replace('/t_cover_big/', '/t_cover_small/');
  if (u.includes('/t_original/')) return u.replace('/t_original/', '/t_cover_small/');
  if (u.includes('/t_thumb/') && u.includes('images.igdb.com')) {
    return u.replace('/t_thumb/', '/t_cover_small/');
  }
  if (u.includes('/t_screenshot_med/')) return u.replace('/t_screenshot_med/', '/t_thumb/');
  if (u.includes('/t_screenshot_big/')) return u.replace('/t_screenshot_big/', '/t_thumb/');
  if (u.includes('/t_logo_med/')) return u.replace('/t_logo_med/', '/t_thumb/');
  // GameplayStores: thickbox es muy pesado; large_default basta para miniatura nítida en grid
  if (u.includes('-thickbox_default/')) return u.replace('-thickbox_default/', '-large_default/');
  return u;
}
